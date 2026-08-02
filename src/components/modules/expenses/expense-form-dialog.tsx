"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2, BadgeCheck, Users, Globe, Lock, FolderPlus, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { predictCategory } from "@/lib/expenses/category-predictor";
import { assignExpenseToGroups, getExpenseGroupIds, type GroupRow } from "@/lib/data/groups";
import { CategoryAddInline } from "./category-add-dialog";
import { DropzoneUploader } from "@/components/modules/scan/dropzone-uploader";
import { uploadReceipts } from "@/lib/scan/saveExpense";
import type { CategoryOption } from "@/lib/scan/types";
import type { ExpenseWithItems } from "@/lib/data/expenses";
import type { CategoriesRow } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/currency";

const PAYMENT_METHODS = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "debit_card", label: "Banka Kartı" },
  { value: "unknown", label: "Bilinmiyor" },
];

interface FormValues {
  storeName: string;
  date: string;
  paymentMethod: string;
  cardLabel: string;
  note: string;
  total: number;
  items: { name: string; category: string; price: number; quantity: number }[];
}

export function ExpenseFormDialog({
  open,
  onClose,
  categories,
  expense,
  categoryNamesById,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  expense?: ExpenseWithItems;
  categoryNamesById: Map<string, string>;
  groups: GroupRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCategoryName = categories.find((c) => c.name === "Diğer")?.name ?? categories[0]?.name ?? "Diğer";

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    values: {
      storeName: expense?.store_name ?? "",
      date: expense?.date ?? new Date().toISOString().slice(0, 10),
      paymentMethod: expense?.payment_method ?? "cash",
      cardLabel: expense?.card_label ?? "",
      note: expense?.note ?? "",
      total: expense ? Number(expense.total) : 0,
      items: expense
        ? expense.expense_items.map((i) => ({
            name: i.name,
            category: categoryNamesById.get(i.category_id ?? "") ?? defaultCategoryName,
            price: Number(i.price),
            quantity: i.quantity,
          }))
        : [{ name: "", category: defaultCategoryName, price: 0, quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Mobildeki expense_detail_screen.dart'ta "Toplam Tutar" kalemlerden
  // BAĞIMSIZ, doğrudan düzenlenebilir kendi alanı — kalem sayısı/tutarı
  // ne olursa olsun ayrıca saklanıyor. Web'de önceden total HER KAYITTA
  // kalemlerin toplamından yeniden hesaplanıyordu; kalemsiz bir harcamayı
  // (örn. grup hedefine katkı — mobil bunu 0 kalemli bir harcama olarak
  // kaydediyor) sadece açıp kaydetmek gerçek tutarı sessizce ₺0'a
  // düşürüyordu. Artık `total` kendi alanı: DÜZENLERKEN her zaman
  // `expense.total`'dan başlıyor ve kalemler değişse bile OTOMATİK
  // değişmiyor (mobille birebir); YENİ manuel harcamada kullanıcı henüz
  // elle bir tutar girmediyse kalem toplamını takip ediyor (kolaylık).
  const totalTouchedRef = useRef(!!expense);

  // ── Yeni kategori ekleme (mobildeki CategoryPickerSheet "Yeni") ───────────

  // ── Yeni kategori ekleme (mobildeki CategoryPickerSheet "Yeni") ───────────
  const [extraCategories, setExtraCategories] = useState<CategoriesRow[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const allCategoryOptions: CategoryOption[] = useMemo(
    () => [...categories, ...extraCategories.map((c) => ({ name: c.name, group: c.parent_group ?? "Diğer", emoji: c.icon }))],
    [categories, extraCategories],
  );
  const categoryGroups = useMemo(
    () => [...new Set(allCategoryOptions.map((c) => c.group || "Diğer"))].sort(),
    [allCategoryOptions],
  );
  const categoryNames = useMemo(() => [...new Set(allCategoryOptions.map((c) => c.name))], [allCategoryOptions]);
  const categoryEmojiByName = new Map(allCategoryOptions.map((c) => [c.name, c.emoji]));
  const predictableCategories = useMemo(
    () => categoryNames.map((name) => ({ id: name, name })),
    [categoryNames],
  );

  const paymentMethod = watch("paymentMethod");
  const showCardLabel = paymentMethod === "credit_card" || paymentMethod === "debit_card";

  // ── Taksitli Harcama state ────────────────────────────────────────────────
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("12");
  const [customMode, setCustomMode] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [customAmounts, setCustomAmounts] = useState<string[]>([]);

  // ── Gruba Ekle state ──────────────────────────────────────────────────────
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [groupOnly, setGroupOnly] = useState(false);

  // ── Fiş/Belge eki state (mevcut taranmış fiş görselleri + yeni eklenenler) ─
  const [keptReceiptUrls, setKeptReceiptUrls] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    totalTouchedRef.current = !!expense;
    const inst = expense?.installment ?? null;
    setIsInstallment(!!inst);
    setInstallmentCount(String(inst?.total_count ?? 12));
    setCustomMode(!!inst?.custom_amounts && inst.custom_amounts.length > 0);
    setMonthlyAmount(inst ? String(inst.monthly_amount) : "");
    setCustomAmounts(inst?.custom_amounts?.map((a) => String(a)) ?? []);
    setGroupOnly(expense?.visibility === "group_only");
    setKeptReceiptUrls(expense?.receipt_image_url ? expense.receipt_image_url.split(",").filter(Boolean) : []);
    setAttachedFiles([]);
    setAttachError(null);

    if (expense) {
      getExpenseGroupIds(createClient(), expense.id).then((ids) => setSelectedGroupIds(new Set(ids)));
    } else {
      setSelectedGroupIds(new Set());
    }
  }, [open, expense]);

  function toggleInstallment(enabled: boolean) {
    setIsInstallment(enabled);
    if (enabled) {
      if (paymentMethod === "cash") setValue("paymentMethod", "credit_card");
    } else {
      setInstallmentCount("12");
      setCustomMode(false);
      setMonthlyAmount("");
      setCustomAmounts([]);
    }
  }

  function toggleCustomMode(enabled: boolean) {
    const count = Math.max(2, parseInt(installmentCount, 10) || 12);
    setCustomMode(enabled);
    if (enabled) {
      setCustomAmounts(Array.from({ length: count }, (_, i) => customAmounts[i] ?? ""));
      setMonthlyAmount("");
    } else {
      setCustomAmounts([]);
    }
  }

  function onInstallmentCountChange(value: string) {
    setInstallmentCount(value);
    if (customMode) {
      const count = Math.max(2, parseInt(value, 10) || 2);
      setCustomAmounts((prev) => Array.from({ length: count }, (_, i) => prev[i] ?? ""));
    }
  }

  const installmentTotal = useMemo(() => {
    if (!isInstallment) return 0;
    const count = Math.max(1, parseInt(installmentCount, 10) || 1);
    if (customMode) {
      return customAmounts.reduce((sum, a) => sum + (parseFloat(a.replace(",", ".")) || 0), 0);
    }
    return count * (parseFloat(monthlyAmount.replace(",", ".")) || 0);
  }, [isInstallment, installmentCount, customMode, customAmounts, monthlyAmount]);

  // ── Otomatik kategori tahmini (debounced, mobile'daki CategoryPredictor) ──
  const debounceRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  function handleItemNameChange(index: number, value: string) {
    const existing = debounceRefs.current.get(index);
    if (existing) clearTimeout(existing);
    debounceRefs.current.set(
      index,
      setTimeout(() => {
        const trimmed = value.trim();
        if (trimmed.length < 2) return;
        const predicted = predictCategory(trimmed, predictableCategories);
        const currentCategory = watch(`items.${index}.category`);
        if (predicted && (!currentCategory || currentCategory === defaultCategoryName)) {
          setValue(`items.${index}.category`, predicted.name);
        }
      }, 400),
    );
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      // Sadece bu formda gerçekten kullanılan kategori adları için sorgu —
      // önceden .select("id, name") hiç scope'suz TÜM kategori tablosunu
      // (sistem + kullanıcının tüm özel kategorileri) her kayıtta yeniden
      // çekiyordu, sadece birkaç isim→id eşlemesi için.
      const usedCategoryNames = [...new Set(values.items.map((i) => i.category))];
      const { data: rawCategories } = await supabase
        .from("categories")
        .select("id, name")
        .in("name", usedCategoryNames);
      const categoryMap = new Map<string, string>(
        (rawCategories ?? []).map((c: { id: string; name: string }) => [c.name, c.id]),
      );

      const total = isInstallment ? installmentTotal : Number(values.total || 0);
      const cardLabel = showCardLabel && values.cardLabel.trim() ? values.cardLabel.trim() : null;

      const newReceiptUrls = attachedFiles.length > 0 ? await uploadReceipts(supabase, user.id, attachedFiles) : [];
      const receiptImageUrl = [...keptReceiptUrls, ...newReceiptUrls].join(",") || null;

      let expenseId: string;
      if (expense) {
        expenseId = expense.id;
        await supabase
          .from("expenses")
          .update({
            store_name: values.storeName || null,
            date: values.date,
            total,
            payment_method: values.paymentMethod,
            card_label: cardLabel,
            note: values.note || null,
            receipt_image_url: receiptImageUrl,
          })
          .eq("id", expense.id);
        await supabase.from("expense_items").delete().eq("expense_id", expense.id);
      } else {
        const { data: created, error: insertError } = await supabase
          .from("expenses")
          .insert({
            user_id: user.id,
            store_name: values.storeName || null,
            date: values.date,
            total,
            payment_method: values.paymentMethod,
            card_label: cardLabel,
            note: values.note || null,
            receipt_image_url: receiptImageUrl,
          })
          .select("id")
          .single();
        if (insertError || !created) throw insertError ?? new Error("Kaydedilemedi");
        expenseId = created.id as string;
      }

      await supabase.from("expense_items").insert(
        values.items.map((item) => ({
          expense_id: expenseId,
          name: item.name,
          category_id: categoryMap.get(item.category) ?? null,
          price: item.price,
          quantity: item.quantity,
        })),
      );

      if (isInstallment) {
        const count = Math.max(2, parseInt(installmentCount, 10) || 2);
        const custom = customMode
          ? customAmounts.map((a) => parseFloat(a.replace(",", ".")) || 0)
          : null;
        const monthly = custom
          ? Number((custom.reduce((s, a) => s + a, 0) / count).toFixed(2))
          : Number((parseFloat(monthlyAmount.replace(",", ".")) || total / count).toFixed(2));

        await supabase.from("installment_plans").upsert(
          {
            expense_id: expenseId,
            user_id: user.id,
            total_count: count,
            monthly_amount: monthly,
            paid_count: expense?.installment?.paid_count ?? 1,
            start_date: values.date,
            paid_states: expense?.installment?.paid_states ?? null,
            custom_amounts: custom,
          },
          { onConflict: "expense_id" },
        );
      } else if (expense?.installment) {
        await supabase.from("installment_plans").delete().eq("expense_id", expenseId);
      }

      try {
        await assignExpenseToGroups(
          supabase,
          expenseId,
          [...selectedGroupIds],
          groupOnly ? "group_only" : "public",
        );
      } catch {
        // best-effort, mirrors mobile — the expense itself is already saved
      }

      reset();
      onClose();
      router.refresh();
    } catch {
      setError("Kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={expense ? "Harcamayı Düzenle" : "Manuel Harcama Ekle"} className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-control border border-accent/30 bg-accent/5 p-3">
          <Switch
            checked={isInstallment}
            onChange={toggleInstallment}
            label="Taksitli Harcama"
            description="Aylık ödeme planı oluştur"
          />
        </div>

        {isInstallment && (
          <div className="space-y-3 rounded-control border border-border bg-bg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <BadgeCheck className="h-4 w-4 text-accent" /> Taksit Planı
            </div>
            <div>
              <Label htmlFor="installmentCount">Taksit Sayısı</Label>
              <Input
                id="installmentCount"
                type="number"
                min={2}
                value={installmentCount}
                onChange={(e) => onInstallmentCountChange(e.target.value)}
              />
            </div>
            <Switch
              checked={customMode}
              onChange={toggleCustomMode}
              label="Her taksit farklı tutar"
            />
            {customMode ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {customAmounts.map((amount, i) => (
                  <div key={i}>
                    <Label className="text-xs">{i + 1}. Taksit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) =>
                        setCustomAmounts((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Label htmlFor="monthlyAmount">Aylık Ödeme</Label>
                <Input
                  id="monthlyAmount"
                  type="number"
                  step="0.01"
                  placeholder="₺"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Aylık ödeme tutarını girin — toplam otomatik hesaplanır
                </p>
              </div>
            )}
            <p className="text-sm font-medium text-text-primary">
              Toplam: <span className="text-accent">{formatCurrency(installmentTotal)}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="storeName">İşyeri</Label>
            <Input id="storeName" {...register("storeName")} />
          </div>
          {!isInstallment && (
            <div>
              <Label htmlFor="total">Toplam Tutar</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                {...register("total", {
                  onChange: () => {
                    totalTouchedRef.current = true;
                  },
                })}
              />
            </div>
          )}
          <div>
            <Label htmlFor="date">Tarih</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
            <Select id="paymentMethod" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </Select>
          </div>
          {showCardLabel && (
            <div>
              <Label htmlFor="cardLabel">Kart (isteğe bağlı)</Label>
              <Input id="cardLabel" placeholder="örn. GARANTİ1234" {...register("cardLabel")} />
              <p className="mt-1 text-xs text-text-secondary">Limit takibinde kullanılır</p>
            </div>
          )}
          <div className={showCardLabel ? "sm:col-span-2" : ""}>
            <Label htmlFor="note">Not (opsiyonel)</Label>
            <Input id="note" {...register("note")} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Kalemler</Label>
            <div className="flex items-center gap-3">
              {!showAddCategory && (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  <FolderPlus className="h-3.5 w-3.5" /> Yeni kategori
                </button>
              )}
              <button
                type="button"
                onClick={() => append({ name: "", category: defaultCategoryName, price: 0, quantity: 1 })}
                className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Kalem ekle
              </button>
            </div>
          </div>
          {showAddCategory && (
            <div className="mb-2">
              <CategoryAddInline
                groups={categoryGroups}
                defaultGroup={categoryGroups[0] ?? "Diğer"}
                onCancel={() => setShowAddCategory(false)}
                onCreated={(category) => {
                  setExtraCategories((prev) => [...prev, category]);
                  setShowAddCategory(false);
                }}
              />
            </div>
          )}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  className="flex-[2]"
                  placeholder="Ürün adı"
                  {...register(`items.${index}.name`, {
                    onChange: (e) => handleItemNameChange(index, e.target.value),
                  })}
                />
                <Select className="flex-1" {...register(`items.${index}.category`)}>
                  {categoryNames.map((name) => (
                    <option key={name} value={name}>
                      {categoryEmojiByName.get(name) ?? ""} {name}
                    </option>
                  ))}
                </Select>
                <Input
                  className="w-24"
                  type="number"
                  step="0.01"
                  placeholder="Fiyat"
                  {...register(`items.${index}.price`)}
                />
                <Input
                  className="w-16"
                  type="number"
                  step="1"
                  placeholder="Adet"
                  {...register(`items.${index}.quantity`)}
                />
                <button
                  type="button"
                  aria-label="Kalemi sil"
                  onClick={() => fields.length > 1 && remove(index)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {!isInstallment && (
            <ItemsTotalDisplay control={control} setValue={setValue} totalTouchedRef={totalTouchedRef} />
          )}
        </div>

        <div className="rounded-control border border-border p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Paperclip className="h-4 w-4" /> Fiş/Belge <span className="font-normal text-text-secondary">(isteğe bağlı)</span>
          </div>
          {keptReceiptUrls.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {keptReceiptUrls.map((url, i) => (
                <li key={url} className="flex items-center justify-between gap-2 rounded-control bg-bg px-2.5 py-1.5 text-sm">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-accent hover:underline"
                  >
                    Ek {i + 1}
                  </a>
                  <button
                    type="button"
                    aria-label="Eki kaldır"
                    onClick={() => setKeptReceiptUrls((prev) => prev.filter((u) => u !== url))}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {attachedFiles.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {attachedFiles.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 rounded-control bg-bg px-2.5 py-1.5 text-sm">
                  <span className="truncate text-text-primary">{file.name}</span>
                  <button
                    type="button"
                    aria-label="Dosyayı kaldır"
                    onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DropzoneUploader
            multiple
            onFiles={(files) => {
              setAttachError(null);
              setAttachedFiles((prev) => [...prev, ...files]);
            }}
            onRejected={setAttachError}
            title="Fiş/belge fotoğrafı ekle"
            subtitle="JPEG veya PNG, maks. 5 MB"
            multiSubtitle="Birden fazla dosya seçebilirsin (JPEG/PNG, dosya başına maks. 5 MB)"
          />
          {attachError && <p className="mt-1.5 text-xs text-danger">{attachError}</p>}
        </div>

        {groups.length > 0 && (
          <div className={cn("rounded-control border p-3", selectedGroupIds.size > 0 ? "border-accent" : "border-border")}>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
              <Users className="h-4 w-4" /> Gruba Ekle <span className="font-normal text-text-secondary">(isteğe bağlı)</span>
            </div>
            <div className="space-y-2">
              {groups.map((g) => (
                <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.has(g.id)}
                    onChange={(e) =>
                      setSelectedGroupIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(g.id);
                        else next.delete(g.id);
                        return next;
                      })
                    }
                  />
                  {g.name}
                </label>
              ))}
            </div>
            {selectedGroupIds.size > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGroupOnly(false)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-control border px-2 py-2 text-xs font-medium",
                    !groupOnly ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                  )}
                >
                  <Globe className="h-3.5 w-3.5" /> İkisinde de
                </button>
                <button
                  type="button"
                  onClick={() => setGroupOnly(true)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-control border px-2 py-2 text-xs font-medium",
                    groupOnly ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                  )}
                >
                  <Lock className="h-3.5 w-3.5" /> Sadece grupta
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-text-secondary">
                Seçim yapılmazsa harcama sadece kişisel bütçende görünür.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : expense ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Kalem toplamını izole bir bileşende gösterir — önceden `watch("items")`
 * en üst seviyede çağrılıyordu, bu da HERHANGİ bir kalem alanına yapılan
 * her tuş vuruşunda 600+ satırlık formun TAMAMININ yeniden render olmasına
 * yol açıyordu. `useWatch` sadece bu küçük alt bileşeni yeniden render eder,
 * geri kalan form (register ile uncontrolled input'lar) etkilenmez.
 *
 * Bu artık sadece BİLGİLENDİRME amaçlı — "Toplam Tutar" kaydedilen gerçek
 * değer, kalemlerden bağımsız kendi alanı (mobille aynı, bkz. yukarıdaki
 * totalTouchedRef notu). Sadece kullanıcı henüz "Toplam Tutar"a elle
 * dokunmadıysa (yeni manuel harcama girerken bir kolaylık olarak) bu alanı
 * kalem toplamıyla senkron tutuyor — mevcut bir harcama düzenlenirken asla
 * otomatik değiştirmiyor. */
function ItemsTotalDisplay({
  control,
  setValue,
  totalTouchedRef,
}: {
  control: Control<FormValues>;
  setValue: (name: "total", value: number) => void;
  totalTouchedRef: { current: boolean };
}) {
  const items = useWatch({ control, name: "items" });
  const itemsTotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1), 0),
    [items],
  );

  useEffect(() => {
    if (!totalTouchedRef.current) setValue("total", itemsTotal);
  }, [itemsTotal, setValue, totalTouchedRef]);

  return (
    <p className="mt-2 text-sm text-text-secondary">
      Kalemler Toplamı: <span className="font-medium text-text-primary">{formatCurrency(itemsTotal)}</span>
    </p>
  );
}
