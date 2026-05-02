import { Link } from 'react-router-dom';

const ABOUT_IMAGE = 'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=800';
const CLASSROOM_IMAGE = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=800';

const values = [
  { title: 'Live-First Teaching', desc: 'We believe the fastest way to learn a language is through real interaction. Every course features live Zoom sessions, not recordings.' },
  { title: 'CEFR Alignment', desc: 'Our curriculum follows the Common European Framework of Reference, ensuring your progress is internationally recognized.' },
  { title: 'Small Group Sizes', desc: 'With a maximum of 20 students per class, every student gets personalized attention from the instructor.' },
  { title: 'Practical German', desc: 'We focus on language you can actually use — travel, work, conversations — not just textbook exercises.' },
];

const About = () => (
  <div className="pt-16">
    <div className="bg-neutral-900 py-16">
      <div className="container-pad text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white">About DeutschLernen</h1>
        <p className="mt-4 text-neutral-400 text-lg max-w-2xl mx-auto">
          We're on a mission to make quality German education accessible globally through live, interactive online teaching.
        </p>
      </div>
    </div>

    <section className="py-20 bg-white">
      <div className="container-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="section-title">Our Story</h2>
            <div className="space-y-4 mt-6 text-neutral-600 leading-relaxed">
              <p>
                DeutschLernen was founded with a simple belief: the best way to learn a language is through
                live, real-time interaction with an expert teacher — not passive video watching.
              </p>
              <p>
                We offer structured German language courses for all levels, from complete beginners (A1)
                to upper intermediate learners (B2), following the internationally recognized CEFR framework.
              </p>
              <p>
                Our live classes on Zoom create an immersive learning environment where students can ask
                questions, practice speaking, and receive immediate feedback.
              </p>
            </div>
            <Link to="/consultation" className="btn-primary mt-8">Book a Free Consultation</Link>
          </div>
          <img
            src={ABOUT_IMAGE}
            alt="German language classroom"
            className="w-full h-80 object-cover rounded-2xl shadow-xl"
          />
        </div>
      </div>
    </section>

    <section className="py-20 bg-neutral-50">
      <div className="container-pad">
        <div className="text-center mb-14">
          <h2 className="section-title">Our Values</h2>
          <p className="section-subtitle">Everything we do is guided by these core principles.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map(({ title, desc }) => (
            <div key={title} className="card p-7">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <div className="w-3 h-3 rounded-full bg-primary-600" />
              </div>
              <h4 className="font-semibold text-neutral-900 text-lg mb-2">{title}</h4>
              <p className="text-neutral-500 leading-relaxed text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-20 bg-white">
      <div className="container-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <img
            src={CLASSROOM_IMAGE}
            alt="Online German class via Zoom"
            className="w-full h-80 object-cover rounded-2xl shadow-xl order-2 lg:order-1"
          />
          <div className="order-1 lg:order-2">
            <h2 className="section-title">How We Teach</h2>
            <div className="space-y-5 mt-6">
              {[
                { step: '01', title: 'Enroll in a Course', desc: 'Choose your CEFR level and complete enrollment with a secure payment.' },
                { step: '02', title: 'Access Your Dashboard', desc: 'Find your class schedule, Zoom links, and progress tools in one place.' },
                { step: '03', title: 'Join Live Sessions', desc: 'Attend live Zoom classes with your instructor and fellow students.' },
                { step: '04', title: 'Practice & Progress', desc: 'Advance through modules at a structured pace with regular class guidance.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-5">
                  <div className="text-primary-600 font-display font-bold text-2xl w-10 flex-shrink-0">{step}</div>
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
    </section>
  </div>
);

export default About;
