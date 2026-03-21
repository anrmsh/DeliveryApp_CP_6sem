import { useEffect, useRef } from "react";
import "./PageLoader.css";

export default function PageLoader({ label = "Загрузка..." }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    let particles = [], animId, pct = 0;
    let mouse = { x: -999, y: -999 };
    let W, H;

    const isDark   = window.matchMedia("(prefers-color-scheme:dark)").matches;
    const PRIMARY  = isDark ? "#a5b4fc" : "#2563eb";
    const DIM      = isDark ? "rgba(165,180,252,0.15)" : "rgba(37,99,235,0.1)";

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = canvas.width  = r.width;
      H = canvas.height = r.height;
    }

    function spawn() {
      particles = [];
      const cols = Math.floor(W / 44);
      const rows = Math.floor(H / 44);
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c = 0; c < cols; c++) {
          particles.push({
            ox:    22 + c * 44 + (Math.random() - 0.5) * 6,
            oy:    22 + r2 * 44 + (Math.random() - 0.5) * 6,
            x: 0, y: 0, vx: 0, vy: 0,
            size:  2.5 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      particles.forEach(p => { p.x = p.ox; p.y = p.oy; });
    }

    function draw(ts) {
      ctx.clearRect(0, 0, W, H);

      const fillX = (pct / 100) * W;
      ctx.fillStyle = DIM;
      ctx.fillRect(0, H - 3, W, 3);
      ctx.fillStyle = PRIMARY;
      ctx.fillRect(0, H - 3, fillX, 3);

      if (pct < 92) pct += 0.2;

      const REPEL = 90, FORCE = 4.5, SPRING = 0.09, DAMP = 0.72;
      particles.forEach(p => {
        const ox = p.ox + Math.cos(p.phase + ts * 0.0009) * 3;
        const oy = p.oy + Math.sin(p.phase + ts * 0.0013) * 3;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL) {
          const f = (1 - dist / REPEL) * FORCE;
          p.vx += (dx / (dist + 0.1)) * f;
          p.vy += (dy / (dist + 0.1)) * f;
        }
        p.vx += (ox - p.x) * SPRING;
        p.vy += (oy - p.y) * SPRING;
        p.vx *= DAMP; p.vy *= DAMP;
        p.x += p.vx; p.y += p.vy;

        const prox  = Math.max(0, 1 - dist / REPEL);
        const alpha = (0.25 + prox * 0.75) * (p.x < fillX ? 1 : 0.3);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + prox * 3, 0, Math.PI * 2);
        ctx.fillStyle = PRIMARY;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    }

    const onMove = e => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };

    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", () => { resize(); spawn(); });

    resize(); spawn();
    requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="pl-root" ref={wrapRef}>
      <canvas ref={canvasRef} className="pl-canvas" />
      <div className="pl-label">{label}</div>
    </div>
  );
}