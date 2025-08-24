// No longer importing from firebase here. The functions will be passed in.

export async function deleteProductAndOrphanedSubProducts(productDocId, db, firestore, COLLECTIONS, uiCallbacks) {
    // Destructure the required firestore functions from the passed-in object
    const { doc, getDoc, getDocs, deleteDoc, collection, query, where } = firestore;
    const { showToast, runTableLogic } = uiCallbacks;

    showToast('Iniciando eliminación de producto y componentes...', 'info');
    try {
        const productRef = doc(db, COLLECTIONS.PRODUCTOS, productDocId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
            showToast('El producto ya no existe.', 'info');
            return;
        }

        const productData = productSnap.data();
        const subProductRefs = new Set();

        function findSubProducts(nodes) {
            if (!nodes) return;
            for (const node of nodes) {
                if (node.tipo === 'semiterminado') {
                    subProductRefs.add(node.refId);
                }
                if (node.children) {
                    findSubProducts(node.children);
                }
            }
        }

        findSubProducts(productData.estructura);

        // Delete the main product
        await deleteDoc(productRef);
        showToast('Producto principal eliminado.', 'success');

        if (subProductRefs.size === 0) {
            showToast('El producto no tenía sub-componentes para verificar.', 'info');
            runTableLogic();
            return;
        }

        showToast(`Verificando ${subProductRefs.size} sub-componentes...`, 'info');

        const allProductsSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTOS));
        const allOtherProducts = [];
        allProductsSnap.docs.forEach(doc => {
            allOtherProducts.push(doc.data());
        });

        let deletedCount = 0;
        for (const subProductRefId of subProductRefs) {
            let isUsedElsewhere = false;
            for (const otherProduct of allOtherProducts) {
                function isSubProductInStructure(nodes) {
                    if (!nodes) return false;
                    for (const node of nodes) {
                        if (node.tipo === 'semiterminado' && node.refId === subProductRefId) {
                            return true;
                        }
                        if (node.children && isSubProductInStructure(node.children)) {
                            return true;
                        }
                    }
                    return false;
                }

                if (isSubProductInStructure(otherProduct.estructura)) {
                    isUsedElsewhere = true;
                    break;
                }
            }

            if (!isUsedElsewhere) {
                const q = query(collection(db, COLLECTIONS.SEMITERMINADOS), where("id", "==", subProductRefId));
                const subProductToDeleteSnap = await getDocs(q);
                if (!subProductToDeleteSnap.empty) {
                    const subProductDocToDelete = subProductToDeleteSnap.docs[0];
                    await deleteDoc(doc(db, COLLECTIONS.SEMITERMINADOS, subProductDocToDelete.id));
                    deletedCount++;
                }
            }
        }

        if (deletedCount > 0) {
            showToast(`${deletedCount} sub-componentes huérfanos eliminados.`, 'success');
        } else {
            showToast('No se eliminaron sub-componentes (están en uso por otros productos).', 'info');
        }

    } catch (error) {
        console.error("Error deleting product and orphaned sub-products:", error);
        showToast('Ocurrió un error durante la eliminación compleja.', 'error');
    } finally {
        runTableLogic();
    }
}
