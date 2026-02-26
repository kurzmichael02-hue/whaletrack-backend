import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";
import http from "http";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

async function fetchPrices() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
  );
  const data = await res.json() as Record<string, { usd: number } | undefined>;
  return [
    { symbol: "BTC", price: data["bitcoin"]?.usd ?? 0 },
    { symbol: "ETH", price: data["ethereum"]?.usd ?? 0 },
    { symbol: "SOL", price: data["solana"]?.usd ?? 0 },
  ];
}

app.get("/prices", async (req, res) => {
  const prices = await fetchPrices();
  res.json(prices);
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  const interval = setInterval(async () => {
    const prices = await fetchPrices();
    ws.send(JSON.stringify(prices));
  }, 30000);

  // Send immediately on connect
  fetchPrices().then((prices) => ws.send(JSON.stringify(prices)));

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

server.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
