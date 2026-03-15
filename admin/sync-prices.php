<?php
/**
 * Синхронизация цен с сайтами поставщиков.
 * Вызывать раз в сутки по крону: 0 3 * * * curl -s "https://lionclimate.ru/admin/sync-prices.php?key=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ"
 * Или: 0 3 * * * cd /var/www/lionclimate.ru && php admin/sync-prices.php
 */
require_once __DIR__ . '/config.php';

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    $key = $_GET['key'] ?? '';
    if ($key === '' || $key !== CRON_SECRET_KEY) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Forbidden';
        exit;
    }
}

require_once __DIR__ . '/supplier-parser.php';

$products = getProducts();
$updated = 0;
$errors = [];
$log = [];

foreach ($products as $i => $p) {
    $url = $p['supplier_url'] ?? '';
    if ($url === '') continue;

    $log[] = 'Проверка: ' . ($p['name'] ?? $p['id']);
    $fetched = fetchSupplierPrice($url);
    if (isset($fetched['error'])) {
        $errors[] = ($p['name'] ?? $p['id']) . ': ' . $fetched['error'];
        $log[] = '  Ошибка: ' . $fetched['error'];
        continue;
    }
    $newPrice = $fetched['price'];
    $oldPrice = $p['price'] ?? null;
    if ($newPrice === null) {
        $log[] = '  Цена не найдена на странице';
        continue;
    }
    if ((float)$oldPrice !== (float)$newPrice) {
        $products[$i]['price'] = $newPrice;
        $updated++;
        $log[] = '  Цена обновлена: ' . $oldPrice . ' → ' . $newPrice . ' ₽';
    } else {
        $log[] = '  Без изменений';
    }
}

if ($updated > 0) {
    saveProducts($products);
}

if ($isCli) {
    echo implode("\n", $log) . "\n";
    echo "Обновлено товаров: $updated\n";
    if (!empty($errors)) {
        echo "Ошибки:\n" . implode("\n", $errors) . "\n";
    }
} else {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'updated' => $updated,
        'errors' => $errors,
        'log' => $log,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
