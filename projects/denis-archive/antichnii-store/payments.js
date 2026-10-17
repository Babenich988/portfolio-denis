// payments.js
export function hasTelegramApi() {
  return Boolean(process.env.BOT_TOKEN);
}

export async function createStarsInvoiceLink(order) {
  // имитация ссылки на оплату Stars
  return `https://t.me/antichniistore_bot?start=pay_${order.id}`;
}