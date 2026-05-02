import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import CourseService from '../services/courseService';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const levelLabels = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper Intermediate' };

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeLevel = searchParams.get('level') || '';

  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const params = activeLevel ? { level: activeLevel } : {};
    
    CourseService.getAllCourses(params)
      .then(res => setCourses(res.data ?? res))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [activeLevel]);

  const setLevel = (level) => {
    if (level === activeLevel) setSearchParams({});
    else setSearchParams({ level });
  };

  return (
    <div className="pt-16">
      <div className="bg-neutral-900 py-16">
        <div className="container-pad text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">German Language Courses</h1>
          <p className="mt-4 text-neutral-400 text-lg max-w-xl mx-auto">
            Live CEFR-aligned courses from A1 to B2. Choose your level and start learning with expert instructors.
          </p>
        </div>
      </div>

      <div className="container-pad py-10">
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSearchParams({})}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
              !activeLevel
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            All Levels
          </button>
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setLevel(level)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                activeLevel === level
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              {level} — {levelLabels[level]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-400">
            <p className="text-lg">No courses found{activeLevel ? ` for level ${activeLevel}` : ''}.</p>
            {activeLevel && (
              <button onClick={() => setSearchParams({})} className="mt-4 text-primary-600 hover:underline text-sm">
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
