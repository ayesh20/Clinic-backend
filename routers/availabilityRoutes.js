// routes/availabilityRoutes.js
import express from 'express';
import { 
  createAvailability, 
  getAvailability, 
  getDoctorAvailability, 
  deleteAvailability, 
  updateTimeSlots 
} from '../controllers/availabilityController.js';
import { authenticateDoctor } from '../middleware/authMiddleware.js';

const router = express.Router();

// Doctor routes (protected)
router.post(
  '/',
  authenticateDoctor,
  createAvailability
);

router.get(
  '/',
  authenticateDoctor,
  getAvailability
);

router.put(
  '/:availabilityId',
  authenticateDoctor,
  updateTimeSlots
);

router.delete(
  '/:availabilityId',
  authenticateDoctor,
  deleteAvailability
);

// Public routes (for patients to view)
router.get(
  '/doctor/:doctorId',
  getDoctorAvailability
);

export default router;