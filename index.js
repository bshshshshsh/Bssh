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

// Read comments from comment.txt
let comments = [];
try {
  const raw = fs.readFileSync("comment.txt", "utf-8");
  comments = raw.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  if (comments.length === 0) throw new Error();
} catch (err) {
  console.error("❌ comment.txt missing or empty.");
  process.exit(1);
}

// Post link and interval
const POST_LINK = process.env.POST_LINK;
const INTERVAL = parseInt(process.env.INTERVAL) || 10000;

if (!POST_LINK || !ACCESS_TOKEN) {
  console.error("❌ POST_LINK or ACCESS_TOKEN missing.");
  process.exit(1);
}

// Extract post ID from URL
function extractPostId(link) {
  try {
    const url = new URL(link);
    const uidMatch = url.pathname.match(/\/(\d+)\/posts/);
    const postIdMatch = url.pathname.match(/posts\/([^/]+)/);
    if (uidMatch && postIdMatch) {
      return `${uidMatch[1]}_${postIdMatch[1]}`;
    }
  } catch (e) {}
  return null;
}

const POST_ID = extractPostId(POST_LINK);
if (!POST_ID) {
  console.error("❌ Invalid POST_LINK format.");
  process.exit(1);
}

let currentIndex = 0;

// Comment loop
async function commentLoop() {
  const message = comments[currentIndex];
  currentIndex = (currentIndex + 1) % comments.length;

  try {
    const res = await axios.post(
      `https://graph.facebook.com/${POST_ID}/comments`,
      null,
      {
        params: {
          message,
          access_token: ACCESS_TOKEN,
        },
      }
    );

    if (res.data?.id) {
      console.log(`✅ Comment sent: "${message}" at ${new Date().toLocaleTimeString()}`);
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
  console.log(`🌍 Server started. Bot commenting every ${INTERVAL / 1000} sec`);
  commentLoop();
});
