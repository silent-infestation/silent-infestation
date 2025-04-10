"use client";

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css"; // Importer le style AOS

const About = () => {
  // Initialisation d'AOS une fois le composant monté
  useEffect(() => {
    AOS.init({
      duration: 1000, // Durée de l'animation
      once: true, // L'animation se déclenche uniquement une fois
    });
  }, []);

  return (
    <section className="about-section bg-[#DCF0FF] py-16">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="mb-12 text-center text-4xl font-bold text-[#05829E]">
          <span className="text-[#00202B]">À propos de</span> Nous
        </h1>

        {/* Section Qui sommes-nous ? */}
        <div data-aos="zoom-in-up" className="who-are-we mb-12">
          <div className="card rounded-lg bg-[#00202B] p-6 shadow-xl transition-shadow hover:shadow-2xl">
            <h2 className="mb-6 text-3xl font-semibold text-[#F8F2E2]">Qui sommes-nous ?</h2>
            <p className="text-lg leading-relaxed text-[#F8F2E2]">
              Nous sommes une équipe de développeurs passionnés, tous issus de l’école Epitech, une
              référence en informatique en France. Forts de notre expertise, nous avons créé cette
              plateforme pour aider les entreprises et particuliers à tester la sécurité de leurs
              solutions internet.
            </p>
          </div>
        </div>

        {/* Section Notre mission */}
        <div data-aos="zoom-in-left" data-aos-delay="200" className="our-mission mb-12">
          <div className="card rounded-lg bg-[#00202B] p-6 shadow-xl transition-shadow hover:shadow-2xl">
            <h2 className="mb-6 text-3xl font-semibold text-[#F8F2E2]">Notre mission</h2>
            <p className="text-lg leading-relaxed text-[#F8F2E2]">
              Notre objectif est de rendre la sécurité numérique accessible à tous. Nous offrons des
              outils simples et efficaces pour détecter les vulnérabilités dans vos systèmes et vous
              fournir des recommandations pour les corriger.
            </p>
          </div>
        </div>

        {/* Section Nos services */}
        <div data-aos="zoom-in-right" data-aos-delay="400" className="our-services mb-12">
          <div className="card rounded-lg bg-[#00202B] p-6 shadow-xl transition-shadow hover:shadow-2xl">
            <h2 className="mb-6 text-3xl font-semibold text-[#F8F2E2]">Nos services</h2>
            <p className="mb-6 text-lg leading-relaxed text-[#F8F2E2]">
              Nous proposons une gamme de tests, allant de l&apos;analyse de vulnérabilités à des
              tests de pénétration approfondis. Chaque rapport que nous fournissons est détaillé et
              personnalisé pour répondre aux besoins spécifiques de nos utilisateurs.
            </p>
          </div>
        </div>

        {/* Section Pourquoi nous choisir ? */}
        <div data-aos="zoom-in" data-aos-delay="600" className="why-choose-us mb-12">
          <div className="card rounded-lg bg-[#00202B] p-6 shadow-xl transition-shadow hover:shadow-2xl">
            <h2 className="mb-6 text-3xl font-semibold text-[#F8F2E2]">Pourquoi nous choisir ?</h2>
            <p className="text-lg leading-relaxed text-[#F8F2E2]">
              Notre expertise technique, alliée à une solide formation en sécurité, garantit des
              résultats fiables et précis. Nous nous engageons à protéger vos données et à vous
              offrir des solutions concrètes pour améliorer la sécurité de vos systèmes.
            </p>
          </div>
        </div>

        {/* Section Engagement envers la confidentialité */}
        <div data-aos="zoom-out" data-aos-delay="800" className="privacy-commitment mb-12">
          <div className="card rounded-lg bg-[#00202B] p-6 shadow-xl transition-shadow hover:shadow-2xl">
            <h2 className="mb-6 text-3xl font-semibold text-[#F8F2E2]">
              Engagement envers la confidentialité
            </h2>
            <p className="text-lg leading-relaxed text-[#F8F2E2]">
              Nous prenons la confidentialité très au sérieux. Toutes les informations que vous
              partagez avec nous sont strictement sécurisées et utilisées uniquement pour les tests
              de sécurité.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
