import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MapData {
  municipio: string;
  count: number;
}

interface Props {
  data: MapData[];
  selectedSemana?: string;
}

// Color scale from white to red
function getHeatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "#f4f6f7";
  const ratio = count / max;
  // Interpolate from light gray to red
  const r = Math.round(244 + (239 - 244) * ratio);
  const g = Math.round(246 + (68 - 246) * ratio);
  const b = Math.round(247 + (68 - 247) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function MeridaMap({ data, selectedSemana }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    municipio: string;
    count: number;
  } | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await fetch("/merida-map.svg");
        const svgText = await response.text();
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText;
          const svg = containerRef.current.querySelector("svg");
          if (svg) {
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.style.maxWidth = "800px";
            svg.style.margin = "0 auto";
            svg.style.display = "block";

            // Apply colors
            const maxCount = Math.max(...data.map((d) => d.count), 1);
            const dataMap = new Map(data.map((d) => [d.municipio.toUpperCase(), d.count]));

            const paths = svg.querySelectorAll("path[id]");
            paths.forEach((path) => {
              const id = path.getAttribute("id") || "";
              const municipioName = path.getAttribute("data-municipio") || "";
              const count = dataMap.get(municipioName.toUpperCase()) || 0;
              const color = getHeatColor(count, maxCount);
              (path as SVGPathElement).style.fill = color;
              (path as SVGPathElement).style.cursor = "pointer";
              (path as SVGPathElement).style.transition = "fill 0.3s ease";

              path.addEventListener("mouseenter", (e) => {
                const rect = (e.target as SVGPathElement).getBoundingClientRect();
                const containerRect = containerRef.current!.getBoundingClientRect();
                setTooltip({
                  x: rect.left - containerRect.left + rect.width / 2,
                  y: rect.top - containerRect.top,
                  municipio: municipioName,
                  count,
                });
                (path as SVGPathElement).style.fill = "#b91c1c";
              });

              path.addEventListener("mouseleave", () => {
                setTooltip(null);
                (path as SVGPathElement).style.fill = color;
              });
            });
          }
        }
      } catch (err) {
        console.error("Error loading map:", err);
      }
    };

    loadMap();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, selectedSemana]);

  return (
    <div className="relative" style={{ minHeight: "400px" }}>
      <div ref={containerRef} className="w-full flex justify-center" />

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="font-semibold text-sm">{tooltip.municipio}</p>
            <p className="text-xs text-gray-300">{tooltip.count} casos</p>
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 transform -translate-x-1/2 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <span>0 casos</span>
        <div className="w-32 h-3 rounded-full" style={{
          background: "linear-gradient(to right, #f4f6f7, #ffcccc, #ef4444, #b91c1c)"
        }} />
        <span>Max</span>
      </div>
    </div>
  );
}
