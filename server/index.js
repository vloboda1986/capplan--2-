import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') }); // Load env from root

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/capplan';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('CapPlan API is running');
});

import developerRoutes from './routes/developers.js';
import projectRoutes from './routes/projects.js';
import allocationRoutes from './routes/allocations.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import eventRoutes from './routes/events.js';
import assignmentRoutes from './routes/assignments.js';
import absenceRoutes from './routes/absences.js';
import riskLogsRouter from './routes/riskLogs.js';

app.use('/api/developers', developerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/risk-logs', riskLogsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
