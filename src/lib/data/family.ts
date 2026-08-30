import type { SupabaseClient } from "@supabase/supabase-js";

/** Ported from mobile's FamilyService — aynı `family_invites`/`family_members`
 * tabloları ve `accept_family_invite`/`remove_family_member`/`leave_family`
 * RPC'leri (bkz. fisle_app supabase/migrations/067_family_members.sql). */
export const FAMILY_MAX_MEMBERS = 4;

export interface FamilyMemberRow {
  id: string;
  ownerId: string;
  memberId: string;
  joinedAt: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface FamilyInviteRow {
  id: string;
  ownerId: string;
  token: string;
  status: string;
  expiresAt: string;
}

export interface FamilyInvitePreview {
  ownerId: string;
  ownerName: string;
  status: string;
  expiresAt: string;
}

interface MemberSelectRow {
  id: string;
  owner_id: string;
  member_id: string;
  joined_at: string;
  users: { name: string | null; email: string | null; avatar_url: string | null } | { name: string | null; email: string | null; avatar_url: string | null }[] | null;
}

export async function getFamilyMembers(supabase: SupabaseClient, ownerId: string): Promise<FamilyMemberRow[]> {
  const { data } = await supabase
    .from("family_members")
    .select("id, owner_id, member_id, joined_at, users!family_members_member_id_fkey(name, email, avatar_url)")
    .eq("owner_id", ownerId)
    .order("joined_at");

  return ((data ?? []) as unknown as MemberSelectRow[]).map((r) => {
    const user = Array.isArray(r.users) ? (r.users[0] ?? null) : r.users;
    return {
      id: r.id,
      ownerId: r.owner_id,
      memberId: r.member_id,
      joinedAt: r.joined_at,
      name: user?.name || user?.email || "Üye",
      email: user?.email ?? null,
      avatarUrl: user?.avatar_url ?? null,
    };
  });
}

/** Bu kullanıcı bir Aile Paketi'ne üye mi (sahibi değil) — üyeyse sahibin
 * bilgisini döner. Mobilin `_FamilySection`'ında olmayan bir ayrım: mobil
 * sahip/üye görünümünü karıştırıyordu (bkz. proje notları), web'de doğru
 * ayrım yapılıyor. */
export async function getFamilyOwnerFor(
  supabase: SupabaseClient,
  memberId: string,
): Promise<{ ownerId: string; ownerName: string } | null> {
  const { data } = await supabase
    .from("family_members")
    .select("owner_id, users!family_members_owner_id_fkey(name, email)")
    .eq("member_id", memberId)
    .maybeSingle();
  if (!data) return null;
  const owner = Array.isArray(data.users) ? (data.users[0] ?? null) : data.users;
  return { ownerId: data.owner_id as string, ownerName: owner?.name || owner?.email || "Aile sahibi" };
}

export async function getActiveFamilyInvite(supabase: SupabaseClient, ownerId: string): Promise<FamilyInviteRow | null> {
  const { data } = await supabase
    .from("family_invites")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, ownerId: data.owner_id, token: data.token, status: data.status, expiresAt: data.expires_at };
}

export async function createFamilyInvite(supabase: SupabaseClient, ownerId: string): Promise<FamilyInviteRow> {
  const members = await getFamilyMembers(supabase, ownerId);
  if (members.length >= FAMILY_MAX_MEMBERS) {
    throw new Error(`Aile Paketinizde en fazla ${FAMILY_MAX_MEMBERS} üye olabilir.`);
  }

  await supabase.from("family_invites").update({ status: "expired" }).eq("owner_id", ownerId).eq("status", "pending");

  const { data, error } = await supabase.from("family_invites").insert({ owner_id: ownerId }).select("*").single();
  if (error || !data) throw error ?? new Error("Davet oluşturulamadı");
  return { id: data.id, ownerId: data.owner_id, token: data.token, status: data.status, expiresAt: data.expires_at };
}

/** Ported from mobile's `_parseToken` — davet kodu ya çıplak token ya da
 * `.../join-family/<token>` linki olarak yapıştırılabilir. */
export function parseFamilyInviteToken(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("/join-family/")) {
    const tokenPart = trimmed.split("/join-family/")[1]?.split("?")[0]?.split("/")[0];
    if (tokenPart) return tokenPart.trim();
  }
  return trimmed;
}

export async function getFamilyInvitePreview(supabase: SupabaseClient, token: string): Promise<FamilyInvitePreview | null> {
  const { data } = await supabase
    .from("family_invites")
    .select("owner_id, status, expires_at, users!family_invites_owner_id_fkey(name, email)")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const owner = Array.isArray(data.users) ? (data.users[0] ?? null) : data.users;
  return {
    ownerId: data.owner_id as string,
    ownerName: owner?.name || owner?.email || "Aile sahibi",
    status: data.status as string,
    expiresAt: data.expires_at as string,
  };
}

/** Mobildeki hata-eşleme deseniyle aynı (bkz. FamilyService.acceptInvite) —
 * RPC'nin ham Postgres hata metnini kullanıcıya gösterilecek Türkçe mesaja
 * çevirir. */
export async function acceptFamilyInvite(supabase: SupabaseClient, token: string): Promise<void> {
  const { data, error } = await supabase.rpc("accept_family_invite", { p_token: token });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("geçersiz veya süresi dolmuş")) throw new Error("Bu davet bağlantısı geçersiz veya süresi dolmuş.");
    if (msg.includes("maksimum üye")) throw new Error("Bu Aile Paketi maksimum üye sayısına ulaşmış.");
    if (msg.includes("zaten bir Aile Paketi")) throw new Error("Zaten bir Aile Paketi üyesisiniz.");
    if (msg.includes("artık aktif değil")) throw new Error("Bu Aile Paketi artık aktif değil.");
    if (msg.includes("Kendi davetinize")) throw new Error("Kendi davetinize katılamazsınız.");
    throw new Error(msg || "Davet kabul edilemedi.");
  }
  if (data !== true) throw new Error("Davet kabul edilemedi.");
}

export async function removeFamilyMember(supabase: SupabaseClient, memberId: string): Promise<void> {
  const { data, error } = await supabase.rpc("remove_family_member", { p_member_id: memberId });
  if (error) throw error;
  if (data !== true) throw new Error("Üye çıkarılamadı.");
}

export async function leaveFamily(supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase.rpc("leave_family");
  if (error) throw error;
  if (data !== true) throw new Error("Aile Paketinden ayrılamadınız.");
}
