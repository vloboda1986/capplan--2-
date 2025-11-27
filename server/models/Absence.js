import mongoose from 'mongoose';

const absenceSchema = new mongoose.Schema({
    developerId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    type: { type: String, required: true }
});

export default mongoose.model('Absence', absenceSchema);
