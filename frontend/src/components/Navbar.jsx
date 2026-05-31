import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoMark from '../assets/imagelogo.jpeg';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setProfileMenuOpen(false);
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';
  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'teacher'
        ? '/dashboard/teacher'
        : '/dashboard/student';

  const navItems = isAdmin
    ? [
        { to: '/dashboard/admin', label: 'Dashboard' },
        { to: '/courses', label: 'All Courses' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/courses', label: 'Courses' },
        { to: '/about', label: 'About' },
        { to: '/consultation', label: 'Book Consultation' },
        { to: '/contact', label: 'Contact' },
      ];

  return (
    <>
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm border-b border-neutral-100' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="container-pad">
        <div className="flex items-center justify-between h-16">
          <Link to={isAdmin ? '/dashboard/admin' : '/'} className="flex items-center gap-3 group">
            <img
              src={logoMark}
              alt="Gurukul German logo"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
            />
            <span className="font-display font-bold text-neutral-900 text-base sm:text-lg">
              Gurukul German
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
               <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-all"
                  aria-label="User menu"
                >
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-neutral-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                         {user.phone && <p className="text-xs text-neutral-500 truncate">{user.phone}</p>}
                        <span className="text-[10px] uppercase tracking-wider text-primary-600 font-bold mt-1 inline-block bg-primary-50 px-2 py-0.5 rounded-full">{user.role}</span>
                    </div>
                    
                    <div className="py-1">
                        <Link 
                          to={dashboardPath}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
                            onClick={() => setProfileMenuOpen(false)}
                        >
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            Dashboard
                        </Link>
                    </div>

                    <div className="border-t border-neutral-100 py-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors text-left"
                        >
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Sign Out
                        </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm py-2">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-3 space-y-1 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
            {user ? (
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-200">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-neutral-900 truncate">{user.name}</span>
                        <span className="text-xs text-neutral-500 truncate">{user.email}</span>
                        {user.phone && <span className="text-xs text-neutral-500 truncate">{user.phone}</span>}
                    </div>
                </div>
                <div className="space-y-1">
                    <Link 
                      to={dashboardPath}
                        onClick={() => setMenuOpen(false)} 
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                    >
                         <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        Dashboard
                    </Link>
                    <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-left"
                    >
                        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Sign Out
                    </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm justify-center">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm justify-center">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>

    </>
  );
};

export default Navbar;