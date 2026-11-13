# Mifos-X Web App React: Developer Onboarding Guide

Welcome to the **Mifos-X Web App (React)** repository! We are thrilled to have you contribute. This document is designed to bridge the gap between getting the code running and actually understanding how the application is built.

## 🚀 First-Time Exploration Workflow

The best way to understand the architecture is to use the app! After logging in with local/demo testing credentials (e.g., `mifos`/`password`) in development environments, contributors can follow this workflow to build a fast mental model of how the major components connect:

1. **Explore the Dashboard** and sidebar navigation to see available modules.
2. **Create a Client** by navigating to Clients → Add Client.
3. **Create a Loan** linked to that newly created client.
4. **Approve and disburse** the loan through the task workflows.
5. **Record a repayment transaction** against the loan.
6. **Explore generated reports** and accounting views to see how the transaction impacted the system.

### First-Time Exploration Notes

Some pages and workflows in this React Web App are still under active migration from the older Angular implementation. During first-time exploration, contributors may encounter:

- Partially implemented pages
- Placeholder views
- API endpoint mismatches
- Empty states due to missing seed/demo data
- Features that exist in the older Angular web-app but are not yet fully ported

This is expected while the React application continues progressing toward feature parity.

---

## 🏛️ System Architecture Overview

This project serves as the modern web interface for the **Apache Fineract** backend.

1. **Frontend**: Built with **React 19** and **TypeScript**, bundled using **Vite**.
2. **Backend (Fineract)**: The application does not have its own backend database. It strictly communicates with an Apache Fineract instance via REST APIs.
3. **API Client**: We do not write API fetch calls manually. Instead, we use `@openapitools/openapi-generator-cli` to auto-generate an Axios-based TypeScript client directly from the Fineract OpenAPI specification (`fineract.yaml`).

## 📁 Folder Structure Deep Dive

The core logic of the application lives inside the `src/` directory:

```bash
src/
├── app/              # Redux store configuration and global state slices
├── components/       # Reusable UI components
│   ├── custom/       # Composite components (e.g., AppBreadCrumbs, AppSelect) built for specific features
│   ├── styles/       # Overrides and global CSS logic
│   └── ui/           # Pre-styled ShadCN UI components built with Tailwind CSS. Prefer extending or wrapping these components instead of heavily modifying them directly.
├── fineract-api/     # Auto-generated OpenAPI client. Changes should be made through the OpenAPI spec or SDK generation flow rather than editing files manually.
├── hooks/            # Custom React hooks used across multiple pages
├── layout/           # App shell components (Navbar, Sidebar, Footer)
├── lib/              # Utility functions and API configuration (e.g., fineract-openapi.ts)
├── locales/          # i18n translation files for multi-language support
├── pages/            # Page-level components. This is where you'll spend most of your time adding new views!
├── router/           # React Router configuration (AppRoutes.tsx, ProtectedRoutes.tsx)
└── types/            # Global TypeScript interface definitions
```

## 🧠 State Management

We use **Redux Toolkit** alongside local React state. Here is how to decide which to use:

- **Use Local State (`useState` / `useReducer`)**: For form inputs, toggling modals, UI state (like active tabs), and data that is only needed by a single component.
- **Use Global State (Redux in `src/app/`)**: For user authentication details, global themes, or data that needs to be accessed by deeply nested components across different pages without prop-drilling.

## 🎨 Styling Guidelines

We use **Tailwind CSS** combined with **ShadCN UI**.

1. **Utility-First**: Use Tailwind utility classes directly in the `className` prop. Avoid writing custom CSS in `index.css` unless absolutely necessary.
2. **ShadCN Components**: When you need a button, input, or dialog, import it from `src/components/ui/`. If you need a more complex, domain-specific component, build it in `src/components/custom/`.
3. **Icons**: We primarily use `lucide-react` and `@fortawesome` for icons.

## 🛠️ Development Workflow: Adding a New Page

Here is the standard workflow when you pick up an issue to create a new page:

1. **Create the Component**: Add a new folder/file inside `src/pages/` (e.g., `src/pages/my-feature/MyFeature.tsx`).
2. **Add the Route**: Open `src/router/AppRoutes.tsx` (or `ProtectedRoutes.tsx` if it requires login) and add the `<Route>` mapping to your new component.
3. **Fetch Data**:
   - Import the generated API class from `@/fineract-api`.
   - Initialize it using `getConfiguration()` from `@/lib/fineract-openapi`.
   - Use `useEffect` to fetch the data on mount and store it in local state.
     _(Remember to add error handling!)_
4. **Build the UI**: Use ShadCN components for the layout and forms.

---

## 🐛 Contributor Debugging Advice

### Comparing with Angular Web App

When implementing or debugging migrated features, contributors may find it useful to compare workflows with the older Angular-based `openMF/web-app` repository to understand expected routing, API behavior, and missing functionality.

### Debugging API & Environment Issues

If pages load but data appears missing:

1. **Verify the Fineract backend** is running correctly and accessible.
2. **Check `.env.development.local`** values to ensure your API proxy is targeting the correct port.
3. **Inspect browser network requests** for:
   - `401 Unauthorized` responses (You may need to log out and log back in)
   - `404 Not Found` endpoint mismatches
   - Incorrect `/api` vs `/api/v1` paths
4. Remember that some routes may still be under migration and can contain partial integrations or placeholder logic.

---

_Thank you for contributing! If you get stuck, feel free to open an issue or ask in our community channels._
