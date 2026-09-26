// Catálogo de categorías y productos por defecto de la aplicación.

export const CATEGORIES = [
  { id: 'alimentos', label: 'Alimentos', icon: '🥫', color: '#f59e0b' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤', color: '#38bdf8' },
  { id: 'higiene', label: 'Higiene personal', icon: '🧼', color: '#a78bfa' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧹', color: '#34d399' },
  { id: 'hogar', label: 'Hogar', icon: '🏠', color: '#fb7185' },
  { id: 'otros', label: 'Otros', icon: '📦', color: '#94a3b8' },
];

export const STATES = {
  DISPONIBLE: 'disponible',
  COMPRAR: 'comprar',
  COMPRADO: 'comprado',
};

export const STATE_META = {
  [STATES.DISPONIBLE]: { label: 'Disponible', icon: '🏠', color: '#64748b' },
  [STATES.COMPRAR]: { label: 'Comprar', icon: '🛒', color: '#ea580c' },
  [STATES.COMPRADO]: { label: 'Comprado', icon: '✅', color: '#16a34a' },
};

// id fijo para poder distinguir productos "de fábrica" de los agregados por el usuario.
function d(id, name, categoryId, state, amount, unit) {
  return {
    id,
    name,
    categoryId,
    state,
    quantity: amount ? { amount, unit: unit || 'unidades' } : null,
    isDefault: true,
    createdAt: new Date().toISOString(),
  };
}

export const DEFAULT_PRODUCTS = [
  // Alimentos
  d('def-001', 'Arroz', 'alimentos', STATES.COMPRAR, 2, 'kg'),
  d('def-002', 'Pasta', 'alimentos', STATES.DISPONIBLE),
  d('def-003', 'Aceite de oliva', 'alimentos', STATES.DISPONIBLE),
  d('def-004', 'Azúcar', 'alimentos', STATES.DISPONIBLE),
  d('def-005', 'Sal', 'alimentos', STATES.DISPONIBLE),
  d('def-006', 'Harina', 'alimentos', STATES.DISPONIBLE),
  d('def-007', 'Huevos', 'alimentos', STATES.COMPRAR, 12, 'unidades'),
  d('def-008', 'Pan de molde', 'alimentos', STATES.DISPONIBLE),

  // Bebidas
  d('def-009', 'Agua embotellada', 'bebidas', STATES.DISPONIBLE),
  d('def-010', 'Leche', 'bebidas', STATES.COMPRAR, 4, 'unidades'),
  d('def-011', 'Jugo de naranja', 'bebidas', STATES.DISPONIBLE),
  d('def-012', 'Café', 'bebidas', STATES.DISPONIBLE),
  d('def-013', 'Té', 'bebidas', STATES.DISPONIBLE),

  // Higiene personal
  d('def-014', 'Papel higiénico', 'higiene', STATES.COMPRAR, 2, 'paquetes'),
  d('def-015', 'Jabón de manos', 'higiene', STATES.DISPONIBLE),
  d('def-016', 'Shampoo', 'higiene', STATES.DISPONIBLE),
  d('def-017', 'Pasta dental', 'higiene', STATES.DISPONIBLE),
  d('def-018', 'Desodorante', 'higiene', STATES.DISPONIBLE),
  d('def-019', 'Toallitas húmedas', 'higiene', STATES.DISPONIBLE),

  // Limpieza
  d('def-020', 'Detergente para ropa', 'limpieza', STATES.COMPRAR, 1, 'unidad'),
  d('def-021', 'Lavavajillas', 'limpieza', STATES.DISPONIBLE),
  d('def-022', 'Cloro', 'limpieza', STATES.DISPONIBLE),
  d('def-023', 'Papel de cocina', 'limpieza', STATES.DISPONIBLE),
  d('def-024', 'Bolsas de basura', 'limpieza', STATES.DISPONIBLE),
  d('def-025', 'Limpiador multiusos', 'limpieza', STATES.DISPONIBLE),

  // Hogar
  d('def-026', 'Pilas AA', 'hogar', STATES.COMPRAR, 4, 'unidades'),
  d('def-027', 'Focos / bombillas', 'hogar', STATES.DISPONIBLE),
  d('def-028', 'Velas', 'hogar', STATES.DISPONIBLE),
  d('def-029', 'Fósforos', 'hogar', STATES.DISPONIBLE),

  // Otros
  d('def-030', 'Alimento para mascota', 'otros', STATES.DISPONIBLE),
  d('def-031', 'Filtros de café', 'otros', STATES.DISPONIBLE),
  d('def-032', 'Bolsas ziploc', 'otros', STATES.DISPONIBLE),
];
