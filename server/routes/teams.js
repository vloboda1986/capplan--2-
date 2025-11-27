import express from 'express';
import Team from '../models/Team.js';

const router = express.Router();

// Get all teams
router.get('/', async (req, res) => {
    try {
        const teams = await Team.find();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a team
router.post('/', async (req, res) => {
    const team = new Team(req.body);
    try {
        const newTeam = await team.save();
        res.status(201).json(newTeam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a team
router.put('/:id', async (req, res) => {
    try {
        const team = await Team.findOne({ id: req.params.id });
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        Object.assign(team, req.body);
        const updatedTeam = await team.save();
        res.json(updatedTeam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a team
router.delete('/:id', async (req, res) => {
    try {
        const team = await Team.findOneAndDelete({ id: req.params.id });
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        res.json({ message: 'Team deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
