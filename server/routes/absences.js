import express from 'express';
import Absence from '../models/Absence.js';

const router = express.Router();

// Get all absences
router.get('/', async (req, res) => {
    try {
        const absences = await Absence.find();
        res.json(absences);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upsert absence
router.post('/', async (req, res) => {
    const { developerId, date, type } = req.body;
    try {
        if (type === 'None') {
            await Absence.findOneAndDelete({ developerId, date });
            res.json({ message: 'Absence removed' });
        } else {
            const absence = await Absence.findOneAndUpdate(
                { developerId, date },
                { type },
                { new: true, upsert: true }
            );
            res.json(absence);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
