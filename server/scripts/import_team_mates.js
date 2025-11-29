import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root .env.local
dotenv.config({ path: join(__dirname, '../../.env.local') });

const usersToImport = [
    { name: 'Alexander Tereta', email: 'atereta@gomage.com' },
    { name: 'Igor Pilkevych', email: 'ipilkevych@gomage.com' },
    { name: 'Ivan Belik', email: 'ibelik@gomage.com' },
    { name: 'Marta Dmytriv', email: 'mdmytriv@gomage.com' },
    { name: 'Max Krauze', email: 'mkrauze@gomage.com' },
    { name: 'Oksana Vashchuk', email: 'ovashchuk@gomage.com' },
    { name: 'Oleh Halchun', email: 'ohalchun@gomage.com' },
    { name: 'Oleksii Arendarenko', email: 'oarendarenko@gomage.com' },
    { name: 'Serhii Vietrov', email: 'svietrov@gomage.com' },
    { name: 'Stanislav Miroshnyk', email: 'smiroshnyk@gomage.com' },
    { name: 'Uladzislau Marudzenka', email: 'vmarudenko@gomage.com' },
    { name: 'Valentin Petrenko', email: 'vpetrenko@gomage.com' },
    { name: 'Vitalii Rudiuk', email: 'vrudiuk@gomage.com' },
    { name: 'Yaroslav Kushnir', email: 'ykushnir@gomage.com' }
];

const importUsers = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env.local');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const userData of usersToImport) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User already exists: ${userData.name} (${userData.email})`);
                continue;
            }

            const newUser = new User({
                id: randomUUID(),
                name: userData.name,
                email: userData.email,
                role: 'Team Mate',
                password: '' // Empty password for legacy/new users without password
            });

            await newUser.save();
            console.log(`Created user: ${userData.name}`);
        }

        console.log('Import completed');
        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
};

importUsers();
