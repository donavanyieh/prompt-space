# Prompt Space
<img width="512" height="240" alt="image" src="https://github.com/user-attachments/assets/51d16a0a-70b6-4319-9914-5722e9d9a0ee" />

A collaborative prompt management platform for teams to share, version, and organize AI prompts.

## Features

- 🔐 **Google OAuth Authentication** - Secure authentication via Google accounts
- 👥 **Team Collaboration** - Create teams and invite members with join codes
- 📝 **Prompt Management** - Create, edit, and version your prompts
- 💬 **Comments & Discussions** - Discuss prompts with team members
- 👍 **Voting System** - Upvote/downvote prompts for quality curation
- 🏷️ **Categorization** - Organize prompts by domain and task type
- 🔍 **Search & Filter** - Find prompts quickly with advanced filtering
- 📊 **Version History** - Track changes with automatic version control

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Google OAuth 2.0 (OpenID Connect)
- **ORM**: Drizzle ORM
- **Build Tools**: Vite, esbuild

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- PostgreSQL database (or Supabase account)
- Google OAuth credentials

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/donavanyieh/prompt-space.git
cd prompt-space
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ISSUER_URL=https://accounts.google.com
CALLBACK_URL=http://localhost:5000/api/callback

# Session Secret (generate a secure random string)
SESSION_SECRET=your_secure_random_string

# Server Configuration
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:port/database
```

**⚠️ Security Note**: Never commit your `.env` file to version control. The `.env` file is already included in `.gitignore`.

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:5000/api/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### 5. Set Up Database

Push the database schema using Drizzle:

```bash
npm run db:push
```

## Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Build

Build the application for production:

```bash
npm run build
npm run start
```

## Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose build --no-cache
docker-compose up
```

The application will be available at `http://localhost:5000`

## Project Structure

```
prompt-space/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Page components
├── server/              # Backend Express application
│   ├── auth/           # Authentication logic
│   ├── db.ts           # Database connection
│   ├── routes.ts       # API routes
│   └── storage.ts      # Database queries
├── shared/             # Shared types and schemas
│   ├── schema.ts       # Database schema (Drizzle)
│   └── models/         # Shared models
└── script/             # Build scripts
```

## Security Best Practices

### Environment Variables
- **Never commit** `.env` files or any files containing secrets
- Use strong, randomly generated values for `SESSION_SECRET`
- Rotate credentials regularly
- Use different credentials for development and production

### OAuth Configuration
- Keep your Google OAuth Client Secret secure
- Regularly review authorized redirect URIs
- Use HTTPS in production environments

### Database Security
- Use strong database passwords
- Enable SSL/TLS for database connections in production
- Regularly backup your database
- Keep database access restricted to necessary services

### General Security
- Keep dependencies up to date (`npm audit` and `npm update`)
- Use environment-specific configurations
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
