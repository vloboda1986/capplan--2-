import express from 'express';
import Developer from '../models/Developer.js';

const router = express.Router();

// Get all developers
router.get('/', async (req, res) => {
    try {
        const developers = await Developer.find();
        res.json(developers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a developer
router.post('/', async (req, res) => {
    const developer = new Developer(req.body);
    try {
        const newDeveloper = await developer.save();
        res.status(201).json(newDeveloper);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a developer
router.put('/:id', async (req, res) => {
    try {
        const developer = await Developer.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );

        if (!developer) {
            return res.status(404).json({ message: 'Developer not found' });
        }

        res.json(developer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a developer
router.delete('/:id', async (req, res) => {
    try {
        await Developer.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Developer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
