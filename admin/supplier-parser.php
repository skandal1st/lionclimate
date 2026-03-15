<?php
/**
 * Парсер страниц поставщиков для импорта товаров и синхронизации цен.
 * Поддерживается: proclimate5.ru, klimatov.ru, market777.ru, luxograd.ru, buranrussia.ru, mircli.ru
 */

if (!function_exists('fetchSupplierPage')) {

function fetchSupplierPage($url) {
    $url = trim($url);
    if (!preg_match('#^https?://#i', $url)) {
        return ['error' => 'Некорректный URL'];
    }
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 15,
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'follow_location' => 1,
        ],
        'ssl' => ['verify_peer' => true]
    ]);
    $html = @file_get_contents($url, false, $ctx);
    if ($html === false || strlen($html) < 500) {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $html = curl_exec($ch);
            curl_close($ch);
        }
    }
    if (empty($html) || strlen($html) < 500) {
        return ['error' => 'Не удалось загрузить страницу. Проверьте URL и доступность сайта поставщика.'];
    }
    return ['html' => $html, 'url' => $url];
}

function detectSupplier($url) {
    $host = parse_url($url, PHP_URL_HOST);
    if (!$host) return null;
    $host = strtolower($host);
    if (strpos($host, 'proclimate5.ru') !== false) return 'proclimate5';
    if (strpos($host, 'klimatov.ru') !== false) return 'klimatov';
    if (strpos($host, 'market777.ru') !== false) return 'market777';
    if (strpos($host, 'luxograd.ru') !== false) return 'luxograd';
    if (strpos($host, 'buranrussia.ru') !== false) return 'buranrussia';
    if (strpos($host, 'mircli.ru') !== false) return 'mircli';
    return null;
}

/**
 * Извлечь цену: "43 990 руб.", "36 000 ₽", "37 300.00 ₽"
 */
function parsePriceFromHtml($html) {
    $patterns = [
        '/(\d[\d\s]*)\s*руб\.?/u',
        '/(\d[\d\s]*[,.]?\d*)\s*₽/u',
        '/(\d[\d\s]+)\s*руб/u',
    ];
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $html, $m)) {
            $price = preg_replace('/[\s]/', '', $m[1]);
            $price = str_replace(',', '.', $price);
            $price = (int) round((float) $price);
            if ($price > 0) return $price;
        }
    }
    return null;
}

/**
 * Извлечь заголовок из первого h1
 */
