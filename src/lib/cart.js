const KEY = 'sanad_cart_v1';

export function getCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCart(items) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new Event('sanad-cart-updated'));
}

export function addToCart(product, providerName) {
  const cart = getCart();
  const existing = cart.find((x) => x.id === product.id);
  const price = Number(product.price) || 0;
  const disc = Number(product.discount_percent) || 0;
  const finalPrice = Math.round(price - (price * disc / 100));
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      image_url: product.image_url || null,
      price: finalPrice,
      original_price: price,
      discount_percent: disc,
      currency: product.currency || 'SYP',
      provider_name: providerName || product.provider_name,
      qty: 1,
    });
  }
  saveCart(cart);
}

export function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find((x) => x.id === id);
  if (!item) return;
  if (qty <= 0) {
    saveCart(cart.filter((x) => x.id !== id));
  } else {
    item.qty = qty;
    saveCart(cart);
  }
}

export function removeFromCart(id) {
  saveCart(getCart().filter((x) => x.id !== id));
}

export function clearCart() { saveCart([]); }

export function cartTotals() {
  const cart = getCart();
  const count = cart.reduce((sum, x) => sum + x.qty, 0);
  const subtotal = cart.reduce((sum, x) => sum + (x.original_price || x.price) * x.qty, 0);
  const total = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  const discount = subtotal - total;
  return { count, subtotal, total, discount, currency: cart[0]?.currency || 'SYP' };
}

export function getCartByProvider() {
  const cart = getCart();
  const map = {};
  for (const item of cart) {
    const p = item.provider_name || 'unknown';
    if (!map[p]) map[p] = [];
    map[p].push(item);
  }
  return map;
}
