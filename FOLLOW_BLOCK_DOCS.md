# TIEMgram Follow & Block API Documentation

This document explains the logic and schema for user interactions (Follows and Blocks).

## Database Schema (PostgreSQL)

### 1. Follows Table
| Column | Type | Description |
| --- | --- | --- |
| id | UUID | Primary Key |
| followerId | UUID | ID of the user who is following (FK) |
| followingId | UUID | ID of the user being followed (FK) |
| status | ENUM | 'pending' or 'accepted' |
| createdAt | TIMESTAMP | Creation time |

### 2. Blocks Table
| Column | Type | Description |
| --- | --- | --- |
| id | UUID | Primary Key |
| blockerId | UUID | ID of the user who is blocking (FK) |
| blockedId | UUID | ID of the user being blocked (FK) |
| createdAt | TIMESTAMP | Creation time |

---

## API Endpoints

### Follow/Unfollow
- **POST `/api/v1/users/:username/follow`**: Follow a user. If the target user is private, status will be `pending`.
- **DELETE `/api/v1/users/:username/follow`**: Unfollow a user.

### Follow Requests (For Private Accounts)
- **POST `/api/v1/users/:username/follow/accept`**: Accept a pending follow request.
- **DELETE `/api/v1/users/:username/follow/reject`**: Reject a pending follow request.
- **GET `/api/v1/users/me/follow-requests`**: Get list of users who requested to follow you.

### Blocking
- **POST `/api/v1/users/:username/block`**: Block a user. This automatically unfollows both users.
- **DELETE `/api/v1/users/:username/block`**: Unblock a user.
- **GET `/api/v1/users/me/blocked`**: Get list of users you have blocked.

### Lists
- **GET `/api/v1/users/:username/followers`**: Get followers of a user.
- **GET `/api/v1/users/:username/following`**: Get users followed by a user.

---

## Business Logic
1. **Self-Action Prevention**: Users cannot follow or block themselves.
2. **Mutual Blocking**: If User A blocks User B, neither can follow the other.
3. **Private Accounts**: If `is_private` is `true`, follow requests are set to `pending` and must be accepted manually.
4. **Follow Removal on Block**: Blocking a user automatically destroys any existing follow relationship between the two.
