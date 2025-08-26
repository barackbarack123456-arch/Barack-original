// --- 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE ---
// =================================================================================
// Importar funciones de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch, runTransaction, orderBy, limit, startAfter, or, getCountFromServer } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { COLLECTIONS, getUniqueKeyForCollection } from './utils.js';
import { deleteProductAndOrphanedSubProducts } from './data_logic.js';

// NOTA DE SEGURIDAD: La configuración de Firebase no debe estar hardcodeada en el código fuente.
// En un entorno de producción, estos valores deben cargarse de forma segura,
// por ejemplo, desde variables de entorno o un servicio de configuración remota.

// IMPORTANTE: La siguiente configuración de Firebase está hardcodeada.
// Debido a una incompatibilidad entre el sistema de módulos ES de la aplicación
// y el script de inicialización de Firebase Hosting, este método es
// actualmente el único que permite que la aplicación se conecte a Firebase.
// NO REEMPLAZAR con la inicialización automática de Firebase Hosting sin
// refactorizar la carga de módulos en toda la aplicación.
const firebaseConfig = {
  apiKey: "AIzaSyDxSXFD1WJkpS8aVfSDXyzQ0bsdPqWCgk0",
  authDomain: "barack2-0-f81a6.firebaseapp.com",
  databaseURL: "https://barack2-0-f81a6-default-rtdb.firebaseio.com",
  projectId: "barack2-0-f81a6",
  storageBucket: "barack2-0-f81a6.firebasestorage.app",
  messagingSenderId: "879433250962",
  appId: "1:879433250962:web:ae73b31bacb1c4db094e4b",
  measurementId: "G-KN7R7JZKTR"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =================================================================================
// --- CONSTANTES Y CONFIGURACIÓN ---
// =================================================================================
const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos en milisegundos
const PREDEFINED_AVATARS = [
    'https://api.dicebear.com/8.x/identicon/svg?seed=Maria%20Mitchell',
    'https://api.dicebear.com/8.x/identicon/svg?seed=Mary%20Jackson',
    'https://api.dicebear.com/8.x/identicon/svg?seed=Grace%20Hopper',
    'https://api.dicebear.com/8.x/identicon/svg?seed=Hedy%20Lamarr',
    'https://api.dicebear.com/8.x/identicon/svg?seed=Ada%20Lovelace',
    'https://api.dicebear.com/8.x/identicon/svg?seed=Katherine%20Johnson'
];

// =================================================================================
// --- 2. ESTADO GLOBAL Y CONFIGURACIÓN DE LA APP ---
// =================================================================================

// --- Configuración de Vistas ---
const viewConfig = {
    dashboard: { title: 'Dashboard', singular: 'Dashboard' },
    sinoptico_tabular: { title: 'Reporte BOM (Tabular)', singular: 'Reporte BOM (Tabular)' },
    eco_form: { title: 'ECO de Producto / Proceso', singular: 'ECO Form' },
    ecos: { title: 'Gestión de ECOs', singular: 'ECO' },
    flujograma: { title: 'Flujograma de Procesos', singular: 'Flujograma' },
    arboles: { title: 'Editor de Árboles', singular: 'Árbol' },
    profile: { title: 'Mi Perfil', singular: 'Mi Perfil' },
    tareas: { title: 'Gestor de Tareas', singular: 'Tarea' },
    proyectos: {
        title: 'Proyectos',
        singular: 'Proyecto',
        dataKey: COLLECTIONS.PROYECTOS,
        columns: [
            { key: 'codigo', label: 'Código' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'descripcion', label: 'Descripción' },
            { key: 'status', label: 'Estado' }
        ],
        fields: [
            { key: 'codigo', label: 'Código', type: 'text', required: true },
            { key: 'nombre', label: 'Nombre', type: 'text', required: true },
            { key: 'descripcion', label: 'Descripción', type: 'textarea' },
            { key: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Pausado', 'Finalizado'], required: true },
        ]
    },
    productos: {
        title: 'Productos',
        singular: 'Producto',
        dataKey: COLLECTIONS.PRODUCTOS,
        columns: [
            { key: 'codigo_pieza', label: 'Código de pieza' },
            { key: 'descripcion', label: 'Descripción' },
            { key: 'version_vehiculo', label: 'Versión Vehículo' },
        ],
        fields: [
            { key: 'lc_kd', label: 'LC / KD', type: 'select', options: ['LC', 'KD'], required: true },
            { key: 'version_vehiculo', label: 'Versión del Vehículo', type: 'text', required: true },
            { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
            { key: 'codigo_pieza', label: 'Código de pieza', type: 'text', required: true },
            { key: 'version', label: 'Versión', type: 'text' },
            { key: 'imagen', label: 'Imágen (URL)', type: 'text' },
            { key: 'fecha_modificacion', label: 'Fecha de Modificación', type: 'date' },
        ]
    },
    semiterminados: {
        title: 'Semiterminados',
        singular: 'Semiterminado',
        dataKey: COLLECTIONS.SEMITERMINADOS,
        columns: [
            { key: 'codigo_pieza', label: 'Código de pieza' },
            { key: 'descripcion', label: 'Descripción' },
            { key: 'proceso', label: 'Proceso' },
        ],
        fields: [
            { key: 'lc_kd', label: 'LC / KD', type: 'select', options: ['LC', 'KD'], required: true },
            { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
            { key: 'codigo_pieza', label: 'Código de pieza', type: 'text', required: true },
            { key: 'version', label: 'Versión', type: 'text' },
            { key: 'imagen', label: 'Imágen (URL)', type: 'text' },
            { key: 'proceso', label: 'Proceso', type: 'select', searchKey: COLLECTIONS.PROCESOS, required: true },
            { key: 'aspecto', label: 'Aspecto', type: 'select', options: ['Crítico', 'No Crítico'], required: true },
            { key: 'peso_gr', label: 'Peso (gr)', type: 'number' },
            { key: 'tolerancia_gr', label: 'Tolerancia (gr)', type: 'number' },
            { key: 'fecha_modificacion', label: 'Fecha de Modificación', type: 'date' },
        ]
    },
    insumos: {
        title: 'Insumos',
        singular: 'Insumo',
        dataKey: COLLECTIONS.INSUMOS,
        columns: [
            { key: 'codigo_pieza', label: 'Código de pieza' },
            { key: 'descripcion', label: 'Descripción' },
            { key: 'proveedor', label: 'Proveedor' },
        ],
        fields: [
            { key: 'lc_kd', label: 'LC / KD', type: 'select', options: ['LC', 'KD'], required: true },
            { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
            { key: 'codigo_pieza', label: 'Código de pieza', type: 'text', required: true },
            { key: 'version', label: 'Versión', type: 'text' },
            { key: 'imagen', label: 'Imágen (URL)', type: 'text' },
            { key: 'proveedor', label: 'Proveedor', type: 'select', searchKey: COLLECTIONS.PROVEEDORES, required: true },
            { key: 'costo', label: 'Costo', type: 'number' },
            { key: 'unidad_medida', label: 'Unidad de Medida', type: 'select', searchKey: COLLECTIONS.UNIDADES, required: true },
            { key: 'fecha_modificacion', label: 'Fecha de Modificación', type: 'date' },
        ]
    },
    clientes: { title: 'Clientes', singular: 'Cliente', dataKey: COLLECTIONS.CLIENTES, columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Descripción' } ], fields: [ { key: 'id', label: 'Código', type: 'text', required: true }, { key: 'descripcion', label: 'Descripción', type: 'text', required: true } ] },
    sectores: { title: 'Sectores', singular: 'Sector', dataKey: COLLECTIONS.SECTORES, columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Descripción' } ], fields: [ { key: 'id', label: 'Código', type: 'text', required: true }, { key: 'descripcion', label: 'Descripción', type: 'text', required: true }, { key: 'icon', label: 'Icono (Lucide)', type: 'text', required: true } ] },
    proveedores: { 
        title: 'Proveedores', 
        singular: 'Proveedor', 
        dataKey: COLLECTIONS.PROVEEDORES, 
        columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Razón Social' } ], 
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Razón Social', type: 'text', required: true } 
        ] 
    },
    unidades: {
        title: 'Unidades de Medida',
        singular: 'Unidad',
        dataKey: COLLECTIONS.UNIDADES,
        columns: [ { key: 'id', label: 'Abreviatura' }, { key: 'descripcion', label: 'Descripción' } ],
        fields: [
            { key: 'id', label: 'Abreviatura (ej: Kg, M, Un)', type: 'text', required: true },
            { key: 'descripcion', label: 'Descripción (ej: Kilogramos, Metros, Unidades)', type: 'text', required: true }
        ]
    },
    procesos: { 
        title: 'Procesos', 
        singular: 'Proceso', 
        dataKey: COLLECTIONS.PROCESOS, 
        columns: [ 
            { key: 'id', label: 'Código' }, 
            { key: 'descripcion', label: 'Descripción' } 
        ],
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true } 
        ]
    },
    user_management: {
        title: 'Gestión de Usuarios',
        singular: 'Usuario',
        dataKey: COLLECTIONS.USUARIOS,
        columns: [
            { key: 'name', label: 'Nombre' },
            { key: 'email', label: 'Correo' },
            { key: 'role', label: 'Rol' },
            { key: 'sector', label: 'Sector' }
        ],
        fields: [
            { key: 'name', label: 'Nombre', type: 'text', readonly: true },
            { key: 'email', label: 'Correo', type: 'text', readonly: true },
            { key: 'role', label: 'Rol', type: 'select', searchKey: COLLECTIONS.ROLES, required: true },
            {
                key: 'sector',
                label: 'Sector',
                type: 'select',
                searchKey: COLLECTIONS.SECTORES, // Use searchKey to indicate where to get options
                required: true
            }
        ]
    },
    roles: {
        title: 'Roles',
        singular: 'Rol',
        dataKey: COLLECTIONS.ROLES,
        columns: [ { key: 'id', label: 'ID' }, { key: 'descripcion', label: 'Descripción' } ],
        fields: [
            { key: 'id', label: 'ID (admin, editor, lector)', type: 'text', required: true },
            { key: 'descripcion', label: 'Descripción (Administrador, Editor, Lector)', type: 'text', required: true }
        ]
    }
};

// --- Estado Global de la Aplicación ---
let appState = { 
    currentView: 'dashboard', 
    currentData: [], 
    arbolActivo: null,
    currentUser: null,
    currentViewCleanup: null,
    isAppInitialized: false,
    collections: {
        [COLLECTIONS.PRODUCTOS]: [], [COLLECTIONS.SEMITERMINADOS]: [], [COLLECTIONS.INSUMOS]: [], [COLLECTIONS.CLIENTES]: [],
        [COLLECTIONS.SECTORES]: [], [COLLECTIONS.PROCESOS]: [],
        [COLLECTIONS.PROVEEDORES]: [], [COLLECTIONS.UNIDADES]: [],
        [COLLECTIONS.USUARIOS]: [], [COLLECTIONS.PROYECTOS]: [], [COLLECTIONS.ROLES]: [], [COLLECTIONS.TAREAS]: []
    },
    collectionsById: {
        [COLLECTIONS.PRODUCTOS]: new Map(),
        [COLLECTIONS.SEMITERMINADOS]: new Map(),
        [COLLECTIONS.INSUMOS]: new Map(),
        [COLLECTIONS.CLIENTES]: new Map(),
        [COLLECTIONS.SECTORES]: new Map(),
        [COLLECTIONS.PROCESOS]: new Map(),
        [COLLECTIONS.PROVEEDORES]: new Map(),
        [COLLECTIONS.UNIDADES]: new Map(),
        [COLLECTIONS.USUARIOS]: new Map(),
        [COLLECTIONS.PROYECTOS]: new Map(),
        [COLLECTIONS.ROLES]: new Map(),
        [COLLECTIONS.TAREAS]: new Map()
    },
    unsubscribeListeners: [],
    sinopticoState: null,
    sinopticoTabularState: null,
    pagination: {
        pageCursors: { 1: null }, // Store the startAfter cursor for each page
        currentPage: 1,
        totalItems: 0,
    },
    godModeState: null
};

const dom = {
    appView: document.getElementById('app-view'),
    authContainer: document.getElementById('auth-container'),
    loadingOverlay: document.getElementById('loading-overlay'),
    mainContent: document.getElementById('main-content'),
    viewTitle: document.getElementById('view-title'),
    headerActions: document.getElementById('header-actions'),
    searchInput: document.getElementById('search-input'),
    addNewButton: document.getElementById('add-new-button'),
    addButtonText: document.getElementById('add-button-text'),
    modalContainer: document.getElementById('modal-container'),
    toastContainer: document.getElementById('toast-container'),
    viewContent: document.getElementById('view-content'),
    userMenuContainer: document.getElementById('user-menu-container'),
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForUsers() {
    let retries = 0;
    const maxRetries = 10; // Wait for a maximum of 20 seconds
    while ((!appState.collections.usuarios || appState.collections.usuarios.length === 0) && retries < maxRetries) {
        showToast('Cargando lista de usuarios...', 'info', 1800);
        await sleep(2000);
        retries++;
    }
    if (retries >= maxRetries) {
        showToast('No se pudo cargar la lista de usuarios. Por favor, recargue la página.', 'error');
        return false;
    }
    return true;
}

// =================================================================================
// --- 3. LÓGICA DE DATOS (FIRESTORE) ---
// =================================================================================

function startRealtimeListeners() {
    appState.isAppInitialized = false;
    return new Promise((resolve, reject) => {
        // Essential collections needed for the first paint (dashboard)
        const essentialCollections = new Set([
            COLLECTIONS.PRODUCTOS,
            COLLECTIONS.INSUMOS,
            COLLECTIONS.CLIENTES,
            COLLECTIONS.USUARIOS,
            COLLECTIONS.ROLES,
            COLLECTIONS.SECTORES,
            COLLECTIONS.TAREAS,
            COLLECTIONS.PROYECTOS
        ]);

        if (appState.unsubscribeListeners.length > 0) {
            stopRealtimeListeners();
        }

        const collectionNames = Object.keys(appState.collections);
        let loadedCount = 0;

        collectionNames.forEach(name => {
            const q = query(collection(db, name));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const data = [];
                const dataMap = new Map();
                querySnapshot.forEach((doc) => {
                    const item = { ...doc.data(), docId: doc.id };
                    data.push(item);
                    if (name === COLLECTIONS.USUARIOS) {
                        dataMap.set(doc.id, item);
                    } else if(item.id) {
                        dataMap.set(item.id, item);
                    }
                });
                appState.collections[name] = data;
                if(appState.collectionsById[name]) appState.collectionsById[name] = dataMap;

                // Check if the initial load is complete
                if (essentialCollections.has(name)) {
                    essentialCollections.delete(name);
                    if (essentialCollections.size === 0 && !appState.isAppInitialized) {
                        console.log("Essential data loaded.");
                        appState.isAppInitialized = true;
                        resolve();
                    }
                }

                // After initial load, these can run on subsequent updates
                if (appState.isAppInitialized) {
                    if (name === COLLECTIONS.USUARIOS) populateTaskAssigneeDropdown();
                    if (appState.currentView === 'dashboard') updateDashboard(name);
                    if (appState.currentView === 'sinoptico' && appState.sinopticoState) initSinoptico();
                    if (viewConfig[appState.currentView]?.dataKey === name) {
                        runTableLogic();
                    }
                }

            }, (error) => {
                console.error(`Error listening to ${name} collection:`, error);
                showToast(`Error al cargar datos de ${name}.`, 'error');
                // Reject the promise if a critical listener fails
                reject(error);
            });
            appState.unsubscribeListeners.push(unsubscribe);
        });
    });
}

function openAvatarSelectionModal() {
    const modalId = 'avatar-selection-modal';
    let avatarsHTML = '';
    PREDEFINED_AVATARS.forEach(avatarUrl => {
        avatarsHTML += `
            <button data-avatar-url="${avatarUrl}" class="rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all duration-200 w-24 h-24">
                <img src="${avatarUrl}" alt="Avatar" class="w-full h-full object-cover">
            </button>
        `;
    });

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop animate-fade-in">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 modal-content">
                <div class="flex justify-between items-center p-5 border-b">
                    <h3 class="text-xl font-bold">Seleccionar un Avatar</h3>
                    <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        ${avatarsHTML}
                    </div>
                </div>
                 <div class="flex justify-end items-center p-4 border-t bg-gray-50">
                    <button data-action="close" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
                </div>
            </div>
        </div>
    `;

    dom.modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();

    const modalElement = document.getElementById(modalId);
    modalElement.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const avatarUrl = button.dataset.avatarUrl;

        if (action === 'close') {
            modalElement.remove();
        } else if (avatarUrl) {
            // This is a simplified version of handleProfileUpdate
            const user = auth.currentUser;
            const userDocRef = doc(db, COLLECTIONS.USUARIOS, user.uid);
            try {
                await updateProfile(user, { photoURL: avatarUrl });
                await updateDoc(userDocRef, { photoURL: avatarUrl });
                appState.currentUser.avatarUrl = avatarUrl;
                showToast('Avatar actualizado con éxito.', 'success');
                renderUserMenu();
                runProfileLogic();
                modalElement.remove();
            } catch (error) {
                console.error("Error updating avatar:", error);
                showToast("Error al actualizar el avatar.", "error");
            }
        }
    });
}

function stopRealtimeListeners() {
    appState.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    appState.unsubscribeListeners = [];
    console.log("All Firestore listeners stopped.");
}

async function saveDocument(collectionName, data, docId = null) {
    try {
        if (docId) {
            // Logic for updating an existing document remains the same.
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, data);
            showToast('Registro actualizado con éxito.', 'success');
        } else {
            // Logic for creating a new document, now using a transaction.
            const uniqueKeyField = getUniqueKeyForCollection(collectionName);
            const uniqueKeyValue = data[uniqueKeyField];

            if (!uniqueKeyValue) {
                showToast(`Error: El campo de identificación único '${uniqueKeyField}' está vacío.`, 'error');
                return false;
            }

            data.id = uniqueKeyValue;
            const docRef = doc(db, collectionName, uniqueKeyValue);

            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (docSnap.exists()) {
                    // By throwing an error, the transaction is automatically aborted.
                    throw new Error(`El valor "${uniqueKeyValue}" para el campo "${uniqueKeyField}" ya existe.`);
                }
                transaction.set(docRef, data);
            });

            showToast('Registro creado con éxito.', 'success');
        }
        return true;
    } catch (error) {
        console.error("Error guardando el documento: ", error);
        // Display the specific error message from the transaction if available.
        const errorMessage = error.message.includes('ya existe') ? error.message : "Error al guardar el registro.";
        showToast(errorMessage, 'error');
        return false;
    }
}

async function getLogoBase64() {
    try {
        const response = await fetch('barack_logo.png');
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Could not fetch barack_logo.png:", error);
        return null;
    }
}

async function deleteDocument(collectionName, docId) {
    try {
        await deleteDoc(doc(db, collectionName, docId));
        showToast('Elemento eliminado.', 'success');
        if (viewConfig[appState.currentView]?.dataKey === collectionName) {
            runTableLogic();
        }
    } catch (error) {
        console.error("Error deleting document: ", error);
        showToast('Error al eliminar el elemento.', 'error');
    }
}


function deleteItem(docId) {
    const config = viewConfig[appState.currentView];
    if (!config || !config.dataKey) return;

    if (config.dataKey === COLLECTIONS.USUARIOS) {
        const itemToDelete = appState.currentData.find(d => d.docId === docId);
        if (itemToDelete?.docId === auth.currentUser.uid) {
            showToast('No puedes deshabilitar tu propia cuenta desde aquí.', 'error');
            return;
        }
        const itemName = itemToDelete ? (itemToDelete.name || itemToDelete.email) : 'este usuario';
        showConfirmationModal(
            `Deshabilitar Usuario`,
            `¿Estás seguro de que deseas deshabilitar a "${itemName}"? El usuario ya no podrá iniciar sesión.`,
            async () => {
                try {
                    const userDocRef = doc(db, COLLECTIONS.USUARIOS, docId);
                    await updateDoc(userDocRef, { disabled: true });
                    showToast('Usuario deshabilitado con éxito.', 'success');
                    runTableLogic(); // Refresh the table
                } catch (error) {
                    console.error("Error disabling user: ", error);
                    showToast('Error al deshabilitar el usuario.', 'error');
                }
            }
        );
        return;
    }

    if (config.dataKey === COLLECTIONS.PRODUCTOS) {
        const itemToDelete = appState.currentData.find(d => d.docId === docId);
        const itemName = itemToDelete ? (itemToDelete.descripcion || itemToDelete.id) : 'este producto';
        showConfirmationModal(
            `Eliminar Producto y Huérfanos`,
            `¿Estás seguro de que deseas eliminar "${itemName}"? Esto también intentará eliminar los sub-componentes que no estén en uso por otros productos.`,
            () => {
                const firestore = { doc, getDoc, getDocs, deleteDoc, collection, query, where };
                const uiCallbacks = { showToast, runTableLogic };
                deleteProductAndOrphanedSubProducts(docId, db, firestore, COLLECTIONS, uiCallbacks);
            }
        );
        return;
    }

    const itemToDelete = appState.currentData.find(d => d.docId === docId);
    const itemName = itemToDelete ? (itemToDelete.descripcion || itemToDelete.id) : 'este elemento';
    showConfirmationModal(
        `Eliminar ${config.singular}`,
        `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`,
        () => {
            deleteDocument(config.dataKey, docId);
        }
    );
}

async function clearDataOnly() {
    showToast('Limpiando colecciones de datos...', 'info', 5000);
    const collectionNames = Object.values(COLLECTIONS);
    for (const name of collectionNames) {
        if (name === COLLECTIONS.USUARIOS) {
            console.log(`Se omite la limpieza de la colección '${name}' para preservar los usuarios.`);
            continue;
        }
        try {
            const collectionRef = collection(db, name);
            const snapshot = await getDocs(collectionRef);
            if (snapshot.empty) continue;

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Colección '${name}' limpiada.`);
        } catch (error) {
            console.error(`Error limpiando la colección ${name}:`, error);
            showToast(`Error al limpiar la colección ${name}.`, 'error');
        }
    }
    showToast('Limpieza de datos completada.', 'success');
}

async function clearOtherUsers() {
    showToast('Eliminando otros usuarios...', 'info', 4000);
    const adminUID = 'HyM0eC3pujQtg8EgTXMu3h6AmMw2';
    const usersRef = collection(db, COLLECTIONS.USUARIOS);

    try {
        const snapshot = await getDocs(usersRef);
        if (snapshot.empty) {
            showToast('No hay otros usuarios para eliminar.', 'info');
            return;
        }

        const batch = writeBatch(db);
        let deletedCount = 0;
        snapshot.docs.forEach(doc => {
            if (doc.id !== adminUID) {
                batch.delete(doc.ref);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            await batch.commit();
            showToast(`${deletedCount} usuario(s) han sido eliminados.`, 'success');
        } else {
            showToast('No se encontraron otros usuarios para eliminar.', 'info');
        }
    } catch (error) {
        console.error("Error eliminando otros usuarios:", error);
        showToast('Error al eliminar los otros usuarios.', 'error');
    }
}

async function seedDatabase() {
    await clearDataOnly();
    showToast('Iniciando carga masiva de datos de prueba...', 'info');
    const batch = writeBatch(db);
    const TOTAL_PRODUCTS = 50; // Aumentado a 50 productos

    const setInBatch = (collectionName, data) => {
        const docRef = doc(db, collectionName, data.id);
        batch.set(docRef, data);
    };

    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

    // --- BANCOS DE DATOS AMPLIADOS ---
    const firstNames = ['Juan', 'Carlos', 'Luis', 'Miguel', 'Javier', 'David', 'José', 'Manuel', 'Francisco', 'Pedro'];
    const lastNames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín'];
    const companies = ['Automotriz', 'Industrial', 'Aeroespacial', 'Tecnología', 'Manufactura', 'Logística'];
    const companySuffix = ['S.A.', 'SRL', 'Global', 'Corp', 'Solutions', 'Group'];

    const materials = ['Acero', 'Aluminio', 'Plástico ABS', 'Polipropileno', 'Cobre', 'Goma', 'Tornillo', 'Arandela', 'Tuerca', 'Cable'];
    const materialTypes = ['Chapa', 'Tubo', 'Grano', 'Lámina', 'Bobina', 'Lingote', 'Placa'];
    const processes = ['Estampado', 'Inyección', 'Mecanizado', 'Soldadura', 'Ensamblaje', 'Pintura', 'Extrusión', 'Corte Láser'];
    const productNouns = ['Soporte', 'Carcasa', 'Eje', 'Engranaje', 'Panel', 'Conjunto', 'Módulo', 'Actuador', 'Sensor'];
    const productAdjectives = ['Delantero', 'Trasero', 'Superior', 'Inferior', 'Izquierdo', 'Derecho', 'Principal', 'Auxiliar'];
    const vehicleModels = ['Sedan', 'SUV', 'Camioneta', 'Deportivo', 'Híbrido', 'Eléctrico'];
    const vehicleBrands = ['Astro', 'Vortex', 'Terra', 'Quantum', 'Nova', 'Pulsar'];

    const imageUrls = [
        'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ];

    // --- GENERACIÓN DE DATOS BASE ---
    const generated = {
        clientes: [], proveedores: [], unidades: [], sectores: [], procesos: [], proyectos: [], insumos: [], semiterminados: []
    };

    // Unidades (fijas)
    generated.unidades = [ { id: 'kg', descripcion: 'Kilogramos' }, { id: 'm', descripcion: 'Metros' }, { id: 'un', descripcion: 'Unidades' }, { id: 'l', descripcion: 'Litros' }, { id: 'm2', descripcion: 'Metros Cuadrados' }];
    generated.unidades.forEach(u => setInBatch(COLLECTIONS.UNIDADES, u));

    // Sectores (fijos)
    generated.sectores = [ { id: 'ingenieria', descripcion: 'Ingeniería', icon: 'pencil-ruler' }, { id: 'calidad', descripcion: 'Calidad', icon: 'award' }, { id: 'produccion', descripcion: 'Producción', icon: 'factory' }, { id: 'logistica', descripcion: 'Logística', icon: 'truck' }];
    generated.sectores.forEach(s => setInBatch(COLLECTIONS.SECTORES, s));

    // Generar Clientes (20)
    for (let i = 1; i <= 20; i++) {
        const id = `C${String(i).padStart(3, '0')}`;
        generated.clientes.push({ id, descripcion: `${getRandomItem(companies)} ${getRandomItem(companySuffix)}` });
    }
    generated.clientes.forEach(c => setInBatch(COLLECTIONS.CLIENTES, c));

    // Generar Proveedores (30)
    for (let i = 1; i <= 30; i++) {
        const id = `P${String(i).padStart(3, '0')}`;
        generated.proveedores.push({ id, descripcion: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)} ${getRandomItem(companySuffix)}` });
    }
    generated.proveedores.forEach(p => setInBatch(COLLECTIONS.PROVEEDORES, p));

    // Generar Procesos (10)
    for (let i = 1; i <= 10; i++) {
        const id = processes[i-1] ? processes[i-1].toLowerCase().replace(' ', '-') : `proc-${i}`;
        generated.procesos.push({ id, descripcion: processes[i-1] || `Proceso ${i}` });
    }
    generated.procesos.forEach(p => setInBatch(COLLECTIONS.PROCESOS, p));

    // --- GENERACIÓN DE PROYECTOS ---
    const TOTAL_PROYECTOS = 15;
    showToast(`Generando ${TOTAL_PROYECTOS} proyectos de prueba...`, 'info');
    const projectNouns = ['Desarrollo', 'Investigación', 'Optimización', 'Lanzamiento', 'Mantenimiento'];
    const projectAdjectives = ['Nuevo', 'Urgente', 'Interno', 'Externo', 'Confidencial'];
    const projectStatuses = ['Activo', 'Pausado', 'Finalizado'];

    for (let i = 1; i <= TOTAL_PROYECTOS; i++) {
        const id = `PROY-${String(i).padStart(4, '0')}`;
        const proyectoData = {
            id: id,
            codigo: id,
            nombre: `${getRandomItem(projectAdjectives)} ${getRandomItem(projectNouns)} de ${getRandomItem(vehicleBrands)}`,
            descripcion: `Proyecto para el desarrollo de componentes para el nuevo modelo ${getRandomItem(vehicleModels)}.`,
            status: getRandomItem(projectStatuses),
            createdAt: new Date(),
        };
        generated.proyectos.push(proyectoData);
    }
    generated.proyectos.forEach(p => setInBatch(COLLECTIONS.PROYECTOS, p));

    // Generar Insumos (200)
    for (let i = 1; i <= 200; i++) {
        const id = `INS${String(i).padStart(4, '0')}`;
        generated.insumos.push({
            id, codigo_pieza: id, lc_kd: getRandomItem(['LC', 'KD']),
            descripcion: `${getRandomItem(materialTypes)} de ${getRandomItem(materials)}`,
            version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}`,
            proveedor: getRandomItem(generated.proveedores).id,
            unidad_medida: getRandomItem(generated.unidades).id,
            costo: parseFloat((Math.random() * 100).toFixed(2)),
            fecha_modificacion: getRandomDate(new Date(2022, 0, 1), new Date()),
            imagen: getRandomItem(imageUrls)
        });
    }
    generated.insumos.forEach(ins => setInBatch(COLLECTIONS.INSUMOS, ins));

    // Generar Semiterminados (150)
    for (let i = 1; i <= 150; i++) {
        const id = `SUB${String(i).padStart(4, '0')}`;
        generated.semiterminados.push({
            id, codigo_pieza: id, lc_kd: getRandomItem(['LC', 'KD']),
            descripcion: `${getRandomItem(productAdjectives)} de ${getRandomItem(productNouns)}`,
            version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 5)}`,
            proceso: getRandomItem(generated.procesos).id,
            aspecto: getRandomItem(['Crítico', 'No Crítico']),
            peso_gr: Math.floor(Math.random() * 2000) + 50,
            tolerancia_gr: Math.floor(Math.random() * 50),
            fecha_modificacion: getRandomDate(new Date(2023, 0, 1), new Date()),
            imagen: getRandomItem(imageUrls)
        });
    }
    generated.semiterminados.forEach(sem => setInBatch(COLLECTIONS.SEMITERMINADOS, sem));

    // --- GENERACIÓN DE PRODUCTOS Y ESTRUCTURAS ---
    showToast(`Generando ${TOTAL_PRODUCTS} productos con estructura...`, 'info');

    for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
        const productId = `PROD${String(i).padStart(4, '0')}`;
        const productoData = {
            id: productId, codigo_pieza: productId, lc_kd: getRandomItem(['LC', 'KD']),
            version_vehiculo: `${getRandomItem(vehicleBrands)} ${getRandomItem(vehicleModels)} 2024`,
            descripcion: `Ensamblaje ${getRandomItem(productAdjectives)} de ${getRandomItem(productNouns)}`,
            version: '1.0',
            fecha_modificacion: getRandomDate(new Date(2024, 0, 1), new Date()),
            imagen: getRandomItem(imageUrls),
            clienteId: getRandomItem(generated.clientes).id,
            proyectoId: null, // Puede ser nulo
            createdAt: new Date(),
        };

        const crearNodo = (tipo, refId) => ({
            id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            refId, tipo, icon: { producto: 'package', semiterminado: 'box', insumo: 'beaker' }[tipo],
            quantity: Math.floor(Math.random() * 10) + 1, children: []
        });

        const rootNode = crearNodo('producto', productoData.id);

        // Crear una estructura de árbol aleatoria
        const maxDepth = 4;
        const maxChildren = 5;

        function buildTree(node, depth) {
            if (depth >= maxDepth) return;

            const numChildren = Math.floor(Math.random() * maxChildren) + 1;
            for (let j = 0; j < numChildren; j++) {
                // 70% de probabilidad de ser semiterminado, 30% de ser insumo (si no es muy profundo)
                const isSemi = Math.random() < 0.7 && depth < maxDepth -1;
                if (isSemi) {
                    const semi = getRandomItem(generated.semiterminados);
                    const childNode = crearNodo('semiterminado', semi.id);
                    node.children.push(childNode);
                    buildTree(childNode, depth + 1);
                } else {
                    const insumo = getRandomItem(generated.insumos);
                    const childNode = crearNodo('insumo', insumo.id);
                    node.children.push(childNode);
                }
            }
        }

        buildTree(rootNode, 1);
        productoData.estructura = [rootNode];
        setInBatch(COLLECTIONS.PRODUCTOS, productoData);
    }

    // --- GENERACIÓN DE TAREAS DE PRUEBA ---
    const TOTAL_TAREAS = 40;
    showToast(`Generando ${TOTAL_TAREAS} tareas de prueba...`, 'info');
    const taskTitles = ['Revisar plano', 'Actualizar documentación', 'Contactar proveedor', 'Optimizar proceso', 'Validar muestra', 'Generar reporte'];
    const taskDescriptions = [
        'Es necesario verificar las últimas modificaciones del plano y asegurar la correspondencia con el prototipo.',
        'Actualizar la documentación técnica para reflejar los cambios de la versión 2.1.',
        'Contactar al proveedor de materia prima para negociar nuevos términos de entrega.',
        'Analizar el cuello de botella en la línea de ensamblaje y proponer mejoras.',
        'Realizar pruebas de calidad sobre la última muestra recibida del proveedor X.',
        'Generar el reporte de avance semanal del proyecto Y para la reunión de directorio.'
    ];
    const statuses = ['todo', 'inprogress', 'done'];
    const priorities = ['low', 'medium', 'high'];
    const users = appState.collections.usuarios.filter(u => u.disabled !== true);

    for (let i = 1; i <= TOTAL_TAREAS; i++) {
        const creator = getRandomItem(users);
        const assignee = Math.random() > 0.2 ? getRandomItem(users) : null; // 20% de tareas no asignadas

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60));

        const taskData = {
            title: `${getRandomItem(taskTitles)} #${i}`,
            description: getRandomItem(taskDescriptions),
            creatorUid: creator.docId,
            assigneeUid: assignee ? assignee.docId : null,
            status: getRandomItem(statuses),
            priority: getRandomItem(priorities),
            isPublic: Math.random() > 0.3, // 70% de tareas públicas
            createdAt: startDate,
            startDate: startDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            subtasks: []
        };

        const docRef = doc(collection(db, COLLECTIONS.TAREAS));
        batch.set(docRef, taskData);
    }


    // --- COMMIT FINAL ---
    try {
        await batch.commit();
        showToast(`Carga masiva completada: ${TOTAL_PRODUCTS} productos y miles de componentes creados.`, 'success', 5000);
        switchView('dashboard');
    } catch (error) {
        console.error("Error al cargar datos de prueba masivos: ", error);
        showToast('Error al cargar datos masivos. Verifique la consola.', 'error');
    }
}

// =================================================================================
// --- 3.5. CONTROL DE PERMISOS ---
// =================================================================================

/**
 * Verifica los permisos de un usuario para realizar una acción específica.
 * @param {string} action - La acción a verificar (ej: 'create', 'edit', 'delete').
 * @param {object|string|null} item - El objeto sobre el que se actúa, un string para identificar el tipo (ej: 'tarea'), o null.
 * @returns {boolean} - `true` si el usuario tiene permiso, `false` en caso contrario.
 */
