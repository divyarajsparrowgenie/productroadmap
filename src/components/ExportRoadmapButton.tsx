import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Image, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  targetId: string;
}

export default function ExportRoadmapButton({ targetId }: Props) {
  const [loading, setLoading] = useState(false);

  const exportPNG = async () => {
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = document.getElementById(targetId);
      if (!el) { toast.error("Roadmap element not found"); return; }
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = "roadmap.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG downloaded");
    } catch (e) {
      toast.error("Failed to export PNG");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const el = document.getElementById(targetId);
      if (!el) { toast.error("Roadmap element not found"); return; }
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save("roadmap.pdf");
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="h-4 w-4 mr-1" />
          {loading ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportPNG}>
          <Image className="h-4 w-4 mr-2" /> Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF}>
          <FileText className="h-4 w-4 mr-2" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
