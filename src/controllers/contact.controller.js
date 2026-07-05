import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';
import { sendInquiryReceivedEmail } from '../utils/email.js';

const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const contact = await prisma.contactRequest.create({
    data: { name, email, subject, message },
  });

  if (email) {
    await sendInquiryReceivedEmail(email, name);
  }

  return res.status(201).json(new ApiResponse(201, contact, 'Contact request submitted successfully'));
});

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await prisma.contactRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(new ApiResponse(200, contacts, 'Contacts fetched successfully'));
});

const updateContactStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status against allowed enum values
  const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const contact = await prisma.contactRequest.update({
    where: { id },
    data: { status },
  });

  return res.status(200).json(new ApiResponse(200, contact, 'Contact status updated successfully'));
});

export { submitContact, getContacts, updateContactStatus };