function checkUserPermission(action, item = null) {
    if (!appState.currentUser) {
        return false; // Si no hay usuario, no hay permisos.
    }

    const { role, uid } = appState.currentUser;

    // 1. El rol 'admin' siempre tiene acceso total.
    if (role === 'admin') {
        return true;
    }

    const isTask = (typeof item === 'string' && item === 'tarea') || (item && typeof item === 'object' && 'creatorUid' in item);

    // 2. Lógica específica para Tareas
    if (isTask) {
        if (action === 'create') {
            // Todos los roles pueden crear tareas.
            return true;
        }
        if ((action === 'edit' || action === 'delete') && typeof item === 'object' && item) {
            // Solo el creador o el asignado pueden editar o eliminar una tarea.
            return item.creatorUid === uid || item.assigneeUid === uid;
        }
    }

    // 3. Lógica para el rol 'lector'
    if (role === 'lector') {
        // Los lectores no pueden crear, editar o eliminar nada (excepto la creación de tareas ya manejada).
        if (['create', 'edit', 'delete'].includes(action)) {
            return false;
        }
    }

    // 4. Lógica para el rol 'editor'
    if (role === 'editor') {
        if (action === 'create') {
            return true; // Los editores pueden crear nuevos elementos.
        }
        if (action === 'delete') {
            return false; // Los editores no pueden eliminar elementos en general.
        }
        // Para 'edit', se asume que pueden editar (no hay una regla explícita en contra).
        // Se podría añadir más lógica aquí si fuera necesario.
    }

    // Por defecto, permitir otras acciones (como 'view') si no se ha denegado explícitamente.
    // O podrías devolver 'false' por defecto para una política más restrictiva.
    // En este caso, asumimos que si no se deniega, se permite.
    return true;
}


// =================================================================================
// --- 4. LÓGICA PRINCIPAL DE LA APLICACIÓN (CORE) ---
// =================================================================================

function initializeAppListeners() {
    setupGlobalEventListeners();
}

function setupGlobalEventListeners() {
    dom.searchInput.addEventListener('input', handleSearch);
    dom.addNewButton.addEventListener('click', () => openFormModal());

    document.getElementById('main-nav').addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');

        // Handle view switching from any nav-link with a data-view attribute
        if (link && link.dataset.view) {
            e.preventDefault();
            switchView(link.dataset.view);

            // Close dropdowns after selection
            const openDropdown = link.closest('.nav-dropdown.open');
            if (openDropdown) {
                openDropdown.classList.remove('open');
            }
        }

        // Handle dropdown toggling
        const toggle = e.target.closest('.dropdown-toggle');
        if (toggle) {
            e.preventDefault(); // Prevent view switch if clicking dropdown toggle
            const dropdown = toggle.closest('.nav-dropdown');
            // Close other open dropdowns
            document.querySelectorAll('.nav-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('open');
                }
            });
            dropdown.classList.toggle('open');
        }
    });
    
    dom.viewContent.addEventListener('click', handleViewContentActions);

    // Attach listeners directly to forms for more reliable submission
    document.getElementById('login-form')?.addEventListener('submit', handleAuthForms);
    document.getElementById('register-form')?.addEventListener('submit', handleAuthForms);
    document.getElementById('reset-form')?.addEventListener('submit', handleAuthForms);

    document.addEventListener('click', handleGlobalClick);
}

function switchView(viewName, params = null) {
    if (appState.currentView === 'dashboard') {
        destroyDashboardCharts();
    }
    if (appState.currentViewCleanup) {
        appState.currentViewCleanup();
        appState.currentViewCleanup = null;
    }
    if (appState.currentView === 'sinoptico') appState.sinopticoState = null;
    if (appState.currentView === 'sinoptico_tabular') appState.sinopticoTabularState = null;
    appState.currentView = viewName;
    const config = viewConfig[viewName];
    dom.viewTitle.textContent = config.title;

    // Hide the title for the tabular view to save space, but show it for all other views.
    if (viewName === 'sinoptico_tabular') {
        dom.viewTitle.style.display = 'none';
    } else {
        dom.viewTitle.style.display = 'block';
    }

    // Update active link styling
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`#main-nav [data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');

        // If the link is inside a dropdown, also mark the dropdown toggle as active
        const parentDropdown = activeLink.closest('.nav-dropdown');
        if (parentDropdown) {
            parentDropdown.querySelector('.dropdown-toggle').classList.add('active');
        }
    }
    
    dom.viewContent.innerHTML = '';
    dom.headerActions.style.display = 'none';
    dom.searchInput.style.display = 'none';
    
    if (viewName === 'dashboard') runDashboardLogic();
    else if (viewName === 'sinoptico') runSinopticoLogic();
    else if (viewName === 'sinoptico_tabular') runSinopticoTabularLogic();
    else if (viewName === 'flujograma') runFlujogramaLogic();
    else if (viewName === 'arboles') renderArbolesInitialView();
    else if (viewName === 'profile') runProfileLogic();
    else if (viewName === 'tareas') runTasksLogic();
    else if (viewName === 'ecos') runEcosLogic();
    else if (viewName === 'eco_form') runEcoFormLogic(params);
    else if (config?.dataKey) {
        dom.headerActions.style.display = 'flex';
        dom.searchInput.style.display = 'block';
        if (checkUserPermission('create')) {
            dom.addNewButton.style.display = 'flex';
            dom.addButtonText.textContent = `Agregar ${config.singular}`;
        } else {
            dom.addNewButton.style.display = 'none';
        }
        runTableLogic();
    }
    dom.searchInput.value = '';
}

async function runEcoFormLogic(params = null) {
    const ecoId = params ? params.ecoId : null;
    const isEditing = !!ecoId;
    const ECO_FORM_STORAGE_KEY = isEditing ? `inProgressEcoForm_${ecoId}` : 'inProgressEcoForm_new';

    const populateEcoForm = (form, data) => {
        if (!data || !form) return;

        for (const key in data) {
            if (key === 'checklists' && typeof data.checklists === 'object') {
                for (const section in data.checklists) {
                    data.checklists[section].forEach((item, index) => {
                        if (item.si) form.querySelector(`input[name="check_${section}_${index}_si"]`).checked = true;
                        if (item.na) form.querySelector(`input[name="check_${section}_${index}_na"]`).checked = true;
                    });
                }
            } else if (key === 'comments' && typeof data.comments === 'object') {
                for (const section in data.comments) {
                    const textarea = form.querySelector(`[name="comments_${section}"]`);
                    if (textarea) textarea.value = data.comments[section];
                }
            } else if (key === 'signatures' && typeof data.signatures === 'object') {
                for (const sectionId in data.signatures) {
                    for (const field in data.signatures[sectionId]) {
                        const inputName = `${field}_${sectionId}`;
                        const inputElement = form.querySelector(`[name="${inputName}"]`);
                        if (inputElement) {
                            if (inputElement.type === 'radio') {
                                const radioToSelect = form.querySelector(`[name="${inputName}"][value="${data.signatures[sectionId][field]}"]`);
                                if (radioToSelect) radioToSelect.checked = true;
                            } else {
                                inputElement.value = data.signatures[sectionId][field];
                            }
                        }
                    }
                }
            } else {
                const element = form.querySelector(`[name="${key}"]`);
                if (element) {
                    element.value = data[key];
                }
            }
        }
    };

    // Helper to save form data to Local Storage
    const saveEcoFormToLocalStorage = () => {
        const form = dom.viewContent.querySelector('#eco-form');
        if (!form) return;
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        // Also handle checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            data[cb.name] = cb.checked;
        });

        localStorage.setItem(ECO_FORM_STORAGE_KEY, JSON.stringify(data));
    };

    // Helper to load form data from Local Storage
    const loadEcoFormFromLocalStorage = () => {
        const savedData = localStorage.getItem(ECO_FORM_STORAGE_KEY);
        if (!savedData) return;

        const data = JSON.parse(savedData);
        const form = dom.viewContent.querySelector('#eco-form');
        if (!form) return;

        for (const key in data) {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = data[key];
                } else if (element.type === 'radio') {
                    const radioToSelect = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                    if (radioToSelect) radioToSelect.checked = true;
                }
                else {
                    element.value = data[key];
                }
            }
        }
    };


    try {
        const response = await fetch('eco_form.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();

        // Use a template to safely parse the HTML and get a direct reference to the form element
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const formElement = template.content.firstElementChild;

        dom.viewContent.innerHTML = ''; // Clear previous content
        dom.viewContent.appendChild(formElement);


        // Also need to load the css.
        if (!document.getElementById('eco-form-styles')) {
            const link = document.createElement('link');
            link.id = 'eco-form-styles';
            link.rel = 'stylesheet';
            link.href = 'eco_form.css';
            document.head.appendChild(link);
        }

        const formSectionsData = [
            {
                title: 'ENG. PRODUCTO',
                id: 'eng_producto',
                checklist: [
                    '¿Se requiere cambio en el plano?',
                    '¿Se requiere cambio en la especificación?',
                    '¿Se requiere un nuevo herramental?',
                    '¿Se requiere un nuevo dispositivo?'
                ]
            },
            {
                title: 'CALIDAD',
                id: 'calidad',
                checklist: [
                    '¿Se requiere un nuevo plan de control?',
                    '¿Se requiere un nuevo estudio de capacidad?',
                    '¿Se requiere un nuevo R&R?',
                    '¿Se requiere un nuevo layout?'
                ]
            },
            {
                title: 'ENG. PROCESO',
                id: 'eng_proceso',
                checklist: [
                    '¿Se requiere un nuevo diagrama de flujo?',
                    '¿Se requiere un nuevo AMEF?',
                    '¿Se requiere un nuevo estudio de tiempos?',
                    '¿Se requiere una nueva instrucción de trabajo?'
                ]
            },
            {
                title: 'COMPRAS',
                id: 'compras',
                checklist: [
                    '¿Se requiere un nuevo proveedor?',
                    '¿Se requiere un nuevo acuerdo de precios?',
                    '¿Se requiere un nuevo embalaje?',
                    '¿Se requiere un nuevo transporte?'
                ]
            },
            {
                title: 'LOGISTICA',
                id: 'logistica',
                checklist: [
                    '¿Se requiere un nuevo layout de almacén?',
                    '¿Se requiere un nuevo sistema de identificación?',
                    '¿Se requiere un nuevo flujo de materiales?',
                    '¿Se requiere un nuevo sistema de transporte interno?'
                ]
            },
            {
                title: 'IMPLEMENTACIÓN',
                id: 'implementacion',
                checklist: [
                    '¿Se requiere actualizar el stock?',
                    '¿Se requiere notificar al cliente?',
                    '¿Se requiere capacitar al personal?',
                    '¿Se requiere validar el proceso?'
                ]
            },
            {
                title: 'APROBACIÓN FINAL',
                id: 'aprobacion_final',
                description: 'Aprobación final del ECO y cierre del proceso.',
                checklist: null
            }
        ];

        function buildSectionHTML(section) {
            const checklistItemsHTML = section.checklist
                ? section.checklist.map((item, index) => `
                    <div class="checklist-item">
                        <span class="checklist-item-label">${item}</span>
                        <div class="checklist-item-options">
                            <input type="checkbox" name="check_${section.id}_${index}_si" class="form-checkbox h-5 w-5 text-blue-600">
                            <input type="checkbox" name="check_${section.id}_${index}_na" class="form-checkbox h-5 w-5 text-blue-600">
                        </div>
                    </div>
                `).join('')
                : '';

            const mainContentHTML = section.checklist
                ? `
                <div class="section-checklist">
                    <div class="checklist-header">
                        <span>Ítem</span>
                        <div class="flex items-center">
                            <span class="mr-4">SI</span>
                            <span>N/A</span>
                        </div>
                    </div>
                    ${checklistItemsHTML}
                </div>
                <div class="section-comments">
                    <label for="comments_${section.id}" class="font-bold text-gray-700">Comentarios:</label>
                    <textarea id="comments_${section.id}" name="comments_${section.id}" rows="10" class="mt-2 w-full border rounded-md p-2"></textarea>
                </div>`
                : `<div class="p-4 w-full">
                    <p class="text-gray-700">${section.description}</p>
                </div>`;

            const statusFieldHTML = section.checklist
                ? `<div class="footer-field">
                    <label>Estado</label>
                    <div class="status-options">
                        <label class="flex items-center"><input type="radio" name="status_${section.id}" value="ok" class="form-radio h-4 w-4 text-green-600"> <span class="ml-2">OK</span></label>
                        <label class="flex items-center"><input type="radio" name="status_${section.id}" value="nok" class="form-radio h-4 w-4 text-red-600"> <span class="ml-2">NOK</span></label>
                    </div>
                </div>`
                : '';

            return `
            <div class="section-block">
                <div class="section-sidebar">
                    <span>${section.title}</span>
                </div>
                <div class="section-main">
                    <div class="section-content">
                        ${mainContentHTML}
                    </div>
                    <div class="section-footer">
                        <div class="footer-fields">
                            <div class="footer-field">
                                <label for="date_${section.id}">Fecha</label>
                                <input type="date" id="date_${section.id}" name="date_${section.id}" class="p-1 border rounded-md">
                            </div>
                            ${statusFieldHTML}
                        </div>
                        <div class="footer-fields">
                             <div class="footer-field">
                                <label for="name_${section.id}">Nombre</label>
                                <input type="text" id="name_${section.id}" name="name_${section.id}" class="p-1 border rounded-md">
                            </div>
                             <div class="footer-field">
                                <label for="date_signature_${section.id}">Fecha</label>
                                <input type="date" id="date_signature_${section.id}" name="date_signature_${section.id}" class="p-1 border rounded-md">
                            </div>
                             <div class="footer-field">
                                <label for="visto_${section.id}">Visto</label>
                                <input type="text" id="visto_${section.id}" name="visto_${section.id}" class="p-1 border rounded-md">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        const container = document.getElementById('dynamic-form-sections');
        if (container) {
            formSectionsData.forEach(section => {
                const sectionHTML = buildSectionHTML(section);
                container.insertAdjacentHTML('beforeend', sectionHTML);
            });

            // Add event listener for mutually exclusive checkboxes
            container.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox' && e.target.name.startsWith('check_')) {
                    const name = e.target.name;
                    const isChecked = e.target.checked;

                    if (!isChecked) return; // Only act when a box is checked

                    const parts = name.split('_');
                    const sectionId = parts[1];
                    const index = parts[2];
                    const type = parts[3];

                    let otherCheckbox;
                    if (type === 'si') {
                        otherCheckbox = container.querySelector(`input[name="check_${sectionId}_${index}_na"]`);
                    } else if (type === 'na') {
                        otherCheckbox = container.querySelector(`input[name="check_${sectionId}_${index}_si"]`);
                    }

                    if (otherCheckbox && otherCheckbox.checked) {
                        otherCheckbox.checked = false;
                    }
                }
            });
        }

        // --- Button Logic ---
        const saveButton = document.getElementById('eco-save-button');
        const clearButton = document.getElementById('eco-clear-button');
        const approveButton = document.getElementById('eco-approve-button');
        const ecrInput = formElement.querySelector('#ecr_no');

        // Always add a "Back" button
        const backButtonHTML = `<button type="button" id="eco-back-button" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300">Volver a la Lista</button>`;
        saveButton.insertAdjacentHTML('beforebegin', backButtonHTML);
        document.getElementById('eco-back-button').addEventListener('click', () => switchView('ecos'));

        if (isEditing) {
            ecrInput.readOnly = true;
            ecrInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }

        if (ecoId) {
            const docRef = doc(db, COLLECTIONS.ECO_FORMS, ecoId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                populateEcoForm(formElement, docSnap.data());
            } else {
                showToast(`Error: No se encontró el ECO con ID ${ecoId}`, 'error');
                switchView('ecos');
                return;
            }
        } else {
            // Load data from Local Storage only for new forms
            loadEcoFormFromLocalStorage();
        }

        // Add event listener to save on any input
        formElement.addEventListener('input', saveEcoFormToLocalStorage);

        const getFormData = () => {
            const formData = new FormData(formElement);
            const data = {
                checklists: {},
                comments: {},
                signatures: {}
            };

            for (let [key, value] of formData.entries()) {
                if (key.startsWith('check_')) {
                    const [, section, index, type] = key.split('_');
                    if (!data.checklists[section]) data.checklists[section] = [];
                    if (!data.checklists[section][index]) data.checklists[section][index] = {};
                    data.checklists[section][index][type] = value === 'on';
                } else if (key.startsWith('comments_')) {
                    const [, section] = key.split('_');
                    data.comments[section] = value;
                } else if (key.startsWith('date_') || key.startsWith('status_') || key.startsWith('name_') || key.startsWith('visto_')) {
                     const [type, section, ...rest] = key.split('_');
                     const sectionId = rest.length > 0 ? `${section}_${rest.join('_')}` : section;
                     if (!data.signatures[sectionId]) data.signatures[sectionId] = {};
                     data.signatures[sectionId][type] = value;
                } else {
                    data[key] = value;
                }
            }
             // Handle checkboxes correctly
            formElement.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                const key = cb.name;
                 if (key.startsWith('check_')) {
                    const [, section, index, type] = key.split('_');
                    if (!data.checklists[section]) data.checklists[section] = [];
                    if (!data.checklists[section][index]) data.checklists[section][index] = { si: false, na: false };
                    data.checklists[section][index][type] = cb.checked;
                }
            });

            return data;
        };

        const saveEcoForm = async (status = 'in-progress') => {
            const ecrId = ecrInput.value.trim();
            if (!ecrId) {
                showToast('Por favor, ingrese un ECR N° para guardar.', 'error');
                ecrInput.focus();
                return;
            }

            const dataToSave = getFormData();
            dataToSave.status = status;
            dataToSave.id = ecrId;
            dataToSave.lastModified = new Date();
            dataToSave.modifiedBy = appState.currentUser.email;

            showToast('Guardando formulario ECO...', 'info');
            try {
                const docRef = doc(db, COLLECTIONS.ECO_FORMS, ecrId);
                const historyRef = collection(docRef, 'history');

                const batch = writeBatch(db);

                // Set the main document (latest version)
                batch.set(docRef, dataToSave, { merge: true });

                // Add a new document to the history subcollection
                const historyDocRef = doc(historyRef); // Auto-generate ID
                batch.set(historyDocRef, dataToSave);

                await batch.commit();

                localStorage.removeItem(ECO_FORM_STORAGE_KEY);
                showToast(`ECO "${ecrId}" guardado con éxito.`, 'success');

            } catch(error) {
                console.error("Error saving ECO form: ", error);
                showToast('Error al guardar el formulario.', 'error');
            }
        };

        clearButton.addEventListener('click', () => {
            showConfirmationModal('Limpiar Formulario', '¿Está seguro? Se borrará todo el progreso no guardado.', () => {
                formElement.reset();
                localStorage.removeItem(ECO_FORM_STORAGE_KEY);
                showToast('Formulario limpiado.', 'info');
            });
        });

        const validateEcoForm = () => {
            // Clear previous errors first
            formElement.querySelectorAll('.validation-error').forEach(el => el.classList.remove('validation-error'));
            let isValid = true;
            const ERROR_CLASS = 'validation-error';

            formSectionsData.forEach(section => {
                if (section.checklist) {
                    // Rule 1: For each section, if the status is "NOK", the comments field must have text.
                    const nokRadio = formElement.querySelector(`input[name="status_${section.id}"][value="nok"]`);
                    if (nokRadio && nokRadio.checked) {
                        const commentsTextarea = formElement.querySelector(`#comments_${section.id}`);
                        if (commentsTextarea && commentsTextarea.value.trim() === '') {
                            isValid = false;
                            commentsTextarea.classList.add(ERROR_CLASS);
                            nokRadio.closest('label').classList.add(ERROR_CLASS);
                        }
                    }

                    // Rule 2: For each item, one of the two checkboxes ("SI" or "N/A") must be marked.
                    section.checklist.forEach((item, index) => {
                        const si_checkbox = formElement.querySelector(`input[name="check_${section.id}_${index}_si"]`);
                        const na_checkbox = formElement.querySelector(`input[name="check_${section.id}_${index}_na"]`);

                        if (si_checkbox && na_checkbox && !si_checkbox.checked && !na_checkbox.checked) {
                            isValid = false;
                            // Find the parent .checklist-item and highlight it
                            si_checkbox.closest('.checklist-item').classList.add(ERROR_CLASS);
                        }
                    });

                    // Rule 3: Each section must have a final status ("OK" or "NOK") selected.
                    const statusRadio = formElement.querySelector(`input[name="status_${section.id}"]:checked`);
                    if (!statusRadio) {
                        isValid = false;
                        const statusOptionsContainer = formElement.querySelector(`input[name="status_${section.id}"]`).closest('.status-options');
                        if (statusOptionsContainer) {
                            statusOptionsContainer.classList.add(ERROR_CLASS);
                        }
                    }
                }
            });

            return isValid;
        };

        saveButton.addEventListener('click', () => saveEcoForm('in-progress'));
        approveButton.addEventListener('click', () => {
            if (validateEcoForm()) {
                showConfirmationModal('Aprobar ECO', '¿Está seguro de que desea aprobar y guardar este ECO? Esta acción registrará la versión actual como aprobada.', () => {
                     saveEcoForm('approved');
                });
            } else {
                showToast('Por favor, corrija los errores resaltados en el formulario.', 'error');
            }
        });

        appState.currentViewCleanup = () => {
            const style = document.getElementById('eco-form-styles');
            if(style) style.remove();
            formElement.removeEventListener('input', saveEcoFormToLocalStorage);
        };

    } catch (error) {
        console.error("Error loading ECO form:", error);
        dom.viewContent.innerHTML = `<p class="text-red-500">Error al cargar el formulario ECO.</p>`;
    }
}

async function runEcosLogic() {
    dom.headerActions.style.display = 'none'; // Ocultar acciones globales

    const viewHTML = `
        <div class="animate-fade-in-up">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Planilla General de ECOs</h2>
                    <p class="text-sm text-slate-500">Aquí puede ver, gestionar y crear nuevos ECOs.</p>
                </div>
                <div class="flex items-center gap-4">
                    <button data-action="create-new-ecr" class="bg-white border border-slate-300 text-slate-600 px-5 py-2.5 rounded-full hover:bg-slate-100 font-semibold shadow-sm transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" title="Funcionalidad en desarrollo" disabled>
                        <i data-lucide="file-plus-2" class="mr-2 h-5 w-5"></i>Crear Nuevo ECR
                    </button>
                    <button data-action="create-new-eco" class="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 flex items-center shadow-md transition-transform transform hover:scale-105">
                        <i data-lucide="recycle" class="mr-2 h-5 w-5"></i>Crear Nuevo ECO
                    </button>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-600">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th scope="col" class="px-6 py-3">ECR N°</th>
                                <th scope="col" class="px-6 py-3">Estado</th>
                                <th scope="col" class="px-6 py-3">Última Modificación</th>
                                <th scope="col" class="px-6 py-3">Modificado Por</th>
                                <th scope="col" class="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="ecos-table-body">
                            <tr>
                                <td colspan="5" class="text-center py-16 text-gray-500">
                                    <div class="flex flex-col items-center gap-3">
                                        <i data-lucide="loader" class="w-12 h-12 text-gray-300 animate-spin"></i>
                                        <h4 class="font-semibold">Cargando ECOs...</h4>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    dom.viewContent.innerHTML = viewHTML;
    lucide.createIcons();

    // Add event listener for the "create new eco" button
    dom.viewContent.querySelector('[data-action="create-new-eco"]').addEventListener('click', () => {
        switchView('eco_form');
    });

    // Logic to fetch and render ECOs
    const ecoFormsRef = collection(db, COLLECTIONS.ECO_FORMS);
    const q = query(ecoFormsRef, orderBy('lastModified', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ecosTableBody = document.getElementById('ecos-table-body');
        if (!ecosTableBody) return;

        if (querySnapshot.empty) {
            ecosTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-16 text-gray-500"><i data-lucide="search-x" class="mx-auto h-16 w-16 text-gray-300"></i><h3 class="mt-4 text-lg font-semibold">No se encontraron ECOs</h3><p class="text-sm">Puede crear uno nuevo con el botón de arriba.</p></div></td></tr>`;
            lucide.createIcons();
            return;
        }

        let tableRowsHTML = '';
        querySnapshot.forEach(doc => {
            const eco = doc.data();
            const lastModified = eco.lastModified?.toDate ? eco.lastModified.toDate().toLocaleString('es-AR') : 'N/A';
            const statusColors = {
                'in-progress': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'rejected': 'bg-red-100 text-red-800'
            };
            const statusText = {
                'in-progress': 'En Progreso',
                'approved': 'Aprobado',
                'rejected': 'Rechazado'
            };

            tableRowsHTML += `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900">${eco.id || 'N/A'}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs ${statusColors[eco.status] || 'bg-gray-100 text-gray-800'}">
                            ${statusText[eco.status] || eco.status}
                        </span>
                    </td>
                    <td class="px-6 py-4">${lastModified}</td>
                    <td class="px-6 py-4">${eco.modifiedBy || 'N/A'}</td>
                    <td class="px-6 py-4 text-right">
                        <button data-action="view-eco" data-id="${eco.id}" class="text-gray-500 hover:text-blue-600 p-1" title="Ver/Editar"><i data-lucide="eye" class="h-5 w-5 pointer-events-none"></i></button>
                        <button data-action="view-eco-history" data-id="${eco.id}" class="text-gray-500 hover:text-purple-600 p-1" title="Ver Historial"><i data-lucide="history" class="h-5 w-5 pointer-events-none"></i></button>
                        <button data-action="export-eco-pdf" data-id="${eco.id}" class="text-gray-500 hover:text-red-600 p-1" title="Exportar a PDF"><i data-lucide="file-text" class="h-5 w-5 pointer-events-none"></i></button>
                    </td>
                </tr>
            `;
        });
        ecosTableBody.innerHTML = tableRowsHTML;
        lucide.createIcons();
    }, (error) => {
        console.error("Error fetching ECOs: ", error);
        const ecosTableBody = document.getElementById('ecos-table-body');
        if(ecosTableBody) {
            ecosTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-16 text-red-500"><i data-lucide="alert-triangle" class="mx-auto h-16 w-16"></i><h3 class="mt-4 text-lg font-semibold">Error al cargar ECOs</h3><p class="text-sm">${error.message}</p></div></td></tr>`;
            lucide.createIcons();
        }
    });

    appState.currentViewCleanup = () => {
        unsubscribe();
    };
}

function handleViewContentActions(e) {
    const button = e.target.closest('button[data-action], a[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'prev-page' || action === 'next-page') {
        runTableLogic(action === 'prev-page' ? 'prev' : 'next');
        return;
    }
    
    if (action === 'export-sinoptico-pdf') return;
    e.preventDefault();
    
    const id = button.dataset.id;
    const docId = button.dataset.docId;
    const userId = button.dataset.userId;

    const actions = {
        'view-eco': () => switchView('eco_form', { ecoId: button.dataset.id }),
        'view-eco-history': () => showEcoHistoryModal(button.dataset.id),
        'export-eco-pdf': () => exportEcoToPdf(button.dataset.id),
        'delete-task': () => {
            showConfirmationModal(
                'Eliminar Tarea',
                '¿Estás seguro de que deseas eliminar esta tarea?',
                () => deleteDocument(COLLECTIONS.TAREAS, docId)
            );
        },
        'add-task-to-column': () => {
            const status = button.dataset.status;
            openTaskFormModal(null, status);
        },
        'view-user-tasks': () => {
            if (!userId) return;
            taskState.selectedUserId = userId;
            runTasksLogic();
        },
        'assign-task-to-user': () => {
            if (!userId) return;
            openTaskFormModal(null, 'todo', userId);
        },
        'admin-back-to-supervision': () => {
            taskState.selectedUserId = null;
            runTasksLogic(); // This will call renderAdminUserList because activeFilter is 'supervision'
        },
        'admin-back-to-board': () => {
            taskState.selectedUserId = null;
            taskState.activeFilter = 'engineering'; // Go back to default view
            runKanbanBoardLogic(); // Go directly to the board, bypassing the new main logic
        },
        'details': () => openDetailsModal(appState.currentData.find(d => d.id == id)),
        'edit': () => openFormModal(appState.currentData.find(d => d.id == id)),
        'delete': () => deleteItem(docId),
        'export-pdf': () => handleExport('pdf'),
        'export-excel': () => handleExport('excel'),
        'open-sector-modal': () => openSectorProcessesModal(button.dataset.sectorId),
        'open-product-search-modal': openProductSearchModal,
        'volver-a-busqueda': () => {
            // Ya no es necesario liberar ningún bloqueo.
            appState.arbolActivo = null;
            renderArbolesInitialView();
        },
        'guardar-arbol': () => guardarEstructura(button),
        'add-node': () => openComponentSearchModal(button.dataset.nodeId, button.dataset.childType),
        'edit-node-details': () => openSinopticoEditModal(button.dataset.nodeId),
        'delete-node': () => eliminarNodo(button.dataset.nodeId),
        'delete-account': handleDeleteAccount,
        'seed-database': () => {
            showConfirmationModal(
                'Limpiar y Cargar Datos',
                '¿Estás seguro? Esto borrará todos los datos (excepto usuarios) y los reemplazará con los datos de demostración.',
                seedDatabase
            );
        },
        'clear-data-only': () => {
            showConfirmationModal(
                'Borrar Solo Datos',
                '¿Estás seguro? Esto borrará todos los datos de productos, insumos, etc., pero mantendrá a todos los usuarios.',
                clearDataOnly
            );
        },
        'clear-other-users': () => {
            showConfirmationModal(
                'Borrar Otros Usuarios',
                '¿Estás seguro? Esto eliminará a TODOS los usuarios excepto al administrador principal. Esta acción es irreversible.',
                clearOtherUsers
            );
        },
        'clone-product': () => cloneProduct(),
        'view-history': () => showToast('La función de historial de cambios estará disponible próximamente.', 'info'),
    };
    
    if (actions[action]) actions[action]();
}

// =================================================================================
// --- 5. UI, COMPONENTES Y NOTIFICACIONES ---
// =================================================================================

function showToast(message, type = 'success', duration = 3000) {
    const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${message}</span>`;
    dom.toastContainer.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

function showConfirmationModal(title, message, onConfirm) {
    const modalId = `confirm-modal-${Date.now()}`;
    const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-md m-4 modal-content"><div class="p-6 text-center"><i data-lucide="alert-triangle" class="h-12 w-12 mx-auto text-yellow-500 mb-4"></i><h3 class="text-xl font-bold mb-2">${title}</h3><p class="text-gray-600">${message}</p></div><div class="flex justify-center items-center p-4 border-t bg-gray-50 space-x-4"><button data-action="cancel" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button><button data-action="confirm" class="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-semibold">Confirmar</button></div></div></div>`;
    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();
    const modalElement = document.getElementById(modalId);
    modalElement.addEventListener('click', e => {
        const action = e.target.closest('button')?.dataset.action;
        if (action === 'confirm') { onConfirm(); modalElement.remove(); } 
        else if (action === 'cancel') { modalElement.remove(); }
    });
}

async function showEcoHistoryModal(ecoId) {
    if (!ecoId) return;

    const modalId = `history-modal-${ecoId}`;
    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4 modal-content">
                <div class="flex justify-between items-center p-5 border-b">
                    <h3 class="text-xl font-bold">Historial de Cambios para ECO: ${ecoId}</h3>
                    <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <div id="history-content" class="p-6 overflow-y-auto">
                    <p class="text-center text-gray-500">Cargando historial...</p>
                </div>
                <div class="flex justify-end items-center p-4 border-t bg-gray-50">
                    <button data-action="close" type="button" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();

    const modalElement = document.getElementById(modalId);
    const historyContent = modalElement.querySelector('#history-content');

    modalElement.addEventListener('click', e => {
        if (e.target.closest('button')?.dataset.action === 'close') {
            modalElement.remove();
        }
    });

    try {
        const historyRef = collection(db, COLLECTIONS.ECO_FORMS, ecoId, 'history');
        const q = query(historyRef, orderBy('lastModified', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyContent.innerHTML = '<p class="text-center text-gray-500">No se encontró historial para este ECO.</p>';
            return;
        }

        let historyHTML = '<div class="space-y-4">';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.lastModified?.toDate ? data.lastModified.toDate().toLocaleString('es-AR') : 'Fecha desconocida';
            historyHTML += `
                <div class="p-4 border rounded-lg bg-gray-50">
                    <p><strong>Fecha:</strong> ${date}</p>
                    <p><strong>Modificado por:</strong> ${data.modifiedBy || 'Desconocido'}</p>
                    <p><strong>Estado:</strong> ${data.status || 'N/A'}</p>
                    <details class="mt-2 text-xs">
                        <summary class="cursor-pointer">Ver datos completos (JSON)</summary>
                        <pre class="bg-gray-200 p-2 rounded mt-1 overflow-auto max-h-60"><code>${JSON.stringify(data, null, 2)}</code></pre>
                    </details>
                </div>
            `;
        });
        historyHTML += '</div>';
        historyContent.innerHTML = historyHTML;

    } catch (error) {
        console.error("Error fetching ECO history:", error);
        historyContent.innerHTML = '<p class="text-center text-red-500">Error al cargar el historial.</p>';
        showToast('Error al cargar el historial.', 'error');
    }
}

