import express from 'express';
import Record from '../models/Record.js';
import SensorType from '../models/SensorType.js';

const router = express.Router();

// Lấy lịch sử theo id của cụm (Dành cho việc vẽ biểu đồ / xem báo cáo)
router.get('/:clusterId', async (req, res) => {
    try {
        const { clusterId } = req.params;
        const records = await Record.find({ clusterId })
            .populate('sensorTypeId')
            .sort({ recordedAt: -1 }) // Lấy mới nhất lên đầu
            .limit(50); // Giới hạn 50 bản ghi
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Post dữ liệu từ cảm biến lên server
router.post('/', async (req, res) => {
    try {
        const { clusterId, sensorTypeId, value } = req.body;
        const newRecord = new Record({ clusterId, sensorTypeId, value });
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ message: 'Lỗi lưu dữ liệu cảm biến', error });
    }
});

export default router;
