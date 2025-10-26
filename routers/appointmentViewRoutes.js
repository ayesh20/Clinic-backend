// routers/appointmentViewRoutes.js
import express from 'express';
import { getAppointmentDetails } from '../controllers/appointmentViewController.js';

const router = express.Router();

// call api
router.get(
  '/details/:patientId',
  getAppointmentDetails
);

export default router;