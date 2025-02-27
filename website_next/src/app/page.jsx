/* eslint-disable prettier/prettier */

'use client';

import HomeLogged from '@/components/Home/HomeLogged';
import HomeUnlogged from '@/components/Home/HomeUnlogged';

export default function Index() {
  const isLogged = false;

  return (
    <>
      {isLogged ? <HomeLogged /> : <HomeUnlogged />}
    </>
  );
}

