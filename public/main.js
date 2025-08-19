// --- 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE ---
// =================================================================================
// Importar funciones de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch, runTransaction, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxSXFD1WJkpS8aVfSDXyzQ0bsdPqWCgk0",
  authDomain: "barack2-0-f81a6.firebaseapp.com",
  projectId: "barack2-0-f81a6",
  storageBucket: "barack2-0-f81a6.appspot.com",
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
const COLLECTIONS = {
    PRODUCTOS: 'productos',
    SUBPRODUCTOS: 'subproductos',
    INSUMOS: 'insumos',
    CLIENTES: 'clientes',
    SECTORES: 'sectores',
    PROCESOS: 'procesos',
    ARBOLES: 'arboles',
    PROVEEDORES: 'proveedores',
    UNIDADES: 'unidades'
};

// =================================================================================
// --- 2. ESTADO GLOBAL Y CONFIGURACIÓN DE LA APP ---
// =================================================================================

// --- Configuración de Vistas ---
const viewConfig = {
    dashboard: { title: 'Dashboard', singular: 'Dashboard' },
    sinoptico: { title: 'Vista Sinóptica', singular: 'Vista Sinóptica' },
    flujograma: { title: 'Flujograma de Procesos', singular: 'Flujograma' },
    arboles: { title: 'Árboles de Producto', singular: 'Árbol' },
    profile: { title: 'Mi Perfil', singular: 'Mi Perfil' },
    productos: { 
        title: 'Productos', 
        singular: 'Producto', 
        dataKey: COLLECTIONS.PRODUCTOS, 
        columns: [ 
            { key: 'id', label: 'Código' }, 
            { key: 'descripcion', label: 'Descripción' }
        ],
        fields: [ 
            { key: 'id', label: 'Código Interno', type: 'text', required: true }, 
            { key: 'codigo_cliente', label: 'Código de Cliente', type: 'text' }, 
            { key: 'clienteId', label: 'Cliente', type: 'search-select', searchKey: COLLECTIONS.CLIENTES, required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true }, 
            { key: 'version', label: 'Versión', type: 'text' }, 
            { key: 'pzas_vh', label: 'Pzas/Vh', type: 'number' },
            { key: 'peso_gr', label: 'Peso (gr)', type: 'number' },
            { key: 'dimensiones_xyz', label: 'Dimensiones (X*Y*Z)', type: 'text' }
        ]
    },
    subproductos: { 
        title: 'Subproductos', 
        singular: 'Subproducto', 
        dataKey: COLLECTIONS.SUBPRODUCTOS, 
        columns: [ 
            { key: 'id', label: 'Código' }, 
            { key: 'descripcion', label: 'Descripción' }, 
        ],
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true }, 
            { key: 'peso_gr', label: 'Peso (gr)', type: 'number' }, 
            { key: 'tolerancia_peso_gr', label: 'Tolerancia Peso (gr)', type: 'number' }, 
            { key: 'dimensiones_xyz', label: 'Dimensiones (X*Y*Z)', type: 'text' }, 
            { key: 'tiempo_ciclo_seg', label: 'Tiempo de Ciclo (seg)', type: 'number' }, 
            { key: 'materiales_componentes', label: 'Materiales que lo componen', type: 'textarea' },
            { key: 'sourcing', label: 'Sourcing [LC/KD]', type: 'text' }
        ] 
    },
    insumos: { 
        title: 'Insumos', 
        singular: 'Insumo', 
        dataKey: COLLECTIONS.INSUMOS, 
        columns: [ 
            { key: 'id', label: 'Código' }, 
            { key: 'descripcion', label: 'Descripción' }, 
        ],
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true },
            { key: 'material', label: 'Material', type: 'text' }, 
            { key: 'proveedorId', label: 'Proveedor', type: 'search-select', searchKey: COLLECTIONS.PROVEEDORES, required: true },
            { key: 'unidadMedidaId', label: 'Unidad de Medida', type: 'search-select', searchKey: COLLECTIONS.UNIDADES, required: true },
            { key: 'costo', label: 'Costo por Unidad de Medida', type: 'number' },
            { key: 'stock_minimo', label: 'Stock Mínimo', type: 'number' }, 
            { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
            { key: 'sourcing', label: 'Sourcing [LC/KD]', type: 'text' }
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
        [COLLECTIONS.PRODUCTOS]: [], [COLLECTIONS.SUBPRODUCTOS]: [], [COLLECTIONS.INSUMOS]: [], [COLLECTIONS.CLIENTES]: [],
        [COLLECTIONS.SECTORES]: [], [COLLECTIONS.PROCESOS]: [], [COLLECTIONS.ARBOLES]: [],
        [COLLECTIONS.PROVEEDORES]: [], [COLLECTIONS.UNIDADES]: []
    },
    collectionsById: {
        [COLLECTIONS.PRODUCTOS]: new Map(),
        [COLLECTIONS.SUBPRODUCTOS]: new Map(),
        [COLLECTIONS.INSUMOS]: new Map(),
        [COLLECTIONS.CLIENTES]: new Map(),
        [COLLECTIONS.SECTORES]: new Map(),
        [COLLECTIONS.PROCESOS]: new Map(),
        [COLLECTIONS.PROVEEDORES]: new Map(),
        [COLLECTIONS.UNIDADES]: new Map()
    },
    unsubscribeListeners: [],
    sinopticoState: null,
    pagination: {
        lastVisibleDoc: null,
        firstVisibleDoc: null,
        currentPage: 1
    }
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

// =================================================================================
// --- 3. LÓGICA DE DATOS (FIRESTORE) ---
// =================================================================================

