
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

## � Docker Deployment

### Quick Start with Docker Compose

Run the complete stack (web app + Fineract backend + database):

```bash
# 1. Copy and configure environment file
cp .env.docker.sample .env.docker
# Edit .env.docker with your database passwords

# 2. Start all services
docker compose -f docker-compose-zitadel.yml up -d

# 3. Access the application
# Web App: http://localhost:10706
# Fineract API: https://localhost:3000
```

### Production Deployment

For production with security hardening and resource limits:

```bash
docker compose -f docker-compose-zitadel.yml -f docker-compose.prod.yml up -d
```

### Using Pre-built Docker Image

Pull and run the latest image from Docker Hub:

```bash
docker pull mifos/web-app-react:latest

docker run -d -p 80:80 \
  -e FINERACT_API_URL=https://your-fineract-server:8443 \
  -e FINERACT_API_PROVIDER=/fineract-provider \
  -e FINERACT_PLATFORM_TENANT_IDENTIFIER=default \
  --name mifos-web-app \
  mifos/web-app-react:latest
```

### Build Custom Docker Image

```bash
docker build -t mifos/web-app-react:custom .
```

**Docker Features:**
- Multi-stage build for optimized image size (~50MB)
- Nginx web server with security headers
- Runtime environment variable configuration
- Non-root user for enhanced security
- Health checks included
- Multi-platform support (linux/amd64, linux/arm64)

For Docker environment variables, see `.env.docker.sample`.

---

## �🔧 Environment Variables

The application uses environment variables for configuration. Copy `.env.sample` to `.env` or `.env.development.local` and adjust the values as needed.

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FINERACT_API_URL` | Base URL for the Fineract server (protocol + host + port) | `https://localhost:8443` |
| `VITE_FINERACT_API_PROVIDER` | API path prefix | `/fineract-provider` |
| `VITE_FINERACT_API_VERSION` | API version path | `/api` |
| `VITE_FINERACT_PLATFORM_TENANT_IDENTIFIER` | Tenant identifier for multi-tenant deployments | `default` |

### Manual Fineract Setup (Without Docker)

If running Apache Fineract manually (e.g., on `https://localhost:8443`):

1. Create a file: `.env.development.local`


2. Add the below configurations

```bash
# .env.development.local
VITE_FINERACT_API_URL=https://localhost:8443
VITE_FINERACT_API_PROVIDER=/fineract-provider
VITE_FINERACT_API_VERSION=/api
VITE_FINERACT_PLATFORM_TENANT_IDENTIFIER=default
VITE_FINERACT_PLUGIN_OIDC_ENABLED=false
```

> **Note:** Files ending in `.local` are ignored by git and should be used for machine-specific configuration.

---

## 🤝 Contributing

Contributions are welcome to improve the project.

* Please read the [Contributing Guide](./CONTRIBUTING.md) before making a PR.
* For OpenAPI-related issues, check [Issues](./ISSUES.md).
