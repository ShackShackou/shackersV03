# Setup PostgreSQL + Prisma

1. Install PostgreSQL + pgAdmin4
2. Create database `labrute_mvp`
3. In `server/.env`, set DATABASE_URL with your password
4. From `server/` run:
```
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
