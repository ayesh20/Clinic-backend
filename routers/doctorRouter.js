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
import { authenticate } from '../middleware/authMiddleware.js';
import upload, { handleMulterError } from '../config/multerConfig.js';

const router = express.Router();

// Public routes
router.post('/register', upload.single('profilePicture'), handleMulterError, registerDoctor);
router.post('/login', loginDoctor);

// Search and filter routes (MUST come before /:doctorId)
router.get('/search/:query', searchDoctors);
router.get('/specialization/:specialization', getDoctorsBySpecialization);

// Get all doctors (with pagination)
router.get('/', getAllDoctors);

// Admin routes
router.put('/admin/:doctorId', authenticate, upload.single('profilePicture'), handleMulterError, updateDoctorByAdmin);
router.delete('/admin/:doctorId', authenticate, deleteDoctorByAdmin);

// Protected routes (require authentication)
router.get('/profile', authenticate, getDoctorProfile);
router.put('/profile', authenticate, upload.single('profilePicture'), handleMulterError, updateDoctorProfile);
router.put('/profile/picture', authenticate, upload.single('profilePicture'), handleMulterError, updateDoctorProfilePicture);
router.delete('/profile', authenticate, deleteDoctor);

// Get single doctor (MUST be last among GET routes)
router.get('/:doctorId', getDoctorById);

export default router;