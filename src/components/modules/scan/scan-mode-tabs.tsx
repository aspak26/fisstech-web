import { Tabs } from "@/components/ui/tabs";

export type ScanMode = "single" | "multi";

export function ScanModeTabs({
  mode,
  onChange,
}: {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}) {
  return (
    <Tabs
      value={mode}
      onChange={(v) => onChange(v as ScanMode)}
      options={[
        { value: "single", label: "Tekli Fiş" },
        { value: "multi", label: "Uzun Fiş (Çoklu)" },
      ]}
    />
  );
}
