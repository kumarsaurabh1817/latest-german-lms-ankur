const { Readable } = require('stream');
const cloudinary = require('../utils/cloudinary');

const streamUpload = (buffer, options) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  Readable.from(buffer).pipe(stream);
});

exports.uploadThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const folder = `${process.env.CLOUDINARY_FOLDER || 'lms'}/thumbnails`;
    const uploadRes = await streamUpload(req.file.buffer, {
      folder,
      resource_type: 'image',
      public_id: `${Date.now()}-${req.user.id}`,
    });

    res.status(201).json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    next(err);
  }
};
