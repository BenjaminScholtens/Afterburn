import { useEffect, useRef } from 'react';
import type { RenderOptions } from '@/game/render/CanvasRenderer';
import { CanvasRenderer } from '@/game/render/CanvasRenderer';

interface DemoPaneProps {
  renderOptions: RenderOptions;
  onPointerMove?: (worldX: number, worldY: number) => void;
  onClick?: (worldX: number, worldY: number) => void;
  onPointerLeave?: () => void;
  width?: number;
  height?: number;
}

export function DemoPane({
  renderOptions,
  onPointerMove,
  onClick,
  onPointerLeave,
  width = 640,
  height = 480,
}: DemoPaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new CanvasRenderer(canvas);
    rendererRef.current.resize();
  }, []);

  useEffect(() => {
    rendererRef.current?.render(renderOptions);
  }, [renderOptions]);

  const handlePointer = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x, y } = renderOptions.viewport.screenToWorld(sx, sy);
    onPointerMove?.(x, y);
  };

  return (
    <div className="demo-pane" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerMove={handlePointer}
        onPointerDown={(e) => {
          handlePointer(e);
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          const { x, y } = renderOptions.viewport.screenToWorld(sx, sy);
          onClick?.(x, y);
        }}
        onPointerLeave={() => onPointerLeave?.()}
      />
    </div>
  );
}
