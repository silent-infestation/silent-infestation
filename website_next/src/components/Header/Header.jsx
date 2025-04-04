'use client';

import React, { useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { motion } from 'framer-motion';

// Composant pour la Pop-up
function Popup({ isOpen, onClose, onSubmit }) {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    onSubmit(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-xl font-semibold mb-4">Entrez l'URL du site</h2>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          placeholder="http://exemple.com"
        />
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Scanner
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleScanClick = () => {
    setIsPopupOpen(true);
  };

  const handlePopupSubmit = (url) => {
    console.log('URL à scanner :', url);
    // Ici, vous pouvez ajouter la logique pour scanner le site
  };

  return (
    <header className="relative flex h-screen items-center justify-center text-center text-[#05829E]">
      <div className="max-w-2xl p-10">
        <h1 className="mb-10 text-5xl font-bold">
          <span className="block text-[#00202B]">Bienvenue sur</span>
          <TypeAnimation
            sequence={[
              'notre plateforme sécurisée',
              2000,
              'un espace innovant',
              2000,
              'votre outil de confiance',
              2000,
              'un service de qualité',
              2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
            className="mt-2 block whitespace-nowrap"
          />
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Scannez votre site en un clic et obtenez des analyses détaillées sur sa sécurité !
        </p>

        {/* ESPACEMENT POUR LE BOUTON */}
        <div className="relative mt-32 flex items-center justify-center">
          {/* Vagues animées */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-[#05829E]"
              style={{
                width: '120px',
                height: '120px',
              }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 2.8 }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                repeatDelay: 2,
                delay: i * 1,
              }}
            />
          ))}

          {/* Bouton principal avec pulsation du texte */}
          <motion.button
            onClick={handleScanClick}
            className="relative rounded-xl bg-[#05829E] px-10 py-4 text-2xl font-semibold text-white shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.7, 1], scale: [1, 1.05, 1] }} // Effet de pulsation du texte
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Scanner un site
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* Pop-up */}
      <Popup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handlePopupSubmit}
      />
    </header>
  );
}
