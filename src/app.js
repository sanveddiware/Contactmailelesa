import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { google } from "googleapis";   // <-- missing import
import { appendToSheet } from "./sheets.js";
import { sendThankYouEmail } from "./mailer.js";
import { uploadToDrive } from "./drive.js";
import contactRouter from './contact.js'

const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4000",
  process.env.FRONTEND_URL1,
  process.env.FRONTEND_URL2 // optional: from .env for deployment
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps or Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));


app.use("/api/send", contactRouter);
// Ensure uploads folder exists


// // ---------- Multer Setup ----------

const isVercel = process.env.VERCEL === "1";


// Multer storage setup
const storage = isVercel
  ? multer.memoryStorage() // no disk writes on Vercel
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = "uploads";
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
    });

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ---------- OAuth2 Setup ----------
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID_OAuth,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Route to start auth
app.get("/auth", (req, res) => {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      prompt: "consent",
    });

    console.log("🔗 Generated Auth URL:", url);
    res.redirect(url);
  } catch (err) {
    console.error("❌ Error generating auth URL:", err);
    res.status(500).send("Error generating auth URL");
  }
});

// Callback route
app.get("/oauth2callback", async (req, res) => {
  console.log("📌 /oauth2callback hit");
  console.log("Query params:", req.query);

  const code = req.query.code;
  if (!code) {
    console.log("❌ No code received in query params");
    return res.send("No code received");
  }

  try {
    console.log("✅ Code received:", code);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("🔑 Tokens received:", tokens);

    // Set credentials in oauth2Client
    oauth2Client.setCredentials(tokens);

    // Save tokens to token.json
    fs.writeFileSync("token.json", JSON.stringify(tokens, null, 2));
    console.log("💾 token.json successfully created!");

    res.send("Authentication successful! You can close this window.");
  } catch (err) {
    console.error("❌ Error retrieving access token:", err);
    res.status(500).send("Error retrieving access token");
  }
});

// ---------- Register Route ----------

app.post(
  "/api/register",
  upload.fields([
    { name: "collegeId", maxCount: 1 },
    { name: "paymentscreenshot", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Upload College ID
      const collegeIdLink = req.files?.collegeId
        ? await uploadToDrive(req.files.collegeId[0])
        : "";

      // Upload Payment Screenshot
      const paymentScreenshotLink = req.files?.paymentscreenshot
        ? await uploadToDrive(req.files.paymentscreenshot[0])
        : "";

      const row = [
        req.body.name,
        req.body.email,
        req.body.phone,
        req.body.college,
        req.body.event,
        req.body.transactionId,
        req.body.payment,
        collegeIdLink,
        paymentScreenshotLink,
        new Date().toLocaleString(),
      ];

      await appendToSheet(row);
      await sendThankYouEmail(req.body.email, req.body.name, req.body.event);

      res.json({
        success: true,
        msg: "✅ Registration successful! Data saved & files uploaded to Drive.",
        data: {
          ...req.body,
          collegeId: collegeIdLink,
          paymentscreenshot: paymentScreenshotLink,
        },
      });
    } catch (err) {
      console.error("Error in /api/register:", err);
      res.status(500).json({ success: false, msg: "❌ Server error", error: err.message });
    }
  }
);



//Testing



//Electrovert Website


export default app;

