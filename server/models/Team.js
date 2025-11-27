import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    sortOrder: { type: Number, default: 0 }
});

export default mongoose.model('Team', teamSchema);
