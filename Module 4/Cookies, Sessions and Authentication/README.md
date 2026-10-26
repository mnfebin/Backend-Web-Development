# Session Authentication

This Express API authenticates users against the SQLite database and uses signed
cookies to identify server-side sessions.

## Setup

From this directory, create the local environment file and install dependencies:

```powershell
Copy-Item .env.example .env
npm install
npm run setup
```

Set `COOKIE_SECRET` in `.env` to a private, randomly generated value of at least
32 characters. `npm run setup` generates the Prisma client, creates/updates the
local database, and seeds the demo account:

- Email: `sam@example.com`
- Password: `SessionDemo!48`

Start the API:

```powershell
npm run dev
```

The server listens on `http://localhost:3000` by default. Set `PORT` in `.env`
to use another port.

## Cookie configuration

The `sid` cookie is signed, `HttpOnly`, scoped to `/`, and uses `SameSite=Lax`.
Its lifetime is set from `SESSION_TTL_MS` (one hour by default). `COOKIE_SECURE`
can enable the `Secure` flag explicitly; it is enabled automatically when
`NODE_ENV=production`.

Production deployments must use HTTPS so browsers can send the `Secure` cookie.
Keep `COOKIE_SECURE=false` for local HTTP development; do not disable secure
cookies in production.

## Endpoints

- `POST /auth/login` — accepts `{ "email": "...", "password": "..." }`, verifies
  the password, sets the signed session cookie, and returns the public user.
- `GET /auth/me` — returns the authenticated public user; responds with 401 if
  the cookie is missing, invalid, or expired.
- `POST /auth/logout` — destroys the current server-side session, clears the
  cookie, and responds with `204 No Content`.

Keep the cookie between requests when verifying the login lifecycle. In
PowerShell:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ email = 'sam@example.com'; password = 'SessionDemo!48' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method Post -ContentType 'application/json' -Body $body -WebSession $session
Invoke-RestMethod -Uri http://localhost:3000/auth/me -WebSession $session
$logout = Invoke-WebRequest -Uri http://localhost:3000/auth/logout -Method Post -WebSession $session
$logout.StatusCode # 204
```

After logout, `GET /auth/me` should return 401. To check input validation, try
logging in with an incorrect password; the endpoint should return 401.

## Session storage limitation

Sessions are held in an in-memory `Map`. They are local to one running Node.js
process: restarting the server clears all sessions, and multiple server
instances do not share sessions. This store is suitable only for local
development and learning, not a multi-instance production deployment. Use a
shared persistent session store before scaling the service.
