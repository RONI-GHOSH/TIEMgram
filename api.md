# TIEMgram API & Database Documentation

Welcome to the unified documentation for the **TIEMgram PostgreSQL API**. This document serves as the single source of truth for all API endpoints, request/response payload examples, database schemas, and seed dummy data.

---

## 💾 Database SQL Schema & Dummy Data

This matches the relational database layout implemented via PostgreSQL and managed through Sequelize models.

```sql
-- TIEMgram Database Schema (PostgreSQL)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean existing tables if they exist to prevent conflicts
DROP TABLE IF EXISTS "StoryViews", "Stories", "Likes", "PostMedia", "Posts", "Blocks", "Follows", "Users" CASCADE;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username" VARCHAR(255) UNIQUE NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "department" VARCHAR(255) NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "otp" VARCHAR(255),
    "otpExpires" TIMESTAMP WITH TIME ZONE,
    "bio" TEXT,
    "avatar_url" VARCHAR(255),
    "is_private" BOOLEAN DEFAULT FALSE,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Follows Table
CREATE TABLE IF NOT EXISTS "Follows" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "followerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "followingId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "status" VARCHAR(20) DEFAULT 'accepted' CHECK ("status" IN ('pending', 'accepted')),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Blocks Table
CREATE TABLE IF NOT EXISTS "Blocks" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "blockerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "blockedId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Posts Table
CREATE TABLE IF NOT EXISTS "Posts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "caption" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'text' CHECK ("type" IN ('image', 'video', 'text')),
    "location" VARCHAR(255),
    "tags" JSONB DEFAULT '[]'::jsonb,
    "is_public" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. PostMedia Table
CREATE TABLE IF NOT EXISTS "PostMedia" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "postId" UUID NOT NULL REFERENCES "Posts"("id") ON DELETE CASCADE,
    "url" VARCHAR(255) NOT NULL,
    "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('image', 'video')),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Likes Table
CREATE TABLE IF NOT EXISTS "Likes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES "Posts"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_user_post_like" UNIQUE ("userId", "postId")
);

-- 7. Stories Table
CREATE TABLE IF NOT EXISTS "Stories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "mediaUrl" VARCHAR(255),
    "type" VARCHAR(20) NOT NULL DEFAULT 'text' CHECK ("type" IN ('image', 'video', 'text', 'sticker')),
    "text_content" TEXT,
    "text_color" VARCHAR(10) DEFAULT '#FFFFFF',
    "background_color" VARCHAR(10) DEFAULT '#E91E8C',
    "sticker_id" VARCHAR(255),
    "duration_seconds" INTEGER DEFAULT 5,
    "audience" VARCHAR(20) DEFAULT 'public' CHECK ("audience" IN ('public', 'followers', 'close_friends')),
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. StoryViews Table
CREATE TABLE IF NOT EXISTS "StoryViews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "storyId" UUID NOT NULL REFERENCES "Stories"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_story_user_view" UNIQUE ("storyId", "userId")
);

-- Seed Dummy Data
INSERT INTO "Users" ("id", "username", "email", "password", "full_name", "department", "year", "semester", "isVerified")
VALUES 
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'john_doe', 'john@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'John Doe', 'Computer Science', 2, 3, TRUE),
('e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'jane_smith', 'jane@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'Jane Smith', 'Information Technology', 1, 2, TRUE),
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'bob_brown', 'bob@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'Bob Brown', 'Electronics', 3, 5, TRUE);

INSERT INTO "Follows" ("followerId", "followingId", "status")
VALUES 
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'accepted'),
('e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', 'accepted'),
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', 'pending');

INSERT INTO "Blocks" ("blockerId", "blockedId")
VALUES 
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3');

INSERT INTO "Posts" ("id", "userId", "caption", "type", "location", "tags", "is_public", "createdAt", "updatedAt")
VALUES
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299601', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'A beautiful morning on campus!', 'image', 'Main Quad', '["morning", "campus"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299602', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', 'Studying hard for the midterm exams.', 'text', 'Library', '["study", "midterms"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299603', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'Coding till sunrise!', 'text', 'CSE Lab', '["coding", "hackathon"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '30 hours', CURRENT_TIMESTAMP - INTERVAL '30 hours'),
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299604', 'f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'Enjoying the college festival.', 'video', 'Auditorium', '["festival", "fun"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299605', 'f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'Electronics workshop day 1.', 'image', 'Lab 302', '["electronics", "workshop"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '35 hours', CURRENT_TIMESTAMP - INTERVAL '35 hours');

INSERT INTO "PostMedia" ("id", "postId", "url", "type")
VALUES
('m22d7eb4-8f35-4cb2-8d76-d6b7b6299611', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299601', 'https://res.cloudinary.com/dd3drikgz/image/upload/quad.png', 'image'),
('m22d7eb4-8f35-4cb2-8d76-d6b7b6299612', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299604', 'https://res.cloudinary.com/dd3drikgz/video/upload/fest.mp4', 'video'),
('m22d7eb4-8f35-4cb2-8d76-d6b7b6299613', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299605', 'https://res.cloudinary.com/dd3drikgz/image/upload/lab.png', 'image');

INSERT INTO "Likes" ("userId", "postId")
VALUES
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299601'),
('e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299602'),
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299603'),
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299603'),
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299605');

INSERT INTO "Stories" ("id", "userId", "mediaUrl", "type", "text_content", "text_color", "background_color", "sticker_id", "duration_seconds", "audience", "expiresAt", "createdAt")
VALUES
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299621', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'https://res.cloudinary.com/dd3drikgz/image/upload/quad.png', 'image', 'First day of sem!', '#FFFFFF', '#E91E8C', 'stk_party', 10, 'followers', CURRENT_TIMESTAMP + INTERVAL '22 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299622', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', NULL, 'text', 'Midterm prep starting...', '#FFFFFF', '#E91E8C', NULL, 5, 'public', CURRENT_TIMESTAMP + INTERVAL '20 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299623', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', NULL, 'sticker', NULL, '#FFFFFF', '#E91E8C', 'stk_sleep', 5, 'public', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '25 hours');

INSERT INTO "StoryViews" ("storyId", "userId")
VALUES
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299621', 'd748805f-0f6f-4cb1-97b7-5a1df47de510');
```

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
- **Response (201 Created)**: `{ "success": true, "message": "User registered..." }`

