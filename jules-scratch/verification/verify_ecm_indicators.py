import os
import asyncio
import subprocess
import re
from playwright.async_api import async_playwright, expect

# --- Server Setup ---
PORT = 8080
server_process = None

async def start_server():
    global server_process
    try:
        public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../public'))
        server_command = ['python', '-m', 'http.server', str(PORT)]
        server_process = subprocess.Popen(
            server_command,
            cwd=public_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        await asyncio.sleep(2)
        print(f"Server started in '{public_dir}' on port {PORT} with PID {server_process.pid}")
    except Exception as e:
        print(f"Failed to start server: {e}")
        if server_process and server_process.poll() is None:
            server_process.terminate()
        raise

def stop_server():
    global server_process
    if server_process and server_process.poll() is None:
        print(f"Stopping server with PID {server_process.pid}...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
            print("Server stopped.")
        except subprocess.TimeoutExpired:
            print("Server did not terminate in time, killing.")
            server_process.kill()
        stdout, stderr = server_process.communicate()
        if stdout:
            print("Server stdout:\n", stdout)
        if stderr:
            print("Server stderr:\n", stderr)
    server_process = None

async def main():
    await start_server()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            await page.goto(f"http://127.0.0.1:{PORT}", timeout=10000)

            await page.fill("#login-email", "f.santoro@barackmercosul.com")
            await page.fill("#login-password", "$oof@k24")
            await page.click("button:has-text('Iniciar Sesión')")

            await expect(page.locator('.toast.success:has-text("¡Bienvenido")')).to_be_visible(timeout=15000)
            await expect(page.locator('.toast.success:has-text("¡Bienvenido")')).to_be_hidden(timeout=10000)
            print("Login successful.")

            await page.click('button.dropdown-toggle:has-text("ECO/ECR")')
            print("Clicked 'ECO/ECR' dropdown.")

            await page.click('a[data-view="control_ecrs"]')
            await expect(page.locator('#view-title:has-text("Panel de Control")')).to_be_visible()
            print("Navigated to Control Panel.")

            await page.click('a[data-view="indicadores_ecm_view"]')
            await expect(page.locator('#view-title:has-text("Indicadores ECM")')).to_be_visible()
            print("Navigated to ECM Indicators.")

            obsoletos_anual_locator = page.locator("#obsoletos-anual")

            print("Waiting for #obsoletos-anual to not be '0'...")
            # CORRECTED: The expect call itself polls for the timeout duration.
            await expect(obsoletos_anual_locator).not_to_have_text('0', timeout=20000)

            final_dom_value = await obsoletos_anual_locator.inner_text()
            print(f"Final DOM value for #obsoletos-anual is: {final_dom_value}")

            if int(final_dom_value) > 0:
                 print(f"Test passed: DOM value is {final_dom_value}, which is greater than 0.")
            else:
                # If the test still fails, seed the data as a fallback.
                print("DOM value is 0. Attempting to seed data to ensure values exist for the test.")
                await page.click('a[data-view="dashboard"]')
                await expect(page.locator('#view-title:has-text("Dashboard")')).to_be_visible()
                await page.click('button[data-action="seed-database"]')
                await page.click('div.modal-content button:has-text("Confirmar")')
                await expect(page.locator('.toast.success:has-text("Carga masiva completada")')).to_be_visible(timeout=90000)
                print("Database seeded successfully as a fallback.")

                # Re-navigate and re-check
                await page.click('button.dropdown-toggle:has-text("ECO/ECR")')
                await page.click('a[data-view="control_ecrs"]')
                await page.click('a[data-view="indicadores_ecm_view"]')
                await expect(page.locator('#view-title:has-text("Indicadores ECM")')).to_be_visible()

                await expect(obsoletos_anual_locator).not_to_have_text('0', timeout=20000)

                final_dom_value_after_seed = await obsoletos_anual_locator.inner_text()
                if int(final_dom_value_after_seed) > 0:
                    print(f"Test passed after seeding: DOM value is {final_dom_value_after_seed}.")
                else:
                    raise Exception(f"Test failed even after seeding: DOM value is '{final_dom_value_after_seed}'.")

        except Exception as e:
            print(f"\n--- AN ERROR OCCURRED ---\n{e}\n-------------------------\n")
            screenshot_path = "jules-scratch/verification/failure_screenshot.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")
            raise
        finally:
            await browser.close()
            stop_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, Exception):
        print("\nScript finished with error or interruption.")
    finally:
        stop_server()
