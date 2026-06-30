import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Use OS temp directory for serverless compatibility (Vercel is read-only)
const uploadDir = process.env.NODE_ENV === 'production' || process.env.VERCEL ? os.tmpdir() : 'public/temp';
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn(`Could not create upload directory ${uploadDir}:`, err.message);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
