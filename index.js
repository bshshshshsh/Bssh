const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const { URL } = require("url");

// Load .env
dotenv.config();

// Read token from token.txt
let ACCESS_TOKEN;
try {
  ACCESS_TOKEN = fs.readFileSync("token.txt", "utf-8").trim();
} catch (err) {
  console.error("❌ token.txt file not found or unreadable.");
  process.exit(1);
}

const POST_LINK = process.env.POST_LINK;
const COMMENT_TEXT = process.env.COMMENT_TEXT || "🔥 ANURAG Auto Comment";
const INTERVAL = parseInt(process.env.INTERVAL) || 1000;

if (!POST_LINK || !ACCESS_TOKEN) {
  console.error("❌ POST_LINK or ACCESS_TOKEN missing.");
  process.exit(1);
}

// Extract post ID
function extractPostId(link) {
  try {
    const url = new URL(link);
    const uidMatch = url.pathname.match(/\/(\d+)\/posts/);
    const postIdMatch = url.pathname.match(/posts\/(\w+)/);
    if (uidMatch && postIdMatch) {
      return `${uidMatch[1]}_${postIdMatch[1]}`;
    }
  } catch (e) {
    return null;
  }
  return null;
}

const POST_ID = extractPostId(POST_LINK);
if (!POST_ID) {
  console.error("❌ Invalid post link format in .env");
  process.exit(1);
}

// Comment loop
async function commentLoop() {
  try {
    const res = await axios.post(
      `https://graph.facebook.com/${POST_ID}/comments`,
      null,
      {
        params: {
          message: COMMENT_TEXT,
          access_token: ACCESS_TOKEN,
        },
      }
    );

    if (res.data && res.data.id) {
      console.log(`✅ Comment sent: ${res.data.id} at ${new Date().toLocaleTimeString()}`);
    } else {
      console.log("⚠️ No comment ID returned.");
    }
  } catch (err) {
    console.error("❌ Error sending comment:", err.response?.data?.error?.message || err.message);
  }

  setTimeout(commentLoop, INTERVAL);
}

// Uptime server
const app = express();
app.get("/", (req, res) => res.send("✅ ANURAG comment bot is live!"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Server started. Bot commenting every", INTERVAL / 1000, "sec");
  commentLoop();
});
