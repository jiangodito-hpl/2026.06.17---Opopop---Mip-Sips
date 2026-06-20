// src/utils/FullscreenVideo.jsx

import { useEffect, useRef, useState } from "react";


export default function FullscreenVideo() {
  const videoRef = useRef(null);

  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight >= window.innerWidth
  );

  // Replace with your actual video URLs
  const portraitVideo = videoP;
  const landscapeVideo = videoL;

  useEffect(() => {
    const onResize = () => {
      setIsPortrait(window.innerHeight >= window.innerWidth);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load(); // reload video on orientation change
      videoRef.current.play().catch(() => {});
    }
  }, [isPortrait]);
  
  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="fullscreen-video"
        playsInline
        muted
        autoPlay
        loop
      >
        <source
          src={isPortrait ? portraitVideo : landscapeVideo}
          type="video/mp4"
        />
      </video>
    </div>
  );
}
