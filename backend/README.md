# PS 17 - Crowdsourced Civic Issue Reporting and Resolution System (Backend)

Backend service for the web-first civic issue lifecycle management platform connecting citizens, government authorities, and field workers.

## Tech Stack
- Node.js
- Express.js
- MongoDB Atlas / Mongoose
- JWT (jsonwebtoken) & bcryptjs
- JavaScript (CommonJS)
- REST APIs

## Environment Variables
Create a `.env` file in the root of the `backend/` directory (see `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/civic_platform
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

## Setup & Execution

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Seed development accounts (ADMIN, FIELD_WORKER, CITIZEN):
   ```bash
   npm run seed
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

5. Start in production mode:
   ```bash
   npm start
   ```

## API Endpoints

### System Health
- **GET** `/api/health` - Check server & MongoDB status.

### Authentication (`/api/auth`)
- **POST** `/api/auth/register` - Public citizen registration (`CITIZEN` role default).
- **POST** `/api/auth/login` - User login & JWT token retrieval.
- **GET** `/api/auth/me` - Get currently authenticated user profile (Requires `Authorization: Bearer <token>`).

## Development Credentials (after `npm run seed`)
- **Admin**: `admin@civic.local` / `AdminPassword123!`
- **Field Worker**: `worker@civic.local` / `WorkerPassword123!`
- **Citizen**: `citizen@civic.local` / `CitizenPassword123!`
