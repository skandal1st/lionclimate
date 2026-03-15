<?php
require_once __DIR__ . '/config.php';
requireLogin();

$id = $_GET['id'] ?? '';
$product = null;
if ($id !== '') {
    $products = getProducts();
    foreach ($products as $p) {
        if (($p['id'] ?? '') === $id) {
            $product = $p;
            break;
        }
    }
}
if ($id !== '' && !$product) {
    header('Location: products.php');
    exit;
}

$isEdit = (bool) $product;
$chars = $product['characteristics'] ?? [];
if (!is_array($chars)) {
    $chars = [];
}
$schema = getFixedCharacteristicsSchema();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $isEdit ? 'Редактировать товар' : 'Новый товар' ?> — Lion Climate Админ</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <header class="admin-header">
        <h1>Lion Climate — <?= $isEdit ? 'Редактировать товар' : 'Новый товар' ?></h1>
        <nav class="admin-nav">
            <a href="products.php">← К списку</a>
            <a href="../index.html">На сайт</a>
            <a href="logout.php">Выход</a>
        </nav>
    </header>

    <div class="admin-container">
        <?php if (!empty($_SESSION['admin_error'])): ?>
            <div class="message error"><?= htmlspecialchars($_SESSION['admin_error']) ?></div>
            <?php unset($_SESSION['admin_error']); ?>
        <?php endif; ?>

        <form action="save-product.php" method="post" class="product-form" id="productForm" enctype="multipart/form-data">
            <?php if ($isEdit): ?>
                <input type="hidden" name="id" value="<?= htmlspecialchars($product['id']) ?>">
            <?php endif; ?>

            <div class="form-group">
                <label for="name">Название товара *</label>
                <input type="text" id="name" name="name" required value="<?= htmlspecialchars($product['name'] ?? '') ?>" placeholder="Например: Настенный кондиционер Centek CT-65I09">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="brand">Бренд</label>
                    <input type="text" id="brand" name="brand" value="<?= htmlspecialchars($product['brand'] ?? '') ?>" placeholder="Centek, Daikin, Samsung...">
                </div>
                <div class="form-group">
                    <label for="model">Модель</label>
                    <input type="text" id="model" name="model" value="<?= htmlspecialchars($product['model'] ?? '') ?>" placeholder="CT-65I09">
                </div>
            </div>

            <div class="form-group">
                <label for="price">Цена (₽)</label>
                <input type="number" id="price" name="price" min="0" step="1" value="<?= htmlspecialchars($product['price'] ?? '') ?>" placeholder="43990">
            </div>

            <div class="form-group">
                <label for="description">Описание</label>
                <textarea id="description" name="description" placeholder="Краткое описание товара"><?= htmlspecialchars($product['description'] ?? '') ?></textarea>
            </div>

            <div class="form-group">
                <label for="image">Изображение</label>
                <input type="file" id="image" name="image" accept="image/*">
                <?php if (!empty($product['image'])): ?>
                    <p style="margin-top:8px;font-size:13px;color:#666;">Текущее: <a href="<?= (strpos($product['image'], 'http') === 0) ? htmlspecialchars($product['image']) : '../' . htmlspecialchars($product['image']) ?>" target="_blank"><?= htmlspecialchars($product['image']) ?></a>. Оставьте пустым, чтобы не менять.</p>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="image_url">Или URL изображения</label>
                <input type="url" id="image_url" name="image_url" value="<?= htmlspecialchars($product['image_url'] ?? ((strpos($product['image'] ?? '', 'http') === 0) ? ($product['image'] ?? '') : '')) ?>" placeholder="https://...">
                <p style="margin-top:4px;font-size:12px;color:#666;">Если указан URL, он имеет приоритет над загрузкой файла.</p>
            </div>

            <div class="form-group chars-block">
                <h3>Характеристики</h3>
                <p style="font-size:13px;color:#666;margin-bottom:12px;">Заполняйте по данным из каталога поставщика (например <a href="https://www.proclimate5.ru/catalog/kondicionery/nastennye/centek-20/ct-65i09/" target="_blank" rel="noopener">ProClimate</a>).</p>
                <div class="chars-grid">
                    <?php foreach ($schema as $item): ?>
                        <?php $val = getCharValue($chars, $item['key']); ?>
                        <div class="form-group char-field">
                            <label for="char_<?= htmlspecialchars($item['key']) ?>"><?= htmlspecialchars($item['label']) ?></label>
                            <input type="text" id="char_<?= htmlspecialchars($item['key']) ?>" name="char_<?= htmlspecialchars($item['key']) ?>" value="<?= htmlspecialchars($val) ?>" placeholder="<?= htmlspecialchars($item['placeholder'] ?? '') ?>">
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="is_active" value="1" <?= (!isset($product['is_active']) || $product['is_active']) ? 'checked' : '' ?>>
                    <span>Показывать в каталоге на сайте</span>
                </label>
            </div>

            <div class="form-group">
                <label for="supplier_url">Ссылка на страницу поставщика</label>
                <input type="url" id="supplier_url" name="supplier_url" value="<?= htmlspecialchars($product['supplier_url'] ?? '') ?>" placeholder="https://www.proclimate5.ru/...">
                <p style="margin-top:4px;font-size:12px;color:#666;">Если указана, раз в сутки цена будет подтягиваться с сайта поставщика.</p>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-primary"><?= $isEdit ? 'Сохранить' : 'Добавить товар' ?></button>
                <a href="products.php" class="btn-secondary">Отмена</a>
            </div>
        </form>
    </div>
</body>
</html>
