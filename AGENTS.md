> **Note to Human Developers:** This file is intended to provide guidance and instructions specifically for AI agents collaborating on this codebase. It is not general project documentation. For an overview of the project, please see `README.md`.

# Agent Guidelines

This file contains guidelines and lessons learned for AI agents working on this codebase.

## Lessons Learned

1.  **UI Placement:** Always confirm the location for new UI elements (e.g., menu items) if not explicitly specified. The "User Management" feature was initially placed in the "Configuración" menu, but the user preferred it in the "Gestión" menu. When in doubt, ask or place it in the most logical location and be prepared to move it.
2.  **Icon Verification:** Always verify that icon names (e.g., from the Lucide library) exist in the project's version of the library before using them. Using a non-existent icon like `users-cog` caused a console error. The correct icon was `user-cog`.
3.  **Proactive Communication on Data Changes:** When adding new fields to existing data structures (e.g., adding a `sector` to users), proactively explain to the user what will happen to existing data. Reassure them that their data is safe and explain how the application will handle records that don't have the new field (e.g., displaying "N/A").
4.  **Refactoring to Real-Time Listeners:** When refactoring code from a one-time fetch model (`getDocs`) to a real-time listener model (`onSnapshot`), it is crucial to remove any old, redundant calls to the data-fetching function. These manual calls can interfere with the real-time listeners and cause unpredictable behavior. The listener itself is responsible for all UI updates.
5.  **Firestore Index Requirements:** Complex queries, such as the `OR` query on the `tareas` collection combined with `orderBy`, require a composite index in Firestore. If a query fails silently or returns no data, always check the browser's developer console for a `FAILED_PRECONDITION` error. This error message contains a direct link to the Firebase console to automatically create the required index.
6.  **DOM Rendering Race Conditions:** A function that manipulates the DOM (e.g., `renderTasks`) can sometimes execute before the browser has finished painting the necessary elements, even if the `innerHTML` was set on a previous line. This can cause `querySelector` to return `null`. Deferring the function's execution with `setTimeout(callback, 0)` pushes it to the end of the event loop, ensuring the DOM is ready and solving the race condition.
7.  **Data Model Consistency:** The application relies on a consistent data model where all primary collection documents contain a unique `id` field. The `usuarios` collection was missing this field, causing generic table logic (sorting, editing) to fail. The fix involved not only updating the code to handle the inconsistency but, more importantly, migrating the existing data to enforce the consistent model.
8.  **Robust DOM Creation:** When creating a DOM node from an HTML string, using `document.createElement('template')` is more robust than the `createElement('div')` and `innerHTML` hack. The template method correctly handles complex HTML and is the modern standard.
9.  **Initial Seeding and Security Rules Deadlock:** When setting up the application with a clean database, a deadlock can occur. The application tries to seed default collections (like `roles` and `sectores`) on first login. However, the security rules require the user to be an 'admin' to write to these collections. The user cannot become an 'admin' because the `roles` collection doesn't exist yet to be selected from. The root cause is that the security rule function for checking write permissions (e.g., `canCreateUpdate`) might not correctly identify a "Super Admin" user (by UID) if their user document has a default role of 'lector'.
    *   **Solution:** The `canCreateUpdate` function in `firestore.rules` must be robust enough to handle this initial state. It should check for admin status using the same logic as the `isUserAdmin` function (i.e., checking for both role and the hardcoded Super Admin UID) in addition to any other roles like 'editor'. The correct procedure for a clean setup is:
        1.  Ensure the first user to log in has the UID designated as the Super Admin in the rules.
        2.  On first login, the application will create the user's document and correctly seed the initial data.
        3.  The Super Admin must then navigate to User Management and formally assign their own user the 'admin' role to ensure all admin features are available in the UI.
