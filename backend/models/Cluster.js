import mongoose from 'mongoose';

const clusterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['nước', 'đất', 'không khí'], required: true },
  location: { type: String },
  sensors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SensorType' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Cluster', clusterSchema);
