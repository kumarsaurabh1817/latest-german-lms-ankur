import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CourseService from '../features/courses/services/courseService';
import CourseCard from '../features/courses/components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const HERO_IMAGE = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200';
const TEACHER_IMAGE = 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600';

const levels = [
  { level: 'A1', label: 'Beginner', desc: 'Start from zero. Master greetings, numbers, and basic phrases.', color: 'from-secondary-50 to-secondary-100 border-secondary-200 text-secondary-700' },
  { level: 'A2', label: 'Elementary', desc: 'Build on basics. Learn everyday conversations and simple grammar.', color: 'from-primary-50 to-primary-100 border-primary-200 text-primary-700' },
  { level: 'B1', label: 'Intermediate', desc: 'Handle travel situations, express opinions, and understand main ideas.', color: 'from-accent-50 to-accent-100 border-accent-200 text-accent-700' },
  { level: 'B2', label: 'Upper Intermediate', desc: 'Engage fluently with native speakers on complex topics.', color: 'from-red-50 to-red-100 border-red-200 text-red-700' },
];

const features = [
  { icon: '🎥', title: 'Live Zoom Classes', desc: 'Real-time interactive sessions with your instructor — not pre-recorded videos.' },
  { icon: '📚', title: 'Structured CEFR Levels', desc: 'Follow the internationally recognized framework from A1 through B2.' },
  { icon: '🌍', title: 'Students Worldwide', desc: 'Join a global community of German learners from any timezone.' },
  { icon: '👨‍🏫', title: 'Expert Instructors', desc: 'Native and certified German teachers with years of teaching experience.' },
  { icon: '📅', title: 'Flexible Scheduling', desc: 'Check upcoming class times and join sessions that fit your routine.' },
];

const stats = [
  { value: '500+', label: 'Students Enrolled' },
  { value: '4', label: 'CEFR Levels' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '50+', label: 'Live Sessions / Month' },
];

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    CourseService.getAllCourses()
      .then(({ data }) => setCourses((data?.data ?? data).slice(0, 3)))
      .catch(() => toast.error('Could not load featured courses.'))
      .finally(() => setLoadingCourses(false));
  }, []);

  return (
    <div className="pt-16">
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-neutral-900/70" />
        <div className="relative container-pad py-24 z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-600/20 text-primary-300 text-sm font-medium border border-primary-500/30 mb-6">
              Live German Classes Online
            </span>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight text-balance">
              Learn German with<br />
              <span className="text-primary-400">Live Classes</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-300 leading-relaxed max-w-xl">
              From A1 beginner to B2 advanced — join structured CEFR-aligned courses taught live via Zoom
              by expert instructors. No pre-recorded videos.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/courses" className="btn-primary text-base px-8 py-3.5">
                Explore Courses
              </Link>
              <Link to="/consultation" className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200">
                Book Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-700 py-10">
        <div className="container-pad">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-display font-bold text-white">{value}</p>
                <p className="text-primary-200 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-pad">
          <div className="text-center mb-14">
            <h2 className="section-title">Choose Your Level</h2>
            <p className="section-subtitle">International CEFR-aligned courses for every stage of your German journey.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {levels.map(({ level, label, desc, color }) => (
              <Link
                key={level}
                to={`/courses?level=${level}`}
                className={`p-6 rounded-xl border bg-gradient-to-br ${color} hover:shadow-md transition-all duration-200 group`}
              >
                <div className="text-4xl font-display font-bold mb-2">{level}</div>
                <div className="font-semibold text-neutral-900 mb-2">{label}</div>
                <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
                <div className="mt-4 text-sm font-medium group-hover:underline">View courses →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="container-pad">
          <div className="text-center mb-14">
            <h2 className="section-title">Featured Courses</h2>
            <p className="section-subtitle">Start learning German with our most popular live courses.</p>
          </div>
          {loadingCourses ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <div className="text-center mt-10">
                <Link to="/courses" className="btn-secondary">View All Courses</Link>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-neutral-400">
              <p>Courses will be published soon. <Link to="/consultation" className="text-primary-600 hover:underline">Book a consultation</Link> to learn more.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-pad">
          <div className="text-center mb-14">
            <h2 className="section-title">Why Gurukul German?</h2>
            <p className="section-subtitle">We believe live interaction is the fastest path to fluency.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl">
                  {icon}
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-1">{title}</h4>
                  <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="section-title">Not sure which level to start?</h2>
              <p className="section-subtitle">
                Book a free one-on-one consultation with our instructor. We'll assess your current level
                and recommend the perfect course for your goals.
              </p>
              <ul className="mt-8 space-y-3">
                {['Personalized level assessment', 'Course recommendation', 'Learn about our teaching method', 'Ask any questions you have'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-neutral-700">
                    <div className="w-5 h-5 rounded-full bg-secondary-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/consultation" className="btn-primary mt-10">Book Free Consultation</Link>
            </div>
            <div className="relative">
              <img
                src={TEACHER_IMAGE}
                alt="German language teacher"
                className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border border-neutral-100">
                <p className="font-semibold text-neutral-900 text-sm">Live Session</p>
                <p className="text-neutral-500 text-xs mt-0.5">Zoom · Interactive · Real-time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary-700">
        <div className="container-pad text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
            Ready to start your German journey?
          </h2>
          <p className="text-primary-200 mt-4 text-lg max-w-xl mx-auto">
            Join hundreds of students learning German online with live, engaging classes.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-medium rounded-lg hover:bg-neutral-50 transition-all duration-200">
              Create Free Account
            </Link>
            <Link to="/courses" className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 text-white font-medium rounded-lg border border-primary-500 hover:bg-primary-500 transition-all duration-200">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