10. **Fixing Tutorial Highlighting on Dynamic Views:** When building interactive tutorials that highlight elements, two common issues can arise on dynamic, multi-page, or heavily-scripted forms:
    *   **Race Conditions with Scrolling:** Automated testing scripts (like Playwright) or fast user navigation can cause the tutorial to calculate an element's position *before* a smooth scroll animation has finished. This results in the highlight appearing in the wrong place.
        *   **Solution:** In the tutorial's scrolling logic (e.g., a function that calls `element.scrollIntoView()`), set the `behavior` option to `'instant'`. This eliminates the animation, ensuring the element is in its final position immediately.
    *   **Unstable Selectors:** If a tutorial step needs to highlight a concept represented by a group of dynamically generated elements (e.g., a list of department sections), applying a `data-tutorial-id` to only the *first* element is fragile. The tutorial may fail if that specific element is not visible or if the user navigates in a way that doesn't render it first.
        *   **Solution:** Instead of targeting a single dynamic item, wrap the entire group of related elements in a stable container `div`. Apply a single, consistent `data-tutorial-id` to this wrapper. Then, point all relevant tutorial steps (e.g., "Review Departments", "Approve Departments") to this single, stable wrapper. This makes the tutorial far more robust.
11. **Implementing Derived, Read-Only UI State:** When a UI element's state should be derived from other data (and not be directly user-editable), it is crucial to ensure this state is not accidentally persisted back to the database.
    *   **Scenario:** In the ECO form, the "Plan de acción completado" checkbox in the "Implementation" section should be checked *if and only if* all tasks in the Action Plan are marked as 'completed'. It should be a read-only indicator.
    *   **Problem:** The initial implementation correctly disabled the checkbox to prevent user clicks. However, the form-saving logic (`getFormData`) used a broad `querySelectorAll('input[type="checkbox"]')` to gather the state of all checkboxes. This read the `checked` property of the disabled checkbox and saved it to Firestore. If the user later reloaded the form with an incomplete action plan, `populateEcoForm` would read the stale `true` value from the database, incorrectly showing the box as checked before the runtime logic had a chance to correct it.
    *   **Solution:** The form-saving logic must be modified to exclude disabled elements. The most robust way to do this is to change the selector to `querySelectorAll('input[type="checkbox"]:not(:disabled)')`. This ensures that any UI element whose state is purely derived and therefore disabled will not have its state persisted, correctly treating it as a read-only, calculated field.

## Important Technical Details

*   **Real-Time by Default:** The application heavily uses real-time Firestore listeners (`onSnapshot`). Assume that when data is changed, the relevant UI will update automatically. Do not add manual refresh/refetch calls after creating, updating, or deleting data.
*   **Admin-Only Features:** Some features are restricted to administrators. The user's role is stored in `appState.currentUser.role`. Check for `appState.currentUser.role === 'admin'` to conditionally show UI elements.
*   **Form Modals:** The `openFormModal` function is generic and driven by the `viewConfig` object. It can be extended to support new field types and configurations.
*   **Styling:** The project uses TailwindCSS. All new UI should conform to this styling.
*   **Icons:** The project uses the Lucide icon library. Refer to the official Lucide website for a list of available icons.

## Development Credentials

To run the application and verify frontend changes, use the following credentials for login:

- **Username:** `f.santoro@barackmercosul.com`
- **Password:** `$oof@k24`

## Verification Workflow

## Verification Workflow

As an AI agent, you are responsible for verifying all frontend changes. While the Playwright test suite (`tests/*.spec.js`) may have issues in some environments, you must still use Playwright to generate visual proof of your changes.

Your workflow for frontend verification is as follows:

1.  **Use `frontend_verification_instructions()`:** Call this tool to get the latest instructions on how to create a verification script.
2.  **Write a Verification Script:** Create a new Playwright script (e.g., in the `tests/` directory). This script should:
    *   Log in to the application using the credentials provided below.
    *   Navigate to the specific page or state that showcases your changes.
    *   Take a screenshot of the relevant UI component.
3.  **Run the Script:** Execute your script to generate the screenshot.
4.  **Present for Approval:** Use the `message_user` tool to show the screenshot to the user for final approval before submitting your changes.

This process ensures that all changes are visually confirmed by the user, even if the full test suite cannot be run.

---
