// Punto de entrada: conecta el estado, la UI y los eventos del usuario.

import { STATES } from './data.js';
import {
  subscribe,
  setOnLocalMutation,
  replaceState,
  getState,
  getAllProducts,
  getShoppingItems,
  getShoppingProgress,
  addProduct,
  updateProduct,
  deleteProduct,
  setProductState,
  toggleBought,
  isProductActive,
  finalizePurchaseCycle,
} from './state.js';
import {
  showToast,
  confirmDialog,
  renderProductCards,
  renderCheckList,
  renderSummary,
  populateCategorySelect,
} from './ui.js';
import {
  isSyncConfigured,
  getHouseholdCode,
  setHouseholdCode,
  generateHouseholdCode,
  pushState,
  listenHousehold,
} from './sync.js';

// --- Elementos ---------------------------------------------------------

const cycleLabelEl = document.getElementById('cycleLabel');

const views = {
  inventario: document.getElementById('view-inventario'),
  lista: document.getElementById('view-lista'),
  super: document.getElementById('view-super'),
  config: document.getElementById('view-config'),
};
const navButtons = document.querySelectorAll('.bottom-nav__item');

const inventarioList = document.getElementById('inventarioList');
const listaList = document.getElementById('listaList');
const superList = document.getElementById('superList');
const configList = document.getElementById('configList');

const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const btnFinalizarCompra = document.getElementById('btnFinalizarCompra');
const btnGenerarResumen = document.getElementById('btnGenerarResumen');
const btnNuevaCompra = document.getElementById('btnNuevaCompra');
const btnAgregarProducto = document.getElementById('btnAgregarProducto');

const resumenOverlay = document.getElementById('resumenOverlay');
const resumenBody = document.getElementById('resumenBody');
const btnCloseResumen = document.getElementById('btnCloseResumen');

const productModalOverlay = document.getElementById('productModalOverlay');
const productModalTitle = document.getElementById('productModalTitle');
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productCategorySelect = document.getElementById('productCategory');
const productAmountInput = document.getElementById('productAmount');
const productUnitInput = document.getElementById('productUnit');
const productFormError = document.getElementById('productFormError');
const btnCloseProductModal = document.getElementById('btnCloseProductModal');

const syncStatus = document.getElementById('syncStatus');
const syncConfigured = document.getElementById('syncConfigured');
const syncCodeDisplay = document.getElementById('syncCodeDisplay');
const btnCopyCode = document.getElementById('btnCopyCode');
const joinCodeInput = document.getElementById('joinCodeInput');
const btnJoinCode = document.getElementById('btnJoinCode');

populateCategorySelect(productCategorySelect);

// --- Navegación ---------------------------------------------------------

function setActiveView(name) {
  Object.entries(views).forEach(([key, section]) => {
    section.hidden = key !== name;
  });
  navButtons.forEach((btn) => {
    const isActive = btn.dataset.nav === name;
    btn.classList.toggle('is-active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveView(btn.dataset.nav));
});

// --- Render principal -----------------------------------------------------

function render() {
  const state = getState();
  cycleLabelEl.textContent = `📅 Próxima compra: ${state.cycle.label}`;

  renderProductCards(inventarioList, getAllProducts(), {
    showStateSelector: true,
    onStateChange: (id, newState) => setProductState(id, newState),
  });

  renderCheckList(listaList, getShoppingItems(), {
    onToggle: (id) => toggleBought(id),
  });

  const progress = getShoppingProgress();
  progressText.textContent = `${progress.done} de ${progress.total} productos comprados`;
  progressFill.style.width = progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%';
  btnFinalizarCompra.disabled = progress.total === 0;

  renderCheckList(superList, getShoppingItems(), {
    onToggle: (id) => toggleBought(id),
    groupByCategoryEnabled: false,
  });

  renderProductCards(configList, getAllProducts(), {
    showStateSelector: false,
    onEdit: openEditProductModal,
    onDelete: handleDeleteProduct,
  });
}

subscribe(render);
render();

// --- Modal: agregar / editar producto ---------------------------------

function openAddProductModal() {
  productModalTitle.textContent = 'Agregar producto';
  productIdInput.value = '';
  productForm.reset();
  productCategorySelect.value = 'otros';
  productFormError.hidden = true;
  productModalOverlay.hidden = false;
  productNameInput.focus();
}

function openEditProductModal(product) {
  productModalTitle.textContent = 'Editar producto';
  productIdInput.value = product.id;
  productNameInput.value = product.name;
  productCategorySelect.value = product.categoryId;
  productAmountInput.value = product.quantity ? product.quantity.amount : '';
  productUnitInput.value = product.quantity ? product.quantity.unit : '';
  productFormError.hidden = true;
  productModalOverlay.hidden = false;
  productNameInput.focus();
}

function closeProductModal() {
  productModalOverlay.hidden = true;
}

btnAgregarProducto.addEventListener('click', openAddProductModal);
btnCloseProductModal.addEventListener('click', closeProductModal);
productModalOverlay.addEventListener('click', (e) => {
  if (e.target === productModalOverlay) closeProductModal();
});

productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const payload = {
    name: productNameInput.value,
    categoryId: productCategorySelect.value,
    amount: productAmountInput.value,
    unit: productUnitInput.value,
  };

  const id = productIdInput.value;
  const result = id ? updateProduct(id, payload) : addProduct(payload);

  if (!result.ok) {
    productFormError.textContent = result.error;
    productFormError.hidden = false;
    return;
  }

  closeProductModal();
  showToast(id ? 'Producto actualizado.' : 'Producto agregado a la lista.', 'success');
});

