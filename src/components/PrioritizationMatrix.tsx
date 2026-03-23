import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from "recharts";

type VersionData = {
  id: string;
  version_name: string;
  business_value: number;
  time_criticality: number;
  risk_reduction: number;
  job_size: number;
  wsjf_score: number | null;
  feature?: { title: string } | undefined;
};

export function PrioritizationMatrix({ versions }: { versions: VersionData[] }) {
  const data = useMemo(() => {
    return versions
      .filter((v) => v.wsjf_score != null)
      .map((v) => ({
        name: `${v.feature?.title ?? ""} — ${v.version_name}`,
        cod: v.business_value + v.time_criticality + v.risk_reduction,
        duration: v.job_size,
        wsjf: v.wsjf_score!,
      }));
  }, [versions]);

  const getQuadrantColor = (cod: number, duration: number) => {
    const highCod = cod > 15;
    const lowDuration = duration <= 5;
    if (highCod && lowDuration) return "hsl(160, 60%, 50%)"; // First - green
    if (highCod && !lowDuration) return "hsl(195, 60%, 70%)"; // High CoD, High Duration - light blue
    if (!highCod && lowDuration) return "hsl(195, 60%, 70%)"; // Low CoD, Low Duration - light blue
    return "hsl(330, 50%, 65%)"; // Last - pink
  };

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          dataKey="duration"
          name="Job Size"
          domain={[0, 11]}
          tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
        >
          <Label value="Job Size (Duration)" position="bottom" offset={10} style={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="cod"
          name="Cost of Delay"
          domain={[0, 31]}
          tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
        >
          <Label value="Cost of Delay (BV+TC+RR)" angle={-90} position="insideLeft" offset={0} style={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }} />
        </YAxis>
        <ReferenceLine x={5.5} stroke="hsl(215, 16%, 70%)" strokeDasharray="4 4" />
        <ReferenceLine y={15} stroke="hsl(215, 16%, 70%)" strokeDasharray="4 4" />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-popover border border-border rounded-md p-2 shadow-md text-xs">
                <p className="font-medium text-popover-foreground">{d.name}</p>
                <p className="text-muted-foreground">CoD: {d.cod} · Size: {d.duration} · WSJF: {d.wsjf.toFixed(1)}</p>
              </div>
            );
          }}
        />
        <Scatter data={data} fill="hsl(216, 70%, 45%)">
          {data.map((entry, i) => (
            <Cell key={i} fill={getQuadrantColor(entry.cod, entry.duration)} r={8} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
