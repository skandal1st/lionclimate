<?php
// Пароль для входа в бэк-офис. Обязательно смените на свой!
define('ADMIN_PASSWORD', 'lionclimate2026');

// Секретный ключ для вызова синхронизации цен по крону (см. sync-prices.php). Смените на свой случайный ключ.
define('CRON_SECRET_KEY', 'lion_sync_' . md5('lionclimate2026'));

// Путь к файлу с товарами (от корня сайта)
define('PRODUCTS_FILE', __DIR__ . '/../data/products.json');

// Разрешить загрузку изображений (папка для фото товаров)
define('UPLOAD_DIR', __DIR__ . '/../img/products/');
define('UPLOAD_URL', 'img/products/');

session_start();

function isLoggedIn() {
    return !empty($_SESSION['admin_logged_in']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: index.php');
        exit;
    }
}

function getProducts() {
    if (!file_exists(PRODUCTS_FILE)) {
        return [];
    }
    $json = file_get_contents(PRODUCTS_FILE);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function saveProducts($products) {
    $dir = dirname(PRODUCTS_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $json = json_encode($products, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    return $json !== false && file_put_contents(PRODUCTS_FILE, $json) !== false;
}

/**
 * Фиксированные характеристики кондиционеров (по образцу каталога поставщика ProClimate).
 * Ключ = name в форме, value берётся из POST.
 */
function getFixedCharacteristicsSchema() {
    return [
        ['key' => 'seriya', 'label' => 'Серия', 'placeholder' => 'напр. CT-65Ixx'],
        ['key' => 'rezhim_raboty', 'label' => 'Режим работы', 'placeholder' => 'тепло/холод, только холод'],
        ['key' => 'invertor', 'label' => 'Инвертор', 'placeholder' => 'да / нет'],
        ['key' => 'ploshad_m2', 'label' => 'Площадь, м²', 'placeholder' => '28'],
        ['key' => 'ionizator', 'label' => 'Ионизатор', 'placeholder' => 'да / нет'],
        ['key' => 'ohlazhdenie_kvt', 'label' => 'Охлаждение, кВт', 'placeholder' => '2.84'],
        ['key' => 'obogrev_kvt', 'label' => 'Обогрев, кВт', 'placeholder' => '2.92'],
        ['key' => 'btu', 'label' => 'BTU', 'placeholder' => '9000, 10000, 12000...'],
        ['key' => 'nominalnaya_moschnost_kvt', 'label' => 'Номинальная мощность, кВт', 'placeholder' => '0.80'],
        ['key' => 'uroven_shuma_db', 'label' => 'Уровень шума, дБ(А)', 'placeholder' => '22'],
        ['key' => 'garantiya_mes', 'label' => 'Гарантия, мес', 'placeholder' => '36'],
        ['key' => 'strana', 'label' => 'Страна изготовитель', 'placeholder' => 'Китай'],
        ['key' => 'elektropitanie_v', 'label' => 'Электропитание, В', 'placeholder' => '220-240'],
        ['key' => 'diametr_trub', 'label' => 'Диаметр труб хладагента', 'placeholder' => '6,35/9,52'],
        ['key' => 'dlina_trassy_m', 'label' => 'Длина трассы/перепад высот, м', 'placeholder' => '20/10'],
        ['key' => 'hladagent', 'label' => 'Хладагент', 'placeholder' => 'R32, R410A'],
        ['key' => 'gabarity_vnutr', 'label' => 'Габариты внутр. блока (Ш×В×Г), мм', 'placeholder' => '761×295×200'],
        ['key' => 'gabarity_naruzh', 'label' => 'Габариты наруж. блока (Ш×В×Г), мм', 'placeholder' => '705×530×279'],
        ['key' => 'ves_vnutr_kg', 'label' => 'Вес внутреннего блока, кг', 'placeholder' => '7.5'],
        ['key' => 'ves_naruzh_kg', 'label' => 'Вес наружного блока, кг', 'placeholder' => '22.5'],
        ['key' => 'wifi', 'label' => 'Wi‑Fi модуль', 'placeholder' => 'да / нет / опция'],
        ['key' => 'diapazon_ohlazhdenie', 'label' => 'Диапазон рабочих темп. охл., °С', 'placeholder' => '+16…+49'],
        ['key' => 'diapazon_obogrev', 'label' => 'Диапазон рабочих темп. нагрев., °С', 'placeholder' => '-15…+30'],
        ['key' => 'rashod_vozduha', 'label' => 'Расход воздуха, м³/час', 'placeholder' => '500'],
    ];
}

/** Из массива характеристик товара вернуть значение по ключу */
function getCharValue($characteristics, $key) {
    if (!is_array($characteristics)) return '';
    $schema = getFixedCharacteristicsSchema();
    $labelByKey = [];
    foreach ($schema as $item) { $labelByKey[$item['key']] = $item['label']; }
    $label = $labelByKey[$key] ?? $key;
    foreach ($characteristics as $c) {
        if (isset($c['key']) && $c['key'] === $key) return $c['value'] ?? '';
        if (isset($c['name']) && $c['name'] === $label) return $c['value'] ?? '';
    }
    return '';
}

/** Построить массив характеристик из POST (фиксированные ключи) */
function buildCharacteristicsFromPost() {
    $schema = getFixedCharacteristicsSchema();
    $result = [];
    foreach ($schema as $item) {
        $key = $item['key'];
        $val = trim($_POST['char_' . $key] ?? '');
        if ($val !== '') {
            $result[] = ['name' => $item['label'], 'key' => $key, 'value' => $val];
        }
    }
    return $result;
}
?>
