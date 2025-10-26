// controllers/appointmentViewController.js
import Appointment from '../models/AppointmentView.js';

// current and history data
export const getAppointmentDetails = async (req, res) => {
  try {
    const { patientId } = req.params; // call api

    //Current Appointment
    const currentAppointment = await Appointment.findOne({
      patientId: patientId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ appointmentDate: 1, appointmentTime: 1 });

    // Previous Appointment
    const previousAppointments = await Appointment.find({
      patientId: patientId,
      $or: [
          { appointmentDate: { $lt: new Date() } }, 
          { status: { $in: ['completed', 'cancelled', 'no-show'] } } 
      ]
    }).sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      profile: { name: 'Sample Patient', email: 'test@example.com' }, // data of patient profile
      currentAppointment: currentAppointment,
      previousAppointments: previousAppointments
    });

  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ 
      message: 'Error fetching appointment details', 
      error: error.message 
    });
  }
};