const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const { URL } = require("url");

dotenv.config();

// Load token
let ACCESS_TOKEN;
try {
  ACCESS_TOKEN = fs.readFileSync("token.txt", "utf-8").trim();
} catch (err) {
  console.error("❌ token.txt file not found or unreadable.");
  process.exit(1);
}

// Load comments
let comments = [];
try {
  const raw = fs.readFileSync("comment.txt", "utf-8");
  comments = raw.split("\n").map(line => line.trim()).filter(Boolean);
  if (comments.length === 0) throw new Error();
} catch (err) {
  console.error("❌ comment.txt missing or empty.");
  process.exit(1);
}

// Get post link
const POST_LINK = process.env.POST_LINK;
if (!POST_LINK || !ACCESS_TOKEN) {
  console.error("❌ Missing POST_LINK or ACCESS_TOKEN");
  process.exit(1);
}

// Extract post ID
function extractPostId(link) {
  try {
    const url = new URL(link);
    const uidMatch = url.pathname.match(/\/(\d+)\/posts/);
    const postIdMatch = url.pathname.match(/posts\/([^/?]+)/);
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
      console.log("⚠️ Comment sent but no ID returned.");
    }
  } catch (err) {
    console.error("❌ Error:", err.response?.data?.error?.message || err.message);
  }

  // Random delay between 60000ms (1 min) to 120000ms (2 min)
  const delay = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
  setTimeout(commentLoop, delay);
}

// Express server to stay alive
const app = express();
app.get("/", (req, res) => res.send("✅ ANURAG comment bot is live!"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Bot server started...");
  commentLoop();
});
