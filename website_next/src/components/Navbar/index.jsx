'use client';

import { useAppContext } from '@/app/context/AppContext';
import Image from 'next/image';
import { FiMenu, FiX } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, setActivePage, login, logout } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState(isAuthenticated);

  useEffect(() => {
    // Mettre à jour l'état local quand `isAuthenticated` change
    setAuthState(isAuthenticated);
  }, [isAuthenticated]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-[#00202b] px-6 py-6 text-[#f8f2e2] shadow-md backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center">
        <button onClick={() => setActivePage('home')}>
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
        {authState && (
          <>
            <button
              onClick={() => setActivePage('profile')}
              className="transition hover:text-[#F5F5F5]"
            >
              Profil
            </button>
            <button
              onClick={() => setActivePage('history')}
              className="transition hover:text-[#F5F5F5]"
            >
              Historique
            </button>
            <button
              onClick={() => setActivePage('contact')}
              className="transition hover:text-[#F5F5F5]"
            >
              Contact
            </button>
          </>
        )}
      </div>

      {/* Auth Buttons */}
      <div className="hidden gap-4 md:flex">
        {authState ? (
          <button
            onClick={logout}
            className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
          >
            Déconnexion
          </button>
        ) : (
          <button
            onClick={login}
            className="rounded-lg bg-[#f8f2e2] px-4 py-2 font-bold text-[#00202b] transition hover:bg-gray-300"
          >
            Connexion
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="text-2xl md:hidden" onClick={toggleMenu}>
        {isMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute left-0 top-16 flex w-full flex-col gap-6 bg-[#00202b] py-6 text-center md:hidden">
          {authState && (
            <>
              <button
                onClick={() => setActivePage('profile')}
                className="text-lg transition hover:text-[#58C4DD]"
              >
                Profil
              </button>
              <button
                onClick={() => setActivePage('history')}
                className="text-lg transition hover:text-[#58C4DD]"
              >
                Historique
              </button>
              <button
                onClick={() => setActivePage('contact')}
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
