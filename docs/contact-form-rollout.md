# Contact form spam protection rollout

The website PR and this backend PR must be released together. Do not merge until
steps 1–3 are complete. The backend deployment replaces the old contact trigger
with a no-op; the old website cannot deliver messages after that deployment.

The deployment workflow deploys only `submitContactForm` and
`newContactFormSubmission`. Other functions and admin-permission changes are
outside this release. These two functions use Node.js 22.

Configuration verified September 11, 2026: the managed Cloudflare widget exists,
its secret is enabled in `sdj-production` Secret Manager, and the public site key
is stored in Netlify's Production context. SendGrid sandbox validation succeeded;
no real email was sent. The historical exposed key is absent from the provider's
API-key list, and the deployed key is different.

## 1. Configure Turnstile

Create a managed Cloudflare Turnstile widget for the Jamaat website. Allow only
the actual website hostnames (for example `sandiegojamaat.net` and
`www.sandiegojamaat.net`); do not allow every Netlify subdomain.

- Store its **secret** in Firebase Secret Manager:
  `firebase functions:secrets:set TURNSTILE_SECRET_KEY --project production`.
  Enter the secret at the prompt. Never put it in a `VITE_` variable or git.
- Set the matching **public site key** as Netlify's `VITE_TURNSTILE_SITE_KEY` for
  the website production context.
- Set the admin repository Actions variable `CONTACT_ALLOWED_HOSTNAMES` to the
  comma-separated exact allowed hostnames. It is written into the Functions
  environment by the deployment workflow.
- For local/development Functions, put `CONTACT_ALLOWED_HOSTNAMES` in the ignored
  `functions/.env` and use a separate development secret/project.

Verification fails closed if configuration is missing or Cloudflare is unavailable.
The server verifies `success`, exact `hostname`, and `action: contact`. Tokens
are single-use and are never persisted in Firestore.

## 2. Protect quota storage BEFORE deploying the callable

**Verified on September 11, 2026 in `sdj-prod` (`sdj-production`):** the
console-managed rules published June 6, 2026 at 5:34 PM have no matching allow
for `contactRateLimits`. Rules Playground denied all eight checks: get, create,
update, and delete, each both unauthenticated and authenticated with a synthetic
UID. These simulations did not write production documents. No rules change was
needed for quota privacy. Recheck if rules change before release.

The existing `contact` rules still allow public creation and authenticated
read/update/delete. Lock down direct contact writes only during the coordinated
release in step 4; doing so now would break the currently deployed form.

Export and review the existing rules. Ensure no web/mobile client, including
signed-in users, can read or write `contactRateLimits/{document=**}`. The Firebase
Admin SDK used by the callable bypasses client rules. A rule such as the following
is only sufficient when no overlapping match grants access:

```text
match /contactRateLimits/{document=**} {
  allow read, write: if false;
}
```

If an existing broad wildcard permits writes, exclude `contactRateLimits` from
that allow expression. Adding `allow ...: if false` does NOT override another
matching allow. Preserve unrelated member/admin permissions.

Verify unauthenticated AND ordinary authenticated attempts to read/create/update/
delete quota documents all fail in the Rules Playground or emulator. Then set
Actions variable `CONTACT_RULES_READY=true`. This is an operator acknowledgement,
not automated proof of the live rules. The deploy workflow refuses to proceed
without it. Keep the callable undeployed until that check is complete.

The quota transaction enforces 3 accepted attempts per normalized email, 10 per
platform-reported IP, and 100 globally in a fixed one-hour window starting with
the first accepted attempt. All quota updates and contact creation commit together.
Email/IP quota document IDs use HMAC with the server secret; raw IPs are not stored.
Set a Firestore TTL policy on `contactRateLimits.expiresAt` for eventual cleanup.
Quota expiry does not depend on TTL deletion. Rotating the secret resets per-email
and per-IP quotas; the global quota remains.

## 3. Test in an isolated environment

Deploy the functions to the development Firebase project with private quota rules,
a development Turnstile widget, and a SendGrid sandbox/test sink. Cloudflare's
public test keys may be used only with a non-production backend; production must
never accept them. Do not point preview tests at production with a test secret.

- Valid submission: one contact record and the two expected email requests.
- Missing/forged/expired/reused token, wrong hostname/action, invalid fields, or
  filled honeypot: no contact created and no email.
- Fourth submission to the same normalized email: `resource-exhausted`.
- Concurrent submissions cannot exceed quotas (exercise the real Firestore
  transaction in the emulator/development project).
- Direct creation of a legacy `contact` document never sends an email.
- Website: token expiry and network errors preserve entries and allow a fresh
  security check; success clears the form; repeated clicks cannot send twice.

`cd functions && npm test && npm run lint` runs isolated regression tests with no
real email or database writes. Quota tests substitute the Firestore transport;
they do not prove deployed rules or emulator concurrency behavior.

The separate real-Firestore concurrency test passed: 20 simultaneous requests
for one email saved exactly 3 contacts, with all other attempts rate-limited.
Repeat from the repository root with Java 21 and Firebase CLI installed:

```shell
npm --prefix functions run build
firebase emulators:exec --only firestore --project demo-sdj-security --config firebase.contact-emulator.json 'node --test functions/test/contact-emulator.test.cjs'
```

This test uses a disposable local demo project and sends no email. It supplements
the unit tests; it does not validate live email delivery or a real visitor's
production Turnstile challenge.

## 4. Release and verify

1. Merge/deploy the backend PR, then promptly merge/deploy the website PR. Expect
   a brief contact-form delivery interruption between those deployments.
2. Deny all direct client creates/updates/deletes of `contact` in the existing
   production rules, keeping any authorized admin read access. Check overlapping
   allows here too. The no-op legacy trigger already prevents email bypass, but
   rules are needed to prevent junk database writes and contact tampering.
3. Verify a controlled legitimate submission and confirm the quotas are private.
   Check function errors and SendGrid delivery status without logging form content.

The submitter is no longer CC'd on the administrator email; they receive only the
receipt, and administrators can reply using Reply-To. A mail-provider failure can
leave a saved contact record and consume quota. The callable reports failure and
never automatically retries mail; inspect saved records when investigating a
partial SendGrid failure. This avoids silent success and automatic duplicate mail.

## Rollback

Keep the old trigger as a no-op and keep private rules. Reverting to the old
email-trigger implementation reopens the spam bypass. If the integration fails,
disable the website contact form (unset its site key and rebuild); it displays
the Jamaat contact email. Fix the callable/configuration, then redeploy the form.
