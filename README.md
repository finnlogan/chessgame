# Aether Chess - Cinematic Adaptive Chess AI

A complete, production-ready, and award-winning single-page Chess application featuring a deep cinematic theme, synthesized audio, real-time positional evaluation, and an adaptive ELO calibration engine.

Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **chess.js**.

---

## 🌟 Key Features

1. **Cinematic Aesthetic & Theme**
   * Luxurious obsidian and deep slate dark mode palette.
   * Gold and glowing cyan accents representing the board's energetic field.
   * Floating glassmorphic dashboards (`glass-panel` backdrop filters).
   * Fully vector-based, responsive minimalist chessboard rendering with custom inline SVG chess pieces.
   
2. **Adaptive AI Engine & "Zone of Proximal Development"**
   * **Custom Alpha-Beta Minimax search engine** implemented directly in TypeScript, operating on legal states generated via `chess.js`.
   * **Calibration Game (Game 1)**: Starts at 1200 ELO. Tracks player accuracy, moves count, blunders, and decision speeds.
   * **Dynamic ELO Adjustments**: Following the calibration game, computes the player's initial rating and configures subsequent AI ELO bounds to play exactly **50 to 100 points higher** than the player.
   * **Tuned Difficulty Parameters**: Dynamically scales minimax search tree depth (Depth 1-4) and deliberate blunder rate probability (0% to 35%) to challenge the player while ensuring tactical growth.

3. **Production-Ready Amenities**
   * **Live Evaluation Bar**: Translates piece weights and board position tables in real-time to display the match balance.
   * **Synthesized Sound Effects**: Built using the browser's **Web Audio API** to generate rich, zero-latency sounds for moves, captures, checks, and game results without downloading heavy external audio files.
   * **Interactive Calibration Report Modal**: Displays detailed post-game statistics, player accuracy meter, ELO history charts (rendered dynamically in custom SVG line paths), and game review tips.
   * **PGN Log Sidebar**: Fully formatted algebraic move history log with game metrics.
   * **Cheat/Hint Engine**: Requests a depth-3 engine evaluation to show the best player move suggestion on-demand.

---

## 🛠️ Local Development

To run this application locally, you will need to have **Node.js** installed on your system.

1. **Clone or Navigate to the Workspace:**
   ```bash
   cd C:/Users/FinnL/games/chess-app
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

---

## ☁️ Deploying to Cloudflare Pages

This application is ready to build and deploy straight to Cloudflare Pages.

### Method 1: Git + Cloudflare Pages Dashboard (Recommended)

1. **Initialize Git & Push to GitHub:**
   ```bash
   git init
   ```
   *Create a repository on GitHub, then link it:*
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git add .
   git commit -m "feat: initial aether chess release"
   git push -u origin main
   ```

2. **Deploy via Cloudflare Pages:**
   * Go to the **Cloudflare Dashboard** and select **Pages**.
   * Click **Create a project** -> **Connect to Git**.
   * Select your `chess-app` repository.
   * Configure the following build settings:
     * **Framework Preset:** `Vite` (or `None`)
     * **Build Command:** `npm run build`
     * **Build Output Directory:** `dist`
   * Click **Save and Deploy**. Cloudflare's Node.js environment will compile the TypeScript, compile Tailwind CSS, bundle the app with Vite, and host it globally in seconds!

---

## 🖥️ Architecture Overview

* **`src/App.tsx`**: Contains the core React application, Minimax engine search tree logic, game timers, Audio Synthesis classes, ELO evaluation equations, and the responsive user interface dashboard.
* **`src/index.css`**: Configures Tailwind entry directives, glassmorphic layout definitions, scrollbars, and active slide animations.
* **`tailwind.config.js`**: Defines the custom color gradients (obsidian base, light/dark squares) and glowing drop shadow rules.
