import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import http from 'http';
import handler from 'serve-handler';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = 'localhost';
const APP_URL = `http://${HOST}:${PORT}/public/`;

const serveApp = () => {
    const server = http.createServer((request, response) => {
        return handler(request, response, {
            public: path.resolve(__dirname, '.')
        });
    });
    return new Promise(resolve => {
        server.listen(PORT, HOST, () => {
            console.log(`Running server at ${APP_URL}`);
            resolve(server);
        });
    });
};

(async () => {
    const server = await serveApp();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let errorOccurred = false;

    // Capture console logs from the browser page
    page.on('console', msg => {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    try {
        console.log('Navigating to the app...');
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // Wait for the app to initialize and for the user to be logged in.
        // Increased timeout and added more specific logging.
        console.log('Waiting for app view to become visible...');
        await page.waitForSelector('#app-view:not(:empty)', { timeout: 30000 });
        await page.waitForSelector('#user-menu-button', { timeout: 10000 });
        console.log('App loaded and user is logged in.');

        // Navigate to the Control Panel and then to the ECR Table View
        console.log('Navigating to Control Panel...');
        await page.click('a[data-view="control_ecrs"]');
        await page.waitForSelector('h2:has-text("Panel de Control")');

        console.log('Navigating to ECR Table View...');
        await page.click('a[data-view="ecr_table_view"]');
        await page.waitForSelector('h1:has-text("Tabla de Control ECR")');
        console.log('ECR Table View loaded.');

        // Wait for the table to be populated
        await page.waitForSelector('#ecr-control-table-body tr', { timeout: 10000 });
        console.log('Table is populated.');

        // --- 1. Test Initial State ---
        console.log('Testing initial filter state...');
        const initialRowCount = await page.locator('#ecr-control-table-body tr').count();
        expect(initialRowCount).toBeGreaterThan(5); // Should have several rows initially
        const indicatorText = await page.textContent('#active-filters-indicator');
        expect(indicatorText).toBe('No hay filtros activos');

        // --- 2. Test Text Filter ---
        console.log('Testing text search filter...');
        await page.fill('#ecr-control-search', 'PROD-001');
        await page.waitForTimeout(500); // Wait for filtering
        let filteredRowCount = await page.locator('#ecr-control-table-body tr').count();
        expect(filteredRowCount).toBeLessThan(initialRowCount);
        const indicatorTextAfterSearch = await page.textContent('#active-filters-indicator');
        expect(indicatorTextAfterSearch).toBe('1 filtro(s) activo(s)');

        // --- 3. Test Clear Filters Button ---
        console.log('Testing "Clear Filters" button...');
        await page.click('#clear-filters-btn');
        await page.waitForTimeout(500);
        const clearedRowCount = await page.locator('#ecr-control-table-body tr').count();
        expect(clearedRowCount).toBe(initialRowCount);
        const indicatorTextAfterClear = await page.textContent('#active-filters-indicator');
        expect(indicatorTextAfterClear).toBe('No hay filtros activos');
        const searchInputValue = await page.inputValue('#ecr-control-search');
        expect(searchInputValue).toBe('');

        // --- 4. Test Combined Filters ---
        console.log('Testing combined filters (Status and Type)...');
        await page.selectOption('#ecr-status-filter', 'approved');
        await page.selectOption('#ecr-type-filter', 'producto');
        await page.waitForTimeout(500);
        const combinedFilterCount = await page.locator('#ecr-control-table-body tr').count();
        expect(combinedFilterCount).toBeLessThan(initialRowCount);
        const indicatorTextAfterCombined = await page.textContent('#active-filters-indicator');
        expect(indicatorTextAfterCombined).toBe('2 filtro(s) activo(s)');

        // --- 5. Take Responsive Screenshots ---
        console.log('Taking responsive screenshots...');

        // Desktop Screenshot
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.screenshot({ path: 'ecr_filters_ux_desktop.png', fullPage: true });
        console.log('Desktop screenshot saved as ecr_filters_ux_desktop.png');

        // Mobile Screenshot
        await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro
        await page.screenshot({ path: 'ecr_filters_ux_mobile.png', fullPage: true });
        console.log('Mobile screenshot saved as ecr_filters_ux_mobile.png');

        console.log('✅ All UX tests passed!');

    } catch (error) {
        console.error('An error occurred during Playwright tests:', error);
        // Log the page content on failure for debugging
        const pageContent = await page.content();
        console.log('--- Page content on failure ---');
        console.log(pageContent);
        console.log('-----------------------------');
        await page.screenshot({ path: 'error_screenshot.png' });
        errorOccurred = true;
    } finally {
        await browser.close();
        server.close();
        console.log('Server stopped.');
        if (errorOccurred) {
            process.exit(1);
        }
    }
})();
