// models/Contact.js
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 100 },
  lastName:  { type: String, required: true, trim: true, maxlength: 100 },
  email:     { 
    type: String, required: true, trim: true, lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email']
  },
  phone:     { type: String, trim: true, maxlength: 20 },
  topic:     { type: String, enum: ['general','support','billing','feedback','other'], default: 'general' },
  message:   { type: String, required: true, trim: true, maxlength: 2000 },
  termsAccepted: { type: Boolean, required: true },
  meta: {
    ip: String,
    userAgent: String
  }
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);