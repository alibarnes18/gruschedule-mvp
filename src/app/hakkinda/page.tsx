export const metadata = {
  title: "Hakkında — Gruschedule",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Hakkında</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gruschedule, Giresun Üniversitesi öğrencileri için bir topluluk
          projesidir.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-300">
        <p>
          Üniversitenin akademik takvim, sınav takvimi, ders programı ve
          yemekhane menüsü gibi bilgileri şu anda sadece PDF dosyaları olarak
          yayınlanıyor — dağınık, aranması zor ve güncellendiğinde kimse
          haberdar olmuyor. Gruschedule bu bilgileri otomatik olarak çekip
          tek, aranabilir ve bildirim gönderen bir sisteme dönüştürüyor.
        </p>
        <p>
          Proje açık kaynaklıdır. Kod tabanı; üniversite sitelerinden PDF
          toplayan ve ayrıştıran Supabase Edge Function&apos;ları, verinin
          saklandığı bir Postgres şeması ve bu arayüzü oluşturan bir Next.js
          uygulamasından oluşuyor. Mimari, ileride başka üniversitelerin de
          eklenebileceği bir adaptör yapısı gözetilerek tasarlandı.
        </p>
        <p>
          Katkıda bulunmak, hata bildirmek veya kendi üniversiteniz için bir
          adaptör eklemek isterseniz, deponun README dosyasındaki kurulum ve
          katkı rehberine bakabilirsiniz.
        </p>
      </section>
    </div>
  );
}
