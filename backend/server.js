import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/spirulina_db";

import clustersRoute from "./routes/clusters.js";
import recordsRoute from "./routes/records.js";
import alertsRoute from "./routes/alerts.js";
import sensorsRoute from "./routes/sensors.js";
import authRoute from "./routes/auth.js";

mongoose
  .connect(MONGO_URI)
  .then(() =>
    console.log("✅ Đã kết nối với MongoDB (spirulina_db) thành công"),
  )
  .catch((err) => console.error("Lỗi khi kết nối MongoDB:", err));

app.use("/api/clusters", clustersRoute);
app.use("/api/records", recordsRoute);
app.use("/api/alerts", alertsRoute);

app.use("/api/Sensors", sensorsRoute);
app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
  res.send("API Hệ thống giám sát Tảo Xoắn đang hoạt động!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend đang chạy trên cổng ${PORT}`);
});
