## PluriDesk – Single-user LSP HQ

PluriDesk is a Next.js 15 SaaS workspace inspired by LSP.expert. It centralises jobs, quotes, invoices, suppliers, outsourcing, notifications, and reporting for boutique language service providers.

### Tech stack

- **Frontend**: Next.js 15 App Router, React 18, TypeScript, Tailwind CSS 3, ShadCN UI, React Query, React Hook Form + Zod
- **Backend**: Supabase (Postgres, Auth, Storage, RLS), server actions & API routes
- **Documents**: HTML templates + `@react-pdf/renderer` scaffolding

---

## Project structure

```
src/
  app/
    (workspace)/
      jobs|clients|suppliers|quotes|invoices|expenses|
      reports|settings|notifications|outsourcing|purchase-orders
    api/
      jobs|clients|suppliers|quotes|invoices|expenses|outsourcing|reports
  components/
    layout|navigation|forms|charts|data-table|feedback|providers|ui
  lib/
    env.ts
    supabase/client.ts|server.ts|types.ts
    validators|reports
  utils/
    currencies.ts
supabase/
  config.toml
  migrations/0001_init.sql
styles/
tailwind.config.ts
components.json
```

Each workspace route currently renders mocked data with the shared `WorkspaceShell`. API routes are wired to Supabase via the service role client and ready for server action usage.

---

## Getting started

```bash
# Install dependencies
npm install

# Run Next.js locally
npm run dev
```

Visit `http://localhost:3000` – the root route redirects to `/jobs`.

---

## Environment variables

Create a `.env` file (values below are placeholders):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key

SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_JWT_SECRET=jwt-secret
SUPABASE_DB_PASSWORD=postgres
PLURIDESK_OWNER_ID=00000000-0000-0000-0000-000000000000
SUPABASE_PROJECT_ID=pluridesk
SUPABASE_ACCESS_TOKEN=
```

Reference storage buckets (all private):

```
job-files
outsourcing-invoices
invoice-pdfs
purchase-orders
expenses-files
client-files
supplier-files
```

---

## Supabase setup

1. **Initialize**
   ```bash
   npx supabase init
   ```
2. **Configure** – update `supabase/config.toml` with your project ref if needed.
3. **Apply schema**
   ```bash
   npx supabase db push
   ```
   This seeds enums, tables, job/invoice number generators, buckets, and RLS policies.
4. **Deploy storage** – the migration already creates the required buckets; verify them inside the Supabase dashboard.

The schema enforces single-user ownership through `owner_id` + RLS. Use Supabase Auth to provision the single account, capture the resulting UUID, set it as `PLURIDESK_OWNER_ID`, and insert a matching row in `public.users`.

---

## Tailwind + ShadCN UI

- Tailwind 3 is configured in `tailwind.config.ts` with design tokens, container widths, and the `tailwindcss-animate` plugin.
- `components.json` bootstraps ShadCN with aliases pointing at `@/components`.
- Core primitives (`button`, `input`, `select`, `dialog`, `sheet`, `dropdown-menu`, etc.) live under `src/components/ui`.
- Global CSS variables are defined in `src/app/globals.css`.

Run `npx shadcn@latest add <component>` to extend the design system using the existing config.

---

## Deployment quick notes

1. **Vercel**
   - Set the environment variables above in the Vercel project.
   - Enable `NODE_VERSION >= 18.18`.
2. **Supabase**
   - Promote migrations from `supabase/migrations/0001_init.sql`.
   - Upload workspace assets to the dedicated storage buckets.
3. **Secrets management**
   - Only `NEXT_PUBLIC_*` variables should be exposed to the client.
   - Keep the service role key and JWT secret server-side (API routes + server actions).

You now have the base scaffolding to implement each module (jobs, quotes, invoices, expenses, reports) on top of the typed Supabase schema and ShadCN UI kit.
