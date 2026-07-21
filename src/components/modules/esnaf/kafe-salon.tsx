"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { createTable, deleteTable, updateTable, type RestaurantTableRow, type TableStatus } from "@/lib/data/restaurant";

const STATUS_META: Record<TableStatus, { label: string; className: string }> = {
  empty: { label: "Boş", className: "border-border bg-surface text-text-primary" },
  occupied: { label: "Dolu", className: "border-danger bg-danger/10 text-danger" },
  bill_requested: { label: "Hesap İstedi", className: "border-warning bg-warning/15 text-text-primary" },
};

/** Ported from mobile's kafe_salon_screen.dart — grid + section tabs (NOT a
 * drag-positioned floor plan; position_x/position_y exist in the schema but
 * mobile never reads/writes them beyond the default 0, see PROGRESS.md). */
export function KafeSalon({ businessId, tables }: { businessId: string; tables: RestaurantTableRow[] }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTableRow | null>(null);
  const [name, setName] = useState("");
  const [section, setSection] = useState("İç Salon");
  const [capacity, setCapacity] = useState(4);
  const [saving, setSaving] = useState(false);

  const sections = useMemo(() => [...new Set(tables.map((t) => t.section))], [tables]);
  const visibleTables = activeSection === "all" ? tables : tables.filter((t) => t.section === activeSection);

  function openAdd() {
    setEditing(null);
    setName("");
    setSection(sections[0] ?? "İç Salon");
    setCapacity(4);
    setAddOpen(true);
  }
  function openEdit(table: RestaurantTableRow) {
    setEditing(table);
    setName(table.name);
    setCapacity(table.capacity);
    setAddOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      if (editing) {
        await updateTable(supabase, editing.id, { name: name.trim(), capacity });
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await createTable(supabase, { businessId, userId: user.id, name: name.trim(), section, capacity });
      }
      setAddOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(table: RestaurantTableRow) {
    if (!window.confirm(`"${table.name}" masası silinsin mi?`)) return;
    await deleteTable(createClient(), table.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              activeSection === "all" ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
            )}
          >
            Tümü
          </button>
          {sections.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                activeSection === s ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Masa Ekle
        </Button>
      </div>

      <div className="mb-2 flex gap-3 text-xs text-text-secondary">
        {(Object.keys(STATUS_META) as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={cn("h-2.5 w-2.5 rounded-full border", STATUS_META[s].className)} /> {STATUS_META[s].label}
          </span>
        ))}
      </div>

      {visibleTables.length === 0 ? (
        <Card>
          <EmptyState icon={LayoutGrid} title="Bu bölümde masa yok" />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleTables.map((table) => (
            <div key={table.id} className="group relative">
              <Link
                href={`/esnaf/kafe/masa/${table.id}`}
                className={cn("flex flex-col items-center justify-center gap-1 rounded-card border-2 p-4 text-center", STATUS_META[table.status].className)}
              >
                <p className="font-display font-semibold">{table.name}</p>
                <p className="text-xs opacity-80">{table.capacity} kişilik</p>
                <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{STATUS_META[table.status].label}</p>
              </Link>
              <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                <button
                  type="button"
                  aria-label="Masayı düzenle"
                  onClick={() => openEdit(table)}
                  className="flex h-6 w-6 items-center justify-center rounded-control bg-surface text-text-secondary shadow hover:text-accent"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Masayı sil"
                  onClick={() => handleDelete(table)}
                  className="flex h-6 w-6 items-center justify-center rounded-control bg-surface text-text-secondary shadow hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title={editing ? "Masayı Düzenle" : "Masa Ekle"}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="table-name">Masa Adı</Label>
            <Input id="table-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="table-capacity">Kapasite</Label>
              <Input id="table-capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            {!editing && (
              <div>
                <Label htmlFor="table-section">Bölüm</Label>
                <Select id="table-section" value={section} onChange={(e) => setSection(e.target.value)}>
                  {sections.length === 0 && <option value="İç Salon">İç Salon</option>}
                  {sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!sections.includes(section) && <option value={section}>{section}</option>}
                </Select>
                <Input
                  className="mt-1.5"
                  placeholder="Yeni bölüm adı yazabilirsin"
                  onChange={(e) => e.target.value && setSection(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button type="button" disabled={saving || !name.trim()} onClick={handleSave}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
