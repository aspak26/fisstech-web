export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Verilerim güvende mi?",
    answer:
      "Evet. Tüm verilerin Supabase altyapısında, satır bazlı güvenlik (RLS) politikalarıyla korunur — yalnızca sen (ve paylaştığın grup üyeleri) kendi verilerine erişebilir. Fiş görselleri şifreli bağlantılarla saklanır, kimseyle paylaşılmaz.",
  },
  {
    question: "Esnaf Modu, normal hesaptan farkı nedir?",
    answer:
      "Kişisel hesap; harcama, gelir, bütçe ve hedef takibi için tasarlanmıştır. Esnaf Modu ise bunun üzerine kasa defteri, stok, personel ve satış yönetimi gibi işletmene özel araçlar ekler — market, kafe, kuaför gibi 6 farklı sektöre özel panel sunar. Aynı hesaptan ikisini birlikte kullanabilirsin.",
  },
  {
    question: "Fiş tarama gerçekten yapay zekâ mı kullanıyor?",
    answer:
      "Evet, uygulamamızda olduğu gibi, bu sitede yer alan ücretsiz tarama alanında da fişleriniz gerçek zamanlı olarak yapay zekâ destekli OCR motorumuzla taranır; mağaza adı, tarih, ürünler ve kategoriler otomatik olarak saniyeler içinde çıkarılır.",
  },
  {
    question: "Mobil uygulama ile web sitesi senkronize mi?",
    answer:
      "Evet, ikisi de aynı hesabı ve aynı veritabanını kullanır. Telefonda eklediğin bir harcamayı anında web'de, web'de eklediğini de anında telefonda görürsün.",
  },
  {
    question: "Ücretsiz deneme sonrası ne olur?",
    answer:
      "Yeni hesap açtığında 1 hafta boyunca tüm premium özellikleri ücretsiz kullanırsın. Süre dolduğunda hesabın temel (ücretsiz) plana döner, verilerin silinmez — istediğin zaman bir plana geçerek kaldığın yerden devam edebilirsin.",
  },
  {
    question: "Aboneliğimi nasıl iptal ederim?",
    answer:
      "Abonelik satın alma ve yönetimi mobil uygulama üzerinden (App Store/Google Play) yapılır; iptal işlemini de ilgili mağaza hesabından yönetebilirsin.",
  },
];
