import express from 'express';
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  updateDoctorProfilePicture,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctorByAdmin,
  deleteDoctorByAdmin,
  searchDoctors,
  getDoctorsBySpecialization,
} from '../controllers/doctorController.js';
import { authenticate } from '../middleware/authMiddleware.js'; // You need to create this
import upload, { handleMulterError } from '../config/multerConfig.js';

const router = express.Router();

// Public routes
router.post('/register', upload.single('profilePicture'), handleMulterError, registerDoctor);
router.post('/login', loginDoctor);
router.get('/', getAllDoctors); // Get all doctors with pagination
router.get('/search/:query', searchDoctors); // Search doctors
router.get('/specialization/:specialization', getDoctorsBySpecialization); // Get by specialization
router.get('/:doctorId', getDoctorById); // Get single doctor

// Protected routes (require authentication)
router.get('/profile', authenticate, getDoctorProfile); // Get own profile
router.put('/profile', authenticate, upload.single('profilePicture'), handleMulterError, updateDoctorProfile); // Update profile
router.put('/profile/picture', authenticate, upload.single('profilePicture'), handleMulterError, updateDoctorProfilePicture); // Update only picture
router.delete('/profile', authenticate, deleteDoctor); // Delete own account

// Admin routes
router.put('/admin/:doctorId', authenticate, upload.single('profilePicture'), handleMulterError, updateDoctorByAdmin);
router.delete('/admin/:doctorId', authenticate, deleteDoctorByAdmin);

export default router;