// Funciones de renderizado y utilidades de interfaz (toasts, diálogos, modales).

import { CATEGORIES, STATES, STATE_META } from './data.js';

const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function formatQuantity(quantity) {
  if (!quantity || !quantity.amount) return '';
  return `${quantity.amount} ${quantity.unit}`;
}

export function groupByCategory(products) {
  const groups = CATEGORIES.map((cat) => ({
    category: cat,
    products: products.filter((p) => p.categoryId === cat.id),
  }));
  return groups.filter((g) => g.products.length > 0);
}

// --- Toasts ---------------------------------------------------------------

export function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast${type !== 'default' ? ` toast--${type}` : ''}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2600);
}

// --- Confirm dialog ---------------------------------------------------------

export function confirmDialog(message, { title = 'Confirmar', acceptLabel = 'Confirmar' } = {}) {
  const overlay = document.getElementById('confirmModalOverlay');
  const titleEl = document.getElementById('confirmModalTitle');
  const messageEl = document.getElementById('confirmModalMessage');
  const acceptBtn = document.getElementById('btnConfirmAccept');
  const cancelBtn = document.getElementById('btnConfirmCancel');

  titleEl.textContent = title;
  messageEl.textContent = message;
  acceptBtn.textContent = acceptLabel;
  overlay.hidden = false;

  return new Promise((resolve) => {
    function cleanup(result) {
      overlay.hidden = true;
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onAccept() { cleanup(true); }
    function onCancel() { cleanup(false); }
    acceptBtn.addEventListener('click', onAccept);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// --- Renderizado: Inventario / Configuración (tarjetas con selector de estado) ---

export function renderProductCards(container, products, { showStateSelector, onStateChange, onEdit, onDelete }) {
  container.innerHTML = '';

  if (products.length === 0) {
    container.appendChild(renderEmptyState('📭', 'No hay productos en esta sección todavía.'));
    return;
  }

  const groups = groupByCategory(products);
  for (const group of groups) {
    const section = document.createElement('div');
    section.className = 'category-group';

    const header = document.createElement('div');
    header.className = 'category-group__header';
    header.innerHTML = `<span aria-hidden="true">${group.category.icon}</span> ${group.category.label} <span class="category-group__count">(${group.products.length})</span>`;
    section.appendChild(header);

    for (const product of group.products) {
      section.appendChild(renderProductCard(product, group.category, { showStateSelector, onStateChange, onEdit, onDelete }));
    }
    container.appendChild(section);
  }
}

function renderProductCard(product, category, { showStateSelector, onStateChange, onEdit, onDelete }) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.setProperty('--cat-color', category.color);

  const top = document.createElement('div');
  top.className = 'product-card__top';

  const nameWrap = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'product-card__name';
  name.textContent = product.name;
  nameWrap.appendChild(name);

  const qtyText = formatQuantity(product.quantity);
  if (qtyText) {
    const qty = document.createElement('div');
    qty.className = 'product-card__qty';
    qty.textContent = qtyText;
    nameWrap.appendChild(qty);
  }
  top.appendChild(nameWrap);

  if (onEdit || onDelete) {
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    if (onEdit) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn';
      editBtn.setAttribute('aria-label', `Editar ${product.name}`);
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => onEdit(product));
      actions.appendChild(editBtn);
    }
    if (onDelete) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'icon-btn';
      delBtn.setAttribute('aria-label', `Eliminar ${product.name}`);
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => onDelete(product));
      actions.appendChild(delBtn);
    }
    top.appendChild(actions);
  }

  card.appendChild(top);

  if (showStateSelector) {
    const selector = document.createElement('div');
    selector.className = 'state-selector';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', `Estado de ${product.name}`);

    for (const stateKey of Object.values(STATES)) {
      const meta = STATE_META[stateKey];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'state-btn';
      btn.dataset.state = stateKey;
      if (product.state === stateKey) btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', String(product.state === stateKey));
      btn.innerHTML = `<span aria-hidden="true">${meta.icon}</span><span>${meta.label}</span>`;
      btn.addEventListener('click', () => onStateChange(product.id, stateKey));
      selector.appendChild(btn);
    }
    card.appendChild(selector);
  }

  return card;
}

