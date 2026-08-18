// Mobildeki lib/features/cards/models/bank_model.dart (kSupportedBanks) ile
// birebir aynı liste — logo dosyaları public/banks/{domain}.png altında.

export interface BankInfo {
  name: string;
  domain: string;
  colorHex?: string;
}

export const SUPPORTED_BANKS: BankInfo[] = [
  { name: "Akbank", domain: "akbank.com", colorHex: "ED1C24" },
  { name: "Garanti BBVA", domain: "garantibbva.com.tr", colorHex: "009639" },
  { name: "İş Bankası", domain: "isbank.com.tr", colorHex: "002D72" },
  { name: "Yapı Kredi", domain: "yapikredi.com.tr", colorHex: "0054A6" },
  { name: "Ziraat Bankası", domain: "ziraatbank.com.tr", colorHex: "E1002B" },
  { name: "Halkbank", domain: "halkbank.com.tr", colorHex: "004F98" },
  { name: "VakıfBank", domain: "vakifbank.com.tr", colorHex: "FDB913" },
  { name: "QNB", domain: "qnb.com.tr", colorHex: "0F174B" },
  { name: "Enpara", domain: "enpara.com", colorHex: "913398" },
  { name: "TEB", domain: "teb.com.tr", colorHex: "009444" },
  { name: "DenizBank", domain: "denizbank.com", colorHex: "0073B4" },
  { name: "ING", domain: "ing.com.tr", colorHex: "FF6200" },
  { name: "Fibabanka", domain: "fibabanka.com.tr", colorHex: "00467F" },
  { name: "HSBC", domain: "hsbc.com.tr", colorHex: "DB0011" },
  { name: "Kuveyt Türk", domain: "kuveytturk.com.tr", colorHex: "00693E" },
  { name: "Albaraka Türk", domain: "albaraka.com.tr", colorHex: "F16B22" },
  { name: "Türkiye Finans", domain: "turkiyefinans.com.tr", colorHex: "00A69C" },
  { name: "Odeabank", domain: "odeabank.com.tr", colorHex: "000000" },
  { name: "Şekerbank", domain: "sekerbank.com.tr", colorHex: "008560" },
  { name: "Anadolubank", domain: "anadolubank.com.tr", colorHex: "004D95" },
  { name: "Alternatif Bank", domain: "alternatifbank.com.tr", colorHex: "BA0C2F" },
  { name: "Papara", domain: "papara.com", colorHex: "FF1C43" },
  { name: "Paycell", domain: "paycell.com.tr", colorHex: "FFD500" },
  { name: "İninal", domain: "ininal.com", colorHex: "F47920" },
  { name: "Tom Bank", domain: "tombank.com.tr", colorHex: "5B2B82" },
];
