import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { deleteProductAndOrphanedSubProducts } from '../../public/data_logic.js';

// Mock de UI Callbacks
const mockUiCallbacks = {
    showToast: jest.fn(),
    runTableLogic: jest.fn(),
};

// Mock de la base de datos y colecciones
const mockDb = {};
const mockCollections = {
    PRODUCTOS: 'productos',
    SEMITERMINADOS: 'semiterminados',
};

// Mock del objeto firestore
const mockFirestore = {
    doc: jest.fn((db, collection, id) => ({ db, collection, id })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    deleteDoc: jest.fn(),
    collection: jest.fn((db, collection) => ({ db, collection })),
    query: jest.fn(),
    where: jest.fn(),
};

describe('deleteProductAndOrphanedSubProducts', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        Object.values(mockFirestore).forEach(mockFn => mockFn.mockClear());
        Object.values(mockUiCallbacks).forEach(mockFn => mockFn.mockClear());
    });

    test('should delete product and its unique sub-product', async () => {
        // Arrange
        const productToDelete = {
            id: 'PROD001',
            estructura: [{ tipo: 'semiterminado', refId: 'SUB001' }]
        };
        const subProductToDelete = { id: 'SUB001' };

        mockFirestore.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => productToDelete });
        mockFirestore.getDocs
            .mockResolvedValueOnce({ empty: true, docs: [] }) // get all other products (none)
            .mockResolvedValueOnce({ empty: false, docs: [{ id: 'SUB001_DOC_ID', data: () => subProductToDelete }] }); // find sub-product to delete

        // Act
        await deleteProductAndOrphanedSubProducts('PROD001', mockDb, mockFirestore, mockCollections, mockUiCallbacks);

        // Assert
        expect(mockFirestore.deleteDoc).toHaveBeenCalledTimes(2);
        expect(mockFirestore.doc).toHaveBeenCalledWith(mockDb, 'productos', 'PROD001');
        expect(mockFirestore.doc).toHaveBeenCalledWith(mockDb, 'semiterminados', 'SUB001_DOC_ID');
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('Producto principal eliminado.', 'success');
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('1 sub-componentes huérfanos eliminados.', 'success');
    });

    test('should only delete product if sub-product is used elsewhere', async () => {
        // Arrange
        const productToDelete = {
            id: 'PROD001',
            estructura: [{ tipo: 'semiterminado', refId: 'SUB001' }]
        };
        const otherProduct = {
            id: 'PROD002',
            estructura: [{ tipo: 'semiterminado', refId: 'SUB001' }]
        };

        mockFirestore.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => productToDelete });
        mockFirestore.getDocs.mockResolvedValueOnce({ docs: [{ data: () => otherProduct }] });

        // Act
        await deleteProductAndOrphanedSubProducts('PROD001', mockDb, mockFirestore, mockCollections, mockUiCallbacks);

        // Assert
        expect(mockFirestore.deleteDoc).toHaveBeenCalledTimes(1);
        expect(mockFirestore.doc).toHaveBeenCalledWith(mockDb, 'productos', 'PROD001');
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('Producto principal eliminado.', 'success');
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('No se eliminaron sub-componentes (están en uso por otros productos).', 'info');
    });

    test('should only delete product if it has no sub-products', async () => {
        // Arrange
        const productToDelete = {
            id: 'PROD001',
            estructura: [{ tipo: 'insumo', refId: 'INS001' }] // No semiterminados
        };

        mockFirestore.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => productToDelete });

        // Act
        await deleteProductAndOrphanedSubProducts('PROD001', mockDb, mockFirestore, mockCollections, mockUiCallbacks);

        // Assert
        expect(mockFirestore.deleteDoc).toHaveBeenCalledTimes(1);
        expect(mockFirestore.doc).toHaveBeenCalledWith(mockDb, 'productos', 'PROD001');
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('Producto principal eliminado.', 'success');
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('El producto no tenía sub-componentes para verificar.', 'info');
    });

    test('should do nothing if product does not exist', async () => {
        // Arrange
        mockFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });

        // Act
        await deleteProductAndOrphanedSubProducts('NON_EXISTENT_PROD', mockDb, mockFirestore, mockCollections, mockUiCallbacks);

        // Assert
        expect(mockFirestore.deleteDoc).not.toHaveBeenCalled();
        expect(mockUiCallbacks.showToast).toHaveBeenCalledWith('El producto ya no existe.', 'info');
    });
});
