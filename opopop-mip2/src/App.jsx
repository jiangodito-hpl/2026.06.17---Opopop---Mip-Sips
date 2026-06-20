import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useScaleUI from "./hooks/useScaleUI";
import Logo from "./assets/Logo.webp";
import CTA from "./assets/CTA.webp";
import Container from "./assets/CONTAINER.webp";
import ContainerWithPopcorn from "./assets/CONTAINER-withpopcorn-bucketonly.webp";
import PopcornA from "./assets/Product 4.webp";
import PopcornB from "./assets/Product 5.webp";
import Hand from "./assets/Hand.webp";
import Confetti from "./assets/CONFETTI REACTION.gif";
import EndSceneBg from "./assets/BGendscene.webp";
import { playCorrect, playEndscene, unlockAudio } from "./audio";

const TOTAL_CATCHES = 5;
const COUNTDOWN_STEPS = ["3", "2", "START"];
const POPCORNS = [PopcornA, PopcornB];
const TOP_POPCORN_COUNT = 5;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function openStore() {
  if (typeof mraid !== "undefined" && typeof mraid.open === "function") {
    mraid.open();
    return;
  }
  window.open();
}

export default function App() {
  const { appRef, wrapperRef, scale, isLandscape, stageSize } = useScaleUI(
    420,
    820,
    820,
    420,
  );
  const stageW = stageSize.width;
  const stageH = stageSize.height;
  const [scene, setScene] = useState("intro");
  const [countdown, setCountdown] = useState(null);

  const startGame = useCallback(() => {
    if (scene !== "intro") return;
    unlockAudio();
    setScene("countdown");
    setCountdown(COUNTDOWN_STEPS[0]);
  }, [scene]);

  useEffect(() => {
    if (scene !== "countdown") return undefined;
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      if (index >= COUNTDOWN_STEPS.length) {
        window.clearInterval(id);
        setScene("playing");
        setCountdown(null);
      } else {
        setCountdown(COUNTDOWN_STEPS[index]);
      }
    }, 900);
    return () => window.clearInterval(id);
  }, [scene]);

  const finishGame = useCallback(() => {
    setScene("win");
    window.setTimeout(() => {
      setScene("end");
      playEndscene();
    }, 2000);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`app-wrapper app-wrapper--${scene === "end" ? "end" : "game"} ${
        isLandscape ? "app-wrapper--landscape" : "app-wrapper--portrait"
      }`}
      onClick={scene === "end" ? openStore : undefined}
    >
      <TopBar />
      <div ref={appRef} className="app">
        {scene === "end" ? (
          <EndCard isLandscape={isLandscape} stageW={stageW} stageH={stageH} />
        ) : (
          <GameFrame
            stageW={stageW}
            stageH={stageH}
            isLandscape={isLandscape}
            scale={scale}
            scene={scene}
            countdown={countdown}
            onStart={startGame}
            onComplete={finishGame}
          />
        )}
      </div>
    </div>
  );
}

