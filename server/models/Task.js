import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    developerId: { type: String, required: true },
    projectId: { type: String, required: true },
    date: { type: String, required: true }, // Format: yyyy-MM-dd
    title: { type: String, required: true },
    url: { type: String, required: true }
});

export default mongoose.model('Task', taskSchema);
