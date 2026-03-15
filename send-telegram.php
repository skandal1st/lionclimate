<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Разрешить только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Настройки Telegram
$TELEGRAM_BOT_TOKEN = '5762581110:AAEmw4kTEl72NRzh4RadGOw-gWpjMas2n_M'; // Токен бота

// Chat ID получателей (можно указать несколько - уведомления придут всем)
$TELEGRAM_CHAT_IDS = [
    '433839797', // Менеджер - замените на Chat ID менеджера (если нужно)
    // Добавьте Chat ID руководителя ниже (раскомментируйте строку и замените YOUR_CHAT_ID_2)
    // 'YOUR_CHAT_ID_2'  // Руководитель - замените YOUR_CHAT_ID_2 на Chat ID руководителя
];

// Получаем данные из запроса
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

$name = $data['name'] ?? 'Не указано';
$phone = $data['phone'] ?? 'Не указано';
$service = $data['service'] ?? 'Не указано';
$message = $data['message'] ?? 'Не указано';
$formType = $data['formType'] ?? 'contact';

// Валидация
if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name and phone are required']);
    exit;
}

// Формируем сообщение для Telegram
$telegramMessage = '';
if ($formType === 'contact') {
    $telegramMessage = "🔔 <b>Новая заявка на установку кондиционера</b>\n\n";
    $telegramMessage .= "👤 <b>Имя:</b> " . htmlspecialchars($name) . "\n";
    $telegramMessage .= "📞 <b>Телефон:</b> " . htmlspecialchars($phone) . "\n";
    $telegramMessage .= "🛠️ <b>Услуга:</b> " . htmlspecialchars($service) . "\n";
    $telegramMessage .= "💬 <b>Сообщение:</b> " . htmlspecialchars($message) . "\n";
} else {
    $telegramMessage = "💡 <b>Запрос на бесплатную консультацию</b>\n\n";
    $telegramMessage .= "👤 <b>Имя:</b> " . htmlspecialchars($name) . "\n";
    $telegramMessage .= "📞 <b>Телефон:</b> " . htmlspecialchars($phone) . "\n";
    $telegramMessage .= "💬 <b>Вопрос:</b> " . htmlspecialchars($message) . "\n";
}

$telegramMessage .= "\n✅ <i>Согласие на обработку персональных данных получено</i>";

// Отправляем в Telegram всем получателям
$url = "https://api.telegram.org/bot{$TELEGRAM_BOT_TOKEN}/sendMessage";
$successCount = 0;
$errors = [];

foreach ($TELEGRAM_CHAT_IDS as $chatId) {
    // Пропускаем пустые или неправильные Chat ID
    if (empty($chatId) || strpos($chatId, 'YOUR_CHAT_ID') !== false) {
        continue;
    }
    
    $postData = [
        'chat_id' => $chatId,
        'text' => $telegramMessage,
        'parse_mode' => 'HTML'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($httpCode === 200 && $result) {
        $response = json_decode($result, true);
        if (isset($response['ok']) && $response['ok']) {
            $successCount++;
        } else {
            $errors[] = "Ошибка отправки на Chat ID {$chatId}: " . json_encode($response);
        }
    } else {
        $errors[] = "Ошибка отправки на Chat ID {$chatId}: {$curlError}";
    }
}

// Проверяем, что хотя бы одно сообщение было отправлено успешно
if ($successCount > 0) {
    echo json_encode([
        'success' => true,
        'sent_to' => $successCount . ' получатель(ей)',
        'errors' => $errors
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Не удалось отправить сообщение ни одному получателю',
        'details' => $errors
    ]);
}
?>


