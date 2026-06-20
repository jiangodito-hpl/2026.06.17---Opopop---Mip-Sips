import React from 'react'
import logo from '../assets/LOGO.webp'
import subtitle from '../assets/Soursop Bitters & Black Seed Bitters Bundle.webp'

export const Header = ({ className = "" }) => {
  return (
    <header className={`container flex flex-col gap-8 items-center justify-center ${className}`}>
       <img src={logo} alt="Logo" className="w-[100px]" />
       <p className="text-[50px] landscape:text-[45px] font-bold text-center w-full leading-none">Soursop Bitters  & <span className="text-[#193407]">Black Seed Bitters Bundle</span></p>

    </header>
  )
}
