import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 1. Navigate and log in
        await page.goto("http://localhost:8080")
        await expect(page.locator("#loading-overlay")).to_be_hidden(timeout=10000)
        await page.locator("#login-panel").get_by_label("Correo Electrónico").fill("admin@barack.com")
        await page.locator("#login-panel").get_by_label("Contraseña").fill("123456")
        await page.get_by_role("button", name="Iniciar Sesión").click()

        # Wait for post-login loading to finish
        await expect(page.locator("#loading-overlay")).to_be_hidden(timeout=20000)
        print("Login successful.")

        # 2. Seed the database to ensure data exists for the test
        await expect(page.locator("#dashboard-admin-panel-container")).to_be_visible(timeout=10000)
        print("Admin panel visible.")

        # Click the seed button
        await page.get_by_role("button", name="Poblar Base de Datos").click()

        # Handle the confirmation modal
        await expect(page.locator("text=Limpiar y Cargar Datos")).to_be_visible()
        await page.get_by_role("button", name="Confirmar").click()
        print("Database seeding confirmed.")

        # Wait for seeding to complete by looking for the success toast and then its disappearance
        success_toast = page.get_by_text("Carga masiva completada.")
        await expect(success_toast).to_be_visible(timeout=20000)
        await expect(success_toast).to_be_hidden(timeout=10000)
        print("Database seeding complete.")

        # The app should now be on the dashboard with data.
        await expect(page.locator("#kpi-productos")).to_be_visible(timeout=10000)
        print("Dashboard loaded with data.")

        # 3. Navigate to the Seguimiento ECR/ECO view
        await page.get_by_role("link", name="Seguimiento ECR/ECO").click()

        # 4. Wait for the view to load and the table to be populated
        await expect(page.locator("#view-title")).to_have_text("Seguimiento ECR/ECO")
        fichas_list = page.locator("#fichas-list")
        await expect(fichas_list.locator("tr")).to_have_count(2, timeout=15000) # Increased timeout
        print("Fichas list loaded.")

        # 5. Click the "View" button on the first ficha
        view_button = page.locator('button[data-action="view-ficha"]').first
        await view_button.click()
        print("View button clicked.")

        # 6. Verify the read-only form is displayed
        await expect(page.locator("#ficha-form")).to_be_visible()
        n_eco_ecr_input = page.locator("#n_eco_ecr")
        await expect(n_eco_ecr_input).to_be_disabled()
        print("Read-only form verified.")

        # 7. Take a screenshot
        screenshot_path = "jules-scratch/verification/readonly_ficha_view.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

asyncio.run(main())
