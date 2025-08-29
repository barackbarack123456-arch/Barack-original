import { chromium } from 'playwright';
import assert from 'assert';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        console.log('Navigating to the application...');
        await page.goto('http://localhost:8080');

        console.log('Waiting for login form...');
        await page.waitForSelector('#login-form', { timeout: 15000 });

        console.log('Logging in...');
        await page.fill('#login-email', 'f.santoro@barackmercosul.com');
        await page.fill('#login-password', '$oof@k24');
        await page.click('button[type="submit"]');

        console.log('Waiting for app view to be visible...');
        await page.waitForSelector('#app-view:not(.hidden)', { timeout: 15000 });
        console.log('Login successful.');

        console.log('Opening the ECO/ECR dropdown menu...');
        await page.click('[data-tutorial-id="eco-ecr-menu"] button');

        console.log('Waiting for the "Iniciar Tutorial" button...');
        const startTutorialButton = await page.waitForSelector('#start-tutorial-btn', { timeout: 5000 });

        console.log('Starting the tutorial...');
        await startTutorialButton.click();

        console.log('Waiting for the tutorial overlay to appear...');
        await page.waitForSelector('#tutorial-overlay', { state: 'visible', timeout: 5000 });
        console.log('Tutorial started successfully.');

        // --- Verification Step 1: Check for improved UI (progress indicator) ---
        console.log('Verifying Step 1: Checking for progress indicator...');
        await page.waitForSelector('#tutorial-tooltip-progress', { timeout: 2000 });
        const progressText = await page.textContent('#tutorial-tooltip-progress');
        assert.strictEqual(progressText, 'Paso 1 de 14', `Expected 'Paso 1 de 14' but got '${progressText}'`);
        console.log('Progress indicator found and correct.');

        // Take a screenshot of the first step to show the new UI
        const screenshotPath = 'public/tutorial_step1_verified.png';
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to ${screenshotPath}`);

        // --- Verification Step 2: Navigate through a few steps ---
        console.log('Navigating to step 2...');
        await page.click('#tutorial-next-btn');
        await page.waitForSelector('.nav-dropdown.open', { timeout: 2000 }); // Wait for menu to open

        console.log('Navigating to step 3...');
        await page.click('#tutorial-next-btn');
        await page.waitForSelector('a[data-view="ecr"].tutorial-click-effect', { timeout: 2000 });

        console.log('Navigating to step 4...');
        await page.click('#tutorial-next-btn');
        // Wait for the tutorial to advance to the correct step
        await page.waitForFunction(() => document.getElementById('tutorial-tooltip-progress')?.textContent === 'Paso 4 de 14', { timeout: 5000 });
        const finalProgressText = await page.textContent('#tutorial-tooltip-progress');
        assert.strictEqual(finalProgressText, 'Paso 4 de 14', `Expected 'Paso 4 de 14' but got '${finalProgressText}'`);
        console.log('Successfully navigated a few steps.');

        console.log('Frontend verification successful!');

    } catch (error) {
        console.error('Verification failed:', error);
        // Take a screenshot on error for debugging
        await page.screenshot({ path: 'public/error_screenshot.png' });
        throw error; // Re-throw the error to fail the process
    } finally {
        await browser.close();
    }
})();
