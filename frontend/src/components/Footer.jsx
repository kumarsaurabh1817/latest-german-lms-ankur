import { Link } from 'react-router-dom';
import logoMark from '../assets/imagelogo.jpeg';

const Footer = () => (
  <footer className="bg-neutral-900 text-neutral-400">
    <div className="container-pad py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <img src={logoMark} alt="Gurukul German logo" className="w-10 h-10 object-contain" />
            <span className="font-display font-bold text-white text-lg">Gurukul German</span>
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
        <p>&copy; {new Date().getFullYear()} Gurukul German. All rights reserved.</p>
        <p>Built with live classes in mind.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
