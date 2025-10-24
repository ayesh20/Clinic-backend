import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Doctor from '../models/doctor.js';
import Patient from '../models/patient.js';
import Admin from '../models/admin.js';
import PasswordReset from '../models/PasswordReset.js';

dotenv.config();

/**
 * Generate and store OTP for a user
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user in all models
    const user =
      (await Doctor.findOne({ email })) ||
      (await Patient.findOne({ email })) ||
      (await Admin.findOne({ email }));

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expireAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 min

    // Save or update OTP
    await PasswordReset.findOneAndUpdate(
      { email },
      { otp, expireAt },
      { upsert: true, new: true }
    );

    // ✅ Log OTP (since we’re not emailing)
    console.log(`🔐 OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP generated and stored successfully (check backend log or DB)',
    });
  } catch (err) {
    console.error('Error generating OTP:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
};

/**
 * Verify OTP from the database
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const record = await PasswordReset.findOne({ email });

    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (record.expireAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ success: false, message: 'Error verifying OTP' });
  }
};

/**
 * Reset password after OTP verification
 * Works for Doctors, Patients, and Admins
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    // Validate password strength (optional but recommended)
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const models = [Doctor, Patient, Admin];
    let userFound = null;

    // Search and update password in all models
    for (const model of models) {
      const user = await model.findOne({ email });
      if (user) {
        user.password = hashedPassword;
        await user.save();
        userFound = user;
        break;
      }
    }

    if (!userFound) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove OTP after successful reset
    await PasswordReset.deleteOne({ email });

    console.log(`✅ Password successfully reset for ${email} (${userFound.role})`);

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${userFound.role}`,
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};
