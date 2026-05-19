const consultationService = require('../services/consultationService');

const submitConsultation = async (req, res, next) => {
  try {
    const result = await consultationService.submitConsultation(req.body);
    res.status(201).json({ message: 'Consultation request submitted', data: result });
  } catch (err) {
    next(err);
  }
};

const getAllConsultations = async (req, res, next) => {
  const { status } = req.query;
  try {
    const data = await consultationService.getAllConsultations({ status });
    res.json({ success: true, data });  // was: res.json(data) — missing envelope
  } catch (err) {
    next(err);
  }
};

const updateConsultationStatus = async (req, res, next) => {
  const { status, admin_notes } = req.body;
  try {
    const result = await consultationService.updateConsultationStatus(req.params.id, status, admin_notes);
    res.json({ success: true, data: result });  // was: res.json(result) — missing envelope
  } catch (err) {
    next(err);
  }
};

module.exports = { submitConsultation, getAllConsultations, updateConsultationStatus };
