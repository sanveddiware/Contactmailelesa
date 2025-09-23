import multer from 'multer';
import fs from 'fs';
import path from 'path';

const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

const uploadPath = isServerless ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');

if (!isServerless) {
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = isServerless
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadPath),
      filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
    });

const upload = multer({ storage });

export { upload, uploadPath };
