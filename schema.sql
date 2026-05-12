-- TIEMgram Database Schema (PostgreSQL)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Dummy Data

-- Insert dummy users (Password is 'Secret@123' hashed)
INSERT INTO "Users" ("username", "email", "password", "full_name", "department", "year", "semester", "isVerified")
VALUES 
('john_doe', 'john@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'John Doe', 'Computer Science', 2, 3, TRUE),
('jane_smith', 'jane@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'Jane Smith', 'Information Technology', 1, 2, TRUE),
('bob_brown', 'bob@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'Bob Brown', 'Electronics', 3, 5, TRUE);

-- Insert dummy follows
INSERT INTO "Follows" ("followerId", "followingId", "status")
SELECT u1.id, u2.id, 'accepted'
FROM "Users" u1, "Users" u2
WHERE u1.username = 'john_doe' AND u2.username = 'jane_smith';

-- Insert dummy block
INSERT INTO "Follows" ("followerId", "followingId", "status")
SELECT u1.id, u2.id, 'pending'
FROM "Users" u1, "Users" u2
WHERE u1.username = 'bob_brown' AND u2.username = 'john_doe';
