// src/components/Cta.jsx

import React from "react";
import CTADG from "../assets/CTA.webp";
export const Cta = ({ className = "" }) => {
  const mraid = window.mraid || {};

  const handleCTA = () => {
    if (mraid.open && typeof mraid.open === "function") {
      mraid.open();
    } else {
      window.open();
    }
  };

  return (
    <>
      <div className={`flex justify-center items-center ${className}`}>
        <button
        className={`animate-pulsing relative flex items-center justify-center rounded-lg px-8 py-2 min-w-[200px] font-semibold text-white mt-5`}
        onClick={handleCTA}
      >
        <img src={CTADG} alt="CTA" />
      </button>
      </div>
    </>
  );
};
