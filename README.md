# Metropolitan University Student Portal — Authenticated React App

This is a complete CRA-based rebuild of the supplied Student Portal with:

- Login screen and form validation
- Auth context/provider
- Protected application shell
- Access-token + refresh-token service
- Automatic Bearer token injection
- Automatic access-token refresh after HTTP 401
- Logout/revocation request and local token cleanup
- Session restoration after browser refresh
- Remember-me support
- Responsive desktop/mobile sidebar
- Existing dashboard/profile UI retained
- Configurable backend URL
- Development demo mode so the app runs without a backend

## Run

```bash
npm install
npm start
```

Demo mode is enabled by default. Any non-empty login ID and password will sign in.

## Connect your real backend

Create `.env.local`:

```env
REACT_APP_DEMO_MODE=false
REACT_APP_API_BASE_URL=https://your-api.example.com/api
```

The frontend expects these endpoints:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

Login request:

```json
{
  "login_id": "221-115-001",
  "password": "your-password"
}
```

Expected successful login response:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "user": {
    "studentId": "221-115-001",
    "name": "Student Name"
  }
}
```

The implementation also accepts `accessToken`, `refreshToken`, `token`, `student`, or `data` aliases where practical.

### Token behavior

`src/services/tokenService.js` manages tokens. `src/services/apiClient.js` attaches:

```text
Authorization: Bearer <access_token>
```

When an authenticated request returns `401`, the client calls `/auth/refresh`, stores the new access token, and retries the original request once.

For a production system, the strongest browser architecture is generally an in-memory access token plus a Secure/HttpOnly/SameSite refresh-token cookie. This project supports JSON refresh tokens for compatibility with common APIs; you should change the backend/frontend flow to HttpOnly cookies if your security requirements call for it.

### Important

Never put a JWT signing secret in this React application. Token signing and validation must happen on the server.

## Suggested FastAPI response contract

If your backend is FastAPI, keep the login response shape close to:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "user": { "...": "..." }
}
```

and make `/auth/me` return the currently authenticated student.

## Build

```bash
npm run build
```

The production bundle is created in `build/`.
