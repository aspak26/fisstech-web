"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Database, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { seedTestScenariosAction } from "@/lib/actions/seed";

export default function SeedTestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await seedTestScenariosAction();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          // Send user back to esnaf layout which redirects to dashboard or kurulum based on cookies
          router.push("/esnaf");
        }, 3000);
      } else {
        setError(result.error || "Bilinmeyen bir hata oluştu.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-lg p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <Database className="h-10 w-10 text-accent" />
        </div>
        
        <h1 className="mb-4 font-display text-2xl font-bold text-text-primary">
          Test Verilerini Yükle
        </h1>
        
        <p className="mb-8 text-text-secondary">
          Bu işlem hesabınıza 6 farklı sektörden (Hizmet, Perakende, Yeme İçme, Satış, Toptan, Freelance) örnek işletmeler, personeller, ürünler ve test müşterileri ekleyecektir.
        </p>

        {error && (
          <div className="mb-6 rounded-card bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-6 flex flex-col items-center justify-center space-y-3 text-success">
            <CheckCircle2 className="h-12 w-12" />
            <p className="font-semibold">Test verileri başarıyla yüklendi!</p>
            <p className="text-sm">Ana sayfaya yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full text-base font-semibold"
            disabled={isLoading}
            onClick={handleSeed}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Veriler Enjekte Ediliyor...
              </>
            ) : (
              "Tüm Senaryoları Üret"
            )}
          </Button>
        )}
      </Card>
    </div>
  );
}
