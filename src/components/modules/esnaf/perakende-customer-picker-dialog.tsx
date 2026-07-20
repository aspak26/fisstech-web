"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createPerakendeCustomer } from "@/lib/data/perakende";
import type { PerakendeCustomerRow } from "@/lib/types/esnaf";

export function PerakendeCustomerPickerDialog({
  open,
  onClose,
  businessId,
  customers,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  customers: PerakendeCustomerRow[];
  onSelect: (customerId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [customers, query],
  );

  async function handleAddAndSelect() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const id = await createPerakendeCustomer(supabase, businessId, user.id, newName.trim(), newPhone || null);
      setNewName("");
      setNewPhone("");
      setShowAddForm(false);
      onSelect(id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Veresiye Müşterisi Seç">
      <div className="space-y-3">
        <Input placeholder="Müşteri ara…" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex w-full items-center justify-between rounded-control px-3 py-2.5 text-left hover:bg-bg"
            >
              <span className="text-text-primary">{c.name}</span>
              {c.phone && <span className="text-sm text-text-secondary">{c.phone}</span>}
            </button>
          ))}
          {filtered.length === 0 && !showAddForm && (
            <p className="py-4 text-center text-sm text-text-secondary">Müşteri bulunamadı</p>
          )}
        </div>

        {showAddForm ? (
          <div className="space-y-3 rounded-control border border-border p-3">
            <div>
              <Label htmlFor="new-cust-name">Ad Soyad</Label>
              <Input id="new-cust-name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
            <div>
              <Label htmlFor="new-cust-phone">Telefon (isteğe bağlı)</Label>
              <Input id="new-cust-phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            </div>
            <Button type="button" className="w-full" disabled={saving || !newName.trim()} onClick={handleAddAndSelect}>
              {saving ? "Ekleniyor…" : "Ekle ve Seç"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-border py-2.5 text-sm font-medium text-accent hover:border-accent"
          >
            <UserPlus className="h-4 w-4" /> Yeni Müşteri Ekle
          </button>
        )}
      </div>
    </Dialog>
  );
}
