'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/status', { credentials: 'include' });
        const data = await res.json();

        if (data.authenticated) {
          setIsAuthenticated(true);

          const savedPage = sessionStorage.getItem('activePage');
          if (savedPage) {
            changeActivePage(savedPage);
          } else {
            changeActivePage('profile');
          }
        } else {
          setIsAuthenticated(false);
          changeActivePage('home');
        }
      } catch (error) {
        console.error("Erreur de vérification d'auth:", error);
        setIsAuthenticated(false);
        changeActivePage('home');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated !== null && activePage !== null) {
      sessionStorage.setItem('activePage', activePage);
    }
  }, [activePage, isAuthenticated, loading]);

  const login = () => {
    setIsAuthenticated(true);
    changeActivePage('profile'); // Rediriger après connexion
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setIsAuthenticated(false);
    changeActivePage('home');
  };

  const changeActivePage = (page) => {
    setActivePage(page);
    sessionStorage.setItem('activePage', page);
    window.scrollTo(0, 0);
  };

  return (
    <AppContext.Provider
      value={{ isAuthenticated, activePage, changeActivePage, login, logout, loading }}
    >
      {!loading && children} {/* Empêcher le rendu tant que l'auth n'est pas vérifiée */}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
