# GEMINI.md - Project Context & Instructions

## Project Overview

**Project Name:** ZARANG
**Description:** An image-centric community platform for hobbyists to showcase and share items like keyboards, mice, figures, and desk setups.
**Main Technologies:**
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
- **Backend:** Supabase (Auth, PostgreSQL Database, Storage).
- **Validation:** `zod`, `react-hook-form`.
- **Architecture:** Feature-Sliced Design (FSD).

## Core Features (MVP)

1.  **Authentication:** Social login via Google, Kakao, and Naver (Supabase Auth).
2.  **Home Feed:** A feed displaying the latest posts with 16:9 thumbnail previews.
3.  **Post Creation:** Multi-image uploads (up to 10), titles, descriptions, and category selection.
4.  **Post Details:** Image carousel, post body, like button, and comment section.
5.  **Interactions:** Likes and comments.
6.  **My Page:** Profile overview and list of user-created posts.

## Architecture & Conventions

### Feature-Sliced Design (FSD)

The project follows the FSD structure within the `src/` directory. The root `app/` directory serves as a bridge, re-exporting from the `src/` layers.

- **`app/`**: Entry point and global configurations (re-exported from `src/app`).
- **`pages/`**: Complete page components.
- **`widgets/`**: Complex UI blocks composed of features.
- **`features/`**: User actions (e.g., `like-post`, `create-post`).
- **`entities/`**: Business logic and data models (e.g., `post`, `user`).
- **`shared/`**: Generic UI components (shadcn/ui), utilities, and API clients.

### UI/UX Standards

- **Mobile-First:** Designed primarily for mobile users.
- **Layout:** Centered content with a fixed maximum width of **420px**.
- **External Background:** Light grey (`bg-neutral-100`).
- **Internal Background:** White.
- **Components:** Primarily uses `shadcn/ui`.

### Technical Guidelines

- **Next.js:** Prefer Server Components for data fetching.
- **Supabase:**
    - Use `@supabase/ssr` for client/server initialization.
    - Enable Row Level Security (RLS) on all PostgreSQL tables.
    - Route handlers are used for image uploads and sensitive operations.
- **Styling:** Use Tailwind CSS v4 utility classes.
- **Validation:** Always use `zod` schemas for form and API input validation.

## Building and Running

### Prerequisites
- `pnpm` (v10.27.0 recommended)

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Production
```bash
# Build the project
pnpm build

# Start production server
pnpm start
```

### Quality Control
```bash
# Run linting
pnpm lint
```

## Environment Variables

Ensure the following variables are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---
*Note: This file is used as context for Gemini CLI. Keep it updated with major architectural changes.*
