import os
import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Main verification script to test all ECR-related fixes.
    """
    # Get the absolute path to the index.html file
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    index_path = os.path.join(base_dir, 'public', 'index.html')

    # Use 'file://' protocol to open the local file
    page.goto(f'file://{index_path}')

    # 1. --- Login ---
    print("Logging in...")
    page.wait_for_selector("#login-panel", state="visible")
    page.get_by_label("Email").fill("test.admin@barack.com")
    page.get_by_label("Password").fill("123456")
    page.get_by_role("button", name="Iniciar Sesión").click()

    # Wait for the main dashboard to load
    expect(page.get_by_role("heading", name="Bienvenido, Test Admin"))

    # 2. --- Verify Control Panel Tutorial Fix ---
    print("Verifying Control Panel Tutorial fix...")
    # Navigate to the Control Panel
    page.get_by_role("button", name="ECR/ECO").click()
    page.get_by_role("link", name="Panel de Control").click()
    expect(page.get_by_role("heading", name="Panel de Control")).to_be_visible()

    # Start the tutorial
    page.get_by_role("button", name="Tutorial").click()

    # The tutorial should now automatically seed data and progress.
    # We'll just click through the steps.
    expect(page.get_by_text("Bienvenido al tutorial del Panel de Control")).to_be_visible()
    page.get_by_role("button", name="Siguiente").click()

    expect(page.get_by_text("Esta es la Tabla de Control ECR")).to_be_visible()
    page.get_by_role("button", name="Siguiente").click()

    expect(page.get_by_text("Estos son los Indicadores de ECM")).to_be_visible()
    page.get_by_role("button", name="Siguiente").click()

    expect(page.get_by_text("Aquí se encuentra el Seguimiento y Métricas")).to_be_visible()
    page.get_by_role("button", name="Siguiente").click()

    # Final step of the tutorial
    expect(page.get_by_text("¡Tutorial completado!")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/01_tutorial_fix.png")
    print("Screenshot 1: Tutorial fix verified.")
    page.get_by_role("button", name="Finalizar").click()


    # 3. --- Verify ECR Form and Approval Fix (`data-department-id`) ---
    print("Verifying ECR Form and Approval fix...")
    # Navigate to ECR list
    page.get_by_role("button", name="ECR/ECO").click()
    page.get_by_role("link", name="Gestión de ECR").click()
    expect(page.get_by_role("heading", name="Planilla General de ECR")).to_be_visible()

    # Create a new ECR
    page.get_by_role("button", name="Crear Nuevo ECR").click()
    expect(page.get_by_text("CHECK LIST ECR - ENGINEERING CHANGE REQUEST")).to_be_visible()

    ecr_id = f"ECR-VERIFY-{page.evaluate('() => Date.now()')}"
    page.locator('input[name="ecr_no"]').fill(ecr_id)
    page.locator('input[name="proyecto"]').fill("Proyecto de Verificación")
    page.locator('input[name="cliente"]').fill("Cliente de Prueba")
    page.locator('input[name="fecha_emision"]').fill("2024-01-01")
    page.locator('textarea[name="situacion_propuesta"]').fill("Situación propuesta para la prueba de verificación.")

    # Save progress
    page.get_by_role("button", name="Guardar Progreso").click()

    # Re-open the ECR to check the approval logic
    page.get_by_role("button", name=re.compile(r"Ver/Editar")).first.click()

    # Find the 'Calidad' department section and approve it
    calidad_section = page.locator('.department-section[data-department-id="calidad"]')
    expect(calidad_section).to_be_visible()

    # Before approval, the inputs should be enabled
    expect(calidad_section.get_by_label("AFECTA DIMENSIONAL CLIENTE?")).to_be_enabled()

    # Approve the section
    calidad_section.get_by_role("button", name="Aprobar").click()

    # Wait for the approval to register and the form to refresh
    expect(page.get_by_text(f"Decisión del departamento de calidad registrada.")).to_be_visible()

    # The page reloads, so we need to find the section again
    calidad_section = page.locator('.department-section[data-department-id="calidad"]')

    # Now, the inputs should be disabled
    expect(calidad_section.get_by_label("AFECTA DIMENSIONAL CLIENTE?")).to_be_disabled()
    print("ECR Approval and form disabling verified.")

    # 4. --- Verify `ecrData is not defined` fix ---
    print("Verifying `ecrData` ReferenceError fix...")
    # To test this, we need to approve the ECR fully and then generate an ECO.
    # For simplicity, we will manually set the ECR status to 'approved' via the UI.
    page.get_by_role("button", name="Aprobar y Guardar").click()
    page.get_by_text(re.compile(r"¿Está seguro de que desea aprobar y guardar este ECR\?")).to_be_visible()
    page.get_by_role("button", name="Confirmar").click()

    # Go back to the ECR list
    expect(page.get_by_role("heading", name="Planilla General de ECR")).to_be_visible()

    # Find our newly created ECR and click "Generate ECO"
    page.locator(f'tr:has-text("{ecr_id}")').get_by_role("button", name="Generar ECO desde este ECR").click()

    # The original bug would have thrown an error here.
    # We expect to see the ECO form loaded correctly.
    expect(page.get_by_role("heading", name="ECO DE PRODUCTO / PROCESO")).to_be_visible()

    # Verify the ECR number is pre-filled in the ECO form
    expect(page.locator('input[name="ecr_no"]')).to_have_value(ecr_id)

    page.screenshot(path="jules-scratch/verification/02_ecr_flow_fix.png")
    print("Screenshot 2: ECR flow and ReferenceError fix verified.")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
