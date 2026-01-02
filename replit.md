# Prompt Party

A prompt sharing application for organizations to consolidate and discover AI prompts with team-based access control.

## Overview

Prompt Party allows teams to:
- Create teams or join existing teams via unique 8-character join codes
- Submit prompts with title, categorization (Domain and Task), and notes
- Browse and search prompts with filters (team-scoped)
- View detailed prompts and leave comments
- Share best practices across the organization

## Tech Stack

- **Frontend**: React, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Replit Auth (OpenID Connect - supports Google, GitHub, email)

## Project Structure

```
├── client/src/
│   ├── components/        # Reusable UI components
│   │   ├── navbar.tsx     # Main navigation with auth state
│   │   └── theme-toggle.tsx # Dark/light mode toggle
│   ├── pages/             # Page components
│   │   ├── home.tsx       # Landing page (auth-aware)
│   │   ├── browse.tsx     # Browse prompts with search/filters
│   │   ├── submit.tsx     # Submit new prompt form
│   │   ├── prompt-detail.tsx # View prompt + comments
│   │   └── team.tsx       # Team management (create/join)
│   ├── hooks/
│   │   └── use-auth.ts    # Authentication hook
│   ├── lib/               # Utilities
│   └── App.tsx            # Main app with routing
├── server/
│   ├── routes.ts          # API endpoints (auth-protected)
│   ├── storage.ts         # DatabaseStorage implementation
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry with auth setup
│   └── replit_integrations/
│       └── auth/          # Replit Auth integration
└── shared/
    ├── schema.ts          # Database schema and types
    └── models/
        └── auth.ts        # Auth-related models (users, sessions)
```

## API Endpoints

All endpoints except `/api/login`, `/api/logout`, `/api/auth/user` require authentication.

### Authentication
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Log out
- `GET /api/auth/user` - Get current user

### Teams
- `GET /api/teams/my` - Get user's teams
- `GET /api/teams/:id` - Get team details (requires membership)
- `GET /api/teams/:id/members` - Get team members (requires membership)
- `POST /api/teams` - Create new team
- `POST /api/teams/join` - Join team via join code

### Prompts (team-scoped)
- `GET /api/prompts` - List prompts for user's team
- `GET /api/prompts/mine` - Get all prompts submitted by current user
- `GET /api/prompts/:id` - Get single prompt (requires team membership)
- `POST /api/prompts` - Create new prompt (requires team membership)
- `DELETE /api/prompts/:id` - Delete prompt (author only, cascades to comments/votes)

### Comments
- `GET /api/prompts/:id/comments` - Get comments (requires team membership)
- `GET /api/prompts/:id/comments/count` - Get comment count
- `POST /api/prompts/:id/comments` - Add comment (requires team membership)

## Data Models

### Team
- id, name, joinCode (8-char unique), leaderId, createdAt

### TeamMember
- id, teamId, userId, joinedAt

### Prompt
- id, title, prompt (text), domain, task, notes (optional), authorId, authorName, teamId, createdAt

### Comment
- id, promptId, content, authorId, authorName, createdAt

### User (from Replit Auth)
- id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt

### Domains
Engineering, Marketing, Sales, Customer Support, Product, Design, HR, Finance, Legal, Operations

### Tasks
Content Writing, Code Generation, Data Analysis, Email Drafting, Research, Summarization, Translation, Brainstorming, Documentation, Review & Feedback

## Access Control

- Users must log in via Replit Auth to access the app
- Users must create or join a team to submit/view prompts
- Prompts are scoped to teams - users can only see prompts from their team
- Team leaders can share the 8-character join code with teammates
- Author names are derived from authenticated user data

## Running the Application

The app runs on port 5000 via `npm run dev`.

Database migrations: `npm run db:push`
