/* eslint-disable prettier/prettier */

'use client';

import { useAppContext } from './context/AppContext';
import HomeLogged from '@/components/Home/HomeLogged';
import HomeUnlogged from '@/components/Home/HomeUnlogged';
import Contact from '@/components/Contact';

export default function Index() {
  const { activePage, isAuthenticated } = useAppContext();

  return (
    <>
      {activePage === 'home' && <HomeUnlogged />}
      {activePage === 'profile' && isAuthenticated && <HomeLogged />}
      {activePage === 'history' && isAuthenticated && <HomeLogged />}
      {activePage === 'contact' && <Contact />}
    </>
  );
}
