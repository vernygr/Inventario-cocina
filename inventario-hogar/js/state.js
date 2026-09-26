// Estado en memoria de la aplicación y reglas de negocio.
// Toda mutación pasa por aquí, se persiste y notifica a la UI.

import { STATES } from './data.js';
import { loadState, saveState, getNextCycleLabel } from './storage.js';

let state = loadState();
const listeners = new Set();

function notify() {
  saveState(state);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// --- Consultas derivadas -----------------------------------------------

export function getAllProducts() {
  return state.products;
}

export function getShoppingItems() {
  return state.products.filter((p) => p.state === STATES.COMPRAR || p.state === STATES.COMPRADO);
}

export function getShoppingProgress() {
  const items = getShoppingItems();
  const total = items.length;
  const done = items.filter((p) => p.state === STATES.COMPRADO).length;
  return { done, total };
}

// --- Mutaciones -----------------------------------------------------------

export function addProduct({ name, categoryId, amount, unit }) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'El producto necesita un nombre.' };
  }
  if (trimmed.length > 60) {
    return { ok: false, error: 'El nombre es demasiado largo (máximo 60 caracteres).' };
  }
  const duplicate = state.products.some(
    (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { ok: false, error: 'Ya existe un producto con ese nombre.' };
  }

  let quantity = null;
  if (amount !== null && amount !== undefined && amount !== '') {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return { ok: false, error: 'La cantidad debe ser un número mayor a 0.' };
    }
    quantity = { amount: numeric, unit: (unit || 'unidades').trim() || 'unidades' };
  }

  const product = {
    id: makeId(),
    name: trimmed,
    categoryId: categoryId || 'otros',
    state: STATES.COMPRAR,
    quantity,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  state = { ...state, products: [...state.products, product] };
  notify();
  return { ok: true, product };
}

export function updateProduct(id, { name, categoryId, amount, unit }) {
  const existing = state.products.find((p) => p.id === id);
  if (!existing) return { ok: false, error: 'El producto ya no existe.' };

  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'El producto necesita un nombre.' };
  }
  if (trimmed.length > 60) {
    return { ok: false, error: 'El nombre es demasiado largo (máximo 60 caracteres).' };
  }
  const duplicate = state.products.some(
    (p) => p.id !== id && p.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { ok: false, error: 'Ya existe un producto con ese nombre.' };
  }

  let quantity = null;
  if (amount !== null && amount !== undefined && amount !== '') {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return { ok: false, error: 'La cantidad debe ser un número mayor a 0.' };
    }
    quantity = { amount: numeric, unit: (unit || 'unidades').trim() || 'unidades' };
  }

  state = {
    ...state,
    products: state.products.map((p) =>
      p.id === id ? { ...p, name: trimmed, categoryId: categoryId || 'otros', quantity } : p
    ),
  };
  notify();
  return { ok: true };
}

export function deleteProduct(id) {
  state = { ...state, products: state.products.filter((p) => p.id !== id) };
  notify();
  return { ok: true };
}

export function isProductActive(id) {
  const product = state.products.find((p) => p.id === id);
  return !!product && (product.state === STATES.COMPRAR || product.state === STATES.COMPRADO);
}

export function setProductState(id, newState) {
  if (!Object.values(STATES).includes(newState)) return;
  state = {
    ...state,
    products: state.products.map((p) => (p.id === id ? { ...p, state: newState } : p)),
  };
  notify();
}

export function toggleBought(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;
  const next = product.state === STATES.COMPRADO ? STATES.COMPRAR : STATES.COMPRADO;
  setProductState(id, next);
}

// Cierra el ciclo de compra actual: los productos comprados vuelven a estar
// disponibles en casa, y se calcula la etiqueta del siguiente ciclo (día 15/30).
export function finalizePurchaseCycle() {
  state = {
    ...state,
    products: state.products.map((p) =>
      p.state === STATES.COMPRADO ? { ...p, state: STATES.DISPONIBLE } : p
    ),
    cycle: {
      label: getNextCycleLabel(new Date()),
      startedAt: new Date().toISOString(),
    },
  };
  notify();
}