function parseTitleFromHtml($html) {
    if (preg_match('/<h1[^>]*>([^<]+)<\/h1>/isu', $html, $m)) {
        return trim(html_entity_decode(strip_tags($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
    if (preg_match('/<title[^>]*>([^<]+)<\/title>/isu', $html, $m)) {
        $t = trim(html_entity_decode(strip_tags($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        $t = preg_replace('/\s*[-|]\s*купить.*$/iu', '', $t);
        return trim($t);
    }
    return '';
}

/**
 * Извлечь главное изображение товара (og:image или первое большое изображение в блоке товара)
 */
function parseImageFromHtml($html, $baseUrl) {
    if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        return trim($m[1]);
    }
    if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/i', $html, $m)) {
        return trim($m[1]);
    }
    if (preg_match('/<img[^>]+class="[^"]*product[^"]*"[^>]+src=["\']([^"\']+)["\']/i', $html, $m)) {
        $src = trim($m[1]);
        if (strpos($src, 'http') !== 0 && preg_match('#^(https?://[^/]+)#', $baseUrl, $base)) {
            $src = (strpos($src, '/') === 0) ? $base[1] . $src : $base[1] . '/' . $src;
        }
        return $src;
    }
    return '';
}

/**
 * Извлечь описание (универсально)
 */
function parseDescriptionFromHtml($html, $maxLen = 3000) {
    $html = preg_replace('/\s+/u', ' ', $html);
    if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        return mb_substr(trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8')), 0, $maxLen);
    }
    if (preg_match('/Описание<\/[^>]+>\s*<\/[^>]+>\s*([^<]+(?:<[^>]+>[^<]*)*?)(?=Оплата|Доставка|Монтаж|Техническая|Характеристики|$)/isu', $html, $m)) {
        $desc = trim(strip_tags($m[1]));
        $desc = preg_replace('/\s+/u', ' ', $desc);
        return mb_substr($desc, 0, $maxLen);
    }
    if (preg_match('/<div[^>]+class="[^"]*description[^"]*"[^>]*>([^<]+)/isu', $html, $m)) {
        return mb_substr(trim(strip_tags($m[1])), 0, $maxLen);
    }
    return '';
}

/**
 * Извлечь все пары "название характеристики" -> "значение" из таблиц и списков.
 */
function extractAllCharacteristicsFromHtml($html) {
    $pairs = [];
    $text = preg_replace('/<script[^>]*>.*?<\/script>/isu', '', $html);
    $text = preg_replace('/<style[^>]*>.*?<\/style>/isu', '', $text);
    $text = strip_tags(str_replace(['</td>', '</th>', '</dd>', '</dt>', '</li>', '</tr>'], "\n", $text));
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $lines = preg_split('/\n+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
    $lines = array_map('trim', $lines);
    for ($i = 0; $i < count($lines) - 1; $i++) {
        $label = $lines[$i];
        if (strlen($label) > 80 || preg_match('/^\d+$/', $label) || preg_match('/руб|₽|Оплата|Доставка|Монтаж|Каталог|Контакты/u', $label)) continue;
        $next = $lines[$i + 1];
        if (strlen($next) > 120) continue;
        if (preg_match('/^[\d\.,\s\-–—\+]+$|^[данет]\s*$|^[а-яёa-z\s\-–—\/]+$/ui', $next) || strlen($next) <= 50) {
            $pairs[$label] = $next;
            $i++;
        }
    }
    return $pairs;
}

/**
 * Сопоставить извлечённые пары с нашей схемой характеристик (по совпадению подстрок в названии).
 */
function mapToSchema($pairs) {
    require_once __DIR__ . '/config.php';
    $schema = getFixedCharacteristicsSchema();
    $result = [];
    $usedKeys = [];
    foreach ($schema as $item) {
        $label = $item['label'];
        $key = $item['key'];
        foreach ($pairs as $pageLabel => $value) {
            if (stripos($pageLabel, $label) !== false || stripos($label, $pageLabel) !== false) {
                if (!in_array($key, $usedKeys) && $value !== '' && $value !== '?') {
                    $result[] = ['name' => $item['label'], 'key' => $key, 'value' => $value];
                    $usedKeys[] = $key;
                }
                break;
            }
        }
    }
    foreach ($pairs as $pageLabel => $value) {
        if ($value === '' || $value === '?') continue;
        if (strlen($pageLabel) > 60) continue;
        $already = false;
        foreach ($result as $r) {
            if (stripos($pageLabel, $r['name']) !== false || stripos($r['name'], $pageLabel) !== false) {
                $already = true;
                break;
            }
        }
        if (!$already) {
            $result[] = ['name' => $pageLabel, 'key' => '', 'value' => $value];
        }
    }
    return $result;
}

function findCharInHtml($html, $label) {
    $text = preg_replace('/<script[^>]*>.*?<\/script>/isu', '', $html);
    $text = preg_replace('/<style[^>]*>.*?<\/style>/isu', '', $text);
    $text = strip_tags(str_replace(['</td>', '</th>', '</dd>', '</dt>', '</li>'], "\n", $text));
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $lines = preg_split('/\n+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
    $lines = array_map('trim', $lines);
    $label = trim($label);
    foreach ($lines as $i => $line) {
        if ($line === $label || strpos($line, $label) === 0) {
            for ($j = $i + 1; $j < count($lines); $j++) {
                $val = $lines[$j];
                if ($val === '?' || $val === '' || (preg_match('/^[\d\s]+$/', $val) && strlen($val) > 10)) continue;
                if (strlen($val) > 150 || preg_match('/^(Оплата|Доставка|Монтаж|Каталог|Контакты|При оформлении)/u', $val)) break;
                return $val;
            }
        }
    }
    $labelQ = preg_quote($label, '/');
    $flat = preg_replace('/\s+/u', ' ', $text);
    if (preg_match('/' . $labelQ . '\s*\?\s*([^\d\-][^\.]{1,80}?)(?=\s{2,}[А-ЯA-Z]|\d{4,}\s*руб|$)/u', $flat, $m)) {
        return trim($m[1]);
    }
    return '';
}

function extractBrandModelFromTitle($title) {
    $brand = '';
    $model = '';
    if (!$title) return [$brand, $model];
    $title = trim($title);
    if (preg_match('/\s([A-Za-z][A-Za-z0-9\-]+)\s+([A-Z0-9\-\.\/]+(?:\s*\/\s*[A-Z0-9\-\.\/]+)?)\s*$/u', $title, $m)) {
        $brand = trim($m[1]);
        $model = trim($m[2]);
        return [$brand, $model];
    }
    if (preg_match('/^([A-Za-z][A-Za-z0-9\-]*)\s+/u', $title, $m)) {
        $brand = trim($m[1]);
    }
    if (preg_match('/\b([A-Z][A-Z0-9\-]+(?:\/[A-Z0-9\-]+)*)\s*$/u', $title, $m)) {
        $model = trim($m[1]);
    }
    return [$brand, $model];
}

/**
 * ProClimate
 */
function parseProClimate($html, $url) {
    $title = parseTitleFromHtml($html);
    $price = parsePriceFromHtml($html);
    $description = parseDescriptionFromHtml($html);
    $image = parseImageFromHtml($html, $url);
    list($brand, $model) = extractBrandModelFromTitle($title);
    require_once __DIR__ . '/config.php';
    $schema = getFixedCharacteristicsSchema();
    $characteristics = [];
    foreach ($schema as $item) {
        $val = findCharInHtml($html, $item['label']);
        if ($val !== '') {
            $characteristics[] = ['name' => $item['label'], 'key' => $item['key'], 'value' => $val];
        }
    }
    if (empty($characteristics)) {
        $pairs = extractAllCharacteristicsFromHtml($html);
        $characteristics = mapToSchema($pairs);
    }
    return [
        'name' => $title ?: 'Товар с сайта поставщика',
        'brand' => $brand,
        'model' => $model,
        'price' => $price,
        'description' => $description,
        'characteristics' => $characteristics,
        'supplier_url' => $url,
        'supplier_name' => 'proclimate5',
        'image' => $image,
    ];
}

/**
 * Klimatov.ru — таблица характеристик, цена "28690 руб"
 */
function parseKlimatov($html, $url) {
    $title = parseTitleFromHtml($html);
    $price = parsePriceFromHtml($html);
    $description = parseDescriptionFromHtml($html);
    $image = parseImageFromHtml($html, $url);
    list($brand, $model) = extractBrandModelFromTitle($title);
    $pairs = extractAllCharacteristicsFromHtml($html);
    $characteristics = mapToSchema($pairs);
    return [
        'name' => $title ?: 'Товар с сайта поставщика',
        'brand' => $brand,
        'model' => $model,
        'price' => $price,
        'description' => $description,
        'characteristics' => $characteristics,
        'supplier_url' => $url,
        'supplier_name' => 'klimatov',
        'image' => $image,
    ];
}

/**
 * Извлечь фрагмент HTML с блоком характеристик Market777 (таблицы между "Общие параметры" и "Описание").
 */
function extractMarket777SpecsFragment($html) {
    $htmlNorm = preg_replace('/\s+/u', ' ', $html);
    $starts = [
        stripos($htmlNorm, 'Общие параметры'),
        stripos($htmlNorm, 'Основные характеристики'),
        stripos($htmlNorm, 'Тип кондиционера'),
        stripos($htmlNorm, 'Гарантийный срок'),
        stripos($htmlNorm, 'Характеристики Energolux'),
        stripos($htmlNorm, 'Артикул'),
    ];
    $start = false;
    foreach ($starts as $s) {
        if ($s !== false) {
            $start = $start === false ? $s : min($start, $s);
        }
    }
    if ($start === false) {
        return '';
    }
    $end = stripos($htmlNorm, 'Описание Energolux', $start);
    if ($end === false) {
        $end = stripos($htmlNorm, 'Купить недорого', $start);
    }
    if ($end === false) {
        $end = stripos($htmlNorm, 'Оплата', $start);
    }
    if ($end === false) {
        $end = stripos($htmlNorm, 'Отзывы', $start);
    }
    if ($end === false || $end <= $start) {
        return substr($htmlNorm, $start, 60000);
    }
    return substr($htmlNorm, $start, $end - $start);
}

/**
 * Извлечь пары "название" => "значение" из таблиц в HTML.
 * Поддерживаются: строки с двумя ячейками (label, value) и двухстрочные таблицы (строка заголовков + строка значений).
 */
function extractPairsFromHtmlTables($html) {
    $pairs = [];
    $html = preg_replace('/<script[^>]*>.*?<\/script>/isu', '', $html);
    $html = preg_replace('/<style[^>]*>.*?<\/style>/isu', '', $html);
    $html = str_replace(["\r", "\n"], ' ', $html);
    $html = preg_replace('/<\/tr>\s*/iu', "\n", $html);
    $html = preg_replace('/<\/t[dh]>\s*/iu', "\t", $html);
    $html = strip_tags($html);
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $lines = preg_split('/\n+/u', $html, -1, PREG_SPLIT_NO_EMPTY);
    $skipLabels = ['previous', 'next', 'отложенные', 'корзина', 'сравнение', 'цена', 'купить', 'в избранное', 'в сравнении', 'в корзине', 'вопрос', 'ваше имя', 'телефон', 'e-mail', 'обязательные поля', 'отправить', 'сбросить', 'y', 'n', '—', '?', '', 'все характеристики', 'рассчитать доставку', 'кешбек', 'авторизуйтесь', 'назад', 'автомобильная акустика'];

    $i = 0;
    while ($i < count($lines)) {
        $line = $lines[$i];
        $parts = array_map('trim', explode("\t", $line));
        $parts = array_values(array_filter($parts, function ($p) { return $p !== ''; }));

        if (count($parts) >= 2) {
                if (count($parts) === 2) {
                $label = trim($parts[0], " \t:");
                $value = $parts[1];
                if (strlen($label) <= 100 && strlen($value) <= 300) {
                    $labelNorm = mb_strtolower($label, 'UTF-8');
                    if (!in_array($labelNorm, $skipLabels, true)
                        && !preg_match('/^\s*[YN]\s*$/ui', $value)
                        && $value !== '—' && $value !== '?' && $value !== '*'
                    ) {
                        if (!isset($pairs[$label])) {
                            $pairs[$label] = $value;
                        }
                    }
                }
            } else {
                $nextLine = isset($lines[$i + 1]) ? $lines[$i + 1] : '';
                $nextParts = array_map('trim', explode("\t", $nextLine));
                $nextParts = array_values(array_filter($nextParts, function ($p) { return $p !== ''; }));
                if (count($nextParts) === count($parts)) {
                    for ($j = 0; $j < count($parts); $j++) {
                        $label = trim($parts[$j], " \t:");
                        $value = $nextParts[$j];
                        if ($label !== '' && $value !== '' && strlen($label) <= 100 && strlen($value) <= 300) {
                            $labelNorm = mb_strtolower($label, 'UTF-8');
                            if (!in_array($labelNorm, $skipLabels, true)
                                && !preg_match('/^\s*[YN]\s*$/ui', $value)
                                && $value !== '—' && $value !== '?'
                            ) {
                                if (!isset($pairs[$label])) {
                                    $pairs[$label] = $value;
                                }
                            }
                        }
                    }
                    $i++;
                }
            }
        }
        $i++;
    }
    return $pairs;
}

/**
 * Цена для Market777: основная цена товара (игнорировать допы типа "3600 руб. + 1 год гарантии").
 * Берём максимальную подходящую цену — допы обычно меньше основной.
 */
function parsePriceMarket777($html) {
    $candidates = [];
    if (preg_match_all('/(\d{1,2}\s?\d{3})\s*₽/u', $html, $m, PREG_OFFSET_CAPTURE)) {
        foreach ($m[1] as $idx => $item) {
            $raw = $item[0];
            $pos = $item[1];
            $price = (int) preg_replace('/\s/', '', $raw);
            if ($price < 10000 || $price > 999999) continue;
            $context = substr($html, max(0, $pos - 80), 160);
            if (preg_match('/руб\.?\s*\+\s*\d|гарантии|гарантия/u', $context)) continue;
            $candidates[] = $price;
        }
    }
    if (preg_match_all('/(\d{1,2}\s?\d{3})\s*руб/u', $html, $m, PREG_OFFSET_CAPTURE)) {
        foreach ($m[1] as $idx => $item) {
            $raw = $item[0];
            $pos = $item[1];
            $price = (int) preg_replace('/\s/', '', $raw);
            if ($price < 10000 || $price > 999999) continue;
            $context = substr($html, max(0, $pos - 80), 160);
            if (preg_match('/руб\.?\s*\+\s*\d|гарантии|гарантия/u', $context)) continue;
            $candidates[] = $price;
        }
    }
    if (!empty($candidates)) {
        return max($candidates);
    }
    return parsePriceFromHtml($html);
}

/**
 * Удалить из пар мусорные характеристики (навигация, повторы названия, булевы Y/N).
 */
function filterMarket777Pairs($pairs) {
    $dropLabels = ['Отложенные', 'Назад', 'Previous', 'Next', 'Характеристики', 'Описание', 'Y', 'N'];
    $dropLabelPrefix = ['К сравнению', 'В избранное', 'В корзине', 'Заказать'];
    foreach ($pairs as $label => $value) {
        if (in_array($label, $dropLabels, true)) {
            unset($pairs[$label]);
            continue;
        }
        foreach ($dropLabelPrefix as $prefix) {
            if (stripos($label, $prefix) === 0) {
                unset($pairs[$label]);
                break;
            }
        }
        if (strlen($label) <= 2 && preg_match('/^[yn]$/ui', $label)) {
            unset($pairs[$label]);
        }
        if ($label === 'Характеристики' && preg_match('/^[A-Za-z]+\s+[A-Z0-9\-\/]+$/u', trim($value))) {
            unset($pairs[$label]);
        }
        if ($label === 'Описание' && strlen($value) < 100 && preg_match('/^[A-Za-z0-9\s\-\/]+$/u', trim($value))) {
            unset($pairs[$label]);
        }
        if (preg_match('/автомобильн|акустик/ui', $value)) {
            unset($pairs[$label]);
        }
    }
    return $pairs;
}

/**
 * Market777.ru — "36 000 ₽", таблицы характеристик в блоке между "Общие параметры" и "Описание"
 */
function parseMarket777($html, $url) {
    $title = parseTitleFromHtml($html);
    $description = parseDescriptionFromHtml($html);
    $image = parseImageFromHtml($html, $url);

    $fragment = extractMarket777SpecsFragment($html);
    $pairs = $fragment !== '' ? extractPairsFromHtmlTables($fragment) : [];
    if (empty($pairs)) {
        $pairs = extractAllCharacteristicsFromHtml($html);
    }
    $pairs = filterMarket777Pairs($pairs);
    $characteristics = mapToSchema($pairs);

    $brand = '';
    $model = '';
    if (!empty($pairs['Бренд'])) {
        $brand = trim(strip_tags($pairs['Бренд']));
    }
    if (!empty($pairs['Модель'])) {
        $model = trim($pairs['Модель']);
    }
    if ($brand === '' || $model === '') {
        list($brandFromTitle, $modelFromTitle) = extractBrandModelFromTitle($title);
        if ($brand === '') {
            $brand = $brandFromTitle;
        }
        if ($model === '') {
            $model = $modelFromTitle;
        }
    }
    if ($brand === '' && $title && preg_match('/^([A-Za-z]+)/u', $title, $m)) {
        $brand = $m[1];
    }

    $price = parsePriceMarket777($html);

    return [
        'name' => $title ?: 'Товар с сайта поставщика',
        'brand' => $brand,
        'model' => $model,
        'price' => $price,
        'description' => $description,
        'characteristics' => $characteristics,
        'supplier_url' => $url,
        'supplier_name' => 'market777',
        'image' => $image,
    ];
}

/**
 * Luxograd.ru — "37 300.00 ₽", список характеристик
 */
function parseLuxograd($html, $url) {
    $title = parseTitleFromHtml($html);
    $price = parsePriceFromHtml($html);
    $description = parseDescriptionFromHtml($html);
    $image = parseImageFromHtml($html, $url);
    list($brand, $model) = extractBrandModelFromTitle($title);
    $pairs = extractAllCharacteristicsFromHtml($html);
    $characteristics = mapToSchema($pairs);
    return [
        'name' => $title ?: 'Товар с сайта поставщика',
        'brand' => $brand,
        'model' => $model,
        'price' => $price,
        'description' => $description,
        'characteristics' => $characteristics,
        'supplier_url' => $url,
        'supplier_name' => 'luxograd',
        'image' => $image,
    ];
}

/**
 * Buranrussia.ru — "29 700 ₽"
 */
function parseBuranrussia($html, $url) {
    $title = parseTitleFromHtml($html);
    $price = parsePriceFromHtml($html);
    $description = parseDescriptionFromHtml($html);
    $image = parseImageFromHtml($html, $url);
    list($brand, $model) = extractBrandModelFromTitle($title);
    $pairs = extractAllCharacteristicsFromHtml($html);
    $characteristics = mapToSchema($pairs);
    return [
        'name' => $title ?: 'Товар с сайта поставщика',
        'brand' => $brand,
        'model' => $model,
        'price' => $price,
        'description' => $description,
        'characteristics' => $characteristics,
        'supplier_url' => $url,
        'supplier_name' => 'buranrussia',
        'image' => $image,
    ];
}

/**
 * Mircli.ru
 */
function parseMircli($html, $url) {
    $title = parseTitleFromHtml($html);
    $price = parsePriceFromHtml($html);
    $description = parseDescriptionFromHtml($html);
    $image = parseImageFromHtml($html, $url);
    list($brand, $model) = extractBrandModelFromTitle($title);
    $pairs = extractAllCharacteristicsFromHtml($html);
    $characteristics = mapToSchema($pairs);
    return [
        'name' => $title ?: 'Товар с сайта поставщика',
        'brand' => $brand,
        'model' => $model,
        'price' => $price,
        'description' => $description,
        'characteristics' => $characteristics,
        'supplier_url' => $url,
        'supplier_name' => 'mircli',
        'image' => $image,
    ];
}

function parseSupplierProduct($url) {
    $fetched = fetchSupplierPage($url);
    if (isset($fetched['error'])) {
        return $fetched;
    }
    $html = $fetched['html'];
    $url = $fetched['url'];
    $supplier = detectSupplier($url);
    $parsers = [
        'proclimate5' => 'parseProClimate',
        'klimatov' => 'parseKlimatov',
        'market777' => 'parseMarket777',
        'luxograd' => 'parseLuxograd',
        'buranrussia' => 'parseBuranrussia',
        'mircli' => 'parseMircli',
    ];
    if (isset($parsers[$supplier])) {
        $data = $parsers[$supplier]($html, $url);
        if (!empty($data['image'])) {
            $data['image_url'] = $data['image'];
        }
        unset($data['image']);
        return $data;
    }
    return ['error' => 'Данный сайт поставщика пока не поддерживается. Поддерживаются: proclimate5.ru, klimatov.ru, market777.ru, luxograd.ru, buranrussia.ru, mircli.ru'];
}

function fetchSupplierPrice($url) {
    $fetched = fetchSupplierPage($url);
    if (isset($fetched['error'])) {
        return ['error' => $fetched['error']];
    }
    $price = parsePriceFromHtml($fetched['html']);
    return ['price' => $price];
}
}
