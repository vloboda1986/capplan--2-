import express from 'express';
import RiskLog from '../models/RiskLog.js';

const router = express.Router();

// Get all risk logs
router.get('/', async (req, res) => {
    try {
        const logs = await RiskLog.find().sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a risk log
router.post('/', async (req, res) => {
    const log = new RiskLog(req.body);
    try {
        const newLog = await log.save();
        res.status(201).json(newLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
