// cardPayments.js
export async function createCardPaymentLink(order) {
  return {
    provider: process.env.CARD_PROVIDER || 'yookassa',
    link: `https://pay.example.com/order/${order.id}`,
    available: true
  };
}

export async function handleLavaWebhook(rawBody, headers) {
  console.log('Lava webhook received');
  return { status: 'ok' };
}