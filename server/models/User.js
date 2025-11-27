import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'Project Manager', 'Team Mate'],
        required: true
    },
    email: { type: String }
});

export default mongoose.model('User', userSchema);
