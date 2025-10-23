import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

import patientRouter from "./routers/patientRouter.js"
import doctorRouter from"./routers/doctorRouter.js"
import contactRouter from "./routers/contactRouter.js" 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()

const app = express()

app.use(cors());
app.use(bodyParser.json())
// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Remove the duplicate JWT middleware - let the route-specific middleware handle it

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

app.listen(5000, 
   ()=>{
       console.log("server started")
   }
)