import Patient from "../models/patient.js";
import jwt from "jsonwebtoken";

// Helper function to generate JWT token
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d",
	});
};

// Helper function to check if user is admin
const isAdmin = (req) => {
	return req.user && req.user.role === 'admin';
};

export async function registerPatient(req, res) {
	try {
		const { firstName, lastName, email, password } = req.body;

		// Check if patient already exists
		const patientExists = await Patient.findOne({ email });

		if (patientExists) {
			return res.status(400).json({ message: "Patient already exists" });
		}

		// Create new patient
		const patient = new Patient({
			firstName,
			lastName,
			email,
			password,
			...req.body,
		});

		const savedPatient = await patient.save();

		res.status(201).json({
			message: "Patient registered successfully",
			patient: savedPatient,
			token: generateToken(savedPatient._id),
		});
	} catch (error) {
		console.error("Error registering patient:", error);
		return res.status(500).json({ message: "Failed to register patient", error: error.message });
	}
}

export async function loginPatient(req, res) {
	try {
		const { email, password } = req.body;

		// Find patient and include password field
		const patient = await Patient.findOne({ email }).select("+password");

		if (!patient) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		// Check if patient is active
		if (!patient.isActive) {
			return res.status(403).json({ message: "Account is deactivated" });
		}

		// Compare password
		const isMatch = await patient.comparePassword(password);

		if (!isMatch) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		res.json({
			message: "Login successful",
			patient: patient.toJSON(),
			token: generateToken(patient._id),
		});
	} catch (error) {
		console.error("Error logging in patient:", error);
		return res.status(500).json({ message: "Failed to login" });
	}
}

export async function getPatientProfile(req, res) {
	try {
		const patient = await Patient.findById(req.user._id);

		if (patient == null) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.json(patient);
	} catch (error) {
		console.error("Error fetching patient profile:", error);
		return res.status(500).json({ message: "Failed to fetch patient profile" });
	}
}

export async function updatePatientProfile(req, res) {
	try {
		const data = req.body;

		// Prevent updating sensitive fields
		delete data.password;
		delete data.email;
		delete data.role;

		const patient = await Patient.findByIdAndUpdate(req.user._id, data, {
			new: true,
			runValidators: true,
		});

		if (patient == null) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.json({
			message: "Profile updated successfully",
			patient: patient,
		});
	} catch (error) {
		console.error("Error updating patient profile:", error);
		return res.status(500).json({ message: "Failed to update profile" });
	}
}

export async function deletePatient(req, res) {
	try {
		const patient = await Patient.findByIdAndDelete(req.user._id);

		if (patient == null) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.json({ message: "Patient deleted successfully" });
	} catch (error) {
		console.error("Error deleting patient:", error);
		return res.status(500).json({ message: "Failed to delete patient" });
	}
}

export async function getAllPatients(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;

	try {
		// Count all patients
		const patientCount = await Patient.countDocuments();
		const totalPages = Math.ceil(patientCount / limit);

		// Paginated fetch
		const patients = await Patient.find()
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({
			patients: patients,
			totalPages: totalPages,
		});
	} catch (error) {
		console.error("Error fetching patients:", error);
		return res.status(500).json({ message: "Failed to fetch patients" });
	}
}

export async function getPatientById(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	try {
		const patientId = req.params.patientId;
		const patient = await Patient.findById(patientId);

		if (patient == null) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.json(patient);
	} catch (error) {
		console.error("Error fetching patient:", error);
		return res.status(500).json({ message: "Failed to fetch patient" });
	}
}

export async function updatePatientByAdmin(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	try {
		const data = req.body;
		const patientId = req.params.patientId;

		// Prevent changing role
		delete data.role;

		const patient = await Patient.findByIdAndUpdate(patientId, data, {
			new: true,
			runValidators: true,
		});

		if (patient == null) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.json({
			message: "Patient updated successfully",
			patient: patient,
		});
	} catch (error) {
		console.error("Error updating patient:", error);
		return res.status(500).json({ message: "Failed to update patient" });
	}
}

export async function deletePatientByAdmin(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	try {
		const patientId = req.params.patientId;
		const patient = await Patient.findByIdAndDelete(patientId);

		if (patient == null) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.json({ message: "Patient deleted successfully" });
	} catch (error) {
		console.error("Error deleting patient:", error);
		return res.status(500).json({ message: "Failed to delete patient" });
	}
}

export async function searchPatients(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	const query = req.params.query;

	try {
		const patients = await Patient.find({
			$or: [
				{ firstName: { $regex: query, $options: "i" } },
				{ lastName: { $regex: query, $options: "i" } },
				{ email: { $regex: query, $options: "i" } },
			],
		});

		res.json({
			patients: patients,
			totalPages: 1,
		});
	} catch (error) {
		console.error("Error searching patients:", error);
		return res.status(500).json({ message: "Failed to search patients" });
	}
}