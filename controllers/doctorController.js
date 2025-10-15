import Doctor from "../models/doctor.js";
import jwt from "jsonwebtoken";
import { deleteOldProfilePicture } from "../config/multerConfig.js";

// Helper function to generate JWT token
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d",
	});
};

// Helper function to check if user is admin
const isAdmin = (req) => {
	return req.user && req.user.role === "admin";
};

export async function registerDoctor(req, res) {
	try {
		const { fullName, email, password, specialization, bio } = req.body;

		// Check if doctor already exists
		const doctorExists = await Doctor.findOne({ email });

		if (doctorExists) {
			return res.status(400).json({ message: "Doctor already exists" });
		}

		// Prepare doctor data
		const doctorData = {
			fullName,
			email,
			password,
			specialization: specialization || "general",
			bio,
			...req.body,
		};

		// Add profile picture if uploaded
		if (req.file) {
			doctorData.profilePicture = `/uploads/profiles/${req.file.filename}`;
		}

		// Create new doctor
		const doctor = new Doctor(doctorData);
		const savedDoctor = await doctor.save();

		res.status(201).json({
			message: "Doctor registered successfully",
			doctor: savedDoctor,
			token: generateToken(savedDoctor._id),
		});
	} catch (error) {
		// Delete uploaded file if registration fails
		if (req.file) {
			deleteOldProfilePicture(`./uploads/profiles/${req.file.filename}`);
		}
		console.error("Error registering doctor:", error);
		return res.status(500).json({ message: "Failed to register doctor" });
	}
}

export async function loginDoctor(req, res) {
	try {
		const { email, password } = req.body;

		// Find doctor and include password field
		const doctor = await Doctor.findOne({ email }).select("+password");

		if (!doctor) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		// Check if doctor is active
		if (!doctor.isActive) {
			return res.status(403).json({ message: "Account is deactivated" });
		}

		// Compare password
		const isMatch = await doctor.comparePassword(password);

		if (!isMatch) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		res.json({
			message: "Login successful",
			doctor: doctor.toJSON(),
			token: generateToken(doctor._id),
		});
	} catch (error) {
		console.error("Error logging in doctor:", error);
		return res.status(500).json({ message: "Failed to login" });
	}
}

export async function getDoctorProfile(req, res) {
	try {
		const doctor = await Doctor.findById(req.user._id);

		if (doctor == null) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		res.json(doctor);
	} catch (error) {
		console.error("Error fetching doctor profile:", error);
		return res.status(500).json({ message: "Failed to fetch doctor profile" });
	}
}

export async function updateDoctorProfile(req, res) {
	try {
		const data = req.body;

		// Prevent updating sensitive fields
		delete data.password;
		delete data.email;
		delete data.role;

		// Handle profile picture update
		if (req.file) {
			// Get old doctor data to delete old profile picture
			const oldDoctor = await Doctor.findById(req.user._id);
			if (oldDoctor && oldDoctor.profilePicture) {
				deleteOldProfilePicture(`./uploads/profiles/${oldDoctor.profilePicture.split('/').pop()}`);
			}
			data.profilePicture = `/uploads/profiles/${req.file.filename}`;
		}

		const doctor = await Doctor.findByIdAndUpdate(req.user._id, data, {
			new: true,
			runValidators: true,
		});

		if (doctor == null) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		res.json({
			message: "Profile updated successfully",
			doctor: doctor,
		});
	} catch (error) {
		// Delete uploaded file if update fails
		if (req.file) {
			deleteOldProfilePicture(`./uploads/profiles/${req.file.filename}`);
		}
		console.error("Error updating doctor profile:", error);
		return res.status(500).json({ message: "Failed to update profile" });
	}
}

export async function updateDoctorProfilePicture(req, res) {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		// Get old doctor data to delete old profile picture
		const oldDoctor = await Doctor.findById(req.user._id);
		if (oldDoctor && oldDoctor.profilePicture && oldDoctor.profilePicture !== '/default-profile.jpg') {
			deleteOldProfilePicture(`./uploads/profiles/${oldDoctor.profilePicture.split('/').pop()}`);
		}

		// Update profile picture
		const doctor = await Doctor.findByIdAndUpdate(
			req.user._id,
			{ profilePicture: `/uploads/profiles/${req.file.filename}` },
			{ new: true }
		);

		if (!doctor) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		res.json({
			message: "Profile picture updated successfully",
			profilePicture: doctor.profilePicture,
			doctor: doctor,
		});
	} catch (error) {
		// Delete uploaded file if update fails
		if (req.file) {
			deleteOldProfilePicture(`./uploads/profiles/${req.file.filename}`);
		}
		console.error("Error updating profile picture:", error);
		return res.status(500).json({ message: "Failed to update profile picture" });
	}
}

