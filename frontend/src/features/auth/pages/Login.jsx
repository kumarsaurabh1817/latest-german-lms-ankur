import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import logoMark from '../../../assets/imagelogo.jpeg';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Separate state for the teacher-pending banner so it uses a different style
  const [pendingMessage, setPendingMessage] = useState(
    location.state?.pendingApproval
      ? 'Your educator account has been created successfully! It is currently pending admin approval. You will be able to sign in once your account is reviewed.'
      : ''
  );

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingMessage('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const errorData = err.response?.data;
      // Show a distinct amber info banner for the teacher-pending-approval case
      if (errorData?.errorCode === 'TEACHER_PENDING_APPROVAL') {
        setPendingMessage(errorData.message);
      } else {
        const errorMessage = errorData?.message || errorData?.error || (Array.isArray(errorData?.errors) ? errorData.errors[0]?.message : 'Invalid email or password');
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img
              src={logoMark}
              alt="Gurukul German logo"
              className="w-12 h-12 object-contain"
            />
            <span className="font-display font-bold text-neutral-900 text-xl sm:text-2xl">
              Gurukul German
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Welcome back</h1>
          <p className="text-neutral-500 text-sm mt-2">Sign in to access your courses and classes</p>
        </div>

        <div className="card p-8">
          {/* Amber info banner for pending teacher approval */}
          {pendingMessage && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm flex gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{pendingMessage}</span>
            </div>
          )}
          {/* Red error banner for actual errors */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="your@email.com" required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input" placeholder="Your password" required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Signing in...</span> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">Create one for free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