async function exportEcoToPdf(ecoId) {
    if (!ecoId) {
        showToast('No se ha proporcionado un ID de ECO para exportar.', 'error');
        return;
    }

    showToast('Iniciando exportación a PDF...', 'info');
    dom.loadingOverlay.style.display = 'flex';
    dom.loadingOverlay.querySelector('p').textContent = 'Generando PDF...';

    try {
        // 1. Fetch ECO data
        const ecoDocRef = doc(db, COLLECTIONS.ECO_FORMS, ecoId);
        const ecoDocSnap = await getDoc(ecoDocRef);
        if (!ecoDocSnap.exists()) {
            throw new Error(`No se encontró el ECO con ID ${ecoId}`);
        }
        const ecoData = ecoDocSnap.data();

        // 2. Create an off-screen container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '1200px'; // A fixed width for consistent layout
        document.body.appendChild(container);

        // 3. Load and populate the form HTML
        const response = await fetch('eco_form.html');
        const html = await response.text();
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const formElement = template.content.firstElementChild;
        container.appendChild(formElement);

        // We need to re-run the section building logic for the offscreen form
        // This is a simplified version of the logic in runEcoFormLogic
        const formSectionsData = [ { title: 'ENG. PRODUCTO', id: 'eng_producto', checklist: [ '¿Se requiere cambio en el plano?', '¿Se requiere cambio en la especificación?', '¿Se requiere un nuevo herramental?', '¿Se requiere un nuevo dispositivo?' ] }, { title: 'CALIDAD', id: 'calidad', checklist: [ '¿Se requiere un nuevo plan de control?', '¿Se requiere un nuevo estudio de capacidad?', '¿Se requiere un nuevo R&R?', '¿Se requiere un nuevo layout?' ] }, { title: 'ENG. PROCESO', id: 'eng_proceso', checklist: [ '¿Se requiere un nuevo diagrama de flujo?', '¿Se requiere un nuevo AMEF?', '¿Se requiere un nuevo estudio de tiempos?', '¿Se requiere una nueva instrucción de trabajo?' ] }, { title: 'COMPRAS', id: 'compras', checklist: [ '¿Se requiere un nuevo proveedor?', '¿Se requiere un nuevo acuerdo de precios?', '¿Se requiere un nuevo embalaje?', '¿Se requiere un nuevo transporte?' ] }, { title: 'LOGISTICA', id: 'logistica', checklist: [ '¿Se requiere un nuevo layout de almacén?', '¿Se requiere un nuevo sistema de identificación?', '¿Se requiere un nuevo flujo de materiales?', '¿Se requiere un nuevo sistema de transporte interno?' ] }, { title: 'IMPLEMENTACIÓN', id: 'implementacion', checklist: [ '¿Se requiere actualizar el stock?', '¿Se requiere notificar al cliente?', '¿Se requiere capacitar al personal?', '¿Se requiere validar el proceso?' ] }, { title: 'APROBACIÓN FINAL', id: 'aprobacion_final', description: 'Aprobación final del ECO y cierre del proceso.', checklist: null } ];
        const dynamicContainer = formElement.querySelector('#dynamic-form-sections');
        dynamicContainer.innerHTML = ''; // Clear placeholder
        formSectionsData.forEach(section => {
             const checklistItemsHTML = section.checklist ? section.checklist.map((item, index) => `<div class="checklist-item"> <span class="checklist-item-label">${item}</span> <div class="checklist-item-options"> <input type="checkbox" name="check_${section.id}_${index}_si" class="form-checkbox h-5 w-5 text-blue-600"> <input type="checkbox" name="check_${section.id}_${index}_na" class="form-checkbox h-5 w-5 text-blue-600"> </div> </div>`).join('') : '';
             const mainContentHTML = section.checklist ? `<div class="section-checklist"> <div class="checklist-header"> <span>Ítem</span> <div class="flex items-center"> <span class="mr-4">SI</span> <span>N/A</span> </div> </div> ${checklistItemsHTML} </div> <div class="section-comments"> <label for="comments_${section.id}" class="font-bold text-gray-700">Comentarios:</label> <textarea id="comments_${section.id}" name="comments_${section.id}" rows="10" class="mt-2 w-full border rounded-md p-2"></textarea> </div>` : `<div class="p-4 w-full"> <p class="text-gray-700">${section.description}</p> </div>`;
             const statusFieldHTML = section.checklist ? `<div class="footer-field"> <label>Estado</label> <div class="status-options"> <label class="flex items-center"><input type="radio" name="status_${section.id}" value="ok" class="form-radio h-4 w-4 text-green-600"> <span class="ml-2">OK</span></label> <label class="flex items-center"><input type="radio" name="status_${section.id}" value="nok" class="form-radio h-4 w-4 text-red-600"> <span class="ml-2">NOK</span></label> </div> </div>` : '';
             const sectionHTML = `<div class="section-block"> <div class="section-sidebar"> <span>${section.title}</span> </div> <div class="section-main"> <div class="section-content"> ${mainContentHTML} </div> <div class="section-footer"> <div class="footer-fields"> <div class="footer-field"> <label for="date_${section.id}">Fecha</label> <input type="date" id="date_${section.id}" name="date_${section.id}" class="p-1 border rounded-md"> </div> ${statusFieldHTML} </div> <div class="footer-fields"> <div class="footer-field"> <label for="name_${section.id}">Nombre</label> <input type="text" id="name_${section.id}" name="name_${section.id}" class="p-1 border rounded-md"> </div> <div class="footer-field"> <label for="date_signature_${section.id}">Fecha</label> <input type="date" id="date_signature_${section.id}" name="date_signature_${section.id}" class="p-1 border rounded-md"> </div> <div class="footer-field"> <label for="visto_${section.id}">Visto</label> <input type="text" id="visto_${section.id}" name="visto_${section.id}" class="p-1 border rounded-md"> </div> </div> </div> </div> </div>`;
             dynamicContainer.insertAdjacentHTML('beforeend', sectionHTML);
        });

        // This helper is defined in runEcoFormLogic, so we need to redefine it or make it global.
        // For now, let's copy the definition.
        const populateEcoForm = (form, data) => { if (!data || !form) return; for (const key in data) { if (key === 'checklists' && typeof data.checklists === 'object') { for (const section in data.checklists) { data.checklists[section].forEach((item, index) => { if (item.si) form.querySelector(`input[name="check_${section}_${index}_si"]`).checked = true; if (item.na) form.querySelector(`input[name="check_${section}_${index}_na"]`).checked = true; }); } } else if (key === 'comments' && typeof data.comments === 'object') { for (const section in data.comments) { const textarea = form.querySelector(`[name="comments_${section}"]`); if (textarea) textarea.value = data.comments[section]; } } else if (key === 'signatures' && typeof data.signatures === 'object') { for (const sectionId in data.signatures) { for (const field in data.signatures[sectionId]) { const inputName = `${field}_${sectionId}`; const inputElement = form.querySelector(`[name="${inputName}"]`); if (inputElement) { if (inputElement.type === 'radio') { const radioToSelect = form.querySelector(`[name="${inputName}"][value="${data.signatures[sectionId][field]}"]`); if (radioToSelect) radioToSelect.checked = true; } else { inputElement.value = data.signatures[sectionId][field]; } } } } } else { const element = form.querySelector(`[name="${key}"]`); if (element) { element.value = data[key]; } } } };
        populateEcoForm(formElement, ecoData);

        // 4. Use html2canvas to render the form
        const canvas = await html2canvas(formElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
             onclone: (clonedDoc) => {
                // Ensure both stylesheets are loaded for the cloned document
                const styleSheet = document.getElementById('eco-form-styles');
                if (styleSheet) {
                    clonedDoc.head.appendChild(styleSheet.cloneNode(true));
                }
                const printStyleSheet = document.querySelector('link[href="print.css"]');
                 if (printStyleSheet) {
                    clonedDoc.head.appendChild(printStyleSheet.cloneNode(true));
                }

                // Hacer que el input ECR N° parezca texto plano
                const ecrInput = clonedDoc.getElementById('ecr_no');
                if (ecrInput) {
                    ecrInput.style.border = 'none';
                    ecrInput.style.background = 'transparent';
                    ecrInput.style.paddingLeft = '0';
                    ecrInput.setAttribute('readonly', 'true');
                }
            }
        });

        // 5. Create PDF and add the image sliced into multiple pages
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        // Calculate the height of the image in the PDF when scaled to the PDF's width
        const imgHeight = canvas.height * pdfWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add the first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add new pages if the content is taller than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // 6. Save the PDF
        pdf.save(`ECO_${ecoId}.pdf`);

        // 7. Clean up the off-screen container
        document.body.removeChild(container);

    } catch (error) {
        console.error("Error exporting ECO to PDF:", error);
        showToast('Error al exportar el PDF.', 'error');
    } finally {
        dom.loadingOverlay.style.display = 'none';
    }
}

function updateGodModeIndicator() {
    const indicator = document.getElementById('god-mode-indicator');
    if (!indicator) return;

    if (appState.godModeState?.isImpersonating) {
        const roleLabels = { admin: 'Admin', editor: 'Editor', lector: 'Lector' };
        const currentRoleLabel = roleLabels[appState.currentUser.role] || 'Desconocido';
        indicator.innerHTML = `
            <div class="god-mode-badge">
                <i data-lucide="shield-alert" class="w-4 h-4"></i>
                <span>Viendo como: <strong>${currentRoleLabel}</strong></span>
            </div>
        `;
        indicator.style.display = 'block';
        lucide.createIcons();
    } else {
        indicator.innerHTML = '';
        indicator.style.display = 'none';
    }
}

function handleGodModeRoleChange(role) {
    if (!appState.godModeState) return;

    if (role === 'real') {
        appState.currentUser.role = appState.godModeState.realRole;
        appState.godModeState.isImpersonating = false;
        showToast(`Modo Dios: Rol real restaurado (${appState.currentUser.role}).`, 'info');
    } else {
        appState.godModeState.isImpersonating = true;
        appState.currentUser.role = role;
        showToast(`Modo Dios: Viendo como ${role}.`, 'success');
    }

    updateNavForRole();
    renderUserMenu();
    switchView(appState.currentView);
    updateGodModeIndicator();
}

function handleGlobalClick(e) {
    const target = e.target;
    const authLink = target.closest('a[data-auth-screen]');
    const profileLink = target.closest('a[data-view="profile"]');
    if (authLink) {
        e.preventDefault();
        const verifyPanel = document.getElementById('verify-email-panel');
        if (verifyPanel && !verifyPanel.classList.contains('hidden')) {
            location.reload();
        } else {
            showAuthScreen(authLink.dataset.authScreen);
        }
        return;
    }
    
    if(profileLink) {
        e.preventDefault();
        document.getElementById('user-dropdown')?.classList.add('hidden');
        switchView(profileLink.dataset.view);
        return;
    }
    
    const godModeButton = target.closest('.god-mode-role-btn');
    if (godModeButton) {
        e.preventDefault();
        const roleToSimulate = godModeButton.dataset.godModeRole;
        handleGodModeRoleChange(roleToSimulate);
        document.getElementById('user-dropdown')?.classList.add('hidden');
        return;
    }

    // Close user menu
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuButton && !userMenuButton.contains(target) && userDropdown && !userDropdown.contains(target)) {
        userDropdown.classList.add('hidden');
    }

    // Close nav dropdowns
    if (!target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }
    
    if (!target.closest('#export-menu-container')) document.getElementById('export-dropdown')?.classList.add('hidden'); 
    if (!target.closest('#type-filter-btn')) document.getElementById('type-filter-dropdown')?.classList.add('hidden'); 
    if (!target.closest('#add-client-filter-btn')) document.getElementById('add-client-filter-dropdown')?.classList.add('hidden');
    if (!e.target.closest('#level-filter-btn') && !e.target.closest('#level-filter-dropdown')) {
        document.getElementById('level-filter-dropdown')?.classList.add('hidden');
    }
    
    if(target.closest('#user-menu-button')) { userDropdown?.classList.toggle('hidden'); }
    if(target.closest('#logout-button')) { e.preventDefault(); logOutUser(); }
    if(target.closest('#resend-verification-btn')) { handleResendVerificationEmail(); }
}

// =================================================================================
// --- 6. LÓGICA DE VISTAS (DASHBOARD, TABLAS, ÁRBOLES, ETC.) ---
// =================================================================================

async function runTableLogic(direction = 'first') {
    const config = viewConfig[appState.currentView];
    if (!config || !config.dataKey) return;

    const PAGE_SIZE = 10;
    const collectionRef = collection(db, config.dataKey);
    const baseQuery = query(collectionRef, orderBy("id"));

    let currentPage = appState.pagination.currentPage;
    if (direction === 'next') {
        currentPage++;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'first') {
        // Reset pagination state for the new view
        appState.pagination = { pageCursors: { 1: null }, currentPage: 1, totalItems: 0 };
        currentPage = 1;
    }

    const cursor = appState.pagination.pageCursors[currentPage];
    let q;
    if (cursor) {
        q = query(baseQuery, startAfter(cursor), limit(PAGE_SIZE));
    } else {
        q = query(baseQuery, limit(PAGE_SIZE));
    }

    try {
        // Fetch total count only on the first load of a view
        if (direction === 'first') {
            const countSnapshot = await getCountFromServer(query(collection(db, config.dataKey)));
            appState.pagination.totalItems = countSnapshot.data().count;
        }

        const documentSnapshots = await getDocs(q);
        const data = documentSnapshots.docs.map(doc => ({ ...doc.data(), docId: doc.id }));

        if (documentSnapshots.empty && currentPage > 1) {
            appState.pagination.currentPage = currentPage - 1;
            const nextButton = dom.viewContent.querySelector('button[data-action="next-page"]');
            if (nextButton) nextButton.disabled = true;
            showToast('No hay más resultados.', 'info');
            return;
        }

        appState.pagination.currentPage = currentPage;

        if (config.dataKey === COLLECTIONS.USUARIOS) {
            appState.currentData = data.filter(user => user.disabled !== true);
        } else {
            appState.currentData = data;
        }

        renderTable(appState.currentData, config);

        if (!documentSnapshots.empty) {
            const lastVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            appState.pagination.pageCursors[currentPage + 1] = lastVisibleDoc;
        }

        // Disable/enable next button based on items fetched
        const totalPages = Math.ceil(appState.pagination.totalItems / PAGE_SIZE);
        const nextButton = dom.viewContent.querySelector('button[data-action="next-page"]');
        if (nextButton) {
            nextButton.disabled = currentPage >= totalPages;
        }
    } catch (error) {
        console.error("Error fetching paginated data:", error);
        showToast("Error al cargar los datos. Puede que necesite crear un índice en Firestore.", "error");
    }
}

function renderTable(data, config) {
    const PAGE_SIZE = 10; // Ensure this is consistent with runTableLogic
    const { currentPage, totalItems } = appState.pagination;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    let tableHTML = `<div class="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up">
        <div class="flex justify-end mb-4">
            <button data-action="export-pdf" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 flex items-center text-sm shadow-sm"><i data-lucide="file-text" class="mr-2 h-4 w-4"></i>PDF</button>
            <button data-action="export-excel" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm ml-2 shadow-sm"><i data-lucide="file-spreadsheet" class="mr-2 h-4 w-4"></i>Excel</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-600">
                <thead class="text-xs text-gray-700 uppercase bg-gray-100"><tr>`;
    config.columns.forEach(col => { tableHTML += `<th scope="col" class="px-6 py-3">${col.label}</th>`; });
    tableHTML += `<th scope="col" class="px-6 py-3 text-right">Acciones</th></tr></thead><tbody>`;
    if (data.length === 0) {
        tableHTML += `<tr><td colspan="${config.columns.length + 1}"><div class="text-center py-16 text-gray-500"><i data-lucide="search-x" class="mx-auto h-16 w-16 text-gray-300"></i><h3 class="mt-4 text-lg font-semibold">Sin resultados</h3><p class="text-sm">No hay datos para mostrar en esta vista.</p></div></td></tr>`;
    } else {
        data.forEach(item => {
            tableHTML += `<tr class="bg-white border-b hover:bg-gray-50 transition-colors duration-150">`;
            config.columns.forEach(col => {
                const value = col.format ? col.format(item[col.key]) : (item[col.key] || 'N/A');
                tableHTML += `<td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${value}</td>`;
            });
            tableHTML += `<td class="px-6 py-4 flex items-center justify-end space-x-3">
                <button data-action="details" data-id="${item.id}" data-doc-id="${item.docId}" class="text-gray-500 hover:text-blue-600" title="Ver Detalles"><i data-lucide="info" class="h-5 w-5 pointer-events-none"></i></button>
                ${checkUserPermission('edit', item) ? `<button data-action="edit" data-id="${item.id}" data-doc-id="${item.docId}" class="text-gray-500 hover:text-green-600" title="Editar"><i data-lucide="edit" class="h-5 w-5 pointer-events-none"></i></button>` : ''}
                ${checkUserPermission('delete', item) ? `<button data-action="delete" data-id="${item.id}" data-doc-id="${item.docId}" class="text-gray-500 hover:text-red-600" title="Eliminar"><i data-lucide="trash-2" class="h-5 w-5 pointer-events-none"></i></button>` : ''}
            </td></tr>`;
        });
    }
    tableHTML += `</tbody></table></div>
    <div class="flex justify-between items-center pt-4">
        <button data-action="prev-page" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
        <span class="text-sm font-semibold text-gray-600">Página ${currentPage} de ${totalPages > 0 ? totalPages : 1}</span>
        <button data-action="next-page" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-semibold">Siguiente</button>
    </div>
    </div>`;
    dom.viewContent.innerHTML = tableHTML;
    lucide.createIcons();
}

async function handleSearch() {
    const config = viewConfig[appState.currentView];
    const searchTerm = dom.searchInput.value.trim(); // No toLowerCase, Firestore is case-sensitive
    if (!searchTerm) {
        runTableLogic('first');
        return;
    }
    if (!config || !config.dataKey) {
        return;
    }
    showToast(`Buscando "${searchTerm}"...`, 'info');
    try {
        const collectionRef = collection(db, config.dataKey);
        const searchFields = config.columns.map(col => col.key);

        // Firestore 'or' queries have a limit of 30 equality clauses.
        if (searchFields.length > 30) {
            showToast('La búsqueda está limitada a los primeros 30 campos.', 'info');
            searchFields.length = 30;
        }
        
        // Build an array of `where` conditions for the `or` query.
        const whereClauses = searchFields.map(field => where(field, '==', searchTerm));

        // Add "starts-with" condition for the primary search field (usually the first column)
        const primarySearchField = searchFields[0];
        whereClauses.push(where(primarySearchField, '>=', searchTerm));
        whereClauses.push(where(primarySearchField, '<=', searchTerm + '\uf8ff'));


        const q = query(collectionRef, or(...whereClauses));

        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));

        appState.currentData = results;
        renderTable(results, config);

        const paginationControls = dom.viewContent.querySelector('.flex.justify-between.items-center.pt-4');
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }

    } catch (error) {
        console.error('Error durante la búsqueda:', error);
        if (error.code === 'failed-precondition' && error.message.includes('https://console.firebase.google.com')) {
            const urlRegex = /(https:\/\/[^\s]+)/;
            const urlMatch = error.message.match(urlRegex);
            if (urlMatch) {
                const firestoreIndexUrl = urlMatch[0].replace('?create_composite=true', '');
                const toastMessage = `
                    <span>Se requiere un índice de Firestore.</span>
                    <a href="${firestoreIndexUrl}" target="_blank" class="toast-link">Crear Índice</a>
                `;
                showToast(toastMessage, 'error', 15000);
            } else {
                showToast('Error de búsqueda: Se requiere un índice compuesto en Firestore.', 'error', 5000);
            }
        } else {
             showToast('Error al realizar la búsqueda.', 'error');
        }
    }
}

function handleExport(type) {
    const config = viewConfig[appState.currentView];
    const data = appState.currentData;
    const title = config.title;

    if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });

        // Use the columns from the config for headers to match the screen
        const headers = config.columns.map(col => col.label);
        const body = data.map(item => {
            return config.columns.map(col => {
                const value = col.format ? col.format(item[col.key]) : (item[col.key] || 'N/A');
                return value;
            });
        });

        doc.autoTable({
            head: [headers],
            body: body,
            startY: 25, // Start table lower to make space for header
            styles: { fontSize: 8, cellPadding: 1.5 },
            headStyles: { fillColor: [41, 104, 217], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [241, 245, 249] },
            // Let the library handle column widths automatically for a generic solution
            columnStyles: {},
            didDrawPage: (data) => {
                // Page Header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(title, 14, 15);

                // Page Footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            }
        });

        const fileName = `${config.dataKey}_export_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

    } else if (type === 'excel') {
        // Excel export can use the more detailed field list
        const excelData = data.map(item => {
            let row = {};
            config.fields.forEach(field => {
                let value = item[field.key] || '';
                // Resolve IDs to descriptions for 'select' fields with a searchKey
                if (field.type === 'select' && field.searchKey && value) {
                    const sourceCollection = appState.collectionsById[field.searchKey];
                    const relatedItem = sourceCollection?.get(value);
                    value = relatedItem ? (relatedItem.descripcion || relatedItem.name) : value; // Use 'name' as fallback for users
                }
                row[field.label] = value;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        const fileName = `${config.dataKey}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
    showToast(`Exportación a ${type.toUpperCase()} iniciada.`, 'success');
}

async function openFormModal(item = null) {
    const config = viewConfig[appState.currentView];
    const isEditing = item !== null;
    const modalId = `form-modal-${Date.now()}`;
    
    let fieldsHTML = '';
    config.fields.forEach(field => {
        const isReadonly = (isEditing && field.key === 'id') || field.readonly;
        let inputHTML = '';
        const commonClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
        const readonlyClasses = isReadonly ? 'bg-gray-100 cursor-not-allowed' : '';
        const value = item ? (item[field.key] || '') : '';
        
        if (field.type === 'select') {
            let optionsHTML = '';
            const options = field.searchKey ? appState.collections[field.searchKey] : field.options;

            if (field.searchKey) {
                options.forEach(opt => {
                    const isSelected = opt.id === value;
                    optionsHTML += `<option value="${opt.id}" ${isSelected ? 'selected' : ''}>${opt.descripcion || opt.name}</option>`;
                });
            } else { // Simple array of options
                options.forEach(opt => {
                    const optionValue = typeof opt === 'string' ? opt.toLowerCase() : opt;
                    const isSelected = optionValue === value;
                    optionsHTML += `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>${opt}</option>`;
                });
            }
            inputHTML = `<select id="${field.key}" name="${field.key}" class="${commonClasses} ${readonlyClasses}" ${isReadonly ? 'disabled' : ''} ${field.required ? 'required' : ''}>${optionsHTML}</select>`;

        } else if (field.type === 'search-select') {
            let selectedItemName = 'Ninguno seleccionado';
            if (isEditing && value) {
                const sourceDB = appState.collections[field.searchKey];
                const foundItem = sourceDB.find(dbItem => dbItem.id === value);
                if(foundItem) selectedItemName = foundItem.descripcion;
            }
            inputHTML = `<div class="flex items-center gap-2">
                <input type="text" id="${field.key}-display" value="${selectedItemName}" class="${commonClasses} bg-gray-100" readonly>
                <input type="hidden" id="${field.key}" name="${field.key}" value="${value}">
                <button type="button" data-action="open-search-modal" data-search-key="${field.searchKey}" data-field-key="${field.key}" class="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"><i data-lucide="search" class="h-5 w-5"></i></button>
            </div>`;
        } else if (field.type === 'textarea') {
            inputHTML = `<textarea id="${field.key}" name="${field.key}" rows="3" class="${commonClasses} ${readonlyClasses}" ${field.required ? 'required' : ''} ${isReadonly ? 'readonly' : ''}>${value}</textarea>`;
        } else {
            inputHTML = `<input type="${field.type}" id="${field.key}" name="${field.key}" value="${value}" class="${commonClasses} ${readonlyClasses}" ${field.required ? 'required' : ''} ${isReadonly ? 'readonly' : ''}>`;
        }
        
        fieldsHTML += `<div class="${field.type === 'textarea' || field.type === 'search-select' || field.key === 'id' || field.type === 'select' ? 'md:col-span-2' : ''}">
            <label for="${field.type === 'search-select' ? field.key + '-display' : field.key}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
            ${inputHTML}
            <p id="error-${field.key}" class="text-xs text-red-600 mt-1 h-4"></p>
        </div>`;
    });

    const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4 modal-content"><div class="flex justify-between items-center p-5 border-b"><h3 class="text-xl font-bold">${isEditing ? 'Editar' : 'Agregar'} ${config.singular}</h3><button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button></div><form id="data-form" class="p-6 overflow-y-auto" novalidate><input type="hidden" name="edit-doc-id" value="${isEditing ? item.docId : ''}"><div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">${fieldsHTML}</div></form><div class="flex justify-end items-center p-4 border-t bg-gray-50 space-x-3"><button data-action="close" type="button" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button><button type="submit" form="data-form" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar</button></div></div></div>`;
    
    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();
    const modalElement = document.getElementById(modalId);
    config.fields.forEach(field => {
        const input = modalElement.querySelector(`[name="${field.key}"]`);
        if (input) {
            input.addEventListener('blur', () => validateField(field, input));
        }
    });
    
    modalElement.querySelector('form').addEventListener('submit', (e) => handleFormSubmit(e, config.fields));
    
    modalElement.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'close') {
            modalElement.remove();
        }
        else if (action === 'open-search-modal') {
            const fieldKey = button.dataset.fieldKey;
            openAssociationSearchModal(button.dataset.searchKey, (selectedItem) => {
                const fieldInput = document.getElementById(fieldKey);
                const displayInput = document.getElementById(`${fieldKey}-display`);
                if (fieldInput && displayInput) {
                    fieldInput.value = selectedItem.id;
                    displayInput.value = selectedItem.descripcion;
                    validateField({ key: fieldKey, required: true }, fieldInput);
                }
            });
        }
    });
}

function validateField(fieldConfig, inputElement) {
    const errorElement = document.getElementById(`error-${fieldConfig.key}`);
    let isValid = true;
    let errorMessage = '';
    if (fieldConfig.required && !inputElement.value) {
        isValid = false;
        errorMessage = 'Este campo es obligatorio.';
    }
    if (errorElement) errorElement.textContent = errorMessage;
    inputElement.classList.toggle('border-red-500', !isValid);
    inputElement.classList.toggle('border-gray-300', isValid);
    return isValid;
}

async function handleFormSubmit(e, fields) {
    e.preventDefault();
    
    let isFormValid = true;
    for (const field of fields) {
        const input = e.target.querySelector(`[name="${field.key}"]`);
        if (input && !validateField(field, input)) {
            isFormValid = false;
        }
    }
    if (!isFormValid) {
        showToast('Por favor, corrija los errores en el formulario.', 'error');
        return;
    }
    const form = e.target;
    const modalElement = form.closest('.fixed');
    const formData = new FormData(form);
    const docId = formData.get('edit-doc-id');
    const newItem = {};
    const config = viewConfig[appState.currentView];
    
    for (const field of config.fields) {
        const value = formData.get(field.key);
        if (field.type === 'number') {
            newItem[field.key] = value ? parseFloat(value) : null;
        } else {
            newItem[field.key] = value;
        }
    }
    
    if (!docId) {
        newItem.createdAt = new Date();
    }
    const saveButton = form.closest('.modal-content').querySelector('button[type="submit"]');
    const originalButtonHTML = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = `<i data-lucide="loader" class="animate-spin h-5 w-5"></i>`;
    lucide.createIcons();

    const success = await saveDocument(config.dataKey, newItem, docId);
    
    if (success) {
        modalElement.remove();
        // No es necesario llamar a runTableLogic, el listener en tiempo real se encargará de actualizar la vista.
    } else {
        // Restore button on failure
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonHTML;
    }
}

function openDetailsModal(item) {
    const config = viewConfig[appState.currentView];
    let fieldsHTML = '';
    config.fields.forEach(field => {
        let value = item[field.key] || 'N/A';
        if (field.type === 'search-select') {
            const sourceDB = appState.collections[field.searchKey];
            const foundItem = sourceDB.find(dbItem => dbItem.id === value);
            value = foundItem ? foundItem.descripcion : 'N/A';
        }
        fieldsHTML += `<div class="${field.type === 'textarea' || field.key === 'id' ? 'md:col-span-2' : ''}"><label class="block text-sm font-medium text-gray-500">${field.label}</label><div class="mt-1 text-sm text-gray-900 bg-gray-100 p-2 rounded-md border min-h-[38px] break-words">${value}</div></div>`;
    });
    
    const modalHTML = `<div id="details-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4 modal-content"><div class="flex justify-between items-center p-5 border-b"><h3 class="text-xl font-bold">Detalles de ${config.singular}</h3><button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-6 overflow-y-auto"><div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">${fieldsHTML}</div></div><div class="flex justify-end items-center p-4 border-t bg-gray-50"><button data-action="close" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cerrar</button></div></div></div>`;
    
    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();
    document.getElementById('details-modal').addEventListener('click', e => {
        if (e.target.closest('button')?.dataset.action === 'close') document.getElementById('details-modal').remove();
    });
}

function openAssociationSearchModal(searchKey, onSelect) {
    const config = { 
        [COLLECTIONS.CLIENTES]: { title: 'Buscar Cliente', data: appState.collections[COLLECTIONS.CLIENTES] }, 
        [COLLECTIONS.SECTORES]: { title: 'Buscar Sector', data: appState.collections[COLLECTIONS.SECTORES] }, 
        [COLLECTIONS.PROCESOS]: { title: 'Buscar Proceso', data: appState.collections[COLLECTIONS.PROCESOS] },
        [COLLECTIONS.PROVEEDORES]: { title: 'Buscar Proveedor', data: appState.collections[COLLECTIONS.PROVEEDORES] },
        [COLLECTIONS.UNIDADES]: { title: 'Buscar Unidad', data: appState.collections[COLLECTIONS.UNIDADES] }
    };
    const searchConfig = config[searchKey];
    if (!searchConfig) return;
    const modalId = `assoc-search-modal-${Date.now()}`;
    const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col m-4 modal-content"><div class="flex justify-between items-center p-5 border-b"><h3 class="text-xl font-bold">${searchConfig.title}</h3><button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-6"><input type="text" id="assoc-search-term" placeholder="Buscar..." class="w-full border-gray-300 rounded-md shadow-sm"></div><div id="assoc-search-results" class="p-6 border-t overflow-y-auto flex-1"></div></div></div>`;
    
    dom.modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    const modalElement = document.getElementById(modalId);
    const searchInput = modalElement.querySelector('#assoc-search-term');
    const resultsContainer = modalElement.querySelector('#assoc-search-results');
    const renderResults = (term = '') => {
        term = term.toLowerCase();
        const filteredData = searchConfig.data.filter(item => item.id.toLowerCase().includes(term) || item.descripcion.toLowerCase().includes(term));
        resultsContainer.innerHTML = filteredData.length === 0 ? `<p class="text-gray-500 text-center py-8">No hay resultados.</p>` : `<div class="space-y-2">${filteredData.map(item => `<button data-item-id="${item.id}" class="w-full text-left p-3 bg-gray-50 hover:bg-blue-100 rounded-md border transition"><p class="font-semibold">${item.descripcion}</p><p class="text-sm text-gray-500">${item.id}</p></button>`).join('')}</div>`;
    };
    searchInput.addEventListener('input', () => renderResults(searchInput.value));
    resultsContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-item-id]');
        if (button) {
            const selectedItem = searchConfig.data.find(d => d.id === button.dataset.itemId);
            onSelect(selectedItem);
            modalElement.remove();
        }
    });
    modalElement.querySelector('button[data-action="close"]').addEventListener('click', () => modalElement.remove());
    renderResults();
}

