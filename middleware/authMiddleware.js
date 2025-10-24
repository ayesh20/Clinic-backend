// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Doctor from '../models/doctor.js';
import Patient from '../models/patient.js';
import Admin from '../models/admin.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    // Check if token has role specified
    if (decoded.role === 'admin') {
      // Look in Admin collection
      user = await Admin.findById(decoded.id).select('-password');
    } else {
      // Check Doctor and Patient collections
      user = await Doctor.findById(decoded.id).select('-password');
      
      if (!user) {
        user = await Patient.findById(decoded.id).select('-password');
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found. Access denied.' });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Access denied.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed.' });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to check if user is doctor
export const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Doctor privileges required.' });
  }
};

// Middleware to check if user is patient
export const isPatient = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Patient privileges required.' });
  }
};

export const protect = authenticate;

// Authenticate doctor specifically (for availability routes)
export const authenticateDoctor = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Debug: Log the decoded token to see what fields it has
    console.log('Decoded token:', decoded);

    // Try to find the doctor first
    const doctor = await Doctor.findById(decoded.id).select('-password');
    
    if (!doctor) {
      console.log('Doctor not found with ID:', decoded.id);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check multiple possible role field names in token or user object
    const isDoctor = 
      decoded.role === 'doctor' || 
      decoded.userType === 'doctor' || 
      doctor.role === 'doctor' ||
      doctor.userType === 'doctor';

    if (!isDoctor) {
      console.log('User is not a doctor. Token role:', decoded.role, 'User role:', doctor.role);
      return res.status(403).json({ message: 'Access denied. Doctor only.' });
    }

    // Check if doctor is active
    if (doctor.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.user = doctor;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Access denied.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed.' });
  }
};

// Authenticate patient specifically (for booking appointments)
export const authenticatePatient = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find the patient
    const patient = await Patient.findById(decoded.id).select('-password');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check multiple possible role field names
    const isPatient = 
      decoded.role === 'patient' || 
      decoded.userType === 'patient' || 
      patient.role === 'patient' ||
      patient.userType === 'patient';

    if (!isPatient) {
      return res.status(403).json({ message: 'Access denied. Patient only.' });
    }

    // Check if patient is active
    if (patient.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.user = patient;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Access denied.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed.' });
  }
};