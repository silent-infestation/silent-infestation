/* eslint-disable prettier/prettier */

import React from 'react';
import Authentification from '../Authentification';
import Team from '@/components/Team/index';
import Header from '@/components/Header/Header';

export default function HomeUnlogged() {
  return (
    <div>
      <Header />
      <Authentification />
      <Team />
    </div>
  );
}
