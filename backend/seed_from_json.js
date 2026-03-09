import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/spirulina_db";

import SensorType from "./models/SensorType.js";
import Cluster from "./models/Cluster.js";
import Record from "./models/Record.js";
import Definition from "./models/Definition.js";

async function seedFromJson() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Đã kết nối DB");

  // 1. Xóa sạch dữ liệu cũ
  await Promise.all([
    SensorType.deleteMany({}),
    Cluster.deleteMany({}),
    Record.deleteMany({}),
    Definition.deleteMany({}),
  ]);
  console.log("🗑️  Đã xóa sạch dữ liệu cũ trong DB");

  // 2. Tạo SensorTypes từ các key của JSON
  const [pH, temp, light, ec, od, contam] = await SensorType.insertMany([
    { name: "pH", unit: "pH", description: "Độ pH (Ngưỡng an toàn: 8-10)" },
    {
      name: "Nhiệt độ",
      unit: "°C",
      description: "Nhiệt độ nước (Ngưỡng an toàn 25-35)",
    },
    { name: "Ánh sáng", unit: "lux", description: "Cường độ ánh sáng" },
    { name: "EC", unit: "µS/cm", description: "Độ dẫn điện" },
    {
      name: "OD680",
      unit: "ABS",
      description: "Quang phổ 680nm ước tính sinh khối",
    },
    {
      name: "Tạp nhiễm",
      unit: "flag",
      description: "Trạng thái tạp nhiễm (0/1)",
    },
  ]);

  // 3. Tạo 1 Cluster duy nhất quy tụ tất cả sensor
  const mainCluster = await Cluster.create({
    name: "Hồ Nuôi Chính (JSON Data)",
    type: "nước",
    location: "Trạm nghiên cứu trung tâm",
    sensors: [pH._id, temp._id, light._id, ec._id, od._id, contam._id],
  });

  // 4. Tạo 1 Definition (chức năng mới) để chứa dạng raw data
  const mainDef = await Definition.create({
    name: "Cụm Dữ liệu Raw JSON",
    description: "Chứa 100 bản ghi raw từ records_seed.json",
    sensorList: [
      "pH",
      "temperature_C",
      "light_lux",
      "EC_uS",
      "OD680",
      "contamination_flag",
    ],
    isActive: true,
  });

  // 5. Đọc file JSON và phân tích
  const rawData = fs.readFileSync("records_seed.json", "utf8");
  const recordsJson = JSON.parse(rawData);
  console.log(`⏳ Đang xử lý ${recordsJson.length} block dữ liệu từ JSON...`);

  const clusterRecords = [];
  const defRecords = [];
  const now = Date.now();

  // Duyệt qua từng khung thời gian (mỗi object là 1 thời điểm cách nhau 60 phút)
  recordsJson.forEach((item, index) => {
    const recordTime = new Date(now - index * 60 * 60 * 1000); // Lùi 1 tiếng/bản ghi
    const dataObj = {};

    // Convert { key: "OD680", value: 1.92 } thành dataObj
    item.values.forEach((v) => {
      dataObj[v.key] = v.value;
    });

    // 5a. Tạo records riêng lẻ cho Cluster (để Dashboard vẽ biểu đồ)
    if (dataObj.pH !== undefined)
      clusterRecords.push({
        clusterId: mainCluster._id,
        sensorTypeId: pH._id,
        value: dataObj.pH,
        recordedAt: recordTime,
      });
    if (dataObj.temperature_C !== undefined)
      clusterRecords.push({
        clusterId: mainCluster._id,
        sensorTypeId: temp._id,
        value: dataObj.temperature_C,
        recordedAt: recordTime,
      });
    if (dataObj.light_lux !== undefined)
      clusterRecords.push({
        clusterId: mainCluster._id,
        sensorTypeId: light._id,
        value: dataObj.light_lux,
        recordedAt: recordTime,
      });
    if (dataObj.EC_uS !== undefined)
      clusterRecords.push({
        clusterId: mainCluster._id,
        sensorTypeId: ec._id,
        value: dataObj.EC_uS,
        recordedAt: recordTime,
      });
    if (dataObj.OD680 !== undefined)
      clusterRecords.push({
        clusterId: mainCluster._id,
        sensorTypeId: od._id,
        value: dataObj.OD680,
        recordedAt: recordTime,
      });
    if (dataObj.contamination_flag !== undefined)
      clusterRecords.push({
        clusterId: mainCluster._id,
        sensorTypeId: contam._id,
        value: dataObj.contamination_flag ? 1 : 0,
        recordedAt: recordTime,
      });

    // 5b. Tạo 1 record gộp cho Definition
    defRecords.push({
      definitionId: mainDef._id,
      value: dataObj.pH || 0, // Giá trị tóm tắt là pH
      data: dataObj, // Toàn bộ Object
      recordedAt: recordTime,
    });
  });

  // Bulk insert toàn bộ vô DB cho nhanh
  await Record.insertMany([...clusterRecords, ...defRecords]);

  console.log(
    `✅ Đã nạp thành công ${clusterRecords.length} records cho Biểu đồ (Dashboard)`,
  );
  console.log(
    `✅ Đã nạp thành công ${defRecords.length} records cho trang Definitions`,
  );
  console.log("🚀 HOÀN TẤT!");

  process.exit(0);
}

seedFromJson().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
