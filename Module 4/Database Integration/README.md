# Database Integration Assignment Starter

Replace the in-memory repository implementation with PostgreSQL through Prisma. The starter already uses an asynchronous repository contract so services and controllers can remain stable during the swap.

## Configure and run

```bash
npm install
npm run prisma:generate
npm start
```

Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you
control. `.env` is ignored by Git; do not put real credentials in the example file.

## Database setup

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:deploy
npm run db:seed
```

`prisma:deploy` applies the committed migration history. For local schema changes,
create a named migration with `npm run prisma:migrate -- --name describe_change`.
The seed command is safe to rerun and only creates its sample author and posts when
they are absent; it does not clear existing data. To reset a local development
database, use Prisma's interactive `migrate reset` command after confirming the
target database. Never point reset commands at production.

The Express API keeps Prisma behind `src/repositories/postRepository.js`. It
retains the list/read/create/update/remove contract, including null/false results
for missing records. Database uniqueness and foreign-key failures are translated
to safe application errors; unexpected infrastructure errors are logged on the
server and returned as a generic 500 response.

Do not add platform-only `question.md`, answer files, tests, or specs to this
repository. Never commit `.env` or real credentials.
