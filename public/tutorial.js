/**
 * Interactive Tutorial Module
 *
 * This module creates a guided tour for new users to understand the ECR/ECO workflow.
 */
const tutorial = (app) => {
    let currentStepIndex = 0;
    let steps = [];

    const dom = {
        overlay: null,
        tooltip: null,
        highlight: null,
    };

    /**
     * Creates the main DOM elements for the tutorial (overlay, highlight, tooltip).
     */
    const createTutorialUI = () => {
        // Create overlay
        dom.overlay = document.createElement('div');
        dom.overlay.id = 'tutorial-overlay';

        // Create highlight element
        dom.highlight = document.createElement('div');
        dom.highlight.id = 'tutorial-highlight';
        dom.overlay.appendChild(dom.highlight);

        // Create tooltip
        dom.tooltip = document.createElement('div');
        dom.tooltip.id = 'tutorial-tooltip';
        dom.tooltip.innerHTML = `
            <div id="tutorial-tooltip-content">
                <h3 id="tutorial-tooltip-title"></h3>
                <p id="tutorial-tooltip-text"></p>
            </div>
            <div id="tutorial-tooltip-nav">
                <button id="tutorial-skip-btn">Omitir</button>
                <div id="tutorial-nav-right">
                    <button id="tutorial-prev-btn">Anterior</button>
                    <button id="tutorial-next-btn">Siguiente</button>
                </div>
            </div>
        `;
        dom.overlay.appendChild(dom.tooltip);

        document.body.appendChild(dom.overlay);

        // Add event listeners
        document.getElementById('tutorial-skip-btn').addEventListener('click', skip);
        document.getElementById('tutorial-prev-btn').addEventListener('click', previous);
        document.getElementById('tutorial-next-btn').addEventListener('click', next);
    };

    /**
     * Shows a specific step of the tutorial.
     * @param {number} index - The index of the step to show.
     */
    const showStep = async (index) => {
        if (index < 0 || index >= steps.length) {
            skip();
            return;
        }

        currentStepIndex = index;
        const step = steps[index];

        // Execute any pre-action for the step (e.g., changing view)
        if (step.preAction) {
            await step.preAction();
            // Give the DOM time to update after the action
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const targetElement = document.querySelector(step.element);

        if (!targetElement) {
            console.warn(`Tutorial element not found: ${step.element}. Skipping to next step.`);
            next();
            return;
        }

        // Scroll the target element into view
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add a visual click effect if the step requires it
        if (step.click) {
            targetElement.classList.add('tutorial-click-effect');
            setTimeout(() => {
                 targetElement.classList.remove('tutorial-click-effect');
            }, 1000); // Duration of the effect
        }

        // Update tooltip content
        document.getElementById('tutorial-tooltip-title').textContent = step.title;
        document.getElementById('tutorial-tooltip-text').innerHTML = step.content;

        // Update button states
        document.getElementById('tutorial-prev-btn').style.display = index === 0 ? 'none' : 'inline-block';
        document.getElementById('tutorial-next-btn').textContent = index === steps.length - 1 ? 'Finalizar' : 'Siguiente';

        // Position highlight and tooltip
        const targetRect = targetElement.getBoundingClientRect();
        const padding = 5;

        // Position the highlight
        dom.highlight.style.width = `${targetRect.width + (padding * 2)}px`;
        dom.highlight.style.height = `${targetRect.height + (padding * 2)}px`;
        dom.highlight.style.top = `${targetRect.top - padding}px`;
        dom.highlight.style.left = `${targetRect.left - padding}px`;

        positionTooltip(targetRect, step.position);
    };

    /**
     * Positions the tooltip relative to the target element.
     * @param {DOMRect} targetRect - The bounding rect of the highlighted element.
     * @param {string} position - The desired position ('top', 'bottom', 'left', 'right').
     */
    const positionTooltip = (targetRect, position = 'bottom') => {
        const tooltipRect = dom.tooltip.getBoundingClientRect();
        const spacing = 10; // Reduced spacing
        let top, left;

        // Default positions
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - spacing;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + spacing;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - spacing;
                break;
            case 'bottom':
            default:
                top = targetRect.bottom + spacing;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
        }

        // --- Auto-adjustment logic ---
        // Adjust horizontal position
        if (left < spacing) {
            left = spacing;
        }
        if (left + tooltipRect.width > window.innerWidth - spacing) {
            left = window.innerWidth - tooltipRect.width - spacing;
        }

        // Adjust vertical position
        if (top < spacing) {
            top = spacing;
        }
        if (top + tooltipRect.height > window.innerHeight - spacing) {
            top = window.innerHeight - tooltipRect.height - spacing;
        }

        // If position is right and it overflows, try to switch to left
        if (position === 'right' && (targetRect.right + spacing + tooltipRect.width > window.innerWidth)) {
            left = targetRect.left - tooltipRect.width - spacing;
        }

        // If position is left and it overflows, try to switch to right
        if (position === 'left' && (targetRect.left - spacing - tooltipRect.width < 0)) {
            left = targetRect.right + spacing;
        }


        dom.tooltip.style.top = `${top}px`;
        dom.tooltip.style.left = `${left}px`;
    };

    /**
     * Starts the tutorial.
     */
    const start = () => {
        if (dom.overlay) return; // Already running

        // Define all steps here
        steps = [
            {
                element: 'body',
                title: 'Bienvenido al Tutorial de Gestión PRO',
                content: 'Este tutorial te guiará a través del flujo de trabajo de <strong>ECR (Solicitud de Cambio de Ingeniería)</strong> y <strong>ECO (Orden de Cambio de Ingeniería)</strong>. Presiona "Siguiente" para comenzar.',
                position: 'center'
            },
            {
                element: '[data-tutorial-id="eco-ecr-menu"]',
                title: 'Módulo ECO/ECR',
                content: 'Toda la gestión de cambios de ingeniería se encuentra en este menú. Vamos a explorarlo.',
                position: 'bottom'
            },
            {
                element: 'a[data-view="ecr"]',
                title: 'Gestión de ECR',
                content: 'Aquí es donde se inician las solicitudes de cambio. Haremos clic aquí para ir a la pantalla de gestión de ECR.',
                position: 'right',
                click: true
            },
            {
                element: '#view-title',
                title: 'Pantalla de Gestión de ECR',
                content: 'Esta tabla muestra todos los ECRs existentes. Para proponer un nuevo cambio, debemos crear un nuevo ECR.',
                position: 'bottom',
                preAction: async () => {
                    document.querySelector('a[data-view="ecr"]').click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            },
            {
                element: 'button[data-action="create-new-ecr"]',
                title: 'Crear un Nuevo ECR',
                content: 'Este botón nos llevará al formulario para detallar nuestra solicitud de cambio.',
                position: 'bottom',
                click: true
            },
            {
                element: '.ecr-header',
                title: 'Formulario de ECR',
                content: 'Este es el formulario de Solicitud de Cambio de Ingeniería. Aquí se documenta toda la información necesaria para que el cambio sea evaluado.',
                position: 'bottom',
                preAction: async () => {
                    document.querySelector('button[data-action="create-new-ecr"]').click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            },
            {
                element: 'input[name="ecr_no"]',
                title: 'Número de ECR',
                content: 'Cada ECR debe tener un número único que lo identifique durante todo su ciclo de vida.',
                position: 'bottom'
            },
            {
                element: '[data-tutorial-id="situacion-layout"]',
                title: 'Situación Actual vs. Propuesta',
                content: 'Estos son los campos más importantes. Aquí se describe qué problema existe (Situación Existente) y cómo se propone solucionarlo (Situación Propuesta).',
                position: 'top'
            },
            {
                element: '[data-tutorial-id="evaluacion-departamento"]',
                title: 'Evaluación por Departamentos',
                content: 'Cada departamento afectado debe evaluar el impacto del cambio. Marcan si les afecta o no y añaden comentarios.',
                position: 'right'
            },
            {
                element: '[data-tutorial-id="aprobacion-departamental"]',
                title: 'Aprobación Departamental',
                content: 'Una vez evaluado, el responsable del departamento (o un admin) puede aprobar o rechazar la propuesta desde aquí. La decisión queda registrada con su nombre y fecha.',
                position: 'top'
            },
            {
                element: '#ecr-save-button',
                title: 'Guardar o Enviar a Aprobación',
                content: 'Puedes guardar el ECR como borrador ("Guardar Progreso") o, una vez completo, enviarlo al circuito de aprobación para que los departamentos lo evalúen.',
                position: 'top'
            },
            {
                element: '#view-title',
                title: 'Circuito de Aprobación',
                content: 'Una vez enviado, el ECR cambia a estado "pending-approval". Si un solo departamento lo rechaza, el ECR se marca como "rejected". Si todos los requeridos lo aprueban, pasa a "approved".',
                position: 'center',
                preAction: async () => {
                    await app.switchView('ecr');
                }
            },
            {
                element: '#ecr-table-body thead',
                title: 'Generar ECO',
                content: 'Cuando un ECR es aprobado, aparece un botón de "Generar ECO" en la fila correspondiente. Permite convertir la solicitud en una Orden de Cambio, que es el documento para ejecutar el cambio.',
                position: 'bottom'
            },
             {
                element: '#action-plan-section',
                title: 'Plan de Acción del ECO',
                content: 'La ECO se enfoca en la implementación. Esta sección permite crear una lista de tareas, asignar responsables y fechas límite para asegurar que el cambio se realice correctamente.',
                position: 'top',
                 preAction: async () => {
                    await app.switchView('eco_form');
                }
            },
            {
                element: 'body',
                title: '¡Fin del Tutorial!',
                content: '¡Excelente! Ahora conoces el flujo básico de ECR y ECO. Explora la aplicación para descubrir más funcionalidades.',
                position: 'center'
            }
        ];

        createTutorialUI();
        dom.overlay.style.display = 'block';
        showStep(0);
    };

    /**
     * Moves to the next step.
     */
    const next = () => {
        showStep(currentStepIndex + 1);
    };

    /**
     * Moves to the previous step.
     */
    const previous = () => {
        showStep(currentStepIndex - 1);
    };

    /**
     * Skips and closes the tutorial.
     */
    const skip = () => {
        if (dom.overlay) {
            dom.overlay.remove();
            dom.overlay = null;
            dom.tooltip = null;
            dom.highlight = null;
        }
    };

    // Expose public methods
    return {
        start,
        skip,
    };
};

export default tutorial;
