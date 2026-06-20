import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

// Images
import cta from "./assets/img/CTA.webp";

import storyv3 from "./assets/img/storyv3.optimized.webp";
import popcornGif from "./assets/img/POPCORN.optimized.webp";
import hand from "./assets/img/hand.webp";

const MotionImg = motion.img;

function App() {
  const mraid = window.mraid || {};
  const isIosOrAndroid = useMemo(
    () => /iPad|iPhone|iPod|Android/i.test(window.navigator.userAgent),
    [],
  );
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const pressStartRef = useRef({ time: 0, x: 0, y: 0 });
  const swipeLoop = {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeOut",
    times: [0, 0.75, 1],
    repeatDelay: 0.5,
  };
  const shouldAnimateStoryHint = !isIosOrAndroid && !hasScrolled;

  // Utility: Handles click actions
  const handleClickAction = () => {
    if (mraid.open && typeof mraid.open === "function") {
      mraid.open();
    } else {
      window.open();
    }
  };

  const handleMainScroll = (event) => {
    const { scrollTop, scrollLeft, scrollHeight, clientHeight } =
      event.currentTarget;

    if (!hasScrolled && (scrollTop > 0 || scrollLeft > 0)) {
      setHasScrolled(true);
    }

    // Toggle based on whether user is at the bottom
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setHasReachedBottom(atBottom);
  };

  const handleMouseDown = (e) => {
    const main = e.currentTarget;
    setIsDragging(true);
    setDragStart({
      time: Date.now(),
      x: e.pageX - main.offsetLeft,
      y: e.pageY - main.offsetTop,
      scrollLeft: main.scrollLeft,
      scrollTop: main.scrollTop,
    });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    if (!hasReachedBottom) return;

    const main = e.currentTarget;
    const duration = Date.now() - dragStart.time;
    const dx = Math.abs(e.pageX - main.offsetLeft - dragStart.x);
    const dy = Math.abs(e.pageY - main.offsetTop - dragStart.y);

    // If it's a quick click (not a long drag) and we're at the bottom, redirect
    if (duration < 200 && dx < 10 && dy < 10) {
      handleClickAction();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const main = e.currentTarget;
    const x = e.pageX - main.offsetLeft;
    const y = e.pageY - main.offsetTop;
    const walkX = (x - dragStart.x) * 2; // Increase scroll speed
    const walkY = (y - dragStart.y) * 2;
    main.scrollLeft = dragStart.scrollLeft - walkX;
    main.scrollTop = dragStart.scrollTop - walkY;
  };

  return (
    <>
      <main
        className={`app-scroll no-scrollbar relative max-w-full w-full mx-auto select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onContextMenu={(e) => e.preventDefault()}
        onScroll={handleMainScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          const t = e.touches[0];
          pressStartRef.current.time = Date.now();
          pressStartRef.current.x = t.clientX;
          pressStartRef.current.y = t.clientY;
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          const duration = Date.now() - pressStartRef.current.time;
          const dx = Math.abs(t.clientX - pressStartRef.current.x);
          const dy = Math.abs(t.clientY - pressStartRef.current.y);

          if (!hasReachedBottom) return;

          if (duration < 200 && dx < 10 && dy < 10) {
            handleClickAction();
          }
        }}
      >
        <div className="landscape:max-w-80 landscape:md:max-w-130 mx-auto relative pointer-events-none">
          <motion.div
            className="relative"
            animate={shouldAnimateStoryHint ? { y: [0, -24, 0] } : { y: 0 }}
            transition={shouldAnimateStoryHint ? swipeLoop : { duration: 0 }}
          >
            <img
              src={storyv3} //here to change the story board image
              alt="Story board"
              className="w-full select-none"
              draggable="false"
            />
            <img
              src={popcornGif}
              alt=""
              className="absolute select-none"
              draggable="false"
              style={{
                top: "8%",
                overflow: "hidden",
                height: "7%",
                left: "9.5%",
                width: "81%",
              }}
            />
          </motion.div>

          {!hasScrolled && (
            <MotionImg
              src={hand}
              alt=""
              className="absolute z-30 right-0 left-44 top-[12%] landscape:top-[2%] w-12 max-w-30"
              animate={{
                y: [0, -42, 0],
                opacity: [0, 1, 0],
              }}
              transition={swipeLoop}
            />
          )}
        </div>
        <div className="h-12 landscape:h-10 pointer-events-none"></div>
        <div className="fixed -top-1 left-0 w-full h-25  pointer-events-none"></div>
        <div className="fixed -bottom-1 left-0 w-full h-25  pointer-events-none"></div>
      </main>
      <div
        className="cta fixed p-2 w-1/2 landscape:w-5/12 flex items-center justify-center bottom-0 left-1/2 -translate-x-1/2 z-60 sm:w-5/12 landscape:sm:w-3/12"
        style={{ pointerEvents: "auto" }}
      >
        <button
          onClick={handleClickAction}
          className="relative flex justify-center"
        >
          <img
            src={cta}
            alt=""
            className="animate-pulsing wf-full pointer-events-none"
          />
        </button>
      </div>
    </>
  );
}

export default App;
