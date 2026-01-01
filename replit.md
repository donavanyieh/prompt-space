# Prompt Party

A prompt sharing application for organizations to consolidate and discover AI prompts.

## Overview

Prompt Party allows teams to:
- Submit prompts with categorization (Domain and Task)
- Browse and search prompts with filters
- View detailed prompts and leave comments
- Share best practices across the organization

## Tech Stack

- **Frontend**: React, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Storage**: In-memory (MemStorage)

## Project Structure

```
├── client/src/
│   ├── components/        # Reusable UI components
│   │   ├── navbar.tsx     # Main navigation
│   │   └── theme-toggle.tsx # Dark/light mode toggle
│   ├── pages/             # Page components
│   │   ├── home.tsx       # Landing page
│   │   ├── browse.tsx     # Browse prompts with search/filters
│   │   ├── submit.tsx     # Submit new prompt form
│   │   └── prompt-detail.tsx # View prompt + comments
│   ├── lib/               # Utilities
│   └── App.tsx            # Main app with routing
├── server/
│   ├── routes.ts          # API endpoints
│   └── storage.ts         # In-memory data storage
└── shared/
    └── schema.ts          # Data models and types
```

## API Endpoints

- `GET /api/prompts` - List prompts (supports ?search, ?domains, ?tasks filters)
- `GET /api/prompts/:id` - Get single prompt
- `POST /api/prompts` - Create new prompt
- `GET /api/prompts/:id/comments` - Get comments for a prompt
- `GET /api/prompts/:id/comments/count` - Get comment count
- `POST /api/prompts/:id/comments` - Add comment to a prompt

## Data Models

### Prompt
- id, prompt (text), domain, task, notes (optional), authorName, createdAt

### Comment
- id, promptId, content, authorName, createdAt

### Domains
Engineering, Marketing, Sales, Customer Support, Product, Design, HR, Finance, Legal, Operations

### Tasks
Content Writing, Code Generation, Data Analysis, Email Drafting, Research, Summarization, Translation, Brainstorming, Documentation, Review & Feedback

## Running the Application

The app runs on port 5000 via `npm run dev`.
