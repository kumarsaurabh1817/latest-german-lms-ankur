import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';

const tabs = ['My Courses', 'Create Course', 'Upcoming Classes'];

const formatDate = (dt) =>
  new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const teacherApproved = Boolean(user?.is_teacher_approved);
  const [activeTab, setActiveTab] = useState('My Courses');
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonForm, setLessonForm] = useState({ course_id: '', module_id: '', title: '', zoom_link: '', scheduled_at: '', duration_minutes: 60 });
  const [courseModules, setCourseModules] = useState([]);

  // ... (inside the component) ...
  const handleCourseSelectForLesson = async (courseId) => {
    setLessonForm({ ...lessonForm, course_id: courseId, module_id: '' });
    if (!courseId) {
      setCourseModules([]);
      return;
    }
    try {
      const { data } = await api.get(`/courses/${courseId}/modules`);
      // Unwrap {success, data} envelope returned by updated controller
      setCourseModules(data?.data ?? data);
    } catch (err) {
      console.error('Failed to load modules', err);
    }
  };
  const [courseForm, setCourseForm] = useState({ title: '', level: 'A1', description: '', price_inr: 0, price_usd: 0, duration_weeks: 8, thumbnail_url: '' });
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/lessons/upcoming')])
      .then(([c, l]) => {
        const allCourses = c.data.data || [];
        const teacherCourses = allCourses.filter((co) => co.teacher_id === user.id);
        setCourses(teacherCourses);
        // Unwrap {success, data} envelope returned by updated lessonController
        setLessons(l.data?.data ?? l.data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!teacherApproved) {
      setCourseMsg('Admin approval required before creating courses.');
      return;
    }

    // Frontend validation
    if (!courseForm.title.trim()) {
      setCourseMsg('Course title is required.');
      return;
    }
    if (courseForm.title.trim().length < 5) {
      setCourseMsg('Course title must be at least 5 characters.');
      return;
    }
    if (!courseForm.level) {
      setCourseMsg('Please select a course level.');
      return;
    }
    if (!courseForm.description.trim()) {
      setCourseMsg('Course description is required.');
      return;
    }
    if (courseForm.description.trim().length < 20) {
      setCourseMsg('Course description must be at least 20 characters.');
      return;
    }
    if (!courseForm.price_inr || Number(courseForm.price_inr) <= 0) {
      setCourseMsg('Price (INR) must be greater than 0.');
      return;
    }
    if (!courseForm.duration_weeks || Number(courseForm.duration_weeks) < 1) {
      setCourseMsg('Duration must be at least 1 week.');
      return;
    }

    setCreatingCourse(true);
    setCourseMsg('');
    try {
      await api.post('/courses', { ...courseForm, teacher_id: user.id });
      setCourseMsg('Course created successfully!');
      setCourseForm({ title: '', level: 'A1', description: '', price_inr: 0, price_usd: 0, duration_weeks: 8, thumbnail_url: '' });
      const { data } = await api.get('/courses');
      const allCourses = data.data || [];
      setCourses(allCourses.filter((co) => co.teacher_id === user.id));
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.error || (Array.isArray(errorData?.errors) ? errorData.errors.map(e => e.message || e).join(', ') : 'Failed to create course');
      setCourseMsg(errorMessage);
    } finally {
      setCreatingCourse(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="container-pad py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">Teacher Dashboard</h1>
            <p className="text-neutral-500 text-sm mt-1">Welcome, {user?.name}</p>
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
        {!teacherApproved && (
          <div className="card p-4 mb-6 border-amber-200 bg-amber-50">
            <p className="font-medium text-amber-800 text-sm">Your educator account is pending admin approval. You can browse your assigned courses, but creating or editing courses/modules is blocked until approved.</p>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {activeTab === 'My Courses' && (
              <div>
                {courses.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-neutral-400 text-lg">No courses assigned to you yet.</p>
                    <p className="text-neutral-400 text-sm mt-2">Contact admin to create a course.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {courses.map((c) => (
                      <div key={c.id} className="card p-5 hover:border-primary-300 transition-colors group relative flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="badge badge-level">{c.level}</span>
                            <span className="text-xs text-neutral-400 font-medium bg-neutral-100 px-2 py-1 rounded-full">{c.enrolled_count || 0} enrolled</span>
                          </div>
                          <Link to={`/courses/${c.id}`}>
                            <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{c.title}</h4>
                            {c.description && (
                              <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{c.description}</p>
                            )}
                          </Link>
                        </div>
                        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/courses/${c.id}`} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Edit</Link>
                            <button onClick={async () => {
                                if(window.confirm('Delete this course?')) {
                                    await api.delete(`/courses/${c.id}`);
                                    setCourses(courses.filter(co => co.id !== c.id));
                                }
                            }} className="text-sm text-red-500 hover:text-red-700 font-medium">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Create Course' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-display font-semibold text-neutral-900 mb-6">Create a New Course</h2>
                {courseMsg && (
                  <div className={`mb-5 p-3.5 rounded-lg text-sm border ${courseMsg.includes('success') ? 'bg-secondary-50 border-secondary-200 text-secondary-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {courseMsg}
                  </div>
                )}
                {!teacherApproved ? (
                  <div className="card p-6 text-neutral-600 text-sm">
                    Admin approval is required before you can create courses. Please contact the platform admin.
                  </div>
                ) : (
                  <form onSubmit={handleCreateCourse} className="space-y-5 card p-6" noValidate>
                    <p className="text-xs text-neutral-400"><span className="text-red-500 font-semibold">*</span> Marked fields are required</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                          <label className="label">Course Title <span className="text-red-500">*</span></label>
                          <input
                            value={courseForm.title}
                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                            className="input"
                            placeholder="e.g. Intensive German B1 (min. 5 characters)"
                            minLength={5}
                            required
                          />
                      </div>
                      <div className="col-span-2">
                          <label className="label">Level <span className="text-red-500">*</span></label>
                          <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })} className="input" required>
                              <option value="">— Select a level —</option>
                              <option value="A1">A1 - Beginner</option>
                              <option value="A2">A2 - Elementary</option>
                              <option value="B1">B1 - Intermediate</option>
                              <option value="B2">B2 - Upper Intermediate</option>
                          </select>
                      </div>
                       <div className="col-span-2">
                          <label className="label">Course Description <span className="text-red-500">*</span></label>
                          <textarea
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                            className="input min-h-[120px]"
                            placeholder="Detailed course description, syllabus, requirements... (min. 20 characters)"
                            minLength={20}
                            required
                          />
                          <p className="text-xs text-neutral-500 mt-2">
                            Note: This course will automatically include features like live lessons and scheduled Zoom classes.
                          </p>
                      </div>
                      <div>
                          <label className="label">Price (INR) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={courseForm.price_inr}
                            onChange={(e) => setCourseForm({ ...courseForm, price_inr: parseFloat(e.target.value) || 0 })}
                            className="input"
                            min="1"
                            placeholder="e.g. 4999"
                            required
                          />
                      </div>
                      <div>
                          <label className="label">Price (USD) <span className="text-neutral-400 text-xs font-normal">(optional)</span></label>
                          <input type="number" value={courseForm.price_usd} onChange={(e) => setCourseForm({ ...courseForm, price_usd: parseFloat(e.target.value) || 0 })} className="input" min="0" placeholder="e.g. 59" />
                      </div>
                      <div>
                          <label className="label">Duration (Weeks) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={courseForm.duration_weeks}
                            onChange={(e) => setCourseForm({ ...courseForm, duration_weeks: parseInt(e.target.value) || 1 })}
                            className="input"
                            min="1"
                            required
                          />
                      </div>
                      <div>
                          <label className="label">Thumbnail URL <span className="text-neutral-400 text-xs font-normal">(optional)</span></label>
                          <input value={courseForm.thumbnail_url} onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })} className="input" placeholder="https://..." />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full mt-4" disabled={creatingCourse || !teacherApproved}>
                      {creatingCourse ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Creating...</span> : 'Create Course'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'Upcoming Classes' && (
              <div>
                {lessons.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-neutral-400 text-lg">No upcoming classes scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(
                      lessons.reduce((acc, lesson) => {
                        if (!acc[lesson.course_title]) acc[lesson.course_title] = [];
                        acc[lesson.course_title].push(lesson);
                        return acc;
                      }, {})
                    ).map(([courseTitle, courseLessons]) => (
                      <div key={courseTitle}>
                        <h3 className="text-lg font-semibold text-neutral-800 border-b pb-2 mb-4">{courseTitle}</h3>
                        <div className="space-y-4">
                          {courseLessons.map((lesson) => (
                            <div key={lesson.id} className="card p-5 flex items-center gap-5">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="badge badge-level text-xs">{lesson.level}</span>
                                  <span className="text-neutral-500 text-xs">Module: {lesson.module_title}</span>
                                </div>
                                <h4 className="font-semibold text-neutral-900">{lesson.title}</h4>
                                <p className="text-neutral-500 text-sm">{formatDate(lesson.scheduled_at)} · {lesson.duration_minutes} min</p>
                                {lesson.enrolled_count > 0 && (
                                  <p className="text-xs text-neutral-400 mt-1">{lesson.enrolled_count} students enrolled</p>
                                )}
                              </div>
                              {lesson.zoom_link && (
                                <a href={lesson.zoom_link} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
                                  Start Class
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
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

export default TeacherDashboard;
