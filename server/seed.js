import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.js';
import Team from './models/Team.js';
import Developer from './models/Developer.js';
import Project from './models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/capplan';

console.log('Attempting to connect to MongoDB...');
console.log('Connection string starts with:', MONGODB_URI.substring(0, 20) + '...');

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB for seeding'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Team.deleteMany({});
        await Developer.deleteMany({});
        await Project.deleteMany({});

        // Users
        const users = [
            { id: 'u1', name: 'Admin User', role: 'Admin', email: 'admin@company.com' },
            { id: 'u2', name: 'Project Manager', role: 'Project Manager', email: 'pm@company.com' },
            { id: 'u3', name: 'Team Mate', role: 'Team Mate', email: 'dev@company.com' }
        ];
        await User.insertMany(users);
        console.log('Users seeded');

        // Teams
        const teams = [
            { id: 't1', name: 'Alpha Squad', color: 'bg-blue-500' },
            { id: 't2', name: 'Beta Squad', color: 'bg-green-500' }
        ];
        await Team.insertMany(teams);
        console.log('Teams seeded');

        // Developers
        const developers = [
            { id: 'd1', name: 'John Doe', role: 'Frontend', level: 'Senior', teamId: 't1', capacity: 8 },
            { id: 'd2', name: 'Jane Smith', role: 'Backend', level: 'Mid', teamId: 't1', capacity: 8 },
            { id: 'd3', name: 'Bob Johnson', role: 'QA', level: 'Junior', teamId: 't2', capacity: 8 }
        ];
        await Developer.insertMany(developers);
        console.log('Developers seeded');

        // Projects
        const projects = [
            {
                id: 'p1',
                name: 'E-Commerce Platform',
                color: 'bg-indigo-500',
                priority: 'High',
                riskLevel: 'Green',
                managerId: 'u2'
            },
            {
                id: 'p2',
                name: 'Internal Dashboard',
                color: 'bg-pink-500',
                priority: 'Medium',
                riskLevel: 'Yellow',
                riskDescription: 'Tight deadline',
                managerId: 'u2'
            }
        ];
        await Project.insertMany(projects);
        console.log('Projects seeded');

        console.log('Seeding complete');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();
