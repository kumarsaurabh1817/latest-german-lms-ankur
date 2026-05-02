const ConsultationModel = require('../models/consultationModel');

const submitConsultation = async (data) => {
  if (!data.name || !data.email) {
    throw new Error('Name and email are required');
  }
  return await ConsultationModel.create(data);
};

const getAllConsultations = async ({ status }) => {
  return await ConsultationModel.findAll({ status });
};

const updateConsultationStatus = async (id, status, admin_notes) => {
  const updatedConsultation = await ConsultationModel.updateStatus(id, { status, admin_notes });
  if (!updatedConsultation) {
    throw new Error('Consultation not found');
  }
  return updatedConsultation;
};

module.exports = {
  submitConsultation,
  getAllConsultations,
  updateConsultationStatus
};