function startRealtimeListeners() {
    const collectionNames = Object.keys(appState.collections);
    collectionNames.forEach(name => {
        const q = query(collection(db, name));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = [];
            const dataMap = new Map();
            querySnapshot.forEach((doc) => {
                const item = { ...doc.data(), docId: doc.id };
                data.push(item);
                if(item.id) dataMap.set(item.id, item);
            });
            appState.collections[name] = data;
            if(appState.collectionsById[name]) appState.collectionsById[name] = dataMap;
            
            if (appState.currentView === 'dashboard') runDashboardLogic();
            if (appState.currentView === 'sinoptico' && appState.sinopticoState) initSinoptico();
        }, (error) => {
            console.error(`Error listening to ${name} collection:`, error);
            showToast(`Error al cargar datos de ${name}.`, 'error');
        });
        appState.unsubscribeListeners.push(unsubscribe);
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
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, data);
            showToast('Registro actualizado con éxito.', 'success');
        } else {
            const q = query(collection(db, collectionName), where("id", "==", data.id));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                showToast(`Error: El código "${data.id}" ya existe.`, 'error');
                return false;
            }
            await addDoc(collection(db, collectionName), data);
            showToast('Registro creado con éxito.', 'success');
        }
        return true;
    } catch (error) {
        console.error("Error guardando el documento: ", error);
        showToast("Error al guardar el registro.", 'error');
        return false;
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

// =================================================================================
// --- 4. LÓGICA PRINCIPAL DE LA APLICACIÓN (CORE) ---
// =================================================================================

function initializeAppListeners() {
    setupGlobalEventListeners();
}

function setupGlobalEventListeners() {
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        dom.mainContent.style.marginLeft = sidebar.classList.contains('collapsed') ? '80px' : '256px';
    });
    
    dom.searchInput.addEventListener('input', handleSearch);
    dom.addNewButton.addEventListener('click', () => openFormModal());
    document.getElementById('main-nav').addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) { e.preventDefault(); switchView(link.dataset.view); }
    });
    
    dom.viewContent.addEventListener('click', handleViewContentActions);
    dom.authContainer.addEventListener('submit', handleAuthForms);
    document.addEventListener('click', handleGlobalClick);
}

function switchView(viewName) {
    if (appState.currentViewCleanup) {
        appState.currentViewCleanup();
        appState.currentViewCleanup = null;
    }
    if (appState.currentView === 'sinoptico') appState.sinopticoState = null;
    appState.currentView = viewName;
    const config = viewConfig[viewName];
    dom.viewTitle.textContent = config.title;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('bg-slate-700', link.dataset.view === viewName);
        link.classList.toggle('text-white', link.dataset.view === viewName);
    });
    
    dom.viewContent.innerHTML = '';
    dom.headerActions.style.display = 'none';
    dom.searchInput.style.display = 'none';
    
    if (viewName === 'dashboard') runDashboardLogic();
    else if (viewName === 'sinoptico') runSinopticoLogic();
    else if (viewName === 'flujograma') runFlujogramaLogic();
    else if (viewName === 'arboles') renderArbolesInitialView();
    else if (viewName === 'profile') runProfileLogic();
    else if (config?.dataKey) {
        dom.headerActions.style.display = 'flex';
        dom.searchInput.style.display = 'block';
        dom.addButtonText.textContent = `Agregar ${config.singular}`;
        runTableLogic();
    }
    dom.searchInput.value = '';
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
    const actions = {
        'details': () => openDetailsModal(appState.currentData.find(d => d.id == id)),
        'edit': () => openFormModal(appState.currentData.find(d => d.id == id)),
        'delete': () => deleteItem(docId),
        'export-pdf': () => handleExport('pdf'),
        'export-excel': () => handleExport('excel'),
        'open-sector-modal': () => openSectorProcessesModal(button.dataset.sectorId),
        'open-product-search-modal': openProductSearchModal,
        'volver-a-busqueda': () => {
            if (appState.arbolActivo && appState.arbolActivo.docId) {
                updateDoc(doc(db, COLLECTIONS.ARBOLES, appState.arbolActivo.docId), { lock: null });
            }
            appState.arbolActivo = null;
            renderArbolesInitialView();
        },
        'guardar-arbol': () => guardarEstructura(button),
        'add-node': () => openComponentSearchModal(button.dataset.nodeId, button.dataset.childType),
        'delete-node': () => eliminarNodo(button.dataset.nodeId),
        'delete-account': handleDeleteAccount,
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
    
    if(profileLink) { e.preventDefault(); document.getElementById('user-dropdown')?.classList.add('hidden'); switchView(profileLink.dataset.view); return; }
    
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuButton && !userMenuButton.contains(target) && userDropdown && !userDropdown.contains(target)) {
        userDropdown.classList.add('hidden');
    }
    
    if (!target.closest('#export-menu-container')) document.getElementById('export-dropdown')?.classList.add('hidden'); 
    if (!target.closest('#type-filter-btn')) document.getElementById('type-filter-dropdown')?.classList.add('hidden'); 
    if (!target.closest('#add-client-filter-btn')) document.getElementById('add-client-filter-dropdown')?.classList.add('hidden');
    
    if(target.closest('#user-menu-button')) { userDropdown?.classList.toggle('hidden'); }
    if(target.closest('#logout-button')) { e.preventDefault(); logOutUser(); }
}

// =================================================================================
// --- 6. LÓGICA DE VISTAS (DASHBOARD, TABLAS, ÁRBOLES, ETC.) ---
// =================================================================================

async function runTableLogic(direction = 'first') {
    const config = viewConfig[appState.currentView];
    if (!config || !config.dataKey) return;
    const collectionRef = collection(db, config.dataKey);
    const PAGE_SIZE = 10;
    let q;
    const baseQuery = query(collectionRef, orderBy("id"));
    if (direction === 'next' && appState.pagination.lastVisibleDoc) {
        q = query(baseQuery, startAfter(appState.pagination.lastVisibleDoc), limit(PAGE_SIZE));
    } else if (direction === 'prev' && appState.pagination.firstVisibleDoc) {
        const prevQuery = query(collectionRef, orderBy("id", "desc"), startAfter(appState.pagination.firstVisibleDoc), limit(PAGE_SIZE));
        
        try {
            const documentSnapshots = await getDocs(prevQuery);
            let data = documentSnapshots.docs.map(doc => ({ ...doc.data(), docId: doc.id })).reverse(); 
            appState.pagination.lastVisibleDoc = documentSnapshots.docs[0];
            appState.pagination.firstVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            
            if (appState.pagination.currentPage > 1) {
                appState.pagination.currentPage--;
            }
            
            appState.currentData = data;
            renderTable(data, config);
        } catch (error) {
            console.error("Error fetching previous page:", error);
            showToast("Error al cargar la página anterior.", "error");
        }
        return;
    } else {
        q = query(baseQuery, limit(PAGE_SIZE));
        appState.pagination.currentPage = 1;
    }
    try {
        const documentSnapshots = await getDocs(q);
        if (documentSnapshots.empty) {
            if (direction !== 'first') {
                showToast('No hay más resultados.', 'info');
            } else {
                appState.currentData = [];
                renderTable([], config);
            }
            const nextButton = dom.viewContent.querySelector('button[data-action="next-page"]');
            if (nextButton) nextButton.disabled = true;
            return;
        }
        let data = documentSnapshots.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
        appState.pagination.lastVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        appState.pagination.firstVisibleDoc = documentSnapshots.docs[0];
        if (direction === 'next') {
            appState.pagination.currentPage++;
        }
        
        appState.currentData = data;
        renderTable(data, config);
        const checkNextQ = query(baseQuery, startAfter(appState.pagination.lastVisibleDoc), limit(1));
        const nextSnap = await getDocs(checkNextQ);
        const nextButton = dom.viewContent.querySelector('button[data-action="next-page"]');
        if (nextButton) nextButton.disabled = nextSnap.empty;
    } catch (error) {
        console.error("Error fetching paginated data:", error);
        showToast("Error al cargar los datos. Puede que necesite crear un índice en Firestore.", "error");
    }
}

