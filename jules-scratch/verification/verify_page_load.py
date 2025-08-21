import os
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        file_path = os.path.abspath('public/index.html')
        page.goto(f'file://{file_path}')

        # Wait for the page to load
        page.wait_for_load_state('networkidle')

        page.screenshot(path="jules-scratch/verification/page_load.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
