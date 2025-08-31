import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the fixes for the ECR Seguimiento y Metricas view
    with the corrected navigation path and extra waits.
    """
    # 1. Navigate and Log in
    page.goto("http://localhost:8080")

    login_panel = page.locator("#login-panel")
    login_panel.get_by_label("Correo electrónico").fill("f.santoro@barackmercosul.com")
    login_panel.get_by_label("Contraseña").fill("$oof@k24")
    login_panel.get_by_role("button", name="Iniciar Sesión").click()

    # 2. Navigate to the correct view via the Control Panel
    expect(page.locator("#app-view")).to_be_visible(timeout=10000)

    # Click on the "ECR/ECO" dropdown
    page.get_by_role("button", name="ECR/ECO").click()

    # Use a more stable locator and add a small manual wait for animations
    panel_de_control_link = page.locator('[data-view="control_ecrs"]')
    expect(panel_de_control_link).to_be_visible(timeout=5000)
    panel_de_control_link.click()

    expect(page.locator("#view-title", has_text="Panel de Control")).to_be_visible(timeout=10000)

    # Click on the "Seguimiento y Métricas" card
    page.get_by_role("a", name="Seguimiento y Métricas").click()

    # 3. Wait for the view to load
    expect(page.locator("#view-title", has_text="Seguimiento y Métricas de ECR")).to_be_visible(timeout=10000)

    # Wait for the attendance matrix to be populated by data
    expect(page.locator("#asistencia-matriz-container").get_by_role("button")).to_contain_text(["P"], timeout=15000)

    # Verification Step 1: Check if titles are centered
    h3_elements = page.locator("#ecr-log-section h3, #asistencia-matriz-section h3, #resumen-graficos-section h3")
    for i in range(h3_elements.count()):
        expect(h3_elements.nth(i)).to_have_class(re.compile(r".*text-center.*"))

    # Verification Step 2: Check if an empty attendance cell is clickable and changes state
    empty_buttons = page.locator('.asistencia-matriz-table button:text-is("")')
    if empty_buttons.count() > 0:
        first_empty_button = empty_buttons.first
        expect(first_empty_button).to_be_visible()
        first_empty_button.click()
        expect(first_empty_button).to_have_text("P")
        first_empty_button.click()
        expect(first_empty_button).to_have_text("A")

    # Verification Step 3: Check if a pendencia cell is clickable and changes state
    pendencia_buttons = page.locator('button[data-action="toggle-pendencia-status"]:text-is("")')
    if pendencia_buttons.count() > 0:
        first_pendencia_button = pendencia_buttons.first
        expect(first_pendencia_button).to_be_visible()
        first_pendencia_button.click()
        expect(first_pendencia_button).to_have_text("OK")
        first_pendencia_button.click()
        expect(first_pendencia_button).to_have_text("NOK")

    # Take a screenshot *after* performing actions
    page.screenshot(path="jules-scratch/verification/ecr_fixes_verified.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
