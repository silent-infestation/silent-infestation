/* eslint-disable prettier/prettier */

'use client';

import { useAppContext } from './context/AppContext';
import AuthPage from '@/components/Page/AuthPage';
import HomeUnlogged from '@/components/Page/HomeUnlogged';
import Contact from '@/components/Contact';
import Profile from '@/components/Page/Profile';

export default function Index() {
  const { activePage, isAuthenticated } = useAppContext();

  const pageMap = {
    home: <HomeUnlogged />,
    authentification: <AuthPage />,
    contact: isAuthenticated ? <Contact /> : null,
    profile: isAuthenticated ? <Profile /> : null,
    history: isAuthenticated ? <Contact /> : null,
  };

  return <>{pageMap[activePage] || <HomeUnlogged />}</>;
}
