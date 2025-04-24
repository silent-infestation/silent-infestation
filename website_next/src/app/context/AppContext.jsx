"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext();

const PUBLIC_PAGES = ["home", "authentification"];
const DEFAULT_PUBLIC_PAGE = "home";
const DEFAULT_PRIVATE_PAGE = "profile";

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedPage = sessionStorage.getItem("activePage");

      try {
        const res = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        const { authenticated } = await res.json();
        if (res.ok && authenticated) {
          setIsAuthenticated(true);

          const targetPage = savedPage || DEFAULT_PRIVATE_PAGE;
          changeActivePage(targetPage);
        } else {
          setIsAuthenticated(false);

          const targetPage =
            savedPage && PUBLIC_PAGES.includes(savedPage) ? savedPage : DEFAULT_PUBLIC_PAGE;

          changeActivePage(targetPage);
        }
      } catch (error) {
        console.error("Erreur de vérification d'auth:", error);
        setIsAuthenticated(false);

        const targetPage =
          savedPage && PUBLIC_PAGES.includes(savedPage) ? savedPage : DEFAULT_PUBLIC_PAGE;

        changeActivePage(targetPage);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated !== null && activePage !== null) {
      sessionStorage.setItem("activePage", activePage);
    }
  }, [activePage, isAuthenticated, loading]);

  const login = () => {
    setIsAuthenticated(true);
    changeActivePage(DEFAULT_PRIVATE_PAGE);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    changeActivePage(DEFAULT_PUBLIC_PAGE);
  };

  const changeActivePage = (page) => {
    setActivePage(page);
    sessionStorage.setItem("activePage", page);
    window.scrollTo(0, 0);
  };

  return (
    <AppContext.Provider
      value={{ isAuthenticated, activePage, changeActivePage, login, logout, loading }}
    >
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
