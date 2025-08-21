import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        index_path = os.path.join(base_dir, 'public', 'index.html')

        await page.goto(f"file://{index_path}")

        await page.evaluate("""
            document.getElementById('loading-overlay').style.display = 'none';
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-view').style.display = 'flex';
        """)
        print("Bypassed login wall by showing main app view.")

        # Force the dropdown to open using standard JavaScript
        await page.evaluate("""
            const buttons = document.querySelectorAll("button.dropdown-toggle");
            const gestionButton = Array.from(buttons).find(btn => btn.textContent.includes('Gestión'));
            if (gestionButton) {
                const dropdown = gestionButton.closest('.nav-dropdown');
                dropdown.classList.add('open');
            }
        """)
        print("Forced 'Gestión' dropdown to open.")

        # Now click the 'Productos' link, which should be visible
        await page.locator("a[data-view='productos']").click()
        await expect(page.locator("h2:has-text('Productos')")).to_be_visible()

        # Click the "Add" button to open the form modal
        await page.locator("#add-new-button").click()

        # Verify the form is open and take a screenshot
        await expect(page.locator("h3:has-text('Agregar Producto')")).to_be_visible()
        await expect(page.locator("label:has-text('Imagen (URL)')")).to_be_visible()
        await expect(page.locator("label:has-text('Aspecto')")).to_be_visible()
        await expect(page.locator("label:has-text('Proceso')")).to_be_visible()
        await page.screenshot(path="jules-scratch/verification/edit-form.png")
        print("Screenshot of 'Add Product' form taken.")

        # Test validation
        await page.locator("textarea[name='descripcion']").fill("")
        await page.locator("input[name='codigo']").fill("")
        await page.locator("button[type='submit']:has-text('Guardar')").click()

        # Verify validation error
        await expect(page.locator("h3:has-text('Agregar Producto')")).to_be_visible() # Modal should still be open
        await expect(page.locator("p.text-red-600:has-text('Este campo es obligatorio.')")).to_have_count(2)
        await page.screenshot(path="jules-scratch/verification/validation-error.png")
        print("Screenshot of validation error taken.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
