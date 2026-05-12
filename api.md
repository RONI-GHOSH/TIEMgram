# TIEMgram API Documentation

## Base URL
`http://localhost:5000/api/v1`

---

## 🔐 Authentication (`/auth`)

### Register New User
- **URL**: `/auth/register`
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
- **Response (201)**: `{ "success": true, "message": "User registered..." }`

### Verify Email OTP
- **URL**: `/auth/verify-otp`
- **Method**: `POST`
- **Body**: `{ "email": "...", "otp": "1111" }`

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response (200)**: Returns `access_token` and `refresh_token`.

### Refresh Token
- **URL**: `/auth/refresh-token`
- **Method**: `POST`
- **Body**: `{ "refresh_token": "..." }`

### Logout (Protected)
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Header**: `Authorization: Bearer <token>`

---

## 👤 Profile (`/profile`) - All Protected

### Get Own Profile
- **URL**: `/profile/me`
- **Method**: `GET`

### Update Own Profile
- **URL**: `/profile/me`
- **Method**: `PATCH`
- **Body**:
```json
{
  "full_name": "John Doe",
  "bio": "New Bio",
  "department": "CSE",
  "year": 3,
  "semester": 5,
  "is_private": true
}
```

### Upload Avatar
- **URL**: `/profile/me/avatar`
- **Method**: `POST`
- **Body**: `multipart/form-data` with `avatar` field.

### Get Public Profile
- **URL**: `/profile/:username`
- **Method**: `GET`

### Get User Stats
- **URL**: `/profile/:username/stats`
- **Method**: `GET`

---

## 👥 Users & Actions (`/users`) - All Protected

### Follow User
- **URL**: `/users/:username/follow`
- **Method**: `POST`

### Unfollow User
- **URL**: `/users/:username/follow`
- **Method**: `DELETE`

### Accept/Reject Follow Request
- **POST**: `/users/:username/follow/accept`
- **DELETE**: `/users/:username/follow/reject`

### Blocking
- **POST**: `/users/:username/block`
- **DELETE**: `/users/:username/block`

### Lists
- **GET**: `/users/:username/followers`
- **GET**: `/users/:username/following`
- **GET**: `/users/me/blocked`
- **GET**: `/users/me/follow-requests`

---

## 🔍 Search (`/search`) - All Protected

### Fuzzy Search
- **URL**: `/search/users?q=query`
- **Method**: `GET`

### Exact Match
- **URL**: `/search/users/exact?username=john`
- **Method**: `GET`
