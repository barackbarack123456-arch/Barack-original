import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate and Log In
        page.goto("http://localhost:8080/")
        page.wait_for_selector("#login-panel", state="visible")
        page.fill("#login-email", "f.santoro@barackmercosul.com")
        page.fill("#login-password", "$oof@k24")
        page.click("button[type='submit']")

        # Wait for the main app view to be visible
        expect(page.locator("#app-view")).to_be_visible(timeout=10000)

        # 2. Navigate to the new view
        # Click the ECO/ECR dropdown toggle
        page.locator("button.dropdown-toggle:has-text('ECO/ECR')").click()

        # Click the new link
        seguimiento_link = page.locator("a[data-view='seguimiento_ecr_eco']")
        expect(seguimiento_link).to_be_visible()
        seguimiento_link.click()

        # 3. Verify the list view and take screenshot
        expect(page.locator("h2:has-text('Listado de Fichas de Seguimiento')")).to_be_visible()
        # Wait for the table to be populated from Firestore
        expect(page.locator("tbody#fichas-list tr")).to_have_count(2, timeout=10000)
        page.screenshot(path="jules-scratch/verification/fichas_list_view.png")

        # 4. Navigate to the creation form and take screenshot
        page.locator("button#create-new-ficha-btn").click()
        expect(page.locator("h2:has-text('Listado de Fichas de Seguimiento')")).not_to_be_visible()
        expect(page.locator("div.ficha-header")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/ficha_creation_form.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
