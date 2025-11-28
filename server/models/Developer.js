import mongoose from 'mongoose';

const developerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['Backend', 'Frontend', 'QA'],
        required: true
    },
    level: {
        type: String,
        enum: ['Junior', 'Mid', 'Senior', 'Lead'],
        required: true
    },
    type: {
        type: String,
        enum: ['Internal', 'Freelancer'],
        default: 'Internal'
    },
    avatar: { type: String, default: '' },
    teamId: { type: String },
    capacity: { type: Number, default: 8 }
});

export default mongoose.model('Developer', developerSchema);
