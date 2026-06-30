import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';

const tabs = ['Overview', 'Courses', 'Users', 'Consultations', 'Payments', 'Enrollments'];

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtCurrency = (amount, currency = 'INR') => {
  if (amount == null) return '—';
  const num = Number(amount);
  if (currency === 'USD') return `$${num.toFixed(2)}`;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const statusColors = {
  pending:   'bg-amber-100 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  failed:    'bg-red-100 text-red-700 ring-red-200',
  refunded:  'bg-neutral-100 text-neutral-600 ring-neutral-200',
};

const gatewayColors = {
  razorpay: 'bg-blue-100 text-blue-700 ring-blue-200',
  stripe:   'bg-violet-100 text-violet-700 ring-violet-200',
};

// ─── Component ──────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Payments filter state ──
  const [pmtGateway, setPmtGateway] = useState('');
  const [pmtStatus, setPmtStatus] = useState('');

  // ── Enrollments UI state ──
  const [enrollSearch, setEnrollSearch] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '' });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/admin/courses'),
      api.get('/consultations'),
      api.get('/payments'),
      api.get('/enrollments'),
    ])
      .then(([u, c, co, p, e]) => {
        setUsers(u.data?.data ?? u.data ?? []);
        setCourses(c.data?.data ?? c.data ?? []);
        setConsultations(co.data?.data ?? co.data ?? []);
        setPayments(p.data?.data ?? p.data ?? []);
        setEnrollments(e.data?.data ?? e.data ?? []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateConsultation = async (id, status) => {
    try {
      const { data } = await api.put(`/consultations/${id}`, { status });
      // Consultation PUT returns the updated row (plain object, not wrapped)
      const updated = data?.data ?? data;
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {}
  };

  const updateTeacherApproval = async (id, approved) => {
    try {
      const { data } = await api.put(`/users/${id}/approve-teacher`, { approved });
      // userController now returns {success, data: user} — unwrap one level
      const u = data?.data ?? data;
      const nextApproved = typeof u?.is_teacher_approved === 'boolean' ? u.is_teacher_approved : Boolean(approved);
      setUsers((prev) => prev.map((usr) => (usr.id === id ? { ...usr, is_teacher_approved: nextApproved } : usr)));
    } catch {}
  };

  // ── Enrollment handlers ──
  const handleUnenroll = async (student_id, course_id) => {
    if (!window.confirm('Remove this student from the course?')) return;
    try {
      await api.delete('/enrollments/admin', { data: { student_id, course_id } });
      setEnrollments((prev) => prev.filter((e) => !(e.student_id === student_id && e.course_id === course_id)));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to unenroll student');
    }
  };

  const handleAdminEnroll = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    setEnrollError('');
    try {
      const { data } = await api.post('/enrollments/admin', enrollForm);
      // Rebuild the enrollment row with student/course names from current state
      const student = users.find((u) => String(u.id) === String(enrollForm.student_id));
      const course  = courses.find((c) => String(c.id) === String(enrollForm.course_id));
      const raw = data?.data ?? data;
      const newRow = {
        id: raw?.id ?? `${enrollForm.student_id}-${enrollForm.course_id}-${Date.now()}`,
        enrolled_at: raw?.enrolled_at ?? new Date().toISOString(),
        student_id:    enrollForm.student_id,
        course_id:     enrollForm.course_id,
        student_name:  student?.name  ?? '—',
        student_email: student?.email ?? '—',
        course_title:  course?.title  ?? '—',
        course_level:  course?.level  ?? '—',
      };
      // Upsert into local state: remove stale row for this student+course (if any),
      // then prepend the fresh one — mirrors the DB UPSERT so no duplicates appear.
      setEnrollments((prev) => {
        const deduped = prev.filter(
          (e) =>
            !(String(e.student_id) === String(enrollForm.student_id) &&
              String(e.course_id)  === String(enrollForm.course_id))
        );
        return [newRow, ...deduped];
      });

      setShowEnrollModal(false);
      setEnrollForm({ student_id: '', course_id: '' });
      setStudentSearch('');
      setCourseSearch('');
      setEnrollError('');
    } catch (err) {
      setEnrollError(err?.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // ── Derived stats ──
  const stats = [
    { label: 'Total Users', value: users.length, sub: `${users.filter((u) => u.role === 'student').length} students` },
    { label: 'Active Courses', value: courses.filter((c) => c.is_active).length, sub: `${courses.length} total` },
    { label: 'Consultations', value: consultations.length, sub: `${consultations.filter((c) => c.status === 'pending').length} pending` },
    { label: 'Teachers', value: users.filter((u) => u.role === 'teacher').length, sub: `${users.filter((u) => u.role === 'teacher' && u.is_teacher_approved).length} approved` },
  ];

  // ── Payments derived data ──
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalInr = completedPayments.filter((p) => p.currency === 'INR').reduce((s, p) => s + Number(p.amount), 0);
  const totalUsd = completedPayments.filter((p) => p.currency === 'USD').reduce((s, p) => s + Number(p.amount), 0);

  const filteredPayments = payments.filter((p) => {
    if (pmtGateway && p.payment_method !== pmtGateway) return false;
    if (pmtStatus && p.status !== pmtStatus) return false;
    return true;
  });

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-pad py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">Admin Dashboard</h1>
            <p className="text-neutral-500 text-sm mt-1">Platform overview — {user?.name}</p>
          </div>
          <button onClick={logout} className="btn-ghost text-sm">Logout</button>
        </div>
        <div className="container-pad">
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab}
                {tab === 'Payments' && payments.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">
                    {payments.length}
                  </span>
                )}
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
            {/* ══ Overview Tab ══════════════════════════════════════════════ */}
            {activeTab === 'Overview' && (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  {stats.map(({ label, value, sub }) => (
                    <div key={label} className="card p-5">
                      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">{label}</p>
                      <p className="text-3xl font-display font-bold text-neutral-900 mt-1">{value}</p>
                      <p className="text-neutral-400 text-xs mt-1">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card p-5">
                    <h3 className="font-semibold text-neutral-900 mb-4">Recent Consultations</h3>
                    {consultations.slice(0, 5).length === 0 ? (
                      <p className="text-neutral-400 text-sm">No consultations yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {consultations.slice(0, 5).map((c) => (
                          <div key={c.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                            <div>
                              <p className="font-medium text-neutral-900 text-sm">{c.name}</p>
                              <p className="text-neutral-400 text-xs">{c.email} · {c.country}</p>
                            </div>
                            <span className={`badge text-xs ${
                              c.status === 'pending' ? 'bg-accent-100 text-accent-700' :
                              c.status === 'scheduled' ? 'bg-primary-100 text-primary-700' :
                              c.status === 'completed' ? 'bg-secondary-100 text-secondary-700' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="card p-5">
                    <h3 className="font-semibold text-neutral-900 mb-4">User Roles</h3>
                    <div className="space-y-3">
                      {['student', 'teacher', 'admin'].map((role) => {
                        const count = users.filter((u) => u.role === role).length;
                        const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                        return (
                          <div key={role}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize font-medium text-neutral-700">{role}s</span>
                              <span className="text-neutral-500">{count}</span>
                            </div>
                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ Users Tab ═════════════════════════════════════════════════ */}
            {activeTab === 'Users' && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">All Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        {['Name', 'Email', 'Role', 'Approval', 'Country', 'Joined', 'Actions'].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-neutral-900">{u.name}</td>
                          <td className="px-5 py-3.5 text-neutral-500 text-xs">{u.email}</td>
                          <td className="px-5 py-3.5">
                            {u.role === 'admin' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-200">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/></svg>
                                Admin
                              </span>
                            )}
                            {u.role === 'teacher' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 ring-1 ring-primary-200">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>
                                Teacher
                              </span>
                            )}
                            {u.role === 'student' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-700 ring-1 ring-secondary-200">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                                Student
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {u.role === 'teacher' ? (
                              u.is_teacher_approved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                                  Pending
                                </span>
                              )
                            ) : (
                              <span className="text-neutral-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-neutral-500 text-xs">{u.country || '—'}</td>
                          <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </td>
                          <td className="px-5 py-3.5">
                            {u.role === 'teacher' ? (
                              <button
                                onClick={() => updateTeacherApproval(u.id, !u.is_teacher_approved)}
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 shadow-sm whitespace-nowrap ${
                                  u.is_teacher_approved
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                }`}
                              >
                                {u.is_teacher_approved ? (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                    Revoke
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                    Approve
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-neutral-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ Courses Tab ═══════════════════════════════════════════════ */}
            {activeTab === 'Courses' && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">All Courses ({courses.length})</h3>
                </div>
                {courses.length === 0 ? (
                  <div className="p-10 text-center text-neutral-400">No courses available.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          {['Title', 'Level', 'Teacher', 'Students', 'Status', 'Created'].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-neutral-50">
                            <td className="px-5 py-3.5 font-medium text-neutral-900">{course.title}</td>
                            <td className="px-5 py-3.5 text-neutral-600 whitespace-nowrap">{course.level}</td>
                            <td className="px-5 py-3.5 text-neutral-600">{course.teacher_name || 'Unassigned'}</td>
                            <td className="px-5 py-3.5 text-neutral-600">{course.enrolled_count || 0}</td>
                            <td className="px-5 py-3.5">
                              <span className={`badge text-xs ${course.is_active ? 'bg-secondary-100 text-secondary-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                {course.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                              {new Date(course.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ Consultations Tab ═════════════════════════════════════════ */}
            {activeTab === 'Consultations' && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">Consultation Requests ({consultations.length})</h3>
                </div>
                {consultations.length === 0 ? (
                  <div className="p-10 text-center text-neutral-400">No consultation requests yet.</div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {consultations.map((c) => (
                      <div key={c.id} className="p-5 hover:bg-neutral-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-neutral-900">{c.name}</p>
                              <span className={`badge text-xs ${
                                c.status === 'pending' ? 'bg-accent-100 text-accent-700' :
                                c.status === 'scheduled' ? 'bg-primary-100 text-primary-700' :
                                c.status === 'completed' ? 'bg-secondary-100 text-secondary-700' :
                                'bg-neutral-100 text-neutral-600'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            <p className="text-neutral-500 text-sm">{c.email} · {c.phone} · {c.country}</p>
                            {c.preferred_time && (
                              <p className="text-neutral-400 text-xs mt-1">Preferred: {c.preferred_time}</p>
                            )}
                            {c.message && (
                              <p className="text-neutral-600 text-sm mt-2 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                                {c.message}
                              </p>
                            )}
                          </div>
                          <select
                            value={c.status}
                            onChange={(e) => updateConsultation(c.id, e.target.value)}
                            className="text-xs border border-neutral-300 rounded-lg px-2 py-1.5 text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
                          >
                            {['pending', 'scheduled', 'completed', 'cancelled'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-neutral-400 text-xs mt-2">
                          Submitted {new Date(c.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ Payments Tab ══════════════════════════════════════════════ */}
            {activeTab === 'Payments' && (
              <div className="space-y-6">

                {/* ── Revenue summary cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="card p-5">
                    <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Revenue (INR)</p>
                    <p className="text-2xl font-display font-bold text-neutral-900 mt-1">
                      ₹{totalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-neutral-400 text-xs mt-1">
                      {completedPayments.filter((p) => p.currency === 'INR').length} completed
                    </p>
                  </div>
                  <div className="card p-5">
                    <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Revenue (USD)</p>
                    <p className="text-2xl font-display font-bold text-neutral-900 mt-1">
                      ${totalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-neutral-400 text-xs mt-1">
                      {completedPayments.filter((p) => p.currency === 'USD').length} completed
                    </p>
                  </div>
                  <div className="card p-5">
                    <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-display font-bold text-amber-600 mt-1">
                      {payments.filter((p) => p.status === 'pending').length}
                    </p>
                    <p className="text-neutral-400 text-xs mt-1">awaiting confirmation</p>
                  </div>
                  <div className="card p-5">
                    <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Failed / Other</p>
                    <p className="text-2xl font-display font-bold text-red-500 mt-1">
                      {payments.filter((p) => p.status !== 'completed' && p.status !== 'pending').length}
                    </p>
                    <p className="text-neutral-400 text-xs mt-1">failed or refunded</p>
                  </div>
                </div>

                {/* ── Gateway breakdown bar ── */}
                {payments.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-semibold text-neutral-900 mb-4 text-sm">Gateway Breakdown</h3>
                    <div className="space-y-3">
                      {['razorpay', 'stripe'].map((gw) => {
                        const count = payments.filter((p) => p.payment_method === gw).length;
                        const pct = payments.length ? Math.round((count / payments.length) * 100) : 0;
                        const gwRevenue = completedPayments
                          .filter((p) => p.payment_method === gw)
                          .reduce((s, p) => s + Number(p.amount), 0);
                        const gwCurrency = gw === 'razorpay' ? '₹' : '$';
                        return (
                          <div key={gw}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize font-medium text-neutral-700 flex items-center gap-1.5">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ring-1 ${gatewayColors[gw] || 'bg-neutral-100 text-neutral-600 ring-neutral-200'}`}>
                                  {gw}
                                </span>
                                <span className="text-neutral-500 text-xs">{count} transaction{count !== 1 ? 's' : ''}</span>
                              </span>
                              <span className="text-neutral-600 font-medium text-xs">{gwCurrency}{gwRevenue.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${gw === 'razorpay' ? 'bg-blue-500' : 'bg-violet-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Transactions table with filters ── */}
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-neutral-900">
                      All Transactions
                      <span className="ml-2 text-sm font-normal text-neutral-400">
                        ({filteredPayments.length}{filteredPayments.length !== payments.length ? ` of ${payments.length}` : ''})
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Gateway filter */}
                      <select
                        value={pmtGateway}
                        onChange={(e) => setPmtGateway(e.target.value)}
                        className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      >
                        <option value="">All Gateways</option>
                        <option value="razorpay">Razorpay</option>
                        <option value="stripe">Stripe</option>
                      </select>
                      {/* Status filter */}
                      <select
                        value={pmtStatus}
                        onChange={(e) => setPmtStatus(e.target.value)}
                        className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      {(pmtGateway || pmtStatus) && (
                        <button
                          onClick={() => { setPmtGateway(''); setPmtStatus(''); }}
                          className="text-xs text-neutral-500 hover:text-neutral-800 underline transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <div className="p-10 text-center text-neutral-400">
                      {payments.length === 0 ? 'No payments on the platform yet.' : 'No payments match the selected filters.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            {['Student', 'Course', 'Gateway', 'Amount', 'Status', 'Date'].map((h) => (
                              <th key={h} className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {filteredPayments.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                              {/* Student */}
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-neutral-900 leading-none">{p.student_name}</p>
                                <p className="text-neutral-400 text-xs mt-0.5">{p.student_email}</p>
                              </td>
                              {/* Course */}
                              <td className="px-5 py-3.5">
                                <p className="text-neutral-700 font-medium leading-none">{p.course_title}</p>
                                <p className="text-neutral-400 text-xs mt-0.5">{p.course_level}</p>
                              </td>
                              {/* Gateway */}
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${gatewayColors[p.payment_method] || 'bg-neutral-100 text-neutral-600 ring-neutral-200'}`}>
                                  {p.payment_method === 'razorpay' ? (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/></svg>
                                  ) : (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                                  )}
                                  {p.payment_method}
                                </span>
                              </td>
                              {/* Amount */}
                              <td className="px-5 py-3.5 font-semibold text-neutral-900 whitespace-nowrap">
                                {fmtCurrency(p.amount, p.currency)}
                              </td>
                              {/* Status */}
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${statusColors[p.status] || 'bg-neutral-100 text-neutral-600 ring-neutral-200'}`}>
                                  {p.status === 'completed' && (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                  )}
                                  {p.status === 'pending' && (
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                                  )}
                                  {p.status}
                                </span>
                              </td>
                              {/* Date */}
                              <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                                {new Date(p.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ══ Enrollments Tab ═══════════════════════════════════════════ */}
            {activeTab === 'Enrollments' && (() => {
              const students = users.filter((u) => u.role === 'student');
              const activeCourses = courses.filter((c) => c.is_active);
              const filtered = enrollments.filter((e) => {
                if (!enrollSearch.trim()) return true;
                const q = enrollSearch.toLowerCase();
                return (
                  e.student_name?.toLowerCase().includes(q) ||
                  e.student_email?.toLowerCase().includes(q) ||
                  e.course_title?.toLowerCase().includes(q)
                );
              });

              return (
                <div className="space-y-6">

                  {/* ── Summary cards ── */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="card p-5">
                      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Total Enrollments</p>
                      <p className="text-3xl font-display font-bold text-neutral-900 mt-1">{enrollments.length}</p>
                      <p className="text-neutral-400 text-xs mt-1">active across all courses</p>
                    </div>
                    <div className="card p-5">
                      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Unique Students</p>
                      <p className="text-3xl font-display font-bold text-neutral-900 mt-1">
                        {new Set(enrollments.map((e) => e.student_id)).size}
                      </p>
                      <p className="text-neutral-400 text-xs mt-1">enrolled at least once</p>
                    </div>
                    <div className="card p-5">
                      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">Avg. per Course</p>
                      <p className="text-3xl font-display font-bold text-neutral-900 mt-1">
                        {activeCourses.length > 0
                          ? (enrollments.length / activeCourses.length).toFixed(1)
                          : '—'}
                      </p>
                      <p className="text-neutral-400 text-xs mt-1">across {activeCourses.length} active courses</p>
                    </div>
                  </div>

                  {/* ── Table card ── */}
                  <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-neutral-900">
                        All Enrollments
                        <span className="ml-2 text-sm font-normal text-neutral-400">
                          ({filtered.length}{filtered.length !== enrollments.length ? ` of ${enrollments.length}` : ''})
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          <input
                            type="text"
                            placeholder="Search student or course…"
                            value={enrollSearch}
                            onChange={(e) => setEnrollSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white w-52"
                          />
                        </div>
                        {/* Manual enroll button */}
                        <button
                          onClick={() => { setShowEnrollModal(true); setEnrollError(''); }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                          Manual Enroll
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    {filtered.length === 0 ? (
                      <div className="p-10 text-center text-neutral-400">
                        {enrollments.length === 0 ? 'No enrollments yet.' : 'No results match your search.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                              {['Student', 'Course', 'Enrolled On', 'Actions'].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {filtered.map((e) => (
                              <tr key={e.id ?? `${e.student_id}-${e.course_id}`} className="hover:bg-neutral-50 transition-colors">
                                {/* Student */}
                                <td className="px-5 py-3.5">
                                  <p className="font-medium text-neutral-900 leading-none">{e.student_name}</p>
                                  <p className="text-neutral-400 text-xs mt-0.5">{e.student_email}</p>
                                </td>
                                {/* Course */}
                                <td className="px-5 py-3.5">
                                  <p className="text-neutral-700 font-medium leading-none">{e.course_title}</p>
                                  <p className="text-neutral-400 text-xs mt-0.5">{e.course_level}</p>
                                </td>
                                {/* Date */}
                                <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                                  {e.enrolled_at
                                    ? new Date(e.enrolled_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                                    : '—'}
                                </td>
                                {/* Unenroll */}
                                <td className="px-5 py-3.5">
                                  <button
                                    onClick={() => handleUnenroll(e.student_id, e.course_id)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                    Unenroll
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>


                  {/* ── Manual Enroll Modal ── */}
                  {showEnrollModal && (() => {
                    const students = users.filter((u) => u.role === 'student');
                    const activeCourses = courses.filter((c) => c.is_active);

                    // Filtered lists based on search inputs
                    const filteredStudents = studentSearch.trim()
                      ? students.filter((s) =>
                          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.email.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                      : students;

                    const filteredCourses = courseSearch.trim()
                      ? activeCourses.filter((c) =>
                          c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                          (c.level && c.level.toLowerCase().includes(courseSearch.toLowerCase()))
                        )
                      : activeCourses;

                    // Currently selected objects
                    const selectedStudent = students.find((s) => String(s.id) === String(enrollForm.student_id));
                    const selectedCourse  = activeCourses.find((c) => String(c.id) === String(enrollForm.course_id));

                    const canSubmit = enrollForm.student_id && enrollForm.course_id && !enrolling;

                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                          {/* Header */}
                          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
                            <div>
                              <h2 className="text-lg font-display font-bold text-neutral-900">Manual Enroll</h2>
                              <p className="text-neutral-400 text-xs mt-0.5">Enroll any student without requiring payment</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setShowEnrollModal(false); setStudentSearch(''); setCourseSearch(''); setEnrollError(''); }}
                              className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-lg hover:bg-neutral-100"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                            </button>
                          </div>

                          {/* Body */}
                          <div className="overflow-y-auto px-6 py-5">
                            <form id="admin-enroll-form" onSubmit={handleAdminEnroll} className="space-y-5">

                              {/* ── Student Search ── */}
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">
                                  Student
                                </label>
                                {/* Selected student chip */}
                                {selectedStudent ? (
                                  <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl px-3 py-2.5 mb-2">
                                    <div>
                                      <p className="text-sm font-semibold text-primary-800 leading-none">{selectedStudent.name}</p>
                                      <p className="text-xs text-primary-500 mt-0.5">{selectedStudent.email}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => { setEnrollForm((f) => ({ ...f, student_id: '' })); setStudentSearch(''); }}
                                      className="text-primary-400 hover:text-primary-700 transition-colors ml-3 flex-shrink-0"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative">
                                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                      </svg>
                                      <input
                                        type="text"
                                        placeholder="Search by name or email…"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        autoComplete="off"
                                      />
                                    </div>
                                    {/* Results list */}
                                    {filteredStudents.length > 0 ? (
                                      <div className="mt-1.5 border border-neutral-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                                        {filteredStudents.slice(0, 30).map((s) => (
                                          <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                              setEnrollForm((f) => ({ ...f, student_id: s.id }));
                                              setStudentSearch('');
                                            }}
                                            className="w-full text-left px-3 py-2.5 hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-0 flex items-center gap-3"
                                          >
                                            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                              {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-neutral-900 truncate">{s.name}</p>
                                              <p className="text-xs text-neutral-400 truncate">{s.email}</p>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : studentSearch.trim() ? (
                                      <p className="text-xs text-neutral-400 mt-2 px-1">No students match "{studentSearch}"</p>
                                    ) : (
                                      <p className="text-xs text-neutral-400 mt-2 px-1">{students.length} students available — type to search</p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* ── Course Search ── */}
                              <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">
                                  Course
                                </label>
                                {/* Selected course chip */}
                                {selectedCourse ? (
                                  <div className="flex items-center justify-between bg-secondary-50 border border-secondary-200 rounded-xl px-3 py-2.5 mb-2">
                                    <div>
                                      <p className="text-sm font-semibold text-secondary-800 leading-none">{selectedCourse.title}</p>
                                      <p className="text-xs text-secondary-500 mt-0.5">{selectedCourse.level}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => { setEnrollForm((f) => ({ ...f, course_id: '' })); setCourseSearch(''); }}
                                      className="text-secondary-400 hover:text-secondary-700 transition-colors ml-3 flex-shrink-0"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative">
                                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                      </svg>
                                      <input
                                        type="text"
                                        placeholder="Search by course title or level…"
                                        value={courseSearch}
                                        onChange={(e) => setCourseSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        autoComplete="off"
                                      />
                                    </div>
                                    {/* Results list */}
                                    {filteredCourses.length > 0 ? (
                                      <div className="mt-1.5 border border-neutral-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                                        {filteredCourses.slice(0, 30).map((c) => (
                                          <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                              setEnrollForm((f) => ({ ...f, course_id: c.id }));
                                              setCourseSearch('');
                                            }}
                                            className="w-full text-left px-3 py-2.5 hover:bg-secondary-50 transition-colors border-b border-neutral-100 last:border-0 flex items-center gap-3"
                                          >
                                            <div className="w-7 h-7 rounded-lg bg-secondary-100 text-secondary-700 flex items-center justify-center flex-shrink-0">
                                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-neutral-900 truncate">{c.title}</p>
                                              <p className="text-xs text-neutral-400">{c.level}</p>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : courseSearch.trim() ? (
                                      <p className="text-xs text-neutral-400 mt-2 px-1">No courses match "{courseSearch}"</p>
                                    ) : (
                                      <p className="text-xs text-neutral-400 mt-2 px-1">{activeCourses.length} active courses available — type to search</p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Error */}
                              {enrollError && (
                                <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                  <p className="text-xs">{enrollError}</p>
                                </div>
                              )}

                            </form>
                          </div>

                          {/* Footer */}
                          <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex gap-3">
                            <button
                              type="button"
                              onClick={() => { setShowEnrollModal(false); setStudentSearch(''); setCourseSearch(''); setEnrollError(''); setEnrollForm({ student_id: '', course_id: '' }); }}
                              className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              form="admin-enroll-form"
                              type="submit"
                              disabled={!canSubmit}
                              className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                              {enrolling ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                  Enrolling…
                                </span>
                              ) : (
                                `Enroll${selectedStudent ? ' ' + selectedStudent.name.split(' ')[0] : ''}${selectedCourse ? ' → ' + selectedCourse.title.substring(0, 20) + (selectedCourse.title.length > 20 ? '…' : '') : ''}`
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
