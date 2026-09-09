# FlexiGo Travel

A modular travel platform split into three Next.js apps for customer, admin, and driver experiences.

## Monorepo structure

```bash
apps/
  web/         # public customer-facing website and booking app
  admin/       # internal admin operations dashboard
  driver/      # driver booking and trip management app
packages/
  ui/
  auth/
  db/
  types/
```

## Local development

```bash
npm run dev:web
npm run dev:admin
npm run dev:driver
```

- Web: http://localhost:3000
- Admin: http://localhost:3001
- Driver: http://localhost:3002

## Quality checks

```bash
npm run lint
npm run build
```

## Why this structure

This setup keeps the customer-facing experience, admin console, and driver portal isolated behind their own domains and deployment surfaces while still allowing shared logic to live in one repository.

This is the recommended stepping stone before moving to separate repos later if the product scales.

## Deployment

Create separate Vercel projects that use this repository with these root directories:

- `apps/web`: assign `www.example.com` and `example.com`
- `apps/admin`: assign `admin.example.com`
- `apps/driver`: assign `driver.example.com` once the driver portal is implemented

Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_WEB_URL` independently for each project. The admin app uses its own `flexigo_admin` session cookie and must have a separate Google OAuth redirect URL registered for `https://admin.example.com/api/auth/callback/google`.

## GitHub Push

```bash
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```
