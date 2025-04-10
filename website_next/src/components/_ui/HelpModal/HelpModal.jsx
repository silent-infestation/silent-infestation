"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/app/context/AppContext";

const STORAGE_KEY = "helpModal";

const getModalState = (page) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return stored[page] || { disabled: false, nextDelay: 1000, lastClosed: null };
  } catch (e) {
    return { disabled: false, nextDelay: 1000, lastClosed: null };
  }
};

const setModalState = (page, state) => {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  stored[page] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

const HelpModal = ({ imageSrc, title, text }) => {
  const { activePage } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activePage) return;

    const { disabled, nextDelay } = getModalState(activePage);

    if (disabled) return;

    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, nextDelay);

    return () => clearTimeout(timerRef.current);
  }, [activePage]);

  const handleClose = () => {
    setIsOpen(false);
    const modalState = getModalState(activePage);

    const newDelay = modalState.nextDelay * 2;
    setModalState(activePage, {
      ...modalState,
      lastClosed: Date.now(),
      nextDelay: newDelay,
    });
  };

  const handleNeverShowAgain = () => {
    setIsOpen(false);
    const modalState = getModalState(activePage);
    setModalState(activePage, {
      ...modalState,
      disabled: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-lg">
      <button
        className="absolute right-3 top-3 text-xl text-gray-500 hover:text-gray-700"
        onClick={handleClose}
        aria-label="Fermer"
      >
        &times;
      </button>
      <div className="flex flex-col items-center gap-4">
        <img src={imageSrc} alt="Illustration" className="h-24 w-24 object-contain" />
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-600">{text}</p>
        <button
          onClick={handleNeverShowAgain}
          className="hover:text-red-700 mt-2 text-sm text-red-500 underline"
        >
          Ne plus jamais afficher
        </button>
      </div>
    </div>
  );
};

export default HelpModal;