async function handleDeleteProduct(product) {
  const isActive = isProductActive(product.id);
  const message = isActive
    ? `"${product.name}" forma parte de tu lista de compras actual. ¿Deseas eliminarlo de todas formas?`
    : `¿Deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`;

  const confirmed = await confirmDialog(message, { title: 'Eliminar producto', acceptLabel: 'Eliminar' });
  if (!confirmed) return;

  deleteProduct(product.id);
  showToast('Producto eliminado.');
}

// --- Resumen para el supermercado ---------------------------------------

btnGenerarResumen.addEventListener('click', () => {
  const items = getShoppingItems();
  if (items.length === 0) {
    showToast('No hay productos para comprar todavía. Marca productos como "Comprar" primero.', 'error');
    return;
  }
  renderSummary(resumenBody, items);
  resumenOverlay.hidden = false;
});

btnCloseResumen.addEventListener('click', () => { resumenOverlay.hidden = true; });
resumenOverlay.addEventListener('click', (e) => {
  if (e.target === resumenOverlay) resumenOverlay.hidden = true;
});

// --- Ciclo de compra ------------------------------------------------------

btnFinalizarCompra.addEventListener('click', async () => {
  const progress = getShoppingProgress();
  if (progress.total === 0) {
    showToast('No hay productos pendientes en esta compra.', 'error');
    return;
  }
  const confirmed = await confirmDialog(
    'Los productos marcados como comprados volverán a estar disponibles en casa. ¿Finalizar esta compra?',
    { title: 'Finalizar compra', acceptLabel: 'Finalizar' }
  );
  if (!confirmed) return;

  finalizePurchaseCycle();
  showToast('¡Compra finalizada! Buen provecho. 🎉', 'success');
  setActiveView('inventario');
});

btnNuevaCompra.addEventListener('click', async () => {
  const confirmed = await confirmDialog(
    'Se iniciará un nuevo ciclo de compra: los productos comprados volverán a estado disponible. Tus productos habituales no se pierden.',
    { title: 'Nueva compra', acceptLabel: 'Iniciar' }
  );
  if (!confirmed) return;

  finalizePurchaseCycle();
  showToast('Nuevo ciclo de compra iniciado.', 'success');
});

// --- Sincronización entre dispositivos ------------------------------------

async function connectToHousehold(code) {
  setHouseholdCode(code);
  syncCodeDisplay.textContent = code;
  await listenHousehold(code, {
    onRemoteChange: (remoteState) => replaceState(remoteState),
    onEmpty: () => pushState(getState()),
  });
}

async function initSync() {
  if (!isSyncConfigured()) {
    syncStatus.textContent = 'La sincronización no está configurada todavía (ver js/sync.js).';
    syncConfigured.hidden = true;
    return;
  }

  syncConfigured.hidden = false;
  setOnLocalMutation((currentState) => { pushState(currentState); });

  let code = getHouseholdCode();
  if (!code) {
    code = generateHouseholdCode();
  }

  await connectToHousehold(code);
  syncStatus.textContent = 'Sincronizado. Los cambios se reflejan automáticamente en tus otros dispositivos.';
}

btnCopyCode.addEventListener('click', async () => {
  const code = syncCodeDisplay.textContent;
  try {
    await navigator.clipboard.writeText(code);
    showToast('Código copiado.', 'success');
  } catch {
    showToast('No se pudo copiar automáticamente. Copia el código manualmente.', 'error');
  }
});

btnJoinCode.addEventListener('click', async () => {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    showToast('Escribe un código válido.', 'error');
    return;
  }

  const confirmed = await confirmDialog(
    `Tu inventario en este dispositivo será reemplazado por el del código "${code}". ¿Deseas continuar?`,
    { title: 'Unirse a otro código', acceptLabel: 'Unirme' }
  );
  if (!confirmed) return;

  await connectToHousehold(code);
  joinCodeInput.value = '';
  showToast('Conectado al nuevo código de hogar.', 'success');
});

initSync();
