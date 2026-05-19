import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Lazily initialise Stripe — only once, outside render
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key || key.includes('TEMP_REPLACE_ME') || key.includes('your_')) {
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/* ─── Inner checkout form (rendered inside <Elements>) ─────────────────────── */
const CheckoutForm = ({ course, clientSecret, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMsg('');
    setPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // avoid full-page redirect when possible
    });

    if (error) {
      setErrorMsg(error.message || 'Payment failed. Please try again.');
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        // Confirm enrollment server-side
        await api.post('/payments/stripe/confirm', {
          payment_intent_id: paymentIntent.id,
        });
        onSuccess();
      } catch (confirmErr) {
        setErrorMsg(
          confirmErr.response?.data?.message ||
            'Payment succeeded but enrollment confirmation failed. Please contact support.'
        );
        setPaying(false);
      }
    } else {
      setErrorMsg('Payment could not be completed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course summary */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-4">
        {course.thumbnail_url && (
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
          <h3 className="font-bold text-slate-900 truncate">{course.title}</h3>
          <p className="text-slate-500 text-sm mt-0.5">{course.level} · {course.duration_weeks} weeks</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-extrabold text-slate-900">
            ${Number(course.price_usd).toFixed(2)}
          </p>
          <p className="text-xs text-slate-400">USD</p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Payment Details
        </p>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || paying}
        className="w-full py-4 px-6 rounded-xl font-bold text-white text-base transition-all
          bg-[#635BFF] hover:bg-[#4f49cc] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        {paying ? (
          <>
            <LoadingSpinner size="sm" />
            Processing…
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pay ${Number(course.price_usd).toFixed(2)} Securely
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Payments secured by Stripe · 256-bit encryption
      </p>
    </form>
  );
};

/* ─── Success screen ────────────────────────────────────────────────────────── */
const SuccessScreen = ({ course }) => (
  <div className="text-center py-8 px-4">
    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-2">You're Enrolled! 🎉</h2>
    <p className="text-slate-500 mb-1">Payment confirmed for</p>
    <p className="font-semibold text-slate-800 mb-6">{course?.title}</p>
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

/* ─── Outer page wrapper ────────────────────────────────────────────────────── */
const StripeCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, courseName } = location.state || {};

  const [clientSecret, setClientSecret] = useState('');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [initError, setInitError] = useState('');

  const stripe = getStripe();

  useEffect(() => {
    // Guard: must arrive with a courseId
    if (!courseId) {
      toast.error('No course selected. Redirecting…');
      navigate('/courses');
      return;
    }

    // Guard: Stripe key not configured
    if (!stripe) {
      setInitError('International payments (Stripe) are not yet configured. Please use Razorpay or contact support.');
      setLoading(false);
      return;
    }

    // Create PaymentIntent
    api
      .post('/payments/stripe/intent', { course_id: courseId })
      .then(({ data }) => {
        const payload = data.data ?? data;
        setClientSecret(payload.clientSecret);
        // Fetch course details for display
        return api.get(`/courses/${courseId}`);
      })
      .then(({ data }) => {
        setCourse(data.data ?? data);
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to initialise payment. Please try again.';
        setInitError(msg);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#635BFF',
      colorBackground: '#ffffff',
      colorText: '#1e293b',
      colorDanger: '#ef4444',
      fontFamily: '"Inter", system-ui, sans-serif',
      borderRadius: '10px',
      spacingUnit: '5px',
    },
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center
              hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Secure Checkout</h1>
            <p className="text-slate-400 text-sm">International Payment via Stripe</p>
          </div>
          {/* Stripe badge */}
          <div className="ml-auto flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <svg className="w-4 h-4 text-[#635BFF]" viewBox="0 0 60 25" fill="currentColor">
              <path d="M0 0h60v25H0z" fill="none"/>
              <path d="M35.2 8.1c0-1.1.9-1.5 2.4-1.5 2.1 0 4.8.6 6.9 1.7V2.5C42.3.9 40.1.1 37.6.1c-5.3 0-8.9 2.8-8.9 7.4 0 7.2 9.9 6 9.9 9.1 0 1.3-1.1 1.7-2.7 1.7-2.3 0-5.3-.9-7.7-2.2v5.9c2.6 1.1 5.2 1.6 7.7 1.6 5.5 0 9.3-2.7 9.3-7.4-.1-7.8-9.9-6.3-9.9-8.9l-.1-.2zM16.3.6L11.7 0 7.2.6 0 23.7h5.6l1.4-4.1h7.4l1.4 4.1H22L16.3.6zm-8.1 14.5L11 4.7l2.8 10.4H8.2z"/>
            </svg>
            <span className="text-xs font-semibold text-slate-500">Stripe</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : initError ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Payment Unavailable</h3>
              <p className="text-slate-500 text-sm mb-6">{initError}</p>
              <button onClick={() => navigate(-1)} className="btn-secondary px-6 py-2.5">
                Go Back
              </button>
            </div>
          ) : success ? (
            <div className="p-8">
              <SuccessScreen course={course} />
            </div>
          ) : clientSecret && stripe ? (
            <div className="p-6">
              <Elements stripe={stripe} options={{ clientSecret, appearance }}>
                <CheckoutForm
                  course={course || { title: courseName || 'Course', price_usd: 0 }}
                  clientSecret={clientSecret}
                  onSuccess={() => {
                    setSuccess(true);
                    toast.success('Payment confirmed! Welcome to the course.');
                  }}
                />
              </Elements>
            </div>
          ) : null}
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
              Cards, Apple Pay &amp; Google Pay accepted
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

export default StripeCheckout;
