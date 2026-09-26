// Capa de persistencia sobre localStorage. Aísla el resto de la app
// de los detalles de serialización y de posibles fallos de almacenamiento.

import { DEFAULT_PRODUCTS } from './data.js';

const STORAGE_KEY = 'inventario-hogar-v1';
const SCHEMA_VERSION = 1;

function getNextCycleLabel(date = new Date()) {
  const day = date.getDate();
  const target = day <= 15
    ? new Date(date.getFullYear(), date.getMonth(), 15)
    : new Date(date.getFullYear(), date.getMonth(), 30);
  const mes = target.toLocaleDateString('es-ES', { month: 'long' });
  return `Compra del ${target.getDate()} de ${mes}`;
}

function createInitialState() {
  return {
    version: SCHEMA_VERSION,
    products: DEFAULT_PRODUCTS.map((p) => ({ ...p, quantity: p.quantity ? { ...p.quantity } : null })),
    cycle: {
      label: getNextCycleLabel(),
      startedAt: new Date().toISOString(),
    },
  };
}

function isValidState(state) {
  return (
    state &&
    typeof state === 'object' &&
    Array.isArray(state.products) &&
    state.cycle &&
    typeof state.cycle.label === 'string'
  );
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw);
    if (!isValidState(parsed)) {
      console.warn('Datos guardados con formato inesperado. Se restauran los valores predeterminados.');
      return createInitialState();
    }
    return parsed;
  } catch (error) {
    console.warn('No se pudo leer la información guardada. Se restauran los valores predeterminados.', error);
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('No se pudo guardar la información en este dispositivo.', error);
    return false;
  }
}

export { getNextCycleLabel };