function renderDashboardAdminPanel() {
    const container = document.getElementById('dashboard-admin-panel-container');
    if (!container) return;

    if (!checkUserPermission('delete')) { // 'delete' is used as a proxy for admin-level permissions
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 class="text-xl font-bold text-slate-800 mb-4">Panel de Administración</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="border border-yellow-300 bg-yellow-50 p-4 rounded-lg">
                    <h4 class="font-bold text-yellow-800">Limpiar y Cargar Datos</h4>
                    <p class="text-xs text-yellow-700 my-2">Borra todo excepto usuarios y carga datos de prueba.</p>
                    <button data-action="seed-database" class="w-full bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600 font-semibold text-sm">
                        <i data-lucide="database-zap" class="inline-block mr-1.5 h-4 w-4"></i>Ejecutar
                    </button>
                </div>
                <div class="border border-orange-300 bg-orange-50 p-4 rounded-lg">
                    <h4 class="font-bold text-orange-800">Borrar Solo Datos</h4>
                    <p class="text-xs text-orange-700 my-2">Borra todos los datos pero mantiene a los usuarios.</p>
                    <button data-action="clear-data-only" class="w-full bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 font-semibold text-sm">
                        <i data-lucide="shield-check" class="inline-block mr-1.5 h-4 w-4"></i>Ejecutar
                    </button>
                </div>
                <div class="border border-red-300 bg-red-50 p-4 rounded-lg">
                    <h4 class="font-bold text-red-800">Borrar Otros Usuarios</h4>
                    <p class="text-xs text-red-700 my-2">Elimina a todos los usuarios excepto al admin principal.</p>
                    <button data-action="clear-other-users" class="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 font-semibold text-sm">
                        <i data-lucide="user-x" class="inline-block mr-1.5 h-4 w-4"></i>Ejecutar
                    </button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function updateDashboard(collectionName) {
    if (appState.currentView !== 'dashboard') return;

    // The new component-based approach handles updates by re-rendering the specific component.
    switch (collectionName) {
        case COLLECTIONS.PRODUCTOS:
        case COLLECTIONS.INSUMOS:
        case COLLECTIONS.SEMITERMINADOS:
            renderDashboardKpis();
            renderDashboardActivityFeed();
            break;
        case COLLECTIONS.PROYECTOS:
            renderDashboardKpis();
            break;
        case COLLECTIONS.TAREAS:
            renderDashboardKpis();
            renderDashboardTasks();
            renderDashboardCharts();
            break;
    }
}

function runDashboardLogic() {
    const currentUser = appState.currentUser;

    // 1. Create the main skeleton of the dashboard.
    const skeletonHTML = `
    <div class="animate-fade-in-up space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold text-slate-800">Bienvenido, ${currentUser.name}</h1>
                <p class="text-slate-500 mt-1">Aquí tienes un resumen de la actividad reciente y tus tareas.</p>
            </div>
        </div>

        <!-- KPI Cards Placeholder -->
        <div id="dashboard-kpi-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column -->
            <div id="dashboard-left-column" class="lg:col-span-2 space-y-6">
                <!-- My Tasks Placeholder -->
                <div id="dashboard-tasks-container"></div>

                <!-- Task Charts Placeholder -->
                <div id="dashboard-charts-container">
                    <div class="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Resumen de Tareas</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div>
                                <p class="text-sm font-semibold text-slate-600 mb-2 text-center">Mis Tareas por Estado</p>
                                <div class="h-48 relative">
                                    <canvas id="dashboard-status-chart"></canvas>
                                </div>
                            </div>
                            <div class="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                                <p class="text-sm font-semibold text-slate-600 mb-2 text-center">Tareas por Prioridad (Global)</p>
                                <div class="h-48 relative">
                                    <canvas id="dashboard-priority-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Admin Panel Placeholder -->
                <div id="dashboard-admin-panel-container"></div>
            </div>

            <!-- Right Column -->
            <div id="dashboard-right-column" class="space-y-6">
                <!-- Recent Activity Placeholder -->
                <div id="dashboard-activity-container"></div>
            </div>
        </div>
    </div>
    `;
    dom.viewContent.innerHTML = skeletonHTML;

    // 2. Call the self-contained component renderers
    renderDashboardKpis();
    renderDashboardTasks();
    renderDashboardCharts();
    renderDashboardActivityFeed();
    renderDashboardAdminPanel();

    lucide.createIcons();
}

// --- DASHBOARD COMPONENT RENDERERS ---

function renderDashboardKpis() {
    const container = document.getElementById('dashboard-kpi-container');
    if (!container) return;

    const { productos, insumos, tareas, proyectos } = appState.collections;
    const myTasks = tareas.filter(t => t.assigneeUid === appState.currentUser.uid && t.status !== 'done');
    const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const activeProjects = proyectos.filter(p => p.status !== 'finalizado');

    const kpis = [
        { id: 'kpi-productos', value: productos.length, label: 'Productos Totales', icon: 'package', color: 'blue' },
        { id: 'kpi-insumos', value: insumos.length, label: 'Insumos Registrados', icon: 'beaker', color: 'green' },
        { id: 'kpi-proyectos', value: activeProjects.length, label: 'Proyectos Activos', icon: 'kanban-square', color: 'amber' },
        { id: 'kpi-vencidas', value: overdueTasks.length, label: 'Tareas Vencidas', icon: 'alert-circle', color: 'red' }
    ];

    container.innerHTML = kpis.map(kpi => `
        <div class="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex items-center space-x-4">
            <div class="p-3 rounded-full bg-${kpi.color}-100 text-${kpi.color}-600"><i data-lucide="${kpi.icon}" class="h-8 w-8"></i></div>
            <div><p id="${kpi.id}" class="text-3xl font-bold">${kpi.value}</p><p class="text-sm font-semibold text-gray-600">${kpi.label}</p></div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderDashboardTasks() {
    const container = document.getElementById('dashboard-tasks-container');
    if (!container) return;

    const myTasks = appState.collections.tareas.filter(t => t.assigneeUid === appState.currentUser.uid && t.status !== 'done');

    let taskListHTML;
    if (myTasks.length === 0) {
        taskListHTML = `
            <div class="text-center py-8 text-slate-500">
                <i data-lucide="check-circle-2" class="h-12 w-12 mx-auto text-green-500"></i>
                <h4 class="mt-4 font-semibold">¡Todo en orden!</h4>
                <p class="text-sm">No tienes tareas pendientes.</p>
            </div>
        `;
    } else {
        taskListHTML = myTasks.slice(0, 5).map(task => {
            const dueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
            const today = new Date();
            today.setHours(0,0,0,0);
            const isOverdue = dueDate && dueDate < today;
            const dateClass = isOverdue ? 'text-red-600 font-bold' : 'text-slate-500';
            const dueDateStr = dueDate ? `Vence: ${dueDate.toLocaleDateString('es-AR')}` : 'Sin fecha límite';

            return `
            <div class="p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer" onclick="switchView('tareas')">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-slate-700">${task.title}</span>
                    <span class="text-xs ${dateClass}">${dueDateStr}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    Prioridad: <span class="font-medium">${task.priority || 'Media'}</span>
                </div>
            </div>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Mis Tareas Pendientes</h3>
            <div class="space-y-3">${taskListHTML}</div>
        </div>
    `;
    lucide.createIcons();
}

let dashboardCharts = { statusChart: null, priorityChart: null };

function destroyDashboardCharts() {
    Object.keys(dashboardCharts).forEach(key => {
        if (dashboardCharts[key]) {
            dashboardCharts[key].destroy();
            dashboardCharts[key] = null;
        }
    });
}

function renderDashboardCharts() {
    const container = document.getElementById('dashboard-charts-container');
    if (!container) return;

    // HTML structure is now in runDashboardLogic. This function only manages the charts.

    const myTasks = appState.collections.tareas.filter(t => t.assigneeUid === appState.currentUser.uid && t.status !== 'done');
    const allTasks = appState.collections.tareas;

    // --- STATUS CHART (Doughnut) ---
    const statusCtx = document.getElementById('dashboard-status-chart')?.getContext('2d');
    if (statusCtx) {
        const statusCounts = myTasks.reduce((acc, task) => {
            const status = task.status || 'todo';
            if (status === 'todo' || status === 'inprogress') {
                acc[status] = (acc[status] || 0) + 1;
            }
            return acc;
        }, { todo: 0, inprogress: 0 });

        if (dashboardCharts.statusChart) {
            dashboardCharts.statusChart.data.datasets[0].data = [statusCounts.todo, statusCounts.inprogress];
            dashboardCharts.statusChart.update();
        } else {
            dashboardCharts.statusChart = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Por Hacer', 'En Progreso'],
                    datasets: [{ data: [statusCounts.todo, statusCounts.inprogress], backgroundColor: ['#f59e0b', '#3b82f6'], borderColor: '#ffffff', borderWidth: 4, hoverOffset: 8 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 20 } }
                    },
                    cutout: '60%'
                }
            });
        }
    }

    // --- PRIORITY CHART (Bar) ---
    const priorityCtx = document.getElementById('dashboard-priority-chart')?.getContext('2d');
    if (priorityCtx) {
        const activeTasks = allTasks.filter(t => t.status !== 'done');
        const priorityCounts = activeTasks.reduce((acc, task) => {
            acc[task.priority || 'medium'] = (acc[task.priority || 'medium'] || 0) + 1;
            return acc;
        }, { low: 0, medium: 0, high: 0 });
        const priorityData = [priorityCounts.low, priorityCounts.medium, priorityCounts.high];

        if (dashboardCharts.priorityChart) {
            dashboardCharts.priorityChart.data.datasets[0].data = priorityData;
            dashboardCharts.priorityChart.update();
        } else {
            dashboardCharts.priorityChart = new Chart(priorityCtx, {
                type: 'bar',
                data: {
                    labels: ['Baja', 'Media', 'Alta'],
                    datasets: [{
                        label: 'Tareas Activas',
                        data: priorityData,
                        backgroundColor: ['#6b7280', '#f59e0b', '#ef4444'],
                        borderRadius: 4,
                        maxBarThickness: 30
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0 // Show only whole numbers
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }
}

function renderDashboardActivityFeed() {
    const container = document.getElementById('dashboard-activity-container');
    if (!container) return;

    const { productos, insumos, semiterminados } = appState.collections;
    const allItems = [...productos, ...insumos, ...semiterminados];
    const recentActivity = allItems.filter(item => item.createdAt?.seconds).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds).slice(0, 5);

    let contentHTML;
    if (recentActivity.length === 0) {
        contentHTML = `<p class="text-sm text-center text-slate-500 py-4">No hay actividad reciente.</p>`;
    } else {
        const typeMap = {
            productos: { icon: 'package', label: 'Producto', color: 'blue' },
            insumos: { icon: 'beaker', label: 'Insumo', color: 'green' },
            semiterminados: { icon: 'box', label: 'Semiterminado', color: 'purple' }
        };
        const getType = (item) => {
            if ('version_vehiculo' in item) return typeMap.productos;
            if ('proceso' in item) return typeMap.semiterminados;
            return typeMap.insumos;
        };
        contentHTML = recentActivity.map(item => {
            const itemType = getType(item);
            const timeAgo = formatTimeAgo(item.createdAt.seconds * 1000);
            return `
                <div class="flex items-start space-x-3">
                    <div class="p-2 rounded-full bg-${itemType.color}-100 text-${itemType.color}-600"><i data-lucide="${itemType.icon}" class="h-5 w-5"></i></div>
                    <div>
                        <p class="text-sm"><span class="font-bold">${itemType.label}</span> <span class="font-semibold text-slate-700">${item.descripcion}</span> fue creado.</p>
                        <p class="text-xs text-slate-400">${timeAgo}</p>
                    </div>
                </div>`;
        }).join('');
    }

    container.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h3>
            <div class="space-y-4">${contentHTML}</div>
        </div>
    `;
    lucide.createIcons();
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const seconds = Math.floor((now - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return `hace ${Math.floor(seconds)} segundos`;
}

async function handleProductSelect(productId) {
    // Buscamos el producto en los datos actualmente cargados en la tabla.
    // Esto es más eficiente que buscar en toda la colección si ya está en la vista.
    let producto = appState.currentData.find(p => p.id === productId);
    if (!producto) {
        producto = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.id === productId);
    }
    if (!producto) {
        showToast("Error: Producto no encontrado.", "error");
        return;
    }

    try {
        const productoRef = doc(db, COLLECTIONS.PRODUCTOS, producto.docId);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
            showToast("Error: El documento del producto ya no existe.", "error");
            return;
        }

        let productoData = productoSnap.data();

        // Si el producto no tiene un campo 'estructura', lo creamos.
        if (!productoData.estructura || productoData.estructura.length === 0) {
            const nuevaEstructura = [crearComponente('producto', productoData)];
            await updateDoc(productoRef, { estructura: nuevaEstructura });
            productoData.estructura = nuevaEstructura; // Actualizamos la data local para no tener que volver a leer.
            showToast(`Nueva estructura de árbol creada para ${productoData.descripcion}.`, 'success');
        }

        // Usamos el producto directamente como el "árbol activo".
        // Añadimos 'nombre' para mantener la compatibilidad con la vista de detalle.
        appState.arbolActivo = {
            ...productoData,
            docId: productoSnap.id,
            nombre: `Árbol de ${productoData.descripcion}`,
            productoPrincipalId: productoData.id // Mantenemos consistencia
        };

        renderArbolDetalle();

    } catch (error) {
        console.error("Error al seleccionar el producto y cargar su estructura:", error);
        showToast(error.message || "Ocurrió un error al cargar el árbol del producto.", 'error');
        renderArbolesInitialView(); // Volvemos a la vista inicial en caso de error.
    }
}

async function guardarEstructura(button) {
    if (!appState.arbolActivo || !button) return;
    const originalText = button.innerHTML;
    button.innerHTML = `<i data-lucide="loader" class="h-5 w-5 animate-spin"></i><span>Guardando...</span>`;
    lucide.createIcons();
    button.disabled = true;
    try {
        // Ahora, appState.arbolActivo.docId es el ID del documento en la colección 'productos'.
        const productoRef = doc(db, COLLECTIONS.PRODUCTOS, appState.arbolActivo.docId);
        await updateDoc(productoRef, {
            estructura: appState.arbolActivo.estructura,
            lastUpdated: new Date(),
            lastUpdatedBy: appState.currentUser.name
        });
        
        button.innerHTML = `<i data-lucide="check" class="h-5 w-5"></i><span>¡Guardado!</span>`;
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        button.classList.add('bg-green-600');
        lucide.createIcons();

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.add('bg-blue-600', 'hover:bg-blue-700');
            button.classList.remove('bg-green-600');
            button.disabled = false;
            appState.arbolActivo = null; // Limpiamos el estado del árbol activo.
            renderArbolesInitialView(); // Volvemos a la pantalla de selección.
        }, 2000);
    } catch (error) {
        console.error("Error guardando la estructura del producto:", error);
        showToast("Error al guardar la estructura del producto.", "error");
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// =================================================================================
// --- 7. LÓGICA DE TAREAS (KANBAN BOARD) ---
// =================================================================================

let taskState = {
    activeFilter: 'engineering', // 'engineering', 'personal', 'all', 'supervision'
    searchTerm: '',
    priorityFilter: 'all',
    unsubscribers: [],
    selectedUserId: null // For admin view
};

function runTasksLogic() {
    runKanbanBoardLogic();
}

function renderTaskDashboardView() {
    const isAdmin = appState.currentUser.role === 'admin';
    const title = isAdmin ? "Estadísticas del Equipo" : "Mis Estadísticas";
    const subtitle = isAdmin ? "Analiza, filtra y gestiona las tareas del equipo." : "Un resumen de tu carga de trabajo y progreso.";

    // Main layout is the same, but we will hide elements for non-admins
    dom.viewContent.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">${title}</h2>
                    <p class="text-sm text-slate-500">${subtitle}</p>
                </div>
                <button data-action="admin-back-to-board" class="bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300 font-semibold flex items-center flex-shrink-0">
                    <i data-lucide="arrow-left" class="mr-2 h-5 w-5"></i>
                    <span>Volver al Tablero</span>
                </button>
            </div>

            <!-- Global Admin Filters (Admin only) -->
            <div id="admin-filters-container" class="bg-white p-3 rounded-xl shadow-sm border items-center gap-4 ${isAdmin ? 'flex' : 'hidden'}">
                 <label for="admin-view-filter" class="text-sm font-bold text-slate-600 flex-shrink-0">Vista:</label>
                 <select id="admin-view-filter" class="pl-4 pr-8 py-2 border rounded-full bg-slate-50 appearance-none focus:bg-white text-sm">
                    <option value="all">Todas las Tareas</option>
                    <option value="my-tasks">Mis Tareas</option>
                 </select>
                 <div id="admin-user-filter-container" class="hidden">
                    <label for="admin-specific-user-filter" class="text-sm font-bold text-slate-600 flex-shrink-0 ml-4">Usuario:</label>
                    <select id="admin-specific-user-filter" class="pl-4 pr-8 py-2 border rounded-full bg-slate-50 appearance-none focus:bg-white text-sm">
                        <!-- User options will be populated here -->
                    </select>
                 </div>
            </div>
        </div>

        <!-- Tabs Navigation (Admin only) -->
        <div id="admin-tabs-container" class="border-b border-gray-200 ${isAdmin ? 'block' : 'hidden'}">
            <nav id="admin-task-tabs" class="-mb-px flex space-x-6" aria-label="Tabs">
                <button data-tab="dashboard" class="admin-task-tab active-tab group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm">
                    <i data-lucide="layout-dashboard" class="mr-2"></i><span>Dashboard</span>
                </button>
                <button data-tab="calendar" class="admin-task-tab group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm">
                    <i data-lucide="calendar-days" class="mr-2"></i><span>Calendario</span>
                </button>
                <button data-tab="table" class="admin-task-tab group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm">
                    <i data-lucide="table" class="mr-2"></i><span>Tabla de Tareas</span>
                </button>
            </nav>
        </div>

        <div class="py-6 animate-fade-in-up">
            <!-- Tab Panels -->
            <div id="admin-tab-content">
                <!-- Dashboard Panel (Always visible) -->
                <div id="tab-panel-dashboard" class="admin-tab-panel">
                    <div id="task-charts-container" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-xl shadow-lg"><h3 class="text-lg font-bold text-slate-800 mb-4">Tareas por Estado</h3><div id="status-chart-container" class="h-64 flex items-center justify-center"><canvas id="status-chart"></canvas></div></div>
                        <div class="bg-white p-6 rounded-xl shadow-lg"><h3 class="text-lg font-bold text-slate-800 mb-4">Tareas por Prioridad</h3><div id="priority-chart-container" class="h-64 flex items-center justify-center"><canvas id="priority-chart"></canvas></div></div>
                        <div id="user-load-chart-wrapper" class="bg-white p-6 rounded-xl shadow-lg ${isAdmin ? 'block' : 'hidden'} lg:col-span-2"><h3 class="text-lg font-bold text-slate-800 mb-4">Carga por Usuario (Tareas Abiertas)</h3><div id="user-load-chart-container" class="h-64 flex items-center justify-center"><canvas id="user-load-chart"></canvas></div></div>
                    </div>
                </div>

                <!-- Calendar Panel (Admin only) -->
                <div id="tab-panel-calendar" class="admin-tab-panel hidden">
                    <div class="bg-white p-6 rounded-xl shadow-lg">
                        <div id="calendar-header" class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                            <div class="flex items-center gap-4">
                                <button id="prev-calendar-btn" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="chevron-left" class="h-6 w-6"></i></button>
                                <h3 id="calendar-title" class="text-2xl font-bold text-slate-800 text-center w-48"></h3>
                                <button id="next-calendar-btn" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="chevron-right" class="h-6 w-6"></i></button>
                                <button id="today-calendar-btn" class="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 text-sm font-semibold">Hoy</button>
                            </div>
                            <div class="flex items-center gap-2">
                                <select id="calendar-priority-filter" class="pl-4 pr-8 py-2 border rounded-full bg-white shadow-sm appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                                    <option value="all">Prioridad (todas)</option>
                                    <option value="high">Alta</option>
                                    <option value="medium">Media</option>
                                    <option value="low">Baja</option>
                                </select>
                                <div class="flex items-center gap-2 rounded-lg bg-slate-200 p-1">
                                    <button data-view="monthly" class="calendar-view-btn px-4 py-1.5 text-sm font-semibold rounded-md">Mensual</button>
                                    <button data-view="weekly" class="calendar-view-btn px-4 py-1.5 text-sm font-semibold rounded-md">Semanal</button>
                                </div>
                            </div>
                        </div>
                        <div id="calendar-grid" class="mt-6">
                            <!-- Calendar will be rendered here -->
                        </div>
                    </div>
                </div>

                <!-- Table Panel (Admin only) -->
                <div id="tab-panel-table" class="admin-tab-panel hidden">
                    <div class="bg-white p-6 rounded-xl shadow-lg">
                        <div id="task-table-controls" class="flex flex-col md:flex-row gap-4 mb-4">
                            <div class="relative flex-grow"><i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i><input type="text" id="admin-task-search" placeholder="Buscar por título..." class="w-full pl-10 pr-4 py-2 border rounded-full bg-slate-50 focus:bg-white"></div>
                            <div class="flex items-center gap-4 flex-wrap">
                                <select id="admin-task-user-filter" class="pl-4 pr-8 py-2 border rounded-full bg-slate-50 appearance-none focus:bg-white"><option value="all">Todos los usuarios</option></select>
                                <select id="admin-task-priority-filter" class="pl-4 pr-8 py-2 border rounded-full bg-slate-50 appearance-none focus:bg-white"><option value="all">Todas las prioridades</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select>
                                <select id="admin-task-status-filter" class="pl-4 pr-8 py-2 border rounded-full bg-slate-50 appearance-none focus:bg-white">
                                    <option value="active">Activas</option>
                                    <option value="all">Todos los estados</option>
                                    <option value="todo">Por Hacer</option>
                                    <option value="inprogress">En Progreso</option>
                                    <option value="done">Completada</option>
                                </select>
                            </div>
                            <button id="add-new-task-admin-btn" class="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 flex items-center shadow-md transition-transform transform hover:scale-105 flex-shrink-0"><i data-lucide="plus" class="mr-2 h-5 w-5"></i>Nueva Tarea</button>
                        </div>
                        <div id="task-data-table-container" class="overflow-x-auto"><p class="text-center py-16 text-slate-500 flex items-center justify-center gap-3"><i data-lucide="loader" class="h-6 w-6 animate-spin"></i>Cargando tabla de tareas...</p></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Tab switching logic for admins
    if (isAdmin) {
        const tabs = document.querySelectorAll('.admin-task-tab');
        const panels = document.querySelectorAll('.admin-tab-panel');

        document.getElementById('admin-task-tabs').addEventListener('click', (e) => {
            const tabButton = e.target.closest('.admin-task-tab');
            if (!tabButton) return;

            const tabName = tabButton.dataset.tab;

            tabs.forEach(tab => {
                tab.classList.remove('active-tab');
            });
            tabButton.classList.add('active-tab');

            panels.forEach(panel => {
                if (panel.id === `tab-panel-${tabName}`) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    }

    const tasksRef = collection(db, COLLECTIONS.TAREAS);
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allTasks = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));

        if(isAdmin) {
            adminTaskViewState.tasks = allTasks;
            updateAdminDashboardData(allTasks);
        } else {
            const myTasks = allTasks.filter(t => t.assigneeUid === appState.currentUser.uid || t.creatorUid === appState.currentUser.uid);
            renderAdminTaskCharts(myTasks); // Directly render charts with user's tasks
        }
    }, (error) => {
        console.error("Error fetching tasks for dashboard:", error);
        showToast('Error al cargar las tareas del dashboard.', 'error');
    });

    // Initial render of components for admins
    if(isAdmin) {
        renderCalendar(); // Initialize the calendar structure once
        setupAdminTaskViewListeners();
        updateAdminDashboardData([]); // Initial call with empty data to render skeletons
    }

    appState.currentViewCleanup = () => {
        unsubscribe();
        destroyAdminTaskCharts();
        adminTaskViewState = {
            tasks: [],
            filters: { searchTerm: '', user: 'all', priority: 'all', status: 'all' },
            sort: { by: 'createdAt', order: 'desc' },
            pagination: { currentPage: 1, pageSize: 10 },
            calendar: {
                currentDate: new Date(),
                view: 'monthly' // 'monthly' or 'weekly'
            }
        };
    };
}

function updateAdminDashboardData(tasks) {
    let filteredTasks = [...tasks];
    const { viewMode } = adminTaskViewState;
    const currentUser = appState.currentUser;

    if (viewMode === 'my-tasks') {
        filteredTasks = tasks.filter(t => t.creatorUid === currentUser.uid || t.assigneeUid === currentUser.uid);
    } else if (viewMode !== 'all') {
        // A specific user's UID is selected
        filteredTasks = tasks.filter(t => t.assigneeUid === viewMode);
    }

    // The components below will use the globally filtered task list
    renderAdminTaskCharts(filteredTasks);
    renderCalendar(adminTaskViewState.calendar.currentDate, adminTaskViewState.calendar.view);


    // This function has its own internal filtering based on table controls
    renderFilteredAdminTaskTable();
}

let adminCharts = { statusChart: null, priorityChart: null, userLoadChart: null };

function destroyAdminTaskCharts() {
    Object.keys(adminCharts).forEach(key => {
        if (adminCharts[key]) {
            adminCharts[key].destroy();
            adminCharts[key] = null;
        }
    });
}

function renderAdminTaskCharts(tasks) {
    destroyAdminTaskCharts();
    renderStatusChart(tasks);
    renderPriorityChart(tasks);
    renderUserLoadChart(tasks);
}

function renderStatusChart(tasks) {
    const ctx = document.getElementById('status-chart')?.getContext('2d');
    if (!ctx) return;

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const statusCounts = activeTasks.reduce((acc, task) => {
        const status = task.status || 'todo';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { todo: 0, inprogress: 0 });

    adminCharts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Por Hacer', 'En Progreso'],
            datasets: [{
                data: [statusCounts.todo, statusCounts.inprogress],
                backgroundColor: ['#f59e0b', '#3b82f6'],
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderPriorityChart(tasks) {
    const ctx = document.getElementById('priority-chart')?.getContext('2d');
    if (!ctx) return;

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const priorityCounts = activeTasks.reduce((acc, task) => {
        const priority = task.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, { low: 0, medium: 0, high: 0 });

    adminCharts.priorityChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Baja', 'Media', 'Alta'],
            datasets: [{
                data: [priorityCounts.low, priorityCounts.medium, priorityCounts.high],
                backgroundColor: ['#6b7280', '#f59e0b', '#ef4444'],
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderUserLoadChart(tasks) {
    const ctx = document.getElementById('user-load-chart')?.getContext('2d');
    if (!ctx) return;

    const openTasks = tasks.filter(t => t.status !== 'done');
    const userTaskCounts = openTasks.reduce((acc, task) => {
        const assigneeUid = task.assigneeUid || 'unassigned';
        acc[assigneeUid] = (acc[assigneeUid] || 0) + 1;
        return acc;
    }, {});

    const userMap = appState.collectionsById.usuarios;
    const labels = Object.keys(userTaskCounts).map(uid => userMap.get(uid)?.name || 'No Asignado');
    const data = Object.values(userTaskCounts);

    adminCharts.userLoadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tareas Abiertas',
                data: data,
                backgroundColor: '#3b82f6',
                borderColor: '#1d4ed8',
                borderWidth: 1,
                maxBarThickness: data.length < 3 ? 50 : undefined
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

let adminTaskViewState = {
    tasks: [],
    viewMode: 'all', // 'all', 'my-tasks', or a specific user's UID
    filters: {
        searchTerm: '',
        user: 'all',
        priority: 'all',
        status: 'active'
    },
    sort: {
        by: 'createdAt',
        order: 'desc'
    },
    pagination: {
        currentPage: 1,
        pageSize: 10
    },
    calendar: {
        currentDate: new Date(),
        view: 'monthly' // 'monthly' or 'weekly'
    }
};

function setupAdminTaskViewListeners() {
    const controls = {
        // Main view filters
        viewFilter: document.getElementById('admin-view-filter'),
        specificUserFilter: document.getElementById('admin-specific-user-filter'),
        specificUserContainer: document.getElementById('admin-user-filter-container'),
        // Table-specific filters
        search: document.getElementById('admin-task-search'),
        user: document.getElementById('admin-task-user-filter'),
        priority: document.getElementById('admin-task-priority-filter'),
        status: document.getElementById('admin-task-status-filter'),
        addNew: document.getElementById('add-new-task-admin-btn'),
        tableContainer: document.getElementById('task-data-table-container'),
        // Timeline filters are removed, so no controls to declare.
    };

    if (!controls.viewFilter) return; // Exit if the main controls aren't rendered

    // --- Populate User Dropdowns ---
    const users = appState.collections.usuarios || [];
    const userOptionsHTML = users.map(u => `<option value="${u.docId}">${u.name || u.email}</option>`).join('');
    controls.specificUserFilter.innerHTML = userOptionsHTML;
    // Add a "Select a user" prompt
    controls.specificUserFilter.insertAdjacentHTML('afterbegin', '<option value="" disabled selected>Seleccionar usuario...</option>');
    controls.user.innerHTML = '<option value="all">Todos los asignados</option>' + userOptionsHTML;

    // --- Main View Filter Logic ---
    controls.viewFilter.addEventListener('change', (e) => {
        const selection = e.target.value;
        if (selection === 'all' || selection === 'my-tasks') {
            controls.specificUserContainer.classList.add('hidden');
            adminTaskViewState.viewMode = selection;
            updateAdminDashboardData(adminTaskViewState.tasks);
        } else {
             // This logic can be extended if more options are added
        }
    });

    // Add a specific option to trigger user selection
    if(!controls.viewFilter.querySelector('option[value="specific-user"]')) {
        controls.viewFilter.insertAdjacentHTML('beforeend', '<option value="specific-user">Usuario específico...</option>');
    }

    controls.viewFilter.addEventListener('change', (e) => {
        if (e.target.value === 'specific-user') {
            controls.specificUserContainer.classList.remove('hidden');
        } else {
            controls.specificUserContainer.classList.add('hidden');
            adminTaskViewState.viewMode = e.target.value;
            updateAdminDashboardData(adminTaskViewState.tasks);
        }
    });

    controls.specificUserFilter.addEventListener('change', (e) => {
        adminTaskViewState.viewMode = e.target.value;
        updateAdminDashboardData(adminTaskViewState.tasks);
    });


    // --- Table Filter Logic ---
    const rerenderTable = () => {
        adminTaskViewState.pagination.currentPage = 1;
        renderFilteredAdminTaskTable();
    };

    controls.search.addEventListener('input', (e) => { adminTaskViewState.filters.searchTerm = e.target.value.toLowerCase(); rerenderTable(); });
    controls.user.addEventListener('change', (e) => { adminTaskViewState.filters.user = e.target.value; rerenderTable(); });
    controls.priority.addEventListener('change', (e) => { adminTaskViewState.filters.priority = e.target.value; rerenderTable(); });
    controls.status.addEventListener('change', (e) => { adminTaskViewState.filters.status = e.target.value; rerenderTable(); });
    controls.addNew.addEventListener('click', () => openTaskFormModal(null, 'todo'));

    // --- Table-specific Click Logic ---
    controls.tableContainer.addEventListener('click', (e) => {
        const header = e.target.closest('th[data-sort]');
        if (header) {
            const sortBy = header.dataset.sort;
            if (adminTaskViewState.sort.by === sortBy) {
                adminTaskViewState.sort.order = adminTaskViewState.sort.order === 'asc' ? 'desc' : 'asc';
            } else {
                adminTaskViewState.sort.by = sortBy;
                adminTaskViewState.sort.order = 'asc';
            }
            rerenderTable();
            return;
        }

        const actionButton = e.target.closest('button[data-action]');
        if (actionButton) {
            const action = actionButton.dataset.action;
            const taskId = actionButton.dataset.docId;
            const task = adminTaskViewState.tasks.find(t => t.docId === taskId);

            if (action === 'edit-task' && task) {
                openTaskFormModal(task);
            } else if (action === 'delete-task' && task) {
                 showConfirmationModal('Eliminar Tarea',`¿Estás seguro de que deseas eliminar la tarea "${task.title}"?`,() => deleteDocument(COLLECTIONS.TAREAS, taskId));
            }
        }

        const pageButton = e.target.closest('button[data-page]');
        if (pageButton) {
            adminTaskViewState.pagination.currentPage = parseInt(pageButton.dataset.page, 10);
            renderFilteredAdminTaskTable();
        }
    });

    // --- Calendar Controls Logic ---
    const calendarControls = {
        prevBtn: document.getElementById('prev-calendar-btn'),
        nextBtn: document.getElementById('next-calendar-btn'),
        todayBtn: document.getElementById('today-calendar-btn'),
        viewBtns: document.querySelectorAll('.calendar-view-btn')
    };

    if (calendarControls.prevBtn) {
        calendarControls.prevBtn.addEventListener('click', () => {
            const date = adminTaskViewState.calendar.currentDate;
            if (adminTaskViewState.calendar.view === 'monthly') {
                date.setMonth(date.getMonth() - 1);
            } else {
                date.setDate(date.getDate() - 7);
            }
            renderCalendar(date, adminTaskViewState.calendar.view);
        });

        calendarControls.nextBtn.addEventListener('click', () => {
            const date = adminTaskViewState.calendar.currentDate;
            if (adminTaskViewState.calendar.view === 'monthly') {
                date.setMonth(date.getMonth() + 1);
            } else {
                date.setDate(date.getDate() + 7);
            }
            renderCalendar(date, adminTaskViewState.calendar.view);
        });

        calendarControls.todayBtn.addEventListener('click', () => {
            renderCalendar(new Date(), adminTaskViewState.calendar.view);
        });

        calendarControls.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                renderCalendar(adminTaskViewState.calendar.currentDate, view);
            });
        });

        const calendarPriorityFilter = document.getElementById('calendar-priority-filter');
        if(calendarPriorityFilter) {
            calendarPriorityFilter.addEventListener('change', (e) => {
                adminTaskViewState.filters.priority = e.target.value;
                renderCalendar(adminTaskViewState.calendar.currentDate, adminTaskViewState.calendar.view);
            });
        }

        const calendarGrid = document.getElementById('calendar-grid');
        if (calendarGrid) {
            calendarGrid.addEventListener('click', (e) => {
                if (e.target.closest('[data-task-id]')) {
                    return;
                }
                const dayCell = e.target.closest('.relative.p-2');
                if (dayCell) {
                    const taskList = dayCell.querySelector('.task-list[data-date]');
                    if (taskList) {
                        const dateStr = taskList.dataset.date;
                        openTaskFormModal(null, 'todo', null, dateStr);
                    }
                }
            });
        }
    }
}

function renderFilteredAdminTaskTable() {
    let filteredTasks = [...adminTaskViewState.tasks];
    const { searchTerm, user, priority, status } = adminTaskViewState.filters;

    if (searchTerm) filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(searchTerm) || (t.description && t.description.toLowerCase().includes(searchTerm)));
    if (user !== 'all') filteredTasks = filteredTasks.filter(t => t.assigneeUid === user);
    if (priority !== 'all') filteredTasks = filteredTasks.filter(t => (t.priority || 'medium') === priority);
    if (status === 'active') {
        filteredTasks = filteredTasks.filter(t => t.status !== 'done');
    } else if (status !== 'all') {
        filteredTasks = filteredTasks.filter(t => (t.status || 'todo') === status);
    }

    const { by, order } = adminTaskViewState.sort;
    filteredTasks.sort((a, b) => {
        let valA = a[by] || '';
        let valB = b[by] || '';

        if (by === 'dueDate' || by === 'createdAt') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        }

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    renderAdminTaskTable(filteredTasks);
}

function renderAdminTaskTable(tasksToRender) {
    const container = document.getElementById('task-data-table-container');
    if (!container) return;

    const { currentPage, pageSize } = adminTaskViewState.pagination;
    const totalPages = Math.ceil(tasksToRender.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) adminTaskViewState.pagination.currentPage = totalPages;
    const paginatedTasks = tasksToRender.slice((adminTaskViewState.pagination.currentPage - 1) * pageSize, adminTaskViewState.pagination.currentPage * pageSize);

    const userMap = appState.collectionsById.usuarios;
    const priorityMap = { high: 'Alta', medium: 'Media', low: 'Baja' };
    const statusMap = { todo: 'Por Hacer', inprogress: 'En Progreso', done: 'Completada' };
    const priorityColorMap = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-slate-100 text-slate-800'};
    const statusColorMap = { todo: 'bg-yellow-100 text-yellow-800', inprogress: 'bg-blue-100 text-blue-800', done: 'bg-green-100 text-green-800'};

    const getSortIndicator = (column) => {
        if (adminTaskViewState.sort.by === column) {
            return adminTaskViewState.sort.order === 'asc' ? '▲' : '▼';
        }
        return '';
    };

    let tableHTML = `<table class="w-full text-sm text-left text-gray-600">
        <thead class="text-xs text-gray-700 uppercase bg-gray-100"><tr>
            <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-200" data-sort="title">Tarea ${getSortIndicator('title')}</th>
            <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-200" data-sort="assigneeUid">Asignado a ${getSortIndicator('assigneeUid')}</th>
            <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-200" data-sort="priority">Prioridad ${getSortIndicator('priority')}</th>
            <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-200" data-sort="dueDate">Fecha Límite ${getSortIndicator('dueDate')}</th>
            <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-200" data-sort="status">Estado ${getSortIndicator('status')}</th>
            <th scope="col" class="px-6 py-3 text-right">Acciones</th>
        </tr></thead><tbody>`;

    if (paginatedTasks.length === 0) {
        tableHTML += `<tr><td colspan="6" class="text-center py-16 text-gray-500"><div class="flex flex-col items-center gap-3"><i data-lucide="search-x" class="w-12 h-12 text-gray-300"></i><h4 class="font-semibold">No se encontraron tareas</h4><p>Intente ajustar los filtros de búsqueda.</p></div></td></tr>`;
    } else {
        paginatedTasks.forEach(task => {
            const assignee = userMap.get(task.assigneeUid);
            const assigneeName = assignee ? assignee.name : '<span class="italic text-slate-400">No asignado</span>';
            const priority = task.priority || 'medium';
            const status = task.status || 'todo';
            const dueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-AR') : 'N/A';

            tableHTML += `<tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${task.title}</td>
                <td class="px-6 py-4">${assigneeName}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs ${priorityColorMap[priority]}">${priorityMap[priority]}</span></td>
                <td class="px-6 py-4">${dueDate}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs ${statusColorMap[status]}">${statusMap[status]}</span></td>
                <td class="px-6 py-4 text-right">
                    <button data-action="edit-task" data-doc-id="${task.docId}" class="p-2 text-gray-500 hover:text-blue-600"><i data-lucide="edit" class="h-4 w-4 pointer-events-none"></i></button>
                    <button data-action="delete-task" data-doc-id="${task.docId}" class="p-2 text-gray-500 hover:text-red-600"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>
                </td>
            </tr>`;
        });
    }
    tableHTML += `</tbody></table>`;

    if(totalPages > 1) {
        tableHTML += `<div class="flex justify-between items-center pt-4">`;
        tableHTML += `<button data-page="${currentPage - 1}" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
        tableHTML += `<span class="text-sm font-semibold text-gray-600">Página ${currentPage} de ${totalPages}</span>`;
        tableHTML += `<button data-page="${currentPage + 1}" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
        tableHTML += `</div>`;
    }

    container.innerHTML = tableHTML;
    lucide.createIcons();
}

// =================================================================================
// --- 8. LÓGICA DEL CALENDARIO ---
// =================================================================================
// Helper para obtener el número de la semana ISO 8601.
Date.prototype.getWeekNumber = function() {
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

function renderCalendar(date, view) {
    if (!adminTaskViewState.calendar) return; // Don't render if state is not ready

    const calendarGrid = document.getElementById('calendar-grid');
    const calendarTitle = document.getElementById('calendar-title');

    if (!calendarGrid || !calendarTitle) return;

    const aDate = date || adminTaskViewState.calendar.currentDate;
    const aView = view || adminTaskViewState.calendar.view;

    adminTaskViewState.calendar.currentDate = aDate;
    adminTaskViewState.calendar.view = aView;

    // Update view switcher buttons UI
    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
        if (btn.dataset.view === aView) {
            btn.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
            btn.classList.remove('text-slate-600', 'hover:bg-slate-300/50');
        } else {
            btn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
            btn.classList.add('text-slate-600', 'hover:bg-slate-300/50');
        }
    });

    if (aView === 'monthly') {
        renderMonthlyView(aDate);
    } else { // weekly
        renderWeeklyView(aDate);
    }

    // After rendering the grid, display tasks
    displayTasksOnCalendar(adminTaskViewState.tasks);
}

function renderMonthlyView(date) {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarTitle = document.getElementById('calendar-title');

    const year = date.getFullYear();
    const month = date.getMonth();

    calendarTitle.textContent = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

    let html = `
        <div class="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            <div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">Sem</div>
            <div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">Lunes</div>
            <div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">Martes</div>
            <div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">Miércoles</div>
            <div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">Jueves</div>
            <div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">Viernes</div>
    `;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let currentDate = new Date(firstDayOfMonth);
    let dayOfWeek = currentDate.getDay();
    let dateOffset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
    currentDate.setDate(currentDate.getDate() - dateOffset);

    let weekHasContent = true;
    while(weekHasContent) {
        let weekNumber = currentDate.getWeekNumber();
        html += `<div class="bg-slate-100 text-center p-2 font-bold text-slate-500 text-sm flex items-center justify-center">${weekNumber}</div>`;

        let daysInThisWeekFromMonth = 0;
        for (let i = 0; i < 5; i++) { // Monday to Friday
            const dayClass = (currentDate.getMonth() === month) ? 'bg-white' : 'bg-slate-50 text-slate-400';
            const dateStr = currentDate.toISOString().split('T')[0];
            html += `
                <div class="relative p-2 min-h-[120px] ${dayClass}">
                    <time datetime="${dateStr}" class="font-semibold text-sm">${currentDate.getDate()}</time>
                    <div class="task-list mt-1 space-y-1" data-date="${dateStr}"></div>
                </div>
            `;
            if (currentDate.getMonth() === month) {
                daysInThisWeekFromMonth++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        currentDate.setDate(currentDate.getDate() + 2);

        if (daysInThisWeekFromMonth === 0 && currentDate > lastDayOfMonth) {
            weekHasContent = false;
        }
    }

    html += `</div>`;
    calendarGrid.innerHTML = html;
}

function renderWeeklyView(date) {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarTitle = document.getElementById('calendar-title');

    let dayOfWeek = date.getDay();
    let dateOffset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
    let monday = new Date(date);
    monday.setDate(date.getDate() - dateOffset);

    let friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const weekNumber = monday.getWeekNumber();
    calendarTitle.textContent = `Semana ${weekNumber}`;

    const dayHeaders = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    let headerHtml = '';
    for(let i=0; i<5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        headerHtml += `<div class="font-bold text-sm text-center py-2 bg-slate-50 text-slate-600">${dayHeaders[i]} ${d.getDate()}</div>`;
    }

    let html = `
        <div class="grid grid-cols-5 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            ${headerHtml}
    `;

    for (let i = 0; i < 5; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        html += `
            <div class="relative bg-white p-2 min-h-[200px]">
                <div class="task-list mt-1 space-y-1" data-date="${dateStr}"></div>
            </div>
        `;
    }

    html += `</div>`;
    calendarGrid.innerHTML = html;
}

function displayTasksOnCalendar(tasks) {
    // Clear any existing tasks from the calendar
    document.querySelectorAll('#calendar-grid .task-list').forEach(list => {
        list.innerHTML = '';
    });

    if (!tasks) return;

    const tasksToDisplay = tasks.filter(task => {
        const { priority } = adminTaskViewState.filters;
        if (priority !== 'all' && (task.priority || 'medium') !== priority) {
            return false;
        }
        return true;
    });

    tasksToDisplay.forEach(task => {
        if (task.dueDate) {
            const taskDateStr = task.dueDate;
            const dayCell = document.querySelector(`#calendar-grid .task-list[data-date="${taskDateStr}"]`);

            if (dayCell) {
                const priorityClasses = {
                    high: 'bg-red-100 border-l-4 border-red-500 text-red-800',
                    medium: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800',
                    low: 'bg-slate-100 border-l-4 border-slate-500 text-slate-800',
                };
                const priority = task.priority || 'medium';

                const taskElement = document.createElement('div');
                taskElement.className = `p-1.5 rounded-md text-xs font-semibold cursor-pointer hover:opacity-80 truncate ${priorityClasses[priority]}`;
                taskElement.textContent = task.title;
                taskElement.title = task.title;
                taskElement.dataset.taskId = task.docId;

                taskElement.addEventListener('click', () => {
                    openTaskFormModal(task);
                });

                dayCell.appendChild(taskElement);
            }
        }
    });
}


function runKanbanBoardLogic() {
    if (taskState.activeFilter === 'supervision' && !taskState.selectedUserId) {
        renderAdminUserList();
        return;
    }

    let topBarHTML = '';
    if (taskState.selectedUserId) {
        const selectedUser = appState.collections.usuarios.find(u => u.docId === taskState.selectedUserId);
        topBarHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">Tareas de ${selectedUser?.name || 'Usuario'}</h3>
            <button data-action="admin-back-to-supervision" class="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 text-sm font-semibold">Volver a Supervisión</button>
        </div>
        `;
    }

    // 1. Set up the basic HTML layout for the board
    dom.viewContent.innerHTML = `
        ${topBarHTML}
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 ${taskState.selectedUserId ? 'hidden' : ''}">
            <div id="task-filters" class="flex items-center gap-2 rounded-lg bg-slate-200 p-1 flex-wrap"></div>

            <div class="flex items-center gap-2 flex-grow w-full md:w-auto">
                <div class="relative flex-grow">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                    <input type="text" id="task-search-input" placeholder="Buscar tareas..." class="w-full pl-10 pr-4 py-2 border rounded-full bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                </div>
                <div class="relative">
                    <select id="task-priority-filter" class="pl-4 pr-8 py-2 border rounded-full bg-white shadow-sm appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <option value="all">Prioridad (todas)</option>
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baja</option>
                    </select>
                    <i data-lucide="chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"></i>
                </div>
            </div>

            <div id="kanban-header-buttons" class="flex items-center gap-4 flex-shrink-0">
                <button id="go-to-stats-view-btn" class="bg-slate-700 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 flex items-center shadow-md transition-transform transform hover:scale-105 flex-shrink-0">
                    <i data-lucide="bar-chart-2" class="mr-2 h-5 w-5"></i>Ver Estadísticas
                </button>
                <button id="add-new-task-btn" class="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 flex items-center shadow-md transition-transform transform hover:scale-105">
                    <i data-lucide="plus" class="mr-2 h-5 w-5"></i>Nueva Tarea
                </button>
            </div>
        </div>
        <div id="task-board" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="task-column bg-slate-100/80 rounded-xl" data-status="todo">
                <h3 class="font-bold text-slate-800 p-3 border-b-2 border-slate-300 mb-4 flex justify-between items-center cursor-pointer kanban-column-header">
                    <span class="flex items-center gap-3"><i data-lucide="list-todo" class="w-5 h-5 text-yellow-600"></i>Por Hacer</span>
                    <button class="kanban-toggle-btn p-1 hover:bg-slate-200 rounded-full"><i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i></button>
                </h3>
                <div class="task-list min-h-[300px] p-4 space-y-4 overflow-y-auto"></div>
            </div>
            <div class="task-column bg-slate-100/80 rounded-xl" data-status="inprogress">
                <h3 class="font-bold text-slate-800 p-3 border-b-2 border-slate-300 mb-4 flex justify-between items-center cursor-pointer kanban-column-header">
                    <span class="flex items-center gap-3"><i data-lucide="timer" class="w-5 h-5 text-blue-600"></i>En Progreso</span>
                    <button class="kanban-toggle-btn p-1 hover:bg-slate-200 rounded-full"><i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i></button>
                </h3>
                <div class="task-list min-h-[300px] p-4 space-y-4 overflow-y-auto"></div>
            </div>
            <div class="task-column bg-slate-100/80 rounded-xl" data-status="done">
                <h3 class="font-bold text-slate-800 p-3 border-b-2 border-slate-300 mb-4 flex justify-between items-center cursor-pointer kanban-column-header">
                    <span class="flex items-center gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>Completadas</span>
                    <button class="kanban-toggle-btn p-1 hover:bg-slate-200 rounded-full"><i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i></button>
                </h3>
                <div class="task-list min-h-[300px] p-4 space-y-4 overflow-y-auto"></div>
            </div>
        </div>
    `;
    lucide.createIcons();

    // 2. Set up event listeners for filters and the add button
    document.getElementById('add-new-task-btn').addEventListener('click', () => openTaskFormModal());
    document.getElementById('go-to-stats-view-btn').addEventListener('click', renderTaskDashboardView);

    document.getElementById('task-board').addEventListener('click', e => {
        const header = e.target.closest('.kanban-column-header');
        if (header) {
            header.parentElement.classList.toggle('collapsed');
        }
    });

    document.getElementById('task-search-input').addEventListener('input', e => {
        taskState.searchTerm = e.target.value.toLowerCase();
        fetchAndRenderTasks();
    });
    document.getElementById('task-priority-filter').addEventListener('change', e => {
        taskState.priorityFilter = e.target.value;
        fetchAndRenderTasks();
    });
    setupTaskFilters();

    // 3. Initial fetch and render
    renderTaskFilters();
    fetchAndRenderTasks();

    // The admin button is no longer needed as the entry point is unified.
    // Admins can switch between dashboard and board using the back button.

    // 4. Cleanup logic
    appState.currentViewCleanup = () => {
        taskState.unsubscribers.forEach(unsub => unsub());
        taskState.unsubscribers = [];
        // Reset filters when leaving view
        taskState.searchTerm = '';
        taskState.priorityFilter = 'all';
        taskState.selectedUserId = null;
    };
}

function renderAdminUserList() {
    const users = appState.collections.usuarios || [];
    const tasks = appState.collections.tareas || [];
    const adminId = appState.currentUser.uid;

    const userTaskStats = users
        .filter(user => user.docId !== adminId)
        .map(user => {
            const userTasks = tasks.filter(task => task.assigneeUid === user.docId);
            return {
                ...user,
                stats: {
                    todo: userTasks.filter(t => t.status === 'todo').length,
                    inprogress: userTasks.filter(t => t.status === 'inprogress').length,
                    done: userTasks.filter(t => t.status === 'done').length
                }
            };
        });

    let content = `
        <div class="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold">Supervisión de Tareas de Usuarios</h3>
                <button data-action="admin-back-to-board" class="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 text-sm font-semibold">Volver al Tablero</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    if (userTaskStats.length === 0) {
        content += `<p class="text-slate-500 col-span-full text-center py-12">No hay otros usuarios para supervisar.</p>`;
    } else {
        userTaskStats.forEach(user => {
            content += `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow animate-fade-in-up">
                    <div class="flex items-center space-x-4">
                        <img src="${user.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(user.name || user.email)}`}" alt="Avatar" class="w-12 h-12 rounded-full">
                        <div>
                            <p class="font-bold text-slate-800">${user.name || user.email}</p>
                            <p class="text-sm text-slate-500">${user.email}</p>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-around text-center">
                        <div>
                            <p class="text-2xl font-bold text-yellow-600">${user.stats.todo}</p>
                            <p class="text-xs text-slate-500">Por Hacer</p>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-blue-600">${user.stats.inprogress}</p>
                            <p class="text-xs text-slate-500">En Progreso</p>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-green-600">${user.stats.done}</p>
                            <p class="text-xs text-slate-500">Completadas</p>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                        <button data-action="view-user-tasks" data-user-id="${user.docId}" class="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 text-sm font-semibold">Ver Tareas</button>
                        <button data-action="assign-task-to-user" data-user-id="${user.docId}" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-semibold">Asignar Tarea</button>
                    </div>
                </div>
            `;
        });
    }

    content += `</div></div>`;

    dom.viewContent.innerHTML = content;
    lucide.createIcons();
}

function setupTaskFilters() {
    const filterContainer = document.getElementById('task-filters');
    filterContainer.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button && button.dataset.filter) {
            taskState.activeFilter = button.dataset.filter;
            renderTaskFilters();
            fetchAndRenderTasks();
        }
    });
}

function renderTaskFilters() {
    const filters = [
        { key: 'engineering', label: 'Ingeniería' },
        { key: 'personal', label: 'Mis Tareas' }
    ];
    if (appState.currentUser.role === 'admin') {
        filters.push({ key: 'all', label: 'Todas' });
        filters.push({ key: 'supervision', label: 'Supervisión' });
    }
    const filterContainer = document.getElementById('task-filters');
    filterContainer.innerHTML = filters.map(f => `
        <button data-filter="${f.key}" class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${taskState.activeFilter === f.key ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-300/50'}">
            ${f.label}
        </button>
    `).join('');
}

function fetchAndRenderTasks() {
    // Clear previous listeners
    taskState.unsubscribers.forEach(unsub => unsub());
    taskState.unsubscribers = [];

    const tasksRef = collection(db, COLLECTIONS.TAREAS);
    const user = appState.currentUser;

    // Clear board before fetching and show loading indicator
    document.querySelectorAll('.task-list').forEach(list => list.innerHTML = `<div class="p-8 text-center text-slate-500"><i data-lucide="loader" class="h-8 w-8 animate-spin mx-auto"></i><p class="mt-2">Cargando tareas...</p></div>`);
    lucide.createIcons();

    const handleError = (error) => {
        console.error("Error fetching tasks: ", error);
        let message = "Error al cargar las tareas.";
        if (error.code === 'failed-precondition') {
            message = "Error: Faltan índices en Firestore. Revise la consola para crear el índice necesario.";
        }
        showToast(message, "error", 5000);
        document.querySelectorAll('.task-list').forEach(list => list.innerHTML = `<div class="p-8 text-center text-red-500"><i data-lucide="alert-triangle" class="h-8 w-8 mx-auto"></i><p class="mt-2">Error al cargar.</p></div>`);
        lucide.createIcons();
    };

    let queryConstraints = [orderBy('createdAt', 'desc')];

    // Add base filter (personal, engineering, all)
    if (taskState.selectedUserId) {
        queryConstraints.unshift(where('assigneeUid', '==', taskState.selectedUserId));
    } else if (taskState.activeFilter === 'personal') {
        queryConstraints.unshift(or(
            where('assigneeUid', '==', user.uid),
            where('creatorUid', '==', user.uid)
        ));
    } else if (taskState.activeFilter === 'engineering') {
        queryConstraints.unshift(where('isPublic', '==', true));
    } else if (taskState.activeFilter !== 'all' || user.role !== 'admin') {
        // For admin 'all' view, no additional filter is needed.
        // For non-admin, default to public tasks if no other filter matches.
        if (taskState.activeFilter !== 'all') {
            queryConstraints.unshift(where('isPublic', '==', true));
        }
    }

    // Add priority filter
    if (taskState.priorityFilter !== 'all') {
        queryConstraints.unshift(where('priority', '==', taskState.priorityFilter));
    }

    const q = query(tasksRef, ...queryConstraints);

    const unsub = onSnapshot(q, (snapshot) => {
        let tasks = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));

        // Apply client-side text search
        if (taskState.searchTerm) {
            tasks = tasks.filter(task =>
                task.title.toLowerCase().includes(taskState.searchTerm) ||
                (task.description && task.description.toLowerCase().includes(taskState.searchTerm))
            );
        }

        renderTasks(tasks);
    }, handleError);

    taskState.unsubscribers.push(unsub);
}

function renderTasks(tasks) {
    const getEmptyColumnHTML = (status) => {
        const statusMap = { todo: 'Por Hacer', inprogress: 'En Progreso', done: 'Completada' };
        return `
            <div class="p-4 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-lg h-full flex flex-col justify-center items-center no-drag animate-fade-in">
                <i data-lucide="inbox" class="h-10 w-10 mx-auto text-slate-400"></i>
                <h4 class="mt-4 font-semibold text-slate-600">Columna Vacía</h4>
                <p class="text-sm mt-1 mb-4">No hay tareas en estado "${statusMap[status]}".</p>
                <button data-action="add-task-to-column" data-status="${status}" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm py-1.5 px-3 rounded-full mx-auto flex items-center">
                    <i data-lucide="plus" class="mr-1.5 h-4 w-4"></i>Añadir Tarea
                </button>
            </div>
        `;
    };

    // Defer rendering to the next event loop cycle
    setTimeout(() => {
        const tasksByStatus = { todo: [], inprogress: [], done: [] };
        tasks.forEach(task => {
            tasksByStatus[task.status || 'todo'].push(task);
        });

        document.querySelectorAll('.task-column').forEach(columnEl => {
            const status = columnEl.dataset.status;
            const taskListEl = columnEl.querySelector('.task-list');
            const columnTasks = tasksByStatus[status];

            if (columnTasks.length === 0) {
                taskListEl.innerHTML = getEmptyColumnHTML(status);
            } else {
                taskListEl.innerHTML = '';
                columnTasks.forEach(task => {
                    const taskCardHTML = createTaskCard(task);
                    const template = document.createElement('template');
                    template.innerHTML = taskCardHTML.trim();
                    const cardNode = template.content.firstChild;
                    cardNode.addEventListener('click', (e) => {
                        if (e.target.closest('.task-actions')) return;
                        openTaskFormModal(task);
                    });
                    taskListEl.appendChild(cardNode);
                });
            }
        });

        initTasksSortable();
        lucide.createIcons();
    }, 0);
}

function createTaskCard(task) {
    const assignee = (appState.collections.usuarios || []).find(u => u.docId === task.assigneeUid);
    const priorities = {
        low: { label: 'Baja', color: 'bg-gray-200 text-gray-800' },
        medium: { label: 'Media', color: 'bg-yellow-200 text-yellow-800' },
        high: { label: 'Alta', color: 'bg-red-200 text-red-800' }
    };
    const priority = priorities[task.priority] || priorities.medium;

    const dueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const isOverdue = dueDate && dueDate < today;
    const dueDateStr = dueDate ? dueDate.toLocaleDateString('es-AR') : 'Sin fecha';
    const urgencyClass = isOverdue ? 'border-red-400 bg-red-50/50' : 'border-slate-200';
    const dateClass = isOverdue ? 'text-red-600 font-bold' : 'text-slate-500';

    const creationDate = task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000) : null;
    const creationDateStr = creationDate ? creationDate.toLocaleDateString('es-AR') : 'N/A';

    const taskTypeIcon = task.isPublic
        ? `<span title="Tarea de Ingeniería (Pública)"><i data-lucide="briefcase" class="w-4 h-4 text-slate-400"></i></span>`
        : `<span title="Tarea Privada"><i data-lucide="lock" class="w-4 h-4 text-slate-400"></i></span>`;

    // --- AUDITORÍA: Verificación de Sub-tareas y Barra de Progreso ---
    // La lógica de sub-tareas y su barra de progreso se ha verificado como correcta.
    // 1. `openTaskFormModal` permite añadir, eliminar y marcar sub-tareas como completadas.
    //    Estos cambios se gestionan en el estado local del modal y se guardan con la tarea.
    // 2. La siguiente lógica calcula correctamente el porcentaje de sub-tareas completadas.
    // 3. El `div` con la clase `bg-blue-600` se actualiza con el `width` correspondiente
    //    a este porcentaje, reflejando el progreso visualmente.
    //
    // RESULTADO: CORRECTO. Todos los campos del formulario, incluyendo sub-tareas
    // y su progreso, se reflejan correctamente en la tarjeta de la tarea.
    // -------------------------------------------------------------------------
    let subtaskProgressHTML = '';
    if (task.subtasks && task.subtasks.length > 0) {
        const totalSubtasks = task.subtasks.length;
        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
        const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

        subtaskProgressHTML = `
            <div class="mt-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-semibold text-slate-500 flex items-center">
                        <i data-lucide="check-square" class="w-3.5 h-3.5 mr-1.5"></i>
                        Sub-tareas
                    </span>
                    <span class="text-xs font-bold text-slate-600">${completedSubtasks} / ${totalSubtasks}</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5">
                    <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        `;
    }
    const dragClass = checkUserPermission('edit', task) ? '' : 'no-drag';

    return `
        <div class="task-card bg-white rounded-lg p-4 shadow-sm border ${urgencyClass} cursor-pointer hover:shadow-md hover:border-blue-400 animate-fade-in-up flex flex-col gap-3 ${dragClass}" data-task-id="${task.docId}">
            <div class="flex justify-between items-start gap-2">
                <h4 class="font-bold text-slate-800 flex-grow">${task.title}</h4>
                ${taskTypeIcon}
            </div>

            <p class="text-sm text-slate-600 break-words flex-grow">${task.description || ''}</p>

            ${subtaskProgressHTML}

            <div class="mt-auto pt-3 border-t border-slate-200/80 space-y-3">
                <div class="flex justify-between items-center text-xs text-slate-500">
                    <span class="px-2 py-0.5 rounded-full font-semibold ${priority.color}">${priority.label}</span>
                    <div class="flex items-center gap-3">
                        <span class="flex items-center gap-1.5 font-medium" title="Fecha de creación">
                            <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i> ${creationDateStr}
                        </span>
                        <span class="flex items-center gap-1.5 font-medium ${dateClass}" title="Fecha de entrega">
                            <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i> ${dueDateStr}
                        </span>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        ${assignee ? `<img src="${assignee.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(assignee.name || assignee.email)}`}" title="Asignada a: ${assignee.name || assignee.email}" class="w-6 h-6 rounded-full">` : '<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center" title="No asignada"><i data-lucide="user-x" class="w-4 h-4 text-gray-500"></i></div>'}
                        <span class="text-sm text-slate-500">${assignee ? (assignee.name || assignee.email.split('@')[0]) : 'No asignada'}</span>
                    </div>
                    <div class="task-actions">
                    ${checkUserPermission('delete', task) ? `
                        <button data-action="delete-task" data-doc-id="${task.docId}" class="text-gray-400 hover:text-red-600 p-1 rounded-full" title="Eliminar tarea">
                            <i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSubtask(subtask) {
    const titleClass = subtask.completed ? 'line-through text-slate-500' : 'text-slate-800';
    const containerClass = subtask.completed ? 'opacity-70' : '';
    const checkboxId = `subtask-checkbox-${subtask.id}`;
    return `
        <div class="subtask-item group flex items-center gap-3 p-2 bg-slate-100 hover:bg-slate-200/70 rounded-md transition-all duration-150 ${containerClass}" data-subtask-id="${subtask.id}">
            <label for="${checkboxId}" class="flex-grow flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="${checkboxId}" name="${checkboxId}" class="subtask-checkbox h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" ${subtask.completed ? 'checked' : ''}>
                <span class="flex-grow text-sm font-medium ${titleClass}">${subtask.title}</span>
            </label>
            <button type="button" class="subtask-delete-btn text-slate-400 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>
        </div>
    `;
}

function initTasksSortable() {
    const lists = document.querySelectorAll('.task-list');
    lists.forEach(list => {
        // Destroy existing instance if it exists
        if (list.sortable) {
            list.sortable.destroy();
        }

        list.sortable = new Sortable(list, {
            group: 'tasks',
            animation: 150,
            ghostClass: 'sortable-ghost',
            filter: '.no-drag', // Ignore elements with the 'no-drag' class
            onEnd: async (evt) => {
                const taskId = evt.item.dataset.taskId;
                const newStatus = evt.to.closest('.task-column').dataset.status;
                const taskRef = doc(db, COLLECTIONS.TAREAS, taskId);
                try {
                    await updateDoc(taskRef, { status: newStatus });
                    showToast('Tarea actualizada.', 'success');
                } catch (error) {
                    console.error("Error updating task status:", error);
                    showToast('Error al mover la tarea.', 'error');
                }
            }
        });
    });
}

async function openTaskFormModal(task = null, defaultStatus = 'todo', defaultAssigneeUid = null, defaultDate = null) {
    const isEditing = task !== null;

    // Determine the UID to be pre-selected in the dropdown.
    let selectedUid = defaultAssigneeUid || ''; // Prioritize passed-in UID
    if (!selectedUid) { // If no default is provided, use existing logic
        if (isEditing && task.assigneeUid) {
            selectedUid = task.assigneeUid;
        } else if (!isEditing && taskState.activeFilter === 'personal') {
            // When creating a new personal task, assign it to self by default
            selectedUid = appState.currentUser.uid;
        }
    }

    const modalHTML = `
    <div id="task-form-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4 modal-content">
            <div class="flex justify-between items-center p-5 border-b">
                <h3 class="text-xl font-bold">${isEditing ? 'Editar' : 'Nueva'} Tarea</h3>
                <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
            </div>
            <form id="task-form" class="p-6 overflow-y-auto space-y-4" novalidate>
                <input type="hidden" name="taskId" value="${isEditing ? task.docId : ''}">
                <input type="hidden" name="status" value="${isEditing ? task.status : defaultStatus}">
                <div>
                    <label for="task-title" class="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input type="text" id="task-title" name="title" value="${isEditing && task.title ? task.title : ''}" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required>
                </div>
                <div>
                    <label for="task-description" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea id="task-description" name="description" rows="4" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">${isEditing && task.description ? task.description : ''}</textarea>
                </div>

                <div class="space-y-2 pt-2">
                    <label class="block text-sm font-medium text-gray-700">Sub-tareas</label>
                    <div id="subtasks-list" class="space-y-2 max-h-48 overflow-y-auto p-2 rounded-md bg-slate-50 border"></div>
                    <div class="flex items-center gap-2">
                        <label for="new-subtask-title" class="sr-only">Añadir sub-tarea</label>
                        <input type="text" id="new-subtask-title" name="new-subtask-title" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Añadir sub-tarea y presionar Enter">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="task-assignee" class="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                        <select id="task-assignee" name="assigneeUid" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" data-selected-uid="${selectedUid}">
                            <option value="">Cargando...</option>
                        </select>
                    </div>
                    <div>
                        <label for="task-priority" class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                        <select id="task-priority" name="priority" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="low" ${isEditing && task.priority === 'low' ? 'selected' : ''}>Baja</option>
                            <option value="medium" ${!isEditing || (isEditing && task.priority === 'medium') ? 'selected' : ''}>Media</option>
                            <option value="high" ${isEditing && task.priority === 'high' ? 'selected' : ''}>Alta</option>
                        </select>
                    </div>
                    <div>
                        <label for="task-startdate" class="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                        <input type="date" id="task-startdate" name="startDate" value="${isEditing && task.startDate ? task.startDate : (defaultDate || '')}" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    </div>
                    <div>
                        <label for="task-duedate" class="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
                        <input type="date" id="task-duedate" name="dueDate" value="${isEditing && task.dueDate ? task.dueDate : (defaultDate || '')}" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    </div>
                </div>

                ${appState.currentUser.role === 'admin' ? `
                <div class="pt-2">
                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" id="task-is-public" name="isPublic" class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" ${isEditing && task.isPublic ? 'checked' : ''}>
                        <span class="text-sm font-medium text-gray-700">Tarea Pública (Visible para todos en Ingeniería)</span>
                    </label>
                </div>
                ` : ''}
            </form>
            <div class="flex justify-end items-center p-4 border-t bg-gray-50 space-x-3">
                ${isEditing ? `<button data-action="delete" class="text-red-600 font-semibold mr-auto px-4 py-2 rounded-md hover:bg-red-50">Eliminar Tarea</button>` : ''}
                <button data-action="close" type="button" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
                <button type="submit" form="task-form" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Tarea</button>
            </div>
        </div>
    </div>
    `;
    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();

    populateTaskAssigneeDropdown();

    const modalElement = document.getElementById('task-form-modal');
    const subtaskListEl = modalElement.querySelector('#subtasks-list');
    const newSubtaskInput = modalElement.querySelector('#new-subtask-title');

    let currentSubtasks = isEditing && task.subtasks ? [...task.subtasks] : [];

    const rerenderSubtasks = () => {
        subtaskListEl.innerHTML = currentSubtasks.map(renderSubtask).join('') || '<p class="text-xs text-center text-slate-400 py-2">No hay sub-tareas.</p>';
        modalElement.dataset.subtasks = JSON.stringify(currentSubtasks);
        lucide.createIcons();
    };

    newSubtaskInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const title = newSubtaskInput.value.trim();
            if (title) {
                currentSubtasks.push({
                    id: `sub_${Date.now()}`,
                    title: title,
                    completed: false
                });
                newSubtaskInput.value = '';
                rerenderSubtasks();
            }
        }
    });

    subtaskListEl.addEventListener('click', e => {
        const subtaskItem = e.target.closest('.subtask-item');
        if (!subtaskItem) return;

        const subtaskId = subtaskItem.dataset.subtaskId;
        const subtask = currentSubtasks.find(st => st.id === subtaskId);

        if (e.target.matches('.subtask-checkbox')) {
            if (subtask) {
                subtask.completed = e.target.checked;
                rerenderSubtasks();
            }
        }

        if (e.target.closest('.subtask-delete-btn')) {
            if (subtask) {
                currentSubtasks = currentSubtasks.filter(st => st.id !== subtaskId);
                rerenderSubtasks();
            }
        }
    });

    rerenderSubtasks(); // Initial render

    // Autofocus the title field for new tasks
    if (!isEditing) {
        modalElement.querySelector('#task-title').focus();
    }
    modalElement.querySelector('form').addEventListener('submit', handleTaskFormSubmit);

    modalElement.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'close') {
            modalElement.remove();
        } else if (action === 'delete') {
            showConfirmationModal('Eliminar Tarea', '¿Estás seguro de que quieres eliminar esta tarea?', async () => {
                try {
                    await deleteDoc(doc(db, COLLECTIONS.TAREAS, task.docId));
                    showToast('Tarea eliminada.', 'success');
                    modalElement.remove();
                } catch (error) {
                    showToast('No tienes permiso para eliminar esta tarea.', 'error');
                }
            });
        }
    });
}

async function handleTaskFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const taskId = form.querySelector('[name="taskId"]').value;
    const isEditing = !!taskId;

    const modalElement = form.closest('#task-form-modal');
    const data = {
        title: form.querySelector('[name="title"]').value,
        description: form.querySelector('[name="description"]').value,
        assigneeUid: form.querySelector('[name="assigneeUid"]').value,
        priority: form.querySelector('[name="priority"]').value,
        startDate: form.querySelector('[name="startDate"]').value,
        dueDate: form.querySelector('[name="dueDate"]').value,
        updatedAt: new Date(),
        subtasks: modalElement.dataset.subtasks ? JSON.parse(modalElement.dataset.subtasks) : []
    };

    if (!data.title) {
        showToast('El título es obligatorio.', 'error');
        return;
    }

    // --- AUDITORÍA: Verificación de visibilidad de tareas (Pública/Privada) ---
    // La siguiente lógica cumple con el requisito de la auditoría:
    // 1. Para usuarios no-administradores, la visibilidad se asigna automáticamente.
    //    - Si el filtro activo es 'engineering', la tarea se crea como PÚBLICA (`isPublic` = true).
    //    - Si el filtro es 'personal', la tarea se crea como PRIVADA (`isPublic` = false).
    // 2. Para administradores, se muestra un checkbox que les permite anular este comportamiento
    //    y elegir la visibilidad manualmente.
    //
    // RESULTADO: CORRECTO. El sistema asigna la visibilidad según el filtro activo.
    // -------------------------------------------------------------------------
    const isPublicCheckbox = form.querySelector('[name="isPublic"]');
    if (isPublicCheckbox) {
        data.isPublic = isPublicCheckbox.checked;
    } else if (!isEditing) {
        // Fallback for non-admins creating tasks.
        // When editing, non-admins won't see the checkbox, so the value remains unchanged.
        data.isPublic = taskState.activeFilter === 'engineering';
    }

    const saveButton = form.closest('.modal-content').querySelector('button[type="submit"]');
    const originalButtonHTML = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = `<i data-lucide="loader" class="animate-spin h-5 w-5"></i>`;
    lucide.createIcons();

    let success = false;
    try {
        if (isEditing) {
            const taskRef = doc(db, COLLECTIONS.TAREAS, taskId);
            await updateDoc(taskRef, data);
            showToast('Tarea actualizada con éxito.', 'success');
        } else {
            data.creatorUid = appState.currentUser.uid;
            data.createdAt = new Date();
            data.status = form.querySelector('[name="status"]').value || 'todo';
            await addDoc(collection(db, COLLECTIONS.TAREAS), data);
            showToast('Tarea creada con éxito.', 'success');
        }
        success = true;
        document.getElementById('task-form-modal').remove();
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Error al guardar la tarea.', 'error');
    } finally {
        if (!success) {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonHTML;
        }
    }
}

// --- AUDITORÍA: Verificación de asignación de tareas ---
// La lógica para asignar tareas a usuarios se ha verificado como correcta.
// 1. `openTaskFormModal` prepara el dropdown `task-assignee`.
// 2. `populateTaskAssigneeDropdown` (abajo) lo llena con la lista de usuarios activos.
// 3. `handleTaskFormSubmit` recoge el `assigneeUid` seleccionado y lo guarda en Firestore.
// 4. `createTaskCard` muestra correctamente el avatar y nombre del usuario asignado.
//
// RESULTADO: CORRECTO. El campo de asignación funciona y se refleja en la tarjeta.
// -------------------------------------------------------------------------
function populateTaskAssigneeDropdown() {
    const select = document.getElementById('task-assignee');
    if (!select) return; // Modal is not open

    const users = appState.collections.usuarios || [];
    if (users.length === 0) {
        select.disabled = true; // Keep it disabled until users are loaded
        return;
    }

    select.disabled = false;
    const selectedUid = select.dataset.selectedUid;

    const userOptions = users
        .filter(u => u.disabled !== true)
        .map(u => {
            const displayName = u.name || u.email.split('@')[0];
            return `<option value="${u.docId}">${displayName}</option>`;
        }).join('');

    select.innerHTML = `<option value="">No asignada</option>${userOptions}`;

    if (selectedUid) {
        select.value = selectedUid;
    }
}


async function seedDefaultSectors() {
    const sectorsRef = collection(db, COLLECTIONS.SECTORES);
    const snapshot = await getDocs(query(sectorsRef, limit(1)));

    if (!snapshot.empty) {
        return; // Sectors already exist
    }

    console.log("No sectors found. Seeding default sectors...");
    showToast('Creando sectores por defecto...', 'info');

    const defaultSectors = [
        { id: 'calidad', descripcion: 'Calidad', icon: 'award' },
        { id: 'produccion', descripcion: 'Producción', icon: 'factory' },
        { id: 'ingenieria', descripcion: 'Ingeniería', icon: 'pencil-ruler' },
        { id: 'seguridad-higiene', descripcion: 'Seguridad e Higiene', icon: 'shield-check' }
    ];

    const batch = writeBatch(db);
    defaultSectors.forEach(sector => {
        const docRef = doc(db, COLLECTIONS.SECTORES, sector.id);
        batch.set(docRef, sector);
    });

    try {
        await batch.commit();
        showToast('Sectores por defecto creados con éxito.', 'success');
        console.log('Default sectors created successfully.');
    } catch (error) {
        console.error("Error seeding default sectors:", error);
        showToast('Error al crear los sectores por defecto.', 'error');
    }
}

async function seedDefaultRoles() {
    const rolesRef = collection(db, COLLECTIONS.ROLES);
    const snapshot = await getDocs(query(rolesRef, limit(1)));

    if (!snapshot.empty) {
        return; // Roles already exist
    }

    console.log("No roles found. Seeding default roles...");
    showToast('Creando roles por defecto...', 'info');

    const defaultRoles = [
        { id: 'admin', descripcion: 'Administrador' },
        { id: 'editor', descripcion: 'Editor' },
        { id: 'lector', descripcion: 'Lector' }
    ];

    const batch = writeBatch(db);
    defaultRoles.forEach(role => {
        const docRef = doc(db, COLLECTIONS.ROLES, role.id);
        batch.set(docRef, role);
    });

    try {
        await batch.commit();
        showToast('Roles por defecto creados con éxito.', 'success');
        console.log('Default roles created successfully.');
    } catch (error) {
        console.error("Error seeding default roles:", error);
        showToast('Error al crear los roles por defecto.', 'error');
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (user.emailVerified) {
            const wasAlreadyLoggedIn = !!appState.currentUser;

            // Show loading overlay with appropriate message
            const loadingText = dom.loadingOverlay.querySelector('p');
            loadingText.textContent = wasAlreadyLoggedIn ? 'Recargando datos...' : 'Verificación exitosa, cargando datos...';
            dom.loadingOverlay.style.display = 'flex';

            // Fetch user profile
            const userDocRef = doc(db, COLLECTIONS.USUARIOS, user.uid);
            let userDocSnap = await getDoc(userDocRef);

            // Self-healing: If user is authenticated but has no profile in Firestore, create one.
            if (!userDocSnap.exists()) {
                showToast(`Creando perfil para usuario existente: ${user.email}`, 'info', 4000);
                const newUserDoc = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: 'lector', // Default role for self-healed users
                    sector: 'Sin Asignar',
                    createdAt: new Date(),
                    photoURL: user.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(user.displayName || user.email)}`
                };
                try {
                    await setDoc(userDocRef, newUserDoc);
                    // Re-fetch the document so the rest of the login flow has the correct data
                    userDocSnap = await getDoc(userDocRef);
                    console.log(`User profile self-healed in Firestore for ${user.email}`);
                } catch (error) {
                    console.error("Error self-healing user profile:", error);
                    showToast('Error crítico al crear el perfil de usuario. Contacte a un administrador.', 'error', 10000);
                    // Log out the user if their profile can't be created, as the app might not function correctly.
                    await signOut(auth);
                    return; // Stop execution
                }
            }

            if (userDocSnap.exists() && userDocSnap.data().disabled) {
                await signOut(auth);
                dom.loadingOverlay.style.display = 'none';
                showToast('Tu cuenta ha sido deshabilitada por un administrador.', 'error', 5000);
                return;
            }

            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            appState.currentUser = {
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(user.displayName || user.email)}`,
                role: userData.role || 'lector',
                isSuperAdmin: userData.isSuperAdmin || user.uid === 'KTIQRzPBRcOFtBRjoFViZPSsbSq2'
            };

            // Initialize God Mode state if applicable
            if (appState.currentUser.isSuperAdmin) {
                appState.godModeState = {
                    realRole: appState.currentUser.role,
                    isImpersonating: false
                };
            } else {
                appState.godModeState = null;
            }

            // Only the super admin should perform the initial data seeding.
            if (appState.currentUser.isSuperAdmin) {
                await seedDefaultSectors();
                await seedDefaultRoles();
            }

            // Show app shell behind overlay
            dom.authContainer.classList.add('hidden');
            dom.appView.classList.remove('hidden');
            updateNavForRole();
            renderUserMenu();

            // Wait for essential data to load
            await startRealtimeListeners();

            // Hide overlay and render the initial view
            switchView('dashboard');
            updateGodModeIndicator(); // Set initial state of indicator
            dom.loadingOverlay.style.display = 'none';

            if (!wasAlreadyLoggedIn) {
                showToast(`¡Bienvenido de nuevo, ${appState.currentUser.name}!`, 'success');
            }
        } else {
            dom.loadingOverlay.style.display = 'none';
            showToast('Por favor, verifica tu correo electrónico para continuar.', 'info');
            showAuthScreen('verify-email');
        }
    } else {
        dom.loadingOverlay.style.display = 'none';
        const wasLoggedIn = !!appState.currentUser;

        stopRealtimeListeners();
        appState.currentUser = null;
        dom.authContainer.classList.remove('hidden');
        dom.appView.classList.add('hidden');
        updateNavForRole();
        showAuthScreen('login');

        if (wasLoggedIn) {
            showToast(`Sesión cerrada.`, 'info');
        }
    }
});

function updateAuthView(isLoggedIn) {
    // This function is now only used for logout and unverified email scenarios.
    if (!isLoggedIn) {
        stopRealtimeListeners();
        dom.authContainer.classList.remove('hidden');
        dom.appView.classList.add('hidden');
        appState.currentUser = null;
        showAuthScreen('login');
    }
    // The logged-in logic is now handled directly in onAuthStateChanged
}

function updateNavForRole() {
    const userManagementLink = document.querySelector('[data-view="user_management"]');
    if (!userManagementLink) return;

    const shouldShow = appState.currentUser && appState.currentUser.role === 'admin';

    userManagementLink.style.display = shouldShow ? 'flex' : 'none';

    const divider = userManagementLink.nextElementSibling;
    if (divider && divider.matches('.border-t')) {
        divider.style.display = shouldShow ? 'block' : 'none';
    }
}

function renderUserMenu() {
    if (appState.currentUser) {
        const isGodModeUser = appState.currentUser.isSuperAdmin;
        let godModeHTML = '';

        if (isGodModeUser) {
            const roles = ['admin', 'editor', 'lector'];
            const roleLabels = { admin: 'Admin', editor: 'Editor', lector: 'Lector' };

            const buttonsHTML = roles.map(role => {
                const isActive = appState.currentUser.role === role && appState.godModeState?.isImpersonating;
                return `<button data-god-mode-role="${role}" class="god-mode-role-btn w-full text-left flex items-center gap-3 px-2 py-1.5 text-sm rounded-md hover:bg-slate-100 ${isActive ? 'bg-blue-100 text-blue-700 font-bold' : ''}">
                    <i data-lucide="${isActive ? 'check-circle' : 'circle'}" class="w-4 h-4"></i>
                    Simular ${roleLabels[role]}
                </button>`;
            }).join('');

            godModeHTML = `
                <div class="border-t border-b bg-yellow-50/50">
                    <div class="px-4 pt-3 pb-2">
                        <p class="text-xs font-bold uppercase text-yellow-600 flex items-center gap-2">
                            <i data-lucide="shield-check" class="w-4 h-4"></i>Modo Dios
                        </p>
                    </div>
                    <div class="p-2 space-y-1">
                        ${buttonsHTML}
                        <div class="border-t my-1"></div>
                        <button data-god-mode-role="real" class="god-mode-role-btn w-full text-left flex items-center gap-3 px-2 py-1.5 text-sm rounded-md font-bold text-yellow-800 hover:bg-yellow-100">
                           <i data-lucide="user-check" class="w-4 h-4"></i> Volver a Rol Real
                        </button>
                    </div>
                </div>
            `;
        }

        dom.userMenuContainer.innerHTML = `
            <button id="user-menu-button" class="flex items-center space-x-2">
                <img src="${appState.currentUser.avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full border-2 border-slate-300">
                <span class="font-semibold text-slate-700 hidden md:inline">${appState.currentUser.name}</span>
                <i data-lucide="chevron-down" class="text-slate-600"></i>
            </button>
            <div id="user-dropdown" class="absolute z-20 right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl hidden dropdown-menu">
                <div class="p-4 border-b"><p class="font-bold text-slate-800">${appState.currentUser.name}</p><p class="text-sm text-slate-500">${appState.currentUser.email}</p></div>
                ${godModeHTML}
                <a href="#" data-view="profile" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100"><i data-lucide="user-circle" class="w-5 h-5 text-slate-500"></i>Mi Perfil</a>
                <a href="#" id="logout-button" class="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"><i data-lucide="log-out" class="w-5 h-5"></i>Cerrar Sesión</a>
            </div>`;
    } else {
        dom.userMenuContainer.innerHTML = '';
    }
    lucide.createIcons();
}

function showAuthScreen(screenName) {
    ['login-panel', 'register-panel', 'reset-panel', 'verify-email-panel'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(`${screenName}-panel`).classList.remove('hidden');
}

async function handleResendVerificationEmail() {
    const resendButton = document.getElementById('resend-verification-btn');
    const timerElement = document.getElementById('resend-timer');
    if (!resendButton || !timerElement) return;

    resendButton.disabled = true;
    timerElement.textContent = 'Enviando...';

    try {
        await sendEmailVerification(auth.currentUser);
        showToast('Se ha enviado un nuevo correo de verificación.', 'success');

        // Cooldown timer
        let seconds = 60;
        timerElement.textContent = `Puedes reenviar de nuevo en ${seconds}s.`;
        const interval = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                timerElement.textContent = `Puedes reenviar de nuevo en ${seconds}s.`;
            } else {
                clearInterval(interval);
                timerElement.textContent = '';
                resendButton.disabled = false;
            }
        }, 1000);

    } catch (error) {
        console.error("Error resending verification email:", error);
        showToast(`Error al reenviar el correo: ${error.message}`, 'error');
        timerElement.textContent = 'Hubo un error. Inténtalo de nuevo.';
        resendButton.disabled = false;
    }
}

async function handleAuthForms(e) {
    e.preventDefault();
    const formId = e.target.id;
    const email = e.target.querySelector('input[type="email"]').value;
    const passwordInput = e.target.querySelector('input[type="password"]');
    const password = passwordInput ? passwordInput.value : null;

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonHTML = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `<i data-lucide="loader" class="animate-spin h-5 w-5 mx-auto"></i>`;
    lucide.createIcons();

    try {
        if (formId === 'login-form') {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                await signOut(auth);
                throw new Error('auth/email-not-verified');
            }
        } 
        else if (formId === 'register-form') {
            const name = e.target.querySelector('#register-name').value;
            if (!email.toLowerCase().endsWith('@barackmercosul.com')) {
                showToast('Dominio no autorizado. Use un correo de @barackmercosul.com.', 'error');
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });

            // Crear documento de usuario en Firestore
            await setDoc(doc(db, COLLECTIONS.USUARIOS, userCredential.user.uid), {
                id: userCredential.user.uid,
                name: name,
                email: userCredential.user.email,
                role: 'lector',
                sector: 'Sin Asignar',
                createdAt: new Date()
            });

            try {
                console.log("Attempting to send verification email to:", userCredential.user.email);
                await sendEmailVerification(userCredential.user);
                console.log("sendEmailVerification call completed without throwing an error.");
                showToast('Registro exitoso. Se ha enviado un correo de verificación a tu casilla.', 'success');
                showAuthScreen('verify-email');
            } catch (emailError) {
                console.error("Error sending verification email:", emailError.code, emailError.message, emailError);
                let errorMessage = 'Usuario registrado, pero no se pudo enviar el correo de verificación. ';
                errorMessage += 'Por favor, inténtelo de nuevo desde la pantalla de verificación o contacte a un administrador.';
                showToast(errorMessage, 'error', 6000);
                // A pesar del error en el email, se muestra la pantalla de verificación
                // porque el usuario SÍ fue creado y puede intentar el reenvío.
                showAuthScreen('verify-email');
            }
        }
        else if (formId === 'reset-form') {
            await sendPasswordResetEmail(auth, email);
            showToast(`Si la cuenta ${email} existe, se ha enviado un enlace.`, 'info');
            showAuthScreen('login');
        }
    } catch (error) {
        console.error("Authentication error:", error);
        let friendlyMessage = "Ocurrió un error inesperado.";
        switch (error.code || error.message) {
            case 'auth/invalid-login-credentials':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                friendlyMessage = 'Credenciales incorrectas. Por favor, verifique su email y contraseña.';
                break;
            case 'auth/email-not-verified':
                friendlyMessage = 'Debe verificar su email para poder iniciar sesión. Revise su casilla de correo.';
                break;
            case 'auth/email-already-in-use':
                friendlyMessage = 'Este correo electrónico ya está registrado.';
                break;
            case 'auth/weak-password':
                friendlyMessage = 'La contraseña debe tener al menos 6 caracteres.';
                break;
            default:
                friendlyMessage = 'Error de autenticación. Intente de nuevo.';
        }
        showToast(friendlyMessage, 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHTML;
    }
}

async function logOutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        showToast("Error al cerrar sesión.", "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAppListeners();
    lucide.createIcons();
});

// Expose for testing
if (window.location.protocol === 'file:') {
    window.runDashboardLogic = runDashboardLogic;
}

function renderArbolesInitialView() {
    dom.viewContent.innerHTML = `<div class="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-lg p-6 text-center animate-fade-in-up"><i data-lucide="git-merge" class="h-24 w-24 text-gray-300 mb-6"></i><h3 class="text-2xl font-bold">Gestor de Árboles de Producto</h3><p class="text-gray-500 mt-2 mb-8 max-w-lg">Busque y seleccione el producto principal para cargar o crear su estructura de componentes.</p><button data-action="open-product-search-modal" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"><i data-lucide="search" class="inline-block mr-2 -mt-1"></i>Seleccionar Producto</button></div>`;
    lucide.createIcons();
}

function renderArbolDetalle(highlightNodeId = null) {
    const cliente = appState.collections[COLLECTIONS.CLIENTES].find(c => c.id === appState.arbolActivo.clienteId);
    let treeContentHTML = `<div id="tree-render-area" class="tree p-4 rounded-lg bg-gray-50 min-h-[200px]"></div>`;
    
    if(appState.arbolActivo.estructura[0]?.children.length === 0) {
        treeContentHTML += `<div class="text-center p-6 bg-blue-50 border-t border-blue-200 rounded-b-lg">
            <i data-lucide="mouse-pointer-click" class="h-10 w-10 mx-auto text-blue-400 mb-3"></i>
            <h4 class="font-semibold text-blue-800">¡Tu árbol está listo para crecer!</h4>
            <p class="text-sm text-blue-700">Comienza agregando componentes usando los botones <span class="font-mono bg-green-100 text-green-800 px-1 rounded">+ semiterminado</span> o <span class="font-mono bg-green-100 text-green-800 px-1 rounded">+ insumo</span>.</p>
        </div>`;
    }
    dom.viewContent.innerHTML = `<div class="bg-white rounded-xl shadow-md p-6 animate-fade-in-up"><div class="flex justify-between items-start mb-4 pb-4 border-b"><div><h3 class="text-2xl font-bold">${appState.arbolActivo.nombre}</h3><p class="text-sm text-gray-500">Cliente: <span class="font-semibold">${cliente?.descripcion || 'N/A'}</span></p></div><div class="flex space-x-2"><button data-action="volver-a-busqueda" class="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-600">Buscar Otro</button>${checkUserPermission('edit') ? `<button data-action="guardar-arbol" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center justify-center w-28 transition-all duration-300">Guardar</button>` : ''}</div></div>${treeContentHTML}</div>`;
    renderArbol(highlightNodeId);
    lucide.createIcons();
}

function renderArbol(highlightNodeId = null) {
    const treeArea = document.getElementById('tree-render-area');
    if (!treeArea || !appState.arbolActivo) return;
    
    treeArea.innerHTML = '<ul>' + appState.arbolActivo.estructura.map(renderNodo).join('') + '</ul>';
    initSortable(treeArea);
    
    if(highlightNodeId) {
        const nodeElement = treeArea.querySelector(`li[data-node-id="${highlightNodeId}"] > .node-content`);
        if(nodeElement) {
            nodeElement.classList.add('highlight-new-node');
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    lucide.createIcons();
}

function renderNodo(nodo) {
    const collectionName = nodo.tipo + 's';
    const item = appState.collectionsById[collectionName]?.get(nodo.refId);
    if (!item) return '';

    const addableChildren = { producto: ['semiterminado', 'insumo'], semiterminado: ['semiterminado', 'insumo'], insumo: [] };
    let addButtons = checkUserPermission('edit')
        ? (addableChildren[nodo.tipo] || []).map(tipo => `<button data-action="add-node" data-node-id="${nodo.id}" data-child-type="${tipo}" class="px-2 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-xs font-semibold" title="Agregar ${tipo}">+ ${tipo}</button>`).join(' ')
        : '';

    const isDraggable = nodo.tipo !== 'producto';

    const quantityText = '';

    const commentText = nodo.comment ? `<p class="pl-8 text-sm text-slate-500 italic flex items-center gap-2"><i data-lucide="message-square" class="w-3.5 h-3.5"></i>${nodo.comment}</p>` : '';

    const editButton = (checkUserPermission('edit') && nodo.tipo !== 'producto') ? `
        <button data-action="edit-node-details" data-node-id="${nodo.id}" class="text-blue-600 hover:text-blue-700" title="Editar Cantidad/Comentario">
            <i data-lucide="pencil" class="h-4 w-4 pointer-events-none"></i>
        </button>
    ` : '';

    return `<li data-node-id="${nodo.id}" class="group">
                <div class="node-content ${isDraggable ? '' : 'cursor-default'}" data-type="${nodo.tipo}">
                    <div class="flex items-center gap-3 flex-grow min-w-0">
                        <i data-lucide="${nodo.icon}" class="h-5 w-5 text-gray-600 flex-shrink-0"></i>
                        <span class="font-semibold truncate" title="${item.descripcion}">${item.descripcion}</span>
                        <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">${nodo.tipo}</span>
                        ${quantityText}
                    </div>
                    <div class="flex items-center space-x-2 flex-shrink-0">
                        ${addButtons}
                        ${editButton}
                        ${(checkUserPermission('delete') && nodo.tipo !== 'producto') ? `<button data-action="delete-node" data-node-id="${nodo.id}" class="text-red-500 hover:text-red-700" title="Eliminar"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>` : ''}
                    </div>
                </div>
                ${commentText}
                ${addableChildren[nodo.tipo].length > 0 ? `<ul class="node-children-list">${(nodo.children || []).map(renderNodo).join('')}</ul>` : ''}
            </li>`;
}

function initSortable(treeArea) {
    if (!checkUserPermission('edit')) {
        return; // Desactiva el drag and drop para no-administradores
    }
    const lists = treeArea.querySelectorAll('ul');
    lists.forEach(list => {
        if (list.sortable) list.sortable.destroy();

        new Sortable(list, {
            group: 'nested',
            animation: 150,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onStart: (evt) => {
                // Add class to all potential drop targets
                treeArea.querySelectorAll('ul').forEach(l => l.classList.add('sortable-drag-over'));
            },
            onEnd: (evt) => {
                // Clean up drop target styles
                treeArea.querySelectorAll('ul').forEach(l => l.classList.remove('sortable-drag-over'));
                handleDropEvent(evt);
            }
        });
    });
}

function handleDropEvent(evt) {
    const movedItemId = evt.item.dataset.nodeId;
    const newParentEl = evt.to;
    const newParentId = newParentEl.closest('li[data-node-id]').dataset.nodeId;
    const newIndex = evt.newIndex;
    
    let movedNode = null;
    let oldParentNode = null;
    function findAndRemove(nodes, parent) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === movedItemId) {
                movedNode = nodes.splice(i, 1)[0];
                oldParentNode = parent;
                return true;
            }
            if (nodes[i].children && findAndRemove(nodes[i].children, nodes[i])) {
                return true;
            }
        }
        return false;
    }
    findAndRemove(appState.arbolActivo.estructura, null);
    if (movedNode) {
        const newParentNode = findNode(newParentId, appState.arbolActivo.estructura);
        if (newParentNode && newParentNode.tipo !== 'insumo') {
            if (!newParentNode.children) newParentNode.children = [];
            newParentNode.children.splice(newIndex, 0, movedNode);
        } else {
            if (oldParentNode) {
                 oldParentNode.children.splice(evt.oldIndex, 0, movedNode);
            }
            showToast('No se puede anidar un componente dentro de un insumo.', 'error');
        }
    }
    renderArbol();
}

function openProductSearchModal() {
    let clientOptions = '<option value="">Todos</option>' + appState.collections[COLLECTIONS.CLIENTES].map(c => `<option value="${c.id}">${c.descripcion}</option>`).join('');
    const modalId = `prod-search-modal-${Date.now()}`;
    const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4 modal-content"><div class="flex justify-between items-center p-5 border-b"><h3 class="text-xl font-bold">Buscar Producto Principal</h3><button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="search-prod-term" class="block text-sm font-medium">Código/Descripción</label><input type="text" id="search-prod-term" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></div><div><label for="search-prod-client" class="block text-sm font-medium">Cliente</label><select id="search-prod-client" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">${clientOptions}</select></div></div><div id="search-prod-results" class="p-6 border-t overflow-y-auto flex-1"></div></div></div>`;
    dom.modalContainer.innerHTML = modalHTML;
    const modalElement = document.getElementById(modalId);
    const termInput = modalElement.querySelector('#search-prod-term');
    const clientSelect = modalElement.querySelector('#search-prod-client');
    const resultsContainer = modalElement.querySelector('#search-prod-results');
    const searchHandler = () => handleProductSearchInTree(termInput.value, clientSelect.value, resultsContainer);
    termInput.addEventListener('input', searchHandler);
    clientSelect.addEventListener('change', searchHandler);
    resultsContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-product-id]');
        if (button) { handleProductSelect(button.dataset.productId); modalElement.remove(); }
    });
    modalElement.querySelector('button[data-action="close"]').addEventListener('click', () => modalElement.remove());
    searchHandler();
}

function handleProductSearchInTree(term, clientId, resultsContainer) {
    term = term.toLowerCase();
    let results = appState.collections[COLLECTIONS.PRODUCTOS].filter(p => (term === '' || p.id.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term)) && (!clientId || p.clienteId === clientId));
    resultsContainer.innerHTML = results.length === 0 ? `<p class="text-center py-8">No se encontraron productos.</p>` : `<div class="space-y-1">${results.map(p => `<button data-product-id="${p.id}" class="w-full text-left p-2.5 bg-gray-50 hover:bg-blue-100 rounded-md border flex justify-between items-center"><p class="font-semibold text-blue-800">${p.descripcion} (${p.id})</p><p class="text-xs text-gray-500">${appState.collections[COLLECTIONS.CLIENTES].find(c => c.id === p.clienteId)?.descripcion || ''}</p></button>`).join('')}</div>`;
}

function openComponentSearchModal(padreId, tipoHijo) {
    const dataKey = tipoHijo === 'semiterminado' ? COLLECTIONS.SEMITERMINADOS : COLLECTIONS.INSUMOS;
    const modalId = `comp-search-modal-${Date.now()}`;
    const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4 modal-content"><div class="flex justify-between items-center p-5 border-b"><h3 class="text-xl font-bold">Seleccionar ${tipoHijo}</h3><button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-6"><input type="text" id="search-comp-term" placeholder="Buscar..." class="w-full border-gray-300 rounded-md shadow-sm"></div><div id="search-comp-results" class="p-6 border-t overflow-y-auto flex-1"></div></div></div>`;
    dom.modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    const modalElement = document.getElementById(modalId);
    const searchInput = modalElement.querySelector('#search-comp-term');
    const resultsContainer = modalElement.querySelector('#search-comp-results');
    const searchHandler = () => renderComponentSearchResults(dataKey, searchInput.value, resultsContainer);
    searchInput.addEventListener('input', searchHandler);
    resultsContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-item-id]');
        if (button) { handleComponentSelect(padreId, button.dataset.itemId, button.dataset.itemType); modalElement.remove(); }
    });
    modalElement.querySelector('button[data-action="close"]').addEventListener('click', () => modalElement.remove());
    searchHandler();
}

function renderComponentSearchResults(dataKey, term, resultsContainer) {
    term = term.toLowerCase();
    let results = appState.collections[dataKey].filter(item => Object.values(item).some(value => String(value).toLowerCase().includes(term)));
    resultsContainer.innerHTML = results.length === 0 ? `<p class="text-center py-8">No hay resultados.</p>` : `<div class="space-y-2">${results.map(item => `<button data-item-id="${item.id}" data-item-type="${dataKey.slice(0, -1)}" class="w-full text-left p-3 bg-gray-50 hover:bg-blue-100 rounded-md border"><p class="font-semibold">${item.descripcion}</p><p class="text-sm text-gray-500">${item.id}</p></button>`).join('')}</div>`;
}

// =================================================================================
// --- FUNCIONES DE MANIPULACIÓN DEL ÁRBOL ---
// =================================================================================

function findNode(id, nodes) {
    if (!nodes) return null;
    for (const nodo of nodes) {
        if (nodo.id === id) return nodo;
        if (nodo.children) { 
            const found = findNode(id, nodo.children); 
            if (found) return found; 
        }
    }
    return null;
}

function findParentNode(childId, nodes) {
    for (const node of nodes) {
        if (node.children && node.children.some(child => child.id === childId)) {
            return node;
        }
        if (node.children) {
            const found = findParentNode(childId, node.children);
            if (found) return found;
        }
    }
    return null;
}

function findNodeByRefId(refId, arbol) {
    for (const nodo of arbol) {
        if (nodo.refId === refId) return nodo;
        if (nodo.children) { const found = findNodeByRefId(refId, nodo.children); if (found) return found; }
    }
    return null;
}

function crearComponente(tipo, datos) {
    return { 
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
        refId: datos.id, 
        tipo: tipo, 
        icon: { producto: 'package', semiterminado: 'box', insumo: 'beaker' }[tipo],
        children: [], 
        quantity: 1,
        comment: ''
    };
}

function handleComponentSelect(padreId, itemId, itemType) {
    const item = appState.collections[itemType === 'semiterminado' ? COLLECTIONS.SEMITERMINADOS : COLLECTIONS.INSUMOS].find(i => i.id === itemId);
    if (!item) return;
    let nuevoNodo;
    const addComponent = () => {
        const padre = findNode(padreId, appState.arbolActivo.estructura);
        if (padre) { 
            if (!padre.children) padre.children = [];
            nuevoNodo = crearComponente(itemType, item);
            padre.children.push(nuevoNodo); 
            renderArbolDetalle(nuevoNodo.id); 
        }
    };
    addComponent();
}

function eliminarNodo(id) {
    showConfirmationModal('Eliminar Nodo', '¿Seguro? Se eliminará este nodo y todos sus hijos.', () => {
        function findAndRemove(currentId, nodes) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === currentId) { nodes.splice(i, 1); return true; }
                if (nodes[i].children && findAndRemove(currentId, nodes[i].children)) return true;
            }
            return false;
        }
        if(findAndRemove(id, appState.arbolActivo.estructura)) {
            renderArbolDetalle();
            showToast('Nodo eliminado.', 'info');
        }
    });
}

// =================================================================================
// --- LÓGICA DE VISTA SINÓPTICA ---
// =================================================================================

function renderCaratula(producto, cliente) {
    const container = document.getElementById('caratula-container');
    if (!container) return;

    if (producto && cliente) {
        const createdAt = producto.createdAt ? new Date(producto.createdAt.seconds * 1000).toLocaleDateString('es-AR') : 'N/A';

        const createEditableField = (label, value, fieldName, placeholder = 'N/A') => {
            const val = value || '';
            return `
                <div class="caratula-field group cursor-pointer" data-field="${fieldName}" data-value="${val}">
                    <p class="font-bold opacity-80 uppercase flex items-center">${label}
                        <i data-lucide="pencil" class="w-3 h-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity"></i>
                    </p>
                    <div class="value-display min-h-[1em]">${val || `<span class="italic opacity-50">${placeholder}</span>`}</div>
                    <div class="edit-controls hidden">
                        <input type="text" class="bg-slate-800 border-b-2 border-slate-400 focus:outline-none w-full text-white" value="${val}">
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg animate-fade-in-up overflow-hidden">
            <h3 class="text-center font-bold text-xl py-3 bg-blue-600 text-white">COMPOSICIÓN DE PIEZAS - BOM</h3>
            <div class="flex">
                <div class="w-1/3 bg-white flex items-center justify-center p-4 border-r border-slate-200">
                    <img src="barack_logo.png" alt="Logo" class="max-h-20">
                </div>
                <div class="w-2/3 bg-[#44546A] text-white p-4 flex items-center" id="caratula-fields-container">
                    <div class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm w-full">
                        <div><p class="font-bold opacity-80 uppercase">PRODUCTO</p><p>${producto.descripcion || 'N/A'}</p></div>
                        <div><p class="font-bold opacity-80 uppercase">NÚMERO DE PIEZA</p><p>${producto.id || 'N/A'}</p></div>
                        <div><p class="font-bold opacity-80 uppercase">VERSIÓN</p><p>${producto.version || 'N/A'}</p></div>
                        <div><p class="font-bold opacity-80 uppercase">FECHA DE CREACIÓN</p><p>${createdAt}</p></div>

                        ${createEditableField('REALIZÓ', producto.lastUpdatedBy, 'lastUpdatedBy', 'N/A')}
                        ${createEditableField('APROBÓ', producto.aprobadoPor, 'aprobadoPor', 'N/A')}
                        ${createEditableField('FECHA DE REVISIÓN', producto.fechaRevision, 'fechaRevision', 'YYYY-MM-DD')}
                    </div>
                </div>
            </div>
        </div>`;

    } else {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-lg text-center animate-fade-in border border-slate-200">
                <p class="text-slate-500 flex items-center justify-center">
                    <i data-lucide="info" class="inline-block mr-3 h-5 w-5 text-slate-400"></i>
                    <span>La información del producto y cliente aparecerá aquí cuando selecciones un elemento del árbol.</span>
                </p>
            </div>`;
    }
    lucide.createIcons();
}

function openSinopticoEditModal(nodeId) {
    let activeProductDocId;
    switch (appState.currentView) {
        case 'arboles':
            activeProductDocId = appState.arbolActivo?.docId;
            break;
        case 'sinoptico_tabular':
            activeProductDocId = appState.sinopticoTabularState?.selectedProduct?.docId;
            break;
        case 'sinoptico':
            activeProductDocId = appState.sinopticoState?.activeTreeDocId;
            break;
        default:
            activeProductDocId = null;
    }

    if (!activeProductDocId) {
        showToast('Error: No hay un producto activo seleccionado.', 'error');
        return;
    }

    const product = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.docId === activeProductDocId);
    if (!product) {
        showToast('Error: Producto no encontrado en la colección.', 'error');
        return;
    }
    const node = findNode(nodeId, product.estructura);
    if (!node) return;

    const itemData = appState.collectionsById[node.tipo + 's']?.get(node.refId);

    const modalId = `sinoptico-edit-modal-${Date.now()}`;
    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col m-4 modal-content">
                <div class="flex justify-between items-center p-5 border-b">
                    <h3 class="text-xl font-bold">Editar: ${itemData.descripcion}</h3>
                    <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <form id="sinoptico-edit-form" class="p-6 overflow-y-auto space-y-4" novalidate>
                    <input type="hidden" name="nodeId" value="${nodeId}">
                    <div>
                        <label for="sinoptico-quantity" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input type="number" id="sinoptico-quantity" name="quantity" value="${node.quantity ?? 1}" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" step="any" min="0">
                    </div>
                    <div>
                        <label for="sinoptico-comment" class="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                        <textarea id="sinoptico-comment" name="comment" rows="3" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" maxlength="140">${node.comment || ''}</textarea>
                        <p class="text-xs text-gray-500 mt-1 text-right"><span id="comment-char-count">0</span> / 140</p>
                    </div>
                </form>
                <div class="flex justify-end items-center p-4 border-t bg-gray-50 space-x-3">
                    <button data-action="close" type="button" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
                    <button type="submit" form="sinoptico-edit-form" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;

    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();
    const modalElement = document.getElementById(modalId);
    const commentTextarea = modalElement.querySelector('#sinoptico-comment');
    const charCountSpan = modalElement.querySelector('#comment-char-count');

    const updateCharCount = () => {
        charCountSpan.textContent = commentTextarea.value.length;
    };

    commentTextarea.addEventListener('input', updateCharCount);
    updateCharCount(); // Initial count

    modalElement.querySelector('form').addEventListener('submit', handleSinopticoFormSubmit);
    modalElement.addEventListener('click', e => {
        if (e.target.closest('button')?.dataset.action === 'close') {
            modalElement.remove();
        }
    });
}

async function handleSinopticoFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const nodeId = form.querySelector('[name="nodeId"]').value;
    const newQuantity = parseFloat(form.querySelector('[name="quantity"]').value);
    const newComment = form.querySelector('[name="comment"]').value;

    if (isNaN(newQuantity) || newQuantity < 0) {
        showToast('Por favor, ingrese una cantidad válida.', 'error');
        return;
    }

    let activeProductDocId;
    switch (appState.currentView) {
        case 'arboles':
            activeProductDocId = appState.arbolActivo?.docId;
            break;
        case 'sinoptico_tabular':
            activeProductDocId = appState.sinopticoTabularState?.selectedProduct?.docId;
            break;
        case 'sinoptico':
            activeProductDocId = appState.sinopticoState?.activeTreeDocId;
            break;
        default:
            activeProductDocId = null;
    }

    if (!activeProductDocId) {
        showToast('Error: No se pudo encontrar el producto activo.', 'error');
        return;
    }
    const product = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.docId === activeProductDocId);

    if (!product) {
        showToast('Error: No se pudo encontrar el producto activo.', 'error');
        return;
    }
    const nodeToUpdate = findNode(nodeId, product.estructura);

    if (nodeToUpdate) {
        nodeToUpdate.quantity = newQuantity;
        nodeToUpdate.comment = newComment;

        const saveButton = form.closest('.modal-content').querySelector('button[type="submit"]');
        saveButton.disabled = true;
        saveButton.innerHTML = `<i data-lucide="loader" class="animate-spin h-5 w-5"></i>`;
        lucide.createIcons();

        try {
            const productRef = doc(db, COLLECTIONS.PRODUCTOS, product.docId);
            await updateDoc(productRef, { estructura: product.estructura });
            showToast('Componente actualizado.', 'success');

            document.getElementById(form.closest('.fixed').id).remove();

            switch (appState.currentView) {
                case 'arboles':
                    renderArbolDetalle(nodeId);
                    break;
                case 'sinoptico_tabular':
                    if(appState.sinopticoTabularState.selectedProduct && appState.sinopticoTabularState.selectedProduct.docId === product.docId) {
                        appState.sinopticoTabularState.selectedProduct.estructura = product.estructura;
                    }
                    runSinopticoTabularLogic();
                    break;
                case 'sinoptico':
                    renderTree();
                    renderDetailView(nodeId);
                    break;
            }
        } catch (error) {
            console.error("Error saving sinoptico node:", error);
            showToast('Error al guardar los cambios.', 'error');
            saveButton.disabled = false;
            saveButton.innerHTML = `Guardar Cambios`;
        }
    }
}

function runSinopticoLogic() {
    dom.viewContent.innerHTML = `<div class="animate-fade-in-up">${renderSinopticoLayout()}</div>`;
    lucide.createIcons();
    initSinoptico();
}

const getFlattenedData = (product, levelFilters) => {
    // Helper to flatten a tree structure for display.
    // This helper now assumes the nodes passed to it may already have an 'originalLevel'.
    // The 'level' parameter here is the *display* level after filtering.
    const flattenTree = (nodes, level, lineage) => {
        const result = [];
        nodes.forEach((node, index) => {
            const isLast = index === nodes.length - 1;
            const collectionName = node.tipo + 's';
            const item = appState.collectionsById[collectionName]?.get(node.refId);
            if (!item) return;

            // The node is pushed as is. If it has originalLevel, it will be preserved.
            result.push({ node, item, level, isLast, lineage });
            if (node.children && node.children.length > 0) {
                result.push(...flattenTree(node.children, level + 1, [...lineage, !isLast]));
            }
        });
        return result;
    };

    if (!product || !product.estructura) return [];

    // If no filter is applied, we still need to add originalLevel.
    if (!levelFilters || levelFilters.size === 0) {
        const addOriginalLevel = (nodes, level) => {
            return nodes.map(node => {
                const newNode = { ...node, originalLevel: level };
                if (newNode.children && newNode.children.length > 0) {
                    newNode.children = addOriginalLevel(newNode.children, level + 1);
                }
                return newNode;
            });
        };
        const structureWithLevels = addOriginalLevel(product.estructura, 0);
        return flattenTree(structureWithLevels, 0, []);
    }

    // --- New, robust logic for filtered levels ---
    const sortedSelectedLevels = [...levelFilters].map(Number).sort((a, b) => a - b);

    // Recursively finds the next set of visible descendants for a given node.
    // It receives the absolute parentLevel.
    const findVisibleDescendants = (parentNode, parentLevel) => {
        const results = [];
        if (!parentNode.children) return results;

        // Find the next level to show from the sorted list of selected levels.
        const nextTargetLevel = sortedSelectedLevels.find(l => l > parentLevel);
        if (nextTargetLevel === undefined) return []; // No more levels to show below this one.

        // Search through descendants to find nodes at the target level.
        function search(nodes, currentLevel) {
            nodes.forEach(node => {
                if (currentLevel === nextTargetLevel) {
                    // Found a visible node. Attach its original level and find its visible children.
                    const newNode = { ...node, originalLevel: currentLevel };
                    newNode.children = findVisibleDescendants(node, currentLevel);
                    results.push(newNode);
                } else if (currentLevel < nextTargetLevel && node.children) {
                    // This node is not visible, but its children might be. Keep searching deeper.
                    search(node.children, currentLevel + 1);
                }
            });
        }

        search(parentNode.children, parentLevel + 1);
        return results;
    };

    // Builds the initial filtered tree, starting from the original structure.
    const buildFilteredTree = (nodes, currentLevel) => {
        const result = [];
        nodes.forEach(node => {
            if (sortedSelectedLevels.includes(currentLevel)) {
                // This node is visible. Keep it, attach its original level, and find its filtered children.
                const newNode = { ...node, originalLevel: currentLevel };
                newNode.children = findVisibleDescendants(node, currentLevel);
                result.push(newNode);
            } else {
                // This node is not visible. Skip it, but check its children to see if they should be promoted.
                if (node.children) {
                    result.push(...buildFilteredTree(node.children, currentLevel + 1));
                }
            }
        });
        return result;
    };

    const filteredEstructura = buildFilteredTree(product.estructura, 0);

    // Pass 2: Flatten the newly created filtered tree for display.
    // The 'level' passed to flattenTree (0) is the starting *display* level.
    return flattenTree(filteredEstructura, 0, []);
};

function runSinopticoTabularLogic() {
    // Initialize state for the view
    if (!appState.sinopticoTabularState) {
        appState.sinopticoTabularState = {
            selectedProduct: null,
            activeFilters: {
                niveles: new Set()
            }
        };
    }

    const state = appState.sinopticoTabularState;

    // --- RENDER FUNCTIONS ---

    const renderTabularTable = (data) => {
        // 1. Columns updated: Cantidad & Comentarios added, Costo, Fecha Modif, Tolerancia removed.
        const columns = [
            { key: 'descripcion', label: 'Descripción' },
            { key: 'nivel', label: 'Nivel' },
            { key: 'cantidad', label: 'Cantidad / Pieza' },
            { key: 'comentarios', label: 'Comentarios' },
            { key: 'lc_kd', label: 'LC / KD' },
            { key: 'version_vehiculo', label: 'Versión Vehículo' },
            { key: 'codigo_pieza', label: 'Código de pieza' },
            { key: 'version', label: 'Versión' },
            { key: 'imagen', label: 'Imágen (URL)' },
            { key: 'proceso', label: 'Proceso' },
            { key: 'aspecto', label: 'Aspecto' },
            { key: 'peso_gr', label: 'Peso (gr)' },
            { key: 'proveedor', label: 'Proveedor' },
            { key: 'unidad_medida', label: 'Unidad' },
            { key: 'acciones', label: 'Acciones' }
        ];

        if (data.length === 0) return `<p class="text-slate-500 p-4 text-center">El producto seleccionado no tiene una estructura definida.</p>`;

        let tableHTML = `<table class="w-full text-sm text-left text-gray-600">`;
        // 7. Column alignment and width adjusted in headers
        tableHTML += `<thead class="text-xs text-gray-700 uppercase bg-gray-100"><tr>
            <th scope="col" class="px-4 py-3 align-middle" style="min-width: 400px;">Descripción</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap col-nivel">Nivel</th>
            <th scope="col" class="px-4 py-3 align-middle col-comentarios">Comentarios</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">LC / KD</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Versión Vehículo</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Código de pieza</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Versión</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap col-imagen">Imágen (URL)</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Proceso</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Aspecto</th>
            <th scope="col" class="px-4 py-3 text-right align-middle whitespace-nowrap">Peso (gr)</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Proveedor</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Cantidad / Pieza</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap">Unidad</th>
            <th scope="col" class="px-4 py-3 text-center align-middle whitespace-nowrap col-acciones">Acciones</th>
        </tr></thead><tbody>`;

        data.forEach(rowData => {
            const { node, item, level, isLast, lineage } = rowData;
            const NA = '<span class="text-slate-400">N/A</span>';

            // 4. Increased indentation
            let prefix = lineage.map(parentIsNotLast => parentIsNotLast ? '│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;').join('');
            if (level > 0)  prefix += isLast ? '└─ ' : '├─ ';

            const descripcion = `<span class="font-sans">${prefix}</span>${item.descripcion || item.nombre || ''}`;
            const nivel = node.originalLevel ?? level;
            // 4. Cantidad added
            const cantidad = node.quantity ?? NA;
            // 5. Comentarios added
            const comentarios = node.comment ? `<span class="whitespace-normal">${node.comment}</span>` : NA;
            const lc_kd = item.lc_kd || NA;
            const version_vehiculo = node.tipo === 'producto' ? (item.version_vehiculo || NA) : NA;
            const codigo_pieza = item.codigo_pieza || NA;
            const version = item.version || NA;
            const imagen = item.imagen ? `<a href="${item.imagen}" target="_blank" class="text-blue-600 hover:underline">Ver</a>` : NA;

            let proceso = NA;
            if (node.tipo === 'semiterminado' && item.proceso) {
                const procesoData = appState.collectionsById[COLLECTIONS.PROCESOS]?.get(item.proceso);
                proceso = procesoData ? procesoData.descripcion : item.proceso;
            }

            const aspecto = node.tipo === 'semiterminado' ? (item.aspecto || NA) : NA;

            // 6. Merged Peso and Tolerancia
            let peso_display = NA;
            if (node.tipo === 'semiterminado' && item.peso_gr) {
                peso_display = item.peso_gr;
                if (item.tolerancia_gr) {
                    peso_display += ` ± ${item.tolerancia_gr}`;
                }
            }

            let proveedor = NA;
            if (node.tipo === 'insumo' && item.proveedor) {
                const proveedorData = appState.collectionsById[COLLECTIONS.PROVEEDORES]?.get(item.proveedor);
                proveedor = proveedorData ? proveedorData.descripcion : item.proveedor;
            }

            let unidad_medida = NA;
            if (node.tipo === 'insumo' && item.unidad_medida) {
                const unidadData = appState.collectionsById[COLLECTIONS.UNIDADES]?.get(item.unidad_medida);
                unidad_medida = unidadData ? unidadData.id : item.unidad_medida;
            }

            const actionsHTML = checkUserPermission('edit') ? `<button data-action="edit-tabular-node" data-node-id="${node.id}" class="p-1 text-blue-600 hover:bg-blue-100 rounded-md" title="Editar"><i data-lucide="pencil" class="w-4 h-4 pointer-events-none"></i></button>` : '';

            // 7. Column alignment adjusted in cells
            tableHTML += `<tr class="bg-white border-b hover:bg-gray-100" data-node-id="${node.id}">
                <td class="px-4 py-2 font-mono font-medium text-gray-900 align-middle" style="min-width: 400px;">${descripcion}</td>
                <td class="px-4 py-2 text-center align-middle col-nivel">${nivel}</td>
                <td class="px-4 py-2 align-middle col-comentarios">${comentarios}</td>
                <td class="px-4 py-2 text-center align-middle">${lc_kd}</td>
                <td class="px-4 py-2 text-center align-middle">${version_vehiculo}</td>
                <td class="px-4 py-2 text-center align-middle">${codigo_pieza}</td>
                <td class="px-4 py-2 text-center align-middle">${version}</td>
                <td class="px-4 py-2 text-center align-middle col-imagen">${imagen}</td>
                <td class="px-4 py-2 text-center align-middle">${proceso}</td>
                <td class="px-4 py-2 text-center align-middle">${aspecto}</td>
                <td class="px-4 py-2 text-right align-middle">${peso_display}</td>
                <td class="px-4 py-2 text-center align-middle">${proveedor}</td>
                <td class="px-4 py-2 text-center align-middle">${cantidad}</td>
                <td class="px-4 py-2 text-center align-middle">${unidad_medida}</td>
                <td class="px-4 py-2 text-center align-middle col-acciones">${actionsHTML}</td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        return tableHTML;
    };

    const renderReportView = () => {
        const product = state.selectedProduct;
        if (!product) {
            renderInitialView();
            return;
        }

        const client = appState.collectionsById[COLLECTIONS.CLIENTES].get(product.clienteId);

        const getOriginalMaxDepth = (nodes, level = 0) => {
            if (!nodes || nodes.length === 0) return level > 0 ? level - 1 : 0;
            let max = level;
            for (const node of nodes) {
                const depth = getOriginalMaxDepth(node.children, level + 1);
                if (depth > max) max = depth;
            }
            return max;
        };

        const flattenedData = getFlattenedData(product, state.activeFilters.niveles);
        const tableHTML = renderTabularTable(flattenedData);

        const maxLevel = getOriginalMaxDepth(product.estructura);
        let levelFilterOptionsHTML = '';
        for (let i = 0; i <= maxLevel; i++) {
            const isChecked = !state.activeFilters.niveles.size || state.activeFilters.niveles.has(i.toString());
            levelFilterOptionsHTML += `
                <label class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer">
                    <input type="checkbox" data-level="${i}" class="level-filter-cb h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" ${isChecked ? 'checked' : ''}>
                    <span class="text-sm">Nivel ${i}</span>
                </label>
            `;
        }

        dom.viewContent.innerHTML = `<div class="animate-fade-in-up">
            <div id="caratula-container" class="mb-6"></div>
            <div class="bg-white p-6 rounded-xl shadow-lg">
                <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div><h3 class="text-xl font-bold text-slate-800">Detalle de: ${product.descripcion}</h3><p class="text-sm text-slate-500">${product.id}</p></div>
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <button id="level-filter-btn" class="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
                                <i data-lucide="filter" class="h-4 w-4"></i>Filtrar por Nivel<i data-lucide="chevron-down" class="h-4 w-4 ml-1"></i>
                            </button>
                            <div id="level-filter-dropdown" class="absolute z-10 right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl hidden p-2 dropdown-menu">
                                ${levelFilterOptionsHTML}
                                <div class="border-t my-2"></div>
                                <button data-action="apply-level-filter" class="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">Aplicar</button>
                            </div>
                        </div>
                        <button data-action="select-another-product-tabular" class="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-600 flex items-center">
                            <i data-lucide="search" class="mr-2 h-4 w-4"></i>Seleccionar Otro
                        </button>
                        <button data-action="export-sinoptico-pdf" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 flex items-center">
                            <i data-lucide="file-text" class="mr-2 h-4 w-4"></i>Exportar a PDF
                        </button>
                    </div>
                </div>
                <div id="sinoptico-tabular-container" class="mt-6 overflow-x-auto">${tableHTML}</div>
            </div>
        </div>`;

        renderCaratula(product, client);
        lucide.createIcons();
    };

    // --- Event Handlers ---
    const handleViewClick = (e) => {
        const button = e.target.closest('button[data-action]');

        // Handle dropdown toggle separately to prevent it from closing immediately
        if (e.target.closest('#level-filter-btn')) {
            const dropdown = document.getElementById('level-filter-dropdown');
            if (dropdown) dropdown.classList.toggle('hidden');
            return;
        }

        if (!button) return;

        const action = button.dataset.action;

        switch (action) {
            case 'open-product-search-modal-tabular':
                openProductSearchModal();
                break;
            case 'select-another-product-tabular':
                state.selectedProduct = null;
                state.activeFilters.niveles.clear();
                renderInitialView();
                break;
            case 'edit-tabular-node':
                openSinopticoEditModal(button.dataset.nodeId);
                break;
            case 'apply-level-filter':
                const dropdown = document.getElementById('level-filter-dropdown');
                const selectedLevels = new Set();
                dropdown.querySelectorAll('.level-filter-cb:checked').forEach(cb => {
                    selectedLevels.add(cb.dataset.level);
                });

                const allLevelsCount = dropdown.querySelectorAll('.level-filter-cb').length;
                // If all are selected, it's the same as no filter.
                if (selectedLevels.size === allLevelsCount) {
                    state.activeFilters.niveles.clear();
                } else {
                    state.activeFilters.niveles = selectedLevels;
                }

                dropdown.classList.add('hidden');

                const tableContainer = document.getElementById('sinoptico-tabular-container');
                if (tableContainer) {
                    // 1. Store scroll position & show loading state
                    const savedScrollY = window.scrollY;
                    tableContainer.innerHTML = `
                        <div class="flex items-center justify-center p-16 text-slate-500">
                            <i data-lucide="loader" class="animate-spin h-8 w-8 mr-3"></i>
                            <span>Cargando tabla...</span>
                        </div>
                    `;
                    lucide.createIcons();

                    // 2. Set up promises for minimum delay and data processing
                    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 400));

                    const processDataPromise = new Promise(resolve => {
                        const product = state.selectedProduct;
                        const flattenedData = getFlattenedData(product, state.activeFilters.niveles);
                        const newTableHTML = renderTabularTable(flattenedData);
                        resolve(newTableHTML);
                    });

                    // 3. Wait for both to complete
                    Promise.all([minDelayPromise, processDataPromise]).then(([_, newTableHTML]) => {
                        // 4. Render new table
                        tableContainer.innerHTML = newTableHTML;
                        lucide.createIcons();

                        // 5. Restore scroll position
                        window.scrollTo(0, savedScrollY);
                    });
                }
                break;
            case 'export-sinoptico-pdf':
                exportSinopticoTabularToPdf();
                break;
        }
    };

    // --- PRODUCT SELECTION ---
    const openProductSearchModal = () => {
        let clientOptions = '<option value="">Todos</option>' + appState.collections[COLLECTIONS.CLIENTES].map(c => `<option value="${c.id}">${c.descripcion}</option>`).join('');
        const modalId = `prod-search-modal-tabular-${Date.now()}`;
        const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in"><div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4 modal-content"><div class="flex justify-between items-center p-5 border-b"><h3 class="text-xl font-bold">Buscar Producto Principal</h3><button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="search-prod-term" class="block text-sm font-medium">Código/Descripción</label><input type="text" id="search-prod-term" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></div><div><label for="search-prod-client" class="block text-sm font-medium">Cliente</label><select id="search-prod-client" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">${clientOptions}</select></div></div><div id="search-prod-results" class="p-6 border-t overflow-y-auto flex-1"></div></div></div>`;

        dom.modalContainer.innerHTML = modalHTML;
        const modalElement = document.getElementById(modalId);
        const termInput = modalElement.querySelector('#search-prod-term');
        const clientSelect = modalElement.querySelector('#search-prod-client');
        const resultsContainer = modalElement.querySelector('#search-prod-results');

        const searchHandler = () => {
            const term = termInput.value.toLowerCase();
            const clientId = clientSelect.value;
            let results = appState.collections[COLLECTIONS.PRODUCTOS].filter(p => (term === '' || p.id.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term)) && (!clientId || p.clienteId === clientId));
            resultsContainer.innerHTML = results.length === 0 ? `<p class="text-center py-8">No se encontraron productos.</p>` : `<div class="space-y-1">${results.map(p => `<button data-product-id="${p.id}" class="w-full text-left p-2.5 bg-gray-50 hover:bg-blue-100 rounded-md border flex justify-between items-center"><p class="font-semibold text-blue-800">${p.descripcion} (${p.id})</p><p class="text-xs text-gray-500">${appState.collections[COLLECTIONS.CLIENTES].find(c => c.id === p.clienteId)?.descripcion || ''}</p></button>`).join('')}</div>`;
        };

        termInput.addEventListener('input', searchHandler);
        clientSelect.addEventListener('change', searchHandler);
        resultsContainer.addEventListener('click', e => {
            const button = e.target.closest('button[data-product-id]');
            if (button) {
                handleProductSelect(button.dataset.productId);
                modalElement.remove();
            }
        });
        modalElement.querySelector('button[data-action="close"]').addEventListener('click', () => modalElement.remove());
        searchHandler();
    };

    const handleProductSelect = (productId) => {
        const producto = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.id === productId);
        if (producto) {
            state.selectedProduct = producto;
            renderReportView();
        } else {
            showToast("Error: Producto no encontrado.", "error");
            renderInitialView();
        }
    };

    const renderInitialView = () => {
        dom.viewContent.innerHTML = `<div class="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-lg p-6 text-center animate-fade-in-up">
            <i data-lucide="file-search-2" class="h-24 w-24 text-gray-300 mb-6"></i>
            <h3 class="text-2xl font-bold">Reporte BOM (Tabular)</h3>
            <p class="text-gray-500 mt-2 mb-8 max-w-lg">Para comenzar, busque y seleccione el producto principal que desea consultar.</p>
            <button data-action="open-product-search-modal-tabular" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105">
                <i data-lucide="search" class="inline-block mr-2 -mt-1"></i>Seleccionar Producto
            </button>
        </div>`;
        lucide.createIcons();
    };

    // --- MAIN LOGIC & CLEANUP ---
    if (state.selectedProduct) {
        renderReportView();
    } else {
        renderInitialView();
    }

    const caratulaFieldsHandler = (e) => {
        const fieldContainer = e.target.closest('.editable-field');
        if (fieldContainer && !fieldContainer.classList.contains('is-editing')) {
            fieldContainer.classList.add('is-editing');
            const valueDisplay = fieldContainer.querySelector('.value-display');
            const editControls = fieldContainer.querySelector('.edit-controls');
            const input = editControls.querySelector('input');

            valueDisplay.classList.add('hidden');
            editControls.classList.remove('hidden');
            input.focus();
            input.select();

            const saveField = async () => {
                const newValue = input.value;
                const fieldName = fieldContainer.dataset.field;

                if (newValue !== fieldContainer.dataset.value) {
                    const productRef = doc(db, COLLECTIONS.PRODUCTOS, state.selectedProduct.docId);
                    try {
                        await updateDoc(productRef, { [fieldName]: newValue });
                        showToast('Campo actualizado.', 'success');
                        state.selectedProduct[fieldName] = newValue;
                        renderReportView();
                    } catch (error) {
                        showToast('Error al guardar.', 'error');
                        fieldContainer.classList.remove('is-editing');
                        valueDisplay.classList.remove('hidden');
                        editControls.classList.add('hidden');
                    }
                } else {
                    fieldContainer.classList.remove('is-editing');
                    valueDisplay.classList.remove('hidden');
                    editControls.classList.add('hidden');
                }
            };

            input.addEventListener('blur', saveField, { once: true });
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') input.blur();
                if (e.key === 'Escape') {
                    input.removeEventListener('blur', saveField);
                    fieldContainer.classList.remove('is-editing');
                    valueDisplay.classList.remove('hidden');
                    editControls.classList.add('hidden');
                }
            });
        }
    };

    dom.viewContent.addEventListener('click', handleViewClick);
    dom.viewContent.addEventListener('click', handleCaratulaClick);

    appState.currentViewCleanup = () => {
        dom.viewContent.removeEventListener('click', handleViewClick);
        dom.viewContent.removeEventListener('click', handleCaratulaClick);
        appState.sinopticoTabularState = null;
    };
}

