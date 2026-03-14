# Contributing to Mifos X Web App React

Thank you for your interest in contributing to the Mifos X Web App React! We welcome contributions from the community to help improve financial inclusion solutions globally.

To ensure a smooth collaboration process and maintain code quality, we enforce a strict **7-Step Contribution Workflow**. Please read this guide carefully before submitting any code.

## Quick Links

- View the [README](./README.md) or [watch this video](https://youtu.be/OnxxC3K2oro) to get your development environment up and running.
- Sign the [Contribution License Agreement](http://mifos.org/about-us/financial-legal/mifos-contributor-agreement/).
- Always follow the [code of conduct](https://mifos.org/resources/community/code-of-conduct/) - this is important to us.
- Learn more at our [getting started guide](https://mifosforge.jira.com/wiki/spaces/RES/pages/464322561/New+Contributor+Getting+Started+Guide).
- Have a look at our [Wiki](https://github.com/openMF/mifos-x-web-app-react/wiki).
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

## Additional Resources

- Learn how to [format pull requests](#best-practices-to-send-pull-requests).
- Read how to [rebase/merge upstream branches](#configuring-remotes).

## Git and GitHub Workflow

### Best Practices to send Pull Requests

- Fork the [project](https://github.com/openMF/mifos-x-web-app-react) on GitHub
- Clone the project locally into your system.

```bash
git clone https://github.com/your-username/mifos-x-web-app-react.git
```

- We use the `main` branch for releases, hotfixes and special purposes. All regular work on releases flows into the `dev` branch.

```bash
git checkout dev
```

- Create a new branch with a meaningful name before adding and committing your changes.

```bash
git checkout -b branch-name
```

- Add the files you changed. (Better don't use `git add .`)

```bash
git add file-name
```

- Follow the style conventions for a meaningful commit message.

```bash
git commit
```

- If you forgot to add some changes, you can edit your previous commit message.

```bash
git commit --amend
```

- Squash multiple commits to a single commit. (Example: squash last two commits done on this branch into one.)

```bash
git rebase --interactive HEAD~2
```

- Push this branch to your remote repository on GitHub.

```bash
git push --set-upstream origin branch-name
```

- If any of the squashed commits have already been pushed to your remote repository, you need to do a force push.

  ```bash
  git push origin branch-name --force-with-lease
  ```

- Follow the Pull request template and submit a pull request with a motive for your change and the method you used to achieve it to be merged with the `dev` branch.
- If possible, please submit the pull request along with tests.
- During review, if changes are requested, rebase your branch and squash commits again. Once you push, the pull request updates automatically.

### Configuring Remotes

When a repository is cloned, it has a default remote called `origin` that points to your fork on GitHub, not the original repository it was forked from. To keep track of the original repository, you can add another remote called `upstream`.

1. Set the `upstream`.

```bash
git remote add upstream https://github.com/openMF/mifos-x-web-app-react.git
```

2. Use `git remote -v` to check the status. The output must be something like this:

```bash
  > origin    https://github.com/your-username/mifos-x-web-app-react.git (fetch)
  > origin    https://github.com/your-username/mifos-x-web-app-react.git (push)
  > upstream  https://github.com/openMF/mifos-x-web-app-react.git (fetch)
  > upstream  https://github.com/openMF/mifos-x-web-app-react.git (push)
```

3. To update your local copy with remote changes, run the following: (This will give you an exact copy of the current remote. You should not have any local changes on your dev branch, if you do, use rebase instead.)

```bash
git fetch upstream
git checkout dev
git merge upstream/dev
```

4. Push these merged changes to the `dev` branch on your fork. (Pull upstream changes regularly to keep your fork up to date, or use the "Sync fork" button at the top of your fork's GitHub page, then run `git pull`.)

```bash
git push origin dev
```

5. Switch to the branch you are using for some piece of work.

```bash
git checkout branch-name
```

6. Rebase your branch, which means, take in all latest changes and replay your work in the branch on top of this - this produces cleaner versions/history.

```bash
git rebase dev
```

7. Push the final changes when you're ready.

```bash
git push origin branch-name
```

### After your Pull Request is merged

After your pull request is merged, you can safely delete your branch and pull the changes from the dev (upstream) repository.

1. Delete the remote branch on GitHub.

```bash
git push origin --delete branch-name
```

2. Checkout the dev branch.

```bash
git checkout dev
```

3. Delete the local branch.

```bash
git branch -D branch-name
```

4. Update your dev branch with the latest upstream version.

```bash
git pull upstream dev
```

### Skipping a CI Build

If running a build is not required for a particular commit (in some cases like an update to README.md), add [ci skip] or [skip ci] to the git commit message. Commits that have [ci skip] or [skip ci] anywhere in the commit messages are ignored by CI.

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

**_Thank you for contributing!_**
