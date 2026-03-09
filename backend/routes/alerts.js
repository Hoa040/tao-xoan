import express from 'express';
import Record from '../models/Record.js';
import SensorType from '../models/SensorType.js';

const router = express.Router();

// Get list of records that are outside the safe bounds
router.get('/', async (req, res) => {
    try {
        // 1. Safe bounds mapping based on Sensor Name
        const safeBounds = {
            'Nhiệt độ': { min: 25, max: 35 },
            'pH': { min: 8, max: 10 },
            'CO2': { min: 1, max: 2 },
            'Độ mặn': { min: 1, max: 2 }
        };

        // 2. Fetch the latest historical records (e.g. 500)
        const recentRecords = await Record.find()
            .populate('clusterId', 'name location')
            .populate('sensorTypeId', 'name unit')
            .sort({ recordedAt: -1 })
            .limit(500);

        // 3. Filter out anomalous values
        const alerts = [];

        for (const record of recentRecords) {
            if (!record.sensorTypeId) continue;

            const sensorName = record.sensorTypeId.name;
            const bounds = safeBounds[sensorName];

            // Check if it exists and value is out of bounds
            if (bounds) {
                let isAnomalous = false;
                let reason = '';

                if (record.value < bounds.min) {
                    isAnomalous = true;
                    reason = `Thấp hơn mức an toàn (${bounds.min}${record.sensorTypeId.unit})`;
                } else if (record.value > bounds.max) {
                    isAnomalous = true;
                    reason = `Cao hơn mức an toàn (${bounds.max}${record.sensorTypeId.unit})`;
                }

                if (isAnomalous) {
                    alerts.push({
                        _id: record._id,
                        cluster: record.clusterId,
                        sensor: record.sensorTypeId.name,
                        value: record.value,
                        unit: record.sensorTypeId.unit,
                        recordedAt: record.recordedAt,
                        reason: reason,
                        bounds: bounds
                    });
                }
            }
        }

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi fetch cảnh báo', error });
    }
});

export default router;
