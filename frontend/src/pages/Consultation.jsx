import { useState } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const TIME_SLOTS = [
  'Morning (9am – 12pm IST)',
  'Afternoon (12pm – 4pm IST)',
  'Evening (4pm – 8pm IST)',
  'Night (8pm – 10pm IST)',
];

const Consultation = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', country: '', preferred_time: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/consultations', form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16">
      <div className="bg-neutral-900 py-16">
        <div className="container-pad text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Book a Free Consultation</h1>
          <p className="mt-4 text-neutral-400 text-lg max-w-2xl mx-auto">
            Not sure which level is right for you? Book a one-on-one session with our instructor. Free, no obligation.
          </p>
        </div>
      </div>

      <div className="container-pad py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            {submitted ? (
              <div className="card p-10 text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display font-semibold text-neutral-900 text-2xl">Request Submitted!</h3>
                <p className="text-neutral-500 mt-3 leading-relaxed">
                  Thank you, {form.name}! We've received your consultation request and will contact you at <strong>{form.email}</strong> within 24 hours to schedule your session.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', country: '', preferred_time: '', message: '' }); }}
                  className="btn-secondary mt-8"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Phone Number</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input name="country" value={form.country} onChange={handleChange} className="input" placeholder="India" />
                  </div>
                </div>
                <div>
                  <label className="label">Preferred Time Slot</label>
                  <select name="preferred_time" value={form.preferred_time} onChange={handleChange} className="input">
                    <option value="">Select a time slot</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Your Learning Goal or Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell us about your current German level and what you want to achieve..."
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Submitting...</span> : 'Book Free Consultation'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-display font-semibold text-neutral-900">What to Expect</h2>
            <div className="space-y-5">
              {[
                { icon: '🎯', title: 'Level Assessment', desc: 'We\'ll assess your current German knowledge through a short conversation.' },
                { icon: '📋', title: 'Course Recommendation', desc: 'Based on your level and goals, we\'ll recommend the perfect course for you.' },
                { icon: '❓', title: 'Q&A Session', desc: 'Ask any questions about our courses, teaching method, schedules, and pricing.' },
                { icon: '🤝', title: 'No Pressure', desc: 'This is a completely free, no-obligation consultation. Enroll only if you\'re ready.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 card">
                  <div className="text-2xl flex-shrink-0">{icon}</div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{title}</h4>
                    <p className="text-neutral-500 text-sm mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