function GameFrame({
  stageW,
  stageH,
  isLandscape,
  scale,
  scene,
  countdown,
  onStart,
  onComplete,
}) {
  const bucketHomeX = stageW / 2;
  const [score, setScore] = useState(0);
  const [bucketX, setBucketX] = useState(bucketHomeX);
  const [falling, setFalling] = useState([]);
  const [caught, setCaught] = useState([]);
  const [catchEffects, setCatchEffects] = useState([]);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startBucketX: bucketHomeX,
  });
  const bucketXRef = useRef(bucketHomeX);
  const fallingRef = useRef([]);
  const scoreRef = useRef(0);
  const rafRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const lastTickRef = useRef(0);
  const spawnCursorRef = useRef(0);
  const effectTimersRef = useRef([]);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const dims = useMemo(() => {
    const headerH = isLandscape ? 28 : 34;
    const platformH = isLandscape ? 104 : 150;
    const bucketW = isLandscape ? 112 : 156;
    const bucketH = isLandscape ? 88 : 124;
    return {
      headerH,
      platformTop: stageH - platformH,
      bucketW,
      bucketH,
      bucketY: stageH - platformH + (isLandscape ? 42 : 34),
      popcornW: isLandscape ? 40 : 50,
      popcornH: isLandscape ? 36 : 46,
      fallSpeed: isLandscape ? 3.45 : 4.1,
      spawnGap: isLandscape ? 390 : 440,
      ctaW: isLandscape ? 118 : 200,
    };
  }, [stageH, isLandscape]);

  const topPopcorns = useMemo(
    () =>
      Array.from({ length: TOP_POPCORN_COUNT }, (_, index) => {
        const spacing = stageW / (TOP_POPCORN_COUNT + 1);
        return {
          id: index,
          src: POPCORNS[index % POPCORNS.length],
          x:
            spacing * (index + 1) +
            (isLandscape ? random(-13, 13) : random(-11, 11)),
          y: dims.headerH + (isLandscape ? 33 : 60) + random(-8, 8),
          width: isLandscape ? random(32, 42) : random(38, 48),
          rotation: random(-24, 24),
          scale: random(0.94, 1.16),
        };
      }),
    [dims.headerH, isLandscape, stageW],
  );

  const clampBucket = useCallback(
    (x) => {
      return Math.max(dims.bucketW / 2, Math.min(stageW - dims.bucketW / 2, x));
    },
    [stageW, dims.bucketW],
  );

  useEffect(() => {
    const center = bucketHomeX;
    setBucketX(center);
    bucketXRef.current = center;
    dragRef.current = { active: false, startX: 0, startBucketX: center };
  }, [bucketHomeX]);

  useEffect(() => {
    if (scene !== "playing") return undefined;

    completedRef.current = false;
    scoreRef.current = 0;
    fallingRef.current = [];
    lastSpawnRef.current = 0;
    lastTickRef.current = 0;
    spawnCursorRef.current = 0;
    effectTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    effectTimersRef.current = [];
    setScore(0);
    setFalling([]);
    setCaught([]);
    setCatchEffects([]);

    const spawn = () => {
      const index = spawnCursorRef.current;
      spawnCursorRef.current += 1;
      const spawnMargin = dims.popcornW * 0.75;
      return {
        id: performance.now() + Math.random(),
        src: POPCORNS[index % POPCORNS.length],
        x: random(spawnMargin, stageW - spawnMargin),
        y: dims.headerH + random(isLandscape ? 16 : 24, isLandscape ? 82 : 118),
        speed: dims.fallSpeed + random(-0.5, 0.85),
        rotation: random(-24, 24),
        spin: random(-1.8, 1.8),
        scale: random(0.94, 1.16),
        caught: false,
        missed: false,
      };
    };

    const tick = (now) => {
      if (completedRef.current) return;
      const elapsed = lastTickRef.current ? now - lastTickRef.current : 16.67;
      const frameStep = Math.min(elapsed, 34) / 16.67;
      lastTickRef.current = now;

      if (
        now - lastSpawnRef.current > dims.spawnGap &&
        spawnCursorRef.current < TOTAL_CATCHES
      ) {
        const activeCount = fallingRef.current.filter(
          (item) => !item.caught && !item.missed,
        ).length;
        if (activeCount < 4) {
          fallingRef.current = [...fallingRef.current, spawn()];
          lastSpawnRef.current = now;
        }
      }

      const bucketLeft = bucketXRef.current - dims.bucketW * 0.42;
      const bucketRight = bucketXRef.current + dims.bucketW * 0.42;
      const catchTop = dims.bucketY - dims.bucketH * 0.74;
      const catchBottom = dims.bucketY - dims.bucketH * 0.14;
      let caughtThisFrame = false;

      const next = fallingRef.current.map((item) => {
        if (item.caught || item.missed) return item;

        const y = item.y + item.speed * frameStep;
        const productCenterY = y + dims.popcornH * 0.5;
        const inBucketX = item.x >= bucketLeft && item.x <= bucketRight;
        const inBucketY =
          productCenterY >= catchTop && productCenterY <= catchBottom;

        if (!caughtThisFrame && inBucketX && inBucketY) {
          caughtThisFrame = true;
          const nextScore = scoreRef.current + 1;
          scoreRef.current = nextScore;
          playCorrect();
          setScore(nextScore);
          setCaught((current) => [
            ...current,
            {
              id: item.id,
              src: item.src,
              scale: item.scale,
              rotation: item.rotation,
            },
          ]);
          const effectId = `${item.id}-${nextScore}`;
          setCatchEffects((current) => [
            ...current,
            {
              id: effectId,
              x: bucketXRef.current,
              y: dims.bucketY - dims.bucketH * 1.34,
              width: isLandscape ? 220 : 280,
            },
          ]);
          const effectTimer = window.setTimeout(() => {
            setCatchEffects((current) =>
              current.filter((effect) => effect.id !== effectId),
            );
          }, 1800);
          effectTimersRef.current.push(effectTimer);
          return { ...item, y, caught: true };
        }

        if (y > stageH + dims.popcornH) {
          return { ...item, y, missed: true };
        }

        return { ...item, y, rotation: item.rotation + item.spin };
      });

      fallingRef.current = next.filter((item) => !item.missed && !item.caught);
      setFalling(fallingRef.current);
      if (
        spawnCursorRef.current >= TOTAL_CATCHES &&
        fallingRef.current.length === 0
      ) {
        completedRef.current = true;
        window.setTimeout(() => onCompleteRef.current(), 450);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      effectTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      effectTimersRef.current = [];
    };
  }, [stageH, stageW, dims, scene, isLandscape]);

  const onPointerDown = useCallback(
    (event) => {
      event.stopPropagation();
      if (scene === "intro") {
        onStart();
        return;
      }
      if (scene !== "playing") return;
      unlockAudio();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startBucketX: bucketXRef.current,
      };
    },
    [onStart, scene],
  );

  const onPointerMove = useCallback(
    (event) => {
      if (!dragRef.current.active) return;
      const currentScale = scale > 0 ? scale : 1;
      const nextX = clampBucket(
        dragRef.current.startBucketX +
          (event.clientX - dragRef.current.startX) / currentScale,
      );
      bucketXRef.current = nextX;
      setBucketX(nextX);
    },
    [clampBucket, scale],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  return (
    <main
      className="pop-game"
      style={{ width: stageW, height: stageH }}
      onPointerDown={onPointerDown}
    >
      {(scene === "intro" || scene === "countdown") && (
        <PopcornRow pieces={topPopcorns} />
      )}

      <section
        className="blue-platform"
        style={{ height: stageH - dims.platformTop }}
      />

      {scene === "intro" && <IntroCopy isLandscape={isLandscape} />}
      {scene === "countdown" && (
        <Countdown label={countdown} isLandscape={isLandscape} />
      )}
      {scene === "win" && <WinCopy isLandscape={isLandscape} />}

      {falling.map((item) => (
        <img
          key={item.id}
          className="falling-popcorn"
          src={item.src}
          alt=""
          draggable={false}
          style={{
            left: item.x - dims.popcornW / 2,
            top: item.y,
            width: dims.popcornW,
            height: dims.popcornH,
            transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
          }}
        />
      ))}

      <Bucket
        x={scene === "win" ? bucketHomeX : bucketX}
        y={dims.bucketY}
        w={dims.bucketW}
        h={dims.bucketH}
        isLandscape={isLandscape}
        isFull={scene === "win"}
      />

      {scene === "win" && (
        <WinBucketConfetti
          x={stageW / 2}
          y={scene === "win" && !isLandscape ? 548 : dims.bucketY}
          bucketW={dims.bucketW}
          bucketH={dims.bucketH}
          isLandscape={isLandscape}
        />
      )}

      {scene === "playing" && catchEffects.map((effect) => (
        <img
          key={effect.id}
          className="catch-confetti"
          src={Confetti}
          alt=""
          draggable={false}
          style={{
            left: effect.x - effect.width / 2,
            top: effect.y,
            width: effect.width,
          }}
        />
      ))}

      {scene === "intro" && (
        <img
          className="swipe-hand"
          src={Hand}
          alt=""
          draggable={false}
          style={{
            width: isLandscape ? 48 : 62,
            left: bucketX - (isLandscape ? 18 : 20),
            top: dims.bucketY - dims.bucketH * 0.55,
          }}
        />
      )}

      {scene !== "countdown" && (
        <button
          className="cta-button"
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            openStore();
          }}
          style={{ width: dims.ctaW, bottom: isLandscape ? 15 : 23 }}
        >
          <img src={CTA} alt="Shop Now" draggable={false} />
        </button>
      )}
    </main>
  );
}

