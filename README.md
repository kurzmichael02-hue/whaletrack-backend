# WhaleTrack Backend

> **Note:** This backend is no longer in use. All data fetching was moved to Next.js API Routes on the frontend to avoid cold start issues with Render's free tier. Repo kept for reference.

## What it did

- Streamed live BTC, ETH, SOL prices via WebSocket (Binance API)
- Tracked on-chain transactions from major Ethereum whale wallets (Etherscan V2)
- REST endpoints consumed by the frontend

## Stack

- Node.js, Express, WebSocket, TypeScript
- Binance API, Etherscan V2 API
- Deployed on Render (free tier)

## Why it was replaced

Render's free tier spins down after inactivity — causing 50s+ delays on the first request. Moved everything to serverless Next.js API Routes on Vercel which have no cold start problem.

## Related

- Frontend: [whaletrack](https://github.com/kurzmichael02-hue/whaletrack)
