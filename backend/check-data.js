import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spirulina_db';

import Record from './models/Record.js';
import Definition from './models/Definition.js';

async function check() {
    await mongoose.connect(MONGO_URI);
    const def = await Definition.findOne({ name: 'Bộ đo Hồ Nuôi Chính' });
    if (def) {
        const count = await Record.countDocuments({ definitionId: def._id });
        console.log(`Definition: ${def.name} (_id: ${def._id})`);
        console.log(`Số lượng records: ${count}`);
        
        const latest = await Record.find({ definitionId: def._id }).sort({ recordedAt: -1 }).limit(1);
        console.log('Bản ghi mới nhất:', JSON.stringify(latest, null, 2));
    } else {
        console.log('Không tìm thấy Definition "Bộ đo Hồ Nuôi Chính"');
    }
    await mongoose.disconnect();
}

check();
