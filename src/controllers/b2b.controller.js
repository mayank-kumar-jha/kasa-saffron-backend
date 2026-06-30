import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';
import { sendB2BEnquiryEmail, sendInquiryReceivedEmail } from '../utils/email.js';

const submitB2BLead = asyncHandler(async (req, res) => {
  const { companyName, contactPerson, phone, email, businessType, estimatedVolume, notes } = req.body;

  const lead = await prisma.b2BLead.create({
    data: { companyName, contactPerson, phone, email, businessType, estimatedVolume, notes },
  });

  // Send email notification to admin
  sendB2BEnquiryEmail(lead);
  
  // Send confirmation to the user
  if (email) {
    sendInquiryReceivedEmail(email, contactPerson || companyName);
  }

  return res.status(201).json(new ApiResponse(201, lead, 'B2B Lead submitted successfully'));
});

const getB2BLeads = asyncHandler(async (req, res) => {
  const leads = await prisma.b2BLead.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(new ApiResponse(200, leads, 'Leads fetched successfully'));
});

const updateB2BLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const lead = await prisma.b2BLead.update({
    where: { id },
    data: { status },
  });

  return res.status(200).json(new ApiResponse(200, lead, 'Lead status updated successfully'));
});

export { submitB2BLead, getB2BLeads, updateB2BLeadStatus };
