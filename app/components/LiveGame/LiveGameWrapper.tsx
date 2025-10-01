// app/prisoners-and-boxes/page.tsx
"use client";

import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function LiveGameWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [dpr, setDpr] = useState<number>(1);
  const [autoStart, setAutoStart] = useState(true);
  const [startAmount, setStartAmount] = useState(5000); // процент заполненности (0–100)

  // параметры
  const [cellSize, setCellSize] = useState(5);
  const [speed, setSpeed] = useState(300);
  const [grid, setGrid] = useState<number[][]>([]);

  const width = size?.width ?? 0;
  const height = size?.height ?? 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const updateDpr = () => setDpr(window.devicePixelRatio || 1);
    updateDpr();
    window.addEventListener("resize", updateDpr);
    return () => window.removeEventListener("resize", updateDpr);
  }, []);

  // генерация начальной сетки
  const createGrid = (rows: number, cols: number, count: number) => {
    const total = rows * cols;
    const liveCount = Math.min(count, total); // не больше чем всего клеток

    // все клетки = 0
    const flat = new Array(total).fill(0);

    // выбираем случайные позиции для живых клеток
    const positions = Array.from({ length: total }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < liveCount; i++) {
      flat[positions[i]] = 1;
    }

    // обратно в 2D
    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      grid.push(flat.slice(r * cols, (r + 1) * cols));
    }

    return grid;
  };

  const countNeighbors = (g: number[][], x: number, y: number) => {
    let c = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < g.length && ny >= 0 && ny < g[0].length) {
          c += g[nx][ny];
        }
      }
    }
    return c;
  };

  const nextGen = (g: number[][]) =>
    g.map((row, x) =>
      row.map((cell, y) => {
        const n = countNeighbors(g, x, y);
        if (cell === 1 && (n < 2 || n > 3)) return 0;
        if (cell === 0 && n === 3) return 1;
        return cell;
      })
    );

  // пересоздание сетки
  const restart = () => {
    if (!width || !height) return;
    const rows = Math.max(1, Math.floor(height / cellSize));
    const cols = Math.max(1, Math.floor(width / cellSize));
    setGrid(createGrid(rows, cols, startAmount));
  };

  useEffect(() => {
    if (!width || !height) return;
    restart();
  }, [width, height, cellSize, startAmount]);

  // основной цикл
  useEffect(() => {
    if (!width || !height || grid.length === 0) return;

    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      setGrid((g) => {
        const newGrid = nextGen(g);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          // настраиваем canvas под DPR
          const pixelW = Math.max(1, Math.floor(width * dpr));
          const pixelH = Math.max(1, Math.floor(height * dpr));
          if (canvas.width !== pixelW || canvas.height !== pixelH) {
            canvas.width = pixelW;
            canvas.height = pixelH;
          }
          canvas.style.width = "100%";
          canvas.style.height = "100%";

          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);

          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "black";

          for (let x = 0; x < newGrid.length; x++) {
            for (let y = 0; y < newGrid[0].length; y++) {
              if (newGrid[x][y]) {
                ctx.fillRect(y * cellSize, x * cellSize, cellSize, cellSize);
              }
            }
          }
        }

        return newGrid;
      });

      timer = setTimeout(tick, speed);
    };

    if (autoStart) {
      tick();
    }

    return () => clearTimeout(timer);
  }, [grid.length, width, height, dpr, cellSize, speed, autoStart]);

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 min-h-0 relative overflow-hidden border"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block"
      />
      <div className="dropdown dropdown-end absolute top-0 right-0 z-10">
        <div tabIndex={0} role="button" className="btn m-1">
          <Settings />
        </div>
        <ul tabIndex={0} className="dropdown-content gap-2 menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
          <li><a onClick={() => setAutoStart(true)}>Start</a></li>
          <li><a onClick={restart}>Restart</a></li>

          <label className="label">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="toggle"
            />
            <span>Autostart</span>
          </label>

          <li>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="select">
              <option disabled={true}>Pick a speed</option>
              <option value={1000}>Very Slow</option>
              <option value={500}>Slow</option>
              <option value={300}>Normal</option>
              <option value={100}>Fast</option>
              <option value={50}>Very Fast</option>
              <option value={10}>Maximum</option>
            </select>
          </li>

          <li>
            <select value={cellSize} onChange={(e) => setCellSize(Number(e.target.value))} className="select">
              <option disabled={true}>Pick a size</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </li>

          <li>
            <input
              value={startAmount}
              onChange={(e) => setStartAmount(Number(e.target.value))}
              type="number"
              min={0}
              max={100}
              placeholder="Start %"
              className="input"
            />
          </li>
        </ul>
      </div>
    </div>
  );
}
