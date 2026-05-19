import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CourseService from '../services/courseService';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Non-blocking replacement for window.confirm() using react-hot-toast
const confirmAction = (message) =>
  new Promise((resolve) => {
    toast(
      (t) => (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111827', lineHeight: '1.5' }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#374151',
                cursor: 'pointer',
              }}
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
            >
              Cancel
            </button>
            <button
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                cursor: 'pointer',
              }}
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          padding: 0,
          background: 'transparent',
          boxShadow: 'none',
          maxWidth: '380px',
        },
      }
    );
  });


const levelLabels = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper Intermediate' };
const COURSE_TITLE_MIN = 5;
const COURSE_TITLE_MAX = 120;
const COURSE_FEATURE_TEXT_MAX = 80;

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  const handleDeleteCourse = async () => {
    const confirmed = await confirmAction('Delete this course? All modules, lessons, and student access will be permanently lost.');
    if (!confirmed) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted successfully');
      navigate('/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error deleting course');
    }
  };
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 0 });
  const [activeModuleForClass, setActiveModuleForClass] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', zoom_link: '', scheduled_at: '', duration_minutes: 60 });
  const [scheduling, setScheduling] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleForm, setEditModuleForm] = useState({ title: '', description: '' });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: '', description: '', zoom_link: '', scheduled_at: '', duration_minutes: 60 });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseFormEdit, setCourseFormEdit] = useState(null);
  const [courseFeatureInput, setCourseFeatureInput] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);


  const toggleModule = (id) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

  const fetchCourseData = () => {
    setLoading(true);
    Promise.all([
      CourseService.getCourseById(id),
      CourseService.getCourseModules(id),
    ])
      .then(([courseRes, modulesRes]) => {
        setCourse(courseRes.data);
        setModules(modulesRes.data);
      })
      .catch((err) => {
        console.error("Failed to load course", err);
        navigate('/courses');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourseData();
  }, [id, navigate]);

  useEffect(() => {
    if (user?.role === 'student') {
      api.get('/enrollments/my')
        .then((res) => {
          const enrollmentsList = res.data?.data ?? res.data ?? [];
          setIsEnrolled(enrollmentsList.some((e) => String(e.course_id) === String(id)));
        })
        .catch(() => {});
    }
  }, [user, id]);

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/courses/${id}/modules`, moduleForm);
      const newModule = data?.data ?? data;
      setIsAddingModule(false);
      setModuleForm({ title: '', description: '', order_index: modules.length + 1 });
      setModules([...modules, { ...newModule, lessons: [] }]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create module');
    }
  };

  const handleScheduleClass = async (e, moduleId) => {
    e.preventDefault();
    setScheduling(true);
    try {
      const { data } = await api.post('/lessons', { ...lessonForm, module_id: moduleId, course_id: id });
      const newLesson = data?.data ?? data;
      setLessonForm({ title: '', description: '', zoom_link: '', scheduled_at: '', duration_minutes: 60 });
      setActiveModuleForClass(null);
      setModules(modules.map(mod => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          lessons: mod.lessons ? [...mod.lessons, newLesson] : [newLesson]
        };
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule class');
    } finally {
      setScheduling(false);
    }
  };

const handleEnroll = async (method) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(method);
    try {
      if (method === 'razorpay') {
        // Navigate to the dedicated Razorpay checkout page
        navigate('/checkout/razorpay', {
          state: { courseId: id, courseName: course.title },
        });
        setEnrolling(null);
        return;
      } else if (method === 'stripe') {
        // Navigate to dedicated Stripe Elements checkout page
        navigate('/checkout/stripe', {
          state: { courseId: id, courseName: course.title },
        });
        setEnrolling(null);
        return;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Payment failed. Please check your connection.');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUpdateModule = async (e, moduleId) => {
    e.preventDefault();
    const confirmed = await confirmAction('Save these changes to the module?');
    if (!confirmed) return;
    try {
      await api.put(`/courses/${id}/modules/${moduleId}`, editModuleForm);
      setModules(modules.map(mod => mod.id === moduleId ? { ...mod, ...editModuleForm } : mod));
      setEditingModuleId(null);
      toast.success("Module updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update module');
    }
  };

  const handleUpdateLesson = async (e, lessonId) => {
    e.preventDefault();
    const confirmed = await confirmAction('Save these changes to the lesson?');
    if (!confirmed) return;
    try {
      await api.put(`/lessons/${lessonId}`, editLessonForm);
      setModules(modules.map(mod => {
        if (!mod.lessons) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map(lesson => lesson.id === lessonId ? { ...lesson, ...editLessonForm } : lesson)
        };
      }));
      setEditingLessonId(null);
      toast.success("Lesson updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update lesson');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    const confirmed = await confirmAction('Delete this module and all its lessons?');
    if (!confirmed) return;
    try {
      await api.delete(`/courses/${id}/modules/${moduleId}`);
      setModules(modules.filter(mod => mod.id !== moduleId));
      toast.success("Module deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete module');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const confirmed = await confirmAction('Delete this lesson permanently?');
    if (!confirmed) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      setModules(modules.map(mod => {
        if (!mod.lessons) return mod;
        return {
          ...mod,
          lessons: mod.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }));
      toast.success("Lesson deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete lesson');
    }
  };

  const isTeacher = user?.id === course?.teacher_id || user?.role === 'admin';

  const handleAddCourseFeature = () => {
    const value = courseFeatureInput.trim();
    if (!value) return;
    setCourseFormEdit((prev) => {
      if (!prev) return prev;
      const prevFeatures = Array.isArray(prev.features) ? prev.features : [];
      const exists = prevFeatures.some((feature) => feature.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      return { ...prev, features: [...prevFeatures, value] };
    });
    setCourseFeatureInput('');
  };

  const handleRemoveCourseFeature = (featureToRemove) => {
    setCourseFormEdit((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: (prev.features || []).filter((feature) => feature !== featureToRemove),
      };
    });
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!courseFormEdit) return;
    const trimmedTitle = courseFormEdit.title?.trim() || '';
    if (trimmedTitle.length < COURSE_TITLE_MIN) {
      toast.error(`Course title must be at least ${COURSE_TITLE_MIN} characters.`);
      return;
    }
    if (trimmedTitle.length > COURSE_TITLE_MAX) {
      toast.error(`Course title must be ${COURSE_TITLE_MAX} characters or fewer.`);
      return;
    }
    const confirmed = await confirmAction('Save these changes to the course?');
    if (!confirmed) return;
    try {
      await api.put(`/courses/${id}`, courseFormEdit);
      setCourse({ ...course, ...courseFormEdit });
      setEditingCourse(false);
      toast.success("Course updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update course');
    }
  };

  const handleEditCourseClick = () => {
    setCourseFormEdit({
      title: course.title,
      level: course.level,
      description: course.description,
      price_inr: course.price_inr,
      price_usd: course.price_usd,
      duration_weeks: course.duration_weeks,
      thumbnail_url: course.thumbnail_url || '',
      features: Array.isArray(course.features) ? course.features : [],
    });
    setCourseFeatureInput('');
    setEditingCourse(true);
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const { url } = await CourseService.uploadThumbnail(file);
      setCourseFormEdit((prev) => ({ ...prev, thumbnail_url: url }));
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Thumbnail upload failed');
    } finally {
      setUploadingThumbnail(false);
    }
  };


  if (loading && !course) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="pt-16">
      <div className="bg-neutral-900 py-16">
        <div className="container-pad">
          <div className="flex justify-between items-start gap-4">
            <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="badge badge-level">{course.level} — {levelLabels[course.level]}</span>
                  {course.teacher_name && (
                    <span className="text-neutral-400 text-sm">by {course.teacher_name}</span>
                  )}
                </div>
                <h1 className="text-4xl font-display font-bold text-white">{course.title}</h1>
                {course.short_description && (
                  <p className="mt-4 text-neutral-300 text-lg leading-relaxed">{course.short_description}</p>
                )}
                <div className="mt-6 flex flex-wrap gap-5 text-sm text-neutral-400">
                  {course.duration_weeks && <span>{course.duration_weeks} weeks</span>}
                  {course.enrolled_count > 0 && <span>{course.enrolled_count} students enrolled</span>}
                </div>
              </div>
              {isTeacher && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleEditCourseClick} className="btn-secondary whitespace-nowrap !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      Edit 
                    </span>
                  </button>
                  <button onClick={handleDeleteCourse} className="btn-secondary whitespace-nowrap !bg-red-500/20 !text-red-100 !border-red-500/30 hover:!bg-red-500/40">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      Delete
                    </span>
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>

      <div className="container-pad py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {course.description && (
              <div>
                <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">About This Course</h2>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4 max-h-72 overflow-y-auto overflow-x-hidden">
                  <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap break-words">
                    {course.description}
                  </p>
                </div>
              </div>
            )}

            {true && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-display font-semibold text-neutral-900">Course Curriculum</h2>
                  {isTeacher && (
                    <button
                      onClick={() => setIsAddingModule(!isAddingModule)}
                      className="btn-secondary text-sm py-2"
                    >
                      {isAddingModule ? 'Cancel' : '+ Add Module'}
                    </button>
                  )}
                </div>

                {isAddingModule && (
                  <form onSubmit={handleCreateModule} className="card p-6 mb-8 bg-gradient-to-br from-primary-50/50 to-white border-2 border-primary-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      </div>
                      <h4 className="font-semibold text-lg text-primary-900">Add a New Module</h4>
                    </div>
                    <div className="space-y-4 max-w-2xl">
                      <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 block">Module Title</label>
                        <input
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                          className="input bg-white focus:ring-2 focus:ring-primary-500/20"
                          placeholder="e.g., Week 1: Introductions and Greetings"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 block">Description (Optional)</label>
                        <textarea
                          value={moduleForm.description}
                          onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                          className="input bg-white focus:ring-2 focus:ring-primary-500/20 resize-none h-24"
                          placeholder="What key concepts will be covered in this module?"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" className="btn-primary px-6 py-2.5">Save Module</button>
                        <button type="button" onClick={() => setIsAddingModule(false)} className="btn-secondary px-6 py-2.5 border-neutral-300">Cancel</button>
                      </div>
                    </div>
                  </form>
                )}

                                <div className="space-y-3">
                  {modules.length === 0 && !isTeacher && (
                    <div className="text-neutral-500 text-sm py-4 bg-neutral-50 px-4 rounded-lg border border-neutral-200">
                      Curriculum yet to be added.
                    </div>
                  )}
                  {modules.map((mod, i) => (
                    <div key={mod.id} className="card p-0 overflow-hidden">
                      <div 
                        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => toggleModule(mod.id)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-semibold">{i + 1}</span>
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <h4 className="font-semibold text-neutral-900 text-lg">{mod.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400 font-medium">
                              {mod.lessons?.length || 0} Lessons
                            </span>
                            {isTeacher && (
                              <div className="flex items-center gap-2 border-l border-neutral-300 pl-3 ml-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingModuleId(mod.id);
                                    setEditModuleForm({ title: mod.title, description: mod.description || '' });
                                    setExpandedModules(prev => ({ ...prev, [mod.id]: true }));
                                  }}
                                  className="btn-secondary whitespace-nowrap !py-1.5 !px-3 shadow-none"
                                  title="Edit Module"
                                >
                                  <span className="flex items-center gap-1.5 text-xs">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    Edit
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteModule(mod.id);
                                  }}
                                  className="btn-secondary whitespace-nowrap !py-1.5 !px-3 shadow-none !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
                                  title="Delete Module"
                                >
                                  <span className="flex items-center gap-1.5 text-xs">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    Delete
                                  </span>
                                </button>
                              </div>
                            )}
                            <span className="text-neutral-400 ml-2">
                              {expandedModules[mod.id] ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {expandedModules[mod.id] && (
                        <div className="p-4 pt-0 border-t border-neutral-100">
                          {mod.description && <p className="text-neutral-600 text-sm mt-3 mb-4">{mod.description}</p>}
                          
                          {isTeacher && (
                            <div className="flex justify-end mb-4 pt-2">
                              <button onClick={() => setActiveModuleForClass(activeModuleForClass === mod.id ? null : mod.id)} className="text-sm text-primary-600 hover:text-primary-700 font-medium px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-2">
                                {activeModuleForClass === mod.id ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    Cancel
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Schedule Class
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {editingModuleId === mod.id && isTeacher && (
                            <form onSubmit={(e) => handleUpdateModule(e, mod.id)} className="mb-4 space-y-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                              <h5 className="font-semibold text-sm">Edit Module</h5>
                              <input value={editModuleForm.title} onChange={(e) => setEditModuleForm({ ...editModuleForm, title: e.target.value })} className="input text-sm" required />
                              <textarea value={editModuleForm.description} onChange={(e) => setEditModuleForm({ ...editModuleForm, description: e.target.value })} className="input text-sm" placeholder="Description" />
                              <div className="flex gap-2">
                                <button type="submit" className="btn-primary py-1.5 px-3 text-xs">Save</button>
                                <button type="button" onClick={() => setEditingModuleId(null)} className="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
                              </div>
                            </form>
                          )}

                          {/* Schedule Class Form */}
                          {activeModuleForClass === mod.id && isTeacher && (
                            <form onSubmit={(e) => handleScheduleClass(e, mod.id)} className="mb-5 p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200 rounded-xl space-y-4 shadow-inner relative">
                              <button type="button" onClick={() => setActiveModuleForClass(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                              </button>
                              <div className="flex items-center gap-2 text-blue-800">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <h5 className="font-bold text-sm tracking-wide uppercase">Schedule a Live Class</h5>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-neutral-600">Lesson Title</label>
                                  <input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="input text-sm bg-white border-blue-100 focus:ring-blue-500" placeholder="e.g., Live Q&A Session" required />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-neutral-600">Zoom/Meeting Link</label>
                                  <input value={lessonForm.zoom_link} onChange={(e) => setLessonForm({ ...lessonForm, zoom_link: e.target.value })} className="input text-sm bg-white border-blue-100 focus:ring-blue-500" placeholder="https://zoom.us/j/..." required />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-neutral-600">Date & Time</label>
                                  <input type="datetime-local" value={lessonForm.scheduled_at} onChange={(e) => setLessonForm({ ...lessonForm, scheduled_at: e.target.value })} className="input text-sm bg-white border-blue-100 focus:ring-blue-500" required />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-neutral-600">Duration (mins)</label>
                                  <input type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) })} className="input text-sm bg-white border-blue-100 focus:ring-blue-500" min="15" max="240" required />
                                </div>
                              </div>
                              <button type="submit" className="btn-primary w-full bg-blue-600 hover:bg-blue-700 py-2.5 font-medium transition-all" disabled={scheduling}>
                                {scheduling ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm"/> Scheduling...</span> : 'Save Live Class'}
                              </button>
                            </form>
                          )}

                          {/* Lessons Mapping */}
                          {mod.lessons?.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {mod.lessons.map(lesson => (
                                <div key={lesson.id} className="flex flex-col bg-neutral-50 p-3 rounded border border-neutral-200">
                                  {editingLessonId === lesson.id && isTeacher ? (
                                    <form onSubmit={(e) => handleUpdateLesson(e, lesson.id)} className="space-y-3">
                                      <input value={editLessonForm.title} onChange={(e) => setEditLessonForm({...editLessonForm, title: e.target.value})} className="input text-sm" required />
                                      <input value={editLessonForm.zoom_link} onChange={(e) => setEditLessonForm({...editLessonForm, zoom_link: e.target.value})} className="input text-sm" placeholder="Zoom link" />
                                      <div className="flex gap-2">
                                        <input type="datetime-local" value={editLessonForm.scheduled_at ? new Date(editLessonForm.scheduled_at).toISOString().slice(0,16) : ''} onChange={(e) => setEditLessonForm({...editLessonForm, scheduled_at: e.target.value})} className="input text-sm flex-1" required />
                                        <input type="number" value={editLessonForm.duration_minutes} onChange={(e) => setEditLessonForm({...editLessonForm, duration_minutes: parseInt(e.target.value)})} className="input text-sm w-24" />
                                      </div>
                                      <div className="flex gap-2">
                                        <button type="submit" className="btn-primary py-1 px-3 text-xs">Save</button>
                                        <button type="button" onClick={() => setEditingLessonId(null)} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <div className="flex justify-between items-center gap-4">
                                      <div className="flex-1">
                                        <p className="font-medium text-neutral-800 text-sm flex items-center gap-2">
                                          {lesson.title}
                                        </p>
                                        <p className="text-xs text-neutral-500 flex gap-3 mt-1.5 flex-wrap">
                                          <span className="flex items-center gap-1">📅 {new Date(lesson.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                          <span className="flex items-center gap-1">⏱️ {lesson.duration_minutes} min</span>
                                        </p>
                                      </div>
                                      <div className="flex gap-2 items-center flex-shrink-0">
                                        {(isEnrolled || isTeacher) && (
                                          new Date(lesson.scheduled_at) < new Date() ? (
                                            lesson.zoom_link ? (
                                              <span className="text-neutral-400 text-xs italic">Class already happened</span>
                                            ) : (
                                              <span className="text-neutral-400 text-xs italic">Class already happened</span>
                                            )
                                          ) : (
                                            lesson.zoom_link ? (
                                              <a href={lesson.zoom_link} target="_blank" rel="noreferrer" className="btn-primary !bg-[#2D8CFF] hover:!bg-[#1A73E8] py-1.5 px-4 text-xs shadow-sm flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 4.5A2.5 2.5 0 002 7v10a2.5 2.5 0 002.5 2.5h11A2.5 2.5 0 0018 17V7a2.5 2.5 0 00-2.5-2.5h-11z"/><path d="M21.2 6.5l-2.7 2v7l2.7 2a1 1 0 001.5-.8v-9.4a1 1 0 00-1.5-.8z"/></svg>
                                                Join Class
                                              </a>
                                            ) : (
                                              <button disabled className="btn-primary !bg-[#2D8CFF]/60 cursor-not-allowed py-1.5 px-4 text-xs shadow-sm flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 4.5A2.5 2.5 0 002 7v10a2.5 2.5 0 002.5 2.5h11A2.5 2.5 0 0018 17V7a2.5 2.5 0 00-2.5-2.5h-11z"/><path d="M21.2 6.5l-2.7 2v7l2.7 2a1 1 0 001.5-.8v-9.4a1 1 0 00-1.5-.8z"/></svg>
                                                Link Pending
                                              </button>
                                            )
                                          )
                                        )}
                                        {isTeacher && new Date(lesson.scheduled_at) >= new Date() && (
                                          <div className="flex gap-2 ml-3 pl-3 border-l border-neutral-300">
                                            <button onClick={() => {
                                                setEditingLessonId(lesson.id);    
                                                setEditLessonForm({
                                                  title: lesson.title,
                                                  description: lesson.description || '',
                                                  zoom_link: lesson.zoom_link || '',
                                                  scheduled_at: lesson.scheduled_at,
                                                  duration_minutes: lesson.duration_minutes
                                                });
                                              }} 
                                              className="btn-secondary whitespace-nowrap !py-1 !px-2.5 shadow-none"
                                              title="Edit Lesson"
                                            >
                                              <span className="flex items-center gap-1.5 text-xs">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                Edit
                                              </span>
                                            </button>
                                            <button onClick={() => handleDeleteLesson(lesson.id)} 
                                              className="btn-secondary whitespace-nowrap !py-1 !px-2.5 shadow-none !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
                                              title="Delete Lesson"
                                            >
                                              <span className="flex items-center gap-1.5 text-xs">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                Delete
                                              </span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-400 mt-2 italic">No lessons in this module yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-44 object-cover rounded-lg mb-5"
                />
              )}
              {!isEnrolled && !isTeacher && (
                <div className="mb-4">
                  <p className="text-3xl font-bold text-neutral-900">
                    ₹{Number(course.price_inr).toLocaleString('en-IN')}
                  </p>
                  {course.price_usd > 0 && (
                    <p className="text-neutral-500 text-sm mt-0.5">${course.price_usd} USD for international students</p>
                  )}
                </div>
              )}
              {course.features?.length ? (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Course Features</p>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {course.features.map((feature, index) => (
                      <li key={`${feature}-${index}`} className="flex items-start gap-2">
                        <span className="text-secondary-500">✓</span>
                        <span className="break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 mb-6">No course features listed.</p>
              )}
              {isEnrolled ? (
                <Link to="/dashboard/student" className="btn-secondary w-full text-center block leading-[2.5rem]">Go to Dashboard</Link>
              ) : !user ? (
                <Link to="/login" className="btn-primary w-full text-center block leading-[2.5rem]">Login to Enroll</Link>
              ) : user.role === 'student' ? (
                showPaymentOptions ? (
                  <div className="space-y-3 mt-4 border-t border-neutral-100 pt-4">
                    <p className="text-sm font-semibold text-neutral-700 mb-2">Select Payment Method:</p>
                    <button
                      className="btn-primary w-full bg-[#3395FF] hover:bg-[#2084ea] disabled:opacity-50 !py-2.5"
                      disabled={!!enrolling}
                      onClick={() => handleEnroll('razorpay')}
                    >
                      {enrolling === 'razorpay' ? <LoadingSpinner size="sm" /> : `Pay ₹${Number(course.price_inr).toLocaleString('en-IN')} (Razorpay)`}
                    </button>
                {course.price_usd > 0 && (
                      <button
                        className="btn-secondary w-full border-[#635BFF] text-[#635BFF] hover:bg-slate-50 disabled:opacity-50 !py-2.5"
                        disabled={!!enrolling}
                        onClick={() => handleEnroll('stripe')}
                      >
                        {enrolling === 'stripe' ? <LoadingSpinner size="sm" /> : `Pay ${course.price_usd} USD (Stripe)`}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    className="btn-primary w-full !py-3 font-semibold text-lg"
                    onClick={() => setShowPaymentOptions(true)}
                  >
                    Enroll Now
                  </button>
                )
              ) : null}
              <p className="text-center text-xs text-neutral-400 mt-4">
                Questions? <Link to="/consultation" className="text-primary-600 hover:underline">Book a free consultation</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    

      {/* Edit Course Modal */}
      {editingCourse && courseFormEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col" style={{maxHeight: '90vh'}}>
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 flex-shrink-0 rounded-t-2xl">
              <h3 className="text-lg font-bold text-neutral-900">Edit Course Details</h3>
              <button onClick={() => setEditingCourse(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdateCourse} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="label">Course Title</label>
                    <input
                      value={courseFormEdit.title}
                      onChange={(e) => setCourseFormEdit({ ...courseFormEdit, title: e.target.value })}
                      className="input bg-white"
                      minLength={COURSE_TITLE_MIN}
                      maxLength={COURSE_TITLE_MAX}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <textarea value={courseFormEdit.description} onChange={(e) => setCourseFormEdit({ ...courseFormEdit, description: e.target.value })} className="input bg-white resize-none h-28" required />
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
                        className="input bg-white"
                        placeholder="Add a feature (e.g. Weekly practice worksheets)"
                        maxLength={COURSE_FEATURE_TEXT_MAX}
                      />
                      <button type="button" onClick={handleAddCourseFeature} className="btn-secondary px-4 py-2">Add</button>
                    </div>
                    {courseFormEdit.features?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {courseFormEdit.features.map((feature) => (
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
                  </div>
                  <div>
                    <label className="label">Level</label>
                    <select value={courseFormEdit.level} onChange={(e) => setCourseFormEdit({ ...courseFormEdit, level: e.target.value })} className="input bg-white" required>
                      <option value="A1">A1 - Beginner</option>
                      <option value="A2">A2 - Elementary</option>
                      <option value="B1">B1 - Intermediate</option>
                      <option value="B2">B2 - Upper Intermediate</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration (Weeks)</label>
                    <input type="number" value={courseFormEdit.duration_weeks} onChange={(e) => setCourseFormEdit({ ...courseFormEdit, duration_weeks: parseInt(e.target.value) })} className="input bg-white" min="1" required />
                  </div>
                  <div>
                    <label className="label">Price (INR)</label>
                    <input type="number" value={courseFormEdit.price_inr} onChange={(e) => setCourseFormEdit({ ...courseFormEdit, price_inr: parseFloat(e.target.value) })} className="input bg-white" min="0" required />
                  </div>
                  <div>
                    <label className="label">Price (USD)</label>
                    <input type="number" value={courseFormEdit.price_usd} onChange={(e) => setCourseFormEdit({ ...courseFormEdit, price_usd: parseFloat(e.target.value) })} className="input bg-white" min="0" required />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Thumbnail URL</label>
                    <div className="space-y-2">
                      <input
                        value={courseFormEdit.thumbnail_url}
                        onChange={(e) => setCourseFormEdit({ ...courseFormEdit, thumbnail_url: e.target.value })}
                        className="input bg-white"
                        placeholder="Paste an image URL or upload below"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleThumbnailUpload(e.target.files?.[0] || null)}
                          className="text-sm"
                        />
                        {uploadingThumbnail && <span className="text-xs text-neutral-500">Uploading...</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 flex gap-3 justify-end border-t border-neutral-100 flex-shrink-0 bg-neutral-50/50 rounded-b-2xl">
                <button type="button" onClick={() => setEditingCourse(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
                <button type="submit" className="btn-primary px-8 py-2.5 shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;