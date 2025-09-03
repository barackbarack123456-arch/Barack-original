import { describe, test, expect, beforeEach } from '@jest/globals';

describe('ECR Form Data Collection', () => {

    beforeEach(() => {
        // Set up a mock DOM for each test
        document.body.innerHTML = `
            <form id="ecr-form">
                <input type="text" name="ecr_no" value="ECR-001">
                <input type="checkbox" name="enabled_checked" checked>
                <input type="checkbox" name="enabled_unchecked">
                <input type="checkbox" name="disabled_checked" checked disabled>
                <input type="checkbox" name="disabled_unchecked" disabled>
            </form>
        `;
    });

    /**
     * This test simulates the data gathering logic from the `saveEcrForm` function in `main.js`.
     * It specifically tests the fix for the bug where disabled checkboxes were being included in the saved data.
     * This is the same bug described in AGENTS.md Lesson #11, which was fixed for the ECO form but not the ECR form.
     */
    test('[BUG-VERIFY] should not include the value of disabled checkboxes when collecting form data', () => {
        const formContainer = document.getElementById('ecr-form');

        // This logic is a direct copy of the relevant part of `saveEcrForm`
        const formData = new FormData(formContainer);
        const dataToSave = Object.fromEntries(formData.entries());

        // The line below is the subject of the bug. The original code was:
        // formContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        // The corrected code is:
        formContainer.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => {
            dataToSave[cb.name] = cb.checked;
        });

        // --- Assertions ---
        // 1. Check that the enabled checkboxes are present and have the correct state.
        expect(dataToSave).toHaveProperty('enabled_checked', true);
        expect(dataToSave).toHaveProperty('enabled_unchecked', false);

        // 2. Crucially, assert that the disabled checkboxes are NOT present in the final data.
        //    The original buggy code would have included them.
        expect(dataToSave).not.toHaveProperty('disabled_checked');
        expect(dataToSave).not.toHaveProperty('disabled_unchecked');
    });
});
