export const COLLECTIONS = {
    PRODUCTOS: 'productos',
    SEMITERMINADOS: 'semiterminados',
    INSUMOS: 'insumos',
    CLIENTES: 'clientes',
    SECTORES: 'sectores',
    PROCESOS: 'procesos',
    PROVEEDORES: 'proveedores',
    UNIDADES: 'unidades',
    USUARIOS: 'usuarios',
    TAREAS: 'tareas',
    PROYECTOS: 'proyectos',
    ROLES: 'roles',
    ECO_FORMS: 'eco_forms',
    ECR_FORMS: 'ecr_forms',
    COVER_MASTER: 'cover_master',
    REUNIONES_ECR: 'reuniones_ecr',
    NOTIFICATIONS: 'notifications'
};

export function getUniqueKeyForCollection(collectionName) {
    switch (collectionName) {
        case COLLECTIONS.PRODUCTOS:
        case COLLECTIONS.SEMITERMINADOS:
        case COLLECTIONS.INSUMOS:
            return 'codigo_pieza';
        case COLLECTIONS.PROYECTOS:
            return 'codigo';
        default:
            return 'id';
    }
}

/**
 * Creates an HTML string for a help tooltip icon.
 * @param {string} message - The help text to display in the tooltip.
 * @returns {string} - The HTML string for the tooltip component.
 */
export function createHelpTooltip(message) {
    const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    return `
        <div class="help-tooltip-container" tabindex="0" role="tooltip" aria-describedby="${tooltipId}">
            <i data-lucide="help-circle" class="help-icon"></i>
            <div class="help-tooltip-content" id="${tooltipId}">
                ${message}
            </div>
        </div>
    `;
}

/**
 * Determines if the PPAP confirmation checkbox should be required and validated for an ECO.
 * The condition is that PPAP is required by the client AND the client has formally approved it.
 * @param {object} ecrData - The data object from the associated ECR document.
 * @returns {boolean} - True if PPAP confirmation is required, false otherwise.
 */
export function shouldRequirePpapConfirmation(ecrData) {
    if (!ecrData) {
        return false;
    }
    // The logic is that the PPAP confirmation is only relevant if the ECR
    // both requires a PPAP and the client has given their final approval.
    return !!ecrData.cliente_requiere_ppap && ecrData.cliente_aprobacion_estado === 'aprobado';
}
