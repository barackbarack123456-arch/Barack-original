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

## Important Technical Details

*   **Real-Time by Default:** The application heavily uses real-time Firestore listeners (`onSnapshot`). Assume that when data is changed, the relevant UI will update automatically. Do not add manual refresh/refetch calls after creating, updating, or deleting data.
*   **Admin-Only Features:** Some features are restricted to administrators. The user's role is stored in `appState.currentUser.role`. Check for `appState.currentUser.role === 'admin'` to conditionally show UI elements.
*   **Form Modals:** The `openFormModal` function is generic and driven by the `viewConfig` object. It can be extended to support new field types and configurations.
*   **Styling:** The project uses TailwindCSS. All new UI should conform to this styling.
*   **Icons:** The project uses the Lucide icon library. Refer to the official Lucide website for a list of available icons.
