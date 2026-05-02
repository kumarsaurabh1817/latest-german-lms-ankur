import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const tabs = ['My Courses', 'Upcoming Classes', 'Payment History'];

const formatDate = (dt) =>
  new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('My Courses');
  const [enrollments, setEnrollments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/my'),
      api.get('/lessons/upcoming'),
      api.get('/payments/my'),
    ])
      .then(([e, l, p]) => {
        setEnrollments(e.data?.data ?? e.data);
        setLessons(l.data?.data ?? l.data);
        setPayments(p.data?.data ?? p.data);
      })
      .catch(() => {
        toast.error('Failed to load dashboard data. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="container-pad py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">Student Dashboard</h1>
            <p className="text-neutral-500 text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/courses" className="btn-secondary text-sm">Browse Courses</Link>
            <button onClick={logout} className="btn-ghost text-sm">Logout</button>
          </div>
        </div>
        <div className="container-pad">
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-pad py-8">
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {activeTab === 'My Courses' && (
              <div>
                {enrollments.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-neutral-400 text-lg">You haven't enrolled in any courses yet.</p>
                    <Link to="/courses" className="btn-primary mt-5">Browse Courses</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {enrollments.map((e) => (
                      <div key={e.id} className="card p-6 flex flex-col gap-4 hover:shadow-card-hover transition-all h-full">
                        <div className="flex items-start justify-between gap-3">
                          <span className="badge badge-level text-xs px-3 py-1">{e.level}</span>
                          <span className="text-xs text-neutral-400">{e.duration_weeks}w</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-neutral-900">{e.title}</h4>
                          {e.teacher_name && (
                            <p className="text-neutral-500 text-sm">by {e.teacher_name}</p>
                          )}
                        </div>
                        <div className="pt-3 border-t border-neutral-100 text-xs text-neutral-400">
                          Enrolled {new Date(e.enrolled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </div>
                        <div className="pt-1 mt-auto">
                          <Link to={`/courses/${e.course_id}`} className="btn-primary w-full text-center block text-sm py-2.5">
                            Go to Course / Classes
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Upcoming Classes' && (
              <div>
                {lessons.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-neutral-400 text-lg">No upcoming classes scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="card p-5 flex items-center gap-5">
                        <div className="flex-shrink-0 w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center">
                          <span className="text-primary-600 text-2xl">📹</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-level text-xs">{lesson.level}</span>
                            <span className="text-neutral-400 text-xs">{lesson.course_title}</span>
                          </div>
                          <h4 className="font-semibold text-neutral-900 truncate">{lesson.title}</h4>
                          <p className="text-neutral-500 text-sm">{formatDate(lesson.scheduled_at)} · {lesson.duration_minutes} min</p>
                        </div>
                        {lesson.zoom_link ? (
                          <a
                            href={lesson.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-sm py-2 px-4 flex-shrink-0"
                          >
                            Join Class
                          </a>
                        ) : (
                          <span className="text-neutral-300 text-sm flex-shrink-0">Link pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Payment History' && (
              <div>
                {payments.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-neutral-400 text-lg">No payment history found.</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          {['Course', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-50">
                            <td className="px-5 py-4">
                              <p className="font-medium text-neutral-900">{p.course_title}</p>
                              <p className="text-neutral-400 text-xs">{p.level}</p>
                            </td>
                            <td className="px-5 py-4 font-medium text-neutral-900">
                              {p.currency === 'INR' ? '₹' : '$'}{Number(p.amount).toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-neutral-600 capitalize">{p.payment_method}</td>
                            <td className="px-5 py-4">
                              <span className={`badge text-xs ${
                                p.status === 'completed' ? 'bg-secondary-100 text-secondary-700' :
                                p.status === 'pending' ? 'bg-accent-100 text-accent-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-neutral-500 text-xs">
                              {new Date(p.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
