"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => setIsAuthenticated(false);
  const handleLogin = () => setIsAuthenticated(true);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed w-full top-0 left-0 bg-[#00202b] backdrop-blur-md shadow-md text-[#f8f2e2] px-6 py-4 flex justify-between items-center z-50">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/images/logo.jpg"
            alt="Logo"
            width={60}
            height={60}
            className="cursor-pointer rounded-lg"
          />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8 text-lg">
        {isAuthenticated && (
          <>
            <Link href="/profile" className="text-[#F8F2E2] hover:text-[#F5F5F5] transition duration-300">Profil</Link>
            <Link href="/history" className="text-[#F8F2E2] hover:text-[#F5F5F5] transition duration-300">Historique</Link>
            <Link href="/contact" className="text-[#F8F2E2] hover:text-[#F5F5F5] transition duration-300">Contact</Link>
          </>
        )}
      </div>

      {/* Auth Buttons */}
      <div className="hidden md:flex gap-4">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="bg-[#f8f2e2] text-[#00202b] px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
          >
            Déconnexion
          </button>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className="bg-[#f8f2e2] text-[#00202b] px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              Connexion
            </button>
            <button
              className="bg-[#f8f2e2] text-[#00202b] px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              Inscription
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden text-2xl" onClick={toggleMenu}>
        {isMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#00202b] text-center flex flex-col gap-6 py-6 md:hidden">
          {isAuthenticated && (
            <>
              <Link href="/profile" className="text-lg hover:text-[#58C4DD] transition">Profil</Link>
              <Link href="/history" className="text-lg hover:text-[#58C4DD] transition">Historique</Link>
              <Link href="/contact" className="text-lg hover:text-[#58C4DD] transition">Contact</Link>
            </>
          )}
          <div className="mt-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-[#f8f2e2] text-[#00202b] px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Déconnexion
              </button>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="bg-[#f8f2e2] text-[#00202b] px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition block w-full"
                >
                  Connexion
                </button>
                <button
                  className="bg-[#58C4DD] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#46A3C3] transition block w-full mt-2"
                >
                  Inscription
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
