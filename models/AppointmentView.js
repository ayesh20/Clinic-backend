// models/AppointmentView.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true, trim: true, lowercase: true },
    patientPhone: { type: String, required: true, trim: true },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    doctorName: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    symptoms: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending'
    },
    note: { type: String } 
  },
  {
    timestamps: true
  }
);
const AppointmentView = mongoose.model('AppointmentView', appointmentSchema);
export default AppointmentView;