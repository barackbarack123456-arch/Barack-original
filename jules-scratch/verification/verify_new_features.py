import os
import re
from playwright.sync_api import sync_playwright, Page, expect

def run_test(page: Page):
    """
    This test verifies the implementation of sub-tasks and file attachments.
    It waits for the app to initialize before proceeding.
    """
    page.goto("http://localhost:8080")

    # --- Wait for the loading overlay to disappear, signaling the app is ready ---
    loading_overlay = page.locator("#loading-overlay")
    expect(loading_overlay).to_be_hidden(timeout=15000)

    # --- Registration ---
    email = f"test-jules-{os.urandom(4).hex()}@barackmercosul.com"
    password = "password123"

    # Now that the app is ready, the login panel should be visible.
    login_panel = page.locator("#login-panel")
    expect(login_panel).to_be_visible()

    # Click the 'Regístrate' link
    register_link = login_panel.get_by_role("link", name="Regístrate")
    register_link.click()

    # Fill out the registration form
    register_panel = page.locator("#register-panel")
    expect(register_panel).to_be_visible()
    register_panel.get_by_label("Nombre Completo").fill("Test Jules")
    register_panel.get_by_label("Correo de la empresa").fill(email)
    register_panel.get_by_label("Contraseña").fill(password)
    register_panel.get_by_role("button", name="Crear Cuenta y Verificar").click()

    # Wait for the verification panel and then click back to login
    expect(page.locator("#verify-email-panel")).to_be_visible(timeout=10000)
    page.get_by_role("link", name="Volver a Iniciar Sesión").click()

    # --- Login ---
    expect(login_panel).to_be_visible()
    login_panel.get_by_label("Correo electrónico").fill(email)
    login_panel.get_by_label("Contraseña").fill(password)
    login_panel.get_by_role("button", name="Iniciar Sesión").click()

    # Wait for the main application view to become visible
    expect(page.locator("#app-view")).to_be_visible(timeout=15000)

    # --- Test Sub-tasks and Attachments ---
    page.get_by_role("button", name=re.compile("Gestión")).click()
    page.get_by_role("link", name="Tareas").click()
    expect(page.locator("#view-title")).to_have_text("Gestor de Tareas")

    page.get_by_role("button", name="Nueva Tarea").click()
    modal = page.locator("#task-form-modal")
    expect(modal).to_be_visible()

    task_title = "Task with Sub-tasks & Attachments"
    modal.get_by_label("Título").fill(task_title)
    modal.get_by_label("Descripción").fill("Test description for the new features.")
    modal.get_by_role("button", name="Guardar Tarea").click()
    expect(modal).not_to_be_visible()

    page.get_by_text(task_title).first.click()
    expect(modal).to_be_visible()

    subtask_input = modal.locator("#new-subtask-title")
    subtask_input.fill("This is a sub-task")
    subtask_input.press("Enter")
    expect(modal.locator(".subtask-item")).to_have_text(re.compile("This is a sub-task"))

    dummy_file_path = os.path.abspath('jules-scratch/verification/dummy.txt')
    with page.expect_file_chooser() as fc_info:
        modal.locator('label[for="task-file-input"]').click()
    file_chooser = fc_info.value
    file_chooser.set_files(dummy_file_path)

    attachment_item = modal.locator(".attachment-item")
    expect(attachment_item).to_be_visible(timeout=20000)
    expect(attachment_item).to_have_text(re.compile("dummy.txt"))

    modal.get_by_role("button", name="Guardar Tarea").click()
    expect(modal).not_to_be_visible()

    task_card = page.locator(f".task-card:has-text('{task_title}')")
    expect(task_card).to_be_visible()

    expect(task_card.locator("text=Sub-tareas")).to_be_visible()
    expect(task_card.locator("text=0 / 1")).to_be_visible()

    attachment_indicator = task_card.get_by_title("1 adjunto(s)")
    expect(attachment_indicator).to_be_visible()
    expect(attachment_indicator).to_have_text("1")

    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_test(page)
        browser.close()

if __name__ == "__main__":
    main()
