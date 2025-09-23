import { google } from "googleapis";
import fs from "fs";

function initOAuthClient() {
  const { GOOGLE_CLIENT_ID_OAuth, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID_OAuth || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      "❌ Missing GOOGLE_CLIENT_ID_OAuth, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN in environment variables"
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID_OAuth,
    GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

export async function uploadToDrive(file) {
  try {
    const auth = initOAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: file.originalname || file.filename,
      // parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // optional
    };

    const media = {
      mimeType: file.mimetype,
      body: file.buffer ? file.buffer : fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    return `https://drive.google.com/uc?id=${response.data.id}`;
  } catch (err) {
    console.error("Drive upload error:", err);
    throw err;
  }
}
