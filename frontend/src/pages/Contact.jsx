import { useState } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to send message. Please try again or email us directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16">
      <div className="bg-neutral-900 py-16">
        <div className="container-pad text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Contact Us</h1>
          <p className="mt-4 text-neutral-400 text-lg">Have a question? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="container-pad py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">Get in Touch</h2>
            {submitted ? (
              <div className="card p-8 text-center">
                <div className="w-14 h-14 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 text-lg">Message Sent!</h3>
                <p className="text-neutral-500 text-sm mt-2">
                  Thank you, {form.name}! We've received your message and will get back to you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="btn-secondary mt-6"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="your@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input name="subject" value={form.subject} onChange={handleChange} className="input" placeholder="What is this about?" required />
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={5} className="input resize-none" placeholder="Your message..." required />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Sending…</span>
                    : 'Send Message'
                  }
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-display font-semibold text-neutral-900">Contact Information</h2>
            {[
              { icon: '✉️', label: 'Email', value: 'hello@gurukulgerman.com' },
              { icon: '🕐', label: 'Response Time', value: 'Within 24 hours' },
              { icon: '🌍', label: 'Students From', value: 'Worldwide' },
              { icon: '💬', label: 'Languages', value: 'English & German' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-4 card">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-neutral-900 font-medium mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