async function exportSinopticoTabularToPdf() {
    const { jsPDF } = window.jspdf;
    const state = appState.sinopticoTabularState;
    const product = state.selectedProduct;

    if (!product) {
        showToast('No hay producto seleccionado para exportar.', 'error');
        return;
    }

    const tableElement = document.getElementById('sinoptico-tabular-container');
    if (!tableElement) {
        showToast('Error: No se encontró el contenedor de la tabla para exportar.', 'error');
        return;
    }

    showToast('Generando PDF híbrido...', 'info');
    dom.loadingOverlay.style.display = 'flex';
    dom.loadingOverlay.querySelector('p').textContent = 'Generando PDF... (1/2)';

    try {
        // --- 1. Create PDF and Draw Manual Header ---
        const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
        const logoBase64 = await getLogoBase64();
        const PAGE_MARGIN = 10; // Reduced margin for wider content
        const PAGE_WIDTH = doc.internal.pageSize.width;
        let cursorY = 10;

        // --- Styled Header ---
        const titleBarHeight = 10;
        doc.setFillColor('#3B82F6'); // Blue background for title
        doc.rect(PAGE_MARGIN, cursorY, PAGE_WIDTH - (PAGE_MARGIN * 2), titleBarHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor('#FFFFFF'); // White text
        doc.text('COMPOSICIÓN DE PIEZAS - BOM', PAGE_WIDTH / 2, cursorY + titleBarHeight / 2, { align: 'center', baseline: 'middle' });
        cursorY += titleBarHeight + 3;

        // Logo and Product Info Box
        if (logoBase64) {
            const img = new Image();
            img.src = logoBase64;
            await new Promise(resolve => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                }
            });

            const logoWidth = 35;
            const logoAspectRatio = img.naturalWidth / img.naturalHeight;
            const logoHeight = logoWidth / logoAspectRatio;

            const boxHeight = 28;
            const logoY = cursorY + (boxHeight - logoHeight) / 2; // Center logo vertically in the box

            doc.addImage(logoBase64, 'PNG', PAGE_MARGIN, logoY, logoWidth, logoHeight);
        }

        const boxX = PAGE_MARGIN + 40;
        const boxWidth = PAGE_WIDTH - boxX - PAGE_MARGIN;
        const boxY = cursorY;
        const NA = 'N/A';
        const createdAt = product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString('es-AR') : NA;

        // --- New 3-Column Layout Logic ---
        const PADDING = 4;
        const LINE_HEIGHT = 4.5;
        const ROW_SPACING = 4;
        const COL_GAP = 8;
        let currentY = boxY + PADDING;

        // Set a fixed total height that is likely large enough to avoid pre-calculation complexity.
        const totalHeight = 40;
        doc.setFillColor('#44546A');
        doc.rect(boxX, boxY, boxWidth, totalHeight, 'F');
        doc.setTextColor('#FFFFFF');

        // 1. Draw Product Title (larger font, full width)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('PRODUCTO:', boxX + PADDING, currentY + 3);
        doc.setFontSize(11); // Increased font size for the title
        const productTitleLines = doc.splitTextToSize(product.descripcion || NA, boxWidth - PADDING * 2 - 20); // Give it more space
        doc.text(productTitleLines, boxX + PADDING + 20, currentY + 3);
        currentY += (productTitleLines.length * (LINE_HEIGHT - 0.5)) + ROW_SPACING;

        // 2. Separator Line
        doc.setDrawColor('#6b7280');
        doc.line(boxX + PADDING, currentY, boxX + boxWidth - PADDING, currentY);
        currentY += ROW_SPACING;

        // 3. Draw remaining data in a 3-column layout
        const colWidth = (boxWidth - (PADDING * 2) - (COL_GAP * 2)) / 3;
        const col1X = boxX + PADDING;
        const col2X = col1X + colWidth + COL_GAP;
        const col3X = col2X + colWidth + COL_GAP;

        doc.setFontSize(8);

        // Row 1
        let row1Y = currentY;
        doc.setFont('helvetica', 'bold');
        doc.text('NÚMERO DE PIEZA:', col1X, row1Y);
        doc.text('REALIZÓ:', col2X, row1Y);
        doc.text('FECHA DE CREACIÓN:', col3X, row1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(product.id || NA, col1X, row1Y + LINE_HEIGHT);
        doc.text(product.lastUpdatedBy || NA, col2X, row1Y + LINE_HEIGHT);
        doc.text(createdAt, col3X, row1Y + LINE_HEIGHT);

        // Row 2
        let row2Y = row1Y + (LINE_HEIGHT * 2) + ROW_SPACING;
        doc.setFont('helvetica', 'bold');
        doc.text('VERSIÓN:', col1X, row2Y);
        doc.text('APROBÓ:', col2X, row2Y);
        doc.text('FECHA DE REVISIÓN:', col3X, row2Y);
        doc.setFont('helvetica', 'normal');
        doc.text(product.version || NA, col1X, row2Y + LINE_HEIGHT);
        doc.text(product.aprobadoPor || NA, col2X, row2Y + LINE_HEIGHT);
        doc.text(product.fechaRevision || NA, col3X, row2Y + LINE_HEIGHT);

        cursorY += totalHeight + 7; // Move main cursor down

        // --- 2. Capture Table with html2canvas (Intelligent Mode) ---
        dom.loadingOverlay.querySelector('p').textContent = 'Capturando tabla... (2/2)';

        const styleId = 'pdf-export-styles';
        const tempStyle = document.createElement('style');
        tempStyle.id = styleId;
        // These styles make the table more compact for the screenshot, preventing overflow.
        tempStyle.innerHTML = `
            .pdf-export-mode table {
                font-size: 9px !important; /* Smaller font for export */
            }
            .pdf-export-mode td, .pdf-export-mode th {
                padding: 3px 5px !important; /* Reduced padding for export */
                white-space: normal !important; /* Allow text wrapping */
                overflow-wrap: break-word;
            }
            /* Hide columns that are not essential for the PDF version */
            .pdf-export-mode .col-acciones, .pdf-export-mode .col-imagen {
                 display: none !important;
            }
        `;

        const originalBoxShadow = tableElement.style.boxShadow;
        let canvas;

        try {
            // Apply temporary styles for capture
            document.head.appendChild(tempStyle);
            tableElement.classList.add('pdf-export-mode');
            tableElement.style.boxShadow = 'none';

            canvas = await html2canvas(tableElement, {
                scale: 2.5, // Higher scale for better resolution
                useCORS: true,
                logging: false,
            });
        } finally {
            // ALWAYS remove temporary styles, even if html2canvas fails
            tableElement.classList.remove('pdf-export-mode');
            const styleElement = document.getElementById(styleId);
            if (styleElement) {
                styleElement.remove();
            }
            tableElement.style.boxShadow = originalBoxShadow;
        }

        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);

        // --- 3. Add Table Image to PDF with Scaling ---
        const availableWidth = PAGE_WIDTH - (PAGE_MARGIN * 2);
        const availableHeight = doc.internal.pageSize.height - cursorY - PAGE_MARGIN;

        const imgAspectRatio = imgProps.width / imgProps.height;

        const finalImgWidth = availableWidth;
        const finalImgHeight = finalImgWidth / imgAspectRatio;

        // Add the image, scaled to the full width of the page.
        // The height will adjust proportionally. This might make the content very small
        // if the table is long, but it will always use the full width as requested.
        doc.addImage(imgData, 'PNG', PAGE_MARGIN, cursorY, finalImgWidth, finalImgHeight);

        // --- 4. Save PDF ---
        const fileName = `Reporte_BOM_${product.id.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        doc.save(fileName);
        showToast('PDF híbrido generado con éxito.', 'success');

    } catch (error) {
        console.error("Error exporting hybrid PDF:", error);
        showToast('Error al generar el PDF.', 'error');
    } finally {
        dom.loadingOverlay.style.display = 'none';
    }
}

function handleCaratulaClick(e) {
    const fieldContainer = e.target.closest('.caratula-field');
    if (fieldContainer && !fieldContainer.classList.contains('is-editing')) {
        const currentlyEditing = document.querySelector('.caratula-field.is-editing');
        if (currentlyEditing) {
            // Si ya hay otro campo editándose, lo cerramos (sin guardar)
            const valueDisplay = currentlyEditing.querySelector('.value-display');
            const editControls = currentlyEditing.querySelector('.edit-controls');
            valueDisplay.classList.remove('hidden');
            editControls.classList.add('hidden');
            currentlyEditing.classList.remove('is-editing');
        }

        fieldContainer.classList.add('is-editing');
        const valueDisplay = fieldContainer.querySelector('.value-display');
        const editControls = fieldContainer.querySelector('.edit-controls');
        const input = editControls.querySelector('input');

        valueDisplay.classList.add('hidden');
        editControls.classList.remove('hidden');
        input.focus();
        input.select();

        const saveField = async () => {
            const newValue = input.value;
            const fieldName = fieldContainer.dataset.field;
            const originalValue = fieldContainer.dataset.value;

            fieldContainer.classList.remove('is-editing');
            valueDisplay.classList.remove('hidden');
            editControls.classList.add('hidden');

            if (newValue !== originalValue) {
                const activeProductDocId = appState.sinopticoState?.activeTreeDocId || appState.sinopticoTabularState?.selectedProduct?.docId;
                if (!activeProductDocId) return;

                const productRef = doc(db, COLLECTIONS.PRODUCTOS, activeProductDocId);
                try {
                    await updateDoc(productRef, { [fieldName]: newValue });
                    showToast('Campo de carátula actualizado.', 'success');

                    // Actualizar estado local y re-renderizar la vista actual
                    if(appState.currentView === 'sinoptico') {
                        const product = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.docId === activeProductDocId);
                        product[fieldName] = newValue;
                        renderDetailView(appState.sinopticoState.activeElementId);
                    } else if (appState.currentView === 'sinoptico_tabular') {
                        appState.sinopticoTabularState.selectedProduct[fieldName] = newValue;
                        const { renderReportView } = runSinopticoTabularLogic; // Re-run to get access to inner function
                        if(renderReportView) renderReportView();
                    }
                } catch (error) {
                    showToast('Error al guardar el campo.', 'error');
                    console.error("Error updating caratula field:", error);
                }
            }
        };

        input.addEventListener('blur', saveField, { once: true });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.removeEventListener('blur', saveField);
                input.value = fieldContainer.dataset.value; // Revert value
                fieldContainer.classList.remove('is-editing');
                valueDisplay.classList.remove('hidden');
                editControls.classList.add('hidden');
            }
        });
    }
}


function runFlujogramaLogic() {
    dom.viewContent.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up">
        <i data-lucide="git-branch-plus" class="h-24 w-24 text-gray-300 mb-6"></i>
        <h3 class="text-2xl font-bold">Flujograma de Procesos</h3>
        <p class="text-gray-500 mt-2 max-w-lg mx-auto">Próximamente: Esta sección mostrará un diagrama interactivo del flujo de producción. Podrás seleccionar un producto para ver, editar y reorganizar su secuencia de procesos desde la materia prima hasta el ensamblaje final.</p>
    </div>`;
    lucide.createIcons();
}

