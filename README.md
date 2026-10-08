# Aurum FX

Aurum FX is a public business directory for browsing listings by district, with separate portals for field staff and administrators.

## Features

- Public landing page and business directory browsing.
- Field staff sign-in, dashboard, read-only profile, and business management.
- Admin dashboard, staff management and registration, admin profile updates, and business management.
- Responsive layouts and shared Aurum FX branding.

## Requirements

- Node.js (LTS recommended)
- npm

## Setup

Install dependencies:

```sh
npm install
```

Create a `.env` file in the project root and set the API base URL:

```env
VITE_API_BASE_URL=https://your-api-host
```

Restart the development server after changing environment variables.

## Development

```sh
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

## Lint

```sh
npm run lint
```

## Main routes

| Route | Description |
| --- | --- |
| `/` | Public landing page |
| `/browse-districts` | Public business directory |
| `/staff` | Field staff sign-in |
| `/staff/dashboard` | Field staff dashboard |
| `/staff/profile` | Read-only field staff profile |
| `/staff/businesses` | Field staff business directory |
| `/admin` | Admin sign-in |
| `/admin/dashboard` | Admin dashboard |
| `/admin/profile` | Update admin email or password |
| `/admin/staff` | Manage staff accounts |
| `/admin/staff/register` | Register a staff account |
| `/admin/businesses` | Manage business records |
