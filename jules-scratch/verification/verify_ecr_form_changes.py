import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the changes made to the ECR form.
    - ECR number is auto-generated and read-only.
    - UI elements are in Spanish.
    """
    # Listen for all console events and print them
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

    # The application is now served over HTTP.
    # The '?verification=true' parameter bypasses the login screen without starting the tutorial.
    page.goto("http://localhost:8000/?verification=true")

    # Wait for the app to load (the loading overlay to disappear)
    loading_overlay = page.locator("#loading-overlay")
    expect(loading_overlay).to_be_hidden(timeout=30000)

    # 1. Navigate to the ECR creation form
    # The dropdown menu for ECR/ECO needs to be clicked first.
    ecr_eco_menu_button = page.locator('button.nav-link:has-text("ECR/ECO")')
    expect(ecr_eco_menu_button).to_be_visible()
    ecr_eco_menu_button.click()

    # Click the "ECR" link within the dropdown
    ecr_link = page.locator('a.nav-link[data-view="ecr"]:has-text("ECR")')
    expect(ecr_link).to_be_visible()
    ecr_link.click()

    # Click the "Crear Nuevo ECR" button
    # The button text itself is a good verification of the translation change.
    create_ecr_button = page.locator('button[data-action="create-new-ecr"]')
    expect(create_ecr_button).to_be_visible()
    create_ecr_button.click()

    # 2. Verify the ECR form
    # Wait for the form to appear by checking for its title
    form_title = page.locator('.ecr-main-title')
    expect(form_title).to_have_text("ECR")

    subtitle = page.locator('.ecr-subtitle')
    expect(subtitle).to_have_text("DE PRODUCTO / PROCESO")

    # The ECR number input field
    ecr_number_input = page.locator('input[name="ecr_no"]')

    # Assert that the input is read-only
    expect(ecr_number_input).not_to_be_editable()

    # Assert that the input has an auto-generated value
    # The value should be in the format ECR-YYYY-NNN
    # We use a regular expression to match the expected format.
    # We also give it a longer timeout because it depends on a network call to the Firebase function.
    expect(ecr_number_input).to_have_value(re.compile(r"ECR-\d{4}-\d{3}"), timeout=15000)

    # 3. Take a screenshot for visual confirmation
    page.screenshot(path="jules-scratch/verification/ecr_form_verified.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
