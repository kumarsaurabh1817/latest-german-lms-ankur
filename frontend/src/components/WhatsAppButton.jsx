import React from 'react';

const WhatsAppButton = () => {
  // Replace this placeholder number with your actual WhatsApp phone number.
  // Must include the country code without plus or zeroes, e.g., 1234567890
  const phoneNumber = "919354263486";
  const defaultMessage = "Hi, I want to enquire about the courses the platform offers.";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110 active:scale-95 group"
      aria-label="Contact us on WhatsApp"
    >
      <svg
        className="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.031 2C6.495 2 2 6.491 2 12.022c0 1.77.464 3.5 1.341 5.022L2.095 22l5.074-1.229a9.98 9.98 0 0 0 4.862 1.251h.004c5.539 0 10.038-4.493 10.038-10.024 0-2.684-1.045-5.207-2.942-7.104C17.234 3.003 14.717 2 12.031 2zm0 18.337h-.002c-1.503 0-2.981-.397-4.288-1.144l-.307-.181-3.187.82.842-3.14-.2-.315A8.326 8.326 0 0 1 3.655 12.02c0-4.636 3.774-8.411 8.412-8.411 2.247 0 4.364.876 5.952 2.467 1.588 1.59 2.463 3.705 2.463 5.954 0 4.634-3.772 8.307-8.451 8.307z" />
        <path d="M16.634 14.286c-.25-.125-1.488-.737-1.718-.821-.231-.084-.399-.126-.566.126-.168.251-.649.82-.796.988-.148.167-.297.188-.548.063-.25-.125-1.06-.39-2.02-1.248-.747-.667-1.252-1.492-1.4-1.742-.148-.251-.016-.387.109-.512.113-.112.25-.292.375-.439.124-.146.166-.251.25-.418.083-.167.042-.314-.02-.439-.063-.125-.567-1.36-.777-1.862-.204-.491-.41-.424-.566-.432h-.483c-.168 0-.44.063-.671.314s-.881.862-.881 2.094.903 2.424 1.028 2.59c.125.168 1.767 2.696 4.281 3.782.599.258 1.066.412 1.431.528.601.191 1.15.164 1.583.1.487-.072 1.488-.609 1.698-1.197.21-.588.21-1.092.148-1.197-.064-.105-.231-.167-.482-.293z" />
      </svg>
      {/* Optional tooltip */}
      <span className="absolute right-full mr-4 bg-white text-neutral-800 font-semibold px-3 py-1.5 rounded-lg shadow-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-neutral-100">
        Chat with us!
      </span>
    </a>
  );
};

export default WhatsAppButton;