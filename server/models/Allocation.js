import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
    developerId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    hours: { type: Number, required: true }
});

// Compound index for unique daily allocation per project per dev
allocationSchema.index({ developerId: 1, projectId: 1, date: 1 }, { unique: true });

export default mongoose.model('Allocation', allocationSchema);
