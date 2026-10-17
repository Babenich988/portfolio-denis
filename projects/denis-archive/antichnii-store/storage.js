// storage.js
import { readFile } from 'node:fs/promises';

let orders = [];
let catalogCache = null;

export async function getCatalog(catalogPath) {
  if (catalogCache) return catalogCache;
  try {
    const content = await readFile(catalogPath, 'utf-8');
    catalogCache = JSON.parse(content);
    return catalogCache;
  } catch {
    catalogCache = { brand: {}, categories: [], sources: [], products: [] };
    return catalogCache;
  }
}

export async function createOrder(data) {
  const order = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    ...data,
    status: data.status || 'найден',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  return order;
}

export async function getOrder(id) {
  return orders.find(o => o.id === id) || null;
}

export function listOrders() {
  return orders;
}