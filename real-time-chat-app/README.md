# Real-Time Chat App

A modern real-time chat application built with React, Express, Socket.IO, and PostgreSQL (Neon).

## Features

- 💬 Real-time messaging with Socket.IO
- 🔐 User authentication with Passport.js
- 💾 PostgreSQL database with Drizzle ORM
- ⚡ Fast development with Vite
- 🎨 Beautiful UI with Tailwind CSS
- 📱 Responsive design

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Wouter (routing)
- TanStack Query

### Backend
- Node.js
- Express
- Socket.IO
- PostgreSQL (Neon)
- Drizzle ORM
- Passport.js
- bcryptjs

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Neon PostgreSQL database (or any PostgreSQL database)

### Installation

1. Clone the repository
```bash
cd real-time-chat-app
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DATABASE_URL=your_neon_database_url
SESSION_SECRET=your_secret_key
NODE_ENV=development
```

4. Push the database schema
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Push database schema

## Project Structure

```
real-time-chat-app/
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main app component
│   └── index.html
├── server/              # Backend Express server
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── socket.ts        # Socket.IO setup
│   └── vite.ts          # Vite integration
├── shared/              # Shared code between frontend and backend
│   └── schema.ts        # Database schema
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

## Features in Detail

### Authentication
- User registration and login
- Session-based authentication with Passport.js
- Password hashing with bcryptjs

### Real-Time Chat
- Real-time messaging with Socket.IO
- User presence tracking
- Message delivery status
- Typing indicators

### Database
- PostgreSQL with Neon (serverless)
- Type-safe queries with Drizzle ORM
- Automatic schema migrations

## License

MIT