function TopBar() {
  return (
    <header className="top-bar">
      <img src={Logo} alt="opopop" draggable={false} />
    </header>
  );
}

function IntroCopy({ isLandscape }) {
  return (
    <div className="intro-copy" style={{ top: isLandscape ? 132 : 185 }}>
      <h1
        className="barlow-bold text-[2.5rem] leading-10"
        style={{ marginTop: isLandscape ? 10 : 70 }}
      >
        CATCH THE FALLING POPCORNS
      </h1>
      <p
        className="tap-start-text barlow-regular  text-2xl"
        style={{ marginTop: isLandscape ? 50 : 170 }}
      >
        TAP ANYWHERE TO START
      </p>
    </div>
  );
}

function Countdown({ label, isLandscape }) {
  return (
    <div
      className={`countdown${label === "START" ? " countdown-start" : ""}`}
      style={{ top: isLandscape ? 130 : label === "START" ? 315 : 185 }}
    >
      {label}
    </div>
  );
}

function WinCopy({ isLandscape }) {
  return (
    <div className="win-copy" style={{ top: isLandscape ? 88 : 185 }}>
      <h2 className="barlow-bold text-[2.5rem] text-[#232323]">CONGRATULATIONS!</h2>
    </div>
  );
}

function PopcornRow({ pieces }) {
  return pieces.map((piece) => (
    <img
      key={piece.id}
      className="decor-popcorn"
      src={piece.src}
      alt=""
      draggable={false}
      style={{
        left: piece.x - piece.width / 2,
        top: piece.y,
        width: piece.width,
        transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
      }}
    />
  ));
}

