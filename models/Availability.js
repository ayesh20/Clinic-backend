// models/Availability.js
import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  doctorEmail: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    slot: {
      type: String,
      required: true
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
availabilitySchema.index({ doctorId: 1, date: 1 });

// Method to check if a slot is available
availabilitySchema.methods.isSlotAvailable = function(slotTime) {
  const slot = this.timeSlots.find(s => s.slot === slotTime);
  return slot && !slot.isBooked;
};

// Method to book a slot
availabilitySchema.methods.bookSlot = function(slotTime, patientId) {
  const slot = this.timeSlots.find(s => s.slot === slotTime);
  if (slot && !slot.isBooked) {
    slot.isBooked = true;
    slot.patientId = patientId;
    return true;
  }
  return false;
};

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;