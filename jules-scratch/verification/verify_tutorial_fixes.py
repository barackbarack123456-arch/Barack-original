import os
import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

    try:
        # Go to the local server URL
        page.goto('http://localhost:3000')

        # Wait for the main loading overlay to disappear
        expect(page.locator("#loading-overlay")).to_be_hidden(timeout=15000)

        # Wait for the app to load and login screen to be visible
        expect(page.locator("#login-panel")).to_be_visible(timeout=10000)

        # Credentials from AGENTS.md
        page.locator("#login-email").fill("f.santoro@barackmercosul.com")
        page.locator("#login-password").fill("$oof@k24")
        page.locator("#login-form button[type='submit']").click()

        # Wait for the main app view to be visible
        expect(page.locator("#app-view")).to_be_visible(timeout=10000)

        # Start the tutorial
        page.locator('[data-tutorial-id="eco-ecr-menu"] button').click()
        page.locator('a#start-tutorial-btn').click()

        # Wait for the tutorial to start
        expect(page.locator("#tutorial-overlay")).to_be_visible()

        # --- Navigate to the PPAP step ---
        # This requires clicking through many steps. We'll find a balance between speed and reliability.
        # Let's find the "Next" button and click it repeatedly.
        next_button = page.locator('#tutorial-next-btn')

        # Navigate until we find the PPAP step
        ppap_step_title = page.locator("#tutorial-tooltip-title")
        for _ in range(20): # Max 20 steps to prevent infinite loop
            title_text = ppap_step_title.inner_text()
            if "Verificación de Pasos Críticos" in title_text:
                break
            expect(next_button).to_be_enabled(timeout=10000)
            next_button.click()
            page.wait_for_timeout(500)

        expect(ppap_step_title).to_have_text(re.compile("Verificación de Pasos Críticos"))
        page.screenshot(path="jules-scratch/verification/01_ppap_step_verified.png")

        # Navigate until we find the "Add Task" step
        add_task_step_title = page.locator("#tutorial-tooltip-title")
        for _ in range(5): # Max 5 more steps
            title_text = add_task_step_title.inner_text()
            if "Añadir Tareas al Plan" in title_text:
                break
            expect(next_button).to_be_enabled(timeout=10000)
            next_button.click()
            page.wait_for_timeout(500)

        expect(add_task_step_title).to_have_text(re.compile("Añadir Tareas al Plan"))

        # Take a screenshot of the consolidated "Add Task" step
        page.screenshot(path="jules-scratch/verification/02_add_task_step_verified.png")

        print("Verification script completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)
