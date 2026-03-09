import express from 'express';
import Definition from '../models/Definition.js';
import Record from '../models/Record.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// =========================================================
// GET /api/Sensors/definitions
// Lấy tất cả các cấu trúc (definitions) hiện có trong DB
// =========================================================
router.get('/definitions', async (req, res) => {
    try {
        const definitions = await Definition.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: definitions.length,
            data: definitions,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// =========================================================
// GET /api/Sensors/definitions/active
// Lấy definition đang được active (isActive = true)
// =========================================================
router.get('/definitions/active', async (req, res) => {
    try {
        const activeDefinition = await Definition.findOne({ isActive: true });
        if (!activeDefinition) {
            return res.status(404).json({ success: false, message: 'Không có definition nào đang active.' });
        }
        res.json({ success: true, data: activeDefinition });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// =========================================================
// GET /api/Sensors/:definition_id/GetAllRecords
// Lấy tất cả records gắn với một definition_id cụ thể
// =========================================================
router.get('/:definition_id/GetAllRecords', async (req, res) => {
    try {
        const { definition_id } = req.params;

        // Kiểm tra definition có tồn tại không
        const definition = await Definition.findById(definition_id);
        if (!definition) {
            return res.status(404).json({ success: false, message: `Không tìm thấy definition với id: ${definition_id}` });
        }

        const records = await Record.find({ definitionId: definition_id }).sort({ recordedAt: -1 });

        res.json({
            success: true,
            definition: definition.name,
            count: records.length,
            data: records,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// =========================================================
// POST /api/Sensors/:definitions_id/DeleteRecords  [JWT BẢO VỆ]
// Xóa đồng loạt tất cả các records thuộc definition_id
// =========================================================
router.post('/:definitions_id/DeleteRecords', authMiddleware, async (req, res) => {
    try {
        const { definitions_id } = req.params;

        // Kiểm tra definition có tồn tại không
        const definition = await Definition.findById(definitions_id);
        if (!definition) {
            return res.status(404).json({ success: false, message: `Không tìm thấy definition với id: ${definitions_id}` });
        }

        const result = await Record.deleteMany({ definitionId: definitions_id });

        res.json({
            success: true,
            message: `Đã xóa thành công ${result.deletedCount} record(s) của definition "${definition.name}".`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// =========================================================
// POST /api/Sensors/:definitions_id/UpdateRecordById/:record_id  [JWT BẢO VỆ]
// Cập nhật thông tin của một record cụ thể (bất kỳ trường nào)
// =========================================================
router.post('/:definitions_id/UpdateRecordById/:record_id', authMiddleware, async (req, res) => {
    try {
        const { definitions_id, record_id } = req.params;
        const updateData = req.body; // Nhận bất kỳ field nào từ body

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp dữ liệu cập nhật trong body.' });
        }

        // Kiểm tra definition tồn tại
        const definition = await Definition.findById(definitions_id);
        if (!definition) {
            return res.status(404).json({ success: false, message: `Không tìm thấy definition với id: ${definitions_id}` });
        }

        // Tìm và cập nhật record (chỉ update record thuộc đúng definition)
        const updatedRecord = await Record.findOneAndUpdate(
            { _id: record_id, definitionId: definitions_id },
            { $set: updateData },
            { new: true, runValidators: false } // Trả về bản ghi đã cập nhật, bỏ qua validator vì có thể update bất kỳ field
        );

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy record id: ${record_id} thuộc definition: ${definitions_id}`,
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật record thành công.',
            data: updatedRecord,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

export default router;
