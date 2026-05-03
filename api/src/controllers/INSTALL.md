# allbright Production Installation Guide (Render)

Follow these steps to deploy **allbright DeFi Software Developer Ltd.** elite arbitrage systems to Render Cloud.

## 1. Prerequisites
- A [Render.com](https://render.com) account.
- Access to your forked/uploaded GitHub repository.
- Private RPC Endpoints (Alchemy, Quicknode, etc.).
- API Keys for AI Cognition (OpenAI or OpenRouter).

## 2. API Deployment (Web Service)
1.  Click **New +** -> **Web Service** in the Render Dashboard.
2.  Connect your repository.
3.  **Runtime:** `Node`.
4.  **Build Command:** `pnpm install`
5.  **Start Command:** `node api/src/index.js` (or your specific entry point).
6.  **Environment Variables:**
    - `PORT`: `3000`
    - `RPC_ENDPOINT`: Your private RPC URL.
    - `PIMLICO_API_KEY`: Your Pimlico API key.
    - `OPENAI_API_KEY`: Your AI API key.
    - `JWT_SECRET`: A secure 64-character random string.
    - `NODE_ENV`: `production`

## 3. UI Deployment (Static Site)
1.  Click **New +** -> **Static Site**.
2.  Connect the same repository.
3.  **Build Command:** `cd ui && pnpm install && pnpm build`
4.  **Publish Directory:** `ui/dist`
5.  **Environment Variables:**
    - `VITE_API_BASE_URL`: The URL of your API Web Service (e.g., `https://api-service.onrender.com`).

## 4. Initialization via Setup Wizard
1.  Once both services are "Live", open your Static Site URL.
2.  The **allbright Setup Wizard** will initialize.
3.  Upload your `.env` file or enter credentials manually.
4.  Alpha-Copilot will perform a "Cognitive Handshake" to verify the environment.
5.  Upon success, the system will enter **Mission Control** mode.

---
*Copyright © 2024 allbright DeFi Software Developer Ltd. All rights reserved.*
