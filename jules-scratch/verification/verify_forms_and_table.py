import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    # Get the absolute path to the HTML file
    # This is necessary because the test will be run from the root of the repository
    # and the HTML file is in the 'public' directory.
    # We use os.path.abspath to construct a file:// URL.
    # This approach is suitable for static sites that don't require a web server.

    # Get the current working directory
    current_working_directory = os.getcwd()

    # Construct the absolute path to the index.html file
    # The 'public' directory is at the root of the repository.
    file_path = os.path.join(current_working_directory, 'public', 'index.html')

    # Create a file:// URL
    # Playwright can open local files using this URL scheme.
    file_url = f'file://{file_path}'

    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the application and log in
        page.goto(file_url)

        # Wait for the login panel to be visible before proceeding
        expect(page.locator("#login-panel")).to_be_visible()

        # Fill in the email and password fields
        page.fill("#login-email", "test@barackmercosul.com")
        page.fill("#login-password", "123456")

        # Click the login button
        page.click("button[type='submit']")

        # Wait for the main dashboard to be visible after login
        # This confirms that the login was successful and the app has loaded.
        expect(page.locator("#view-title")).to_have_text("Dashboard")

        # 2. Verify "Add Insumo" form
        # Navigate to the 'Insumos' view by clicking the dropdown and then the link
        page.click("button.dropdown-toggle:has-text('Gestión')")
        page.click("a[data-view='insumos']")

        # Click the "Add New" button to open the form modal
        page.click("#add-new-button")

        # Wait for the modal to appear and for the title to be "Agregar Insumo"
        expect(page.locator("#modal-container h3")).to_have_text("Agregar Insumo")

        # Take a screenshot of the "Add Insumo" form
        page.screenshot(path="jules-scratch/verification/01_add_insumo_form.png")

        # Close the modal
        page.click("#modal-container button[data-action='close']")

        # 3. Verify "Add Semiterminado" form
        # Navigate to the 'Semiterminados' view
        page.click("button.dropdown-toggle:has-text('Gestión')")
        page.click("a[data-view='semiterminados']")

        # Click the "Add New" button
        page.click("#add-new-button")

        # Wait for the modal and check its title
        expect(page.locator("#modal-container h3")).to_have_text("Agregar Semiterminado")

        # Take a screenshot of the "Add Semiterminado" form
        page.screenshot(path="jules-scratch/verification/02_add_semiterminado_form.png")

        # Close the modal
        page.click("#modal-container button[data-action='close']")

        # 4. Verify "Add Producto" form
        # Navigate to the 'Productos' view
        page.click("button.dropdown-toggle:has-text('Gestión')")
        page.click("a[data-view='productos']")

        # Click the "Add New" button
        page.click("#add-new-button")

        # Wait for the modal and check its title
        expect(page.locator("#modal-container h3")).to_have_text("Agregar Producto")

        # Take a screenshot of the "Add Producto" form
        page.screenshot(path="jules-scratch/verification/03_add_producto_form.png")

        # Close the modal
        page.click("#modal-container button[data-action='close']")

        # 5. Verify "Sinoptico Tabular" view
        # Navigate to the 'Reporte BOM (Tabular)' view
        page.click("button.dropdown-toggle:has-text('Gestión')")
        page.click("a[data-view='sinoptico_tabular']")

        # Click the button to open the product search modal
        page.click("button[data-action='open-product-search-modal-tabular']")

        # Wait for the search modal to appear
        expect(page.locator("#search-prod-results")).to_be_visible()

        # Click the first product in the results to load the table
        page.locator("#search-prod-results button").first.click()

        # Wait for the table to be visible
        expect(page.locator("#sinoptico-tabular-container table")).to_be_visible()

        # Take a screenshot of the Sinoptico table
        page.screenshot(path="jules-scratch/verification/04_sinoptico_table.png")

    finally:
        # Clean up: close the browser context and the browser instance
        context.close()
        browser.close()

# This is the entry point for the script.
# It initializes Playwright and calls the main verification function.
with sync_playwright() as p:
    run_verification(p)