function Bucket({ x, y, w, h, isLandscape, isFull }) {
  if (isFull) {
    const fullW = isLandscape ? w * 1.18 : w * 1.04;
    const fullH = fullW * (473 / 431);

    return (
      <img
        className="bucket"
        src={ContainerWithPopcorn}
        alt="Popcorn bucket"
        draggable={false}
        style={{
          left: x - fullW / 2,
          top: y - fullH,
          width: fullW,
          height: fullH,
        }}
      />
    );
  }

  return (
    <img
      className="bucket"
      src={Container}
      alt="Popcorn bucket"
      draggable={false}
      style={{
        left: x - w / 2,
        top: y - h,
        width: w,
        height: h,
      }}
    />
  );
}

function WinBucketConfetti({ x, y, bucketW, bucketH, isLandscape }) {
  const fullW = isLandscape ? bucketW * 1.18 : bucketW * 1.04;
  const width = isLandscape ? fullW * 1.6 : fullW * 1.85;

  return (
    <img
      className="win-bucket-confetti"
      src={Confetti}
      alt=""
      draggable={false}
      style={{
        left: isLandscape ? 304.272 : 13.928,
        top: isLandscape ? 118 : 345,
        width: isLandscape ? 211.456 : 394.144,
      }}
    />
  );
}

function EndCard({ isLandscape, stageW, stageH }) {
  return (
    <main className="end-card" style={{ width: stageW, height: stageH }}>
      <img className="end-bg" src={EndSceneBg} alt="" draggable={false} />
      <div className="end-content">
        <h1 className="text-[2.9rem] text-center leading-12 barlow-bold">
          Join The Popcorn Revolution!
        </h1>
        <button
          className="cta-button end-cta"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openStore();
          }}
        >
          <img src={CTA} alt="Shop Now" draggable={false} className="w-full" />
        </button>
      </div>
    </main>
  );
}
