import React from 'react';

// ─── Social link constants ────────────────────────────────────────────────────
const WHATSAPP_PHONE   = "917011137396";
const WHATSAPP_MESSAGE = "Hi, I want to enquire about the courses the platform offers.";
const INSTAGRAM_URL    = "https://www.instagram.com/gurukul_german";
const LINKEDIN_URL     = "https://www.linkedin.com/company/gurukul-german/about/?viewAsMember=true";

// ─── Individual button configs ────────────────────────────────────────────────
const socialLinks = [
  {
    id: "whatsapp",
    href: `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
    ariaLabel: "Contact us on WhatsApp",
    tooltip: "Chat with us!",
    colorClass: "bg-green-500 hover:bg-green-600",
    icon: (
      <svg
        className="w-7 h-7"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M12.031 2C6.495 2 2 6.491 2 12.022c0 1.77.464 3.5 1.341 5.022L2.095 22l5.074-1.229a9.98 9.98 0 0 0 4.862 1.251h.004c5.539 0 10.038-4.493 10.038-10.024 0-2.684-1.045-5.207-2.942-7.104C17.234 3.003 14.717 2 12.031 2zm0 18.337h-.002c-1.503 0-2.981-.397-4.288-1.144l-.307-.181-3.187.82.842-3.14-.2-.315A8.326 8.326 0 0 1 3.655 12.02c0-4.636 3.774-8.411 8.412-8.411 2.247 0 4.364.876 5.952 2.467 1.588 1.59 2.463 3.705 2.463 5.954 0 4.634-3.772 8.307-8.451 8.307z" />
        <path d="M16.634 14.286c-.25-.125-1.488-.737-1.718-.821-.231-.084-.399-.126-.566.126-.168.251-.649.82-.796.988-.148.167-.297.188-.548.063-.25-.125-1.06-.39-2.02-1.248-.747-.667-1.252-1.492-1.4-1.742-.148-.251-.016-.387.109-.512.113-.112.25-.292.375-.439.124-.146.166-.251.25-.418.083-.167.042-.314-.02-.439-.063-.125-.567-1.36-.777-1.862-.204-.491-.41-.424-.566-.432h-.483c-.168 0-.44.063-.671.314s-.881.862-.881 2.094.903 2.424 1.028 2.59c.125.168 1.767 2.696 4.281 3.782.599.258 1.066.412 1.431.528.601.191 1.15.164 1.583.1.487-.072 1.488-.609 1.698-1.197.21-.588.21-1.092.148-1.197-.064-.105-.231-.167-.482-.293z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    href: INSTAGRAM_URL,
    ariaLabel: "Follow us on Instagram",
    tooltip: "Follow us!",
    colorClass: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500",
    icon: (
      <svg
        className="w-7 h-7"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.31.975.976 1.249 2.243 1.31 3.609.058 1.265.07 1.645.07 4.848s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.31 3.608-.976.975-2.243 1.249-3.609 1.31-1.265.058-1.645.07-4.848.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.31-.975-.976-1.249-2.243-1.31-3.609C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.31-3.608.976-.975 2.243-1.249 3.609-1.31C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038C23.986 15.668 24 15.259 24 12c0-3.259-.014-3.668-.072-4.948-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.259 0 12 0z" />
        <path d="M12 5.838a6.162 6.162 0 1 0 0 12.324A6.162 6.162 0 0 0 12 5.838zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    href: LINKEDIN_URL,
    ariaLabel: "Connect with us on LinkedIn",
    tooltip: "Connect with us!",
    colorClass: "bg-[#0A66C2] hover:bg-[#004182]",
    icon: (
      <svg
        className="w-7 h-7"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.98 1.98 0 0 1-1.983-1.98c0-1.094.89-1.981 1.983-1.981 1.093 0 1.98.887 1.98 1.98a1.98 1.98 0 0 1-1.98 1.981zm1.957 13.019H3.379V9h3.915v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const SocialFloatingButtons = () => {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
      role="complementary"
      aria-label="Social media links"
    >
      {socialLinks.map(({ id, href, ariaLabel, tooltip, colorClass, icon }) => (
        <a
          key={id}
          id={`social-btn-${id}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative flex items-center justify-center p-3 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 group ${colorClass}`}
          aria-label={ariaLabel}
        >
          {icon}
          {/* Tooltip shown on hover */}
          <span className="absolute right-full mr-4 bg-white text-neutral-800 font-semibold px-3 py-1.5 rounded-lg shadow-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-neutral-100">
            {tooltip}
          </span>
        </a>
      ))}
    </div>
  );
};

export default SocialFloatingButtons;
