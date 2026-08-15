"use client";

import { useState } from "react";
import { Label, Select } from "@/components/ui/input";
import { cardDisplayLabel } from "@/lib/data/cards";
import type { CardsRow } from "@/lib/types/database";
import { CardAddInline } from "./card-add-inline";

/** Kredi/banka kartı ödeme yöntemi seçildiğinde gösterilen kart seçici —
 * mobildeki CardPickerSheet'in web karşılığı. Serbest metin card_label
 * alanının yerini alır (expense-form-dialog.tsx / subscription-form-dialog.tsx). */
export function CardPickerField({
  cards,
  cardType,
  value,
  onChange,
  onCardCreated,
}: {
  cards: CardsRow[];
  cardType: "credit_card" | "debit_card";
  value: string;
  onChange: (cardId: string) => void;
  onCardCreated: (card: CardsRow) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const filtered = cards.filter((c) => c.card_type === cardType);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="mb-0">Kart (isteğe bağlı)</Label>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium text-accent hover:underline"
          >
            + Yeni kart
          </button>
        )}
      </div>
      {showAdd ? (
        <CardAddInline
          cardType={cardType}
          onCancel={() => setShowAdd(false)}
          onCreated={(card) => {
            onCardCreated(card);
            onChange(card.id);
            setShowAdd(false);
          }}
        />
      ) : (
        <>
          <Select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Kart seçme</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {cardDisplayLabel(c)}
              </option>
            ))}
          </Select>
          {filtered.length === 0 && (
            <p className="mt-1 text-xs text-text-secondary">Henüz bu türde kayıtlı kartın yok.</p>
          )}
        </>
      )}
    </div>
  );
}
