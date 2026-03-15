<?php
require_once __DIR__ . '/config.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: products.php');
    exit;
}

$id = trim($_POST['id'] ?? '');
$name = trim($_POST['name'] ?? '');
$brand = trim($_POST['brand'] ?? '');
$model = trim($_POST['model'] ?? '');
$price = isset($_POST['price']) && $_POST['price'] !== '' ? (float) $_POST['price'] : null;
$description = trim($_POST['description'] ?? '');
$imageUrl = trim($_POST['image_url'] ?? '');
$supplierUrl = trim($_POST['supplier_url'] ?? '');
$isActive = !empty($_POST['is_active']);

$characteristics = buildCharacteristicsFromPost();

if ($name === '') {
    $_SESSION['admin_error'] = 'Укажите название товара.';
    header('Location: product.php?' . ($id ? 'id=' . urlencode($id) : ''));
    exit;
}

$products = getProducts();

// Загрузка изображения
$imagePath = '';
if (!empty($imageUrl) && filter_var($imageUrl, FILTER_VALIDATE_URL)) {
    $imagePath = $imageUrl;
} elseif (!empty($_FILES['image']['tmp_name']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
    $uploadDir = rtrim(UPLOAD_DIR, '/\\');
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }
    if (is_dir($uploadDir) && is_writable($uploadDir)) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $ext = 'jpg';
        }
        $filename = 'product_' . uniqid() . '.' . $ext;
        $targetPath = $uploadDir . '/' . $filename;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $imagePath = UPLOAD_URL . $filename;
        }
    }
}

$product = [
    'id' => $id !== '' ? $id : 'prod_' . uniqid(),
    'name' => $name,
    'brand' => $brand,
    'model' => $model,
    'price' => $price,
    'description' => $description,
    'characteristics' => $characteristics,
    'is_active' => $isActive,
    'created_at' => date('Y-m-d H:i:s'),
];
if ($supplierUrl !== '' && preg_match('#^https?://#i', $supplierUrl)) {
    $product['supplier_url'] = $supplierUrl;
}

if ($imagePath !== '') {
    $product['image'] = $imagePath;
}

$found = false;
foreach ($products as $i => $p) {
    if (($p['id'] ?? '') === $product['id']) {
        if ($imagePath === '' && !empty($p['image'])) {
            $product['image'] = $p['image'];
        }
        $product['created_at'] = $p['created_at'] ?? $product['created_at'];
        if (empty($product['supplier_url']) && !empty($p['supplier_url'])) {
            $product['supplier_url'] = $p['supplier_url'];
        }
        $products[$i] = $product;
        $found = true;
        break;
    }
}
if (!$found) {
    $products[] = $product;
}

$saved = saveProducts($products);
if ($saved) {
    $_SESSION['admin_success'] = $found ? 'Товар обновлён.' : 'Товар добавлен.';
    header('Location: products.php?saved=1');
} else {
    $_SESSION['admin_error'] = 'Не удалось сохранить товар. Проверьте права на запись в папку data/ (должна быть доступна для веб-сервера).';
    header('Location: product.php?' . ($id ? 'id=' . urlencode($id) : '') . '&error=save');
}
exit;
