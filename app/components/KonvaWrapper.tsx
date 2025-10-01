// app/prisoners-and-boxes/page.tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PrisonersAndBoxes = dynamic(() => import("./PrisonersAndBoxes"), {
  ssr: false,
});

const KonvaWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full flex-1 border">
      {size && (
        <PrisonersAndBoxes width={size.width} height={size.height} />
      )}
    </div>
  );
};

export default KonvaWrapper;
