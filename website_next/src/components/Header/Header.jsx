'use client';

import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { motion } from 'framer-motion';
import ArrowSeparatorRight from '@/components/_ui/Arrow/ArrowSeparatorRight';
// import ArrowSeparatorLeft from '@/components/_ui/Arrow/ArrowSeparatorLeft';

export default function Header() {
  return (
    <header className="relative flex h-screen items-center justify-center bg-[#DCF0FF] text-center text-[#05829E]">
      <div className="max-w-2xl p-10">
        <h1 className="mb-10 text-5xl font-bold">
          <span className="text-[#00202B] block">Bienvenue sur</span>
          <TypeAnimation
            sequence={[
              'notre plateforme sécurisée', 2000,
              'un espace innovant', 2000,
              'votre outil de confiance', 2000,
              'un service de qualité', 2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
            className="block whitespace-nowrap mt-2"
          />
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Scannez votre site en un clic et obtenez des analyses détaillées sur sa sécurité !
        </p>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <button className="bg-[#05829E] px-10 py-4 text-2xl font-semibold text-white rounded-xl shadow-lg hover:bg-[#046b85] transition duration-300">
            Scanner un site
          </button>
        </motion.div>
      </div>

      {/* Flèche animée */}
        <ArrowSeparatorRight data-testid="arrow-separator-right" />
        {/* <ArrowSeparatorLeft /> */}
    </header>
  );
}
