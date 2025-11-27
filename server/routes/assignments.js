import express from 'express';
import Assignment from '../models/Assignment.js';
import Allocation from '../models/Allocation.js';

const router = express.Router();

// Get all assignments
router.get('/', async (req, res) => {
    try {
        const assignments = await Assignment.find();
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create assignment
router.post('/', async (req, res) => {
    const { developerId, projectId } = req.body;
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { developerId, projectId },
            { developerId, projectId },
            { new: true, upsert: true }
        );
        res.status(201).json(assignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete assignment
router.delete('/', async (req, res) => {
    const { developerId, projectId } = req.body;
    try {
        await Assignment.findOneAndDelete({ developerId, projectId });
        // Also delete allocations for this assignment
        await Allocation.deleteMany({ developerId, projectId });
        res.json({ message: 'Assignment removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
