/**
 * Fire-and-forget Telegram notification. Errors are logged, not thrown.
 */
export async function sendLeadToTelegram(payload, env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const rawIds = env.TELEGRAM_CHAT_IDS || '';
  const chatIds = rawIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!token || chatIds.length === 0) {
    return;
  }

  const { name, phone, service, message, formType } = payload;

  let text = '';
  if (formType === 'contact') {
    text =
      '🔔 <b>Новая заявка на установку кондиционера</b>\n\n' +
      `👤 <b>Имя:</b> ${escapeHtml(name)}\n` +
      `📞 <b>Телефон:</b> ${escapeHtml(phone)}\n` +
      `🛠️ <b>Услуга:</b> ${escapeHtml(service || 'Не указано')}\n` +
      `💬 <b>Сообщение:</b> ${escapeHtml(message || 'Не указано')}\n`;
  } else {
    text =
      '💡 <b>Запрос на бесплатную консультацию</b>\n\n' +
      `👤 <b>Имя:</b> ${escapeHtml(name)}\n` +
      `📞 <b>Телефон:</b> ${escapeHtml(phone)}\n` +
      `💬 <b>Вопрос:</b> ${escapeHtml(message || 'Не указано')}\n`;
  }
  text += '\n✅ <i>Согласие на обработку персональных данных получено</i>';

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  for (const chatId of chatIds) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('[telegram] send failed', res.status, body);
      }
    } catch (e) {
      console.error('[telegram] send error', e);
    }
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
