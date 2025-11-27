import express from 'express';
import Allocation from '../models/Allocation.js';

const router = express.Router();

// Get all allocations
router.get('/', async (req, res) => {
    try {
        const allocations = await Allocation.find();
        res.json(allocations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upsert an allocation
router.post('/', async (req, res) => {
    const { developerId, projectId, date, hours } = req.body;
    try {
        const allocation = await Allocation.findOneAndUpdate(
            { developerId, projectId, date },
            { hours },
            { new: true, upsert: true }
        );
        res.json(allocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
