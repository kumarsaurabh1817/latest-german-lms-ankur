import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.error || (Array.isArray(errorData?.errors) ? errorData.errors.join(', ') : 'Registration failed. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">DL</span>
            </div>
            <span className="font-display font-bold text-neutral-900 text-xl">DeutschLernen</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Create your account</h1>
          <p className="text-neutral-500 text-sm mt-2">Start learning German with live classes today</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your full name" required autoFocus />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input" placeholder="Min. 6 characters" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone (optional)</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="+91 ..." />
              </div>
              <div>
                <label className="label">Country</label>
                <input name="country" value={form.country} onChange={handleChange} className="input" placeholder="India" />
              </div>
            </div>
            <div>
              <label className="label">I am registering as a</label>
              <select name="role" value={form.role} onChange={handleChange} className="input" required>
                <option value="student">Learner (Student)</option>
                <option value="teacher">Educator (Teacher)</option>
              </select>
              {form.role === 'teacher' && (
                <p className="text-xs text-amber-600 mt-1">Educator accounts require admin approval before you can create courses.</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Creating account...</span> : 'Create Account'}
            </button>
            <p className="text-xs text-neutral-400 text-center">
              By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
