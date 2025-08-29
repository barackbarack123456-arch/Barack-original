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

    // All tutorial steps are defined here for clarity and easier maintenance.
    const TUTORIAL_STEPS = [
        {
            element: 'body',
            title: 'Bienvenido al Tutorial Interactivo',
            content: 'Este tour te guiará por el proceso de <strong>Gestión de Cambios de Ingeniería</strong>, desde la solicitud (ECR) hasta la orden de cambio (ECO). ¡Vamos a empezar!',
            position: 'center'
        },
        {
            element: '[data-tutorial-id="eco-ecr-menu"]',
            title: 'Módulo ECR/ECO',
            content: 'Toda la gestión de cambios de ingeniería empieza aquí. Este menú contiene las herramientas para solicitar, seguir y ejecutar cambios.',
            position: 'bottom',
            postAction: async () => {
                const menu = document.querySelector('[data-tutorial-id="eco-ecr-menu"]');
                if (menu) {
                    menu.classList.add('open');
                    await waitForVisibleElement('a[data-view="ecr"]');
                }
            }
        },
        {
            element: 'a[data-view="ecr"]',
            title: 'Gestión de Solicitudes (ECR)',
            content: 'Aquí es donde se crean y gestionan las <strong>Solicitudes de Cambio (ECR)</strong>. Un ECR es el primer paso para proponer una modificación.',
            position: 'right',
            click: true,
            postAction: async () => {
                await app.switchView('ecr');
                const menu = document.querySelector('[data-tutorial-id="eco-ecr-menu"]');
                if (menu) {
                    menu.classList.remove('open');
                }
            }
        },
        {
            element: '#view-title',
            title: 'Panel de Control de ECRs',
            content: 'Esta tabla muestra todos los ECRs con su estado actual. Para proponer un nuevo cambio, crearemos un nuevo ECR.',
            position: 'bottom',
            preAction: async () => {
                await app.switchView('ecr');
            }
        },
        {
            element: '[data-tutorial-id="create-new-button"]',
            title: 'Crear un Nuevo ECR',
            content: 'Este botón abre el formulario para detallar una nueva solicitud de cambio. Le daremos un identificador único y describiremos la propuesta.',
            position: 'bottom',
            click: true,
            postAction: async () => {
                await app.switchView('ecr_form');
            }
        },
        {
            element: '.ecr-header',
            title: 'Formulario de Solicitud de Cambio',
            content: 'En este formulario se documenta el <strong>qué</strong> y el <strong>porqué</strong> del cambio. Es crucial para que todos los departamentos puedan evaluarlo.',
            position: 'bottom'
        },
        {
            element: '[data-tutorial-id="situacion-layout"]',
            title: 'Situación Actual vs. Propuesta',
            content: 'Aquí se describe el problema o la situación actual y cómo se propone solucionarlo. Es el corazón de la solicitud.',
            position: 'top'
        },
        {
            element: '[data-tutorial-id="evaluacion-departamento"]',
            title: 'Evaluación de Impacto',
            content: 'Cada departamento afectado debe evaluar cómo le impacta el cambio. Esto asegura una visión 360° antes de aprobar nada.',
            position: 'right'
        },
        {
            element: '[data-tutorial-id="aprobacion-departamental"]',
            title: 'Circuito de Aprobación',
            content: 'Una vez evaluado, los responsables de cada área emiten su aprobación o rechazo. La decisión, el usuario y la fecha quedan registrados aquí.',
            position: 'top'
        },
        {
            element: '#action-buttons-container',
            title: 'Guardar o Enviar',
            content: 'Puedes guardar el ECR como borrador para continuarlo más tarde. Cuando esté listo, lo envías al circuito de aprobación para que sea evaluado.',
            position: 'top'
        },
        {
            element: '#view-title',
            title: 'Máquina de Estados del ECR',
            content: 'Una vez enviado, el estado del ECR cambia a <strong>"pending-approval"</strong>. Si todos aprueban, pasa a <strong>"approved"</strong>. Si uno solo rechaza, se marca como <strong>"rejected"</strong>.',
            position: 'center',
            preAction: async () => {
                await app.switchView('ecr');
            }
        },
        {
            element: '[data-tutorial-id="ecr-table-body"]',
            title: 'De Solicitud a Orden (ECO)',
            content: 'Cuando un ECR es aprobado, se habilita la opción de "Generar ECO". Esto convierte la solicitud en una <strong>Orden de Cambio (ECO)</strong>, que es el documento para ejecutar la modificación.',
            position: 'bottom'
        },
         {
            element: '#action-plan-section',
            title: 'Plan de Acción del ECO',
            content: 'El ECO se enfoca en la implementación. Aquí se crea una lista de tareas, se asignan responsables y fechas límite para asegurar que el cambio se realice de forma controlada.',
            position: 'top',
             preAction: async () => {
                // We need a mock ECO form view for the tutorial to show this
                await app.switchView('eco_form_mock_for_tutorial');
            }
        },
        {
            element: 'body',
            title: '¡Fin del Tutorial!',
            content: '¡Excelente! Ahora conoces el flujo completo de ECR/ECO. Este proceso asegura que los cambios de ingeniería se realizan de forma controlada y documentada.',
            position: 'center'
        }
    ];

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
                <div id="tutorial-tooltip-progress" class="text-sm text-slate-500"></div>
                <div id="tutorial-nav-buttons">
                    <button id="tutorial-skip-btn">Omitir</button>
                    <div id="tutorial-nav-right">
                        <button id="tutorial-prev-btn">Anterior</button>
                        <button id="tutorial-next-btn">Siguiente</button>
                    </div>
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
        document.getElementById('tutorial-tooltip-progress').textContent = `Paso ${index + 1} de ${steps.length}`;

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

        steps = TUTORIAL_STEPS;

        createTutorialUI();
        dom.overlay.style.display = 'block';
        showStep(0);
    };

    /**
     * Moves to the next step.
     */
    const next = async () => {
        const step = steps[currentStepIndex];
        if (step && step.postAction) {
            await step.postAction();
        }
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
