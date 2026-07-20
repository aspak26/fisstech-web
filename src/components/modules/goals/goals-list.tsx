"use client";

import { useState } from "react";
import { Plus, Target, PiggyBank } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteGoal, type GoalRow, type SavingsPoolRow } from "@/lib/data/goals";
import { GoalFormDialog } from "./goal-form-dialog";
import { ContributeDialog } from "./contribute-dialog";
import { SavingsPoolCard } from "./savings-pool-card";
import { AddToPoolDialog } from "./add-to-pool-dialog";

export function GoalsList({ goals, pool }: { goals: GoalRow[]; pool: SavingsPoolRow }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributing, setContributing] = useState<GoalRow | null>(null);
  const [addingFunds, setAddingFunds] = useState(false);

  async function handleDelete(goal: GoalRow) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await deleteGoal(supabase, user.id, goal);
  }

  return (
    <div className="space-y-4">
      <SavingsPoolCard pool={pool} onAddFunds={() => setAddingFunds(true)} />

      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni Hedef
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState icon={Target} title="Henüz bir hedef eklenmedi" description="Araba, tatil ya da birikim hedefini ekle." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = Math.min(
              100,
              Number(goal.target_amount) > 0
                ? (Number(goal.saved_amount) / Number(goal.target_amount)) * 100
                : 0,
            );
            const completed = !!goal.completed_at;
            return (
              <Card key={goal.id}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.emoji}</span>
                    <p className="font-medium text-text-primary">{goal.name}</p>
                  </div>
                  <DeleteButton
                    confirmMessage={`"${goal.name}" hedefi silinecek. Biriken tutar havuza iade edilir.`}
                    onDelete={() => handleDelete(goal)}
                  />
                </div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-bg">
                  <div
                    className={`h-full rounded-full ${completed ? "bg-success" : "bg-accent"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mb-3 text-sm text-text-secondary">
                  {formatCurrency(Number(goal.saved_amount))} / {formatCurrency(Number(goal.target_amount))}{" "}
                  ({progress.toFixed(0)}%)
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => setContributing(goal)}
                  disabled={completed}
                >
                  <PiggyBank className="h-4 w-4" /> {completed ? "Tamamlandı" : "Para Ekle"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <GoalFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <ContributeDialog
        goal={contributing}
        poolBalance={Number(pool.balance)}
        onClose={() => setContributing(null)}
        onAddFunds={() => setAddingFunds(true)}
      />
      <AddToPoolDialog open={addingFunds} onClose={() => setAddingFunds(false)} />
    </div>
  );
}
