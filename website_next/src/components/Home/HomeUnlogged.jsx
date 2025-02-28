/* eslint-disable prettier/prettier */

import React from 'react';
import Authentification from '../Authentification';
import Team from '@/components/Team/index';
import Header from '@/components/Header/Header';
import About from '@/components/About/About';
import ArrowSeparatorLeft from '@/components/_ui/Arrow/ArrowSeparatorLeft';
import ArrowSeparatorRight from '@/components/_ui/Arrow/ArrowSeparatorRight';

export default function HomeUnlogged() {
  return (
    <div>
      <Header />
      <ArrowSeparatorLeft />
      <About />
      <ArrowSeparatorRight />
      <Authentification />
      <Team />
    </div>
  );
}
