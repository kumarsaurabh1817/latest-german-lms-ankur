import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';

const tabs = ['Overview', 'Courses', 'Users', 'Consultations'];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/admin/courses'),
      api.get('/consultations'),
    ])
      .then(([u, c, co]) => {
        // Users and courses controllers return {success, data:[]}; consultations returns a plain array
        setUsers(u.data?.data ?? u.data ?? []);
        setCourses(c.data?.data ?? c.data ?? []);
        setConsultations(co.data?.data ?? co.data ?? []);
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
      const user = data?.data ?? data;
      const nextApproved = typeof user?.is_teacher_approved === 'boolean' ? user.is_teacher_approved : Boolean(approved);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_teacher_approved: nextApproved } : u)));
    } catch {}
  };

  const stats = [
    { label: 'Total Users', value: users.length, sub: `${users.filter((u) => u.role === 'student').length} students` },
    { label: 'Active Courses', value: courses.filter((c) => c.is_active).length, sub: `${courses.length} total` },
    { label: 'Consultations', value: consultations.length, sub: `${consultations.filter((c) => c.status === 'pending').length} pending` },
    { label: 'Teachers', value: users.filter((u) => u.role === 'teacher').length, sub: `${users.filter((u) => u.role === 'teacher' && u.is_teacher_approved).length} approved` },
  ];

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
