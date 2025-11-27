import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: {
        type: String,
        enum: ['Release', 'Milestone'],
        required: true
    },
    title: { type: String, required: true },
    developerId: { type: String },
    projectId: { type: String }
});

export default mongoose.model('Event', eventSchema);
