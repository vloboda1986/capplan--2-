import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a user
router.post('/', async (req, res) => {
    const user = new User(req.body);
    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a user
router.put('/:id', async (req, res) => {
    try {
        console.log('PUT /users/:id called', req.params.id);
        console.log('Request body:', req.body);

        // Exclude id and _id from update data to avoid conflicts
        const { password, id, _id, ...userData } = req.body;

        // If password is empty/null, don't update it
        const updateData = { ...userData, id: req.params.id };
        if (password) {
            updateData.password = password;
        }

        // Try to find and update first
        let user = await User.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );

        if (!user) {
            console.log('User not found, creating new one with id:', req.params.id);
            // Create new user
            user = new User({ ...updateData, id: req.params.id });
            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error('Update error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete a user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ id: req.params.id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
