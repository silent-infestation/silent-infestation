"use client";

import { useState } from "react";
import Login from "../Authentification/Login";
import Register from "../Authentification/Register";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-screen flex-col items-center p-4">
      <div className="relative mb-10 mt-32 w-full max-w-sm border-b border-gray-300">
        {/* Barre animée */}
        <span
          data-testid="animated-bar"
          className="absolute bottom-0 h-[3px] bg-[#05829e] transition-all duration-300"
          style={{
            width: "50%",
            left: isLogin ? "0%" : "50%",
          }}
        />

        <div className="flex w-full">
          {/* Connexion */}
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 pb-2 text-center transition-all duration-300 ${
              isLogin
                ? "text-2xl font-bold text-[#05829e]"
                : "text-base text-gray-500 hover:text-[#05829e]"
            }`}
          >
            Connexion
          </button>

          {/* Inscription */}
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 pb-2 text-center transition-all duration-300 ${
              !isLogin
                ? "text-2xl font-bold text-[#05829e]"
                : "text-base text-gray-500 hover:text-[#05829e]"
            }`}
          >
            Inscription
          </button>
        </div>
      </div>

      <div className="w-full transition-all duration-500">{isLogin ? <Login /> : <Register />}</div>
    </div>
  );
}
