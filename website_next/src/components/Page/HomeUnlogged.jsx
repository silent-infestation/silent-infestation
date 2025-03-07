'use client';

import Team from '@/components/Team/index';
import Header from '@/components/Header/Header';
import About from '@/components/About/About';
import Solution from '@/components/Solution/Solution';
import Rgpd from '@/components/Rgpd/Rgpd';
import ArrowSeparatorLeft from '@/components/_ui/Arrow/ArrowSeparatorLeft';
import ArrowSeparatorRight from '@/components/_ui/Arrow/ArrowSeparatorRight';

export default function HomeUnlogged() {
  return (
    <div>
        <Header />
        <ArrowSeparatorLeft />
        <About />
        <ArrowSeparatorRight />
        <Solution />
        <ArrowSeparatorLeft />
        <Rgpd />
        <ArrowSeparatorRight />
        <Team />
    </div>
  );
}
