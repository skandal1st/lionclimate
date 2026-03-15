<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$productsFile = __DIR__ . '/../data/products.json';

if (!file_exists($productsFile)) {
    echo json_encode([]);
    exit;
}

$json = file_get_contents($productsFile);
$products = json_decode($json, true);

if (!is_array($products)) {
    echo json_encode([]);
    exit;
}

// Возвращаем только активные товары для каталога
$active = array_filter($products, function ($p) {
    return !isset($p['is_active']) || $p['is_active'];
});

// Сортируем по дате добавления (новые первые)
usort($active, function ($a, $b) {
    $t1 = $a['created_at'] ?? '0';
    $t2 = $b['created_at'] ?? '0';
    return strcmp($t2, $t1);
});

echo json_encode(array_values($active), JSON_UNESCAPED_UNICODE);
