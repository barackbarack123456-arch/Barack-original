import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the index.html file
        # The current working directory is the root of the repository
        file_path = os.path.abspath('public/index.html')

        # Go to the local file
        page.goto(f'file://{file_path}')

        # Force the app view to be visible by manipulating the DOM
        page.evaluate('''() => {
            document.getElementById('app-view').classList.remove('hidden');
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('loading-overlay').classList.add('hidden');
        }''')

        # Wait for the app view to be visible after our script has run
        expect(page.locator('#app-view')).to_be_visible()

        # Force the dropdown to be visible
        page.evaluate('''() => {
            const gestionLink = document.querySelector('a[data-view="arboles"]');
            if (gestionLink) {
                const dropdownMenu = gestionLink.closest('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.style.display = 'block';
                }
            }
        }''')

        # Click on the "Reporte BOM (Tabular)" link
        page.locator('a[data-view="sinoptico_tabular"]').click()

        # Click the button to open the product search modal
        page.locator('button[data-action="open-product-search-modal-tabular"]').click()

        # Wait for the modal to appear and click the first product
        page.locator('#search-prod-results button[data-product-id]').first.click()

        # Wait for the table to be rendered
        expect(page.locator('#sinoptico-tabular-container table')).to_be_visible(timeout=10000)

        # Take a screenshot of the table
        page.locator('#sinoptico-tabular-container').screenshot(path="jules-scratch/verification/sinoptico_table_fixed.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
