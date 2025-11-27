import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Project from '../models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root (server/scripts -> server -> root)
dotenv.config({ path: join(__dirname, '..', '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/capplan';

const NEW_PROJECTS = [
    "Owens-Illinois",
    "KitchenallM2",
    "Perfect Circuit",
    "Online-cigars",
    "Ableskills",
    "Livetosurf",
    "USA skate shop",
    "FrancisKirk",
    "Seed Strains",
    "Wholesale Cabinets",
    "Voriagh",
    "Skinstation",
    "Salisparts",
    "Ferguson-lighting",
    "Stackmann",
    "Renovatorstore",
    "Bioactiva",
    "eMerchantclub",
    "CrayCort",
    "Shirtee",
    "RestaurantSupply",
    "Eurow",
    "AVNed",
    "Kooyman",
    "Plandent",
    "SoundKitchen",
    "Bouwkampioen Hyva",
    "Bouwkampioen chatbot",
    "Bouwkampioen pertner portal",
    "Allprepare",
    "Packlinq",
    "Businesspoint",
    "RoyalPosthumus",
    "Restaurantsupply_chatbot",
    "Internal AI development",
    "USAslates AI translations"
];

const PROJECT_COLORS = [
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-purple-200 text-purple-800',
    'bg-orange-200 text-orange-800',
    'bg-red-200 text-red-800',
    'bg-teal-200 text-teal-800',
    'bg-indigo-200 text-indigo-800',
    'bg-pink-200 text-pink-800',
    'bg-yellow-200 text-yellow-800',
    'bg-slate-200 text-slate-800'
];

const updateProjects = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Remove all existing projects
        const deleteResult = await Project.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} existing projects.`);

        // 2. Add new projects
        const projects = NEW_PROJECTS.map((name, index) => ({
            id: crypto.randomUUID(),
            name: name,
            color: PROJECT_COLORS[index % PROJECT_COLORS.length], // Cycle through colors
            priority: 'Medium',
            riskLevel: 'Green',
            subprojects: [],
            lastStatusUpdate: new Date().toISOString()
        }));

        const insertResult = await Project.insertMany(projects);
        console.log(`Added ${insertResult.length} new projects.`);

        console.log('Project list update complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating projects:', error);
        process.exit(1);
    }
};

updateProjects();
