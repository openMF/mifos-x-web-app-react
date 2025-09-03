
# mifos-x-web-app-react

This repo is for the **React version** of the Mifos-X web-app.  
It is currently **work in progress** and not recommended for deployment.  

The **main** branch contains release code.  
All PRs should be submitted to the `dev` branch first, and will be merged to `main` at a release.  

This project is part of **Google Summer of Code 2025** under [The Mifos Initiative](https://mifos.org).

---

## 🚀 Tech Stack

- **React + TypeScript** – Frontend architecture  
- **Tailwind CSS + ShadCN UI** – UI and styling  
- **Redux Toolkit** – Global state management  
- **Vite** – Build tool  
- **Fineract API (OpenAPI-generated client)** – Backend integration  

---

## 📁 Project Structure

```bash
src/
├── app/              # Redux store setup (slices, providers)
├── assets/           # Static assets (images, logos, etc.)
├── components/       # Reusable UI components
│   ├── custom/       # Feature-specific ShadCN components
│   ├── styles/       # Custom styles and overrides
│   └── ui/           # Core ShadCN UI elements
├── fineract-api/     # OpenAPI-generated Fineract client
├── hooks/            # Custom React hooks
├── layout/           # Navbar, sidebar, app shell components
├── lib/              # API clients, helper utilities
├── pages/            # Route-based page components (contains all the pages)
├── router/           # React Router setup
├── App.tsx           # Root component
├── index.css         # Global styles (Tailwind base layer)
├── main.tsx          # React entry point
├── vite-env.d.ts     # Vite TypeScript definitions

root/
├── fineract.yaml         # OpenAPI spec for Fineract
├── openapitools.json     # OpenAPI generator config
├── components.json       # ShadCN CLI config
├── index.html            # App HTML shell
├── .eslintrc.js          # Linting rules
├── .gitignore
````

---

## ⚙️ Prerequisites

* A working **Apache Fineract backend** running locally
* Node.js and npm installed

---

## 🛠️ Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/openMF/mifos-x-web-app-react.git

# 2. Move into the project directory
cd mifos-x-web-app-react

# 3. Install dependencies
npm install

# 4. Generate the Fineract API client from OpenAPI spec
npm run generate-sdk

# 5. Start the development server
npm run dev
```

---

## 🤝 Contributing

Contributions are welcome to improve the project.

* Please read the [Contributing Guide](./CONTRIBUTING.md) before making a PR.
* For OpenAPI-related issues, check [Issues](./ISSUES.md).
