import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";
import http from "http";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Fake token prices
const tokens = [
  { symbol: "BTC", price: 67200 },
  { symbol: "ETH", price: 3480 },
  { symbol: "SOL", price: 172 },
];

// REST endpoint
app.get("/prices", (req, res) => {
  res.json(tokens);
});

// WebSocket - send fake realtime prices every 2 seconds
wss.on("connection", (ws) => {
  console.log("Client connected");

  const interval = setInterval(() => {
    const updated = tokens.map((t) => ({
      ...t,
      price: +(t.price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2),
    }));
    ws.send(JSON.stringify(updated));
  }, 2000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

server.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});