/** Ported verbatim from fisle_app's CategoryPredictor (category_predictor.dart) —
 * maps Turkish product-name keywords to exact DB category names. Longer
 * keywords win so short substrings don't shadow more specific matches. */

const RAW_RULES: Record<string, string> = {
  // Temel Gıda
  makarna: "Temel Gıda", şehriye: "Temel Gıda", pirinç: "Temel Gıda",
  bulgur: "Temel Gıda", mercimek: "Temel Gıda", nohut: "Temel Gıda",
  fasulye: "Temel Gıda", bakliyat: "Temel Gıda", konserve: "Temel Gıda",
  "zeytinyağ": "Temel Gıda", "ayçiçek yağ": "Temel Gıda",
  tuz: "Temel Gıda", şeker: "Temel Gıda", "un ": "Temel Gıda",
  salça: "Temel Gıda", ketçap: "Temel Gıda", mayonez: "Temel Gıda",
  "domates salçası": "Temel Gıda", "baharatı": "Temel Gıda",
  baharat: "Temel Gıda", sirke: "Temel Gıda",

  // Meyve & Sebze
  domates: "Meyve & Sebze", patates: "Meyve & Sebze",
  soğan: "Meyve & Sebze", sarımsak: "Meyve & Sebze",
  biber: "Meyve & Sebze", patlıcan: "Meyve & Sebze",
  kabak: "Meyve & Sebze", havuç: "Meyve & Sebze",
  salatalık: "Meyve & Sebze", marul: "Meyve & Sebze",
  ıspanak: "Meyve & Sebze", mantar: "Meyve & Sebze",
  brokoli: "Meyve & Sebze", lahana: "Meyve & Sebze",
  muz: "Meyve & Sebze", elma: "Meyve & Sebze",
  portakal: "Meyve & Sebze", limon: "Meyve & Sebze",
  çilek: "Meyve & Sebze", karpuz: "Meyve & Sebze",
  kavun: "Meyve & Sebze", üzüm: "Meyve & Sebze",
  kiraz: "Meyve & Sebze", şeftali: "Meyve & Sebze",
  armut: "Meyve & Sebze", meyve: "Meyve & Sebze",
  sebze: "Meyve & Sebze",

  // Et & Tavuk
  tavuk: "Et & Tavuk", kıyma: "Et & Tavuk",
  sucuk: "Et & Tavuk", sosis: "Et & Tavuk",
  köfte: "Et & Tavuk", "dana eti": "Et & Tavuk",
  "kuzu eti": "Et & Tavuk", biftek: "Et & Tavuk",
  kanat: "Et & Tavuk", "but ": "Et & Tavuk",
  balık: "Et & Tavuk", somon: "Et & Tavuk",
  hamsi: "Et & Tavuk", "ton balığı": "Et & Tavuk",
  hindi: "Et & Tavuk", jambon: "Et & Tavuk",
  pastırma: "Et & Tavuk",

  // Süt & Kahvaltılık
  süt: "Süt & Kahvaltılık", yoğurt: "Süt & Kahvaltılık",
  peynir: "Süt & Kahvaltılık", yumurta: "Süt & Kahvaltılık",
  "tereyağ": "Süt & Kahvaltılık", margarin: "Süt & Kahvaltılık",
  reçel: "Süt & Kahvaltılık", bal: "Süt & Kahvaltılık",
  tahin: "Süt & Kahvaltılık", zeytin: "Süt & Kahvaltılık",
  kaymak: "Süt & Kahvaltılık", "lor peyniri": "Süt & Kahvaltılık",
  labne: "Süt & Kahvaltılık", kefir: "Süt & Kahvaltılık",
  "çiğ köfte": "Süt & Kahvaltılık",

  // Ekmek & Fırın
  ekmek: "Ekmek & Fırın", simit: "Ekmek & Fırın",
  poğaça: "Ekmek & Fırın", börek: "Ekmek & Fırın",
  pide: "Ekmek & Fırın", lavash: "Ekmek & Fırın",
  bazlama: "Ekmek & Fırın", francala: "Ekmek & Fırın",
  "sandviç ekm": "Ekmek & Fırın", krep: "Ekmek & Fırın",

  // Dondurulmuş Gıda
  dondurulmuş: "Dondurulmuş Gıda",

  // İçecekler (market)
  "maden suyu": "İçecekler", ayran: "İçecekler",
  "meyve suyu": "İçecekler", nektar: "İçecekler",
  "ice tea": "İçecekler", "soğuk çay": "İçecekler",
  su: "İçecekler", çay: "İçecekler",

  // Temizlik Ürünleri
  deterjan: "Temizlik Ürünleri", "çamaşır suyu": "Temizlik Ürünleri",
  "bulaşık deterjan": "Temizlik Ürünleri", "kir çıkarıcı": "Temizlik Ürünleri",
  "çamaşır yumuşatıcı": "Temizlik Ürünleri", "cam temizleyici": "Temizlik Ürünleri",
  "wc ": "Temizlik Ürünleri", "çöp torbası": "Temizlik Ürünleri",
  paspas: "Temizlik Ürünleri", "süpürge başlığı": "Temizlik Ürünleri",
  "toz bezi": "Temizlik Ürünleri", "islak mendil": "Temizlik Ürünleri",
  "kağıt havlu": "Temizlik Ürünleri", "tuvalet kağıdı": "Temizlik Ürünleri",
  "kağıt mendil": "Temizlik Ürünleri", "çöp poşeti": "Temizlik Ürünleri",
  "alışveriş poşeti": "Temizlik Ürünleri", poşet: "Temizlik Ürünleri",

  // Kişisel Bakım Ürünleri (market)
  şampuan: "Kişisel Bakım Ürünleri", "saç kremi": "Kişisel Bakım Ürünleri",
  sabun: "Kişisel Bakım Ürünleri", "diş macunu": "Kişisel Bakım Ürünleri",
  "diş fırçası": "Kişisel Bakım Ürünleri", "tıraş jeli": "Kişisel Bakım Ürünleri",
  "tıraş köpüğü": "Kişisel Bakım Ürünleri", deodorant: "Kişisel Bakım Ürünleri",
  "vücut losyonu": "Kişisel Bakım Ürünleri", "el kremi": "Kişisel Bakım Ürünleri",
  "yüz kremi": "Kişisel Bakım Ürünleri", "güneş kremi": "Kişisel Bakım Ürünleri",
  havlu: "Kişisel Bakım Ürünleri", banyo: "Kişisel Bakım Ürünleri",
  "bebek bezi": "Kişisel Bakım Ürünleri", "ped ": "Kişisel Bakım Ürünleri",
  tampon: "Kişisel Bakım Ürünleri", pamuk: "Kişisel Bakım Ürünleri",
  "oje ": "Kişisel Bakım Ürünleri", "makyaj temiz": "Kişisel Bakım Ürünleri",

  // Çikolata & Şeker
  çikolata: "Çikolata & Şeker", şekerleme: "Çikolata & Şeker",
  gofret: "Çikolata & Şeker", lolipop: "Çikolata & Şeker",
  sakız: "Çikolata & Şeker", bonbon: "Çikolata & Şeker",
  marshmallow: "Çikolata & Şeker",

  // Cips & Çerez
  cips: "Cips & Çerez", çerez: "Cips & Çerez",
  kraker: "Cips & Çerez", popcorn: "Cips & Çerez",
  fındık: "Cips & Çerez", fıstık: "Cips & Çerez",
  kuruyemiş: "Cips & Çerez", "mısır gevreği": "Cips & Çerez",

  // Dondurma
  dondurma: "Dondurma", külah: "Dondurma",

  // Enerji İçeceği
  "enerji içeceği": "Enerji İçeceği", redbull: "Enerji İçeceği",
  "monster ": "Enerji İçeceği", "burn ": "Enerji İçeceği",

  // Gazlı İçecek
  kola: "Gazlı İçecek", pepsi: "Gazlı İçecek",
  sprite: "Gazlı İçecek", fanta: "Gazlı İçecek",
  soda: "Gazlı İçecek", gazoz: "Gazlı İçecek",

  // Atıştırmalık
  bisküvi: "Atıştırmalık", kek: "Atıştırmalık",
  "pasta ": "Atıştırmalık", atıştırmalık: "Atıştırmalık",
  granola: "Atıştırmalık", "protein bar": "Atıştırmalık", "granola bar": "Atıştırmalık",

  // Restoran
  restoran: "Restoran", lokanta: "Restoran", yemek: "Restoran",

  // Kafe & Kahve
  kahve: "Kafe & Kahve", kafe: "Kafe & Kahve",
  cappuccino: "Kafe & Kahve", latte: "Kafe & Kahve",
  espresso: "Kafe & Kahve", americano: "Kafe & Kahve",
  mocha: "Kafe & Kahve", "filtre kahve": "Kafe & Kahve",

  // Fast Food
  burger: "Fast Food", pizza: "Fast Food",
  döner: "Fast Food", kebap: "Fast Food",
  lahmacun: "Fast Food", sandviç: "Fast Food",
  tantuni: "Fast Food", wrape: "Fast Food",

  // Pastane & Tatlı
  baklava: "Pastane & Tatlı", künefe: "Pastane & Tatlı",
  sütlaç: "Pastane & Tatlı", kazandibi: "Pastane & Tatlı",
  tiramisu: "Pastane & Tatlı", cheesecake: "Pastane & Tatlı",

  // Sokak Yemeği
  tost: "Sokak Yemeği", çorba: "Sokak Yemeği",
  midye: "Sokak Yemeği", "balık ekmek": "Sokak Yemeği",

  // Yemek Siparişi
  yemeksepeti: "Yemek Siparişi", "getir sipariş": "Yemek Siparişi",
  "trendyol yemek": "Yemek Siparişi",

  // Akaryakıt
  benzin: "Akaryakıt", mazot: "Akaryakıt",
  akaryakıt: "Akaryakıt", motorin: "Akaryakıt",
  lpg: "Akaryakıt", petrol: "Akaryakıt",

  // Taksi & Uber
  taksi: "Taksi & Uber", uber: "Taksi & Uber",
  bitaksi: "Taksi & Uber", "bolt ": "Taksi & Uber",

  // Otobüs & Metro
  metro: "Otobüs & Metro", otobüs: "Otobüs & Metro",
  tramvay: "Otobüs & Metro", dolmuş: "Otobüs & Metro",
  "hes kart": "Otobüs & Metro", akbil: "Otobüs & Metro",
  "toplu taşıma": "Otobüs & Metro",

  // Otopark
  otopark: "Otopark", "park ücreti": "Otopark",

  // Araç Bakım & Servis
  lastik: "Araç Bakım & Servis", "motor yağı": "Araç Bakım & Servis",
  muayene: "Araç Bakım & Servis", "araba yıkama": "Araç Bakım & Servis",
  oto: "Araç Bakım & Servis",

  // Uçak
  uçak: "Uçak", pegasus: "Uçak", thy: "Uçak",
  "türk hava": "Uçak", sunexpress: "Uçak",

  // Tren
  tren: "Tren", marmaray: "Tren", tcdd: "Tren",

  // Eczane
  ilaç: "Eczane", eczane: "Eczane",
  bandaj: "Eczane", "yara bandı": "Eczane",
  "ağrı kesici": "Eczane", antibiyotik: "Eczane",

  // Vitamin & Takviye
  vitamin: "Vitamin & Takviye", takviye: "Vitamin & Takviye",
  "protein tozu": "Vitamin & Takviye", omega: "Vitamin & Takviye",
  probiyotik: "Vitamin & Takviye", kolajen: "Vitamin & Takviye",

  // Doktor & Muayene
  doktor: "Doktor & Muayene", muayenehane: "Doktor & Muayene",
  poliklinik: "Doktor & Muayene",

  // Diş Hekimi
  "diş hekimi": "Diş Hekimi", "diş dolgu": "Diş Hekimi",
  "diş kanal": "Diş Hekimi", "diş çekimi": "Diş Hekimi",

  // Hastane
  hastane: "Hastane", klinik: "Hastane", ameliyat: "Hastane",

  // Gözlük & Lens
  gözlük: "Gözlük & Lens", lens: "Gözlük & Lens",
  optik: "Gözlük & Lens",

  // Kıyafet
  tişört: "Kıyafet", pantolon: "Kıyafet",
  gömlek: "Kıyafet", elbise: "Kıyafet",
  kazak: "Kıyafet", mont: "Kıyafet",
  kaban: "Kıyafet", hırka: "Kıyafet",
  şort: "Kıyafet", eşofman: "Kıyafet",
  bluz: "Kıyafet", etek: "Kıyafet",
  yelek: "Kıyafet", atlet: "Kıyafet",

  // Ayakkabı
  ayakkabı: "Ayakkabı", bot: "Ayakkabı",
  sneaker: "Ayakkabı", terlik: "Ayakkabı",
  çizme: "Ayakkabı", "spor ayakkabı": "Ayakkabı",

  // Çanta & Cüzdan
  çanta: "Çanta & Cüzdan", cüzdan: "Çanta & Cüzdan",
  "sırt çantası": "Çanta & Cüzdan", "el çantası": "Çanta & Cüzdan",

  // İç Giyim
  çorap: "İç Giyim", "iç çamaşır": "İç Giyim",
  pijama: "İç Giyim", boxer: "İç Giyim",
  sütyen: "İç Giyim", külot: "İç Giyim",

  // Spor Giyim
  forma: "Spor Giyim", mayo: "Spor Giyim",
  tayt: "Spor Giyim", "spor üstü": "Spor Giyim",

  // Mobilya
  mobilya: "Mobilya", koltuk: "Mobilya",
  kanepe: "Mobilya", karyola: "Mobilya",
  "çalışma masası": "Mobilya", kitaplık: "Mobilya",
  dolap: "Mobilya", sandalye: "Mobilya",

  // Ev Aletleri
  "çamaşır makinesi": "Ev Aletleri", buzdolabı: "Ev Aletleri",
  "fırın ": "Ev Aletleri", tencere: "Ev Aletleri",
  tava: "Ev Aletleri", tabak: "Ev Aletleri",
  bardak: "Ev Aletleri", çatal: "Ev Aletleri",
  kaşık: "Ev Aletleri", mikser: "Ev Aletleri",
  blender: "Ev Aletleri", "tost makinesi": "Ev Aletleri",
  pil: "Ev Aletleri", ampul: "Ev Aletleri",

  // Dekorasyon
  perde: "Dekorasyon", halı: "Dekorasyon",
  tablo: "Dekorasyon", dekorasyon: "Dekorasyon",
  yastık: "Dekorasyon", nevresim: "Dekorasyon",
  "çiçek saksısı": "Dekorasyon",

  // Telefon & Tablet
  telefon: "Telefon & Tablet", tablet: "Telefon & Tablet",
  iphone: "Telefon & Tablet", "samsung telefon": "Telefon & Tablet",
  xiaomi: "Telefon & Tablet", huawei: "Telefon & Tablet",

  // Bilgisayar & Laptop
  laptop: "Bilgisayar & Laptop", bilgisayar: "Bilgisayar & Laptop",
  macbook: "Bilgisayar & Laptop", notebook: "Bilgisayar & Laptop",

  // Elektronik Aksesuar
  kulaklık: "Elektronik Aksesuar", "şarj cihazı": "Elektronik Aksesuar",
  "usb kablo": "Elektronik Aksesuar", mouse: "Elektronik Aksesuar",
  klavye: "Elektronik Aksesuar", powerbank: "Elektronik Aksesuar",
  kamera: "Elektronik Aksesuar", tripod: "Elektronik Aksesuar",

  // Oyun Konsolu & Oyun
  playstation: "Oyun Konsolu & Oyun", xbox: "Oyun Konsolu & Oyun",
  nintendo: "Oyun Konsolu & Oyun", ps5: "Oyun Konsolu & Oyun",
  "oyun konsolu": "Oyun Konsolu & Oyun",

  // Uygulama & Yazılım
  netflix: "Uygulama & Yazılım", spotify: "Uygulama & Yazılım",
  "youtube premium": "Uygulama & Yazılım", "apple music": "Uygulama & Yazılım",
  disney: "Uygulama & Yazılım", exxen: "Uygulama & Yazılım",

  // Sinema & Tiyatro
  sinema: "Sinema & Tiyatro", tiyatro: "Sinema & Tiyatro",
  müze: "Sinema & Tiyatro", "konser bileti": "Sinema & Tiyatro",

  // Konser & Etkinlik
  konser: "Konser & Etkinlik", festival: "Konser & Etkinlik",
  etkinlik: "Konser & Etkinlik",

  // Kitap & Dergi (Eğlence)
  roman: "Kitap & Dergi", dergi: "Kitap & Dergi",

  // Spor & Fitness
  "spor salonu": "Spor & Fitness", fitness: "Spor & Fitness",
  gym: "Spor & Fitness", yüzme: "Spor & Fitness",

  // Kitap & Kırtasiye (Eğitim)
  kitap: "Kitap & Kırtasiye", kalem: "Kitap & Kırtasiye",
  defter: "Kitap & Kırtasiye", silgi: "Kitap & Kırtasiye",
  cetvel: "Kitap & Kırtasiye", kırtasiye: "Kitap & Kırtasiye",
  "okul çantası": "Kitap & Kırtasiye",

  // Kurs & Eğitim
  kurs: "Kurs & Eğitim", "eğitim kursu": "Kurs & Eğitim",
  "dil kursu": "Kurs & Eğitim", "online kurs": "Kurs & Eğitim",

  // Kuaför & Berber
  kuaför: "Kuaför & Berber", berber: "Kuaför & Berber",
  "saç kesimi": "Kuaför & Berber", "saç boyama": "Kuaför & Berber",
  "protez tırnak": "Kuaför & Berber",

  // Güzellik & Makyaj
  makyaj: "Güzellik & Makyaj", ruj: "Güzellik & Makyaj",
  "fondöten": "Güzellik & Makyaj", "göz farı": "Güzellik & Makyaj",
  maskara: "Güzellik & Makyaj", rimel: "Güzellik & Makyaj",
  "saç boyası": "Güzellik & Makyaj", toner: "Güzellik & Makyaj",
  serum: "Güzellik & Makyaj", blusher: "Güzellik & Makyaj",
  "kontür": "Güzellik & Makyaj", highlighter: "Güzellik & Makyaj",
  palette: "Güzellik & Makyaj",

  // Parfüm
  parfüm: "Parfüm", kolonya: "Parfüm", "eau de toilette": "Parfüm",

  // Spa & Masaj
  spa: "Spa & Masaj", masaj: "Spa & Masaj",
  hamam: "Spa & Masaj",

  // Evcil Hayvan Maması
  "kedi maması": "Evcil Hayvan Maması", "köpek maması": "Evcil Hayvan Maması",
  "kuş yemi": "Evcil Hayvan Maması",

  // Veteriner
  veteriner: "Veteriner", "pet klinik": "Veteriner",

  // Evcil Hayvan Malzemeleri
  tasma: "Evcil Hayvan Malzemeleri", "kedi kumu": "Evcil Hayvan Malzemeleri",
  akvaryum: "Evcil Hayvan Malzemeleri",

  // Otel & Konaklama
  otel: "Otel & Konaklama", hostel: "Otel & Konaklama",
  airbnb: "Otel & Konaklama", pansiyon: "Otel & Konaklama",

  // Hediye
  hediye: "Hediye", çiçek: "Çiçek",
  buket: "Çiçek", gül: "Çiçek",

  // Dijital Abonelik
  abonelik: "Dijital Abonelik",
};

const SORTED_RULES: [string, string][] = Object.entries(RAW_RULES).sort(
  (a, b) => b[0].length - a[0].length,
);

export interface PredictableCategory {
  id: string;
  name: string;
}

/** Returns the best-matching category from [categories] for [productName],
 * or null if no confident match is found. Longest keyword wins. */
export function predictCategory<T extends PredictableCategory>(
  productName: string,
  categories: T[],
): T | null {
  const q = productName.toLowerCase().trim();
  if (!q || categories.length === 0) return null;

  let matchedName: string | null = null;
  for (const [keyword, catName] of SORTED_RULES) {
    if (q.includes(keyword.trim())) {
      matchedName = catName;
      break;
    }
  }
  if (!matchedName) return null;

  const lower = matchedName.toLowerCase();
  const exact = categories.find((c) => c.name.toLowerCase() === lower);
  if (exact) return exact;

  const partial = categories.find(
    (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()),
  );
  return partial ?? null;
}
