"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import AOS from "aos";
import "aos/dist/aos.css"; // Importer le style AOS
import { FaStar } from "react-icons/fa"; // Import d'une icône pour le rôle

const teamMembers = [
  {
    name: "Thibaut Jager",
    role: "Développeur Back-End & Expert Docker",
    image: "/images/team/tibau.webp",
    description:
      "Spécialiste back-end et Docker, Thibaut développe des scripts robustes et optimise les environnements d'exécution.",
  },
  {
    name: "Antoine Beaudoux",
    role: "Développeur Full-Stack",
    image: "/images/team/antoine.webp",
    description:
      "Antoine intervient sur le front et le back avec une attention particulière aux enjeux de sécurité applicative.",
  },
  {
    name: "Hugo Kerivel Larrivière",
    role: "Développeur Back-End & Automation & Scripting",
    image: "/images/team/hugo.webp",
    description:
      "Hugo conçoit des scripts performants côté serveur pour automatiser les audits et les tests de sécurité.",
  },
  {
    name: "Lucas Laruelle",
    role: "Développeur Back-End & Pentest Script",
    image: "/images/team/lucas.webp",
    description:
      "Lucas développe des outils d’analyse de vulnérabilités et participe à l’automatisation des tests d’intrusion.",
  },
  {
    name: "Nicolas Corlan",
    role: "Développeur Back-End & Scripting Sécurité",
    image: "/images/team/nico.webp",
    description:
      "Nicolas crée des scripts de détection et contribue au développement back-end des outils d’audit.",
  },
  {
    name: "Edmond Loembe",
    role: "Développeur Full-Stack",
    image: "/images/team/edmond.webp",
    description:
      "Edmond gère le développement front et back, en assurant la fluidité et la sécurité des interfaces web.",
  },
  {
    name: "Morgan FRARY",
    role: "Chef de Projet Cybersécurité",
    image: "/images/team/morgan.webp",
    description:
      "Morgan coordonne les projets d’audit de sécurité, de la planification à la livraison des rapports techniques.",
  },
  {
    name: "Hajer Braham",
    role: "Développeuse Back-End",
    image: "/images/team/hajer.webp",
    description:
      "Hajer développe des modules back-end pour l’analyse de sécurité et participe à l’intégration des résultats d’audit.",
  },
  {
    name: "Sarah Delahaye",
    role: "Développeuse Back-End & Docker",
    image: "/images/team/sarah.webp",
    description:
      "Sarah gère le back-end et les environnements Docker pour garantir des déploiements sécurisés et reproductibles.",
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
            data-aos={index % 2 === 0 ? "fade-left" : "fade-right"}
            className={`flex items-center justify-between rounded-2xl bg-[#00202B] p-10 text-[#F8F2E2] shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl ${index % 2 === 0 ? "mr-40 flex-row" : "ml-40 flex-row-reverse"}`}
          >
            {/* Image */}
            <Image
              src={member.image}
              alt={member.name}
              width={128}
              height={128}
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
