// controllers/availabilityController.js
import Availability from '../models/Availability.js';
import Doctor from '../models/doctor.js';

// Create or update availability slots for a date range
export const createAvailability = async (req, res) => {
  try {
    const { startDate, endDate, timeSlots } = req.body;
    const doctorId = req.user.id; // From auth middleware
    
    // Get doctor details
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Validate input
    if (!startDate || !endDate || !timeSlots || timeSlots.length === 0) {
      return res.status(400).json({ 
        message: 'Start date, end date, and time slots are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Normalize dates to start of day
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      return res.status(400).json({ 
        message: 'Start date must be before or equal to end date' 
      });
    }

    const createdAvailabilities = [];
    const updatedAvailabilities = [];
    
    // Create availability for each date in the range
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateToSave = new Date(currentDate);
      
      // Check if availability already exists for this date
      const existingAvailability = await Availability.findOne({
        doctorId: doctorId,
        date: dateToSave
      });

      // Format time slots
      const formattedSlots = timeSlots.map(slot => ({
        slot: slot,
        isBooked: false,
        patientId: null
      }));

      if (existingAvailability) {
        // Update existing availability (add new slots, keep existing bookings)
        const existingSlotTimes = existingAvailability.timeSlots.map(s => s.slot);
        
        formattedSlots.forEach(newSlot => {
          if (!existingSlotTimes.includes(newSlot.slot)) {
            existingAvailability.timeSlots.push(newSlot);
          }
        });
        
        await existingAvailability.save();
        updatedAvailabilities.push(existingAvailability);
      } else {
        // Create new availability
        const availability = new Availability({
          doctorId: doctorId,
          doctorEmail: doctor.email,
          date: dateToSave,
          timeSlots: formattedSlots
        });
        
        await availability.save();
        createdAvailabilities.push(availability);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(201).json({
      message: 'Availability saved successfully',
      created: createdAvailabilities.length,
      updated: updatedAvailabilities.length,
      data: {
        createdAvailabilities,
        updatedAvailabilities
      }
    });

  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({ 
      message: 'Error saving availability', 
      error: error.message 
    });
  }
};

// Get doctor's availability by date range
export const getAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { doctorId: doctorId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    }

    const availabilities = await Availability.find(query)
      .sort({ date: 1 })
      .populate('timeSlots.patientId', 'name email phone');

    res.status(200).json({
      message: 'Availability retrieved successfully',
      count: availabilities.length,
      data: availabilities
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ 
      message: 'Error fetching availability', 
      error: error.message 
    });
  }
};

// Get availability for a specific doctor (public - for patients)
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { doctorId: doctorId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    } else {
      // Default: show availability from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const availabilities = await Availability.find(query)
      .sort({ date: 1 })
      .select('-__v');

    // Filter to show only available slots (not booked)
    const availableSlots = availabilities.map(avail => ({
      _id: avail._id,
      date: avail.date,
      timeSlots: avail.timeSlots.filter(slot => !slot.isBooked)
    })).filter(avail => avail.timeSlots.length > 0);

    res.status(200).json({
      message: 'Doctor availability retrieved successfully',
      count: availableSlots.length,
      data: availableSlots
    });

  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ 
      message: 'Error fetching availability', 
      error: error.message 
    });
  }
};

// Delete availability slot
export const deleteAvailability = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    const doctorId = req.user.id;

    const availability = await Availability.findOne({
      _id: availabilityId,
      doctorId: doctorId
    });

    if (!availability) {
      return res.status(404).json({ 
        message: 'Availability not found' 
      });
    }

    // Check if any slots are booked
    const hasBookedSlots = availability.timeSlots.some(slot => slot.isBooked);
    
    if (hasBookedSlots) {
      return res.status(400).json({ 
        message: 'Cannot delete availability with booked appointments' 
      });
    }

    await Availability.findByIdAndDelete(availabilityId);

    res.status(200).json({
      message: 'Availability deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ 
      message: 'Error deleting availability', 
      error: error.message 
    });
  }
};

// Update specific time slots
export const updateTimeSlots = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    const { timeSlots } = req.body;
    const doctorId = req.user.id;

    const availability = await Availability.findOne({
      _id: availabilityId,
      doctorId: doctorId
    });

    if (!availability) {
      return res.status(404).json({ 
        message: 'Availability not found' 
      });
    }

    // Add new slots (don't remove booked ones)
    const existingSlotTimes = availability.timeSlots.map(s => s.slot);
    
    timeSlots.forEach(slot => {
      if (!existingSlotTimes.includes(slot)) {
        availability.timeSlots.push({
          slot: slot,
          isBooked: false,
          patientId: null
        });
      }
    });

    await availability.save();

    res.status(200).json({
      message: 'Time slots updated successfully',
      data: availability
    });

  } catch (error) {
    console.error('Error updating time slots:', error);
    res.status(500).json({ 
      message: 'Error updating time slots', 
      error: error.message 
    });
  }
};