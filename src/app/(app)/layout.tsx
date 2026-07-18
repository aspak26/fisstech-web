import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/modules/shell/sidebar";
import { Topbar } from "@/components/modules/shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, plan_type")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex h-full min-h-screen bg-bg">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <Topbar
            name={profile?.name ?? ""}
            email={profile?.email ?? user.email ?? ""}
            planType={profile?.plan_type ?? "free"}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
