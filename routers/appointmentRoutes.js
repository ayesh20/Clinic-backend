// routes/appointmentRoutes.js
import express from 'express';
import {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAllAppointments,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { 
  authenticate, 
  authenticatePatient, 
  authenticateDoctor 
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Patient routes
router.post(
  '/',
  authenticatePatient,
  createAppointment
);

router.get(
  '/patient',
  authenticatePatient,
  getPatientAppointments
);

// Doctor routes
router.get(
  '/doctor',
  authenticateDoctor,
  getDoctorAppointments
);

router.put(
  '/:appointmentId/status',
  authenticateDoctor,
  updateAppointmentStatus
);

// Shared routes (Patient, Doctor, or Admin)
router.get(
  '/:appointmentId',
  authenticate,
  getAppointmentById
);

router.put(
  '/:appointmentId/cancel',
  authenticate,
  cancelAppointment
);

// Admin routes
router.get(
  '/',
  authenticate,
  getAllAppointments
);

router.delete(
  '/:appointmentId',
  authenticate,
  deleteAppointment
);

export default router;