import { useEffect, useRef, useCallback } from "react";
import "./SquareGridBackground.css";

const CELL_SIZE  = 36;
const DOT_SIZE   = 24;   // 4px * 3 = 12px
const DOT_RADIUS = 3;
const BG_COLOR   = "#1c1c1e";
const DOT_BASE   = { r: 72,  g: 72,  b: 76  };
const GLOW_COLOR = { r: 195, g: 198, b: 210 };

const MOUSE_RADIUS = 160;
const FADE_SPEED   = 0.022;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function SquareGridBackground() {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    mouse: { x: -9999, y: -9999 },
    dots: [],
    animId: null,
    clickWaves: [],
  });

  const buildGrid = useCallback((canvas) => {
    const cols = Math.ceil(canvas.width  / CELL_SIZE) + 1;
    const rows = Math.ceil(canvas.height / CELL_SIZE) + 1;
    const dots = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        dots.push({ x: c * CELL_SIZE, y: r * CELL_SIZE, brightness: 0, target: 0, size: DOT_SIZE });
      }
    }
    stateRef.current.dots = dots;
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildGrid(canvas);
  }, [buildGrid]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { mouse, dots, clickWaves } = stateRef.current;

    dots.forEach((dot) => {
      const d = Math.hypot(dot.x - mouse.x, dot.y - mouse.y);
      // power 2.4 = sharp bright center, wide soft falloff; 0.92 = near-full brightness at epicenter
      const mouseGlow = d < MOUSE_RADIUS
        ? Math.pow(1 - d / MOUSE_RADIUS, 2.4) * 1
        : 0;

      let clickGlow = 0;
      clickWaves.forEach((wave) => {
        const wd = Math.hypot(dot.x - wave.x, dot.y - wave.y);
        if (wd < wave.radius) {
          clickGlow = Math.max(clickGlow, Math.pow(1 - wd / wave.radius, 2) * wave.intensity);
        }
      });

      dot.target = Math.max(mouseGlow, clickGlow);
      dot.brightness = dot.brightness < dot.target
        ? lerp(dot.brightness, dot.target, 1) 
        : Math.max(0, dot.brightness - FADE_SPEED);

      // dots near cursor grow slightly in size
      const targetSize = DOT_SIZE + dot.brightness * DOT_SIZE * 0.45;
      dot.size = lerp(dot.size, targetSize, 0.12);
    });

    stateRef.current.clickWaves = clickWaves
      .map((w) => ({ ...w, intensity: w.intensity - 0.011, radius: w.radius + 5.5 }))
      .filter((w) => w.intensity > 0);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    dots.forEach((dot) => {
      const t = dot.brightness;
      const r = Math.round(lerp(DOT_BASE.r, GLOW_COLOR.r, t));
      const g = Math.round(lerp(DOT_BASE.g, GLOW_COLOR.g, t));
      const b = Math.round(lerp(DOT_BASE.b, GLOW_COLOR.b, t));
      const alpha = lerp(0.55, 1.0, t); // faint at rest, fully opaque when lit
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      const s = dot.size;
      ctx.beginPath();
      ctx.roundRect(dot.x - s / 2, dot.y - s / 2, s, s, DOT_RADIUS);
      ctx.fill();
    });

    // eslint-disable-next-line react-hooks/immutability
    stateRef.current.animId = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const onMouseMove  = (e) => { stateRef.current.mouse = { x: e.clientX, y: e.clientY }; };
    const onMouseLeave = ()  => { stateRef.current.mouse = { x: -9999, y: -9999 }; };
    const onClick      = (e) => {
      stateRef.current.clickWaves.push({ x: e.clientX, y: e.clientY, radius: 20, intensity: 1.5 });
    };
    
    // Touch event handlers for mobile/finger support
    const onTouchStart = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      stateRef.current.mouse = { x: touch.clientX, y: touch.clientY };
    };
    const onTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      stateRef.current.mouse = { x: touch.clientX, y: touch.clientY };
    };
    const onTouchEnd = () => {
      stateRef.current.mouse = { x: -9999, y: -9999 };
    };
    
    window.addEventListener("mousemove",  onMouseMove);
    window.addEventListener("click",      onClick);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove",  onTouchMove);
    window.addEventListener("touchend",   onTouchEnd);
    stateRef.current.animId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize",     resize);
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("click",      onClick);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
      if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
    };
  }, [resize, draw]);

  return <canvas ref={canvasRef} className="square-grid-bg" />;
}
