# features/admin/

Admin dashboard for platform management — user moderation, category management, subscription oversight, analytics, and profile verification.

Access is restricted to users with the `admin` role (enforced via ProtectedRoute in Phase 4).

## Planned structure (Phase 8)

```
admin/
├── components/       # Shared admin tables, cards, and dashboard charts
├── hooks/            # useAdmin.js
├── services/         # adminService.js  (API calls)
└── pages/            # AdminDashboardPage.jsx, AdminUsersPage.jsx
```
