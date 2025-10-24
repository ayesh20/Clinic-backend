// models/Appointment.js
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
    patientName: {
      type: String,
      required: true,
      trim: true
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    patientPhone: {
      type: String,
      required: true,
      trim: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    doctorName: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    availabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Availability',
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },
    appointmentTime: {
      type: String,
      required: true,
      trim: true
    },
    symptoms: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  
  // Can cancel if appointment is in the future and status is pending or confirmed
  return appointmentDateTime > now && 
         (this.status === 'pending' || this.status === 'confirmed');
};

// Static method to get upcoming appointments
appointmentSchema.statics.getUpcoming = function(userId, userType) {
  const query = {
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };
  
  if (userType === 'patient') {
    query.patientId = userId;
  } else if (userType === 'doctor') {
    query.doctorId = userId;
  }
  
  return this.find(query).sort({ appointmentDate: 1, appointmentTime: 1 });
};

// Static method to get past appointments
appointmentSchema.statics.getPast = function(userId, userType) {
  const query = {
    $or: [
      { appointmentDate: { $lt: new Date() } },
      { status: { $in: ['completed', 'cancelled', 'no-show'] } }
    ]
  };
  
  if (userType === 'patient') {
    query.patientId = userId;
  } else if (userType === 'doctor') {
    query.doctorId = userId;
  }
  
  return this.find(query).sort({ appointmentDate: -1, appointmentTime: -1 });
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;