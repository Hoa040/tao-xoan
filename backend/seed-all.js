/**
 * seed-all.js
 * Xóa TOÀN BỘ dữ liệu cũ và tạo lại dữ liệu mẫu
 * để test đầy đủ tất cả chức năng của web.
 *
 * Chạy: node seed-all.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spirulina_db';

// ─── Models ────────────────────────────────────────────────────
import SensorType from './models/SensorType.js';
import Cluster from './models/Cluster.js';
import Record from './models/Record.js';
import Definition from './models/Definition.js';

// ─── Helper ────────────────────────────────────────────────────
const rnd = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// Sinh dữ liệu cho 24h qua: mỗi 30 phút 1 điểm → 48 điểm / sensor
function genHistory(clusterId, sensorTypeId, min, max, alertMin, alertMax) {
    const records = [];
    for (let i = 47; i >= 0; i--) {
        const time = new Date(Date.now() - i * 30 * 60 * 1000);
        // Cứ 10 điểm thì có 1 điểm cảnh báo
        let value;
        if (i % 10 === 0 && alertMin !== undefined) {
            // Tạo giá trị NGOÀI ngưỡng (cảnh báo)
            value = Math.random() > 0.5 ? rnd(alertMax + 0.5, alertMax + 2) : rnd(alertMin - 2, alertMin - 0.1);
        } else {
            value = rnd(min, max);
        }
        records.push({ clusterId, sensorTypeId, value, recordedAt: time });
    }
    return records;
}

// ─── Main ──────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    // 1. Xóa sạch tất cả collections
    await Promise.all([
        SensorType.deleteMany({}),
        Cluster.deleteMany({}),
        Record.deleteMany({}),
        Definition.deleteMany({}),
    ]);
    console.log('🗑️  Đã xóa toàn bộ dữ liệu cũ\n');

    // ── 2. SensorTypes ─────────────────────────────────────────
    const [pH, temp, do_, co2, light] = await SensorType.insertMany([
        { name: 'pH', unit: 'pH', description: 'Độ pH môi trường nước (ngưỡng an toàn: 8–10)' },
        { name: 'Nhiệt độ', unit: '°C', description: 'Nhiệt độ nước (ngưỡng an toàn: 25–35°C)' },
        { name: 'DO', unit: 'mg/L', description: 'Nồng độ oxy hòa tan' },
        { name: 'CO2', unit: '%', description: 'Nồng độ CO2 (ngưỡng an toàn: 1–2%)' },
        { name: 'Ánh sáng', unit: 'lux', description: 'Cường độ ánh sáng' },
    ]);
    console.log('✅ Đã tạo 5 SensorTypes:', [pH, temp, do_, co2, light].map(s => s.name).join(', '));

    // ── 3. Clusters ────────────────────────────────────────────
    const [c003, c004] = await Cluster.insertMany([
        {
            name: 'C003',
            type: 'không khí',
            location: 'Khu vực nuôi ngoài trời A',
            sensors: [pH._id, temp._id, do_._id, co2._id],
        },
        {
            name: 'C004',
            type: 'nước',
            location: 'Khu vực hồ nuôi chính C',
            sensors: [pH._id, temp._id, light._id, co2._id],
        },
    ]);
    console.log('✅ Đã tạo 2 Clusters: C003, C004');

    // ── 4. Records cho Charts + Alerts ─────────────────────────
    // C003 — pH (ngưỡng 8-10), Nhiệt độ (25-35), DO, CO2 (1-2)
    const c003Records = [
        ...genHistory(c003._id, pH._id, 8.2, 9.8, 8, 10),  // có vài điểm cảnh báo pH
        ...genHistory(c003._id, temp._id, 26, 34, 25, 35),  // có vài điểm cảnh báo Nhiệt độ
        ...genHistory(c003._id, do_._id, 4, 7, undefined),
        ...genHistory(c003._id, co2._id, 1, 2, 1, 2),   // có vài điểm cảnh báo CO2
    ];

    // C004 — pH, Nhiệt độ, Ánh sáng, CO2
    const c004Records = [
        ...genHistory(c004._id, pH._id, 7.5, 10.5, 8, 10),   // nhiều điểm bất thường hơn
        ...genHistory(c004._id, temp._id, 24, 36, 25, 35),
        ...genHistory(c004._id, light._id, 800, 4500, undefined),
        ...genHistory(c004._id, co2._id, 0.8, 2.5, 1, 2),
    ];

    await Record.insertMany([...c003Records, ...c004Records]);
    const totalClusterRecords = c003Records.length + c004Records.length;
    console.log(`✅ Đã tạo ${totalClusterRecords} Records cho biểu đồ và cảnh báo`);

    // ── 5. Definitions ─────────────────────────────────────────
    const [defActive, defKin, defHo] = await Definition.insertMany([
        {
            name: 'Bộ đo Ao Ngoài Trời',
            description: 'Cấu trúc cảm biến cho các ao nuôi ngoài trời, đo nhiệt độ, pH và ánh sáng.',
            sensorList: ['Nhiệt độ', 'pH', 'Ánh sáng', 'DO'],
            isActive: true,
        },
        {
            name: 'Bộ đo Bể Kín CO2',
            description: 'Cấu trúc cho bể kín có bơm CO2, tập trung đo nồng độ khí.',
            sensorList: ['CO2', 'Nhiệt độ', 'pH', 'Độ ẩm'],
            isActive: false,
        },
        {
            name: 'Bộ đo Hồ Nuôi Chính',
            description: 'Cấu trúc toàn diện cho hồ nuôi chính, bao gồm đầy đủ các chỉ số.',
            sensorList: ['pH', 'Nhiệt độ', 'DO', 'EC', 'Độ mặn', 'CO2'],
            isActive: false,
        },
    ]);
    console.log('✅ Đã tạo 3 Definitions (1 active)');

    // ── 6. Records liên kết với Definitions (để test Xóa/Sửa) ──
    const defRecords = [];
    for (let i = 0; i < 6; i++) {
        defRecords.push({
            definitionId: defActive._id,
            value: rnd(7.5, 10.5),
            data: { sensor: 'pH', note: i % 2 === 0 ? 'Bình thường' : 'Cần theo dõi' },
            recordedAt: new Date(Date.now() - i * 60 * 60 * 1000),
        });
    }
    for (let i = 0; i < 4; i++) {
        defRecords.push({
            definitionId: defKin._id,
            value: rnd(0.8, 2.5),
            data: { sensor: 'CO2', note: 'Auto-recorded' },
            recordedAt: new Date(Date.now() - i * 45 * 60 * 1000),
        });
    }
    await Record.insertMany(defRecords);
    console.log(`✅ Đã tạo ${defRecords.length} Records liên kết với Definitions`);

    // ─── Tổng kết ──────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 TỔNG KẾT SEED DATA');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  SensorTypes : 5`);
    console.log(`  Clusters    : 2 (C003, C004)`);
    console.log(`  Records     : ${totalClusterRecords + defRecords.length} tổng cộng`);
    console.log(`    ↳ ${totalClusterRecords} records cho Dashboard / Charts / Alerts`);
    console.log(`    ↳ ${defRecords.length} records cho Definitions (xóa/sửa)`);
    console.log(`  Definitions : 3 (1 ACTIVE, 2 inactive)`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('✅ SEED HOÀN TẤT! Khởi động lại backend để áp dụng.');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌ Lỗi seed:', err.message);
    process.exit(1);
});
