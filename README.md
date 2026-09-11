# SD Jamaat Website Admin Panel

Administration portal for the San Diego Dawoodi Bohra Jamaat website and its member services.

## Features

- Manage member and administrator accounts with permission-based controls
- Export user and family data
- Create, edit, and remove Faiz-ul-Mawaid menus
- Manage family enrollments and make thaali selections on a family's behalf
- View, export, and delete menu submissions
- Generate printable thaali labels from submission data
- Deploy the Firebase Functions used by both the admin panel and member website

## Tech stack

- React 18 and TypeScript
- Vite 6
- Ant Design, React Bootstrap, and styled-components
- Firebase Authentication, Firestore, and callable Functions
- Firebase Functions with SendGrid
- Netlify

## Frontend development

### Requirements

- Node.js 20 recommended (and required by the Firebase Functions package)
- npm
- Development Firebase configuration and an authorized development admin account from a project maintainer

### Setup

```shell
git clone https://github.com/sdjamaat/admin.git
cd admin
npm ci
```

Create `.env.development` in the repository root:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_ENCRYPTION_TYPE=
VITE_ENCRYPTION_SECRET=
```

Do not commit environment files. Variables prefixed with `VITE_` are bundled into the browser application, so they must not contain server-side secrets.

Start the development server:

```shell
npm run dev
```

Open <http://localhost:4000>. Ask a project maintainer for development admin access; production credentials should not be used for local testing.

## Frontend scripts

| Command           | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `npm run dev`     | Start the Vite development server on port 4000                        |
| `npm run build`   | Type-check and create a production build in `dist/`                   |
| `npm run preview` | Preview the production build locally                                  |
| `npm run format`  | Format JavaScript, TypeScript, JSON, and Markdown files with Prettier |

Run `npm run build` before opening a pull request to catch TypeScript and production-build errors.

## Firebase Functions

The `functions/` package contains the shared backend functions for contact-form emails, registration emails, administrator-account removal, registration deactivation, and thaali confirmation emails.

### Local setup

Install the [Firebase CLI](https://firebase.google.com/docs/cli), then install the function dependencies:

```shell
npm install --global firebase-tools
cd functions
npm ci
```

Create `functions/.env` with a development SendGrid key:

```dotenv
SENDGRID_API_KEY=
```

Never commit the SendGrid key or copy the production key into a local environment.

### Function scripts

Run these commands from `functions/`:

| Command          | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `npm run lint`   | Lint the TypeScript function source                         |
| `npm run build`  | Compile the functions into `functions/lib/`                 |
| `npm run serve`  | Build and start the Firebase Functions emulator             |
| `npm run shell`  | Build and start the Firebase Functions shell                |
| `npm run logs`   | Read deployed function logs                                 |
| `npm run deploy` | Deploy Firebase Functions using the active Firebase project |

For a manual production deploy, authenticate with the approved Firebase account and specify the production alias explicitly:

```shell
firebase login
firebase deploy --only functions --project production
```

Normal production function deployments are automated: pushes to `main` that change `functions/**` or `firebase.json` run the `Deploy Firebase Functions` GitHub Actions workflow.

## Project structure

```text
src/
  components/admin/fmb/    Menu, enrollment, submission, selection, and label tools
  components/admin/users/  Account management and exports
  provider/                Authentication and date contexts
  lib/firebase.ts          Firebase client initialization
functions/
  src/                     Firebase Function source
  lib/                     Generated JavaScript output
```

## Frontend deployment

Netlify builds and deploys pushes to `main` using `netlify.toml`. The production build output is `dist/`, and the catch-all redirect in that file supports client-side routing. The `Track Netlify Deploy` GitHub Actions workflow waits for the matching Netlify deploy and reports whether it succeeded.

## Team resources

- [SD Jamaat Website Trello board](https://trello.com/b/7tlGo398/main-site-admin-panel)

Ask a project maintainer for access to development credentials and team-owned services.

### Contact form protection

Contact submissions use the `submitContactForm` callable with server-verified
Turnstile and transactional quotas. The old Firestore email trigger is disabled.
See [contact form rollout](docs/contact-form-rollout.md) for required secrets,
private Firestore rules, test setup, and the coordinated website/backend release.
