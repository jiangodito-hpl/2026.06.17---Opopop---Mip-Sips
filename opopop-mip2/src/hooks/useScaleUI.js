import { useLayoutEffect, useRef, useState } from "react";

/**
 * Scales a fixed-size canvas to fill the viewport while preserving
 * aspect ratio (letterbox / pillarbox).  Automatically switches between
 * portrait and landscape design dimensions based on the current viewport.
 *
 * @param {number} portraitW   - Canvas width  in portrait  mode (default 420)
 * @param {number} portraitH   - Canvas height in portrait  mode (default 820)
 * @param {number} landscapeW  - Canvas width  in landscape mode (default 820)
 * @param {number} landscapeH  - Canvas height in landscape mode (default 420)
 *
 * Returns { appRef, wrapperRef, scale, isLandscape }
 *   scale       — current uniform scale factor (canvas-space → viewport-space)
 *   isLandscape — true when viewport width > viewport height
 */
export default function useScaleUI(
  portraitW  = 420,
  portraitH  = 820,
  landscapeW = 820,
  landscapeH = 420,
  scaleMode = "contain",
) {
  const appRef     = useRef(null);
  const wrapperRef = useRef(null);
  const [scale,       setScale]       = useState(1);
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight,
  );
  const [stageSize, setStageSize] = useState(() => ({
    width: window.innerWidth > window.innerHeight ? landscapeW : portraitW,
    height: window.innerWidth > window.innerHeight ? landscapeH : portraitH,
  }));

  useLayoutEffect(() => {
    const app     = appRef.current;
    const wrapper = wrapperRef.current;
    if (!app || !wrapper) return;

    app.style.transformOrigin = "top left";

    let frameId = null;

    const applyScale = () => {
      frameId = null;

      const vw = wrapper.clientWidth  || window.innerWidth;
      const vh = wrapper.clientHeight || window.innerHeight;
      if (!vw || !vh) return;

      // Pick design dimensions based on current viewport orientation.
      const landscape = vw > vh;
      const baseW = landscape ? landscapeW : portraitW;
      const baseH = landscape ? landscapeH : portraitH;

      const s =
        scaleMode === "cover"
          ? Math.max(vw / baseW, vh / baseH)
          : Math.min(vw / baseW, vh / baseH);

      const stageWidth =
        scaleMode === "contain" ? Math.max(baseW, Math.ceil(vw / s)) : baseW;
      const stageHeight =
        scaleMode === "contain" ? Math.max(baseH, Math.ceil(vh / s)) : baseH;

      app.style.width = `${stageWidth}px`;
      app.style.height = `${stageHeight}px`;

      // Center the scaled canvas inside the wrapper.
      const offsetX = Math.round((vw - stageWidth * s) / 2);
      const offsetY = 0;

      app.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${s})`;

      // Expose the scale factor so overlay elements can convert
      // canvas-space measurements to real viewport pixels.
      wrapper.style.setProperty("--ui-scale", s.toString());
      wrapper.style.setProperty("--stage-x", `${offsetX}px`);
      wrapper.style.setProperty("--stage-y", `${offsetY}px`);

      setScale(s);
      setIsLandscape(landscape);
      setStageSize({ width: stageWidth, height: stageHeight });
    };

    const schedule = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(applyScale);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(wrapper);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("resize", schedule);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [portraitW, portraitH, landscapeW, landscapeH, scaleMode]);

  return { appRef, wrapperRef, scale, isLandscape, stageSize };
}
