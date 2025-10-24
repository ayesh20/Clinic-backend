
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
// Generate JWT token
const generateToken = (adminId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Login admin
export async function loginAdmin(req, res) {
  try {
    console.log("Admin login attempt:", req.body.email);
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin and include password field
    const admin = await Admin.findOne({ email }).select("+password");
    console.log("Admin found:", admin ? "Yes" : "No");

    if (!admin) {
      console.log("Admin not found with email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      console.log("Admin account is deactivated");
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(admin._id);
    console.log("Token generated successfully");

    res.json({
      message: "Login successful",
      admin: admin.toJSON(),
      token: token,
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Failed to login", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Get admin profile
export async function getAdminProfile(req, res) {
  try {
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      success: true,
      admin: admin.toJSON(),
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}