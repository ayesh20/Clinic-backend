// controllers/appointmentController.js
import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import Doctor from '../models/doctor.js';
import Patient from '../models/patient.js';

// Create new appointment (Patient only)
export const createAppointment = async (req, res) => {
  try {
    const {
      appointmentId,
      doctorId,
      doctorName,
      specialization,
      availabilityId,
      appointmentDate,
      appointmentTime,
      symptoms,
      patientName,
      patientEmail,
      patientPhone
    } = req.body;

    const patientId = req.user.id; // From auth middleware

    // Validate required fields
    if (!doctorId || !availabilityId || !appointmentDate || !appointmentTime || !symptoms) {
      return res.status(400).json({ 
        message: 'All appointment details are required' 
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify availability exists and slot is available
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({ message: 'Availability slot not found' });
    }

    // Check if the time slot is available
    const timeSlot = availability.timeSlots.find(slot => slot.slot === appointmentTime);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (timeSlot.isBooked) {
      return res.status(400).json({ 
        message: 'This time slot has already been booked. Please select another time.' 
      });
    }

    // Create appointment
    const appointment = new Appointment({
      appointmentId: appointmentId || 'APT-' + Date.now(),
      patientId,
      patientName: patientName || `${patient.firstName} ${patient.lastName}`,
      patientEmail: patientEmail || patient.email,
      patientPhone: patientPhone || patient.phone,
      doctorId,
      doctorName: doctorName || doctor.fullName,
      specialization: specialization || doctor.specialization,
      availabilityId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      symptoms,
      status: 'pending'
    });

    await appointment.save();

    // Book the time slot in availability
    timeSlot.isBooked = true;
    timeSlot.patientId = patientId;
    await availability.save();

    // Populate doctor and patient details
    await appointment.populate('doctorId', 'fullName email specialization profilePicture');
    await appointment.populate('patientId', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      message: 'Error booking appointment', 
      error: error.message 
    });
  }
};

// Get all appointments for logged-in patient
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status, upcoming } = req.query;

    let query = { patientId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter upcoming or past appointments
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed'] };
    } else if (upcoming === 'false') {
      query.$or = [
        { appointmentDate: { $lt: new Date() } },
        { status: { $in: ['completed', 'cancelled', 'no-show'] } }
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'fullName email specialization profilePicture phone')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      message: 'Appointments retrieved successfully',
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ 
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
};

// Get all appointments for logged-in doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, upcoming, date } = req.query;

    let query = { doctorId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.appointmentDate = { $gte: targetDate, $lt: nextDay };
    }

    // Filter upcoming or past appointments
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed'] };
    } else if (upcoming === 'false') {
      query.$or = [
        { appointmentDate: { $lt: new Date() } },
        { status: { $in: ['completed', 'cancelled', 'no-show'] } }
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      message: 'Appointments retrieved successfully',
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ 
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'fullName email specialization profilePicture phone')
      .populate('patientId', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    const isPatient = appointment.patientId._id.toString() === userId;
    const isDoctor = appointment.doctorId._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to view this appointment.' 
      });
    }

    res.status(200).json({
      message: 'Appointment retrieved successfully',
      appointment
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ 
      message: 'Error fetching appointment', 
      error: error.message 
    });
  }
};

// Update appointment status (Doctor/Admin only)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission
    const isDoctor = appointment.doctorId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isDoctor && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. Only the assigned doctor or admin can update status.' 
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, confirmed, completed, no-show' 
      });
    }

    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }

    await appointment.save();

    res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ 
      message: 'Error updating appointment status', 
      error: error.message 
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission
    const isPatient = appointment.patientId.toString() === userId;
    const isDoctor = appointment.doctorId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. You cannot cancel this appointment.' 
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'This appointment cannot be cancelled. It may be in the past or already completed.' 
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = isPatient ? 'patient' : (isDoctor ? 'doctor' : 'admin');
    appointment.cancellationReason = reason || '';
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Free up the time slot in availability
    const availability = await Availability.findById(appointment.availabilityId);
    if (availability) {
      const timeSlot = availability.timeSlots.find(
        slot => slot.slot === appointment.appointmentTime
      );
      if (timeSlot) {
        timeSlot.isBooked = false;
        timeSlot.patientId = null;
        await availability.save();
      }
    }

    res.status(200).json({
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ 
      message: 'Error cancelling appointment', 
      error: error.message 
    });
  }
};

// Get all appointments (Admin only)
export const getAllAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, doctorId, patientId, date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let query = {};

    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;
    
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.appointmentDate = { $gte: targetDate, $lt: nextDay };
    }

    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limit);

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'fullName email specialization profilePicture')
      .populate('patientId', 'firstName lastName email phone')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      message: 'All appointments retrieved successfully',
      appointments,
      totalPages,
      currentPage: page,
      totalAppointments
    });

  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ 
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
};

// Delete appointment (Admin only)
export const deleteAppointment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Free up the time slot if appointment is not completed
    if (appointment.status !== 'completed') {
      const availability = await Availability.findById(appointment.availabilityId);
      if (availability) {
        const timeSlot = availability.timeSlots.find(
          slot => slot.slot === appointment.appointmentTime
        );
        if (timeSlot && timeSlot.isBooked) {
          timeSlot.isBooked = false;
          timeSlot.patientId = null;
          await availability.save();
        }
      }
    }

    await Appointment.findByIdAndDelete(appointmentId);

    res.status(200).json({
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ 
      message: 'Error deleting appointment', 
      error: error.message 
    });
  }
};