### Verify Email OTP
- **URL**: `/auth/verify-otp`
- **Method**: `POST`
- **Body**: `{ "email": "student@college.edu", "otp": "1111" }`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "d748805f-0f6f-4cb1-97b7-5a1df47de510",
    "username": "john_doe",
    "email": "john@college.edu",
    "full_name": "John Doe",
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG..."
  }
}
```


### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**: `{ "email": "student@college.edu", "password": "Secret@123" }`
- **Response (200 OK)**:
```json
{
  "success": true,
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG..."
}
```

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

### Check Profile Completeness
Checks which profile fields are filled and whether all required fields are complete, returning a completeness percentage.
- **URL**: `/profile/me/completeness`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "is_complete": true,
    "percentage": 100,
    "details": [
      { "field": "full_name", "filled": true, "required": true },
      { "field": "department", "filled": true, "required": true },
      { "field": "year", "filled": true, "required": true },
      { "field": "semester", "filled": true, "required": true },
      { "field": "bio", "filled": true, "required": false },
      { "field": "avatar_url", "filled": true, "required": false }
    ]
  }
}
```


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

---

## 📝 Posts (`/posts`) - All Protected

### Create Post
- **URL**: `/posts`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**: `multipart/form-data`
  - `media`: Files array (key: `media`, up to 10 files)
  - `caption`: String (optional)
  - `type`: String (`image`, `video`, `text`. Default: `text`)
  - `location`: String (optional)
  - `tags`: Stringified JSON Array (optional, e.g. `["trip", "fun"]`)
  - `is_public`: Boolean (Default: `true`)
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "p11d7eb4-8f35-4cb2-8d76-d6b7b6299601",
    "userId": "e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3",
    "caption": "A beautiful morning on campus!",
    "type": "image",
    "location": "Main Quad",
    "tags": ["morning", "campus"],
    "is_public": true,
    "createdAt": "2026-05-19T10:15:30.000Z",
    "updatedAt": "2026-05-19T10:15:30.000Z",
    "PostMedia": [
      {
        "id": "m22d7eb4-8f35-4cb2-8d76-d6b7b6299611",
        "postId": "p11d7eb4-8f35-4cb2-8d76-d6b7b6299601",
        "url": "https://res.cloudinary.com/...",
        "type": "image"
      }
    ]
  }
}
```

### Get Single Post
- **URL**: `/posts/:post_id`
- **Method**: `GET`

### Get User Posts (Paginated & Sorted)
Retrieve posts uploaded by a specific user with pagination and sorting by time or total likes.
- **URL**: `/users/:username/posts?page=1&limit=10&sort=time`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Params**:
  - `page`: Number (optional, page offset, default: `1`)
  - `limit`: Number (optional, page size, default: `10`)
  - `sort`: String (optional, either `time` for newest first or `likes` for most liked first. Default: `time`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 1,
  "data": [
    {
      "id": "p11d7eb4-8f35-4cb2-8d76-d6b7b6299601",
      "userId": "e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3",
      "caption": "A beautiful morning on campus!",
      "type": "image",
      "location": "Main Quad",
      "tags": ["morning", "campus"],
      "is_public": true,
      "createdAt": "2026-05-19T10:15:30.000Z",
      "updatedAt": "2026-05-19T10:15:30.000Z",
      "likes_count": 42,
      "is_liked": true,
      "PostMedia": [
        {
          "id": "m22d7eb4-8f35-4cb2-8d76-d6b7b6299611",
          "postId": "p11d7eb4-8f35-4cb2-8d76-d6b7b6299601",
          "url": "https://res.cloudinary.com/...",
          "type": "image"
        }
      ]
    }
  ]
}
```


