import { useState, useEffect } from "react";

const ImageSlider = ({images, interval = 3000}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotation logic
  useEffect(() => {
    const autoRotate = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(autoRotate); // Cleanup on component unmount
  }, [images.length, interval]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Images */}
      <div
        className="flex transition-transform duration-500"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Slide ${index}`}
            className="w-full shrink-0 object-cover"
          />
        ))}
      </div>

      {/* <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 -translate-y-1/2 text-black text-2xl bg-white shadow shadow-slate-500 w-9 h-9 rounded-full"
      >
        &#8249;
      </button>

      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 -translate-y-1/2 text-black text-2xl bg-white shadow shadow-slate-500 w-9 h-9 rounded-full"
      >
        &#8250;
      </button> */}
    </div>
  );
}

export default ImageSlider
