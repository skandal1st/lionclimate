<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
if ($id === '') {
    http_response_code(400);
    echo json_encode(['error' => 'id required']);
    exit;
}

$productsFile = __DIR__ . '/../data/products.json';
if (!file_exists($productsFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'not found']);
    exit;
}

$json = file_get_contents($productsFile);
$products = json_decode($json, true);
if (!is_array($products)) {
    http_response_code(404);
    echo json_encode(['error' => 'not found']);
    exit;
}

foreach ($products as $p) {
    if (($p['id'] ?? '') === $id) {
        if (isset($p['is_active']) && !$p['is_active']) {
            http_response_code(404);
            echo json_encode(['error' => 'not found']);
            exit;
        }
        echo json_encode($p, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

http_response_code(404);
echo json_encode(['error' => 'not found']);
