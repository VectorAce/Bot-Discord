> [!NOTE]
> **Disclaimer & Localization Notice:**
> This open-source project is configured by default to scrape and utilize public data sources tailored for **Indonesia** (such as BMKG earthquake alerts and regional commodity market feeds). If you wish to adapt this bot for another country or use your own custom datasets/APIs, you are welcome to modify the API endpoints, scraping targets, and parser logic inside `index.js`.

# 🤖 Multi-Utility Discord Bot

A feature-rich, interactive Discord Bot built with **Discord.js v14**, **Axios**, and **Cheerio**. Designed for real-time tracking, game specs lookup, news delivery, commodity price scraping, and automated notifications.

---

## ✨ Features

- **🚨 BMKG Real-Time Earthquake Alert:**
  - Automated background loop checking BMKG endpoint every 3 minutes.
  - Non-spam state tracking using `lastEarthquake` memory.
  - Automatic rich embed notifications with shakemap images.

- **🎮 Steam Game Info & Specs Lookup:**
  - Game search supporting popular aliases (e.g., `gta v`, `rdr2`, `cs2`).
  - Forces IDR (Rupiah) currency formatting alongside English hardware specs.
  - Formatted hardware categories (`Processor:`, `Memory:`, `Graphics:`, etc.) in **bold**.

- **🎌 Dual-API Anime Search:**
  - Retrieves anime details including episodes, scores, and synopsis.
  - Uses **MyAnimeList (Jikan API)** as primary source with automatic fallback to **Kitsu.io API** during rate-limits.

- **📰 Google News RSS Reader:**
  - Top technology news summary.
  - On-demand topic search powered by Google News RSS feeds.

- **🛒 Commodity & Food Price Scraper:**
  - Live scraping of food commodity prices across different regions in Indonesia.
  - Parses text metrics (e.g., converts `42 Ribu` or `43,2 Ribu` into formatted `Rp 42.000` / `Rp 43.200`).

- **🎛 Interactive Discord Dashboard:**
  - Built-in Discord UI Components (**Buttons**, **String Select Menus**, and **Modal Pop-up Forms**).
  - Admin-only soft restart feature with auto-restoring UI dashboard.

- **🛡️ Global Crash Protection:**
  - Handlers for `unhandledRejection` and `uncaughtException` to keep the bot running 24/7 on hosting environments like Pterodactyl.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+)
* **Library:** `discord.js` (v14)
* **HTTP Client:** `axios`
* **Scraper:** `cheerio`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed on your local machine or server.
- A Discord Bot Token obtained from the [Discord Developer Portal](https://discord.com/developers/applications).

### 2. Installation

Clone this repository:
```bash
git clone [https://github.com/VectorAce/Bot-Discord.git](https://github.com/VectorAce/Bot-Discord.git)
cd Bot-Discord
```
Install the dependencies:
```bash
npm install
```

### 3. Configuration

Open index.js and update the CONFIG object with your Bot Token and Channel ID:
```bash
const CONFIG = {
    TOKEN: 'YOUR_DISCORD_BOT_TOKEN', 
    PREFIX: '!',
    CHANNEL_NOTIF: 'YOUR_NOTIFICATION_CHANNEL_ID'
};
```

### 4. Running the Bot

Start the bot locally or on your host (e.g., Pterodactyl):
```bash
npm start
```

---

## 📝 Usage

Type `!menu` or `!help` in any channel where the bot has access to display the Interactive Dashboard.

---

## 📄 License

This project is open-source and available under the MIT License.
