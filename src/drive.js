// // // drive.js
// // import fs from "fs";
// // import { google } from "googleapis";

// // const TOKEN_PATH = "token.json";

// // // Initialize OAuth client using env variables
// // function initOAuthClient() {
// //   if (!process.env.GOOGLE_CLIENT_ID_OAuth || !process.env.GOOGLE_CLIENT_SECRET || !process.env.REDIRECT_URI) {
// //     throw new Error("❌ Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or REDIRECT_URI in .env");
// //   }

// //   const oauth2Client = new google.auth.OAuth2(
// //     process.env.GOOGLE_CLIENT_ID_OAuth,
// //     process.env.GOOGLE_CLIENT_SECRET,
// //     process.env.REDIRECT_URI
// //   );

// //   // Load token.json if exists
// //   if (fs.existsSync(TOKEN_PATH)) {
// //     const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
// //     oauth2Client.setCredentials(token);
// //   } else {
// //     throw new Error("❌ No token.json found. Run /auth first to authenticate.");
// //   }

// //   return oauth2Client;
// // }

// // // Upload file to Google Drive
// // export async function uploadToDrive(file) {
// //   try {
// //     const auth = initOAuthClient();
// //     const drive = google.drive({ version: "v3", auth });

// //     const fileMetadata = { name: file.filename };
// //     const media = { mimeType: file.mimetype, body: fs.createReadStream(file.path) };

// //     const response = await drive.files.create({
// //       resource: fileMetadata,
// //       media: media,
// //       fields: "id",
// //     });

// //     // Make file publicly accessible
// //     await drive.permissions.create({
// //       fileId: response.data.id,
// //       requestBody: { role: "reader", type: "anyone" },
// //     });

// //     return `https://drive.google.com/uc?id=${response.data.id}`;
// //   } catch (err) {
// //     console.error("Drive upload error:", err);
// //     throw err;
// //   }
// // }

// // drive.js
// import { google } from "googleapis";
// import fs from "fs";

// // Initialize OAuth client using env variables
// function initOAuthClient() {
//   const { GOOGLE_CLIENT_ID_OAuth, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

//   if (!GOOGLE_CLIENT_ID_OAuth || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
//     throw new Error(
//       "❌ Missing GOOGLE_CLIENT_ID_OAuth, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN in environment variables"
//     );
//   }

//   const oauth2Client = new google.auth.OAuth2(
//     GOOGLE_CLIENT_ID_OAuth,
//     GOOGLE_CLIENT_SECRET
//   );

//   // Set credentials from refresh token
//   oauth2Client.setCredentials({
//     refresh_token: GOOGLE_REFRESH_TOKEN,
//   });

//   return oauth2Client;
// }

// // Upload file to Google Drive
// export async function uploadToDrive(file) {
//   try {
//     const auth = initOAuthClient();
//     const drive = google.drive({ version: "v3", auth });

//     const fileMetadata = { name: file.filename };
//     const media = { mimeType: file.mimetype, body: fs.createReadStream(file.path) };

//     const response = await drive.files.create({
//       resource: fileMetadata,
//       media: media,
//       fields: "id",
//     });

//     // Make file publicly accessible
//     await drive.permissions.create({
//       fileId: response.data.id,
//       requestBody: { role: "reader", type: "anyone" },
//     });

//     return `https://drive.google.com/uc?id=${response.data.id}`;
//   } catch (err) {
//     console.error("Drive upload error:", err);
//     throw err;
//   }
// }


import { google } from "googleapis";
import fs from "fs";

// Initialize OAuth client using env variables
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

/**
 * Uploads a file to Google Drive.
 * Supports both disk files (file.path) and in-memory files (file.buffer).
 * Returns the publicly accessible file URL.
 */
export async function uploadToDrive(file) {
  try {
    const auth = initOAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = { name: file.originalname || file.filename };

    // Use buffer if available (memoryStorage), otherwise read from disk
    const media = {
      mimeType: file.mimetype,
      body: file.buffer ? Buffer.from(file.buffer) : fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    // Make file publicly accessible
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
