/**
 * Fire-and-forget email notification via Unisender Go transactional API.
 * Errors are logged, not thrown.
 */
export async function sendLeadToEmail(payload, env) {
  const apiKey = env.UNISENDER_GO_API_KEY;
  const rawEmails = env.MANAGER_EMAILS || '';
  const recipients = rawEmails
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!apiKey || recipients.length === 0) {
    return;
  }

  const { name, phone, service, message, formType } = payload;

  const isContact = formType === 'contact';
  const subject = isContact
    ? 'Новая заявка на установку кондиционера'
    : 'Запрос на бесплатную консультацию';

  const bodyLines = isContact
    ? [
        `<h2>🔔 Новая заявка на установку кондиционера</h2>`,
        `<p><b>Имя:</b> ${esc(name)}</p>`,
        `<p><b>Телефон:</b> ${esc(phone)}</p>`,
        `<p><b>Услуга:</b> ${esc(service || 'Не указано')}</p>`,
        `<p><b>Сообщение:</b> ${esc(message || 'Не указано')}</p>`,
      ]
    : [
        `<h2>💡 Запрос на бесплатную консультацию</h2>`,
        `<p><b>Имя:</b> ${esc(name)}</p>`,
        `<p><b>Телефон:</b> ${esc(phone)}</p>`,
        `<p><b>Вопрос:</b> ${esc(message || 'Не указано')}</p>`,
      ];

  bodyLines.push(`<p style="color:#888;font-size:12px">✅ Согласие на обработку персональных данных получено</p>`);
  const htmlBody = bodyLines.join('\n');

  // Unisender Go: POST /en/transactional/api/v1/email/send.json
  const url = (env.UNISENDER_GO_HOST || 'https://go2.unisender.ru') + '/en/transactional/api/v1/email/send.json';

  const toList = recipients.map((email) => ({ email }));

  const requestBody = {
    message: {
      recipients: toList,
      headers: { 'X-Mailer': 'LionClimate CRM' },
      body: { html: htmlBody },
      subject,
      from_email: env.UNISENDER_FROM_EMAIL || 'noreply@lionclimate.ru',
      from_name: env.UNISENDER_FROM_NAME || 'LionClimate',
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[email] send failed', res.status, text);
    } else {
      const json = await res.json();
      if (json.status !== 'success') {
        console.error('[email] api error', JSON.stringify(json));
      }
    }
  } catch (e) {
    console.error('[email] send error', e);
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
