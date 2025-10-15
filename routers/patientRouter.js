import express from "express";
import {
  registerPatient,
  loginPatient,
  getPatientProfile,
  updatePatientProfile,
  deletePatient,
  getAllPatients,
  getPatientById,
  updatePatientByAdmin,
  deletePatientByAdmin,
  searchPatients,
} from "../controllers/patientController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerPatient);
router.post("/login", loginPatient);

// Protected routes (require authentication)
router.get("/profile", authenticate, getPatientProfile);
router.put("/profile", authenticate, updatePatientProfile);
router.delete("/profile", authenticate, deletePatient);

// Admin routes (require authentication and admin role)
router.get("/", authenticate, getAllPatients);
router.get("/:patientId", authenticate, getPatientById);
router.put("/admin/:patientId", authenticate, updatePatientByAdmin);
router.delete("/admin/:patientId", authenticate, deletePatientByAdmin);
router.get("/search/:query", authenticate, searchPatients);

export default router;