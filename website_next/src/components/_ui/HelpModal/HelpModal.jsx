import React from 'react';

const HelpModal = ({ isOpen, onClose, imageSrc, title, text }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-lg">
      <button
        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        &times;
      </button>
      <div className="flex flex-col items-center gap-4">
        <img src={imageSrc} alt="Illustration" className="h-24 w-24 object-contain" />
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
};

export default HelpModal;
