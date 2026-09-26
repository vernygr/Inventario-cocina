// Sincronización opcional entre dispositivos mediante Firebase Realtime Database.
// Si no se completa firebaseConfig, la app sigue funcionando 100% local (sin romperse).
//
// Cómo funciona sin cuentas de usuario: cada "hogar" tiene un código corto
// (ej. CASA-7X2K). Todos los dispositivos que usan el mismo código comparten
// el mismo inventario en tiempo real.

const firebaseConfig = {
  apiKey: 'AIzaSyArsTV8dtTHvtxGx8kwcYXV7aToOdB-HC8',
  authDomain: 'inventario-cocina-6cec4.firebaseapp.com',
  databaseURL: 'https://inventario-cocina-6cec4-default-rtdb.firebaseio.com',
  projectId: 'inventario-cocina-6cec4',
};

const FIREBASE_SDK_VERSION = '10.13.2';
const CODE_STORAGE_KEY = 'inventario-hogar-codigo-v1';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (0/O, 1/I)

let dbPromise = null;
let detachListener = null;

export function isSyncConfigured() {
  return Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith('TU_');
}

export function getHouseholdCode() {
  return window.localStorage.getItem(CODE_STORAGE_KEY);
}

export function setHouseholdCode(code) {
  window.localStorage.setItem(CODE_STORAGE_KEY, code);
}

export function generateHouseholdCode() {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `CASA-${suffix}`;
}

async function getDatabase() {
  if (!isSyncConfigured()) return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp } = await import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`
      );
      const { getDatabase: getDb } = await import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-database.js`
      );
      const app = initializeApp(firebaseConfig);
      return getDb(app);
    })();
  }
  return dbPromise;
}

export async function pushState(stateObj) {
  const code = getHouseholdCode();
  const database = await getDatabase();
  if (!code || !database) return;
  const { ref, set } = await import(
    `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-database.js`
  );
  await set(ref(database, `hogares/${code}`), stateObj);
}

// Escucha cambios remotos del código dado. Si el código no tiene datos todavía
// (hogar nuevo o código recién creado), invoca onEmpty para publicar el estado local.
export async function listenHousehold(code, { onRemoteChange, onEmpty }) {
  const database = await getDatabase();
  if (!database) return () => {};

  const { ref, onValue } = await import(
    `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-database.js`
  );

  if (detachListener) {
    detachListener();
    detachListener = null;
  }

  const dbRef = ref(database, `hogares/${code}`);
  const unsubscribe = onValue(dbRef, (snapshot) => {
    const value = snapshot.val();
    if (value) {
      onRemoteChange(value);
    } else if (onEmpty) {
      onEmpty();
    }
  });

  detachListener = unsubscribe;
  return unsubscribe;
}
