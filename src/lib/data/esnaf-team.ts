import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessStaffRole, BusinessStaffRow, BusinessInviteRow } from "@/lib/types/esnaf";

/** Güvenlik denetimi bulgusu: Ekip mutasyonları (rol değiştir/çıkar/davet
 * iptal) sadece `.eq("id", ...)` ile RLS'e güveniyordu — sunucu tarafında
 * hiçbir sahiplik yeniden-doğrulaması yoktu. `businesses` tablosunun RLS
 * SELECT politikası zaten sahibi-dışı sorguları döndürmüyor, bu fonksiyon
 * o gerçeği açıkça kontrol edip anlamlı bir hata fırlatarak defense-in-depth
 * ekliyor (RLS tek başına yeterli olsa bile, ikinci bir katman). */
async function assertIsBusinessOwner(supabase: SupabaseClient, businessId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı");
  const { data: business } = await supabase.from("businesses").select("user_id").eq("id", businessId).maybeSingle();
  if (!business || business.user_id !== user.id) {
    throw new Error("Bu işlem için işletme sahibi olmanız gerekiyor");
  }
}

/** Aktif (left_at IS NULL) business_staff sayısı — SADECE bu sayaç
 * users.esnaf_staff_limit kotasına dahildir. employees (manuel personel
 * defteri) tablosu bu sayaca kesinlikle dahil edilmez, iki sayaç
 * birbirinden tamamen bağımsızdır (kullanıcı talebi). */
export async function getActiveStaffCount(supabase: SupabaseClient, businessId: string): Promise<number> {
  const { count } = await supabase
    .from("business_staff")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .is("left_at", null);
  return count ?? 0;
}

export interface StaffWithUser extends BusinessStaffRow {
  userName: string | null;
  userEmail: string | null;
}

/** Sahip-only görünüm — business_staff'ın RLS SELECT politikası personel
 * için sadece kendi satırını döndürür, tam roster sadece sahibe açılır. */
export async function getActiveStaff(supabase: SupabaseClient, businessId: string): Promise<StaffWithUser[]> {
  try {
    const { data } = await supabase
      .from("business_staff")
      .select("*, users(name, email)")
      .eq("business_id", businessId)
      .is("left_at", null)
      .order("joined_at");

    interface Row extends BusinessStaffRow {
      users: { name: string | null; email: string | null } | { name: string | null; email: string | null }[] | null;
    }
    return ((data ?? []) as unknown as Row[]).map((r) => {
      const u = Array.isArray(r.users) ? (r.users[0] ?? null) : r.users;
      return { ...r, userName: u?.name ?? null, userEmail: u?.email ?? null };
    });
  } catch {
    return [];
  }
}

export async function getPendingInvites(supabase: SupabaseClient, businessId: string): Promise<BusinessInviteRow[]> {
  try {
    const { data } = await supabase
      .from("business_invites")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return (data ?? []) as BusinessInviteRow[];
  } catch {
    return [];
  }
}

/** Kota kontrolü çağıran taraftan (sayfa bileşeni) yapılır — bu fonksiyon
 * sadece daveti oluşturur, esnaf_staff_limit karşılaştırmasını bilmez. */
export async function createStaffInvite(
  supabase: SupabaseClient,
  businessId: string,
  role: BusinessStaffRole,
  createdBy: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("business_invites")
    .insert({ business_id: businessId, role, created_by: createdBy })
    .select("token")
    .single();
  if (error || !data) throw error ?? new Error("Davet oluşturulamadı");
  return data.token as string;
}

export async function cancelInvite(supabase: SupabaseClient, businessId: string, inviteId: string): Promise<void> {
  await assertIsBusinessOwner(supabase, businessId);
  const { error } = await supabase
    .from("business_invites")
    .update({ status: "expired" })
    .eq("id", inviteId)
    .eq("business_id", businessId);
  if (error) throw error;
}

export interface StaffInvitePreview {
  businessId: string;
  businessName: string;
  role: BusinessStaffRole;
  status: string;
  expiresAt: string;
}

export async function getStaffInvitePreview(supabase: SupabaseClient, token: string): Promise<StaffInvitePreview | null> {
  const { data, error } = await supabase.rpc("get_business_invite_preview", { p_token: token });
  if (error || !data || data.length === 0) return null;
  const row = data[0] as { business_id: string; business_name: string; role: string; status: string; expires_at: string };
  return {
    businessId: row.business_id,
    businessName: row.business_name,
    role: row.role as BusinessStaffRole,
    status: row.status,
    expiresAt: row.expires_at,
  };
}

/** SECURITY DEFINER RPC — token'ı doğrular, business_staff'a upsert eder,
 * daveti accepted işaretler. Kota kontrolü zaten davet OLUŞTURULURKEN
 * yapıldığı için burada tekrar edilmiyor. */
export async function acceptStaffInvite(supabase: SupabaseClient, token: string): Promise<{ businessId: string }> {
  const { data, error } = await supabase.rpc("accept_business_invite", { p_token: token });
  if (error) throw error;
  const result = data as { business_id: string };
  return { businessId: result.business_id };
}

export async function updateStaffRole(
  supabase: SupabaseClient,
  businessId: string,
  staffId: string,
  role: BusinessStaffRole,
): Promise<void> {
  await assertIsBusinessOwner(supabase, businessId);
  const { error } = await supabase
    .from("business_staff")
    .update({ role })
    .eq("id", staffId)
    .eq("business_id", businessId);
  if (error) throw error;
}

/** Soft-remove — employees.is_active desenindeki gibi hard-delete yerine
 * left_at damgalanır (join geçmişi/log korunur). */
export async function removeStaffMember(supabase: SupabaseClient, businessId: string, staffId: string): Promise<void> {
  await assertIsBusinessOwner(supabase, businessId);
  const { error } = await supabase
    .from("business_staff")
    .update({ left_at: new Date().toISOString() })
    .eq("id", staffId)
    .eq("business_id", businessId);
  if (error) throw error;
}
