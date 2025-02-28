'use client';

import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <header className="relative flex h-screen items-center justify-center bg-[#DCF0FF] text-center text-[#05829E]">
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
    </header>
  );
}
