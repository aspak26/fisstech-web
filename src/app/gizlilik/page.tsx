import { LegalLayout } from "@/components/modules/landing/legal-layout";

export const metadata = {
  title: "Gizlilik Politikası — Fişştech",
  description: "Fişştech'in kişisel verilerinizi nasıl topladığı, kullandığı ve koruduğuna dair gizlilik politikası.",
};

export default function GizlilikPage() {
  return (
    <LegalLayout title="Gizlilik Politikası" updatedAt="2 Ağustos 2026">
      <section>
        <p>
          Fişştech (&quot;biz&quot;, &quot;bize&quot;, &quot;uygulama&quot;) olarak, fiş/fatura taramadan kişisel
          bütçe ve işletme (Esnaf Modu) yönetimine kadar sunduğumuz hizmetler kapsamında topladığımız
          kişisel verilerin gizliliğine önem veriyoruz. Bu Gizlilik Politikası; hangi verileri
          topladığımızı, bunları neden ve nasıl işlediğimizi, kimlerle paylaştığımızı ve verileriniz
          üzerindeki haklarınızı açıklar. Politika, web sitesi (fisstech.co) ve mobil uygulamanın
          tamamı için geçerlidir.
        </p>
        <p className="mt-3">
          Fişştech; fiş/fatura görsellerini yapay zekâ ile okuyup finansal veri hâline getiren, gelir-gider,
          borç, hedef, abonelik ve yatırım takibi sunan, isteğe bağlı olarak işletmeler için &quot;Esnaf
          Modu&quot; ile kasa/stok/personel/satış yönetimi sağlayan bir kişisel finans uygulamasıdır. Bu
          işlevlerin doğası gereği finansal nitelikte veriler işleriz — bu politikayı dikkatlice
          okumanızı öneririz.
        </p>
      </section>

      <section>
        <h2>1. Hangi Verileri Topluyoruz</h2>

        <h3 className="mt-4">Hesap Bilgileri</h3>
        <p className="mt-1.5">
          Kayıt olurken e-posta adresiniz, adınız (isteğe bağlı) ve tercih ederseniz Google ile giriş
          yaparsanız Google hesabınızdan gelen ad/profil fotoğrafı bilgisi. Şifreniz tarafımızca
          okunabilir biçimde saklanmaz; kimlik doğrulama altyapı sağlayıcımız (Supabase) tarafından
          endüstri standardı yöntemlerle (hash&apos;lenerek) saklanır.
        </p>

        <h3 className="mt-4">Girdiğiniz Finansal Veriler</h3>
        <p className="mt-1.5">
          Uygulamayı kullanırken kendi isteğinizle girdiğiniz/oluşturduğunuz veriler: harcamalar ve
          harcama kalemleri, gelirler, sabit giderler ve taksitli ödemeler, borç/alacak kayıtları,
          birikim hedefleri, takip ettiğiniz abonelikler, yatırım kayıtlarınız (varlık türü, miktar,
          alış fiyatı), kategori limitleriniz ve notlarınız.
        </p>

        <h3 className="mt-4">Fiş, Fatura ve Belge Görselleri</h3>
        <p className="mt-1.5">
          Kamerayla çektiğiniz veya galeriden/bilgisayarınızdan yüklediğiniz fiş, fatura ve evrak
          görselleri. Bu görseller, içeriklerini (tarih, tutar, ürün kalemleri, mağaza adı vb.) otomatik
          olarak okuyup dijital veriye çevirmek amacıyla yapay zekâ servisimize (aşağıda açıklanan
          Google Gemini API) gönderilir; onay verdiğiniz görseller ayrıca bulut depolamamızda saklanır.
        </p>

        <h3 className="mt-4">Esnaf Modu (İşletme) Verileri</h3>
        <p className="mt-1.5">
          Esnaf Modu&apos;nu kullanan işletme sahipleri için: işletme adı/adresi/vergi bilgisi, kasa
          hareketleri, stok kayıtları, personel bilgileri (ad, rol, maaş kaydı), müşteri kayıtları ve
          satış/fatura verileri. Bu veriler, işletmenin kendi kullanıcı hesabına ve (davet ettiği)
          personel hesaplarına bağlı olarak işlenir.
        </p>

        <h3 className="mt-4">Grup ve Aile Paylaşım Verileri</h3>
        <p className="mt-1.5">
          Bir gruba (ör. aile bütçesi) katılırsanız, o grupla paylaştığınız harcamalar, grup sohbet
          mesajlarınız ve grup üyelerine gösterdiğiniz takma ad diğer grup üyeleri tarafından
          görülebilir.
        </p>

        <h3 className="mt-4">AI Sohbet İçeriği</h3>
        <p className="mt-1.5">
          &quot;AI Sohbet&quot; özelliğini kullandığınızda yazdığınız mesajlar, size anlamlı bir analiz
          sunabilmesi için o anki finansal verilerinizin bir özetiyle birlikte yapay zekâ servisimize
          gönderilir. Bu mesajlar sohbet geçmişinizi oluşturmak dışında başka bir amaçla saklanmaz.
        </p>

        <h3 className="mt-4">Abonelik ve Ödeme Bilgisi</h3>
        <p className="mt-1.5">
          Mobil uygulama içi satın alımlar Apple App Store / Google Play üzerinden, abonelik yönetim
          altyapımız (RevenueCat) aracılığıyla işlenir. <strong>Kredi kartı veya ödeme aracı bilgilerinizi
          hiçbir zaman görmeyiz veya saklamayız</strong> — bunlar doğrudan Apple/Google tarafından
          işlenir. Bizim tarafımızda yalnızca aboneliğinizin türü, durumu ve bitiş tarihi gibi özet
          bilgiler tutulur.
        </p>

        <h3 className="mt-4">Teknik ve Kullanım Verileri</h3>
        <p className="mt-1.5">
          Güvenlik, kötüye kullanımı önleme (ör. hız sınırlama) ve hizmetin düzgün çalışmasını sağlamak
          amacıyla IP adresi ve temel istek/cihaz bilgileri sınırlı süreyle işlenebilir.
        </p>
      </section>

      <section>
        <h2>2. Verilerinizi Neden İşliyoruz</h2>
        <ul>
          <li>Hesabınızı oluşturmak, kimliğinizi doğrulamak ve size hizmet sunmak.</li>
          <li>Fiş/fatura görsellerini okuyup otomatik olarak finansal kayda dönüştürmek.</li>
          <li>Harcama, gelir, borç, hedef ve yatırımlarınızı size göstermek ve analiz etmek (raporlar, grafikler, AI Sohbet).</li>
          <li>Abonelik/plan durumunuza göre hangi özelliklerin açık olduğunu belirlemek.</li>
          <li>Grup/Esnaf Modu gibi paylaşımlı özelliklerin çalışmasını sağlamak.</li>
          <li>Hizmeti güvende tutmak, kötüye kullanımı ve dolandırıcılığı önlemek.</li>
          <li>Yasal yükümlülüklerimizi yerine getirmek.</li>
        </ul>
        <p className="mt-3">
          Verilerinizi hiçbir zaman reklam amacıyla üçüncü taraflara satmayız. Mobil uygulamada
          gösterilen ödüllü reklamlar (isteğe bağlı, ekstra hak kazanmak için izlenir) Google AdMob
          altyapısıyla sunulur; bu reklamların gösterimi için AdMob&apos;un kendi gizlilik politikası
          geçerlidir.
        </p>
      </section>

      <section>
        <h2>3. Verilerinizi Kimlerle Paylaşıyoruz</h2>
        <p>
          Verilerinizi yalnızca hizmeti sunabilmemiz için gerekli olduğu ölçüde, aşağıdaki güvenilir alt
          yüklenicilerle (sub-processor) paylaşırız — bunların hiçbiri verilerinizi kendi amaçları için
          kullanamaz:
        </p>
        <ul className="mt-3">
          <li>
            <strong>Supabase</strong> — veritabanı, kimlik doğrulama ve dosya depolama altyapımız.
            Tüm verileriniz burada, erişim kontrolü (Row Level Security) ile sadece sizin
            hesabınızdan erişilebilir şekilde saklanır.
          </li>
          <li>
            <strong>Google Gemini API</strong> — fiş/belge görsellerinizin okunması ve AI Sohbet
            yanıtlarının üretilmesi için kullanılır. Gönderilen içerik, yalnızca isteğinize yanıt
            üretmek amacıyla işlenir.
          </li>
          <li>
            <strong>RevenueCat</strong> — mobil abonelik/satın alma durumunuzun yönetimi için
            (ödeme aracı bilgisi paylaşılmaz).
          </li>
          <li>
            <strong>Google AdMob</strong> — mobil uygulamada isteğe bağlı ödüllü reklamların
            gösterimi için.
          </li>
          <li>
            <strong>Vercel</strong> — web sitesinin barındırılması için.
          </li>
          <li>
            <strong>Cloudflare</strong> — web sitesindeki bazı formları otomatik bot trafiğine
            karşı korumak (Turnstile) için.
          </li>
        </ul>
        <p className="mt-3">
          Ayrıca yasal bir zorunluluk hâlinde (mahkeme kararı, resmî talep) yetkili makamlarla veri
          paylaşabiliriz. Bunların dışında verileriniz üçüncü taraflarla paylaşılmaz.
        </p>
      </section>

      <section>
        <h2>4. Veri Güvenliği</h2>
        <p>
          Verileriniz aktarım sırasında şifrelenir (HTTPS/TLS). Veritabanı erişimi, Row Level Security
          politikalarıyla her kullanıcının yalnızca kendi verisine (veya açıkça paylaştığı grup/işletme
          verisine) erişebileceği şekilde kısıtlanmıştır. Buna rağmen hiçbir sistem %100 güvenli
          olduğunu garanti edemez; bir güvenlik ihlali durumunda ilgili mevzuat gereği sizi ve/veya
          yetkili makamları bilgilendireceğiz.
        </p>
      </section>

      <section>
        <h2>5. Verilerinizi Ne Kadar Süre Saklıyoruz</h2>
        <p>
          Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı Ayarlar üzerinden silmeyi
          talep ettiğinizde kişisel finansal verileriniz kalıcı olarak silinir. Yasal saklama
          yükümlülüğü doğuran veriler (ör. Esnaf Modu&apos;ndaki fatura kayıtları gibi mali mevzuata
          tabi olabilecek veriler), ilgili mevzuatın öngördüğü süre boyunca saklanabilir.
        </p>
      </section>

      <section>
        <h2>6. Çerezler</h2>
        <p>
          Web sitemiz, oturumunuzu açık tutmak ve tercihlerinizi (ör. tema) hatırlamak için zorunlu
          çerezler/yerel depolama kullanır. Bunlar dışında reklam/izleme amaçlı üçüncü taraf çerezi
          kullanmıyoruz.
        </p>
      </section>

      <section>
        <h2>7. Çocukların Gizliliği</h2>
        <p>
          Fişştech, 18 yaş altındaki kişilere yönelik değildir ve bilerek 18 yaş altı kişilerden veri
          toplamayız. 18 yaşından küçük bir kullanıcının verisini topladığımızı fark edersek bu veriyi
          derhâl sileriz.
        </p>
      </section>

      <section>
        <h2>8. Haklarınız (KVKK Kapsamında)</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuat kapsamında; verinizin
          işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve
          amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı üçüncü
          kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, kanuni şartlar oluştuğunda
          silinmesini/yok edilmesini isteme ve otomatik sistemlerle yapılan analiz sonucu aleyhinize
          bir sonucun ortaya çıkmasına itiraz etme haklarına sahipsiniz. Bu haklara ilişkin ayrıntılı
          bilgi için <a href="/kvkk">KVKK Aydınlatma Metni</a>&apos;ni inceleyebilirsiniz.
        </p>
        <p className="mt-3">
          Verilerinizin çoğunu (harcama, gelir, hedef, not vb.) uygulama içinden doğrudan
          görüntüleyebilir, düzenleyebilir veya silebilirsiniz. Hesabınızın tamamen silinmesi de
          Ayarlar &gt; Hesap bölümünden mümkündür.
        </p>
      </section>

      <section>
        <h2>9. Politika Değişiklikleri</h2>
        <p>
          Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde uygulama içi bildirim
          veya e-posta ile sizi bilgilendireceğiz. Güncel sürüm her zaman bu sayfada yer alır.
        </p>
      </section>

      <section>
        <h2>10. Bize Ulaşın</h2>
        <p>
          Gizlilikle ilgili sorularınız, talepleriniz veya KVKK kapsamındaki başvurularınız için{" "}
          <a href="mailto:fisstechapp@gmail.com">fisstechapp@gmail.com</a> adresinden bize
          ulaşabilirsiniz.
        </p>
      </section>
    </LegalLayout>
  );
}
