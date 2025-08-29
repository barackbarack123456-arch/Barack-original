/**
 * Interactive Tutorial Module (Robust Version)
 *
 * This module creates a guided tour for new users to understand the ECR/ECO workflow.
 * It uses a state-checking mechanism to be resilient to UI rendering latencies.
 */
const tutorial = (app) => {
    let currentStepIndex = 0;
    let steps = [];
    let isRunning = false;

    const dom = {
        overlay: null,
        tooltip: null,
        highlight: null,
    };

    // --- State Checking Utilities ---

    /**
     * A collection of reusable condition checkers.
     * Each function returns another function that, when executed, checks a condition.
     * It throws an error if the condition is not met, which is caught by `waitForState`.
     */
    const cond = {
        elementIsVisible: (selector) => () => {
            const el = document.querySelector(selector);
            if (!el || el.offsetParent === null) {
                throw new Error(`Element not visible: ${selector}`);
            }
            return el;
        },
        elementContainsText: (selector, text) => () => {
            const el = cond.elementIsVisible(selector)();
            if (!el.textContent.includes(text)) {
                throw new Error(`Element ${selector} does not contain text: "${text}"`);
            }
        },
        viewIsActive: (viewId) => () => {
            const titleEl = document.querySelector('#view-title');
            const expectedTitle = viewId.replace(/_/g, ' ');
            if (!titleEl || !titleEl.textContent.toLowerCase().includes(expectedTitle)) {
                throw new Error(`View not active: ${viewId}. Current title: "${titleEl?.textContent}"`);
            }
        },
        menuIsOpen: (menuSelector) => () => {
            const menu = document.querySelector(menuSelector);
            if (!menu || !menu.classList.contains('open')) {
                throw new Error(`Menu not open: ${menuSelector}`);
            }
        }
    };

    /**
     * Waits for a set of conditions to be true before resolving.
     * @param {Array<Function>} conditions - An array of functions that throw if their condition isn't met.
     * @param {number} timeout - The maximum time to wait in milliseconds.
     * @returns {Promise<boolean>} - Resolves with true if conditions are met, false if it times out.
     */
    const waitForState = (conditions, timeout = 5000) => {
        return new Promise((resolve) => {
            if (!conditions || conditions.length === 0) {
                resolve(true);
                return;
            }

            const interval = 100;
            let elapsedTime = 0;

            const timer = setInterval(() => {
                try {
                    // Execute all condition-checking functions.
                    conditions.forEach(condition => condition());

                    // If all passed without throwing, we're good.
                    clearInterval(timer);
                    // Per AGENTS.md, use a final timeout to ensure browser has painted.
                    setTimeout(() => resolve(true), 50);
                } catch (error) {
                    // A condition failed. We'll wait and retry.
                    elapsedTime += interval;
                    if (elapsedTime >= timeout) {
                        clearInterval(timer);
                        console.error("Tutorial 'waitForState' timed out.", error.message);
                        resolve(false);
                    }
                }
            }, interval);
        });
    };

    // --- Tutorial Steps Definition ---

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
            action: () => document.querySelector('[data-tutorial-id="eco-ecr-menu"] button').click(),
            onBefore: () => {
                // Close the menu if it's somehow already open
                const menu = document.querySelector('[data-tutorial-id="eco-ecr-menu"]');
                if (menu && menu.classList.contains('open')) {
                    menu.classList.remove('open');
                }
            }
        },
        {
            element: 'a[data-view="ecr"]',
            title: 'Gestión de Solicitudes (ECR)',
            content: 'Aquí es donde se crean y gestionan las <strong>Solicitudes de Cambio (ECR)</strong>. Un ECR es el primer paso para proponer una modificación.',
            position: 'right',
            waitFor: [cond.elementIsVisible('a[data-view="ecr"]'), cond.menuIsOpen('[data-tutorial-id="eco-ecr-menu"]')],
            action: () => document.querySelector('a[data-view="ecr"]').click()
        },
        {
            element: '#add-new-button',
            title: 'Crear un Nuevo ECR',
            content: 'Esta tabla muestra todos los ECRs. Para proponer un nuevo cambio, haremos clic en "Nuevo ECR".',
            position: 'bottom',
            waitFor: [cond.viewIsActive('gestión ecr'), cond.elementIsVisible('#add-new-button')],
            action: () => document.querySelector('#add-new-button').click()
        },
        {
            element: '.ecr-header',
            title: 'Formulario de Solicitud de Cambio',
            content: 'En este formulario se documenta el <strong>qué</strong> y el <strong>porqué</strong> del cambio. Es crucial para que todos los departamentos puedan evaluarlo.',
            position: 'bottom',
            waitFor: [cond.viewIsActive('formulario ecr'), cond.elementIsVisible('.ecr-header')]
        },
        {
            element: '[data-tutorial-id="situacion-layout"]',
            title: 'Situación Actual vs. Propuesta',
            content: 'Aquí se describe el problema o la situación actual y cómo se propone solucionarlo. Es el corazón de la solicitud.',
            position: 'top',
            waitFor: [cond.elementIsVisible('[data-tutorial-id="situacion-layout"]')]
        },
        {
            element: '[data-tutorial-id="evaluacion-departamento"]',
            title: 'Evaluación de Impacto',
            content: 'Cada departamento afectado debe evaluar cómo le impacta el cambio. Esto asegura una visión 360° antes de aprobar nada.',
            position: 'right',
            waitFor: [cond.elementIsVisible('[data-tutorial-id="evaluacion-departamento"]')]
        },
        {
            element: '[data-tutorial-id="aprobacion-departamental"]',
            title: 'Circuito de Aprobación',
            content: 'Una vez evaluado, los responsables de cada área emiten su aprobación o rechazo. La decisión, el usuario y la fecha quedan registrados aquí.',
            position: 'top',
            waitFor: [cond.elementIsVisible('[data-tutorial-id="aprobacion-departamental"]')]
        },
        {
            element: '#action-buttons-container',
            title: 'Guardar o Enviar',
            content: 'Puedes guardar el ECR como borrador para continuarlo más tarde. Cuando esté listo, lo envías al circuito de aprobación para que sea evaluado.',
            position: 'top',
            waitFor: [cond.elementIsVisible('#action-buttons-container')],
            action: async () => {
                // For the tutorial, we just go back to the ECR list.
                await app.switchView('ecr');
            }
        },
        {
            element: '[data-tutorial-id="ecr-table-body"]',
            title: 'Máquina de Estados y Generación de ECO',
            content: 'Una vez enviado, el estado del ECR cambia. Cuando se aprueba, se puede generar la <strong>Orden de Cambio (ECO)</strong> para ejecutar la modificación.',
            position: 'bottom',
            waitFor: [cond.viewIsActive('gestión ecr'), cond.elementIsVisible('[data-tutorial-id="ecr-table-body"]')],
            action: async () => {
                 // We need a mock ECO form view for the tutorial to show the next step.
                 await app.switchView('eco_form_mock_for_tutorial');
            }
        },
         {
            element: '#action-plan-section',
            title: 'Plan de Acción del ECO',
            content: 'El ECO se enfoca en la implementación. Aquí se crea una lista de tareas, se asignan responsables y fechas límite para asegurar que el cambio se realice de forma controlada.',
            position: 'top',
            waitFor: [cond.viewIsActive('formulario eco'), cond.elementIsVisible('#action-plan-section')]
        },
        {
            element: 'body',
            title: '¡Fin del Tutorial!',
            content: '¡Excelente! Ahora conoces el flujo completo de ECR/ECO. Este proceso asegura que los cambios de ingeniería se realizan de forma controlada y documentada.',
            position: 'center',
            onBefore: async () => {
                // Go back to the main dashboard to finish
                await app.switchView('dashboard');
            },
            waitFor: [cond.viewIsActive('dashboard')]
        }
    ];

    // --- Core Tutorial Logic ---

    const createTutorialUI = () => {
        dom.overlay = document.createElement('div');
        dom.overlay.id = 'tutorial-overlay';

        dom.highlight = document.createElement('div');
        dom.highlight.id = 'tutorial-highlight';
        dom.overlay.appendChild(dom.highlight);

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

        document.getElementById('tutorial-skip-btn').addEventListener('click', skip);
        document.getElementById('tutorial-prev-btn').addEventListener('click', () => navigate(-1));
        document.getElementById('tutorial-next-btn').addEventListener('click', () => navigate(1));
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

        // Disable navigation while processing step
        document.getElementById('tutorial-prev-btn').disabled = true;
        document.getElementById('tutorial-next-btn').disabled = true;

        if (step.onBefore) {
            await step.onBefore();
        }

        const isReady = await waitForState(step.waitFor);

        if (!isReady) {
            console.error(`Tutorial failed to meet conditions for step ${index}. Aborting.`);
            alert("El tutorial no puede continuar porque un elemento esperado no apareció en la pantalla. Por favor, intente de nuevo.");
            skip();
            return;
        }

        const targetElement = document.querySelector(step.element) || document.body;

        smartScroll(targetElement);

        document.getElementById('tutorial-tooltip-title').textContent = step.title;
        document.getElementById('tutorial-tooltip-text').innerHTML = step.content;
        document.getElementById('tutorial-prev-btn').style.display = index === 0 ? 'none' : 'inline-block';
        document.getElementById('tutorial-next-btn').textContent = index === steps.length - 1 ? 'Finalizar' : 'Siguiente';
        document.getElementById('tutorial-tooltip-progress').textContent = `Paso ${index + 1} de ${steps.length}`;

        updateHighlight(targetElement, step);

        resizeObserver = new ResizeObserver(() => {
            updateHighlight(targetElement, step);
        });
        resizeObserver.observe(targetElement);
        if (targetElement !== document.body) {
            resizeObserver.observe(document.body);
        }

        // Re-enable navigation
        document.getElementById('tutorial-prev-btn').disabled = false;
        document.getElementById('tutorial-next-btn').disabled = false;
    };

    const navigate = async (direction) => {
        const nextButton = document.getElementById('tutorial-next-btn');
        const prevButton = document.getElementById('tutorial-prev-btn');
        nextButton.disabled = true;
        prevButton.disabled = true;

        const step = steps[currentStepIndex];

        if (direction > 0) { // Moving forward
            if (step.action) {
                await step.action();
            }
            await showStep(currentStepIndex + 1);
        } else { // Moving backward
            // This is simplified. A true "previous" would need to revert state.
            // For now, we just show the previous step's text.
            await showStep(currentStepIndex - 1);
        }
    };

    const smartScroll = (element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        if (!isVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const positionTooltip = (targetRect, position = 'bottom') => {
        const tooltipRect = dom.tooltip.getBoundingClientRect();
        const spacing = 10;
        let top, left;
        let finalPosition = position;

        if (position === 'right' && (targetRect.right + spacing + tooltipRect.width > window.innerWidth)) finalPosition = 'left';
        if (position === 'left' && (targetRect.left - spacing - tooltipRect.width < 0)) finalPosition = 'right';
        if (position === 'top' && (targetRect.top - spacing - tooltipRect.height < 0)) finalPosition = 'bottom';
        if (position === 'bottom' && (targetRect.bottom + spacing + tooltipRect.height > window.innerHeight)) finalPosition = 'top';
        if (position === 'center') {
             top = (window.innerHeight / 2) - (tooltipRect.height / 2);
             left = (window.innerWidth / 2) - (tooltipRect.width / 2);
        } else {
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
        }

        if (left < spacing) left = spacing;
        if (left + tooltipRect.width > window.innerWidth - spacing) left = window.innerWidth - tooltipRect.width - spacing;
        if (top < spacing) top = spacing;
        if (top + tooltipRect.height > window.innerHeight - spacing) top = window.innerHeight - tooltipRect.height - spacing;

        dom.tooltip.style.top = `${top}px`;
        dom.tooltip.style.left = `${left}px`;
    };

    const start = () => {
        if (isRunning) return;
        isRunning = true;
        steps = TUTORIAL_STEPS;
        createTutorialUI();
        dom.overlay.style.display = 'block';
        showStep(0);
    };

    const skip = () => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (dom.overlay) {
            dom.overlay.remove();
        }
        // Reset all DOM references
        for(const key in dom) {
            dom[key] = null;
        }
        isRunning = false;
        if (app && typeof app.onTutorialEnd === 'function') {
            app.onTutorialEnd();
        }
    };

    return { start, skip };
};

export default tutorial;
