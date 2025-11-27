import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    developerId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true }
});

// Compound index for unique assignment
assignmentSchema.index({ developerId: 1, projectId: 1 }, { unique: true });

export default mongoose.model('Assignment', assignmentSchema);
