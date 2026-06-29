const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  // Handle Razorpay SDK errors — they throw plain objects like:
  // { statusCode: 401, error: { code: 'BAD_REQUEST_ERROR', description: '...' } }
  // These are NOT standard Error instances. Normalize them here as a safety net.
  const isRazorpayError = err && typeof err === 'object' && !(err instanceof Error) && err.error?.description;
  if (isRazorpayError) {
    const description = err.error.description || 'Payment gateway error';
    // Always use 502 — never propagate Razorpay's own 401 to the client
    return res.status(502).json({
      success: false,
      message: `Payment gateway error: ${description}`,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    // Pass through any semantic error code the service layer attached (e.g. TEACHER_PENDING_APPROVAL)
    errorCode: err.errorCode || undefined,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
