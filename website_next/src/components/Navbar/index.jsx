"use client";

import { useAppContext } from "@/app/context/AppContext";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { key: "home", label: "Accueil" },
  { key: "profile", label: "Profil" },
  { key: "history", label: "Historique" },
  { key: "contact", label: "Contact" },
];

const Navbar = () => {
  const { isAuthenticated, changeActivePage, logout, activePage } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  const containerRef = useRef(null);
  const textRefs = {};
  navItems.forEach(({ key }) => {
    textRefs[key] = useRef(null);
  });

  useEffect(() => {
    const el = textRefs[activePage]?.current;
    const container = containerRef.current;

    if (el && container) {
      const textWidth = el.offsetWidth;
      const textRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setSliderStyle({
        left: textRect.left - containerRect.left - textWidth * 0.1,
        width: textWidth * 1.2,
      });
    }
  }, [activePage]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-[#00202b] px-6 py-6 text-[#f8f2e2] shadow-md backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center">
        <button onClick={() => changeActivePage("home")}>
          <Image
            src="/images/logo.jpg"
            alt="Logo"
            width={60}
            height={60}
            className="cursor-pointer rounded-lg"
          />
        </button>
      </div>

      {/* Desktop Navigation */}
      {isAuthenticated && (
        <div ref={containerRef} className="relative hidden text-lg md:flex md:gap-x-[30px]">
          {/* Barre animée */}
          <div
            className="absolute bottom-0 h-[3px] bg-[#71b9cf] transition-all duration-300"
            style={{
              left: `${sliderStyle.left}px`,
              width: `${sliderStyle.width}px`,
            }}
          />
          {isAuthenticated &&
            navItems.map(({ key, label }) => (
              <div key={key} className="min-w-[120px] text-center">
                <button
                  onClick={() => changeActivePage(key)}
                  className={`w-full transition ${
                    activePage === key
                      ? "mb-2 text-2xl font-bold text-[#71b9cf]"
                      : "hover:text-[#F5F5F5]"
                  }`}
                >
                  <span ref={textRefs[key]} className="inline-block">
                    {label}
                  </span>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Auth Buttons */}
      <div className="hidden gap-4 md:flex">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="rounded-lg bg-white px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
          >
            Déconnexion
          </button>
        ) : (
          activePage !== "authentification" &&
          isAuthenticated === false && (
            <button
              onClick={() => changeActivePage("authentification")}
              className="rounded-lg bg-white px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
            >
              Connexion
            </button>
          )
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="text-2xl md:hidden" onClick={toggleMenu}>
        {isMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute left-0 top-16 mt-[20px] flex w-full flex-col gap-6 bg-[#00202b] py-6 text-center md:hidden">
          {isAuthenticated && (
            <>
              {navItems.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    changeActivePage(key);
                    setIsMenuOpen(false);
                  }}
                  className={`text-lg transition ${
                    activePage === key ? "text-xl font-bold text-[#71b9cf]" : "hover:text-[#58C4DD]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
