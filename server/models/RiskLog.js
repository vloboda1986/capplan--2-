import mongoose from 'mongoose';

const riskLogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    projectId: { type: String, required: true },
    date: { type: String, required: true }, // ISO string
    riskLevel: {
        type: String,
        enum: ['Green', 'Yellow', 'Red'],
        required: true
    },
    riskDescription: { type: String },
    updatedBy: { type: String } // User ID
});

export default mongoose.model('RiskLog', riskLogSchema);
