/* eslint-disable prettier/prettier */

"use client";

import { useAppContext } from "./context/AppContext";
import AuthPage from "@/components/Page/AuthPage";
import HomeUnlogged from "@/components/Page/HomeUnlogged";
import Contact from "@/components/Contact";
import Profile from "@/components/Page/Profile";
import History from "@/components/Page/History";
import HelpModal from "@/components/_ui/HelpModal/HelpModal";

const tipsMap = {
  home: {
    title: "Bienvenue !",
    text: "Découvrez notre page d’accueil avec toutes les infos utiles.",
    imageSrc:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNiM2NhM3l4em5jOWFycGZqbWl0bXZ2bGh6N2t2Z2k4bzN4NXNxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3odxflN8NqzeSIRyvb/giphy.gif",
  },
  authentification: {
    title: "Connexion rapide",
    text: "Entrez vos identifiants pour accéder à toutes les fonctionnalités.",
    imageSrc:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNiM2NhM3l4em5jOWFycGZqbWl0bXZ2bGh6N2t2Z2k4bzN4NXNxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3odxflN8NqzeSIRyvb/giphy.gif",
  },
  contact: {
    title: "Besoin d’aide ?",
    text: "Remplissez le formulaire et nous vous répondrons rapidement.",
    imageSrc:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNiM2NhM3l4em5jOWFycGZqbWl0bXZ2bGh6N2t2Z2k4bzN4NXNxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3odxflN8NqzeSIRyvb/giphy.gif",
  },
  profile: {
    title: "Votre profil",
    text: "Mettez à jour vos informations personnelles ici.",
    imageSrc:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNiM2NhM3l4em5jOWFycGZqbWl0bXZ2bGh6N2t2Z2k4bzN4NXNxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3odxflN8NqzeSIRyvb/giphy.gif",
  },
  history: {
    title: "Historique",
    text: "Consultez vos dernières activités et actions passées.",
    imageSrc:
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNiM2NhM3l4em5jOWFycGZqbWl0bXZ2bGh6N2t2Z2k4bzN4NXNxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3odxflN8NqzeSIRyvb/giphy.gif",
  },
};

export default function Index() {
  const { activePage, isAuthenticated } = useAppContext();
  const tip = tipsMap[activePage];

  const pageMap = {
    home: <HomeUnlogged />,
    authentification: <AuthPage />,
    contact: isAuthenticated ? <Contact /> : null,
    profile: isAuthenticated ? <Profile /> : null,
    history: isAuthenticated ? <History /> : null,
  };

  return (
    <>
      {pageMap[activePage] || <HomeUnlogged />}
      {tip && (
        <HelpModal
          imageSrc={tipsMap[activePage]?.imageSrc}
          title={tipsMap[activePage]?.title}
          text={tipsMap[activePage]?.text}
        />
      )}
    </>
  );
}
