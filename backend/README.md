# PS 17 - Crowdsourced Civic Issue Reporting and Resolution System (Backend)

Backend foundation for the web-first civic issue lifecycle management platform connecting citizens, government authorities, and field workers.

## Tech Stack
- Node.js
- Express.js
- MongoDB Atlas / Mongoose
- JavaScript (CommonJS)
- REST APIs

## Environment Variables
Create a `.env` file in the root of the `backend/` directory (see `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/civic_platform
CLIENT_URL=http://localhost:3000
```

## Setup Instructions

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Start in production mode:
   ```bash
   npm start
   ```

## API Endpoints

### Health Check
- **URL**: `GET /api/health`
- **Response Example**:
  ```json
  {
    "success": true,
    "message": "Civic platform backend is running",
    "database": "connected"
  }
  ```
