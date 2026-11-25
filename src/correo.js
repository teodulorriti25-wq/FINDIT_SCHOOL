// Envío de correos con la API transaccional de Brevo.
// Sin BREVO_API_KEY el correo no sale: se imprime en la consola para poder probar en local.
module.exports = async function enviarCorreo({ para, nombre, asunto, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.log(`\n[correo simulado] Para: ${para}\nAsunto: ${asunto}\n${html}\n`);
    return;
  }
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.BREVO_SENDER_NAME || 'FindIt School', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: para, name: nombre }],
      subject: asunto,
      htmlContent: html
    })
  });
  if (!r.ok) throw new Error(`Brevo respondió ${r.status}: ${await r.text()}`);
};
