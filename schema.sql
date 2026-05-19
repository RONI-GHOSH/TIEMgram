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

-- Comprehensive Dummy Data

-- Insert dummy users (Password is 'Secret@123' hashed)
INSERT INTO "Users" ("id", "username", "email", "password", "full_name", "department", "year", "semester", "isVerified")
VALUES 
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'john_doe', 'john@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'John Doe', 'Computer Science', 2, 3, TRUE),
('e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'jane_smith', 'jane@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'Jane Smith', 'Information Technology', 1, 2, TRUE),
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'bob_brown', 'bob@college.edu', '$2a$10$vI8fWvTz1u.M9qQy0L11RFAsdDrQpzCSbfvY40imMUhq2baKcntOZh7', 'Bob Brown', 'Electronics', 3, 5, TRUE);

-- Insert dummy follows
INSERT INTO "Follows" ("followerId", "followingId", "status")
VALUES 
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'accepted'), -- John follows Jane
('e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', 'accepted'), -- Jane follows John
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', 'pending');  -- Bob follow request to John (pending)

-- Insert dummy block
INSERT INTO "Blocks" ("blockerId", "blockedId")
VALUES 
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3'); -- Bob blocks Jane

-- Insert dummy posts
INSERT INTO "Posts" ("id", "userId", "caption", "type", "location", "tags", "is_public", "createdAt", "updatedAt")
VALUES
-- Recent Follower Posts (<= 24hr)
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299601', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'A beautiful morning on campus!', 'image', 'Main Quad', '["morning", "campus"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299602', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', 'Studying hard for the midterm exams.', 'text', 'Library', '["study", "midterms"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),

-- Older Follower Posts (> 24hr)
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299603', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'Coding till sunrise!', 'text', 'CSE Lab', '["coding", "hackathon"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '30 hours', CURRENT_TIMESTAMP - INTERVAL '30 hours'),

-- Platform Discovery Posts (Unfollowed users, e.g. Bob Brown)
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299604', 'f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'Enjoying the college festival.', 'video', 'Auditorium', '["festival", "fun"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('p11d7eb4-8f35-4cb2-8d76-d6b7b6299605', 'f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'Electronics workshop day 1.', 'image', 'Lab 302', '["electronics", "workshop"]'::jsonb, TRUE, CURRENT_TIMESTAMP - INTERVAL '35 hours', CURRENT_TIMESTAMP - INTERVAL '35 hours');

-- Insert dummy post media
INSERT INTO "PostMedia" ("id", "postId", "url", "type")
VALUES
('m22d7eb4-8f35-4cb2-8d76-d6b7b6299611', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299601', 'https://res.cloudinary.com/dd3drikgz/image/upload/quad.png', 'image'),
('m22d7eb4-8f35-4cb2-8d76-d6b7b6299612', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299604', 'https://res.cloudinary.com/dd3drikgz/video/upload/fest.mp4', 'video'),
('m22d7eb4-8f35-4cb2-8d76-d6b7b6299613', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299605', 'https://res.cloudinary.com/dd3drikgz/image/upload/lab.png', 'image');

-- Insert dummy likes
INSERT INTO "Likes" ("userId", "postId")
VALUES
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299601'), -- John likes Jane's recent post
('e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299602'), -- Jane likes John's recent post
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299603'), -- John likes Jane's older post (gives it 1 like)
('f92d7eb4-8f35-4cb2-8d76-d6b7b62996f4', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299603'), -- Bob likes Jane's older post (gives it 2 likes)
('d748805f-0f6f-4cb1-97b7-5a1df47de510', 'p11d7eb4-8f35-4cb2-8d76-d6b7b6299605'); -- John likes Bob's older post

-- Insert dummy stories
INSERT INTO "Stories" ("id", "userId", "mediaUrl", "type", "text_content", "text_color", "background_color", "sticker_id", "duration_seconds", "audience", "expiresAt", "createdAt")
VALUES
-- Jane active story (24h validity)
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299621', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', 'https://res.cloudinary.com/dd3drikgz/image/upload/quad.png', 'image', 'First day of sem!', '#FFFFFF', '#E91E8C', 'stk_party', 10, 'followers', CURRENT_TIMESTAMP + INTERVAL '22 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
-- John active story (24h validity)
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299622', 'd748805f-0f6f-4cb1-97b7-5a1df47de510', NULL, 'text', 'Midterm prep starting...', '#FFFFFF', '#E91E8C', NULL, 5, 'public', CURRENT_TIMESTAMP + INTERVAL '20 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
-- Jane expired story
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299623', 'e81d7eb4-8f35-4cb2-8d76-d6b7b62996e3', NULL, 'sticker', NULL, '#FFFFFF', '#E91E8C', 'stk_sleep', 5, 'public', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '25 hours');

-- Insert dummy story views
INSERT INTO "StoryViews" ("storyId", "userId")
VALUES
('s33d7eb4-8f35-4cb2-8d76-d6b7b6299621', 'd748805f-0f6f-4cb1-97b7-5a1df47de510'); -- John viewed Jane's active story
