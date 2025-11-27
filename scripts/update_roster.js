import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Developer from '../server/models/Developer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/capplan';

const NEW_ROSTER = [
    "Vitalii Rudiuk",
    "Stanislav Miroshnyk",
    "Igor Pilkevych",
    "Valentin Petrenko",
    "Oleh Halchun",
    "Vladislav Marudenko",
    "Serhii Vietrov",
    "Marta Dmytriv",
    "Ivan Belik",
    "Max Krauze",
    "Oksana Vashchuk",
    "Alexander Tereta",
    "Oleksii Arendarenko",
    "Yaroslav Kushnir",
    "Ivan Havryliuk",
    "Sergey Borodich",
    "Mykola Silin",
    "Kogut Dmitriy",
    "Anton Stukalo"
];

const updateRoster = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Remove all existing developers
        const deleteResult = await Developer.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} existing developers.`);

        // 2. Add new developers
        const developers = NEW_ROSTER.map(name => ({
            id: crypto.randomUUID(),
            name: name,
            role: 'Frontend', // Default
            level: 'Mid',     // Default
            teamId: 'unassigned',
            capacity: 8
        }));

        const insertResult = await Developer.insertMany(developers);
        console.log(`Added ${insertResult.length} new developers.`);

        console.log('Roster update complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating roster:', error);
        process.exit(1);
    }
};

updateRoster();
