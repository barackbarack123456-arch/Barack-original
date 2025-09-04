import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { runSinopticoTabularLogic } from '../../public/main.js';
import { COLLECTIONS } from '../../public/utils.js';

// Mock lucide - it's a DOM dependency we don't need for this test
global.lucide = {
    createIcons: jest.fn(),
};

describe('Sinoptico Tabular View Level Filtering Bug', () => {
    let dom;
    let mockAppState;

    beforeEach(() => {
        // Set up a mock DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="view-content"></div>
                    <div id="modal-container"></div>
                </body>
            </html>
        `);
        global.document = dom.window.document;
        global.window = dom.window;

        // Mock the global appState
        mockAppState = {
            currentView: 'sinoptico_tabular',
            sinopticoTabularState: null, // This will be initialized by the function
            collections: {
                [COLLECTIONS.PRODUCTOS]: [],
                [COLLECTIONS.CLIENTES]: [],
                [COLLECTIONS.PROCESOS]: [],
                [COLLECTIONS.UNIDADES]: [],
                [COLLECTIONS.PROVEEDORES]: [],
            },
            collectionsById: {
                [COLLECTIONS.PRODUCTOS]: new Map(),
                [COLLECTIONS.SEMITERMINADOS]: new Map(),
                [COLLECTIONS.INSUMOS]: new Map(),
                [COLLECTIONS.CLIENTES]: new Map(),
                [COLLECTIONS.PROCESOS]: new Map(),
                [COLLECTIONS.UNIDADES]: new Map(),
                [COLLECTIONS.PROVEEDORES]: new Map(),
            },
            // Mock the checkUserPermission function to always return true for simplicity
            currentUser: {
                role: 'admin'
            }
        };
        global.appState = mockAppState;
        global.checkUserPermission = () => true;

        // Mock the dom elements lookup
        global.dom = {
            viewContent: document.getElementById('view-content'),
            modalContainer: document.getElementById('modal-container')
        };
    });

    test('[BUG-REPRODUCE] should render the correct original level in the table when filtered', () => {
        // --- ARRANGE ---
        // 1. Create mock data
        const mockProduct = {
            docId: 'PROD-01',
            id: 'PROD-01',
            descripcion: 'Producto Principal',
            clienteId: 'CLIENTE-A',
            estructura: [
                {
                    id: 'node-0', refId: 'PROD-01', tipo: 'producto',
                    children: [
                        {
                            id: 'node-1', refId: 'SEMI-01', tipo: 'semiterminado',
                            children: [
                                { id: 'node-2', refId: 'INSUMO-01', tipo: 'insumo', children: [] }
                            ]
                        }
                    ]
                }
            ]
        };

        // 2. Populate mock collections
        mockAppState.collections[COLLECTIONS.PRODUCTOS] = [mockProduct];
        mockAppState.collectionsById[COLLECTIONS.PRODUCTOS].set('PROD-01', mockProduct);
        mockAppState.collectionsById[COLLECTIONS.SEMITERMINADOS].set('SEMI-01', { id: 'SEMI-01', descripcion: 'Semiterminado Nivel 1' });
        mockAppState.collectionsById[COLLECTIONS.INSUMOS].set('INSUMO-01', { id: 'INSUMO-01', descripcion: 'Insumo Nivel 2' });
        mockAppState.collectionsById[COLLECTIONS.CLIENTES].set('CLIENTE-A', { id: 'CLIENTE-A', descripcion: 'Cliente A' });

        // 3. Set the initial state for the view logic
        runSinopticoTabularLogic(); // Initial render to set up the state
        appState.sinopticoTabularState.selectedProduct = mockProduct;
        appState.sinopticoTabularState.activeFilters.niveles = new Set(['0', '2']); // Filter out level 1

        // --- ACT ---
        // Re-run the logic to apply the filter and re-render the table
        runSinopticoTabularLogic();

        // --- ASSERT ---
        const viewContent = document.getElementById('view-content');
        const insumoRow = viewContent.querySelector('tr[data-node-id="node-2"]');
        expect(insumoRow).not.toBeNull();

        // The "Nivel" column is the second `<td>` in the row
        const nivelCell = insumoRow.querySelectorAll('td')[1];
        expect(nivelCell).not.toBeNull();

        // The bug is that this cell will contain '1' instead of '2'
        expect(nivelCell.textContent).toBe('2');
    });
});
