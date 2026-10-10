# Aurum FX

Aurum FX is a public business directory for browsing listings by district, with separate portals for field staff and administrators.

## Features

- Public landing page and business directory browsing.
- Public business cards include a map link when the `/customer/businesses` response provides a valid `location_link`.
- Field staff sign-in, dashboard, read-only profile, and business management.
- Admin dashboard, staff management and registration, admin profile updates, and business management.
- Staff registration uploads Aadhaar front/back images and captures Aadhaar number, state, and district.
- Public directory place/city suggestions come from businesses returned for the selected district; visitors can also type a custom place to search.
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
| `/staff/kyc` | Upload Aadhaar documents and review KYC status |
| `/staff/businesses` | Field staff business directory |
| `/admin` | Admin sign-in |
| `/admin/dashboard` | Admin dashboard |
| `/admin/profile` | Update admin email or password |
| `/admin/staff` | Manage staff accounts |
| `/admin/staff/register` | Register a staff account |
| `/admin/staff-kyc` | Review pending, approved, rejected, and historical staff KYC submissions |
| `/admin/businesses` | Manage business records |

Admin staff registration uses `multipart/form-data` with required `name`, `email`, `password`, `phone`, `guardian_contact_number`, `address`, `aadhaar_number`, `state`, and `district` fields. Aadhaar front and back images are optional. Staff profile updates use multipart form data and include the guardian contact number; password and replacement Aadhaar images are optional. Existing Aadhaar images are preserved when no replacement is uploaded. Staff list and detail responses include the guardian contact number, Aadhaar number, and image references along with state and district.
