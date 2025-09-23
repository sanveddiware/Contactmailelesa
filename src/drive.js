// drive.js
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID_OAuth,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Load token.json if it exists
if (fs.existsSync("token.json")) {
  const tokens = JSON.parse(fs.readFileSync("token.json"));
  oauth2Client.setCredentials(tokens);
}

export async function uploadToDrive(file) {
  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Convert Buffer to Readable Stream if file.buffer exists
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
    console.error("Drive upload error:", err);
    throw err;
  }
}
