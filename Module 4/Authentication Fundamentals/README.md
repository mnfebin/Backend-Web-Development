# Module 4 Authentication Fundamentals

This Express API implements user registration and login with Prisma, SQLite, and
`bcryptjs`. Passwords are hashed before storage, and API responses include only
the user's `id`, `name`, and normalized `email`.

## Setup

From this directory, install dependencies and configure the local database:

```powershell
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init-auth
```

The example database URL uses a local SQLite file. The generated `.env` and
database are ignored by Git; never commit secrets or password data.

## Run

```powershell
npm start
```

The API listens on port `3000` by default. Set `PORT` in `.env` to use another
port.

## Endpoints

### `POST /auth/register`

Request:

```json
{
  "name": "Sam",
  "email": "sam@example.com",
  "password": "correct horse battery staple"
}
```

A successful registration returns `201` with only `id`, `name`, and `email`.
Emails are trimmed and lowercased before lookup and storage. Registering an
existing normalized email returns `409 EMAIL_ALREADY_EXISTS`; missing or
non-string required fields return `400 INVALID_INPUT`.

### `POST /auth/login`

Request:

```json
{
  "email": "sam@example.com",
  "password": "correct horse battery staple"
}
```

A successful login returns `200` with only `id`, `name`, and `email`. Unknown
emails and incorrect passwords return the same `401 INVALID_CREDENTIALS`
response. Malformed JSON returns `400 INVALID_INPUT`; unexpected errors return
a generic `500 INTERNAL_ERROR` response.

## Tests

```powershell
npm test
```

The tests initialize an isolated SQLite database, exercise both endpoints, and
remove the test database afterward.
