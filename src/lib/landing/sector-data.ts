import {
  Briefcase,
  Gem,
  ShoppingBag,
  UtensilsCrossed,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface SectorSolution {
  id: string;
  label: string;
  icon: LucideIcon;
  subSectors: string[];
  description: string;
  features: string[];
}

/** İçerik gerçek Esnaf Modu alt sistemlerine dayanıyor (bkz. PROGRESS.md
 * Faz 3 Kararlar Günlüğü) — pazarlama metni var olmayan özellik uydurmuyor. */
export const SECTOR_SOLUTIONS: SectorSolution[] = [
  {
    id: "hizmet",
    label: "Hizmet & Bakım",
    icon: Wrench,
    subSectors: ["Oto Yıkama", "Kuaför", "Berber", "Teknik Servis", "Temizlik", "Bakım Servisi"],
    description:
      "Randevu takibi, iş takibi ve müşteri iletişimini tek ekrandan yöneten, hizmet sektörüne özel esnek bir sistem.",
    features: [
      "Ajanda ve randevu takvimi",
      "Atölye / iş takip panosu (Kanban)",
      "WhatsApp ile otomatik bilgilendirme",
      "Hizmet kataloğu ve fiyatlandırma",
    ],
  },
  {
    id: "perakende",
    label: "Hızlı Perakende",
    icon: ShoppingBag,
    subSectors: ["Market", "Bakkal", "Büfe", "Pastane", "Kırtasiye", "Giyim"],
    description:
      "Hızlı satış yapan, kasada vakit kaybetmek istemeyen işletmeler için akıcı ve anlık takip sağlayan arayüz.",
    features: [
      "Hızlı kasa ve ürün ızgarası",
      "Veresiye defteri ve tahsilat takibi",
      "Kategori bazlı ürün yönetimi",
      "Anlık stok/satış görünümü",
    ],
  },
  {
    id: "yemeicme",
    label: "Yeme & İçme",
    icon: UtensilsCrossed,
    subSectors: ["Restoran", "Kafe", "Pastane", "Fast-Food", "Bar", "Catering"],
    description:
      "Masa planından adisyona, paket servisten menü analizine kadar restoran işletmeciliğinin tamamını kapsayan uçtan uca çözüm.",
    features: [
      "Masa planı ve canlı adisyon takibi",
      "Paket servis yönetimi",
      "Menü bazlı satış analizi",
      "Restoran kasa ve günlük ciro raporu",
    ],
  },
  {
    id: "yuksekhacim",
    label: "Yüksek Hacimli Satış",
    icon: Gem,
    subSectors: ["Emlak", "Otomotiv", "Kuyumcu", "Sanat & Galeri", "Döviz", "Beyaz Eşya"],
    description:
      "Yüksek tutarlı, taksitli ve kaporalı satışları uçtan uca yöneten; portföy ve süreç takibini bir araya getiren sistem.",
    features: [
      "Portföy ve ürün/varlık takibi",
      "Taksitli / kaporalı satış sihirbazı",
      "Otomatik PDF makbuz",
      "Vadesi gelen taksit takibi",
    ],
  },
  {
    id: "toptan",
    label: "Toptancı & İmalatçı",
    icon: Warehouse,
    subSectors: ["Gıda Toptancılığı", "Tekstil İmalatı", "İnşaat Malzemeleri", "Ambalaj", "Elektronik", "Yedek Parça"],
    description:
      "Bayi cari hesaplarından toplu siparişe, depo stoklarından sevkiyat takibine kadar B2B iş akışının tamamı.",
    features: [
      "Depo ve stok yönetimi",
      "Bayi cari hesap takibi",
      "Toplu sipariş ve iskonto",
      "Sevkiyat durum panosu (Kanban)",
    ],
  },
  {
    id: "serbest",
    label: "Serbest Meslek & Proje",
    icon: Briefcase,
    subSectors: ["Yazılım & Tasarım", "Danışmanlık", "Mimarlık", "Hukuk", "Muhasebe", "Etkinlik Organizasyonu"],
    description:
      "Proje bazlı çalışan serbest meslek sahipleri için hakediş takibinden görev yönetimine kadar eksiksiz bir sistem.",
    features: [
      "Proje ve hakediş aşaması takibi",
      "Görev listesi ve süre takibi",
      "Müşteri bazlı gelir takibi",
      "Masraf ve bütçe karşılaştırması",
    ],
  },
];
