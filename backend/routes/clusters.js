import express from 'express';
import Cluster from '../models/Cluster.js';

const router = express.Router();

// Lấy tất cả các cụm (clusters) theo vị trí / loại
router.get('/', async (req, res) => {
    try {
        const clusters = await Cluster.find().populate('sensors');
        res.json(clusters);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Thêm mới cụm
router.post('/', async (req, res) => {
    try {
        const { name, type, location } = req.body;
        const newCluster = new Cluster({ name, type, location });
        const savedCluster = await newCluster.save();
        res.status(201).json(savedCluster);
    } catch (error) {
        res.status(400).json({ message: 'Lỗi khi thêm cụm', error });
    }
});

export default router;