function renderTable(data, config) {
    let tableHTML = `<div class="bg-white p-4 rounded-xl shadow-lg animate-fade-in-up">
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
                <button data-action="edit" data-id="${item.id}" data-doc-id="${item.docId}" class="text-gray-500 hover:text-green-600" title="Editar"><i data-lucide="edit" class="h-5 w-5 pointer-events-none"></i></button>
                <button data-action="delete" data-id="${item.id}" data-doc-id="${item.docId}" class="text-gray-500 hover:text-red-600" title="Eliminar"><i data-lucide="trash-2" class="h-5 w-5 pointer-events-none"></i></button>
            </td></tr>`;
        });
    }
    tableHTML += `</tbody></table></div>
    <div class="flex justify-between items-center pt-4">
        <button data-action="prev-page" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" ${appState.pagination.currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
        <span class="text-sm font-semibold text-gray-600">Página ${appState.pagination.currentPage}</span>
        <button data-action="next-page" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-semibold">Siguiente</button>
    </div>
    </div>`;
    dom.viewContent.innerHTML = tableHTML;
    lucide.createIcons();
}

async function handleSearch() {
    const config = viewConfig[appState.currentView];
    const searchTerm = dom.searchInput.value.trim().toLowerCase();
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
        const queryById = query(collectionRef, where('id', '>=', searchTerm), where('id', '<=', searchTerm + '\uf8ff'));
        const queryByDesc = query(collectionRef, where('descripcion', '>=', searchTerm), where('descripcion', '<=', searchTerm + '\uf8ff'));
        
        const [idSnapshots, descSnapshots] = await Promise.all([
            getDocs(queryById),
            getDocs(queryByDesc)
        ]);
        const resultsMap = new Map();
        idSnapshots.forEach(doc => resultsMap.set(doc.id, { ...doc.data(), docId: doc.id }));
        descSnapshots.forEach(doc => resultsMap.set(doc.id, { ...doc.data(), docId: doc.id }));
        
        const combinedResults = Array.from(resultsMap.values());
        appState.currentData = combinedResults;
        renderTable(combinedResults, config);
        const paginationControls = dom.viewContent.querySelector('.flex.justify-between.items-center.pt-4');
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
    } catch (error) {
        console.error('Error durante la búsqueda:', error);
        showToast('Error al realizar la búsqueda.', 'error');
    }
}

