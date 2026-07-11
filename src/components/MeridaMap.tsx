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

// Priority color system matching the official Mérida dengue report
function getPriorityColor(count: number): { fill: string; stroke: string; priority: number; label: string } {
  if (count >= 60) {
    return { fill: "#dc2626", stroke: "#991b1b", priority: 1, label: "1. PRIORIDAD (60 y más casos)" };
  } else if (count >= 16) {
    return { fill: "#f59e0b", stroke: "#b45309", priority: 2, label: "2. PRIORIDAD (16 a 59 casos)" };
  } else if (count >= 3) {
    return { fill: "#facc15", stroke: "#a16207", priority: 3, label: "3. PRIORIDAD (3 a 15 casos)" };
  } else {
    return { fill: "#22c55e", stroke: "#15803d", priority: 4, label: "4. PRIORIDAD (0 a 2 casos)" };
  }
}

export default function MeridaMap({ data, selectedSemana }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    municipio: string;
    count: number;
  } | null>(null);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await fetch("/merida-map.svg");
        const svgText = await response.text();
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText;
          const svg = containerRef.current.querySelector("svg");
          if (!svg) return;

          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.style.maxWidth = "100%";
          svg.style.display = "block";

          const dataMap = new Map(data.map((d) => [d.municipio.toUpperCase(), d.count]));
          const paths = svg.querySelectorAll("path[id]");

          // Group for text labels
          let textGroup = svg.querySelector("#case-labels");
          if (!textGroup) {
            textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            textGroup.setAttribute("id", "case-labels");
            svg.appendChild(textGroup);
          } else {
            textGroup.innerHTML = "";
          }

          paths.forEach((path) => {
            const municipioName = path.getAttribute("data-municipio") || "";
            const count = dataMap.get(municipioName.toUpperCase()) || 0;
            const color = getPriorityColor(count);

            (path as SVGPathElement).style.fill = color.fill;
            (path as SVGPathElement).style.stroke = color.stroke;
            (path as SVGPathElement).style.strokeWidth = "1.5";
            (path as SVGPathElement).style.cursor = "pointer";
            (path as SVGPathElement).style.transition = "fill 0.3s ease, stroke-width 0.2s ease";

            // Calculate centroid for text label
            const bbox = (path as SVGPathElement).getBBox();
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;

            // Add case count text
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", String(cx));
            text.setAttribute("y", String(cy));
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("font-family", "Arial, sans-serif");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("font-size", count >= 100 ? "18" : count >= 10 ? "16" : "14");
            text.setAttribute("fill", count >= 60 ? "#ffffff" : "#1f2937");
            text.setAttribute("pointer-events", "none");
            text.textContent = String(count);
            textGroup!.appendChild(text);

            // Hover events
            path.addEventListener("mouseenter", (e) => {
              const rect = (e.target as SVGPathElement).getBoundingClientRect();
              const containerRect = containerRef.current!.getBoundingClientRect();
              setTooltip({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top,
                municipio: municipioName,
                count,
              });
              (path as SVGPathElement).style.strokeWidth = "3";
              (path as SVGPathElement).style.filter = "brightness(1.1)";
            });

            path.addEventListener("mouseleave", () => {
              setTooltip(null);
              (path as SVGPathElement).style.strokeWidth = "1.5";
              (path as SVGPathElement).style.filter = "none";
            });
          });
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

  // Priority legend items
  const legendItems = [
    { color: "#dc2626", label: "1. PRIORIDAD (60 y + casos)" },
    { color: "#f59e0b", label: "2. PRIORIDAD (16 a 59 casos)" },
    { color: "#facc15", label: "3. PRIORIDAD (3 a 15 casos)" },
    { color: "#22c55e", label: "4. PRIORIDAD (0 a 2 casos)" },
  ];

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="w-full" style={{ height: "520px" }} />

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
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: item.color }} />
            <span className="text-gray-700 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
