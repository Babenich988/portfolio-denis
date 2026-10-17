// notifications.js
export function buildOrderNotification(order) {
  return `Новый заказ #${order.id}\nТовар: ${order.productTitle}\nСумма: ${order.price} ${order.currency}\nКонтакт: ${order.contact}`;
}

export async function notifyAdmin(message) {
  console.log('[ADMIN NOTIFICATION]', message);
  // Здесь можно добавить отправку в Telegram, если есть BOT_TOKEN
  return true;
}