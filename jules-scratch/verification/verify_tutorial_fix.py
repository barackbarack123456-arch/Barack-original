import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the application, the URL parameter will auto-start the tutorial
            await page.goto("http://localhost:8000/?tutorial=true")

            # Wait for the first tooltip to be visible, indicating the tutorial has started
            await expect(page.locator("#tutorial-tooltip")).to_be_visible()

            # Get the total number of steps from the progress indicator
            # The text is "Paso X de Y", so we split and get the last part.
            progress_indicator = page.locator("#tutorial-tooltip-progress")
            await expect(progress_indicator).to_be_visible()

            # A small wait to ensure the text content is populated
            await page.wait_for_timeout(500)

            progress_text = await progress_indicator.inner_text()
            total_steps = int(progress_text.split(' ')[-1])

            print(f"Tutorial started. Total steps: {total_steps}")

            # Click "Next" through all the steps of the tutorial
            next_button = page.locator("#tutorial-next-btn")

            for i in range(total_steps):
                step_number = i + 1
                print(f"Advancing to step {step_number}/{total_steps}...")

                # Check if the button is enabled before clicking
                await expect(next_button).to_be_enabled(timeout=15000) # Increased timeout for slow steps
                await next_button.click()

                # Give a brief moment for the next step to render
                await page.wait_for_timeout(200)

                # On the last step, the button text changes to "Finalizar"
                if step_number == total_steps:
                    print("Reached the end of the tutorial.")
                else:
                    # Verify the progress indicator updates
                    # This helps catch if a step fails to advance
                    await expect(progress_indicator).to_have_text(f"Paso {step_number + 1} de {total_steps}", timeout=10000)


            # After the loop, the tutorial overlay should be gone
            await expect(page.locator("#tutorial-overlay")).not_to_be_visible(timeout=5000)
            print("Tutorial completed and overlay is hidden.")

            # Take a screenshot of the final state
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_t_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred during the Playwright script: {e}")
            # Take a screenshot on error for debugging
            await page.screenshot(path="jules-scratch/verification/error.png")
            print("Error screenshot saved to jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
