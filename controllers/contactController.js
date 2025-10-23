// controllers/contactController.js
import Contact from '../models/contact.js';

export const createContact = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, topic, message, termsAccepted } = req.body || {};

    if (!firstName || !lastName || !email || !message || termsAccepted !== true) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, email, message and accept terms.'
      });
    }

    const doc = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      topic: topic || 'general',
      message,
      termsAccepted: true,
      meta: {
        ip: (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '').trim(),
        userAgent: req.get('user-agent') || ''
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Thanks! Your message has been received.',
      data: { id: doc._id }
    });
  } catch (err) {
    next(err);
  }
};

export const listContacts = async (req, res, next) => {
  try {
    const items = await Contact.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};