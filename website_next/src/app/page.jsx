"use client";

import Contact from "@/components/Contact";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Team from "@/components/Team";
import Login from "@/components/Home/Authentification/Login";
import Register from "@/components/Home/Authentification/Register";

export default function Index() {
  return (
    <>
    <Navbar />
    <Register />
        <Login />
        {/* <Team />
      <Contact /> */}
    <Footer />
    </>
  );
}
