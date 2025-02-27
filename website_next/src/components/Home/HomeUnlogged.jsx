import React from 'react';
import Authentification from '../Authentification';
import Team from '@/components/Team/index';

export default function HomeUnlogged() {
  return (
    <div>
      <Authentification />
      <Team />
    </div>
  );
}