### Edit Post
- **URL**: `/posts/:post_id`
- **Method**: `PATCH`
- **Body**:
```json
{
  "caption": "Updated caption",
  "is_public": false,
  "tags": ["nature", "beauty"]
}
```

### Delete Post
- **URL**: `/posts/:post_id`
- **Method**: `DELETE`

### Like Post
- **URL**: `/posts/:post_id/like`
- **Method**: `POST`

### Unlike Post
- **URL**: `/posts/:post_id/like`
- **Method**: `DELETE`

### Get Post Likers
- **URL**: `/posts/:post_id/likes`
- **Method**: `GET`

---

## 📸 Stories (`/stories`) - All Protected

### Create Story
- **URL**: `/stories`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**: `multipart/form-data`
  - `media`: File (required if `type` is `image` or `video`)
  - `type`: String (optional, one of: `image`, `video`, `text`, `sticker`. Default: `text`)
  - `text_content`: String (optional, overlay text or story text)
  - `text_color`: String (optional, hex color like `#FFFFFF`)
  - `background_color`: String (optional, hex color like `#E91E8C`)
  - `sticker_id`: String (optional, e.g., `stk_party`)
  - `duration_seconds`: Number (optional, how long the story is displayed. Default: `5`)
  - `audience`: String (optional, one of: `public`, `followers`, `close_friends`. Default: `public`)
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "s33d7eb4-8f35-4cb2-8d76-d6b7b6299621",
    "userId": "e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3",
    "mediaUrl": "https://res.cloudinary.com/...",
    "type": "image",
    "text_content": "First day of sem!",
    "text_color": "#FFFFFF",
    "background_color": "#E91E8C",
    "sticker_id": "stk_party",
    "duration_seconds": 10,
    "audience": "followers",
    "expiresAt": "2026-05-20T10:15:30.000Z",
    "createdAt": "2026-05-19T10:15:30.000Z",
    "updatedAt": "2026-05-19T10:15:30.000Z"
  }
}
```

### Get Active Stories Feed
- **URL**: `/stories`
- **Method**: `GET`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "s33d7eb4-8f35-4cb2-8d76-d6b7b6299621",
      "userId": "e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3",
      "mediaUrl": "https://res.cloudinary.com/...",
      "type": "image",
      "text_content": "First day of sem!",
      "text_color": "#FFFFFF",
      "background_color": "#E91E8C",
      "sticker_id": "stk_party",
      "duration_seconds": 10,
      "audience": "followers",
      "expiresAt": "2026-05-20T10:15:30.000Z",
      "createdAt": "2026-05-19T10:15:30.000Z",
      "updatedAt": "2026-05-19T10:15:30.000Z",
      "is_viewed": true,
      "User": {
        "username": "jane_smith",
        "full_name": "Jane Smith",
        "avatar_url": "https://res.cloudinary.com/..."
      }
    }
  ]
}
```

