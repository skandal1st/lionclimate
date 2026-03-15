<?php
require_once __DIR__ . '/config.php';
requireLogin();

$error = '';
$preview = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $url = trim($_POST['url'] ?? '');
    if ($url === '') {
        $error = 'Введите ссылку на страницу товара.';
    } else {
        require_once __DIR__ . '/supplier-parser.php';
        $result = parseSupplierProduct($url);
        if (isset($result['error'])) {
            $error = $result['error'];
        } else {
            if (!empty($_POST['confirm_import'])) {
                require_once __DIR__ . '/supplier-parser.php';
                $result = parseSupplierProduct($url);
                if (isset($result['error'])) {
                    $error = $result['error'];
                    $preview = null;
                } else {
                $products = getProducts();
                $result['id'] = 'prod_' . uniqid();
                $result['created_at'] = date('Y-m-d H:i:s');
                $result['is_active'] = false;
                if (!empty($result['image_url'])) {
                    $result['image'] = $result['image_url'];
                }
                unset($result['image_url'], $result['supplier_name']);
                $products[] = $result;
                if (saveProducts($products)) {
                    $_SESSION['admin_success'] = 'Товар добавлен. Добавьте изображения и сохраните.';
                    header('Location: product.php?id=' . urlencode($result['id']));
                    exit;
                }
                $error = 'Не удалось сохранить товар. Проверьте права на запись в data/.';
                $preview = $result;
                }
            } else {
            $preview = $result;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Импорт по ссылке — Lion Climate Админ</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <header class="admin-header">
        <h1>Lion Climate — Импорт по ссылке</h1>
        <nav class="admin-nav">
            <a href="products.php">← К списку</a>
            <a href="product.php">Ручное добавление</a>
            <a href="../index.html">На сайт</a>
            <a href="logout.php">Выход</a>
        </nav>
    </header>

    <div class="admin-container">
        <p style="margin-bottom:20px;color:#666;">Вставьте ссылку на страницу товара у поставщика. Данные (название, цена, описание, характеристики, фото) подтянутся автоматически. При необходимости замените фото на свои в карточке товара.</p>
        <p style="margin-bottom:16px;font-size:13px;color:#888;">Поддерживаются: <strong>proclimate5.ru</strong>, <strong>klimatov.ru</strong>, <strong>market777.ru</strong>, <strong>luxograd.ru</strong>, <strong>buranrussia.ru</strong>, <strong>mircli.ru</strong>.</p>

        <?php if ($error): ?>
            <div class="message error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <?php if (!$preview): ?>
            <form method="post" class="product-form" style="max-width:600px;">
                <div class="form-group">
                    <label for="url">Ссылка на товар у поставщика</label>
                    <input type="url" id="url" name="url" required placeholder="https://www.proclimate5.ru/catalog/..." value="<?= htmlspecialchars($_POST['url'] ?? '') ?>">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Загрузить данные</button>
                    <a href="products.php" class="btn-secondary">Отмена</a>
                </div>
            </form>
        <?php else: ?>
            <div class="message success">Данные загружены. Проверьте и нажмите «Добавить товар».</div>
            <div class="product-form" style="max-width:720px;">
                <div class="form-group">
                    <label>Название</label>
                    <p><strong><?= htmlspecialchars($preview['name']) ?></strong></p>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Бренд</label>
                        <p><?= htmlspecialchars($preview['brand'] ?: '—') ?></p>
                    </div>
                    <div class="form-group">
                        <label>Модель</label>
                        <p><?= htmlspecialchars($preview['model'] ?: '—') ?></p>
                    </div>
                </div>
                <div class="form-group">
                    <label>Цена поставщика</label>
                    <p><?= $preview['price'] ? number_format($preview['price'], 0, '', ' ') . ' ₽' : '—' ?></p>
                </div>
                <?php if (!empty($preview['characteristics'])): ?>
                    <div class="form-group">
                        <label>Характеристики</label>
                        <ul style="margin:0;padding-left:20px;">
                            <?php foreach (array_slice($preview['characteristics'], 0, 12) as $c): ?>
                                <li><strong><?= htmlspecialchars($c['name']) ?>:</strong> <?= htmlspecialchars($c['value']) ?></li>
                            <?php endforeach; ?>
                            <?php if (count($preview['characteristics']) > 12): ?>
                                <li><em>… и ещё <?= count($preview['characteristics']) - 12 ?></em></li>
                            <?php endif; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
            <form method="post" style="margin-top:20px;">
                <input type="hidden" name="url" value="<?= htmlspecialchars($_POST['url']) ?>">
                <input type="hidden" name="confirm_import" value="1">
                <button type="submit" class="btn-primary">Добавить товар и перейти к редактированию</button>
                <a href="import-by-url.php" class="btn-secondary">Выбрать другую ссылку</a>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
