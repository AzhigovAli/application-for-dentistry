import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
  },
  fullName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: false,
  },
  date: {
    type: Number,
    required: true,
  },
  prepayment: {
    type: String,
    required: false,
  },
  month: {
    type: String,
    required: false,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  arrivalTime: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  numberTooth: {
    type: Number,
    required: true,
  },
});

export default mongoose.model('Visit', VisitSchema);