### Mark Story as Viewed
- **URL**: `/stories/:story_id/view`
- **Method**: `POST`
- **Response (200 OK)**: `{ "success": true, "message": "Story marked as viewed" }`

### Get Story Viewers (Creator Only)
- **URL**: `/stories/:story_id/viewers`
- **Method**: `GET`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "d748805f-0f6f-4cb1-97b7-5a1df47de510",
        "username": "john_doe",
        "full_name": "John Doe",
        "avatar_url": "https://res.cloudinary.com/..."
      },
      "viewedAt": "2026-05-19T11:20:00.000Z"
    }
  ]
}
```

### Delete Story
- **URL**: `/stories/:story_id`
- **Method**: `DELETE`

---

## 📰 Personalized discovery Feed (`/feed`) - Protected

### Get Personalized Feed
Fetches a highly personalized blended discovery feed with page offsets and dynamic items mixing. Shuffled in-place to keep content layout vibrant, without duplicate items appearing on subsequent pages.
- **URL**: `/feed?page=1`
- **Method**: `GET`
- **Query Params**:
  - `page`: Number (optional, page offset, default: `1`. Page size is fixed at `20` items/page).
- **Algorithm Rules**:
  - **70% (14 posts)** from Followed Users & Self:
    - Ranked first: posts under 24 hours old, sorted by timestamp (newest first).
    - Ranked second: posts older than 24 hours old, sorted by count of Likes (most liked first).
  - **10% (2 posts)** Platform Recent posts:
    - Discovery: public posts from unfollowed, non-blocked, and public users, sorted by timestamp (newest first).
  - **20% (4 posts)** Platform Best Performing posts:
    - Discovery: public posts from unfollowed, non-blocked, and public users, ranked by total Likes (most liked first).
  - **Shuffling**: The final 20 mixed items are shuffled using Fisher-Yates shuffle at the end of the query to provide a vibrant experience.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "p11d7eb4-8f35-4cb2-8d76-d6b7b6299601",
      "userId": "e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3",
      "caption": "A beautiful morning on campus!",
      "type": "image",
      "location": "Main Quad",
      "tags": ["morning", "campus"],
      "is_public": true,
      "createdAt": "2026-05-19T10:15:30.000Z",
      "updatedAt": "2026-05-19T10:15:30.000Z",
      "likes_count": 42,
      "is_liked": true,
      "User": {
        "username": "jane_smith",
        "full_name": "Jane Smith",
        "avatar_url": "https://res.cloudinary.com/..."
      },
      "PostMedia": [
        {
          "id": "m22d7eb4-8f35-4cb2-8d76-d6b7b6299611",
          "postId": "p11d7eb4-8f35-4cb2-8d76-d6b7b6299601",
          "url": "https://res.cloudinary.com/...",
          "type": "image"
        }
      ]
    }
  ]
}

---

## 🛠️ Database Utilities (`/db`) - Public (No Auth Needed)

### Reset Database & Seed Dummy Data
Performs a destructive rebuild of all tables and relationships directly on the host database. Drops existing tables (`StoryViews`, `Stories`, `Likes`, `PostMedia`, `Posts`, `Blocks`, `Follows`, `Users` in cascading order), recreates them, and runs all default seed data inserts.
- **URL**: `/db/reset`
- **Method**: `POST`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Database reset and dummy data populated successfully!"
}
```
