// drive.js
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const isLocal = fs.existsSync("token.json");

// OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID_OAuth,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || "https://developers.google.com/oauthplayground"
);

// Credentials
if (isLocal) {
  // Use local token.json for development
  const tokens = JSON.parse(fs.readFileSync("token.json"));
  oauth2Client.setCredentials(tokens);
  console.log("✅ Using local token.json for Google Drive auth");
} else {
  // Use environment variables (Vercel)
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("Missing GOOGLE_REFRESH_TOKEN in environment variables!");
  }
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  console.log("✅ Using environment variable refresh token for Google Drive auth");
}

const drive = google.drive({ version: "v3", auth: oauth2Client });

export async function uploadToDrive(file) {
  try {
    // Convert Buffer to Readable Stream if exists
    const bodyStream = file.buffer ? Readable.from(file.buffer) : fs.createReadStream(file.path);

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
      },
      media: {
        mimeType: file.mimetype,
        body: bodyStream,
      },
    });

    return `https://drive.google.com/uc?id=${response.data.id}`;
  } catch (err) {
    console.error("❌ Drive upload error:", err);
    throw err;
  }
}