export function renderEmptyState(icon, message) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = `<span class="empty-state__icon" aria-hidden="true">${icon}</span><p>${message}</p>`;
  return wrap;
}

// --- Renderizado: Lista de compras / Modo supermercado (filas con check) ---

export function renderCheckList(container, products, { onToggle, groupByCategoryEnabled = true }) {
  container.innerHTML = '';

  if (products.length === 0) {
    container.appendChild(
      renderEmptyState('🎉', 'No tienes productos pendientes por comprar.')
    );
    return;
  }

  if (!groupByCategoryEnabled) {
    for (const product of products) {
      container.appendChild(renderCheckRow(product, categoryById[product.categoryId], onToggle));
    }
    return;
  }

  const groups = groupByCategory(products);
  for (const group of groups) {
    const section = document.createElement('div');
    section.className = 'category-group';
    const header = document.createElement('div');
    header.className = 'category-group__header';
    header.innerHTML = `<span aria-hidden="true">${group.category.icon}</span> ${group.category.label}`;
    section.appendChild(header);

    for (const product of group.products) {
      section.appendChild(renderCheckRow(product, group.category, onToggle));
    }
    container.appendChild(section);
  }
}

function renderCheckRow(product, category, onToggle) {
  const row = document.createElement('div');
  row.className = 'check-row';
  if (product.state === STATES.COMPRADO) row.classList.add('is-done');
  row.style.setProperty('--cat-color', category.color);
  row.setAttribute('role', 'checkbox');
  row.setAttribute('aria-checked', String(product.state === STATES.COMPRADO));
  row.setAttribute('tabindex', '0');
  row.setAttribute('aria-label', `${product.name}, marcar como comprado`);

  const box = document.createElement('div');
  box.className = 'check-row__box';
  box.textContent = product.state === STATES.COMPRADO ? '✓' : '';

  const body = document.createElement('div');
  body.className = 'check-row__body';
  const name = document.createElement('div');
  name.className = 'check-row__name';
  name.textContent = product.name;
  body.appendChild(name);

  const qtyText = formatQuantity(product.quantity);
  const meta = document.createElement('div');
  meta.className = 'check-row__meta';
  meta.textContent = qtyText ? `${category.icon} ${category.label} · ${qtyText}` : `${category.icon} ${category.label}`;
  body.appendChild(meta);

  row.appendChild(box);
  row.appendChild(body);

  const trigger = () => onToggle(product.id);
  row.addEventListener('click', trigger);
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger();
    }
  });

  return row;
}

// --- Renderizado: Resumen para el supermercado ---

export function renderSummary(container, products) {
  container.innerHTML = '';
  const groups = groupByCategory(products);

  for (const group of groups) {
    const section = document.createElement('div');
    section.className = 'summary-category';
    const title = document.createElement('div');
    title.className = 'summary-category__title';
    title.textContent = `${group.category.icon} ${group.category.label}`;
    section.appendChild(title);

    for (const product of group.products) {
      const row = document.createElement('div');
      row.className = 'summary-row';
      if (product.state === STATES.COMPRADO) row.classList.add('is-done');

      const box = document.createElement('div');
      box.className = 'summary-row__box';
      box.textContent = product.state === STATES.COMPRADO ? '✓' : '';

      const name = document.createElement('div');
      name.className = 'summary-row__name';
      name.textContent = product.name;

      const qty = document.createElement('div');
      qty.className = 'summary-row__qty';
      qty.textContent = formatQuantity(product.quantity);

      row.appendChild(box);
      row.appendChild(name);
      row.appendChild(qty);
      section.appendChild(row);
    }
    container.appendChild(section);
  }
}

export function populateCategorySelect(selectEl) {
  selectEl.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
}
