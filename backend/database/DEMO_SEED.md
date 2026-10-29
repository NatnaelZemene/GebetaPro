# Fictional demo accounts

Run `npm run db:seed:demo` from `backend/` after configuring the Supabase database and service role credentials in `.env`.

The script creates or refreshes 12 searchable fictional provider accounts, uploads their original AI-generated PNG profile images to the configured public Supabase Storage bucket, and fills out profile galleries, business hours, social links, two service listings, a portfolio sample, a demo achievement, and a demo update. It is safe to run again; it only refreshes the named demo accounts and their attached sample content.

## Sign-in

All demo users share the password `GebetaDemo2026!`. Their email is `demo.<profile-slug>@example.test` (for example, `demo.abebe-plumbing@example.test`). The reserved `.test` domain is non-deliverable. These records are for local/demo sign-in and directory previews only.

Names, listings, contact links, portfolio entries, achievements, and content are fictional. Profile descriptions identify them as demos; they are not real providers and must not be used to contact or transact with anyone.
