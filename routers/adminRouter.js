import express from "express";
import {
  loginAdmin,
  
} from "../controllers/adminController.js";


const router = express.Router();

// Public route
router.post("/login", loginAdmin);


export default router;