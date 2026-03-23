import SprintBoard from "@/components/SprintBoard";
import { useAllSprints } from "@/hooks/useSprints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BurndownChart from "@/components/BurndownChart";
import { useAllTasks } from "@/hooks/useFeatures";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Sprint() {
  const { data: sprints = [] } = useAllSprints();
  const { data: allTasks = [] } = useAllTasks();
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Sprint Planning</h1>

      {sprints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Burndown Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select sprint for burndown…" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.filter((s) => s.start_date && s.end_date).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSprint?.start_date && selectedSprint.end_date ? (
              <BurndownChart
                tasks={allTasks}
                startDate={selectedSprint.start_date}
                endDate={selectedSprint.end_date}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Select a sprint with start and end dates.</p>
            )}
          </CardContent>
        </Card>
      )}

      <SprintBoard />
    </div>
  );
}
