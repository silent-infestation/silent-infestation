'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger'; // Version compatible avec Jest
import AOS from 'aos';
import 'aos/dist/aos.css';

// Enregistrement du plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const solutions = [
  {
    title: 'Analyse',
    description: 'Notre outil scanne votre site en profondeur pour identifier les failles potentielles.',
    icon: '📊',
  },
  {
    title: 'Détecte',
    description: 'Nous détectons les vulnérabilités et vous fournissons un rapport détaillé.',
    icon: '🔍',
  },
  {
    title: 'Corrige',
    description: 'Bénéficiez de recommandations précises pour sécuriser vos applications web.',
    icon: '🛠️',
  },
];

export default function Solution() {
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    AOS.init({ duration: 1000 });

    const section = sectionRef.current;
    const container = containerRef.current;
    const totalSlides = solutions.length;

    gsap.to(container, {
      xPercent: -100 * (totalSlides - 1),
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerWidth * (totalSlides - 1)}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        snap: 1 / (totalSlides - 1),
        onUpdate: (self) => {
          let index = Math.round(self.progress * (totalSlides - 1));
          setActiveIndex(index);
        },
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-[#DCF0FF] py-32 overflow-hidden">
      {/* SECTION DU SCROLL HORIZONTAL */}
      <div className="flex w-full h-screen items-center justify-center">
        <div className="relative flex w-full max-w-7xl mx-auto">
          {/* Icône dynamique à gauche */}
          <motion.div
            className="w-1/3 flex justify-center items-center text-9xl"
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.5, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {solutions[activeIndex]?.icon}
          </motion.div>

          {/* Conteneur des textes qui défilent horizontalement */}
          <div className="w-2/3 overflow-hidden">
            <div ref={containerRef} className="flex w-full">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="solution-card min-w-full flex flex-col justify-center px-10"
                >
                  <motion.h2
                    className="text-5xl font-bold text-[#00202B] mb-4"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                  >
                    {solution.title}
                  </motion.h2>
                  <motion.p
                    className="text-xl text-gray-700"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  >
                    {solution.description}
                  </motion.p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

   {/* SECTION EN QUINCONCE AVEC AOS */}
        <div className="max-w-6xl mx-auto py-32 space-y-24">
        {solutions.map((solution, index) => (
            <div
            key={index}
            className={`flex flex-col md:flex-row items-center ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
            }`}
            data-aos={index % 2 === 0 ? 'fade-left' : 'fade-right'}
            >
            {/* Icône */}
            <div className="w-28 h-24 text-6xl flex items-center justify-center bg-[#FFFFFF] text-white rounded-full shadow-lg">
                {solution.icon}
            </div>

            {/* Texte */}
            <div className="md:w-2/3 p-6">
                <h3 className="text-4xl font-bold text-[#00202B]">{solution.title}</h3>
                <p className="text-lg text-gray-700 mt-2">
                {/* Description modifiée pour chaque solution */}
                {solution.title === 'Analyse' && (
                    <>
                    Notre outil effectue une analyse approfondie de votre site web, en inspectant chaque ligne de code, chaque requête et chaque ressource. Grâce à des algorithmes avancés et une base de données constamment mise à jour sur les vulnérabilités connues, nous détectons les failles potentielles comme les injections SQL, les failles XSS, les erreurs de configuration et les permissions mal sécurisées. Cette étape est cruciale pour obtenir une vue détaillée des risques présents sur votre site avant qu’ils ne soient exploités par des attaquants.
                    </>
                )}
                {solution.title === 'Détecte' && (
                    <>
                    Une fois l’analyse terminée, notre système met en lumière les vulnérabilités détectées en les classant par niveau de criticité. Nous identifions les portes d’entrée potentielles pour les hackers et établissons une cartographie complète des menaces affectant votre plateforme. Chaque problème est documenté avec des explications détaillées, des scénarios d’exploitation possibles et des recommandations pour y remédier. Vous saurez ainsi exactement où agir en priorité pour sécuriser efficacement votre site.
                    </>
                )}
                {solution.title === 'Corrige' && (
                    <>
                    La dernière étape consiste à appliquer des correctifs adaptés aux failles détectées. Nous fournissons des recommandations précises et personnalisées, allant de simples ajustements de configuration à des modifications plus complexes du code. Nous vous guidons sur les meilleures pratiques en matière de cybersécurité et proposons des solutions adaptées à votre environnement technique. L’objectif est de rendre votre site résilient face aux attaques et de garantir une protection continue contre les nouvelles menaces émergentes.
                    </>
                )}
                </p>
            </div>
            </div>
        ))}
        </div>
    </section>
  );
}
