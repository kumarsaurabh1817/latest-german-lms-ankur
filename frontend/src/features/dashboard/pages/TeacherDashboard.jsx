import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import CourseService from '../../courses/services/courseService';
import toast from 'react-hot-toast';

const tabs = ['My Courses', 'Create Course', 'Upcoming Classes'];
const COURSE_TITLE_MIN = 5;
const COURSE_TITLE_MAX = 120;
const COURSE_FEATURE_TEXT_MAX = 80;

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
  const [courseForm, setCourseForm] = useState({ title: '', level: 'A1', description: '', price_inr: 0, price_usd: 0, duration_weeks: 8, thumbnail_url: '', features: [] });
  const [courseFeatureInput, setCourseFeatureInput] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  const handleAddCourseFeature = () => {
    const value = courseFeatureInput.trim();
    if (!value) return;
    setCourseForm((prev) => {
      const exists = prev.features.some((feature) => feature.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      return { ...prev, features: [...prev.features, value] };
    });
    setCourseFeatureInput('');
  };

  const handleRemoveCourseFeature = (featureToRemove) => {
    setCourseForm((prev) => ({
      ...prev,
      features: prev.features.filter((feature) => feature !== featureToRemove),
    }));
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    setUploadingThumbnail(true);
    setCourseMsg('');
    try {
      const { url } = await CourseService.uploadThumbnail(file);
      setCourseForm((prev) => ({ ...prev, thumbnail_url: url }));
    } catch (err) {
      setCourseMsg(err.response?.data?.message || err.response?.data?.error || 'Thumbnail upload failed. Please try again.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  useEffect(() => {
    Promise.all([api.get('/courses/mine'), api.get('/lessons/upcoming')])
      .then(([c, l]) => {
        setCourses(c.data.data || []);
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
    const trimmedTitle = courseForm.title.trim();
    if (!trimmedTitle) {
      setCourseMsg('Course title is required.');
      return;
    }
    if (trimmedTitle.length < COURSE_TITLE_MIN) {
      setCourseMsg(`Course title must be at least ${COURSE_TITLE_MIN} characters.`);
      return;
    }
    if (trimmedTitle.length > COURSE_TITLE_MAX) {
      setCourseMsg(`Course title must be ${COURSE_TITLE_MAX} characters or fewer.`);
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
      setCourseMsg('Course created successfully! It is unpublished — go to "My Courses" to publish it when ready.');
      setCourseForm({ title: '', level: 'A1', description: '', price_inr: 0, price_usd: 0, duration_weeks: 8, thumbnail_url: '', features: [] });
      setCourseFeatureInput('');
      const { data } = await api.get('/courses/mine');
      setCourses(data.data || []);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.error || (Array.isArray(errorData?.errors) ? errorData.errors.map(e => e.message || e).join(', ') : 'Failed to create course');
      setCourseMsg(errorMessage);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleTogglePublish = async (courseId) => {
    try {
      const { data } = await api.patch(`/courses/${courseId}/publish`);
      const updated = data.data;
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, is_published: updated.is_published } : c)));
      toast.success(updated.is_published ? 'Course published.' : 'Course unpublished.');
    } catch (err) {
      toast.error('Failed to toggle publish status');
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
                      <div key={c.id} className="card p-0 overflow-hidden hover:border-primary-300 transition-colors group relative flex flex-col justify-between cursor-pointer">
                        {/* Full-card link overlay */}
                        <Link
                          to={`/courses/${c.id}`}
                          className="absolute inset-0 z-0"
                          aria-label={c.title}
                        />
                        {/* Thumbnail */}
                        {c.thumbnail_url ? (
                          <img
                            src={c.thumbnail_url}
                            alt={c.title}
                            className="w-full h-36 object-cover"
                          />
                        ) : (
                          <div className="w-full h-36 bg-gradient-to-br from-primary-50 to-neutral-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1 relative z-10 pointer-events-none">
                          <div className="flex items-center justify-between mb-3">
                            <span className="badge badge-level">{c.level}</span>
                            <span className="text-xs text-neutral-400 font-medium bg-neutral-100 px-2 py-1 rounded-full">{c.enrolled_count || 0} enrolled</span>
                          </div>
                          <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{c.title}</h4>
                          {c.description && (
                            <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{c.description}</p>
                          )}

                          {/* Publish / Unpublish toggle */}
                          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between pointer-events-auto">

                            {/* Toggle pill — uses app secondary (green) + neutral palette */}
                            <button
                              onClick={(e) => { e.preventDefault(); handleTogglePublish(c.id); }}
                              title={c.is_published ? 'Click to unpublish' : 'Click to publish'}
                              className="inline-flex items-center gap-2.5 select-none focus:outline-none group/toggle relative z-10"
                            >
                              {/* Track */}
                              <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-300 ease-in-out ${
                                c.is_published ? 'bg-secondary-500' : 'bg-neutral-300'
                              }`}>
                                {/* Thumb */}
                                <span className={`absolute top-0.5 left-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${
                                  c.is_published ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </span>
                              {/* Label */}
                              <span className={`text-xs font-semibold transition-colors duration-200 ${
                                c.is_published
                                  ? 'text-secondary-700'
                                  : 'text-neutral-400 group-hover/toggle:text-neutral-600'
                              }`}>
                                {c.is_published ? 'Published' : 'Unpublished'}
                              </span>
                            </button>

                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                              <Link to={`/courses/${c.id}`} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Edit</Link>
                              <button onClick={async (e) => {
                                e.preventDefault();
                                if(window.confirm('Delete this course?')) {
                                    await api.delete(`/courses/${c.id}`);
                                    setCourses(courses.filter(co => co.id !== c.id));
                                }
                              }} className="text-sm text-red-500 hover:text-red-700 font-medium">Remove</button>
                            </div>
                          </div>

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
                            placeholder={`e.g. Intensive German B1 (${COURSE_TITLE_MIN}-${COURSE_TITLE_MAX} characters)`}
                            minLength={COURSE_TITLE_MIN}
                            maxLength={COURSE_TITLE_MAX}
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
                      </div>
                      <div className="col-span-2">
                        <label className="label">Course Features <span className="text-neutral-400 text-xs font-normal">(optional)</span></label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            value={courseFeatureInput}
                            onChange={(e) => setCourseFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCourseFeature();
                              }
                            }}
                            className="input"
                            placeholder="Add a feature (e.g. Weekly practice worksheets)"
                            maxLength={COURSE_FEATURE_TEXT_MAX}
                          />
                          <button type="button" onClick={handleAddCourseFeature} className="btn-secondary px-4 py-2">Add</button>
                        </div>
                        {courseForm.features.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {courseForm.features.map((feature) => (
                              <span key={feature} className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full border border-primary-100">
                                <span className="break-words">{feature}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCourseFeature(feature)}
                                  className="text-primary-500 hover:text-primary-700"
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-neutral-500 mt-2">Add course highlights shown to students on the course page.</p>
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
                      <div className="col-span-2">
                        <label className="label">Course Thumbnail <span className="text-neutral-400 text-xs font-normal">(optional)</span></label>
                        <div className="space-y-2">
                          {/* Preview */}
                          {courseForm.thumbnail_url && (
                            <img
                              src={courseForm.thumbnail_url}
                              alt="Thumbnail preview"
                              className="w-full h-36 object-cover rounded-lg border border-neutral-200"
                            />
                          )}
                          {/* URL input */}
                          <input
                            value={courseForm.thumbnail_url}
                            onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                            className="input"
                            placeholder="Paste an image URL, or upload below"
                          />
                          {/* File upload */}
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer btn-secondary py-2 px-3 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              {uploadingThumbnail ? 'Uploading…' : 'Upload from device'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingThumbnail}
                                onChange={(e) => handleThumbnailUpload(e.target.files?.[0] || null)}
                              />
                            </label>
                            {uploadingThumbnail && <LoadingSpinner size="sm" />}
                            {courseForm.thumbnail_url && !uploadingThumbnail && (
                              <button
                                type="button"
                                onClick={() => setCourseForm((p) => ({ ...p, thumbnail_url: '' }))}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">Upload an image from your device.</p>
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full mt-4" disabled={creatingCourse || uploadingThumbnail || !teacherApproved}>
                      {creatingCourse ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Creating...</span> : uploadingThumbnail ? 'Uploading image…' : 'Create Course'}
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
