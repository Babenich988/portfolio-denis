import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createOrder, getCatalog, getOrder } from "./storage.js";
import { createStarsInvoiceLink, hasTelegramApi } from "./payments.js";
import { buildOrderNotification, notifyAdmin } from "./notifications.js";
import { createCardPaymentLink, handleLavaWebhook } from "./cardPayments.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, "public");  // статика из папки public
const DATA_DIR = path.join(ROOT, "data");      // данные из папки data
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const SITE_URL = process.env.SITE_URL || `http://${HOST}:${PORT}`;

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

const SPA_ROUTES = new Set([
  "/support",
  "/profile",
  "/popular",
  "/official",
  "/digital",
  "/ai",
  "/music",
  "/video",
  "/games"
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (url.pathname === "/health" && req.method === "GET") {
      return sendJson(res, 200, { ok: true, name: "antichnii-store", time: new Date().toISOString() });
    }

    if (url.pathname === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, healthPayload());
    }

    if (url.pathname === "/api/services" && req.method === "GET") {
      const catalog = await getCatalog(CATALOG_PATH);  // передаём путь
      return sendJson(res, 200, catalog);
    }

    if (url.pathname === "/api/payments/lava/webhook" && req.method === "POST") {
      const rawBody = await readRawBody(req);
      const result = await handleLavaWebhook(rawBody, req.headers);
      return sendJson(res, 200, { ok: true, status: result.status });
    }

    if (url.pathname === "/api/orders" && req.method === "POST") {
      const payload = await readJsonBody(req);
      const order = await createOrder({ ...payload, source: payload.source || "site" });
      const payment = await buildPaymentResponse(order);
      const adminNotified = await notifyAdmin(buildOrderNotification(order)).catch((error) => {
        console.error("Admin notification failed:", error.message);
        return false;
      });
      return sendJson(res, 201, { order, payment, adminNotified });
    }

    const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch && req.method === "GET") {
      const order = await getOrder(decodeURIComponent(orderMatch[1]));
      if (!order) return sendJson(res, 404, { error: "Order not found" });
      return sendJson(res, 200, { order });
    }

    if (url.pathname.startsWith("/api/")) {
      return sendJson(res, 404, { error: "Endpoint not found" });
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status >= 500 ? "Internal server error" : error.message;
    if (status >= 500) console.error(error);
    return sendJson(res, status, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AntichniiStore site is running at http://${HOST}:${PORT}`);
});

function healthPayload() {
  return {
    ok: true,
    siteUrl: SITE_URL,
    telegramWebApp: isTelegramWebAppUrl(SITE_URL)
  };
}

function isTelegramWebAppUrl(value) {
  return /^https:\/\//i.test(String(value || ""));
}

async function buildPaymentResponse(order) {
  if (order.payment.method === "card") {
    try {
      const payment = await createCardPaymentLink(order);
      return { method: "card", ...payment };
    } catch (error) {
      console.error("Card payment failed:", error.message);
      return {
        method: "card",
        available: false,
        provider: process.env.CARD_PROVIDER || "yookassa",
        link: "",
        message: "Не удалось создать ссылку оплаты картой. Менеджер пришлет способ оплаты вручную."
      };
    }
  }

  if (order.payment.method === "tribute") {
    const link = process.env.TRIBUTE_PAYMENT_URL || "";
    return {
      method: "tribute",
      available: Boolean(link),
      link,
      message: link
        ? (process.env.TRIBUTE_NOTE || "Оплатите через Tribute и отправьте менеджеру номер заявки.")
        : "Tribute-ссылка еще не настроена. Добавьте TRIBUTE_PAYMENT_URL или менеджер пришлет ссылку вручную."
    };
  }

  if (order.payment.method === "stars") {
    if (!hasTelegramApi()) {
      return {
        method: "stars",
        available: false,
        message: "Telegram Stars не настроены на сервере. Запустите сайт с BOT_TOKEN."
      };
    }
    try {
      const link = await createStarsInvoiceLink(order);
      return {
        method: "stars",
        available: true,
        stars: order.starsPrice,
        link
      };
    } catch (error) {
      console.error("Stars invoice link failed:", error.message);
      return {
        method: "stars",
        available: false,
        message: "Не удалось создать ссылку на оплату Stars. Менеджер пришлет ее вручную."
      };
    }
  }

  if (order.payment.method === "crypto") {
    const wallets = buildCryptoWallets();
    return {
      method: "crypto",
      available: wallets.length > 0,
      wallets,
      amount: estimateUsdtAmount(order.price),
      message: wallets.length
        ? "После перевода отправьте менеджеру txid или скриншот с номером заявки."
        : "Крипто-кошелек еще не настроен. Добавьте адреса в переменные окружения."
    };
  }

  return {
    method: "manual",
    available: true,
    message: "Менеджер подтвердит способ оплаты вручную."
  };
}

function buildCryptoWallets() {
  return [
    { network: "USDT TRC20", address: process.env.CRYPTO_USDT_TRC20_ADDRESS },
    { network: "USDT TON", address: process.env.CRYPTO_USDT_TON_ADDRESS },
    { network: "TON", address: process.env.CRYPTO_TON_ADDRESS },
    { network: "USDT BEP20", address: process.env.CRYPTO_USDT_BEP20_ADDRESS }
  ].filter((wallet) => wallet.address);
}

function estimateUsdtAmount(rubPrice) {
  const rate = Number(process.env.USDT_RUB_RATE || 100);
  if (!Number.isFinite(rate) || rate <= 0 || !rubPrice) return null;
  return Math.ceil((Number(rubPrice) / rate) * 100) / 100;
}

async function serveStatic(requestPath, res) {
  const normalizedPath = requestPath === "/" || SPA_ROUTES.has(requestPath)
    ? "/index.html"
    : requestPath === "/pay/success"
      ? "/pay-success.html"
      : requestPath;
  const decodedPath = decodeURIComponent(normalizedPath);
  const filePath = path.join(PUBLIC_DIR, decodedPath);
  const relative = path.relative(PUBLIC_DIR, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return sendText(res, 403, "Forbidden", "text/plain; charset=utf-8");
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    const content = await fs.readFile(filePath);
    const contentType = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": contentType.startsWith("image/") ? "public, max-age=3600" : "no-store"
    });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") return sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    throw error;
  }
}

function readJsonBody(req) {
  return readRawBody(req).then((body) => {
    try {
      return body ? JSON.parse(body) : {};
    } catch {
      const error = new Error("Invalid JSON");
      error.statusCode = 400;
      throw error;
    }
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        const error = new Error("Body is too large");
        error.statusCode = 413;
        reject(error);
        req.destroy();
      }
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text, contentType) {
  res.writeHead(status, { "content-type": contentType });
  res.end(text);
}