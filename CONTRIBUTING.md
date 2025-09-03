# Getting Started

Welcome! Thank you for showing interest in contributing to **mifos-x-web-app-react**.  

Follow these steps to set up your development environment:

1. **Read the [README](./README.md)** for installation instructions and project overview.  
2. Sign the [Contributor License Agreement](http://mifos.org/about-us/financial-legal/mifos-contributor-agreement/).  
3. Review the [Code of Conduct](https://mifos.org/resources/community/code-of-conduct/) — we’re proud to foster an open and positive environment.  
4. Join the [#webapp channel on Mifos Slack](https://mifos.slack.com) to ask questions and introduce yourself.  
5. Open [Jira tickets](https://mifosforge.jira.com/jira/software/c/projects/MXWAR/boards/166) to find tasks to work on.  
6. Sign up for the [developer mailing list](https://sourceforge.net/projects/mifos/lists/mifos-developer).  

After this setup, you can start working on issues, creating branches, and submitting pull requests.


## Our Processes

### Reporting or Requesting Issues/Enhancements

- Before creating a new issue, check existing Github Issues or Jira tickets.  
- Ask in Slack if you are unsure whether an issue already exists.  
- For UI issues, include screenshots. For enhancements, share mockups if possible.  
- For bugs, clearly describe the steps to reproduce the problem.  

---

### Getting Assigned and Working on Issues

- Always outline the change you wish to make in a Jira ticket or GitHub issue **before** contributing.  
- Do not create Jira tickets for support questions — Jira is for bugs and feature requests only.  
- Make sure the ticket/issue you want to work on is not already assigned.  
- If you want to take over an issue, comment and tag the assignee using `@username`.  
- If there is no response in 3 days, you may assign it to yourself.  
- If you can’t continue work on an issue, unassign yourself so others can pick it up.  

---

### Jira Workflow

Our Jira tickets typically follow this lifecycle:

- **To Do**: Not prioritized yet. Ask on Slack before working on it.  
- **In Progress**: Actively being worked on.  
- **Done**: Merged successfully.  

Contributors are responsible for keeping the ticket status up-to-date.  

---

### Git & GitHub Workflow

- Always branch from `dev`.  
- Never commit directly to `main`.  
- Use meaningful branch names (e.g. `feature/client-onboarding`, `fix/accounting-bug`).  
- Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/) style.  
- Keep PRs small and focused.  
- PRs must target the `dev` branch.  

---

### Full File Layout
The layout and file names are similar to the Angular web app.

```bash
src/
├── app/                 # Redux store setup (slices, providers)
├── assets/              # Static assets (images, logos, icons, etc.)
├── components/          # Reusable UI components
│   ├── custom/          # Feature-specific ShadCN components
│   ├── styles/          # Custom styles and overrides
│   └── ui/              # Core ShadCN UI elements (ShadCN base components)
├── fineract-api/        # OpenAPI-generated Apache Fineract client
├── hooks/               # Custom React hooks
├── layout/              # Shared layout components (navbar, sidebar)
├── lib/                 # Helper utilities, API configs, constants
│
├── pages/               # Contains all page modules
│   ├── accounting/      # Accounting (GL Accounts, Journal Entries, etc.)
│   ├── centers/         # Centers management (list, create, view, edit, actions)
│   ├── clients/         # Client management pages
│   ├── collections/     # Individual Collection Sheet
│   ├── groups/          # Group management pages
│   ├── home/            # Dashboard / landing pages
│   ├── loans/           # Loans management pages
│   ├── login/           # Login / authentication
│   ├── navigation/      # Navigation module
│   ├── not-found/       # 404 page
│   ├── notifications/   # Notifications module
│   ├── organization/    # Organization module
│   ├── products/        # Product module
│   ├── profile/         # User profile & settings
│   ├── reports/         # Reports module
│   ├── saving-product/  # Savings product module
│   ├── settings/        # Application/user settings
│   ├── shares/          # Share accounts & share product pages
│   ├── system/          # System module
│   ├── tasks/           # Checker inbox & tasks
│   ├── templates/       # Templates module
│   └── users/           # Users module

├── router/           # React Router setup
├── App.tsx           # Root component with global providers
├── index.css         # Global Tailwind styles
├── main.tsx          # React entry point 
```
Thank you for contributing!