// CAMBIO: La función de exportación ahora tiene un título estilizado y mejor posicionado para el PDF.
function handleExport(type) {
    const config = viewConfig[appState.currentView];
    const data = appState.currentData;
    const title = config.title;

    const headers = config.fields.map(field => field.label);
    const body = data.map(item => {
        return config.fields.map(field => {
            let value = item[field.key] || '';
            if (field.type === 'search-select' && value) {
                const sourceCollection = appState.collections[field.searchKey];
                const relatedItem = sourceCollection.find(d => d.id === value);
                return relatedItem ? relatedItem.descripcion : value;
            }
            return value;
        });
    });

    if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        
        // Dibujar el título personalizado
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235); // Azul similar a text-blue-600
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 20);

        const tableStartY = 30; // Posición inicial de la tabla para que no se superponga

        const columnStyles = {};
        if (config.dataKey === COLLECTIONS.INSUMOS) {
            Object.assign(columnStyles, {
                0: { cellWidth: 30 }, // Código
                1: { cellWidth: 50 }, // Descripción
                2: { cellWidth: 30 }, // Material
                3: { cellWidth: 30 }, // Proveedor
                4: { cellWidth: 25 }, // Unidad de Medida
                5: { cellWidth: 20 }, // Costo
                6: { cellWidth: 20 }, // Stock Mínimo
                7: { cellWidth: 'auto' }, // Observaciones
                8: { cellWidth: 20 }  // Sourcing
            });
        }

        doc.autoTable({
            head: [headers],
            body: body,
            startY: tableStartY,
            styles: { fontSize: 8 },
            headStyles: { fillColor: '#44546A' },
            columnStyles: columnStyles
        });
        doc.save(`${config.dataKey}_export_completo.pdf`);

    } else if (type === 'excel') {
        const dataToExport = data.map(item => {
            let row = {};
            config.fields.forEach(field => {
                let value = item[field.key] || '';
                if (field.type === 'search-select' && value) {
                    const sourceCollection = appState.collections[field.searchKey];
                    const relatedItem = sourceCollection.find(d => d.id === value);
                    value = relatedItem ? relatedItem.descripcion : value;
                }
                row[field.label] = value;
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        XLSX.writeFile(wb, `${config.dataKey}_export_completo.xlsx`);
    }
    showToast(`Exportación completa a ${type.toUpperCase()} iniciada.`, 'success');
}

async function openFormModal(item = null) {
    const config = viewConfig[appState.currentView];
    const isEditing = item !== null;
    if (isEditing) {
        const docRef = doc(db, config.dataKey, item.docId);
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw "¡El documento ya no existe!";
                }
                const data = docSnap.data();
                const lock = data.lock;
                const isLockExpired = lock && (Date.now() - lock.timestamp > LOCK_TIMEOUT_MS);
                if (lock && lock.by !== appState.currentUser.uid && !isLockExpired) {
                    const lockerName = lock.name || 'otro usuario';
                    throw new Error(`Este item está siendo editado por ${lockerName}.`);
                }
                transaction.update(docRef, { 
                    "lock": {
                        by: appState.currentUser.uid,
                        name: appState.currentUser.name,
                        timestamp: Date.now()
                    } 
                });
            });
            
        } catch (error) {
            console.error("Error al intentar bloquear el documento:", error);
            showToast(error.message || "No se pudo bloquear el item para editar.", 'error');
            return;
        }
    }
    const modalId = `form-modal-${Date.now()}`;
    
    let fieldsHTML = '';
    config.fields.forEach(field => {
        const isReadonly = isEditing && field.key === 'id';
        let inputHTML = '';
        const commonClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
        const readonlyClasses = isReadonly ? 'bg-gray-100 cursor-not-allowed' : '';
        const value = item ? (item[field.key] || '') : '';
        
        if (field.type === 'search-select') {
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
            inputHTML = `<textarea id="${field.key}" name="${field.key}" rows="3" class="${commonClasses}" ${field.required ? 'required' : ''}>${value}</textarea>`;
        } else {
            inputHTML = `<input type="${field.type}" id="${field.key}" name="${field.key}" value="${value}" class="${commonClasses} ${readonlyClasses}" ${field.required ? 'required' : ''} ${isReadonly ? 'readonly' : ''}>`;
        }
        
        fieldsHTML += `<div class="${field.type === 'textarea' || field.type === 'search-select' || field.key === 'id' ? 'md:col-span-2' : ''}">
            <label for="${field.key}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
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
            if(isEditing) updateDoc(doc(db, config.dataKey, item.docId), { lock: null });
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
    
    if (docId) newItem.lock = null;
    if (!docId) {
        newItem.createdAt = new Date();
    }
    const success = await saveDocument(config.dataKey, newItem, docId);
    
    if (success) {
        modalElement.remove();
        runTableLogic('first'); 
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
        fieldsHTML += `<div class="${field.type === 'textarea' || field.key === 'id' ? 'md:col-span-2' : ''}"><label class="block text-sm font-medium text-gray-500">${field.label}</label><div class="mt-1 text-sm text-gray-900 bg-gray-100 p-2 rounded-md border min-h-[38px]">${value}</div></div>`;
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

function runDashboardLogic() {
    const { productos, insumos, clientes } = appState.collections;
    
    const productsByClient = clientes.map(client => {
        const count = productos.filter(p => p.clienteId === client.id).length;
        return { clientName: client.descripcion, productCount: count };
    }).filter(c => c.productCount > 0);
    const maxProducts = Math.max(...productsByClient.map(c => c.productCount), 0);
    
    const recentActivity = [...productos, ...insumos]
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 5);
    let content = `<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600"><i data-lucide="package" class="h-8 w-8"></i></div>
            <div><p class="text-3xl font-bold">${productos.length}</p><p class="text-sm font-semibold text-gray-600">Productos Totales</p></div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div class="p-3 rounded-full bg-green-100 text-green-600"><i data-lucide="beaker" class="h-8 w-8"></i></div>
            <div><p class="text-3xl font-bold">${insumos.length}</p><p class="text-sm font-semibold text-gray-600">Insumos Registrados</p></div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div class="p-3 rounded-full bg-indigo-100 text-indigo-600"><i data-lucide="users" class="h-8 w-8"></i></div>
            <div><p class="text-3xl font-bold">${clientes.length}</p><p class="text-sm font-semibold text-gray-600">Clientes Activos</p></div>
        </div>
        <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Productos por Cliente</h3>
            <div class="mt-6 flex items-end space-x-4 h-64 border-l border-b border-gray-200 pl-4 pb-1">
                ${productsByClient.length > 0 ? productsByClient.map(item => `
                    <div class="flex-1 flex flex-col items-center justify-end">
                        <div class="text-sm font-bold text-gray-700">${item.productCount}</div>
                        <div class="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-md" style="height: ${maxProducts > 0 ? (item.productCount / maxProducts) * 90 : 0}%;"></div>
                        <div class="text-xs text-center font-medium text-gray-500 mt-2 truncate w-full">${item.clientName}</div>
                    </div>
                `).join('') : `<div class="w-full h-full flex items-center justify-center text-gray-500">No hay datos de productos para mostrar.</div>`}
            </div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h3>
            <ul class="space-y-4">
                ${recentActivity.length > 0 ? recentActivity.map(item => `
                    <li class="flex items-center space-x-3">
                        <div class="p-2 rounded-full bg-gray-100 text-gray-600">
                            <i data-lucide="${'clienteId' in item ? 'package' : 'beaker'}" class="h-5 w-5"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-sm">${item.descripcion}</p>
                            <p class="text-xs text-gray-500">Nuevo item agregado</p>
                        </div>
                    </li>
                `).join('') : `<li class="text-center text-gray-500 py-8">No hay actividad reciente.</li>`}
            </ul>
        </div>
    </div>`;
    dom.viewContent.innerHTML = content;
    lucide.createIcons();
}

async function handleProductSelect(productId) {
    const producto = appState.collections[COLLECTIONS.PRODUCTOS].find(p => p.id === productId);
    if (!producto) return;
    try {
        const q = query(collection(db, COLLECTIONS.ARBOLES), where("productoPrincipalId", "==", productId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            const nuevoArbol = {
                nombre: `Árbol de ${producto.descripcion}`,
                productoPrincipalId: producto.id,
                clienteId: producto.clienteId,
                lastUpdated: new Date(),
                estructura: [crearComponente('producto', producto)],
                lock: { by: appState.currentUser.uid, name: appState.currentUser.name, timestamp: Date.now() }
            };
            const docRef = await addDoc(collection(db, COLLECTIONS.ARBOLES), nuevoArbol);
            appState.arbolActivo = { ...nuevoArbol, docId: docRef.id };
            showToast(`Nuevo árbol creado y bloqueado para ti.`, 'success');
            renderArbolDetalle();
            return;
        }
        const arbolDocRef = querySnapshot.docs[0].ref;
        await runTransaction(db, async (transaction) => {
            const arbolDocSnap = await transaction.get(arbolDocRef);
            if (!arbolDocSnap.exists()) throw new Error("Este árbol ya no existe.");
            
            const data = arbolDocSnap.data();
            const isLockExpired = data.lock && (Date.now() - data.lock.timestamp > LOCK_TIMEOUT_MS);
            if (data.lock && data.lock.by !== appState.currentUser.uid && !isLockExpired) {
                throw new Error(`Este árbol está siendo editado por ${data.lock.name}.`);
            }
            
            transaction.update(arbolDocRef, { 
                lock: { by: appState.currentUser.uid, name: appState.currentUser.name, timestamp: Date.now() } 
            });
        });
        const finalDocSnap = await getDoc(arbolDocRef);
        appState.arbolActivo = { ...finalDocSnap.data(), docId: finalDocSnap.id };
        showToast(`Árbol cargado y bloqueado para tu edición.`, 'info');
        renderArbolDetalle();
    } catch (error) {
        console.error("Error al seleccionar o bloquear el árbol:", error);
        showToast(error.message, 'error');
        renderArbolesInitialView();
    }
}

async function guardarEstructura(button) {
    if (!appState.arbolActivo || !button) return;
    const originalText = button.innerHTML;
    button.innerHTML = `<i data-lucide="loader" class="h-5 w-5 animate-spin"></i><span>Guardando...</span>`;
    lucide.createIcons();
    button.disabled = true;
    try {
        const arbolRef = doc(db, COLLECTIONS.ARBOLES, appState.arbolActivo.docId);
        await updateDoc(arbolRef, {
            estructura: appState.arbolActivo.estructura,
            lastUpdated: new Date(),
            lock: null
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
            appState.arbolActivo = null; // Unlock locally
            renderArbolesInitialView(); // Go back to selection
        }, 2000);
    } catch (error) {
        console.error("Error guardando el árbol:", error);
        showToast("Error al guardar la estructura del árbol.", "error");
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

onAuthStateChanged(auth, (user) => {
    dom.loadingOverlay.style.display = 'none';
    if (user) {
        if (user.emailVerified) {
            const isNewLogin = !appState.currentUser;
            appState.currentUser = {
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatarUrl: user.photoURL || `https://placehold.co/40x40/1e40af/ffffff?text=${(user.displayName || user.email).charAt(0).toUpperCase()}`
            };
            updateAuthView(true);
            if (isNewLogin) {
                showToast(`¡Bienvenido de nuevo, ${appState.currentUser.name}!`, 'success');
            }
        } else {
            showToast('Por favor, verifica tu correo electrónico para continuar.', 'info');
            updateAuthView(false);
            showAuthScreen('verify-email');
        }
    } else {
        const wasLoggedIn = !!appState.currentUser;
        appState.currentUser = null;
        updateAuthView(false);
        if (wasLoggedIn) {
            showToast(`Sesión cerrada.`, 'info');
        }
    }
});

