# Cloudinary Implementation Documentation

This document explains how image uploads are handled in TIEMgram using Cloudinary and Multer.

## Overview
The system uses a combination of `multer` for parsing `multipart/form-data` and `multer-storage-cloudinary` to stream files directly to the Cloudinary cloud storage without saving them locally first.

---

## 🛠️ Configuration (`config/cloudinary.js`)

### 1. Cloudinary SDK Configuration
We use the `cloudinary` v2 SDK, initialized with credentials from the `.env` file:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### 2. Storage Engine
The `CloudinaryStorage` is configured with:
- **Folder**: `tiemgram_profiles` (All profile images go here).
- **Formats**: `jpg`, `png`, `jpeg`, `webp`.
- **Transformation**: Images are automatically limited to `500x500` pixels and cropped to fit if they are larger, ensuring consistent profile picture sizes.

### 3. Multer Middleware
The `upload` object is the middleware exported for use in routes:
- **Limit**: Increased to **20MB** (`20 * 1024 * 1024`) to handle high-resolution photos.
- **Usage**: `upload.single('avatar')` expects a single file field named `avatar`.

---

## 🚀 Usage in Routes (`routes/profileRoutes.js`)

The upload middleware is applied to the POST route:
```javascript
const { upload } = require('../config/cloudinary');
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
```

## 🧠 Logic in Controller (`controllers/profileController.js`)

When the upload is successful:
1.  Cloudinary returns the image URL in `req.file.path`.
2.  The controller updates the `avatar_url` field in the database for the authenticated user.
3.  The response returns the new `avatar_url` to the client.

---

## 🛡️ Troubleshooting "Entity Too Large"
If you encounter this error:
1.  **Multer Limit**: Check `fileSize` in `config/cloudinary.js`.
2.  **Express Limit**: Ensure `express.json` and `express.urlencoded` have sufficient limits in `server.js`.
3.  **Reverse Proxy**: If using Nginx, you may need to set `client_max_body_size 20M;`.
