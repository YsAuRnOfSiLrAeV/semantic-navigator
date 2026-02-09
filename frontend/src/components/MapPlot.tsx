import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Point } from "../api/api";

type Props = {
  points: Point[];
  onSelect: (id: string) => void;
};

function clusterColor(cluster: number, k:number): string {
  const hue = (cluster * (360 / k)) % 360;
  return `hsl(${hue} 70% 55%)`;
}

export function MapPlot({ points, onSelect }: Props) {
  // memo to recalculate points' appearance only when points change
  const plotData = useMemo(() => {
    const x = points.map((p) => p.x);
    const y = points.map((p) => p.y);
    const ids = points.map((p) => p.id);
    //creates an array of strings for hover tooltips
    const text = points.map(
      (p) => `${p.headline}<br><span style="opacity:.7">${p.category}</span>`,
    );
    const k = Math.max(...points.map((p) => p.cluster)) + 1;
    const colors = points.map((p) => clusterColor(p.cluster, k));

    return [
      {
        type: "scattergl",
        mode: "markers",
        x,
        y,
        customdata: ids,
        text,
        hovertemplate: "%{text}<extra></extra>", // empty extra not to show 'trace 0'
        marker: { color: colors, size: 7, opacity: 0.75 },
      } as const,
    ];
  }, [points]);

  return (
    <Plot
      data={plotData}
      layout={{
        autosize: true,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        margin: { l: 10, r: 10, t: 10, b: 10 },
        // Axes are unitless embedding dimensions, so we hide labels to reduce noise.
        xaxis: {
          title: { text: "" },
          zeroline: false,
          showgrid: true,
          showticklabels: false,
          ticks: "",
        },
        yaxis: {
          title: { text: "" },
          zeroline: false,
          showgrid: true,
          showticklabels: false,
          ticks: "",
        },
        dragmode: "pan",
      }}
      config={{ displayModeBar: false, scrollZoom: true, responsive: true }}
      style={{ width: "100%", height: "100%" }}
      onClick={(ev) => {
        const pt = ev.points?.[0];  // can be clicked many points at once, so takes the first one
        const id = pt?.customdata as string | undefined;
        if (id) onSelect(id);
      }}
    />
  );
}
