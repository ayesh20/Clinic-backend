import express from 'express';
import { sendOtp, verifyOtp, resetPassword } from '../controllers/passwordController.js';

const router = express.Router();

// Request OTP
router.post('/forgot-password', sendOtp);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset Password
router.post('/reset-password', resetPassword);

export default router;
