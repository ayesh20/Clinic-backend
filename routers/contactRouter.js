import express from 'express';
import { createContact, listContacts } from '../controllers/contactController.js';

const contactRouter = express.Router();

contactRouter.post('/', createContact);
contactRouter.get('/', listContacts);

export default contactRouter;
