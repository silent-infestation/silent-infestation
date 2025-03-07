'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Importer le style AOS
import { FaStar } from 'react-icons/fa'; // Import d'une icône pour le rôle

const teamMembers = [
  {
    name: 'Thibaut Jager',
    role: 'CEO',
    image: '/images/team/tibau.webp',
    description:
      "Visionnaire et leader inspirant, Thibaut dirige l'entreprise avec passion et détermination.",
  },
  {
    name: 'Antoine Beaudoux',
    role: 'CTO',
    image: '/images/team/antoine.webp',
    description: 'Expert en technologies, Antoine supervise les innovations techniques.',
  },
  {
    name: 'Hugo Kerivel Larrivière',
    role: 'Designer',
    image: '/images/team/hugo.webp',
    description: 'Créatif et passionné, Hugo conçoit des designs uniques et élégants.',
  },
  {
    name: 'Lucas Laruelle',
    role: 'Développeur',
    image: '/images/team/lucas.webp',
    description: 'Développeur talentueux, Lucas code avec rigueur et ingéniosité.',
  },
  {
    name: 'Nicolas Corlan',
    role: 'Marketing',
    image: '/images/team/nico.webp',
    description: 'Stratège marketing, Nicolas donne vie à la marque grâce à ses idées percutantes.',
  },
  {
    name: 'Edmond Loembe',
    role: 'Product Manager',
    image: '/images/team/edmond.webp',
    description: "Edmond gère les produits avec une approche centrée sur l'utilisateur.",
  },
  {
    name: 'Morgan FRARY',
    role: 'HR Manager',
    image: '/images/team/morgan.webp',
    description: "Expert en ressources humaines, Morgan veille au bien-être de l'équipe.",
  },
  {
    name: 'Hajer Braham',
    role: 'Support',
    image: '/images/team/hajer.webp',
    description: "À l'écoute des clients, Hajer assure un support efficace et rapide.",
  },
  {
    name: 'Sarah Delahaye',
    role: 'Support',
    image: '/images/team/sarah.webp',
    description:
      'Sarah est toujours disponible pour aider les clients avec patience et efficacité.',
  },
];

export default function Team() {
  // Initi import Team from '../Team'alisation d'AOS après le premier rendu du composant
  useEffect(() => {
    AOS.init({
      duration: 1000, // Durée de l'animation
      once: true, // L'animation ne se répète qu'une fois
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-10">
      {/* Arrière-plan texturé pour éviter le vide */}

      <h1 className="mb-10 text-center text-4xl font-bold">
        <span className="text-[#00202B]">Notre</span> <span className="text-[#05829E]">Équipe</span>
      </h1>

      <div className="flex w-full max-w-4xl flex-col gap-8">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            data-aos={index % 2 === 0 ? 'fade-left' : 'fade-right'}
            className={`flex items-center justify-between rounded-2xl bg-[#00202B] p-10 text-[#F8F2E2] shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl ${index % 2 === 0 ? 'mr-40 flex-row' : 'ml-40 flex-row-reverse'}`}
          >
            {/* Image */}
            <img
              src={member.image}
              alt={member.name}
              className="h-32 w-32 rounded-full border-4 border-[#F8F2E2] object-cover shadow-md"
            />

            {/* Infos texte */}
            <div className="max-w-lg px-6 text-left">
              <h2 className="text-2xl font-semibold">{member.name}</h2>

              {/* Rôle avec icône */}
              <div className="flex items-center gap-2 font-medium text-[#58C4DD]">
                <FaStar className="text-yellow-400" />
                {member.role}
              </div>

              {/* Ligne de séparation subtile */}
              <div className="my-2 border-b border-gray-400/50"></div>

              {/* Description */}
              <p className="mt-2 text-[#F8F2E2]">{member.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
