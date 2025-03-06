'use client';

import { useAppContext } from '@/app/context/AppContext';
import Image from 'next/image';
import { FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, changeActivePage, logout, activePage } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-[#00202b] px-6 py-6 text-[#f8f2e2] shadow-md backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center">
        <button onClick={() => changeActivePage('home')}>
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
      <div className="hidden gap-8 text-lg md:flex">
        {isAuthenticated && (
          <>
            <button
              onClick={() => changeActivePage('profile')}
              className="transition hover:text-[#F5F5F5]"
            >
              Profil
            </button>
            <button
              onClick={() => changeActivePage('history')}
              className="transition hover:text-[#F5F5F5]"
            >
              Historique
            </button>
            <button
              onClick={() => changeActivePage('contact')}
              className="transition hover:text-[#F5F5F5]"
            >
              Contact
            </button>
          </>
        )}
      </div>

      {/* Auth Buttons */}
      <div className="hidden gap-4 md:flex">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
          >
            Déconnexion
          </button>
        ) : (
          activePage !== 'authentification' &&
          isAuthenticated === false && (
            <button
              onClick={() => changeActivePage('authentification')}
              className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
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
        <div className="absolute left-0 top-16 flex w-full flex-col gap-6 bg-[#00202b] py-6 text-center md:hidden">
          {isAuthenticated && (
            <>
              <button
                onClick={() => changeActivePage('profile')}
                className="text-lg transition hover:text-[#58C4DD]"
              >
                Profil
              </button>
              <button
                onClick={() => changeActivePage('history')}
                className="text-lg transition hover:text-[#58C4DD]"
              >
                Historique
              </button>
              <button
                onClick={() => changeActivePage('contact')}
                className="text-lg transition hover:text-[#58C4DD]"
              >
                Contact
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
