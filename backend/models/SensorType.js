import mongoose from 'mongoose';

const sensorTypeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // VD: pH, DO, Nhiệt độ...
    unit: { type: String, required: true }, // VD: °C, mg/L, ...
    description: { type: String }
});

export default mongoose.model('SensorType', sensorTypeSchema);
