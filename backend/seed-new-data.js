import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spirulina_db';

import Record from './models/Record.js';
import Definition from './models/Definition.js';
import Cluster from './models/Cluster.js';
import SensorType from './models/SensorType.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công');

        // 1. Xóa TOÀN BỘ dữ liệu trong tất cả các collections
        console.log('🗑️  Đang xóa sạch dữ liệu cũ trong DB (Records, Definitions, Clusters, SensorTypes)...');
        await Promise.all([
            Record.deleteMany({}),
            Definition.deleteMany({}),
            Cluster.deleteMany({}),
            SensorType.deleteMany({}),
        ]);
        console.log('✨ Database đã được xóa sạch.');

        // 2. Tạo một Definition mới duy nhất để chứa dữ liệu từ file seed
        const newDef = new Definition({
            name: 'Hồ Nuôi Spirulina (Dữ liệu Seed)',
            description: 'Toàn bộ dữ liệu được nạp từ file records_seed.json',
            sensorList: ['OD680', 'pH', 'Temperature', 'Light', 'EC', 'Contamination'],
            isActive: true,
        });
        await newDef.save();
        console.log(`📂 Đã tạo Definition mới: "${newDef.name}"`);

        // 3. Đọc dữ liệu từ records_seed.json
        const jsonPath = path.join(__dirname, 'records_seed.json');
        if (!fs.existsSync(jsonPath)) {
            console.error(`❌ Không tìm thấy file: ${jsonPath}`);
            process.exit(1);
        }
        
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const seedData = JSON.parse(rawData);
        console.log(`📖 Đã đọc ${seedData.length} bộ dữ liệu từ file JSON.`);

        // 4. Chuyển đổi và chuẩn bị nạp dữ liệu
        const recordsToInsert = seedData.map((entry, index) => {
            const odValue = entry.values.find(v => v.key === 'OD680')?.value || 0;
            
            // Map mảng values thành object data
            const extraData = {};
            entry.values.forEach(v => {
                extraData[v.key] = v.value;
            });

            return {
                definitionId: newDef._id,
                value: odValue,
                data: extraData,
                recordedAt: new Date(Date.now() - index * 10 * 60 * 1000) // Cách nhau 10 phút
            };
        });

        // 5. Nạp dữ liệu vào DB
        console.log('⏳ Đang nạp dữ liệu vào Database...');
        const result = await Record.insertMany(recordsToInsert);
        console.log(`✅ Thành công! Đã nạp ${result.length} bản ghi vào hệ thống.`);

        console.log('\n═══════════════════════════════════════════════════');
        console.log('📊 TỔNG KẾT RE-SEED');
        console.log('═══════════════════════════════════════════════════');
        console.log(`  Definitions : 1 (ACTIVE)`);
        console.log(`  Records     : ${result.length}`);
        console.log('═══════════════════════════════════════════════════\n');

        await mongoose.disconnect();
        console.log('🏁 Hoàn tất quá trình làm mới dữ liệu!');
    } catch (error) {
        console.error('❌ Lỗi nghiêm trọng:', error);
        process.exit(1);
    }
}

seed();