export async function deleteDoctor(req, res) {
	try {
		const doctor = await Doctor.findById(req.user._id);

		if (doctor == null) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		// Delete profile picture if exists
		if (doctor.profilePicture && doctor.profilePicture !== '/default-profile.jpg') {
			deleteOldProfilePicture(`./uploads/profiles/${doctor.profilePicture.split('/').pop()}`);
		}

		await Doctor.findByIdAndDelete(req.user._id);

		res.json({ message: "Doctor deleted successfully" });
	} catch (error) {
		console.error("Error deleting doctor:", error);
		return res.status(500).json({ message: "Failed to delete doctor" });
	}
}

export async function getAllDoctors(req, res) {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const specialization = req.query.specialization;

	try {
		// Build query filter
		const filter = { isActive: true };
		if (specialization) {
			filter.specialization = { $regex: specialization, $options: "i" };
		}

		// Count all doctors matching the filter
		const doctorCount = await Doctor.countDocuments(filter);
		const totalPages = Math.ceil(doctorCount / limit);

		// Paginated fetch
		const doctors = await Doctor.find(filter)
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({
			doctors: doctors,
			totalPages: totalPages,
			currentPage: page,
			totalDoctors: doctorCount,
		});
	} catch (error) {
		console.error("Error fetching doctors:", error);
		return res.status(500).json({ message: "Failed to fetch doctors" });
	}
}

export async function getDoctorById(req, res) {
	try {
		const doctorId = req.params.doctorId;
		const doctor = await Doctor.findById(doctorId);

		if (doctor == null) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		res.json(doctor);
	} catch (error) {
		console.error("Error fetching doctor:", error);
		return res.status(500).json({ message: "Failed to fetch doctor" });
	}
}

export async function updateDoctorByAdmin(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	try {
		const data = req.body;
		const doctorId = req.params.doctorId;

		// Prevent changing role
		delete data.role;

		// Handle profile picture update
		if (req.file) {
			const oldDoctor = await Doctor.findById(doctorId);
			if (oldDoctor && oldDoctor.profilePicture && oldDoctor.profilePicture !== '/default-profile.jpg') {
				deleteOldProfilePicture(`./uploads/profiles/${oldDoctor.profilePicture.split('/').pop()}`);
			}
			data.profilePicture = `/uploads/profiles/${req.file.filename}`;
		}

		const doctor = await Doctor.findByIdAndUpdate(doctorId, data, {
			new: true,
			runValidators: true,
		});

		if (doctor == null) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		res.json({
			message: "Doctor updated successfully",
			doctor: doctor,
		});
	} catch (error) {
		if (req.file) {
			deleteOldProfilePicture(`./uploads/profiles/${req.file.filename}`);
		}
		console.error("Error updating doctor:", error);
		return res.status(500).json({ message: "Failed to update doctor" });
	}
}

export async function deleteDoctorByAdmin(req, res) {
	if (!isAdmin(req)) {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}

	try {
		const doctorId = req.params.doctorId;
		const doctor = await Doctor.findById(doctorId);

		if (doctor == null) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		// Delete profile picture if exists
		if (doctor.profilePicture && doctor.profilePicture !== '/default-profile.jpg') {
			deleteOldProfilePicture(`./uploads/profiles/${doctor.profilePicture.split('/').pop()}`);
		}

		await Doctor.findByIdAndDelete(doctorId);

		res.json({ message: "Doctor deleted successfully" });
	} catch (error) {
		console.error("Error deleting doctor:", error);
		return res.status(500).json({ message: "Failed to delete doctor" });
	}
}

export async function searchDoctors(req, res) {
	const query = req.params.query;

	try {
		const doctors = await Doctor.find({
			$or: [
				{ fullName: { $regex: query, $options: "i" } },
				{ email: { $regex: query, $options: "i" } },
				{ specialization: { $regex: query, $options: "i" } },
			],
			isActive: true,
		});

		res.json({
			doctors: doctors,
			totalPages: 1,
		});
	} catch (error) {
		console.error("Error searching doctors:", error);
		return res.status(500).json({ message: "Failed to search doctors" });
	}
}

export async function getDoctorsBySpecialization(req, res) {
	try {
		const specialization = req.params.specialization;
		const doctors = await Doctor.find({
			specialization: { $regex: specialization, $options: "i" },
			isActive: true,
		});

		res.json({
			doctors: doctors,
			count: doctors.length,
		});
	} catch (error) {
		console.error("Error fetching doctors by specialization:", error);
		return res
			.status(500)
			.json({ message: "Failed to fetch doctors by specialization" });
	}
}