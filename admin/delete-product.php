<?php
require_once __DIR__ . '/config.php';
requireLogin();

$id = $_GET['id'] ?? '';
if ($id === '') {
    header('Location: products.php');
    exit;
}

$products = getProducts();
$products = array_filter($products, function ($p) use ($id) {
    return ($p['id'] ?? '') !== $id;
});
saveProducts(array_values($products));

header('Location: products.php?deleted=1');
exit;
