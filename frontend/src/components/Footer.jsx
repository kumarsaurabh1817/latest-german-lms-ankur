import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-neutral-900 text-neutral-400">
    <div className="container-pad py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DL</span>
            </div>
            <span className="font-display font-bold text-white text-lg">DeutschLernen</span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            Learn German online with live instructor-led classes. Structured A1 to B2 CEFR courses
            designed for real-world fluency.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Courses</h4>
          <ul className="space-y-2.5 text-sm">
            {['A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Intermediate'].map((level) => (
              <li key={level}>
                <Link to="/courses" className="hover:text-white transition-colors">{level}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { to: '/about', label: 'About Us' },
              { to: '/consultation', label: 'Book Consultation' },
              { to: '/contact', label: 'Contact' },
              { to: '/login', label: 'Sign In' },
              { to: '/register', label: 'Register' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>&copy; {new Date().getFullYear()} DeutschLernen. All rights reserved.</p>
        <p>Built with live classes in mind.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
