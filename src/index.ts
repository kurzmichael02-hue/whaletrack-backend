import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";
import http from "http";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? "";

const WHALE_WALLETS = [
  { name: "Binance Hot Wallet", address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" },
  { name: "Vitalik Buterin", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { name: "Justin Sun", address: "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296" },
];

let cachedPrices = [
  { symbol: "BTC", price: 0 },
  { symbol: "ETH", price: 0 },
  { symbol: "SOL", price: 0 },
];

async function fetchPrices() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
      { headers: { "Accept": "application/json" } }
    );
    const data = await res.json() as Record<string, { usd: number } | undefined>;
    const btc = data["bitcoin"]?.usd;
    const eth = data["ethereum"]?.usd;
    const sol = data["solana"]?.usd;
    if (btc && eth && sol) {
      cachedPrices = [
        { symbol: "BTC", price: btc },
        { symbol: "ETH", price: eth },
        { symbol: "SOL", price: sol },
      ];
    }
  } catch (e) {
    console.error("CoinGecko fetch failed:", e);
  }
  return cachedPrices;
}

async function fetchWhaleTransactions(address: string) {
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json() as { result: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
  }> };
  if (!Array.isArray(data.result)) return [];
  return data.result.map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: (parseFloat(tx.value) / 1e18).toFixed(4),
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
  }));
}

app.get("/prices", async (req, res) => {
  const prices = await fetchPrices();
  res.json(prices);
});

app.get("/whales", async (req, res) => {
  const whales = await Promise.all(
    WHALE_WALLETS.map(async (wallet) => ({
      name: wallet.name,
      address: wallet.address,
      transactions: await fetchWhaleTransactions(wallet.address),
    }))
  );
  res.json(whales);
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  const interval = setInterval(async () => {
    const prices = await fetchPrices();
    ws.send(JSON.stringify({ type: "prices", data: prices }));
  }, 60000);

  fetchPrices().then((prices) => ws.send(JSON.stringify({ type: "prices", data: prices })));

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

server.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
