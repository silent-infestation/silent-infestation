/* eslint-disable prettier/prettier */

'use client';

import { useAppContext } from './context/AppContext';
import HomeLogged from '@/components/Page/HomeLogged';
import HomeUnlogged from '@/components/Page/HomeUnlogged';
import Contact from '@/components/Contact';
import Profile from '@/components/Page/Profile';

export default function Index() {
  const { activePage, isAuthenticated } = useAppContext();

  return (
    <>
      {activePage === 'home' && <HomeLogged />}
      {activePage === 'authentification' && <HomeUnlogged />}
      {activePage === 'contact' && isAuthenticated && <Contact />}
      {activePage === 'profile' && isAuthenticated && <Profile />}
      {activePage === 'history' && isAuthenticated && <Contact />}
    </>
  );
}
