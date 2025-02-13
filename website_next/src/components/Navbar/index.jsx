"use client";

import { useState } from "react";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";
import Login from "@/components/Home/authentification/Login";
import Register from "@/components/Home/authentification/Register";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveComponent(null);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const renderAuthComponent = () => {
    if (activeComponent === 'login') return <Login />;
    if (activeComponent === 'register') return <Register />;
    return null;
  };

  return (
    <div>
      <nav className="fixed w-full top-0 left-0 bg-[#00202b] text-[#f8f2e2] px-6 py-4 flex justify-between items-center z-50">
        <Image src="/images/logo.jpg" alt="Logo" width={60} height={60} className="rounded-lg cursor-pointer" />

        <div className="hidden md:flex gap-4">
          {isAuthenticated ? (
            <button onClick={handleLogout}>Déconnexion</button>
          ) : (
            <>
              <button onClick={() => setActiveComponent('login')}>Connexion</button>
              <button onClick={() => setActiveComponent('register')}>Inscription</button>
            </>
          )}
        </div>

        <button className="md:hidden text-2xl" onClick={toggleMenu}>{isMenuOpen ? <FiX /> : <FiMenu />}</button>
      </nav>

      <div className="mt-20">{renderAuthComponent()}</div>
    </div>
  );
};

export default Navbar;
