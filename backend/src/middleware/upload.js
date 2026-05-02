const multer = require('multer');

const storage = multer.memoryStorage();

const pdfFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(new Error('Only PDF files are allowed'));
};

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const makeUploader = (fileFilter) => multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
  uploadPdf: makeUploader(pdfFilter),
  uploadImage: makeUploader(imageFilter),
};
