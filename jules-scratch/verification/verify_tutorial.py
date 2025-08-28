import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate and Login
        page.goto("http://localhost:8080")

        expect(page.locator("#login-form")).to_be_visible(timeout=10000)
        page.locator("#login-email").fill("f.santoro@barackmercosul.com")
        page.locator("#login-password").fill("$oof@k24")
        page.get_by_role("button", name="Iniciar Sesión").click()

        # 2. Wait for app to load
        expect(page.locator("#view-title")).to_have_text("Dashboard", timeout=20000)

        # 3. Start the tutorial
        page.get_by_role("button", name="ECO/ECR").click()
        start_tutorial_button = page.get_by_role("link", name="Iniciar Tutorial")
        expect(start_tutorial_button).to_be_visible()
        start_tutorial_button.click()

        # 4. Verify the tutorial steps
        tutorial_tooltip = page.locator("#tutorial-tooltip")
        next_button = tutorial_tooltip.get_by_role("button", name="Siguiente")

        # Step 1: Welcome
        expect(tutorial_tooltip.get_by_role("heading")).to_have_text("Bienvenido al Tutorial de Gestión PRO", timeout=5000)
        next_button.click()

        # Step 2: Menu. The postAction for this step opens the dropdown.
        expect(tutorial_tooltip.get_by_role("heading")).to_have_text("Módulo ECO/ECR", timeout=5000)
        next_button.click()

        # Step 3: Go to ECR view. The postAction for this step switches the view.
        # The element for this step is now visible because the dropdown is open.
        expect(tutorial_tooltip.get_by_role("heading")).to_have_text("Gestión de ECR", timeout=5000)
        next_button.click()

        # Step 4: ECR Screen. The view should now have changed.
        expect(page.locator("#view-title")).to_have_text("Gestión de ECR", timeout=10000)
        expect(tutorial_tooltip.get_by_role("heading")).to_have_text("Pantalla de Gestión de ECR", timeout=5000)
        page.screenshot(path="jules-scratch/verification/verification_final.png")

        print("Playwright script executed successfully. Tutorial is fixed.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
