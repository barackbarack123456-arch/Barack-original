/**
 * Interactive Tutorial Module for the ECR/ECO Control Panel
 *
 * This module creates a guided tour for users to understand the control panel's features.
 * It has been refactored for stability and robustness.
 */
const controlPanelTutorial = (app) => {
    let currentStepIndex = 0;
    let steps = [];

    const dom = {
        overlay: null,
        tooltip: null,
        highlight: null,
    };

    // All tutorial steps are defined here for clarity and easier maintenance.
    // Refactored to use stable data-tutorial-id selectors and a simpler preAction/postAction flow.
    const TUTORIAL_STEPS = [
        {
            element: '[data-tutorial-id="control-panel-card-table"]',
            title: 'Tabla de Control ECR',
            content: 'Aquí encontrarás una vista detallada de todos los ECRs. Es ideal para hacer un seguimiento exhaustivo.',
            position: 'top',
            preAction: async () => await app.switchView('control_ecrs'),
        },
        {
            element: '[data-tutorial-id="ecr-table-view-container"]',
            title: 'Vista de Tabla',
            content: 'Esta es la tabla de control. Puedes desplazarte horizontalmente para ver todos los datos y usar los filtros para encontrar ECRs específicos.',
            position: 'center',
            preAction: async () => await app.switchView('ecr_table_view'),
        },
        {
            element: '[data-tutorial-id="control-panel-card-indicators"]',
            title: 'Indicadores ECM',
            content: 'Ahora, exploremos los indicadores. Este es el dashboard de KPIs para ECRs y ECOs.',
            position: 'top',
            preAction: async () => await app.switchView('control_ecrs'),
        },
        {
            element: '[data-tutorial-id="indicadores-ecm-view-container"]',
            title: 'Dashboard de Indicadores',
            content: 'Aquí puedes analizar el rendimiento del proceso de gestión de cambios con gráficos y KPIs.',
            position: 'center',
            preAction: async () => await app.switchView('indicadores_ecm_view'),
        },
        {
            element: '[data-tutorial-id="control-panel-card-metrics"]',
            title: 'Seguimiento y Métricas',
            content: 'Finalmente, veamos el seguimiento de reuniones. Es clave para el seguimiento del equipo.',
            position: 'top',
            preAction: async () => await app.switchView('control_ecrs'),
        },
        {
            element: '[data-tutorial-id="ecr-seguimiento-view-container"]',
            title: 'Registro y Asistencia',
            content: 'En esta sección, puedes registrar la asistencia a las reuniones de ECR y ver gráficos de ausentismo.',
            position: 'center',
            preAction: async () => await app.switchView('ecr_seguimiento'),
        },
        {
            element: 'body',
            title: '¡Fin del Tutorial!',
            content: 'Ahora conoces las principales herramientas del Panel de Control. Úsalas para tener una visión completa y gestionar eficientemente los cambios de ingeniería.',
            position: 'center',
            preAction: async () => await app.switchView('control_ecrs'),
        }
    ];

    /**
     * Creates the main DOM elements for the tutorial (overlay, highlight, tooltip).
     */
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
        document.getElementById('tutorial-prev-btn').addEventListener('click', previous);
        document.getElementById('tutorial-next-btn').addEventListener('click', next);
    };

    /**
     * Waits for an element to be visible in the DOM.
     * This is a robust version copied from the main tutorial.js.
     */
    const waitForVisibleElement = (selector, timeout = 7000) => {
        return new Promise(resolve => {
            if (selector === 'body' && document.body) {
                resolve(document.body);
                return;
            }

            const interval = 100;
            let elapsedTime = 0;

            let originalTitle, originalText;
            if (dom.tooltip) {
                originalTitle = document.getElementById('tutorial-tooltip-title')?.textContent;
                originalText = document.getElementById('tutorial-tooltip-text')?.innerHTML;
            }

            const showWaitingMessage = () => {
                if (!dom.tooltip) return;
                const titleEl = document.getElementById('tutorial-tooltip-title');
                const textEl = document.getElementById('tutorial-tooltip-text');
                if (titleEl) titleEl.textContent = 'Buscando Elemento...';
                if (textEl) textEl.innerHTML = `Esperando que aparezca el siguiente elemento: <code class="text-xs bg-slate-200 p-1 rounded">${selector}</code>`;
                dom.tooltip.classList.add('is-waiting');
            };

            const hideWaitingMessage = () => {
                if (!dom.tooltip) return;
                const titleEl = document.getElementById('tutorial-tooltip-title');
                const textEl = document.getElementById('tutorial-tooltip-text');
                if (titleEl) titleEl.textContent = originalTitle;
                if (textEl) textEl.innerHTML = originalText;
                dom.tooltip.classList.remove('is-waiting');
            };

            const isElementVisible = (el) => {
                if (!el) return false;
                if (el.offsetParent === null) return false;
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }

            const waitingTimeout = setTimeout(showWaitingMessage, 250);

            const timer = setInterval(() => {
                const element = document.querySelector(selector);
                if (isElementVisible(element)) {
                    clearTimeout(waitingTimeout);
                    clearInterval(timer);
                    hideWaitingMessage();
                    resolve(element);
                } else {
                    elapsedTime += interval;
                    if (elapsedTime >= timeout) {
                        clearTimeout(waitingTimeout);
                        clearInterval(timer);
                        hideWaitingMessage();
                        resolve(null);
                    }
                }
            }, interval);
        });
    };

    let resizeObserver = null;
    let scrollHandler = null;

    const updateHighlight = (targetElement, step) => {
        if (!targetElement || !dom.highlight) return;

        const targetRect = targetElement.getBoundingClientRect();
        const padding = 5;
        const offset = step.offset || { top: 0, left: 0 };

        dom.highlight.style.width = `${targetRect.width + (padding * 2)}px`;
        dom.highlight.style.height = `${targetRect.height + (padding * 2)}px`;
        dom.highlight.style.top = `${targetRect.top - padding + (offset.top || 0)}px`;
        dom.highlight.style.left = `${targetRect.left - padding + (offset.left || 0)}px`;

        positionTooltip(targetRect, step.position);
    };

    const showStep = async (index) => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (scrollHandler) {
            window.removeEventListener('scroll', scrollHandler, true);
            scrollHandler = null;
        }

        if (index < 0 || index >= steps.length) {
            skip();
            return;
        }

        currentStepIndex = index;
        const step = steps[index];

        if (step.preAction) {
            await step.preAction();
        }

        const targetElement = await waitForVisibleElement(step.element);

        if (!targetElement) {
            app.showToast(`Elemento del tutorial no encontrado: ${step.element}. Saltando paso.`, 'error');
            console.warn(`Tutorial element not found: ${step.element}`);
            await next();
            return;
        }

        if (dom.tooltip) dom.tooltip.classList.remove('is-waiting');

        await smartScroll(targetElement);

        setTimeout(() => {
            document.getElementById('tutorial-tooltip-title').textContent = step.title;
            document.getElementById('tutorial-tooltip-text').innerHTML = step.content;
            document.getElementById('tutorial-prev-btn').style.display = index === 0 ? 'none' : 'inline-block';
            document.getElementById('tutorial-next-btn').textContent = index === steps.length - 1 ? 'Finalizar' : 'Siguiente';
            document.getElementById('tutorial-tooltip-progress').textContent = `Paso ${index + 1} de ${steps.length}`;

            updateHighlight(targetElement, step);

            resizeObserver = new ResizeObserver(() => updateHighlight(targetElement, step));
            resizeObserver.observe(targetElement);
            resizeObserver.observe(document.body);

            scrollHandler = () => updateHighlight(targetElement, step);
            window.addEventListener('scroll', scrollHandler, true);
        }, 0);
    };

    const smartScroll = async (element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Wait for smooth scroll to finish. This is a trade-off for better UX.
            await new Promise(resolve => setTimeout(resolve, 500));
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

        if (left < spacing) left = spacing;
        if (top < spacing) top = spacing;
        if (left + tooltipRect.width > window.innerWidth - spacing) left = window.innerWidth - tooltipRect.width - spacing;
        if (top + tooltipRect.height > window.innerHeight - spacing) top = window.innerHeight - tooltipRect.height - spacing;

        dom.tooltip.style.top = `${top}px`;
        dom.tooltip.style.left = `${left}px`;
    };

    const start = async () => {
        if (dom.overlay) return;
        steps = TUTORIAL_STEPS;
        createTutorialUI();
        dom.overlay.style.display = 'block';
        await showStep(0);
    };

    const next = async () => {
        const step = steps[currentStepIndex];
        if (step && step.postAction) {
            await step.postAction();
        }
        await showStep(currentStepIndex + 1);
    };

    const previous = async () => {
        await showStep(currentStepIndex - 1);
    };

    const skip = () => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (scrollHandler) {
            window.removeEventListener('scroll', scrollHandler, true);
            scrollHandler = null;
        }
        if (dom.overlay) {
            dom.overlay.remove();
            dom.overlay = null;
            dom.tooltip = null;
            dom.highlight = null;
        }
        if (app && typeof app.onTutorialEnd === 'function') {
            app.onTutorialEnd();
        }
    };

    return {
        start,
        skip,
    };
};

export default controlPanelTutorial;
