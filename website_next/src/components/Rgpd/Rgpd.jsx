"use client";

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useAppContext } from "@/app/context/AppContext";


export default function Rgpd() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const { changeActivePage } = useAppContext();


  const handleGoToContact = () => {
    changeActivePage("contact");
    setShowPopup(false);
  };

  return (
    <section className="relative flex w-full flex-col items-center bg-[#DCF0FF] py-32">
      {/* Titre avec animation */}
      <h1 className="text-5xl font-bold text-black" data-aos="zoom-out-right">
        Notre engagement <span className="text-[#05829E]">RGPD</span>
      </h1>

      {/* Description avec animation fade */}
      <p className="mt-6 max-w-4xl px-4 text-center text-lg text-[#00202B]" data-aos="fade-up">
        Nous nous engageons à respecter la confidentialité et la sécurité des données personnelles
        de nos utilisateurs. Notre plateforme d&apos;audit web respecte pleinement le RGPD, assurant
        une transparence totale dans la collecte et le traitement des informations.
      </p>

      {/* Engagements RGPD avec animation */}
      <div className="mt-12 max-w-6xl space-y-8 px-4">
        <div className="flex items-center space-x-4" data-aos="fade-right">
          <div className="text-4xl text-[#05829E]">🔒</div>
          <div className="text-xl text-[#00202B]">
            Nous assurons la protection des données personnelles de nos utilisateurs.
          </div>
        </div>
        <div className="flex items-center space-x-4" data-aos="fade-left">
          <div className="text-4xl text-[#05829E]">📊</div>
          <div className="text-xl text-[#00202B]">
            Toutes les données collectées sont utilisées de manière transparente et responsable.
          </div>
        </div>
        <div className="flex items-center space-x-4" data-aos="fade-right">
          <div className="text-4xl text-[#05829E]">🔐</div>
          <div className="text-xl text-[#00202B]">
            Nous appliquons des mesures de sécurité strictes pour protéger vos informations.
          </div>
        </div>
      </div>

      {/* Call to Action (CTA) */}
      <div className="mt-12 text-center" data-aos="fade-up">
        <a
          onClick={handleGoToContact}
          className="rounded-full bg-[#05829E] px-8 py-4 text-xl font-semibold text-white transition-colors hover:bg-[#026A72] cursor-pointer"
        >
          Contactez-nous pour en savoir plus sur notre conformité RGPD
        </a>
      </div>
    </section>
  );
}
