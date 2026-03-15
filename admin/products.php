<?php
require_once __DIR__ . '/config.php';
requireLogin();

$products = getProducts();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Товары — Lion Climate Админ</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <header class="admin-header">
        <h1>Lion Climate — Товары</h1>
        <nav class="admin-nav">
            <a href="import-by-url.php">Импорт по ссылке</a>
            <a href="product.php">+ Добавить товар</a>
            <a href="../index.html">На сайт</a>
            <a href="logout.php">Выход</a>
        </nav>
    </header>

    <div class="admin-container">
        <?php if (!empty($_GET['saved']) && !empty($_SESSION['admin_success'])): ?>
            <div class="message success"><?= htmlspecialchars($_SESSION['admin_success']) ?></div>
            <?php unset($_SESSION['admin_success']); ?>
        <?php endif; ?>
        <?php if (!empty($_SESSION['admin_error'])): ?>
            <div class="message error"><?= htmlspecialchars($_SESSION['admin_error']) ?></div>
            <?php unset($_SESSION['admin_error']); ?>
        <?php endif; ?>

        <div class="products-toolbar">
            <h2 class="page-title">Каталог товаров</h2>
            <a href="import-by-url.php" class="btn-secondary">Импорт по ссылке</a>
            <a href="product.php" class="btn-primary">+ Добавить товар</a>
        </div>

        <?php if (empty($products)): ?>
            <div class="products-table-wrap">
                <div class="empty-state">
                    <p>Товаров пока нет.</p>
                    <a href="product.php" class="btn-primary">Добавить первый товар</a>
                </div>
            </div>
        <?php else: ?>
            <div class="products-table-wrap">
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Бренд</th>
                            <th>Цена</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($products as $p): ?>
                            <tr>
                                <td>
                                    <?php if (!empty($p['image'])): ?>
                                        <?php $imgSrc = (strpos($p['image'], 'http') === 0) ? $p['image'] : '../' . $p['image']; ?>
                                        <img src="<?= htmlspecialchars($imgSrc) ?>" alt="" class="product-thumb">
                                    <?php else: ?>
                                        <span style="color:#999;">—</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <strong><?= htmlspecialchars($p['name'] ?? '') ?></strong>
                                    <?php if (!empty($p['model'])): ?>
                                        <br><span style="color:#666;font-size:13px;"><?= htmlspecialchars($p['model']) ?></span>
                                    <?php endif; ?>
                                </td>
                                <td><?= htmlspecialchars($p['brand'] ?? '—') ?></td>
                                <td><?= isset($p['price']) ? number_format((float)$p['price'], 0, '', ' ') . ' ₽' : '—' ?></td>
                                <td>
                                    <?php if (!empty($p['is_active'])): ?>
                                        <span class="badge badge-active">В каталоге</span>
                                    <?php else: ?>
                                        <span class="badge badge-hidden">Скрыт</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div class="actions">
                                        <a href="product.php?id=<?= urlencode($p['id'] ?? '') ?>" class="btn-secondary">Изменить</a>
                                        <a href="delete-product.php?id=<?= urlencode($p['id'] ?? '') ?>" class="btn-danger" onclick="return confirm('Удалить этот товар?');">Удалить</a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
