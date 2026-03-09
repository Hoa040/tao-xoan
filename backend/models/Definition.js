import mongoose from 'mongoose';

/**
 * Schema cho collection `definitions`
 * Mỗi definition đại diện cho một cấu trúc cảm biến / bộ đo lường cụ thể.
 */
const definitionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },       // Tên cấu trúc, VD: "Bộ đo Ao A"
    description: { type: String, default: '' },               // Mô tả chi tiết
    sensorList: [{ type: String }],                           // Danh sách tên cảm biến, VD: ['pH', 'Nhiệt độ', 'DO']
    isActive: { type: Boolean, default: false },              // Cấu trúc đang được kích hoạt hay không
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Definition', definitionSchema);
