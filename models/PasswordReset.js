import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expireAt: { type: Date, required: true }
});

export default mongoose.model('PasswordReset', PasswordResetSchema);
