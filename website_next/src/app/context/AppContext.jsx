'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie'; // Utilisation d'une lib pour lire les cookies

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      setIsAuthenticated(true);

      const savedPage = sessionStorage.getItem('activePage') || 'home';
      setActivePage(savedPage);
    } else {
      setIsAuthenticated(false);
      setActivePage('home');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('activePage', activePage);
    }
  }, [activePage, isAuthenticated]);

  const login = () => {
    setIsAuthenticated(true);
    setActivePage('profile');
  };

  const logout = () => {
    Cookies.remove('authToken');
    setIsAuthenticated(false);
    setActivePage('home');
  };

  return (
    <AppContext.Provider value={{ isAuthenticated, activePage, setActivePage, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
