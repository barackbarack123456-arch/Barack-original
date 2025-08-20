import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 1. Navigate and Bypass Login
        await page.goto("http://localhost:8080")

        # Wait for the app to initialize, then bypass login by directly calling internal functions
        await page.wait_for_function("() => window.appState && window.updateAuthView")

        await page.evaluate("""() => {
            appState.currentUser = {
                uid: 'test-uid',
                name: 'Test User',
                email: 'test@barackmercosul.com',
                avatarUrl: '',
                role: 'admin' // Use admin role to ensure all UI elements are visible
            };
            updateAuthView(true);
        }""")

        # Wait for the main app view to be visible after bypassing login
        await expect(page.locator("#app-view")).to_be_visible(timeout=10000)

        # 2. Seed the database from the dashboard
        await expect(page.get_by_role("button", name="Cargar Datos de Prueba")).to_be_visible()
        await page.get_by_role("button", name="Cargar Datos de Prueba").click()

        # Wait for either a success or error toast to appear
        success_toast = page.locator(".toast.success")
        error_toast = page.locator(".toast.error")
        await expect(success_toast.or_(error_toast)).to_be_visible(timeout=15000)

        # Check if an error toast appeared
        is_error = await error_toast.is_visible()
        if is_error:
            error_text = await error_toast.text_content()
            raise Exception(f"Database seeding failed with error: {error_text}")

        await expect(success_toast).to_have_text("Datos de prueba cargados exitosamente.")

        # 3. Navigate to the Tabular BOM Report
        await page.get_by_role("button", name="Gestión BOM").click()
        await page.get_by_role("link", name="Reporte BOM (Tabular)").click()

        # 4. Select a Product to show the header
        await page.get_by_role("button", name="Seleccionar Producto").click()
        await expect(page.get_by_role("heading", name="Buscar Producto Principal")).to_be_visible()
        await page.locator("#search-prod-results button[data-product-id]").first.wait_for(timeout=10000)
        await page.get_by_role("button", name="Ensamblaje de Soporte de Motor Delantero (PROD001)").click()

        # 4. Take a screenshot of the new header
        # Wait for the header to be rendered
        header_locator = page.locator('.bg-\\[\\#44546A\\]')
        await expect(header_locator).to_be_visible(timeout=10000)

        # Take a screenshot of just the header element
        await header_locator.screenshot(path="jules-scratch/verification/caratula_screenshot.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
