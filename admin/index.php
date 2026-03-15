<?php
require_once __DIR__ . '/config.php';

if (isLoggedIn()) {
    header('Location: products.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    if ($password === ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: products.php');
        exit;
    }
    $error = 'Неверный пароль';
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход — Lion Climate Админ</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-login">
    <div class="login-box">
        <h1>Lion Climate</h1>
        <p class="login-subtitle">Бэк-офис</p>
        <form method="post" class="login-form">
            <?php if ($error): ?>
                <p class="error"><?= htmlspecialchars($error) ?></p>
            <?php endif; ?>
            <div class="form-group">
                <label for="password">Пароль</label>
                <input type="password" id="password" name="password" required autofocus>
            </div>
            <button type="submit" class="btn-primary">Войти</button>
        </form>
        <p class="back-link"><a href="../index.html">← На сайт</a></p>
    </div>
</body>
</html>
