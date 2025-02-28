/* eslint-disable prettier/prettier */

'use client';

import HomeLogged from '@/components/Home/HomeLogged';
import HomeUnlogged from '@/components/Home/HomeUnlogged';
import HelpModal from '@/components/_ui/HelpModal/HelpModal';
import { useState } from 'react';

export default function Index() {
  const isLogged = false;
  const [isHelpModalOpen, setisHelpModalOpen] = useState(true);

  return (
    <>
      {isLogged ? <HomeLogged /> : <HomeUnlogged />}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setisHelpModalOpen(false)}
        imageSrc="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNiM2NhM3l4em5jOWFycGZqbWl0bXZ2bGh6N2t2Z2k4bzN4NXNxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3odxflN8NqzeSIRyvb/giphy.gif"
        title="Besoin d'aide ?"
        text="N'hésitez pas à nous contacter si vous avez des questions."
      />
    </>
  );
}
