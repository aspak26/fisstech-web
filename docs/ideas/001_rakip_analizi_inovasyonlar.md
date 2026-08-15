# Ar-Ge ve İnovasyon Fikirleri - 1
**Tarih:** 12 Ağustos 2026
**Kaynak:** Rakip Analizi Yapay Zeka Ajanı & Sistem İçi Değerlendirme

Bu belge, ileride Fişştech'e eklenebilecek yenilikçi özellikleri, rakip analizlerini ve Ar-Ge fikirlerini kayıt altında tutmak için oluşturulmuştur.

## 1. Banka Ekstresi (PDF/Foto) İçe Aktarma
- **Kavram:** Kullanıcıların banka ekstrelerini (PDF formatında veya ekran görüntüsü olarak) sisteme yükleyerek tüm harcamalarını tek seferde otomatik olarak içeri aktarabilmesi.
- **Nasıl Yapılır:** Hali hazırda fiş taramak için kurduğumuz `scan-receipt` (Gemini OCR) altyapısı mevcuttur. Aynı Edge Function altyapısı ekstre okuma prompt'larına göre modifiye edilerek kolayca entegre edilebilir.
- **Değer:** Fişsiz harcamaları takip eden ve verisini tek tek girmekten yorulan kullanıcılar için büyük zaman tasarrufu sağlar. "Emek harcamadan bütçe tutmak" hedefine doğrudan hizmet eder.

## 2. Yapay Zeka ile Sesli Harcama Girişi
- **Kavram:** Kullanıcının sadece mikrofona konuşarak harcama girmesi. Örneğin: *"Bugün Migros'ta 450 lira mutfak alışverişi yaptım"*.
- **Nasıl Yapılır:** Tarayıcılarda (ve mobilde) bulunan yerleşik *Speech-to-Text (Metne Dönüştürme)* API'leri kullanılarak ses metne çevrilir. Elde edilen metin Gemini AI'a gönderilerek (Tutar: 450, Kategori: Market, Not: Migros) formatında ayrıştırılır ve harcama kaydı anında oluşturulur.
- **Değer:** Mobil ve web platformlarında hız arayan kullanıcılar için benzersiz bir "wow" etkisi ve pürüzsüz bir UX (Kullanıcı Deneyimi) sunar. Rakiplerden doğrudan ayrıştırır.

## 3. Proaktif Aşım Uyarısı ve Düz Yazı (Samimi) AI Özeti
- **Kavram:** Klasik grafiklerin ötesine geçerek kullanıcının bütçesini aşacağını önceden tahmin eden veya ay sonunda arkadaşça tavsiye veren düz metin özetler.
- **Örnek Çıktı:** *"Bu ay markete geçen aya göre 340 TL fazla harcadın. Ayrıca bu gidişle kahve bütçen ay sonuna bitiyor."*
- **Abonelik Tespiti:** Ekstre analizlerinden yola çıkarak *"Bunu ödemişsin ama hiç kullanmamışsın"* gibi içgörüler sunulması.
- **Nasıl Yapılır:** Dashboard ekranına veya Raporlar modülüne bir "AI İçgörüleri (Insights)" kartı eklenebilir. Arka planda kullanıcının aylık datası Gemini API'a özetleme ve tavsiye istemi (prompt) ile gönderilir.
- **Değer:** Gereksiz harcama tespiti kullanıcının cebinde direkt para kalmasını sağlar. Markanın "Kişisel Finans Asistanı" konumlandırmasını güçlendirir.

---
**Geliştirici Notu:** Bu klasör (`docs/ideas/`), henüz onaylanmamış ancak üzerinde çalışılabilecek potansiyel fikirlerin havuzu olarak kullanılacaktır. Yapımına karar verilen bir özellik, doğrudan projenin mimari belgelerine ve `PROGRESS.md`'ye aktarılacaktır.
