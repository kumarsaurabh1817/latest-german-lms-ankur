import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { loadScript } from '../../../utils/loadScript';
import { useAuth } from '../../../context/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import logoMark from '../../../assets/imagelogo.jpeg';

/* ─── helpers ───────────────────────────────────────────────────────────────── */

/** Check that the key looks like a real Razorpay publishable key. */
const isValidRzpKey = (key) =>
  key &&
  !key.includes('TEMP_REPLACE_ME') &&
  !key.includes('your_') &&
  (key.startsWith('rzp_test_') || key.startsWith('rzp_live_'));

/* ─── Success screen ────────────────────────────────────────────────────────── */
const SuccessScreen = ({ course, paymentId, orderId }) => (
  <div className="text-center py-8 px-4">
    {/* Animated checkmark */}
    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 animate-bounce-once">
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-1">You're Enrolled! 🎉</h2>
    <p className="text-slate-500 mb-1">Payment confirmed for</p>
    <p className="font-semibold text-slate-800 mb-4">{course?.title}</p>

    {/* Payment receipt */}
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Receipt</p>
      {paymentId && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Payment ID</span>
          <span className="font-mono font-medium text-slate-800 text-xs">{paymentId}</span>
        </div>
      )}
      {orderId && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Order ID</span>
          <span className="font-mono font-medium text-slate-800 text-xs">{orderId}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Status</span>
        <span className="font-semibold text-green-600">Completed</span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/dashboard/student" className="btn-primary px-8 py-3">
        Go to My Dashboard
      </Link>
      <Link to="/courses" className="btn-secondary px-8 py-3">
        Browse More Courses
      </Link>
    </div>
  </div>
);

/* ─── Not-configured error screen ───────────────────────────────────────────── */
const ConfigErrorScreen = ({ message, onBack }) => (
  <div className="p-8 text-center">
    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
      <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-bold text-slate-900 mb-2">Payment Unavailable</h3>
    <p className="text-slate-500 text-sm mb-6">{message}</p>
    <button onClick={onBack} className="btn-secondary px-6 py-2.5">
      Go Back
    </button>
  </div>
);

