'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => setIsAuthenticated(false);
  const handleLogin = () => setIsAuthenticated(true);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-[#00202b] px-6 py-6 text-[#f8f2e2] shadow-md backdrop-blur-md">
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
      <div className="hidden gap-8 text-lg md:flex">
        {isAuthenticated && (
          <>
            <Link
              href="/profile"
              className="text-[#F8F2E2] transition duration-300 hover:text-[#F5F5F5]"
            >
              Profil
            </Link>
            <Link
              href="/history"
              className="text-[#F8F2E2] transition duration-300 hover:text-[#F5F5F5]"
            >
              Historique
            </Link>
            <Link
              href="/contact"
              className="text-[#F8F2E2] transition duration-300 hover:text-[#F5F5F5]"
            >
              Contact
            </Link>
          </>
        )}
      </div>

      {/* Auth Buttons */}
      <div className="hidden gap-4 md:flex">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
          >
            Déconnexion
          </button>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
            >
              Connexion
            </button>
            <button className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300">
              Inscription
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="text-2xl md:hidden" onClick={toggleMenu}>
        {isMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute left-0 top-16 flex w-full flex-col gap-6 bg-[#00202b] py-6 text-center md:hidden">
          {isAuthenticated && (
            <>
              <Link href="/profile" className="text-lg transition hover:text-[#58C4DD]">
                Profil
              </Link>
              <Link href="/history" className="text-lg transition hover:text-[#58C4DD]">
                Historique
              </Link>
              <Link href="/contact" className="text-lg transition hover:text-[#58C4DD]">
                Contact
              </Link>
            </>
          )}
          <div className="mt-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
              >
                Déconnexion
              </button>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="block w-full rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
                >
                  Connexion
                </button>
                <button className="mt-2 block w-full rounded-lg bg-[#58C4DD] px-4 py-2 font-bold text-white transition hover:bg-[#46A3C3]">
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
