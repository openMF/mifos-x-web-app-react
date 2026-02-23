# Contributing to Mifos X Web App React

Thank you for your interest in contributing to the Mifos X Web App React! We welcome contributions from the community to help improve financial inclusion solutions globally.

To ensure a smooth collaboration process and maintain code quality, we enforce a strict **7-Step Contribution Workflow**. Please read this guide carefully before submitting any code.

## Quick Links

- View the [README](./README.md) or [watch this video](https://youtu.be/OnxxC3K2oro) to get your development environment up and running.
- Sign the [Contribution License Agreement](http://mifos.org/about-us/financial-legal/mifos-contributor-agreement/).
- Always follow the [code of conduct](https://mifos.org/resources/community/code-of-conduct/) - this is important to us.
- Learn more at our [getting started guide](https://mifosforge.jira.com/wiki/spaces/RES/pages/464322561/New+Contributor+Getting+Started+Guide).
- Sign up to the [mailing list](https://sourceforge.net/projects/mifos/lists/mifos-developer).

---

## The Golden Rule: Discuss First

> **Do not open a Pull Request without prior discussion.**

We avoid "surprise" contributions. Before writing code, you must validate your idea with the community to ensure it aligns with the roadmap and isn't already in progress.

---

## Step 1: Discuss on Slack

Before you start coding (especially for new features, UI changes, or refactoring), you must signal your intent.

1. **Join the Community:** [Mifos Slack](https://mifos.slack.com)
2. **Find the Channel:** Navigate to `#web-app`
3. **Post Your Proposal:**
   - **Features:** Explain what you want to build and why.
   - **Bugs:** Briefly explain the issue and provide screenshots if applicable.
4. **Wait for Approval:** Do not proceed until a maintainer or community member acknowledges the task is valid and free for you to take.

---

## Step 2: Jira Issue Tracking

All development work is tracked in Jira to manage the release backlog and ensure transparency.

- **System:** [Mifos Jira](https://mifosforge.jira.com)
- **Project:** MXWAR (Mifos X WebApp React)
- **Board:** [Board 166](https://mifosforge.jira.com/jira/software/c/projects/MXWAR/boards/166) (Active Development Board)

### Workflow

1. **Search:** Check the [Jira Board](https://mifosforge.jira.com/jira/software/c/projects/MXWAR/boards/166) to ensure the ticket doesn't already exist.
2. **Create:** If unique, create a new ticket in Project MXWAR.
   - **Summary:** `[Component] Concise description` (e.g., `[Client] Fix submit button alignment`)
   - **Description:** Steps to reproduce, expected result, actual result, and environment details.
3. **Assign:**
   - Assign the ticket to yourself if you have permissions.
   - If you lack permissions, comment "I am working on this" on the ticket and ask a maintainer to assign it to you.
4. **Manage Status:**
   - **To Do:** Task is open.
   - **In Progress:** Move here immediately when you begin coding.
   - **In Review:** Move here when you post the PR link in the comments.
   - **Done:** Do not move here. Maintainers will move the ticket to Done after the PR is merged.

---

## Step 3: Branching Strategy

We follow a strict branching model to keep our history clean.

- **Upstream Branch:** Always branch from `dev`. Never branch from `master` or `main`.
- **Naming Convention:** Your branch name must include the Jira Ticket ID.
  - **Format:** `MXWAR-<ID>-<short-description>`
  - **Example:** `git checkout -b MXWAR-123-fix-login-button`
### Reserved Branch Names

The following branch names and tags (and their derivatives/extensions) are reserved for use by Mifos Organisation. Any branches created by non-admins with these names will be deleted without notice:

- `main`
- `master`
- `dev`
- `development`
- `sec` / `security`
- `mifos`
- `release` / `rel` / `rc`
- `staging`
- `prod` / `production`
- `gsoc`
---

## Step 4: UI/UX Consistency

The Web App utilizes React with ShadCN UI and Tailwind CSS. Design consistency is critical for user trust in financial software.

### Visual Checks

- **Reference:** Match the Figma mockup or the existing page layout exactly.
- **Grid System:** Spacing must be multiples of 8px (8px, 16px, 24px). Do not use arbitrary values like 10px or 15px.
- **Typography:** Use standard fonts and weights defined in the Tailwind configuration.
- **Components:** Always use ShadCN UI components instead of native HTML tags when possible.

### Evidence Requirement

You must attach **"Before"** and **"After"** screenshots to your Pull Request description. PRs involving UI changes without screenshots will be declined.

---

## Step 5: Code Formatting (Prettier)

We use Prettier to enforce a consistent code style automatically. This eliminates "style wars" in code review.

- **Configuration:** The project includes a `.prettierrc` or Prettier configuration in `package.json`.
- **Run Prettier:** Before committing, run the following command in the root directory:
  ```bash
  npx prettier --write .
  ```
- **Linting:** Ensure your code passes linting:
  ```bash
  npm run lint
  ```

> ⚠️ If the CI build fails due to formatting or linting errors, your PR will not be reviewed.

---

## Step 6: Commit Hygiene (Squash)

We maintain a linear, meaningful git history.

- **One Feature = One PR:** Do not combine unrelated fixes.
- **Squash Requirement:** If your PR contains more than 2 commits, you must squash them.
  - ❌ **Bad History:** `init`, `wip`, `typo`, `fix`, `fix again`
  - ✅ **Good History:** `MXWAR-123: Implement client search functionality`

**How to Squash (Example for last 2 commits):**

1. **Start Interactive Rebase:**
   ```bash
   git rebase -i HEAD~2
   ```

2. **Edit the Rebase File:**
   An editor will open listing the last two commits. It will look similar to this:
   ```text
   pick a1b2c3d Message of the older commit
   pick e4f5g6h Message of the newer commit
   ```

3. **Squash the Commits:**
   Change the second `pick` to `squash` or `s`:
   ```text
   pick a1b2c3d Message of the older commit
   s e4f5g6h Message of the newer commit
   ```

4. **Save and Close:**
   Save the file and close the editor.

5. **Finalize Message:**
   A new editor window will appear allowing you to combine or edit the commit messages for the new, single commit.

6. **Push the Changes:**
   Push the changes to your remote repository:
   ```bash
   git push --force-with-lease
   ```


---

## Step 7: Pull Request Checklist

When you are ready to submit your PR:

- [ ] **Target:** The `dev` branch.
- [ ] **Title:** Includes the Jira Key (e.g., `MXWAR-123: Fix login button`).
- [ ] **Description:** Includes a link to the Jira ticket.
- [ ] **Context:** Includes a link to the Slack discussion or summary of approval.
- [ ] **Visuals:** "Before" and "After" screenshots are attached (if UI related).
- [ ] **Quality:** Prettier formatting is applied and linting passes.

---

## Git and GitHub Workflow

### Configuring Remotes

1. **Fork the Repository:** Create your own fork of the repository on GitHub.

2. **Clone Your Fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mifos-x-web-app-react.git
   cd mifos-x-web-app-react
   ```

3. **Add Upstream Remote:**
   ```bash
   git remote add upstream https://github.com/openMF/mifos-x-web-app-react.git
   ```

4. **Verify Remotes:**
   ```bash
   git remote -v
   # origin    https://github.com/YOUR_USERNAME/mifos-x-web-app-react.git (fetch)
   # origin    https://github.com/YOUR_USERNAME/mifos-x-web-app-react.git (push)
   # upstream  https://github.com/openMF/mifos-x-web-app-react.git (fetch)
   # upstream  https://github.com/openMF/mifos-x-web-app-react.git (push)
   ```

### Keeping Your Fork Updated

Before starting work on a new feature, always sync with upstream:

```bash
# Fetch the latest changes from upstream
git fetch upstream

# Switch to your local dev branch
git checkout dev

# Merge upstream dev into your local dev
git merge upstream/dev

# Push the updates to your fork
git push origin dev
```

### Creating a Feature Branch

```bash
# Make sure you're on dev and it's up to date
git checkout dev
git pull upstream dev

# Create a new branch for your feature
git checkout -b MXWAR-123-your-feature-name
```

### Making Changes and Committing

```bash
# Stage your changes
git add .

# Commit with a meaningful message
git commit -m "MXWAR-123: Add client search functionality"

# Push to your fork
git push origin MXWAR-123-your-feature-name
```

### Creating a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Ensure the base repository is `openMF/mifos-x-web-app-react` and the base branch is `dev`
4. Fill in the PR template with all required information
5. Submit the pull request

### Handling Review Feedback

```bash
# Make the requested changes in your branch
git add .
git commit -m "MXWAR-123: Address review feedback"

# Push the changes
git push origin MXWAR-123-your-feature-name
```

The PR will automatically update with your new commits.

---

## Full File Layout

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

---

## Getting Help

If you get stuck, please reach out in the `#web-app` channel on [Slack](https://mifos.slack.com). We are happy to help you navigate the codebase or troubleshoot environment issues!

---

Thank you for contributing!
