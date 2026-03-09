import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
    clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' },
    sensorTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorType' },
    definitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Definition' }, // Liên kết với collection definitions
    value: { type: Number },
    data: { type: mongoose.Schema.Types.Mixed },  // Có thể lưu bất kỳ dữ liệu nào
    recordedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Record', recordSchema);
