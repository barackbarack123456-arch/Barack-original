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

The application is a static site but uses ES modules, which are blocked by browser CORS policies when running from `file:///`. To verify changes, you must use a local HTTP server.

1.  Navigate to the `public` directory: `cd public`
2.  Start a simple Python HTTP server: `python -m http.server 8080 &`
3.  In your Playwright verification script, navigate to `http://localhost:8080`.
4.  After verification, stop the server with `kill %1`.
