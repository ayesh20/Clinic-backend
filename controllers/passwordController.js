import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import Student from '../models/doctor.js';
import Instructor from '../models/patient.js';
import PasswordReset from '../models/PasswordReset.js';

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP
export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Student.findOne({ email }) || 
                 await Instructor.findOne({ email }) ||
                 await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'Email not found' });

    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await PasswordReset.findOneAndUpdate(
      { email },
      { otp, expireAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Password Reset',
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
    });

    res.json({ message: 'OTP sent to email' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await PasswordReset.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid OTP' });
    if (record.expireAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const models = [Student, Instructor, User];
    let updated = false;

    for (let model of models) {
      const user = await model.findOne({ email });
      if (user) {
        user.password = hashedPassword;
        await user.save();
        updated = true;
        break;
      }
    }

    if (!updated) return res.status(404).json({ message: 'User not found' });

    await PasswordReset.deleteOne({ email });
    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
};
