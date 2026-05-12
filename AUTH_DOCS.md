# TIEMgram Auth API Documentation

This document explains the authentication flow and endpoints for the TIEMgram backend.

## Base URL
`http://localhost:5000/api/v1/auth`

## 1. Registration Flow
1. **POST `/register`**: User submits details. A record is created with `isVerified: false`. An OTP is sent to the email (logged to console in dev mode).
2. **POST `/verify-otp`**: User submits the OTP. If valid, `isVerified` becomes `true`.

## 2. Authentication Flow
- **POST `/login`**: User submits email/password. Returns `access_token` (valid for 15m) and `refresh_token` (valid for 7d).
- **POST `/refresh-token`**: Submit `refresh_token` to get a new `access_token` and a rotated `refresh_token`.
- **POST `/logout`**: (Protected) Invalidate the `refresh_token` on the server.

## 3. Password Reset Flow
1. **POST `/forgot-password`**: Submit email. Receives OTP via email.
2. **POST `/reset-password`**: Submit email, OTP, and `new_password`.

---

## Endpoint Details

### Register User
- **URL**: `/register`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "student@college.edu",
  "password": "Secret@123",
  "username": "john_doe",
  "full_name": "John Doe",
  "department": "Computer Science",
  "year": 2,
  "semester": 3
}
```

### Login
- **URL**: `/login`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "student@college.edu",
  "password": "Secret@123"
}
```
- **Response**: Returns tokens and user data.

### Refresh Token
- **URL**: `/refresh-token`
- **Method**: `POST`
- **Body**:
```json
{
  "refresh_token": "..."
}
```

### Logout
- **URL**: `/logout`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <access_token>`

---

## Security Notes
- Passwords are hashed using **bcrypt**.
- **JWT Tokens** are used for stateless authentication.
- **Refresh Token Rotation** is implemented for enhanced security.
- **Helmet** middleware is used for setting security-related HTTP headers.
- **CORS** is enabled for cross-origin requests.
