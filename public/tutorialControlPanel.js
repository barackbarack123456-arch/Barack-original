/**
 * Interactive Tutorial Module for the Control Panel
 *
 * This module creates a guided tour for users to understand the unified dashboard.
 */
const tutorialControlPanel = (app) => {
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
            title: 'Bienvenido al Tour del Panel de Control',
            content: 'Este tutorial te guiará a través de los componentes del nuevo Panel de Control unificado. ¡Empecemos!',
            position: 'center'
        },
        {
            element: '#kpi-section',
            title: 'Indicadores Clave de Rendimiento (KPIs)',
            content: 'Esta sección te da una vista rápida de los números más importantes: ECRs abiertos y aprobados, y ECOs en progreso e implementados.',
            position: 'bottom'
        },
        {
            element: '#charts-section',
            title: 'Gráficos de Estado',
            content: 'Estos gráficos muestran la distribución actual de todos los ECRs y ECOs por su estado. Es útil para ver el balance general del proceso de cambios.',
            position: 'top'
        },
        {
            element: '#ecr-log-section',
            title: 'Registro de ECR y Firmas',
            content: 'Aquí se puede ver el estado de las firmas de cada departamento para cada ECR. Un administrador puede hacer clic en una celda para registrar una firma.',
            position: 'top'
        },
        {
            element: '#asistencia-matriz-section',
            title: 'Matriz de Asistencia',
            content: 'Esta tabla registra la asistencia (Presente, Ausente, Opcional) de cada departamento a las reuniones de seguimiento de ECR. Ayuda a identificar cuellos de botella por falta de participación.',
            position: 'top'
        },
        {
            element: '#resumen-graficos-section',
            title: 'Análisis de Ausentismo',
            content: 'Finalmente, estos gráficos resumen los datos de la matriz de asistencia, mostrando los días totales y el porcentaje de ausentismo por departamento.',
            position: 'top'
        },
        {
            element: 'body',
            title: '¡Fin del Tour!',
            content: '¡Excelente! Ahora conoces todos los componentes del Panel de Control. Úsalo para tener una visión completa y actualizada del proceso de gestión de cambios.',
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
            try {
                await previous();
            } finally {
                prevBtn.disabled = false;
            }
        });

        const nextBtn = document.getElementById('tutorial-next-btn');
        nextBtn.addEventListener('click', async () => {
            nextBtn.disabled = true;
            try {
                await next();
            } finally {
                nextBtn.disabled = false;
            }
        });
    };

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

        if (dom.tooltip) {
            dom.tooltip.classList.remove('is-waiting');
            const content = dom.tooltip.querySelector('#tutorial-tooltip-content');
            const nav = dom.tooltip.querySelector('#tutorial-tooltip-nav');
            if (content) content.style.visibility = 'visible';
            if (nav) nav.style.visibility = 'visible';
        }

        if (step.preAction) {
            await step.preAction();
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const targetElement = await waitForVisibleElement(step.element, 7000);

        if (!targetElement) {
            if (dom.tooltip) {
                const titleEl = document.getElementById('tutorial-tooltip-title');
                const textEl = document.getElementById('tutorial-tooltip-text');
                if(titleEl) titleEl.textContent = 'Elemento no encontrado';
                if(textEl) textEl.innerHTML = `No se pudo encontrar el elemento: <code class="text-xs bg-red-100 p-1 rounded">${step.element}</code>. Omitiendo este paso.`;
                dom.tooltip.classList.add('is-waiting');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            next();
            return;
        }

        if (dom.tooltip) dom.tooltip.classList.remove('is-waiting');

        smartScroll(targetElement);

        setTimeout(() => {
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

            resizeObserver = new ResizeObserver(() => {
                updateHighlight(targetElement, step);
            });
            resizeObserver.observe(targetElement);
            resizeObserver.observe(document.body);

            scrollHandler = () => updateHighlight(targetElement, step);
            window.addEventListener('scroll', scrollHandler, true);
        }, 0);
    };

    const smartScroll = (element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isVisible) {
            element.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    };

    const positionTooltip = (targetRect, position = 'bottom') => {
        const tooltipRect = dom.tooltip.getBoundingClientRect();
        const spacing = 10;
        let top, left;

        let finalPosition = position;

        if (position === 'right' && (targetRect.right + spacing + tooltipRect.width > window.innerWidth)) {
            finalPosition = 'left';
        }
        if (position === 'left' && (targetRect.left - spacing - tooltipRect.width < 0)) {
            finalPosition = 'right';
        }
        if (position === 'top' && (targetRect.top - spacing - tooltipRect.height < 0)) {
            finalPosition = 'bottom';
        }
        if (position === 'bottom' && (targetRect.bottom + spacing + tooltipRect.height > window.innerHeight)) {
            finalPosition = 'top';
        }

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
        if (left + tooltipRect.width > window.innerWidth - spacing) left = window.innerWidth - tooltipRect.width - spacing;
        if (top < spacing) top = spacing;
        if (top + tooltipRect.height > window.innerHeight - spacing) top = window.innerHeight - tooltipRect.height - spacing;

        dom.tooltip.style.top = `${top}px`;
        dom.tooltip.style.left = `${left}px`;
    };

    const start = () => {
        if (dom.overlay) return;

        steps = TUTORIAL_STEPS;

        createTutorialUI();
        dom.overlay.style.display = 'block';
        showStep(0);
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

export default tutorialControlPanel;
