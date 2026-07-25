import {
  Briefcase,
  Gem,
  ShoppingBag,
  UtensilsCrossed,
  Warehouse,
  Wrench,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Calculator,
  Users,
  PieChart,
  FileText,
  Wallet,
  Building2,
  Truck,
  Timer,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export interface SectorSolution {
  id: string;
  label: string;
  icon: LucideIcon;
  subSectors: string[];
  description: string;
  features: string[];
  highlights: {
    title: string;
    desc: string;
    icon: LucideIcon;
  }[];
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
      "WhatsApp ile hızlı bilgilendirme",
      "Hizmet kataloğu ve fiyatlandırma",
    ],
    highlights: [
      {
        title: "Akıllı Ajanda",
        desc: "Müşteri randevularınızı ve personel atamalarınızı çakışmadan yönetin.",
        icon: CalendarDays,
      },
      {
        title: "Kanban İş Takibi",
        desc: "Servisteki işlerin durumunu sürükle-bırak panoyla canlı izleyin.",
        icon: LayoutDashboard,
      },
      {
        title: "Hızlı Müşteri İletişimi",
        desc: "İşlem tamamlandığında tek tıkla müşterinize WhatsApp üzerinden durum güncellemesi gönderin.",
        icon: MessageSquare,
      },
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
    highlights: [
      {
        title: "Dokunmatik Hızlı Satış",
        desc: "Kategorize edilmiş ürün ızgarasıyla saniyeler içinde satışı tamamlayın.",
        icon: Calculator,
      },
      {
        title: "Akıllı Veresiye Defteri",
        desc: "Müşteri limitlerini ve açık hesapları tek ekranda görüp tahsilatları hızlandırın.",
        icon: Users,
      },
      {
        title: "Kolay Stok Takibi",
        desc: "Ürünlerinizin stok seviyelerini anlık izleyip, bitmeden kolayca tedarik edin.",
        icon: PieChart,
      },
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
    highlights: [
      {
        title: "Canlı Masa Planı",
        desc: "Hangi masanın ne kadar süredir oturduğunu ve sipariş durumunu renklerle izleyin.",
        icon: LayoutDashboard,
      },
      {
        title: "Paket Servis Yönetimi",
        desc: "Masa siparişlerinin yanı sıra paket servis ve gel-al siparişlerinizi de tek ekrandan yönetin.",
        icon: FileText,
      },
      {
        title: "Z-Raporu ve Gün Sonu",
        desc: "Kapanışta ciro, masraf ve kârı tek tıkla hesaplayıp günlük özetinizi alın.",
        icon: Wallet,
      },
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
    highlights: [
      {
        title: "Taksit Sihirbazı",
        desc: "Büyük satışları aylara bölün ve yaklaşan vade tarihlerini sistem otomatik hatırlatsın.",
        icon: Calculator,
      },
      {
        title: "Varlık Portföyü",
        desc: "Emlak veya araç portföyünüzün alım maliyeti ve satış analizini şeffafça yönetin.",
        icon: Building2,
      },
      {
        title: "Resmi Evrak Şablonları",
        desc: "Sözleşme ve kapora makbuzlarını hazır şablonlarla saniyeler içinde yazdırıp PDF alın.",
        icon: FileText,
      },
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
    highlights: [
      {
        title: "B2B Bayi Yönetimi",
        desc: "Her bayiye özel iskonto oranları, kredi limitleri ve açık hesap bakiyesi tanımlayın.",
        icon: Users,
      },
      {
        title: "Sevkiyat Planlama",
        desc: "Hazırlanan ve yola çıkan siparişleri lojistik panosundan anlık olarak takip edin.",
        icon: Truck,
      },
      {
        title: "Toplu Sipariş Alımı",
        desc: "Tek bir ekranda onlarca kalem ürünü hızlıca seçip saniyeler içinde faturaya dönüştürün.",
        icon: Receipt,
      },
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
    highlights: [
      {
        title: "Proje Bazlı Kârlılık",
        desc: "Hangi projeden ne kadar kazandığınızı, o projeye ait masrafları düşerek net görün.",
        icon: PieChart,
      },
      {
        title: "Zaman Takibi (Timesheet)",
        desc: "Görevlere harcanan süreyi ölçüp müşteriye şeffaf bir şekilde saatlik fatura kesin.",
        icon: Timer,
      },
      {
        title: "Hakediş ve Tahsilat",
        desc: "Parçalı ödemeleri ve proje hakediş takvimini kaçırmadan vaktinde tahsil edin.",
        icon: Wallet,
      },
    ],
  },
];
