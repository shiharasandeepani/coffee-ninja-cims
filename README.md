# Coffee Ninja Inquiry Manager

Staff sign in, record customer inquiries, search them, and move them through New, In Progress and Resolved.
Stack: Next.js, Node.js + Express, PostgreSQL.

## Run locally

1. Database:
```
psql -U postgres -c "CREATE DATABASE cims;"
psql -U postgres -d cims -f backend/db/schema.sql
```
2. Backend (copy `.env.example` to `.env` and set your password):
```
cd backend
npm install
node src/seed.js
npm run dev
```
3. Frontend (new terminal):
```
cd frontend
npm install
npm run dev -- -p 3000
```
Open http://localhost:3000

## Test accounts (password: `password123`)
- alice@coffeeninja.test (staff)
- bob@coffeeninja.test (staff)
- admin@coffeeninja.test (admin)

## Tests
```
cd backend && npm test
cd frontend && npm test
```