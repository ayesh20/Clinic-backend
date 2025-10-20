import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

import patientRouter from "./routers/patientRouter.js"
import doctorRouter from "./routers/doctorRouter.js"
import adminRouter from "./routers/adminRouter.js"

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
app.use("/api/admin", adminRouter);

app.listen(5000, 
   ()=>{
       console.log("server started on port 5000")
   }
)