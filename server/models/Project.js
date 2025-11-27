import mongoose from 'mongoose';

const subprojectSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    deadline: { type: String }
});

const projectSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low']
    },
    subproject: { type: String }, // Legacy
    deadline: { type: String },
    subprojects: [subprojectSchema],
    riskLevel: {
        type: String,
        enum: ['Green', 'Yellow', 'Red'],
        default: 'Green'
    },
    riskDescription: { type: String },
    lastStatusUpdate: { type: String },
    shortUpdate: { type: String },
    managerId: { type: String },
    stack: { type: String }
});

export default mongoose.model('Project', projectSchema);
