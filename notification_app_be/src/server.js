import express from "express";
import cors from "cors";
import settings from "./config.js";
import fetchAllNotifications from "./notificationService.js";
import rankNotifications from "./priorityEngine.js";
import loggingMiddleware from "./loggingMiddleware.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/notifications", async (req, res) => {
  try {
    const topN = parseInt(req.query.topN) || 10;
    const all = await fetchAllNotifications();
    const ranked = rankNotifications(all, topN);
    res.json({ status: "success", total: all.length, topN, notifications: ranked });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/api/notifications/all", async (req, res) => {
  try {
    const all = await fetchAllNotifications();
    res.json({ status: "success", total: all.length, notifications: all });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(settings.port, () => {
  console.log(`Server running on port ${settings.port}`);
});
