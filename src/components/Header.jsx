"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Red_Rose } from 'next/font/google';
import { Maven_Pro } from 'next/font/google';

const rubik = Red_Rose({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const MavenPro= Maven_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const Header = () => {

  return (
    <header className="w-full flex justify-between items-center px-2 sm:px-3 lg:px-11 xl:px-15 py-3 lg:py-3 bg-neutral-950">
      
      {/* Logo and Text Logo */}
      <div className="flex items-center gap-1">
        <Image 
          src="/evo5.png" 
          alt="Logo" 
          width={34} 
          height={28}
          className=""
          />
       <div className='flex flex-row items-center gap-6'>
  <span className={`${MavenPro.className} text-2xl sm:text-3xl font-bold text-zinc-50 tracking-normal`}>
    Genova
  </span>
  <span
    className={`${MavenPro.className} text-xl sm:text-2xl font-extralight tracking-widest mt-1 bg-gradient-to-r from-[#FFCBA4] to-[#A259FF] bg-clip-text text-transparent`}
  >
    Variant Analysis
  </span>
</div>

      </div>
    </header>
  );
};

export default Header;
