import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

import patientRouter from "./routers/patientRouter.js"
import contactRouter from "./routers/contactRouter.js" 
import doctorRouter from "./routers/doctorRouter.js"
import adminRouter from "./routers/adminRouter.js"
import feedbackRoutes from "./routers/feedbackRoutes.js";
import passwordRoutes from "./routers/passwordRoutes.js";
import availabilityRoutes from "./routers/availabilityRoutes.js";
import appointmentRoutes from "./routers/appointmentRoutes.js"; 
import appointmentViewRoutes from "./routers/appointmentViewRoutes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()

const app = express()

app.use(cors());
app.use(bodyParser.json())
// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectionString = process.env.MONGO_URI

mongoose.connect(connectionString).then(
    ()=>{
        console.log("Connected to database")
    }
).catch(
    ()=>{
        console.log("Failed to connect to the database")
    }
)

app.use("/api/patients", patientRouter);
app.use("/api/doctors", doctorRouter);


app.use("/api/contact", contactRouter); 

// Simple health route (optional)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler (so controller next(err) works)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
});
app.use("/api/admin", adminRouter);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/ccontactus", contactRouter);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes); 


app.listen(5000, 
   ()=>{
       console.log("server started on port 5000")
   }
)