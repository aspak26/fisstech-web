import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// "next" kullanıcı kontrolündeki bir URL parametresidir; doğrulanmadan
// redirect'e verilirse açık yönlendirme (open redirect) oluşur — örn.
// "https://origin@evil.com" gibi bir değer, origin'i userinfo kısmına
// gömüp gerçek host'u evil.com yapabilir. Sadece tek "/" ile başlayan,
// "//" veya "@" içermeyen aynı-origin göreli yollara izin veriyoruz.
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("@") || next.includes("\\")) {
    return "/dashboard";
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Yönlendirme başarısız olursa login'e geri dön (isteğe bağlı olarak error query parametresi eklenebilir)
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
