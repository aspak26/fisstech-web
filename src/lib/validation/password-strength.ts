export type PasswordRule = { label: string; met: boolean; required: boolean };

export type PasswordStrength = {
  percent: number;
  label: string;
  isAcceptable: boolean;
  isCommon: boolean;
  rules: PasswordRule[];
};

const COMMON_PARTS = [
  "password", "parola", "sifre", "şifre", "qwert", "asdfg", "zxcvb",
  "12345", "54321", "11111", "00000", "abcde", "iloveyou", "letmein",
  "welcome", "admin", "fisstech", "fisle", "1q2w3e",
  "galatasaray", "fenerbahce", "besiktas", "trabzonspor",
];

// Mobil uygulamadaki lib/core/utils/password_strength.dart ile aynı kural:
// 8+ karakter, küçük harf, büyük harf, rakam zorunlu; özel karakter ekstra güç.
export function evaluatePassword(password: string, email?: string): PasswordStrength {
  const hasLength = password.length >= 8;
  const hasLower = /[a-zçğıöşü]/.test(password);
  const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(password);

  const rules: PasswordRule[] = [
    { label: "En az 8 karakter", met: hasLength, required: true },
    { label: "Küçük harf (a-z)", met: hasLower, required: true },
    { label: "Büyük harf (A-Z)", met: hasUpper, required: true },
    { label: "Rakam (0-9)", met: hasDigit, required: true },
    { label: "Özel karakter (!?*.)", met: hasSpecial, required: false },
  ];

  if (!password) {
    return { percent: 0, label: "", isAcceptable: false, isCommon: false, rules };
  }

  const lower = password.toLocaleLowerCase("tr-TR");
  const asciiLower = password.toLowerCase();
  const emailName = (email ?? "").split("@")[0].toLowerCase();
  const isCommon =
    COMMON_PARTS.some((p) => lower.includes(p) || asciiLower.includes(p)) ||
    (emailName.length >= 4 && asciiLower.includes(emailName)) ||
    /^(.)\1+$/.test(password);

  const requiredMet = [hasLength, hasLower, hasUpper, hasDigit].filter(Boolean).length;
  const allRequired = requiredMet === 4;

  let percent = requiredMet * 20 + (hasSpecial ? 20 : 0);
  if (!allRequired) percent = Math.min(percent, 60);
  if (isCommon) percent = Math.min(percent, 40);

  const isAcceptable = allRequired && !isCommon;

  let label: string;
  if (isCommon) label = "Tahmin edilmesi çok kolay";
  else if (isAcceptable) label = percent >= 100 ? "Çok güçlü" : "Güçlü";
  else if (percent <= 20) label = "Çok zayıf";
  else if (percent <= 40) label = "Zayıf";
  else label = "Orta";

  return { percent, label, isAcceptable, isCommon, rules };
}

export function passwordErrorMessage(password: string, email?: string): string | null {
  const s = evaluatePassword(password, email);
  if (s.isAcceptable) return null;
  if (s.isCommon) return "Bu şifre tahmin edilmesi çok kolay, farklı bir şifre seçin.";
  return "Şifre yeterince güçlü değil (çubuk yeşile dönene kadar güçlendirin).";
}

// Supabase Auth İngilizce hata mesajlarını Türkçeye çevirir.
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("weak_password") ||
    m.includes("known to be weak") ||
    m.includes("easy to guess") ||
    m.includes("pwned") ||
    m.includes("leaked")
  ) {
    return "Bu şifre daha önce veri sızıntılarında ortaya çıkmış veya tahmin edilmesi çok kolay. Güvenliğin için lütfen farklı bir şifre seç.";
  }
  if (m.includes("should contain at least one character")) {
    return "Şifre küçük harf, büyük harf ve rakam içermeli.";
  }
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return "Şifre çok kısa. En az 8 karakter olmalı.";
  }
  if (m.includes("different from the old password") || m.includes("same_password")) {
    return "Yeni şifre eski şifrenle aynı olamaz.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Çok fazla deneme. Lütfen bir süre bekleyin.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "İnternet bağlantısı yok veya çok yavaş. Lütfen tekrar dene.";
  }
  return message;
}
