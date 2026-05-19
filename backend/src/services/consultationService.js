const ConsultationModel = require('../models/consultationModel');
const { sendConsultationAdminNotification } = require('./emailService');

const submitConsultation = async (data) => {
  if (!data.name || !data.email) {
    const err = new Error('Name and email are required');
    err.statusCode = 400;  // was missing — defaulted to 500
    throw err;
  }
  
  // Save to DB first — this must succeed regardless of email status
  const consultation = await ConsultationModel.create(data);

  // Fire admin notification email — non-blocking, never throws to caller
  sendConsultationAdminNotification(data).catch(() => {});

  return consultation;
};

const getAllConsultations = async ({ status }) => {
  return await ConsultationModel.findAll({ status });
};

const updateConsultationStatus = async (id, status, admin_notes) => {
  const updatedConsultation = await ConsultationModel.updateStatus(id, { status, admin_notes });
  if (!updatedConsultation) {
    const err = new Error('Consultation not found');
    err.statusCode = 404;  // was missing — defaulted to 500
    throw err;
  }
  return updatedConsultation;
};

module.exports = {
  submitConsultation,
  getAllConsultations,
  updateConsultationStatus
};