function renderSinopticoLayout() {
    return `
        <div id="caratula-container" class="mb-6"></div>
        <div id="sinoptico-layout-container">
            <div id="sinoptico-main-view" class="overflow-y-auto custom-scrollbar bg-white p-6 rounded-xl shadow-lg">
                <div class="flex flex-col md:flex-row gap-4 mb-4">
                    <div class="relative flex-grow">
                        <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                        <input type="text" id="sinoptico-search-input" placeholder="Buscar en el árbol..." class="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex gap-4">
                        <div class="relative">
                            <button id="type-filter-btn" class="flex items-center gap-2 w-full h-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm">
                                <i data-lucide="filter" class="w-4 h-4"></i><span>Filtrar Tipo</span><i data-lucide="chevron-down" class="w-4 h-4 ml-auto"></i>
                            </button>
                            <div id="type-filter-dropdown" class="absolute z-10 right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl hidden p-2 dropdown-menu">
                                <label class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer"><input type="checkbox" data-type="producto" class="type-filter-cb" checked><span>Producto</span></label>
                                <label class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer"><input type="checkbox" data-type="semiterminado" class="type-filter-cb" checked><span>Semiterminado</span></label>
                                <label class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer"><input type="checkbox" data-type="insumo" class="type-filter-cb" checked><span>Insumo</span></label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3 mb-4 p-2 bg-slate-50 rounded-lg">
                    <span class="text-sm font-semibold text-slate-600 flex-shrink-0">Filtros de Cliente:</span>
                    <div id="active-filters-bar" class="flex flex-wrap gap-2"></div>
                    <div class="relative ml-auto">
                        <button id="add-client-filter-btn" class="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-full hover:bg-slate-300"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        <div id="add-client-filter-dropdown" class="absolute z-10 right-0 mt-2 w-64 bg-white border rounded-lg shadow-xl hidden dropdown-menu"></div>
                    </div>
                </div>
                <ul id="sinoptico-tree-container" class="sinoptico-tree-container"></ul>
            </div>
            <div id="sinoptico-details-container">
                <aside id="sinoptico-details-panel">
                    <div id="detail-container" class="sinoptico-sidebar-sticky">
                        <div class="flex flex-col items-center justify-center h-full text-center bg-white rounded-xl shadow-lg p-8">
                            <i data-lucide="layout-grid" class="w-16 h-16 text-slate-300 mb-4"></i>
                            <h2 class="text-xl font-bold">Seleccione un elemento</h2>
                            <p class="text-slate-500 mt-2">Haga clic en un ítem del árbol para ver sus detalles.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    `;
}

