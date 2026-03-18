# DnD Tool

A full-stack **Dungeons & Dragons** companion tool built with [Next.js](https://nextjs.org/), [tRPC](https://trpc.io/), [Prisma](https://www.prisma.io/), and [PostgreSQL](https://www.postgresql.org/) — all containerised with Docker.

![Login Page](https://github.com/user-attachments/assets/45751e32-01ce-4031-a65d-e06578f1638a)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (Pages Router), React 18, TypeScript |
| API | tRPC v11 (end-to-end type safety) |
| Database | PostgreSQL 16 (via Docker) |
| ORM | Prisma 5 |
| Auth | bcryptjs (password hashing) |
| Containers | Docker & Docker Compose |

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### Local development (without Docker)

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and set a real DATABASE_URL
   ```

3. **Start a local PostgreSQL instance** (or use Docker just for the DB)

   ```bash
   POSTGRES_PASSWORD=your-secure-password docker compose up postgres -d
   ```

4. **Push the Prisma schema to the database**

   ```bash
   npm run db:push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Running with Docker Compose (full stack)

```bash
# Copy and customise the environment file
cp .env.example .env
# Set POSTGRES_PASSWORD in .env to a strong password

# Build and start all services
POSTGRES_PASSWORD=your-secure-password docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema (User model)
├── public/
│   └── dnd-background.svg     # D&D themed background image
├── src/
│   ├── pages/
│   │   ├── _app.tsx           # tRPC + React Query providers
│   │   ├── index.tsx          # Login / Register page
│   │   └── api/trpc/[trpc].ts # tRPC API handler
│   ├── server/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── trpc.ts            # tRPC initialisation & context
│   │   └── routers/
│   │       ├── _app.ts        # Root app router
│   │       └── auth.ts        # Login & register mutations
│   ├── styles/
│   │   └── globals.css
│   └── utils/
│       └── api.ts             # tRPC React client
├── docker-compose.yml         # PostgreSQL + app services
├── Dockerfile                 # Multi-stage production build
└── .env.example               # Environment variable template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Security Notes

- Passwords are hashed with **bcryptjs** (12 salt rounds) before storage — plain-text passwords are never persisted.
- The `POSTGRES_PASSWORD` environment variable is **required** at runtime and must not be committed to source control.
- Session management (JWT / cookies) is left as a next step — the current login mutation validates credentials and returns user data.
