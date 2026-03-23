import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAllVersionsWithFeatures } from "@/hooks/useFeatures";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WsjfCompare({ open, onClose }: Props) {
  const { data: versions = [] } = useAllVersionsWithFeatures();
  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");

  const vA = versions.find((v) => v.id === idA);
  const vB = versions.find((v) => v.id === idB);

  const radarData = [
    { metric: "Business Value", A: vA?.business_value ?? 0, B: vB?.business_value ?? 0 },
    { metric: "Time Criticality", A: vA?.time_criticality ?? 0, B: vB?.time_criticality ?? 0 },
    { metric: "Risk Reduction", A: vA?.risk_reduction ?? 0, B: vB?.risk_reduction ?? 0 },
    { metric: "Job Size", A: vA?.job_size ?? 0, B: vB?.job_size ?? 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>WSJF Comparison</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Version A</label>
            <Select value={idA} onValueChange={setIdA}>
              <SelectTrigger><SelectValue placeholder="Select version…" /></SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.feature?.title} — {v.version_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Version B</label>
            <Select value={idB} onValueChange={setIdB}>
              <SelectTrigger><SelectValue placeholder="Select version…" /></SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.feature?.title} — {v.version_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {vA && vB && (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <Radar name={vA.version_name} dataKey="A" stroke="hsl(216,70%,45%)" fill="hsl(216,70%,45%)" fillOpacity={0.3} />
                <Radar name={vB.version_name} dataKey="B" stroke="hsl(142,71%,45%)" fill="hsl(142,71%,45%)" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>

            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left pb-1">Metric</th>
                  <th className="text-right pb-1">{vA.version_name}</th>
                  <th className="text-right pb-1">{vB.version_name}</th>
                </tr>
              </thead>
              <tbody>
                {radarData.map((row) => (
                  <tr key={row.metric} className="border-b last:border-0">
                    <td className="py-1 text-muted-foreground">{row.metric}</td>
                    <td className="py-1 text-right font-mono">{row.A}</td>
                    <td className="py-1 text-right font-mono">{row.B}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1 font-semibold">WSJF Score</td>
                  <td className="py-1 text-right font-mono font-semibold">{vA.wsjf_score?.toFixed(2)}</td>
                  <td className="py-1 text-right font-mono font-semibold">{vB.wsjf_score?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