/* ─── Main Razorpay Checkout Page ───────────────────────────────────────────── */
const RazorpayCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { courseId, courseName } = location.state || {};

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initError, setInitError] = useState('');

  // Captured after successful payment — shown in the receipt
  const [receiptPaymentId, setReceiptPaymentId] = useState('');
  const [receiptOrderId, setReceiptOrderId] = useState('');

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const razorpayConfigured = isValidRzpKey(razorpayKeyId);

  useEffect(() => {
    if (!courseId) {
      toast.error('No course selected. Redirecting…');
      navigate('/courses');
      return;
    }

    if (!razorpayConfigured) {
      setInitError(
        'Indian payments (Razorpay) are not yet configured on this platform. ' +
          'Please contact support or try an international payment via Stripe.'
      );
      setLoading(false);
      return;
    }

    api
      .get(`/courses/${courseId}`)
      .then(({ data }) => setCourse(data.data ?? data))
      .catch(() => setInitError('Failed to load course details. Please go back and try again.'))
      .finally(() => setLoading(false));
  }, [courseId, razorpayConfigured]);

  /**
   * Full Razorpay payment flow:
   *   1. Load Razorpay SDK from CDN
   *   2. Call /payments/razorpay/order → creates DB record + Razorpay order
   *   3. Open Razorpay checkout modal
   *   4. On success, call /payments/razorpay/verify → HMAC check + enrollment
   */
  const handlePay = useCallback(async () => {
    if (!course || !user || paying) return;
    setPaying(true);

    try {
      // Step 1 — Load Razorpay checkout SDK
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection and try again.');
        setPaying(false);
        return;
      }

      // Step 2 — Create Razorpay order on server
      const { data: orderRes } = await api.post('/payments/razorpay/order', {
        course_id: courseId,
      });
      const orderData = orderRes.data ?? orderRes;

      // Step 3 — Open Razorpay checkout modal
      const options = {
        /**
         * We use VITE_RAZORPAY_KEY_ID (client env) as the primary key source.
         * The server returns the same key inside orderData.key as a fallback
         * (it is a publishable key — safe to transmit over API).
         * NEVER expose the KEY_SECRET to the client.
         */
        key: razorpayKeyId || orderData.key,
        amount: orderData.amount,      // amount in paise (INR × 100)
        currency: orderData.currency,  // 'INR'
        name: 'Gurukul German',
        description: course.title,
        image: logoMark,
        order_id: orderData.orderId,

        /**
         * handler — called by Razorpay after payment is captured.
         * response contains:
         *   - razorpay_order_id   (same as orderData.orderId)
         *   - razorpay_payment_id (new, issued by gateway)
         *   - razorpay_signature  (HMAC for server-side verification)
         *
         * IMPORTANT: We ONLY pass gateway-issued IDs to the verify endpoint.
         * We never include client-derived values (price, course_id) — the
         * server looks those up from the DB using razorpay_order_id.
         */
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Capture IDs for the receipt screen
            setReceiptPaymentId(response.razorpay_payment_id);
            setReceiptOrderId(response.razorpay_order_id);

            setPaying(false);
            setSuccess(true);
            toast.success('Payment verified! Welcome to the course. 🎉');
          } catch (verifyErr) {
            setPaying(false);
            toast.error(
              verifyErr.response?.data?.message ||
                'Payment verification failed. Please contact support with your payment ID: ' +
                  response.razorpay_payment_id
            );
          }
        },

        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        notes: {
          course_id: String(courseId),
        },
        theme: {
          color: '#3395FF', // Razorpay brand blue — matches checkout SDK UI
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast('Payment cancelled. You can try again anytime.', { icon: 'ℹ️' });
          },
          escape: true,
          animation: true,
          confirm_close: true, // Ask for confirmation before closing modal
        },
      };

      const rzp = new window.Razorpay(options);

      /**
       * payment.failed — fired when the card/UPI/bank explicitly rejects.
       * This is distinct from modal dismiss (user closed without paying).
       */
      rzp.on('payment.failed', (response) => {
        setPaying(false);
        const reason =
          response.error?.description ||
          response.error?.reason ||
          'Payment failed. Please try again or use a different payment method.';
        toast.error(reason);
        console.error('[Razorpay] payment.failed:', response.error);
      });

      rzp.open();
      // Note: setPaying(false) is intentionally NOT called here — it is
      // handled either by modal.ondismiss, handler (success), or payment.failed.
    } catch (err) {
      setPaying(false);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Could not initiate payment. Please try again.'
      );
    }
  }, [course, user, paying, courseId, razorpayKeyId]);

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center
              hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Secure Checkout</h1>
            <p className="text-slate-400 text-sm">Indian Payment via Razorpay</p>
          </div>
          {/* Razorpay badge */}
          <div className="ml-auto flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <svg className="w-4 h-4 text-[#3395FF]" viewBox="0 0 40 40" fill="currentColor">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0z" fill="#3395FF"/>
              <path d="M27.5 14.5l-3.5 11h-3l2-6.5H17l1.5-4.5h9z" fill="#fff"/>
            </svg>
            <span className="text-xs font-semibold text-slate-500">Razorpay</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : initError ? (
            <ConfigErrorScreen message={initError} onBack={() => navigate(-1)} />
          ) : success ? (
            <div className="p-8">
              <SuccessScreen
                course={course}
                paymentId={receiptPaymentId}
                orderId={receiptOrderId}
              />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Course summary */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-4">
                {course?.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                    Enrolling in
                  </p>
                  <h3 className="font-bold text-slate-900 truncate">
                    {course?.title || courseName}
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {course?.level} · {course?.duration_weeks} weeks
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-extrabold text-slate-900">
                    ₹{Number(course?.price_inr || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-400">INR</p>
                </div>
              </div>

              {/* What you get */}
              {course?.features?.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    What's included
                  </p>
                  <ul className="space-y-1.5">
                    {course.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={paying}
                id="razorpay-pay-btn"
                className="w-full py-4 px-6 rounded-xl font-bold text-white text-base transition-all
                  bg-[#3395FF] hover:bg-[#2084ea] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
              >
                {paying ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Opening Payment…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay ₹{Number(course?.price_inr || 0).toLocaleString('en-IN')} Securely
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Payments secured by Razorpay · PCI DSS Compliant · 256-bit SSL
              </p>
            </div>
          )}
        </div>

        {/* Trust badges */}
        {!loading && !initError && !success && (
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              SSL Secured
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Cards, UPI, Net Banking &amp; Wallets
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              PCI DSS Compliant
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckout;