function updateAuthView(isLoggedIn) {
    if (isLoggedIn) {
        dom.authContainer.classList.add('hidden');
        dom.appView.classList.remove('hidden');
        renderUserMenu();
        if (appState.unsubscribeListeners.length === 0) {
             startRealtimeListeners();
        }
        switchView('dashboard');
    } else {
        stopRealtimeListeners();
        dom.authContainer.classList.remove('hidden');
        dom.appView.classList.add('hidden');
        appState.currentUser = null;
        showAuthScreen('login');
    }
}

function renderUserMenu() {
    if (appState.currentUser) {
        dom.userMenuContainer.innerHTML = `
            <button id="user-menu-button" class="flex items-center space-x-2">
                <img src="${appState.currentUser.avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full border-2 border-slate-300">
                <span class="font-semibold text-slate-700 hidden md:inline">${appState.currentUser.name}</span>
                <i data-lucide="chevron-down" class="text-slate-600"></i>
            </button>
            <div id="user-dropdown" class="absolute z-20 right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl hidden dropdown-menu">
                <div class="p-4 border-b"><p class="font-bold text-slate-800">${appState.currentUser.name}</p><p class="text-sm text-slate-500">${appState.currentUser.email}</p></div>
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

async function handleAuthForms(e) {
    e.preventDefault();
    const formId = e.target.id;
    const email = e.target.querySelector('input[type="email"]').value;
    const passwordInput = e.target.querySelector('input[type="password"]');
    const password = passwordInput ? passwordInput.value : null;
    try {
        if (formId === 'login-form') {
            await signInWithEmailAndPassword(auth, email, password);
        } 
        else if (formId === 'register-form') {
            const name = e.target.querySelector('#register-name').value;
            if (!email.toLowerCase().endsWith('@barackmercosul.com')) {
                showToast('Dominio no autorizado. Use un correo de @barackmercosul.com.', 'error');
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await sendEmailVerification(userCredential.user);
            showToast('Registro exitoso. Se ha enviado un correo de verificación.', 'info');
            showAuthScreen('verify-email');
        }
        else if (formId === 'reset-form') {
            await sendPasswordResetEmail(auth, email);
            showToast(`Si la cuenta ${email} existe, se ha enviado un enlace.`, 'info');
            showAuthScreen('login');
        }
    } catch (error) {
        console.error("Authentication error:", error);
        let friendlyMessage = "Ocurrió un error inesperado.";
        switch (error.code) {
            case 'auth/invalid-login-credentials':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                friendlyMessage = 'Credenciales incorrectas. Por favor, verifique su email y contraseña.';
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

function renderArbolesInitialView() {
    dom.viewContent.innerHTML = `<div class="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-md p-10 text-center animate-fade-in-up"><i data-lucide="git-merge" class="h-24 w-24 text-gray-300 mb-6"></i><h3 class="text-2xl font-bold">Gestor de Árboles de Producto</h3><p class="text-gray-500 mt-2 mb-8 max-w-lg">Busque y seleccione el producto principal para cargar o crear su estructura de componentes.</p><button data-action="open-product-search-modal" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"><i data-lucide="search" class="inline-block mr-2 -mt-1"></i>Seleccionar Producto</button></div>`;
    lucide.createIcons();
}

function renderArbolDetalle(highlightNodeId = null) {
    const cliente = appState.collections[COLLECTIONS.CLIENTES].find(c => c.id === appState.arbolActivo.clienteId);
    let treeContentHTML = `<div id="tree-render-area" class="tree p-4 rounded-lg bg-gray-50 min-h-[200px]"></div>`;
    
    if(appState.arbolActivo.estructura[0]?.children.length === 0) {
        treeContentHTML += `<div class="text-center p-6 bg-blue-50 border-t border-blue-200 rounded-b-lg">
            <i data-lucide="mouse-pointer-click" class="h-10 w-10 mx-auto text-blue-400 mb-3"></i>
            <h4 class="font-semibold text-blue-800">¡Tu árbol está listo para crecer!</h4>
            <p class="text-sm text-blue-700">Comienza agregando componentes usando los botones <span class="font-mono bg-green-100 text-green-800 px-1 rounded">+ subproducto</span> o <span class="font-mono bg-green-100 text-green-800 px-1 rounded">+ insumo</span>.</p>
        </div>`;
    }
    dom.viewContent.innerHTML = `<div class="bg-white rounded-xl shadow-md p-6 animate-fade-in-up"><div class="flex justify-between items-start mb-4 pb-4 border-b"><div><h3 class="text-2xl font-bold">${appState.arbolActivo.nombre}</h3><p class="text-sm text-gray-500">Cliente: <span class="font-semibold">${cliente?.descripcion || 'N/A'}</span></p></div><div class="flex space-x-2"><button data-action="volver-a-busqueda" class="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-600">Buscar Otro</button><button data-action="guardar-arbol" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center justify-center w-28 transition-all duration-300">Guardar</button></div></div>${treeContentHTML}</div>`;
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
    if (!item) return ''; // Si el item fue borrado, no lo dibujamos.
    const addableChildren = { producto: ['subproducto', 'insumo'], subproducto: ['subproducto', 'insumo'], insumo: [] };
    let addButtons = (addableChildren[nodo.tipo] || []).map(tipo => `<button data-action="add-node" data-node-id="${nodo.id}" data-child-type="${tipo}" class="px-2 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-xs font-semibold" title="Agregar ${tipo}">+ ${tipo}</button>`).join(' ');
    const isDraggable = nodo.tipo !== 'producto';
    
    return `<li data-node-id="${nodo.id}">
                <div class="node-content ${isDraggable ? '' : 'cursor-default'}" data-type="${nodo.tipo}">
                    <div class="flex items-center gap-2">
                        <i data-lucide="${nodo.icon}" class="h-5 w-5 text-gray-600"></i>
                        <span class="font-semibold">${item.descripcion}</span>
                        <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">${nodo.tipo}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${addButtons}
                        ${nodo.tipo !== 'producto' ? `<button data-action="delete-node" data-node-id="${nodo.id}" class="text-red-500 hover:text-red-700" title="Eliminar"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>` : ''}
                    </div>
                </div>
                ${(nodo.children && nodo.children.length > 0) ? `<ul class="node-children-list">${nodo.children.map(renderNodo).join('')}</ul>` : ''}
            </li>`;
}

function initSortable(treeArea) {
    const lists = treeArea.querySelectorAll('ul.node-children-list');
    lists.forEach(list => {
        new Sortable(list, {
            group: 'nested',
            animation: 150,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: handleDropEvent
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
    const dataKey = tipoHijo === 'subproducto' ? COLLECTIONS.SUBPRODUCTOS : COLLECTIONS.INSUMOS;
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
        icon: { producto: 'package', subproducto: 'box', insumo: 'beaker' }[tipo], 
        children: [], 
        quantity: null
    };
}

function handleComponentSelect(padreId, itemId, itemType) {
    const item = appState.collections[itemType === 'subproducto' ? COLLECTIONS.SUBPRODUCTOS : COLLECTIONS.INSUMOS].find(i => i.id === itemId);
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
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up">
                <div class="flex flex-col md:flex-row gap-6">
                    <!-- Columna de Producto -->
                    <div class="flex-1">
                        <h3 class="text-sm font-bold uppercase text-blue-600 tracking-wider">Producto Principal del Árbol</h3>
                        <p class="text-2xl font-bold text-slate-800 mt-1">${producto.descripcion}</p>
                        <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span>Código: <span class="font-semibold text-slate-700">${producto.id}</span></span>
                            <span class="border-l pl-4">Versión: <span class="font-semibold text-slate-700">${producto.version || 'N/A'}</span></span>
                        </div>
                    </div>
                    <!-- Columna de Cliente -->
                    <div class="flex-1 md:border-l md:pl-6 border-slate-200">
                         <h3 class="text-sm font-bold uppercase text-indigo-600 tracking-wider">Cliente</h3>
                         <p class="text-2xl font-bold text-slate-800 mt-1">${cliente.descripcion}</p>
                         <p class="text-sm text-slate-500 mt-2">Código: <span class="font-semibold text-slate-700">${cliente.id}</span></p>
                    </div>
                </div>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-lg text-center animate-fade-in">
                <p class="text-slate-500 flex items-center justify-center">
                    <i data-lucide="info" class="inline-block mr-3 h-5 w-5 text-slate-400"></i>
                    <span>La información del producto y cliente aparecerá aquí cuando selecciones un elemento del árbol.</span>
                </p>
            </div>`;
    }
    lucide.createIcons();
}

function runSinopticoLogic() {
    dom.viewContent.innerHTML = `<div class="animate-fade-in-up">${renderSinopticoLayout()}</div>`;
    lucide.createIcons();
    initSinoptico();
}

function runFlujogramaLogic() {
    dom.viewContent.innerHTML = `<div class="bg-white rounded-xl shadow-md p-10 text-center animate-fade-in-up">
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
                                <label class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer"><input type="checkbox" data-type="subproducto" class="type-filter-cb" checked><span>Subproducto</span></label>
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
            activeFilters: { clients: new Set(), types: new Set(['producto', 'subproducto', 'insumo']) },
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
        if (appState.sinopticoState.activeFilters.clients.size === 0 && !searchTerm) {
            treeContainer.innerHTML = `<div class="text-center text-slate-500 p-12 bg-slate-50 rounded-lg">
                <i data-lucide="filter" class="w-16 h-16 mx-auto text-slate-300 mb-4"></i>
                <h3 class="text-xl font-bold text-slate-700">Comience a Explorar</h3>
                <p class="mt-2">Para cargar un árbol de producto, seleccione un cliente utilizando el botón <i data-lucide="plus" class="inline-block w-4 h-4 -mt-1"></i> de arriba.</p>
            </div>`;
            lucide.createIcons();
            return;
        }
        const treesToRender = appState.collections[COLLECTIONS.ARBOLES].filter(arbol => {
            if (appState.sinopticoState.activeFilters.clients.size > 0 && !appState.sinopticoState.activeFilters.clients.has(arbol.clienteId)) return false;
            return arbol.estructura.some(rootNode => itemOrDescendantsMatch(rootNode, searchTerm));
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
        const iconMap = { producto: 'package', subproducto: 'box', insumo: 'beaker' };
        
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

        // Find the active tree based on the selected component
        if (componentId) {
            for (const arbol of appState.collections[COLLECTIONS.ARBOLES]) {
                targetNode = findNode(componentId, arbol.estructura);
                if (targetNode) {
                    activeTree = arbol;
                    appState.sinopticoState.activeTreeDocId = arbol.docId;
                    parentNode = findParentNode(componentId, arbol.estructura);
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
    
        const iconMap = { producto: 'package', subproducto: 'box', insumo: 'beaker' };
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
            const quantityLabel = `Cantidad Requerida ${unidadLabel}`;
            
            const quantityValue = targetNode.quantity;
            const isQuantitySet = quantityValue !== null && quantityValue !== undefined;
            const quantityDisplay = isQuantitySet ? quantityValue : '<span class="text-red-500 italic font-normal">Sin asignar</span>';
            const quantityInputDefault = isQuantitySet ? quantityValue : '';

            content += `<div class="py-3 border-b border-slate-100" id="quantity-section" data-node-id="${targetNode.id}" data-current-quantity="${quantityValue}">
                <div id="quantity-display-mode">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-slate-500">${quantityLabel}</p>
                            <p class="font-semibold text-lg">${quantityDisplay}</p>
                        </div>
                        <button data-action="edit-quantity" class="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100"><i data-lucide="pencil" class="h-5 w-5 pointer-events-none"></i></button>
                    </div>
                </div>
                <div id="quantity-edit-mode" class="hidden">
                    <label for="quantity-input-synoptic" class="block text-sm text-slate-500 mb-2">${quantityLabel}</label>
                    <div class="flex items-center gap-2">
                        <input type="number" id="quantity-input-synoptic" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" value="${quantityInputDefault}" step="any" min="0" placeholder="Ingresar consumo...">
                        <button data-action="cancel-edit-quantity" class="p-2 text-slate-500 hover:bg-slate-200 rounded-md"><i data-lucide="x" class="h-5 w-5 pointer-events-none"></i></button>
                        <button data-action="save-quantity" class="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-12"><i data-lucide="check" class="h-5 w-5 pointer-events-none"></i></button>
                    </div>
                </div>
            </div>`;
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
            case 'subproducto':
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
    
    async function exportProductTreePdf(productNode) {
        showToast('Iniciando exportación a PDF...', 'info', 1000);
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        const PAGE_MARGIN = 15;
        const PAGE_WIDTH = doc.internal.pageSize.width;
        const PAGE_HEIGHT = doc.internal.pageSize.height;
        const FONT_SIZES = { H1: 16, H2: 10, BODY: 9, HEADER_TABLE: 8, FOOTER: 8 };
        const ROW_HEIGHT = 8;
        const LINE_COLOR = '#CCCCCC';
        const HEADER_BG_COLOR = '#44546A';
        const TEXT_COLOR = '#2d3748';
        const TEXT_COLOR_LIGHT = '#2d3748';
        const TITLE_COLOR = '#2563eb';
        const TYPE_COLORS = {
            producto: '#3b82f6', subproducto: '#16a34a', insumo: '#f97316'
        };
        
        let cursorY = 0;
        
        const flattenedData = [];
        function flattenTree(node, level, parentLineage = []) {
            const item = appState.collectionsById[node.tipo + 's']?.get(node.refId);
            if (!item) return;

            flattenedData.push({ node, item, level, lineage: parentLineage });

            if (node.children && node.children.length > 0) {
                node.children.forEach((child, index) => {
                    const isLast = index === node.children.length - 1;
                    flattenTree(child, level + 1, [...parentLineage, !isLast]);
                });
            }
        }
        flattenTree(productNode, 0);

        async function drawPageHeader() {
            const productItem = appState.collectionsById[COLLECTIONS.PRODUCTOS].get(productNode.refId);
            const clientItem = appState.collectionsById[COLLECTIONS.CLIENTES].get(productItem.clienteId);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(FONT_SIZES.H1);
            doc.setTextColor(TITLE_COLOR);
            doc.text('Sinóptico de Producto', PAGE_WIDTH - PAGE_MARGIN, 18, { align: 'right' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(FONT_SIZES.H2);
            doc.setTextColor(TEXT_COLOR_LIGHT);
            doc.text(`Producto: ${productItem.descripcion} (${productItem.id})`, PAGE_WIDTH - PAGE_MARGIN, 25, { align: 'right' });
            doc.text(`Cliente: ${clientItem?.descripcion || 'N/A'}`, PAGE_WIDTH - PAGE_MARGIN, 30, { align: 'right' });

            cursorY = 40;
        }

        function drawTableHeaders() {
            doc.setFillColor(HEADER_BG_COLOR);
            doc.rect(PAGE_MARGIN, cursorY, PAGE_WIDTH - (PAGE_MARGIN * 2), ROW_HEIGHT, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(FONT_SIZES.HEADER_TABLE);
            doc.setTextColor('#FFFFFF');
            
            const headers = ['Componente', 'Tipo', 'Cantidad', 'Código'];
            const colX = [PAGE_MARGIN + 2, 110, 135, 160];
            headers.forEach((header, i) => {
                doc.text(header, colX[i], cursorY + ROW_HEIGHT / 2, { baseline: 'middle' });
            });
            
            cursorY += ROW_HEIGHT;
        }

        function drawRow(data) {
            const { item, node, level, lineage } = data;
            const TEXT_Y = cursorY + ROW_HEIGHT / 2 + 1;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(FONT_SIZES.BODY);
            doc.setTextColor(TEXT_COLOR);
            
            if (node.tipo === 'producto') {
                doc.setFont('helvetica', 'bold');
            }

            const INDENT_WIDTH = 5;
            const treeX = PAGE_MARGIN + (level * INDENT_WIDTH);
            doc.setDrawColor(LINE_COLOR);
            
            lineage.forEach((continues, i) => {
                if (continues) {
                    const parentX = PAGE_MARGIN + (i * INDENT_WIDTH);
                    doc.line(parentX, cursorY, parentX, cursorY + ROW_HEIGHT);
                }
            });
            
            if (level > 0) {
                const isLast = !lineage[level];
                doc.line(treeX - INDENT_WIDTH, cursorY + (isLast ? 0 : ROW_HEIGHT), treeX - INDENT_WIDTH, cursorY + ROW_HEIGHT/2);
                doc.line(treeX - INDENT_WIDTH, cursorY + ROW_HEIGHT/2, treeX, cursorY + ROW_HEIGHT/2);
            }
            
            const circleX = treeX - 1.5;
            const circleY = cursorY + ROW_HEIGHT / 2;
            doc.setFillColor(TYPE_COLORS[node.tipo] || '#000000');
            doc.circle(circleX, circleY, 1.2, 'F');

            const unitData = appState.collectionsById[COLLECTIONS.UNIDADES].get(item.unidadMedidaId);
            const unit = unitData ? unitData.id : 'Un';
            
            const quantityValue = node.quantity;
            const isQuantitySet = quantityValue !== null && quantityValue !== undefined;
            const quantityText = isQuantitySet ? `${quantityValue} ${unit}` : '---';

            const descriptionX = treeX + 2;
            const descriptionMaxWidth = 110 - descriptionX;
            doc.text(item.descripcion, descriptionX, TEXT_Y, { maxWidth: descriptionMaxWidth });

            doc.text(node.tipo.charAt(0).toUpperCase() + node.tipo.slice(1), 110, TEXT_Y);
            doc.text(node.tipo !== 'producto' ? quantityText : '', 135, TEXT_Y);
            doc.text(item.id, 160, TEXT_Y);
        }

        function drawPageFooter(pageNumber, pageCount) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(FONT_SIZES.FOOTER);
            doc.setTextColor(TEXT_COLOR_LIGHT);
            const date = new Date().toLocaleDateString('es-AR');
            doc.text(`Generado el ${date}`, PAGE_MARGIN, PAGE_HEIGHT - 10);
            doc.text(`Página ${pageNumber} de ${pageCount}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
        }

        await drawPageHeader();
        drawTableHeaders();

        for (const data of flattenedData) {
            if (cursorY + ROW_HEIGHT > PAGE_HEIGHT - PAGE_MARGIN) {
                doc.addPage();
                await drawPageHeader();
                drawTableHeaders();
            }
            drawRow(data);
            cursorY += ROW_HEIGHT;
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
        
        if (target.closest('#sinoptico-toggle-details')) {
            document.getElementById('sinoptico-main-view').classList.toggle('expanded');
            document.getElementById('sinoptico-details-container').classList.toggle('hidden');
            return;
        }
    
        const exportBtn = target.closest('button[data-action="export-product-pdf"]');
        if (exportBtn) {
            const activeTree = appState.collections[COLLECTIONS.ARBOLES].find(a => a.docId === appState.sinopticoState.activeTreeDocId);
            if (activeTree) {
                const activeNode = findNode(appState.sinopticoState.activeElementId, activeTree.estructura);
                if (activeNode && activeNode.tipo === 'producto') {
                    await exportProductTreePdf(activeNode);
                }
            }
            return;
        }
    
        const quantitySection = target.closest('#quantity-section');
        if (quantitySection) {
            const displayMode = quantitySection.querySelector('#quantity-display-mode');
            const editMode = quantitySection.querySelector('#quantity-edit-mode');
            const action = target.closest('button')?.dataset.action;
    
            if (action === 'edit-quantity') {
                displayMode.classList.add('hidden');
                editMode.classList.remove('hidden');
                editMode.querySelector('input').focus();
            }
    
            if (action === 'cancel-edit-quantity') {
                displayMode.classList.remove('hidden');
                editMode.classList.add('hidden');
            }
            
            if (action === 'save-quantity') {
                const saveButton = target.closest('button');
                const nodeId = quantitySection.dataset.nodeId;
                const quantityInput = quantitySection.querySelector('#quantity-input-synoptic');
                const inputValue = quantityInput.value.trim();
                let newQuantity;

                if (inputValue === '') {
                    newQuantity = null;
                } else {
                    newQuantity = parseFloat(inputValue);
                    if (isNaN(newQuantity) || newQuantity < 0) {
                        showToast('Por favor, ingrese una cantidad numérica válida y positiva.', 'error');
                        return;
                    }
                }
    
                const tree = appState.collections[COLLECTIONS.ARBOLES].find(a => a.docId === appState.sinopticoState.activeTreeDocId);
                if (!tree) { showToast('Error: No se pudo encontrar el árbol activo.', 'error'); return; }
    
                const nodeToUpdate = findNode(nodeId, tree.estructura);
    
                if (nodeToUpdate) {
                    nodeToUpdate.quantity = newQuantity;
                    saveButton.innerHTML = `<i data-lucide="loader" class="h-5 w-5 animate-spin mx-auto"></i>`;
                    lucide.createIcons();
                    saveButton.disabled = true;
    
                    try {
                        const arbolRef = doc(db, COLLECTIONS.ARBOLES, tree.docId);
                        await updateDoc(arbolRef, { estructura: tree.estructura });
                        showToast('Cantidad actualizada con éxito.', 'success');
                        renderTree();
                        renderDetailView(nodeId);
                    } catch (error) {
                        showToast("Error al guardar la cantidad.", "error");
                        renderDetailView(nodeId);
                    }
    
                } else {
                    showToast('Error: No se pudo actualizar el nodo.', 'error');
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
            const treeForParent = appState.collections[COLLECTIONS.ARBOLES].find(a => a.docId === appState.sinopticoState.activeTreeDocId)
            if (treeForParent) {
                const parentNode = findParentNode(navigateToId, treeForParent.estructura);
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
    
    const searchHandler = () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            appState.collections[COLLECTIONS.ARBOLES].forEach(arbol => {
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
                arbol.estructura.forEach(rootNode => findAndExpand(rootNode, []));
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
    const treesToRender = appState.collections[COLLECTIONS.ARBOLES].filter(arbol => {
        return activeFilters.clients.size === 0 || activeFilters.clients.has(arbol.clienteId);
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
// --- LÓGICA DE PERFIL DE USUARIO ---
// =================================================================================

function runProfileLogic() {
    const user = appState.currentUser;
    if (!user) return;
    dom.viewContent.innerHTML = `<div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div class="bg-white p-8 rounded-xl shadow-lg flex items-center space-x-6">
                <img src="${user.avatarUrl}" alt="Avatar" class="w-24 h-24 rounded-full border-4 border-slate-200">
                <div>
                    <h3 class="text-3xl font-bold text-slate-800">${user.name}</h3>
                    <p class="text-slate-500">${user.email}</p>
                </div>
            </div>
            <div class="bg-white p-8 rounded-xl shadow-lg">
                <h4 class="text-xl font-bold text-slate-800 border-b pb-4 mb-6">Cambiar Contraseña</h4>
                <form id="change-password-form" class="space-y-4 max-w-md">
                    <div><label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label><input type="password" id="current-password" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></div>
                    <div><label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label><input type="password" id="new-password" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></div>
                    <div><label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label><input type="password" id="confirm-password" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required></div>
                    <div class="pt-2"><button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Cambios</button></div>
                </form>
            </div>
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