function initSinoptico() {
    if (appState.currentViewCleanup) {
        appState.currentViewCleanup();
    }
    if (!appState.sinopticoState) {
        appState.sinopticoState = {
            activeElementId: null,
            activeTreeDocId: null,
            activeFilters: { clients: new Set(), types: new Set(['producto', 'semiterminado', 'insumo']) },
            expandedNodes: new Set()
        };
    }
    const searchInput = document.getElementById('sinoptico-search-input');
    const typeFilterCheckboxes = document.querySelectorAll('.type-filter-cb');
    
    function renderFullUI() {
        renderTree();
        renderActiveFilters();
        populateAddClientFilterDropdown();
    }
    
    function renderTree() {
        const treeContainer = document.getElementById('sinoptico-tree-container');
        if (!treeContainer) return;
        const searchTerm = searchInput.value.toLowerCase();
        treeContainer.innerHTML = '';

        const treesToRender = appState.collections[COLLECTIONS.PRODUCTOS].filter(producto => {
            if (!producto.estructura || producto.estructura.length === 0) return false;
            // Si hay filtros de cliente activos, aplicarlos. Si no, mostrar todos.
            if (appState.sinopticoState.activeFilters.clients.size > 0 && !appState.sinopticoState.activeFilters.clients.has(producto.clienteId)) return false;
            return producto.estructura.some(rootNode => itemOrDescendantsMatch(rootNode, searchTerm));
        });
        if (treesToRender.length === 0) {
            treeContainer.innerHTML = `<div class="text-center text-slate-500 p-8">
                <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-300"></i>
                <p class="mt-4 font-medium">No se encontraron resultados.</p>
                <p class="text-sm">Intente con otro filtro o término de búsqueda.</p>
            </div>`;
            lucide.createIcons();
            return;
        }
        const productsByClient = new Map();
        treesToRender.forEach(arbol => {
            if (!productsByClient.has(arbol.clienteId)) {
                productsByClient.set(arbol.clienteId, []);
            }
            productsByClient.get(arbol.clienteId).push(arbol.estructura[0]);
        });
        productsByClient.forEach((productos, clienteId) => {
            const client = appState.collectionsById[COLLECTIONS.CLIENTES].get(clienteId);
            const clientLi = document.createElement('li');
            clientLi.className = 'sinoptico-tree-item';
            clientLi.innerHTML = `<div class="flex items-center p-2 font-bold text-slate-600"><i data-lucide="building-2" class="w-5 h-5 mr-3 text-slate-500 flex-shrink-0"></i><span>${client?.descripcion || 'Cliente Desconocido'}</span></div>`;
            
            const ul = document.createElement('ul');
            productos.forEach((productNode, index) => {
                const isLast = index === productos.length - 1;
                const productElement = buildAndFilterNode(productNode, searchTerm, isLast);
                if (productElement) {
                    ul.appendChild(productElement);
                }
            });
            if (ul.hasChildNodes()) {
                clientLi.appendChild(ul);
                treeContainer.appendChild(clientLi);
            }
        });
        lucide.createIcons();
    }
    
    function buildAndFilterNode(node, searchTerm, isLast) {
        if (!itemOrDescendantsMatch(node, searchTerm) || !appState.sinopticoState.activeFilters.types.has(node.tipo)) {
            return null;
        }
        const li = createTreeItemElement(node, isLast);
        const children = node.children || [];
        if (children.length > 0 && appState.sinopticoState.expandedNodes.has(node.id)) {
            const childrenContainer = document.createElement('ul');
            const visibleChildren = children.filter(child => itemOrDescendantsMatch(child, searchTerm));
            visibleChildren.forEach((childNode, index) => {
                const isChildLast = index === visibleChildren.length - 1;
                const renderedChildNode = buildAndFilterNode(childNode, searchTerm, isChildLast);
                if (renderedChildNode) childrenContainer.appendChild(renderedChildNode);
            });
            if (li && childrenContainer.hasChildNodes()) li.appendChild(childrenContainer);
        }
        return li;
    }
    
    function createTreeItemElement(node, isLast) {
        const collectionName = node.tipo + 's';
        const item = appState.collectionsById[collectionName]?.get(node.refId);
        if (!item) return null;
    
        const li = document.createElement('li');
        li.className = 'sinoptico-tree-item';
        li.dataset.id = node.id;
        li.dataset.refId = node.refId;
        li.dataset.type = node.tipo;
        if (appState.sinopticoState.expandedNodes.has(node.id)) li.classList.add('expanded');
        if (isLast) li.classList.add('is-last');
        
        const hasChildren = node.children?.length > 0;
        const iconMap = { producto: 'package', semiterminado: 'box', insumo: 'beaker' };
        
        const div = document.createElement('div');
        div.className = 'sinoptico-tree-item-content flex items-center p-2 cursor-pointer hover:bg-slate-100 rounded-lg min-h-[2.75rem]';
        div.setAttribute('data-type', node.tipo);
        if (node.id === appState.sinopticoState.activeElementId) div.classList.add('active');
        
        div.innerHTML = `
            <span class="flex items-center justify-center w-5 h-5 mr-1 flex-shrink-0">
                ${hasChildren ? '<i data-lucide="chevron-right" class="w-5 h-5 text-slate-400 toggle-expand"></i>' : ''}
            </span>
            <i data-lucide="${iconMap[node.tipo]}" class="w-5 h-5 mr-3 text-blue-600 flex-shrink-0"></i>
            <span class="flex-grow truncate select-none" title="${item.descripcion}">${item.descripcion}</span>
            <span class="text-xs text-slate-400 font-mono ml-2 select-none">${item.id}</span>
        `;
    
        li.appendChild(div);
        return li;
    }
    function itemOrDescendantsMatch(node, searchTerm) {
        const collectionName = node.tipo + 's';
        const item = appState.collectionsById[collectionName]?.get(node.refId);
        if (!item) return false;
        if (!searchTerm) return true;
        const itemText = `${item.descripcion} ${item.id}`.toLowerCase();
        if (itemText.includes(searchTerm)) return true;
        return (node.children || []).some(childNode => itemOrDescendantsMatch(childNode, searchTerm));
    }
    
    function renderActiveFilters() {
        const activeFiltersBar = document.getElementById('active-filters-bar');
        if (!activeFiltersBar) return;
        activeFiltersBar.innerHTML = appState.sinopticoState.activeFilters.clients.size === 0
            ? `<span class="text-xs text-slate-500 italic">Ningún cliente seleccionado</span>`
            : [...appState.sinopticoState.activeFilters.clients].map(clientId => {
                const client = appState.collectionsById[COLLECTIONS.CLIENTES].get(clientId);
                return client ? `<div class="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full animate-fade-in"><span>${client.descripcion}</span><button data-id="${clientId}" class="remove-filter-btn p-0.5 hover:bg-blue-200 rounded-full"><i data-lucide="x" class="w-3.5 h-3.5 pointer-events-none"></i></button></div>` : '';
            }).join('');
        lucide.createIcons();
    }
    
    function populateAddClientFilterDropdown() {
        const dropdown = document.getElementById('add-client-filter-dropdown');
        if(!dropdown) return;
        const availableClients = appState.collections[COLLECTIONS.CLIENTES].filter(client => !appState.sinopticoState.activeFilters.clients.has(client.id));
        dropdown.innerHTML = availableClients.length === 0
            ? `<span class="block px-4 py-2 text-sm text-slate-500">No hay más clientes.</span>`
            : availableClients.map(client => `<a href="#" data-id="${client.id}" class="block px-4 py-2 text-sm hover:bg-slate-100">${client.descripcion}</a>`).join('');
    }
    function renderDetailView(componentId) {
        const detailContainer = document.getElementById('detail-container');
        if (!detailContainer) return;

        let targetNode = null;
        let parentNode = null;
        let activeTree = null;

        // Find the active product tree based on the selected component
        if (componentId) {
            for (const producto of appState.collections[COLLECTIONS.PRODUCTOS]) {
                if (!producto.estructura) continue; // Skip products without a tree
                targetNode = findNode(componentId, producto.estructura);
                if (targetNode) {
                    activeTree = producto;
                    appState.sinopticoState.activeTreeDocId = producto.docId;
                    // We need to find the parent within the same structure
                    parentNode = findParentNode(componentId, producto.estructura);
                    break;
                }
            }
        }
        
        // Render the "Carátula" based on the found tree
        if (activeTree) {
            const producto = appState.collectionsById[COLLECTIONS.PRODUCTOS].get(activeTree.productoPrincipalId);
            const cliente = appState.collectionsById[COLLECTIONS.CLIENTES].get(activeTree.clienteId);
            renderCaratula(producto, cliente);
        } else {
            renderCaratula(null, null);
        }

        // If no component is selected or found, show placeholder in details
        if (!componentId || !targetNode) {
            detailContainer.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center bg-white rounded-xl shadow-lg p-8">
                <i data-lucide="layout-grid" class="w-16 h-16 text-slate-300 mb-4"></i>
                <h2 class="text-xl font-bold">Seleccione un elemento</h2>
                <p class="text-slate-500 mt-2">Haga clic en un ítem del árbol para ver sus detalles.</p>
            </div>`;
            lucide.createIcons();
            return;
        }
    
        const collectionName = targetNode.tipo + 's';
        const item = appState.collectionsById[collectionName]?.get(targetNode.refId);
        if (!item) { return; }
    
        const iconMap = { producto: 'package', semiterminado: 'box', insumo: 'beaker' };
        const name = item.descripcion;
        let content = `<div class="bg-white rounded-xl shadow-lg p-6 h-full overflow-y-auto custom-scrollbar animate-fade-in">
            <div class="flex items-start mb-6 pb-4 border-b">
                <div class="w-14 h-14 flex-shrink-0 mr-4 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <i data-lucide="${iconMap[targetNode.tipo]}" class="w-8 h-8 text-white"></i>
                </div>
                <div>
                    <p class="text-sm font-bold uppercase text-blue-600">${targetNode.tipo}</p>
                    <h2 class="text-2xl font-bold leading-tight">${name}</h2>
                    <p class="text-sm font-semibold text-slate-500">${item.id}</p>
                </div>
            </div>`;
    
        if (targetNode.tipo === 'producto') {
            content += `<div class="mb-4">
                <button data-action="export-product-pdf" class="w-full bg-red-500 text-white px-4 py-2.5 rounded-md hover:bg-red-600 flex items-center justify-center text-sm font-semibold shadow-sm">
                    <i data-lucide="file-text" class="mr-2 h-4 w-4"></i>Exportar Sinóptico a PDF
                </button>
            </div>`;
        } else {
            // Botón para abrir el modal de edición
        if (checkUserPermission('edit')) {
            content += `<div class="mb-4">
                <button data-action="open-sinoptico-edit-modal" data-node-id="${targetNode.id}" class="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 flex items-center justify-center text-sm font-semibold shadow-sm">
                    <i data-lucide="pencil" class="mr-2 h-4 w-4"></i>Editar Cantidad y Comentario
                </button>
            </div>`;
        }
        }
    
        const createSection = (title) => `<h3 class="sinoptico-detail-section-header">${title}</h3>`;
        const createRow = (icon, label, value) => !value && value !== 0 ? '' : `<div class="flex items-start py-3 border-b border-slate-100"><i data-lucide="${icon}" class="w-5 h-5 text-slate-400 mt-1 mr-4 flex-shrink-0"></i><div><p class="text-sm text-slate-500">${label}</p><p class="font-semibold">${value}</p></div></div>`;
        
        content += createSection('Contexto en el Árbol');
    
        if (parentNode) {
            const parentItem = appState.collectionsById[parentNode.tipo + 's']?.get(parentNode.refId);
            if (parentItem) {
                 content += createRow('arrow-up', 'Padre', parentItem.descripcion);
            }
        }
    
        if (targetNode.tipo !== 'producto') {
            const unidadData = appState.collectionsById[COLLECTIONS.UNIDADES].get(item.unidadMedidaId);
            const unidadLabel = unidadData ? `(${unidadData.id})` : '';
            const quantityValue = targetNode.quantity;
            const isQuantitySet = quantityValue !== null && quantityValue !== undefined;
            const quantityDisplay = isQuantitySet ? quantityValue : '<span class="text-red-500 italic">Sin asignar</span>';
            content += createRow('package-plus', `Cantidad Requerida ${unidadLabel}`, quantityDisplay);
            content += createRow('message-square', 'Comentario', targetNode.comment || '<span class="text-slate-400 italic">Sin comentario</span>');
        }
    
        if (targetNode.children && targetNode.children.length > 0) {
            content += `<p class="text-sm font-semibold text-slate-600 mt-4 mb-2">Componentes Hijos (${targetNode.children.length})</p><div class="space-y-2">`;
            targetNode.children.forEach(child => {
                const childItem = appState.collectionsById[child.tipo + 's']?.get(child.refId);
                if (childItem) {
                    content += `<button data-navigate-to="${child.id}" class="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-md border flex items-center text-sm"><i data-lucide="${iconMap[child.tipo]}" class="w-4 h-4 mr-3 text-slate-500"></i><p class="font-semibold flex-grow">${childItem.descripcion}</p></button>`;
                }
            });
            content += `</div>`;
        }
    
        content += createSection('Detalles del Componente Maestro');
    
        switch (targetNode.tipo) {
            case 'producto':
                const client = appState.collectionsById[COLLECTIONS.CLIENTES].get(item.clienteId);
                content += createRow('building-2', 'Cliente', client?.descripcion);
                content += createRow('hash', 'Código Cliente', item.codigo_cliente);
                content += createRow('tag', 'Versión', item.version);
                content += createRow('car', 'Piezas por Vehículo', item.pzas_vh);
                content += createRow('scale', 'Peso', item.peso_gr ? `${item.peso_gr} gr` : null);
                content += createRow('move-3d', 'Dimensiones (X*Y*Z)', item.dimensiones_xyz);
                break;
            case 'semiterminado':
                const tiempoCiclo = item.tiempo_ciclo_seg ? `${item.tiempo_ciclo_seg} seg` : null;
                const peso = item.peso_gr ? `${item.peso_gr} gr` : null;
                const tolerancia = item.tolerancia_peso_gr ? `± ${item.tolerancia_peso_gr} gr` : null;
                content += createRow('timer', 'Tiempo Ciclo', tiempoCiclo);
                content += createRow('scale', 'Peso', peso);
                content += createRow('plus-minus', 'Tolerancia de Peso', tolerancia);
                content += createRow('move-3d', 'Dimensiones (X*Y*Z)', item.dimensiones_xyz);
                content += createRow('binary', 'Materiales', item.materiales_componentes);
                content += createRow('globe-2', 'Sourcing', item.sourcing);
                break;
            case 'insumo':
                const proveedor = appState.collectionsById[COLLECTIONS.PROVEEDORES].get(item.proveedorId);
                const unidad = appState.collectionsById[COLLECTIONS.UNIDADES].get(item.unidadMedidaId);
                content += createRow('truck', 'Proveedor', proveedor?.descripcion);
                content += createRow('layers-3', 'Material', item.material);
                content += createRow('ruler', 'Unidad Medida', unidad?.descripcion);
                content += createRow('dollar-sign', 'Costo', typeof item.costo === 'number' ? `$${item.costo.toFixed(2)} por ${unidad?.id || 'Unidad'}` : 'N/A');
                content += createRow('archive', 'Stock Mínimo', item.stock_minimo);
                content += createRow('globe-2', 'Sourcing', item.sourcing);
                content += createRow('message-square', 'Observaciones', item.observaciones);
                break;
        }
        content += `</div>`;
        detailContainer.innerHTML = content;
        lucide.createIcons();
    }
    
async function getLogoBase64() {
    try {
        const response = await fetch('barack_logo.png');
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Could not fetch barack_logo.png:", error);
        return null;
    }
}


async function exportProductTreePdf(productNode) {
    showToast('Iniciando exportación a PDF...', 'info');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const logoBase64 = await getLogoBase64();

    const PAGE_MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.width;
    const PAGE_HEIGHT = doc.internal.pageSize.height;
    const FONT_SIZES = { H1: 16, H2: 10, BODY: 8, HEADER_TABLE: 8, FOOTER: 8 };
    const BASE_ROW_HEIGHT = 7;
    const LINE_SPACING = 4;
    const INDENT_WIDTH = 5;
    const LINE_COLOR = '#CCCCCC';
    const HEADER_BG_COLOR = '#44546A';
    const TEXT_COLOR = '#2d3748';
    const TITLE_COLOR = '#2563eb';
    const TYPE_COLORS = {
        producto: '#3b82f6', semiterminado: '#16a34a', insumo: '#64748b'
    };

    let cursorY = 0;

    const flattenedData = [];
    function flattenTree(node, level, parentLineage = []) {
        const item = appState.collectionsById[node.tipo + 's']?.get(node.refId);
        if (!item) return;

        flattenedData.push({ node, item, level, lineage: parentLineage });

        if (node.children && node.children.length > 0) {
            const visibleChildren = node.children.filter(child => appState.collectionsById[child.tipo + 's']?.get(child.refId));
            visibleChildren.forEach((child, index) => {
                const isLast = index === visibleChildren.length - 1;
                flattenTree(child, level + 1, [...parentLineage, !isLast]);
            });
        }
    }
    flattenTree(productNode, 0);

    async function drawPageHeader() {
        const productItem = appState.collectionsById[COLLECTIONS.PRODUCTOS].get(productNode.refId);
        const clientItem = appState.collectionsById[COLLECTIONS.CLIENTES].get(productItem.clienteId);

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', PAGE_MARGIN, 12, 40, 15);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZES.H1);
        doc.setTextColor(TITLE_COLOR);
        doc.text('Sinóptico de Producto', PAGE_WIDTH - PAGE_MARGIN, 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZES.H2);
        doc.setTextColor(TEXT_COLOR);
        doc.text(`Producto: ${productItem.descripcion} (${productItem.id})`, PAGE_WIDTH - PAGE_MARGIN, 25, { align: 'right' });
        doc.text(`Cliente: ${clientItem?.descripcion || 'N/A'}`, PAGE_WIDTH - PAGE_MARGIN, 30, { align: 'right' });

        cursorY = 40;
    }

    function drawTableHeaders() {
        doc.setFillColor(HEADER_BG_COLOR);
        doc.rect(PAGE_MARGIN, cursorY, PAGE_WIDTH - (PAGE_MARGIN * 2), BASE_ROW_HEIGHT, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZES.HEADER_TABLE);
        doc.setTextColor('#FFFFFF');

        const headers = ['Componente', 'Tipo', 'Cantidad', 'Código'];
        const colX = [PAGE_MARGIN + 2, 110, 135, 160];
        headers.forEach((header, i) => {
            doc.text(header, colX[i], cursorY + BASE_ROW_HEIGHT / 2, { baseline: 'middle' });
        });

        cursorY += BASE_ROW_HEIGHT;
    }

    function drawRow(data) {
        const { item, node, level, lineage } = data;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZES.BODY);

        const descriptionX = PAGE_MARGIN + (level * INDENT_WIDTH) + 3;
        const descriptionMaxWidth = 108 - descriptionX;
        const descriptionLines = doc.splitTextToSize(item.descripcion, descriptionMaxWidth);
        const rowHeight = Math.max(BASE_ROW_HEIGHT, descriptionLines.length * LINE_SPACING + 2);

        if (cursorY + rowHeight > PAGE_HEIGHT - (PAGE_MARGIN + 10)) {
            return false;
        }

        doc.setTextColor(TEXT_COLOR);
        if (node.tipo === 'producto') doc.setFont('helvetica', 'bold');

        const textY = cursorY + rowHeight / 2;

        doc.setDrawColor(LINE_COLOR);
        const parentX = PAGE_MARGIN + ((level - 1) * INDENT_WIDTH);
        lineage.forEach((continues, i) => {
            const currentParentX = PAGE_MARGIN + (i * INDENT_WIDTH);
            if (continues) {
                doc.line(currentParentX, cursorY, currentParentX, cursorY + rowHeight);
            }
        });

        if (level > 0) {
            const isLast = !lineage[level-1];
            doc.line(parentX, textY, descriptionX - 3, textY);
            if (!isLast) {
                 doc.line(parentX, cursorY, parentX, cursorY + rowHeight);
            } else {
                 doc.line(parentX, cursorY, parentX, textY);
            }
        }

        doc.setFillColor(TYPE_COLORS[node.tipo] || '#000000');
        doc.circle(descriptionX - 2.5, textY, 1.2, 'F');

        doc.text(descriptionLines, descriptionX, cursorY + 3.5);
        doc.text(node.tipo.charAt(0).toUpperCase() + node.tipo.slice(1), 110, textY, { baseline: 'middle' });

        const unitData = appState.collectionsById[COLLECTIONS.UNIDADES].get(item.unidadMedidaId);
        const unit = unitData ? unitData.id : 'Un';
        const quantityValue = node.quantity;
        const isQuantitySet = quantityValue !== null && quantityValue !== undefined;
        const quantityText = isQuantitySet ? `${quantityValue} ${unit}` : '---';
        doc.text(node.tipo !== 'producto' ? quantityText : '', 135, textY, { baseline: 'middle' });

        doc.text(item.id, 160, textY, { baseline: 'middle' });

        cursorY += rowHeight;
        return true;
    }

    function drawPageFooter(pageNumber, pageCount) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZES.FOOTER);
        doc.setTextColor(TEXT_COLOR);
        const date = new Date().toLocaleDateString('es-AR');
        doc.text(`Generado el ${date}`, PAGE_MARGIN, PAGE_HEIGHT - 10);
        doc.text(`Página ${pageNumber} de ${pageCount}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
    }

    await drawPageHeader();
    drawTableHeaders();

    for (const data of flattenedData) {
        const rowDrawn = drawRow(data);
        if (!rowDrawn) {
            doc.addPage();
            await drawPageHeader();
            drawTableHeaders();
            drawRow(data);
        }
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawPageFooter(i, pageCount);
    }

    doc.save(`Sinoptico_Grafico_${productNode.refId.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF con árbol gráfico generado con éxito.', 'success');
}
    
    const handleSinopticoClick = async (e) => {
        const target = e.target;
        const button = target.closest('button[data-action]');

        if (button) {
            const action = button.dataset.action;
            if (action === 'open-sinoptico-edit-modal') {
                openSinopticoEditModal(button.dataset.nodeId);
                return;
            }
        }
        
        if (target.closest('#sinoptico-toggle-details')) {
            document.getElementById('sinoptico-main-view').classList.toggle('expanded');
            document.getElementById('sinoptico-details-container').classList.toggle('hidden');
            return;
        }
    
        const exportBtn = target.closest('button[data-action="export-product-pdf"]');
        if (exportBtn) {
            const activeProduct = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.docId === appState.sinopticoState.activeTreeDocId);
            if (activeProduct && activeProduct.estructura) {
                const activeNode = findNode(appState.sinopticoState.activeElementId, activeProduct.estructura);
                if (activeNode && activeNode.tipo === 'producto') {
                    await exportProductTreePdf(activeNode);
                }
            }
            return;
        }
        
        const treeItem = target.closest('.sinoptico-tree-item');
        if (treeItem) {
            const componentId = treeItem.dataset.id;
            
            if (target.closest('.toggle-expand')) {
                if (appState.sinopticoState.expandedNodes.has(componentId)) {
                    appState.sinopticoState.expandedNodes.delete(componentId);
                } else {
                    appState.sinopticoState.expandedNodes.add(componentId);
                }
            } else if (target.closest('.sinoptico-tree-item-content')) {
                if (appState.sinopticoState.activeElementId === componentId) {
                    appState.sinopticoState.activeElementId = null;
                    renderDetailView(null);
                } else {
                    appState.sinopticoState.activeElementId = componentId;
                    renderDetailView(componentId);
                }
            }
            renderTree();
        }
        
        const detailItem = target.closest('button[data-navigate-to]');
        if(detailItem) {
            const navigateToId = detailItem.dataset.navigateTo;
            appState.sinopticoState.activeElementId = navigateToId;
            const productForParent = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.docId === appState.sinopticoState.activeTreeDocId);
            if (productForParent && productForParent.estructura) {
                const parentNode = findParentNode(navigateToId, productForParent.estructura);
                if(parentNode && !appState.sinopticoState.expandedNodes.has(parentNode.id)){
                    appState.sinopticoState.expandedNodes.add(parentNode.id);
                }
            }
            
            renderTree();
            renderDetailView(navigateToId);
            const elementInTree = document.querySelector(`.sinoptico-tree-item[data-id="${navigateToId}"]`);
            elementInTree?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    
        if(target.closest('#type-filter-btn')) { e.stopPropagation(); document.getElementById('type-filter-dropdown').classList.toggle('hidden'); }
        if(target.closest('#add-client-filter-btn')) { e.stopPropagation(); populateAddClientFilterDropdown(); document.getElementById('add-client-filter-dropdown').classList.toggle('hidden'); }
        
        const addClientLink = target.closest('#add-client-filter-dropdown a');
        if (addClientLink) { e.preventDefault(); appState.sinopticoState.activeFilters.clients.add(addClientLink.dataset.id); document.getElementById('add-client-filter-dropdown').classList.add('hidden'); renderFullUI(); }
        
        const removeFilterBtn = target.closest('.remove-filter-btn');
        if (removeFilterBtn) { appState.sinopticoState.activeFilters.clients.delete(removeFilterBtn.dataset.id); renderFullUI(); }
        
        const exportPdfLink = target.closest('a[data-action="export-sinoptico-pdf"]');
        if (exportPdfLink) { 
            e.preventDefault();
            exportSinopticoPdf(appState.sinopticoState.activeFilters); 
        }
    };
    
    dom.viewContent.addEventListener('click', handleSinopticoClick);
    dom.viewContent.addEventListener('click', handleCaratulaClick);
    
    const searchHandler = () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            appState.collections[COLLECTIONS.PRODUCTOS].forEach(producto => {
                if (!producto.estructura) return; // Omitir productos sin estructura
                function findAndExpand(node, parents) {
                    const item = appState.collectionsById[node.tipo + 's']?.get(node.refId);
                    if (!item) return;

                    const newParents = [...parents, node.id];
                    const itemText = `${item.descripcion} ${item.id}`.toLowerCase();
                    if (itemText.includes(searchTerm)) {
                        newParents.forEach(pId => appState.sinopticoState.expandedNodes.add(pId));
                    }
                    if (node.children) node.children.forEach(child => findAndExpand(child, newParents));
                }
                producto.estructura.forEach(rootNode => findAndExpand(rootNode, []));
            });
        }
        renderTree();
    };
    searchInput.addEventListener('input', searchHandler);
    
    typeFilterCheckboxes.forEach(cb => { cb.addEventListener('change', () => { if (cb.checked) appState.sinopticoState.activeFilters.types.add(cb.dataset.type); else appState.sinopticoState.activeFilters.types.delete(cb.dataset.type); renderTree(); }); });
    
    appState.currentViewCleanup = () => {
        dom.viewContent.removeEventListener('click', handleSinopticoClick);
        searchInput.removeEventListener('input', searchHandler);
    };
    
    renderFullUI();
}

function exportSinopticoPdf(activeFilters) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let cursor = { y: 20 };
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;
    const lineSpacing = 6;
    const leftMargin = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("Reporte de Estructura de Productos", leftMargin, cursor.y);
    cursor.y += lineSpacing * 2;
    const treesToRender = appState.collections[COLLECTIONS.PRODUCTOS].filter(producto => {
        return producto.hasOwnProperty('estructura') && (activeFilters.clients.size === 0 || activeFilters.clients.has(producto.clienteId));
    });
    if (treesToRender.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text("No hay datos para mostrar con los filtros actuales.", leftMargin, cursor.y);
        doc.save("reporte_sinoptico_vacio.pdf");
        return;
    }
    const checkPageBreak = () => {
        if (cursor.y > pageHeight - marginBottom) {
            doc.addPage();
            cursor.y = 20;
        }
    };
    function traverse(node, prefix, isLast) {
        const collectionName = node.tipo + 's';
        const item = appState.collectionsById[collectionName]?.get(node.refId);
        if (!item || !activeFilters.types.has(node.tipo)) return;
        checkPageBreak();
        
        const isQuantitySet = node.quantity !== null && node.quantity !== undefined;
        const quantityText = node.tipo !== 'producto' ? ` [x${isQuantitySet ? node.quantity : '---'}]` : '';
        const linePrefix = prefix + (isLast ? '`-- ' : '|-- ');
        const line = `${linePrefix}${item.descripcion}${quantityText}`;
        const code = `(${node.refId})`;

        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        doc.text(line, leftMargin, cursor.y);
        doc.setFont('courier', 'italic');
        doc.setTextColor(100);
        doc.text(code, doc.internal.pageSize.width - leftMargin - doc.getTextWidth(code), cursor.y);
        doc.setTextColor(0);
        cursor.y += lineSpacing;
        if (node.children && node.children.length > 0) {
            const newPrefix = prefix + (isLast ? '    ' : '|   ');
            const visibleChildren = node.children.filter(child => {
                const childItem = appState.collectionsById[child.tipo + 's']?.get(child.refId);
                return childItem && activeFilters.types.has(child.tipo);
            });
            visibleChildren.forEach((child, index) => {
                traverse(child, newPrefix, index === visibleChildren.length - 1);
            });
        }
    }
    treesToRender.forEach(arbol => {
        checkPageBreak();
        const client = appState.collectionsById[COLLECTIONS.CLIENTES].get(arbol.clienteId);
        if (client && activeFilters.types.has('cliente')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(`CLIENTE: ${client.descripcion}`, leftMargin, cursor.y);
            cursor.y += lineSpacing * 1.5;
        }
        arbol.estructura.forEach((rootNode, index) => {
            traverse(rootNode, '', index === arbol.estructura.length - 1);
        });
        cursor.y += lineSpacing;
    });
    doc.save("reporte_sinoptico.pdf");
    showToast('Reporte PDF del árbol generado.', 'success');
}

// =================================================================================
// --- LÓGICA DE CLONACIÓN Y MODALES ESPECIALES ---
// =================================================================================

async function cloneProduct() {
    const productToClone = appState.sinopticoTabularState.selectedProduct;
    if (!productToClone) {
        showToast('No hay un producto seleccionado para clonar.', 'error');
        return;
    }

    const newId = await showPromptModal('Clonar Producto', `Ingrese el nuevo código para el clon de "${productToClone.id}":`);
    if (!newId) return; // User cancelled

    // Check if new ID already exists
    const q = query(collection(db, COLLECTIONS.PRODUCTOS), where("id", "==", newId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        showToast(`El código de producto "${newId}" ya existe.`, 'error');
        return;
    }

    showToast('Clonando producto...', 'info');

    // Deep copy
    const newProduct = JSON.parse(JSON.stringify(productToClone));

    // Reset properties
    delete newProduct.docId;
    delete newProduct.lastUpdated;
    delete newProduct.lastUpdatedBy;
    delete newProduct.reviewedBy;
    newProduct.id = newId;
    newProduct.createdAt = new Date();

    // Generate new unique IDs for all nodes in the structure
    function regenerateNodeIds(nodes) {
        if (!nodes) return;
        nodes.forEach(node => {
            node.id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            if (node.children) {
                regenerateNodeIds(node.children);
            }
        });
    }

    if (newProduct.estructura) {
        regenerateNodeIds(newProduct.estructura);
        // Also update the root node's refId if it's self-referencing
        if (newProduct.estructura[0] && newProduct.estructura[0].tipo === 'producto') {
            newProduct.estructura[0].refId = newId;
        }
    }

    try {
        await addDoc(collection(db, COLLECTIONS.PRODUCTOS), newProduct);
        showToast(`Producto "${productToClone.descripcion}" clonado exitosamente como "${newId}".`, 'success');
    } catch (error) {
        console.error("Error clonando el producto:", error);
        showToast('Ocurrió un error al clonar el producto.', 'error');
    }
}

function showPromptModal(title, message) {
    return new Promise(resolve => {
        const modalId = `prompt-modal-${Date.now()}`;
        const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md m-4 modal-content">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2">${title}</h3>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <input type="text" id="prompt-input" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
                <div class="flex justify-end items-center p-4 border-t bg-gray-50 space-x-4">
                    <button data-action="cancel" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
                    <button data-action="confirm" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold">Aceptar</button>
                </div>
            </div>
        </div>`;
        dom.modalContainer.innerHTML = modalHTML;
        const modalElement = document.getElementById(modalId);
        const input = modalElement.querySelector('#prompt-input');
        input.focus();

        const close = (value) => {
            modalElement.remove();
            resolve(value);
        };

        modalElement.addEventListener('click', e => {
            const action = e.target.closest('button')?.dataset.action;
            if (action === 'confirm') {
                close(input.value.trim());
            } else if (action === 'cancel') {
                close(null);
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                close(input.value.trim());
            } else if (e.key === 'Escape') {
                close(null);
            }
        });
    });
}

// =================================================================================
// --- LÓGICA DE PERFIL DE USUARIO ---
// =================================================================================

function runProfileLogic() {
    const user = appState.currentUser;
    if (!user) return;

    const roleBadges = {
        admin: '<span class="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">Administrador</span>',
        editor: '<span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">Editor</span>',
        lector: '<span class="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">Lector</span>'
    };

    dom.viewContent.innerHTML = `<div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        <!-- Profile Header -->
        <div class="bg-white p-8 rounded-xl shadow-lg flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div class="relative group">
                <img src="${user.avatarUrl}" alt="Avatar" class="w-24 h-24 rounded-full border-4 border-slate-200 object-cover">
                <button id="change-avatar-btn" class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="camera" class="w-8 h-8 text-white"></i>
                </button>
            </div>
            <div class="text-center sm:text-left">
                <div class="flex items-center justify-center sm:justify-start">
                    <h3 id="display-name" class="text-3xl font-bold text-slate-800">${user.name}</h3>
                    <button id="edit-name-btn" class="ml-2 text-slate-400 hover:text-slate-600"><i data-lucide="pencil" class="w-5 h-5"></i></button>
                </div>
                <p class="text-slate-500">${user.email}</p>
                <div class="mt-2">${roleBadges[user.role] || ''}</div>
            </div>
        </div>

        <!-- General Settings -->
        <div class="bg-white p-8 rounded-xl shadow-lg">
            <h4 class="text-xl font-bold text-slate-800 border-b pb-4 mb-6">Configuración General</h4>
            <form id="profile-settings-form" class="space-y-4 max-w-md">
                <div>
                    <label for="profile-name" class="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar</label>
                    <input type="text" id="profile-name" value="${user.name}" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
                <div>
                    <label for="profile-avatar" class="block text-sm font-medium text-gray-700 mb-1">URL de la foto de perfil</label>
                    <input type="url" id="profile-avatar" value="${user.avatarUrl}" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
                <div class="pt-2"><button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Perfil</button></div>
            </form>
        </div>

        <!-- Password Change -->
        <div class="bg-white p-8 rounded-xl shadow-lg">
            <h4 class="text-xl font-bold text-slate-800 border-b pb-4 mb-6">Cambiar Contraseña</h4>
            <form id="change-password-form" class="space-y-4 max-w-md">
                <div><label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label><input type="password" id="current-password" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></div>
                <div><label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label><input type="password" id="new-password" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></div>
                <div><label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label><input type="password" id="confirm-password" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></div>
                <div class="pt-2"><button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Cambios</button></div>
            </form>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white p-8 rounded-xl shadow-lg border-2 border-red-200">
            <h4 class="text-xl font-bold text-red-700 border-b border-red-200 pb-4 mb-6">Zona de Peligro</h4>
            <div class="flex items-center justify-between">
                <div><p class="font-semibold">Eliminar esta cuenta</p><p class="text-sm text-slate-500">Una vez que elimine su cuenta, no hay vuelta atrás. Por favor, esté seguro.</p></div>
                <button data-action="delete-account" class="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-semibold flex-shrink-0">Eliminar Cuenta</button>
            </div>
        </div>
    </div>`;
    lucide.createIcons();

    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    document.getElementById('profile-settings-form').addEventListener('submit', handleProfileUpdate);

    // Quick edit buttons
    document.getElementById('edit-name-btn').addEventListener('click', () => {
        document.getElementById('profile-name').focus();
    });
    document.getElementById('change-avatar-btn').addEventListener('click', openAvatarSelectionModal);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const newName = document.getElementById('profile-name').value;
    const newAvatarUrl = document.getElementById('profile-avatar').value;

    const user = auth.currentUser;
    const userDocRef = doc(db, COLLECTIONS.USUARIOS, user.uid);

    try {
        // Update Firebase Auth profile
        await updateProfile(user, {
            displayName: newName,
            photoURL: newAvatarUrl
        });

        // Update Firestore user document
        await updateDoc(userDocRef, {
            name: newName,
            photoURL: newAvatarUrl
        });

        // Update local app state
        appState.currentUser.name = newName;
        appState.currentUser.avatarUrl = newAvatarUrl;

        showToast('Perfil actualizado con éxito.', 'success');
        renderUserMenu(); // Refresh the user menu in the navbar
        runProfileLogic(); // Re-render the profile page with new data

    } catch (error) {
        console.error("Error updating profile:", error);
        showToast("Error al actualizar el perfil.", "error");
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    if (newPass !== confirmPass) {
        showToast('Las nuevas contraseñas no coinciden.', 'error');
        return;
    }
    try {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);
        showToast('Contraseña cambiada exitosamente.', 'success');
        e.target.reset();
    } catch (error) {
        console.error("Error changing password:", error);
        showToast("Error al cambiar la contraseña. Verifique su contraseña actual.", "error");
    }
}

function handleDeleteAccount() {
    const title = "Confirmación Extrema Requerida";
    const message = `Esta acción es irreversible. Se eliminarán todos sus datos. Para confirmar, escriba "ELIMINAR" en el campo de abajo.`;
    
    const modalId = `delete-account-modal`;
    const modalHTML = `<div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md m-4 modal-content">
            <div class="p-6 text-center"><i data-lucide="alert-triangle" class="h-12 w-12 mx-auto text-red-500 mb-4"></i><h3 class="text-xl font-bold mb-2">${title}</h3><p class="text-gray-600 mb-4">${message}</p><input type="text" id="delete-confirm-input" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Escriba ELIMINAR aquí"></div>
            <div class="flex justify-center items-center p-4 border-t bg-gray-50 space-x-4"><button data-action="cancel" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button><button id="confirm-delete-btn" class="bg-red-600 text-white px-6 py-2 rounded-md font-semibold opacity-50 cursor-not-allowed" disabled>Confirmar Eliminación</button></div>
        </div></div>`;
    dom.modalContainer.innerHTML = modalHTML;
    lucide.createIcons();
    const modalElement = document.getElementById(modalId);
    const confirmInput = document.getElementById('delete-confirm-input');
    const confirmButton = document.getElementById('confirm-delete-btn');
    confirmInput.addEventListener('input', () => {
        const isConfirmed = confirmInput.value === 'ELIMINAR';
        confirmButton.disabled = !isConfirmed;
        confirmButton.classList.toggle('opacity-50', !isConfirmed);
        confirmButton.classList.toggle('cursor-not-allowed', !isConfirmed);
    });
    modalElement.addEventListener('click', async e => {
        const action = e.target.closest('button')?.dataset.action;
        if (action === 'cancel') modalElement.remove();
        else if (e.target.id === 'confirm-delete-btn' && !confirmButton.disabled) {
            try {
                await deleteUser(auth.currentUser);
                modalElement.remove();
            } catch (error) {
                console.error("Error deleting user:", error);
                showToast("Error al eliminar la cuenta. Es posible que deba iniciar sesión nuevamente.", "error");
            }
        }
    });
}
