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

        const prevBtn = document.getElementById('tutorial-prev-btn');
        prevBtn.addEventListener('click', async () => {
            prevBtn.disabled = true;
            await previous();
            prevBtn.disabled = false;
        });

        const nextBtn = document.getElementById('tutorial-next-btn');
        nextBtn.addEventListener('click', async () => {
            nextBtn.disabled = true;
            await next();
            nextBtn.disabled = false;
        });
    };

    /**
     * Shows a specific step of the tutorial.
     * @param {number} index - The index of the step to show.
     */
    const waitForVisibleElement = (selector, timeout = 3000) => {
        return new Promise(resolve => {
            // Special case for the 'body' selector, as its offsetParent is null.
            if (selector === 'body') {
                if (document.body) {
                    resolve(document.body);
                    return;
                }
            }

            const interval = 100;
            let elapsedTime = 0;

            const timer = setInterval(() => {
                const element = document.querySelector(selector);
                // Check if the element exists and is visible (not display:none and has dimensions)
                if (element && element.offsetParent !== null) {
                    clearInterval(timer);
                    resolve(element);
                } else {
                    elapsedTime += interval;
                    if (elapsedTime >= timeout) {
                        clearInterval(timer);
                        resolve(null);
                    }
                }
            }, interval);
        });
    };

    let resizeObserver = null;

    const updateHighlight = (targetElement, step) => {
        if (!targetElement || !dom.highlight) return;

        const targetRect = targetElement.getBoundingClientRect();
        const padding = 5;

        dom.highlight.style.width = `${targetRect.width + (padding * 2)}px`;
        dom.highlight.style.height = `${targetRect.height + (padding * 2)}px`;
        dom.highlight.style.top = `${targetRect.top - padding}px`;
        dom.highlight.style.left = `${targetRect.left - padding}px`;

        positionTooltip(targetRect, step.position);
    };

    const showStep = async (index) => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }

        if (index < 0 || index >= steps.length) {
            skip();
            return;
        }

        currentStepIndex = index;
        const step = steps[index];

        if (step.preAction) {
            await step.preAction();
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const targetElement = await waitForVisibleElement(step.element);

        if (!targetElement) {
            console.warn(`Tutorial element not found: ${step.element}. Skipping to next step.`);
            next();
            return;
        }

        smartScroll(targetElement);

        if (step.click) {
            targetElement.classList.add('tutorial-click-effect');
            setTimeout(() => {
                 targetElement.classList.remove('tutorial-click-effect');
            }, 1000);
        }

        document.getElementById('tutorial-tooltip-title').textContent = step.title;
        document.getElementById('tutorial-tooltip-text').innerHTML = step.content;
        document.getElementById('tutorial-prev-btn').style.display = index === 0 ? 'none' : 'inline-block';
        document.getElementById('tutorial-next-btn').textContent = index === steps.length - 1 ? 'Finalizar' : 'Siguiente';

        updateHighlight(targetElement, step);

        // --- Reactive Highlighting ---
        resizeObserver = new ResizeObserver(() => {
            updateHighlight(targetElement, step);
        });
        resizeObserver.observe(targetElement);
        resizeObserver.observe(document.body);
    };

    /**
     * Scrolls the element into view only if it's not already visible.
     * @param {Element} element - The DOM element to scroll to.
     */
    const smartScroll = (element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    /**
     * Positions the tooltip relative to the target element.
     * @param {DOMRect} targetRect - The bounding rect of the highlighted element.
     * @param {string} position - The desired position ('top', 'bottom', 'left', 'right').
     */
    const positionTooltip = (targetRect, position = 'bottom') => {
        const tooltipRect = dom.tooltip.getBoundingClientRect();
        const spacing = 10;
        let top, left;

        // --- Position Calculation with Smart Flipping ---
        let finalPosition = position;

        // Try to flip right to left if there's no space
        if (position === 'right' && (targetRect.right + spacing + tooltipRect.width > window.innerWidth)) {
            finalPosition = 'left';
        }
        // Try to flip left to right if there's no space
        if (position === 'left' && (targetRect.left - spacing - tooltipRect.width < 0)) {
            finalPosition = 'right';
        }
        // Try to flip top to bottom if there's no space
        if (position === 'top' && (targetRect.top - spacing - tooltipRect.height < 0)) {
            finalPosition = 'bottom';
        }
        // Try to flip bottom to top if there's no space
        if (position === 'bottom' && (targetRect.bottom + spacing + tooltipRect.height > window.innerHeight)) {
            finalPosition = 'top';
        }

        // Calculate position based on the (potentially flipped) finalPosition
        switch (finalPosition) {
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

        // --- Final Boundary Enforcement ---
        // Ensure the tooltip never goes out of bounds, no matter what.
        if (left < spacing) {
            left = spacing;
        }
        if (left + tooltipRect.width > window.innerWidth - spacing) {
            left = window.innerWidth - tooltipRect.width - spacing;
        }
        if (top < spacing) {
            top = spacing;
        }
        if (top + tooltipRect.height > window.innerHeight - spacing) {
            top = window.innerHeight - tooltipRect.height - spacing;
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
                position: 'bottom',
                postAction: async () => {
                    const menu = document.querySelector('[data-tutorial-id="eco-ecr-menu"]');
                    if (menu) {
                        menu.querySelector('.dropdown-toggle')?.click();
                        // Wait for the dropdown menu to become visible
                        await waitForVisibleElement('a[data-view="ecr"]');
                    }
                }
            },
            {
                element: 'a[data-view="ecr"]',
                title: 'Gestión de ECR',
                content: 'Aquí es donde se inician las solicitudes de cambio. Haremos clic aquí para ir a la pantalla de gestión de ECR.',
                position: 'right',
                click: true,
                postAction: async () => {
                    // Direct navigation instead of simulated click
                    await app.switchView('ecr');
                }
            },
            {
                element: '#view-title',
                title: 'Pantalla de Gestión de ECR',
                content: 'Esta tabla muestra todos los ECRs existentes. Para proponer un nuevo cambio, debemos crear un nuevo ECR.',
                position: 'bottom'
                // No preAction needed, handled by previous step's postAction
            },
            {
                element: 'button[data-action="create-new-ecr"]',
                title: 'Crear un Nuevo ECR',
                content: 'Este botón nos llevará al formulario para detallar nuestra solicitud de cambio.',
                position: 'bottom',
                click: true,
                postAction: async () => {
                    // Direct navigation instead of simulated click
                    await app.switchView('ecr_form');
                }
            },
            {
                element: '.ecr-header',
                title: 'Formulario de ECR',
                content: 'Este es el formulario de Solicitud de Cambio de Ingeniería. Aquí se documenta toda la información necesaria para que el cambio sea evaluado.',
                position: 'bottom'
                 // No preAction needed, handled by previous step's postAction
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
                content: 'Cuando un ECR es aprobado, aparece un botón para "Generar ECO". Esto convierte la solicitud en una Orden de Cambio, que es el documento para ejecutar la modificación.',
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
    const next = async () => {
        await showStep(currentStepIndex + 1);
    };

    /**
     * Moves to the previous step.
     */
    const previous = async () => {
        await showStep(currentStepIndex - 1);
    };

    /**
     * Skips and closes the tutorial.
     */
    const skip = () => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (dom.overlay) {
            dom.overlay.remove();
            dom.overlay = null;
            dom.tooltip = null;
            dom.highlight = null;
        }
        // Signal to the main app that the tutorial has ended.
        if (app && typeof app.onTutorialEnd === 'function') {
            app.onTutorialEnd();
        }
    };

    // Expose public methods
    return {
        start,
        skip,
    };
};

export default tutorial;
