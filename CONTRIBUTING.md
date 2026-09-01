# Katkıda Bulunma

Gruschedule açık kaynak bir projedir, katkılara açığız.

## Geliştirme ortamı

```bash
npm install
cp .env.local.example .env.local   # Supabase proje bilgilerinizi girin
npm run dev
```

Kod göndermeden önce:

```bash
npm run lint
npm run build
```

Supabase Edge Functions [Deno](https://deno.com/) üzerinde çalışır ve kendi
test paketine sahiptir:

```bash
cd supabase/functions
deno test --allow-read _shared/
```

## Nereye katkı yapabilirsiniz

- **Parser doğruluğu:** Üniversitenin PDF formatı zaman zaman değişebiliyor
  (yeni sömestr, farklı şablon). `supabase/functions/_shared/parse-*.ts`
  dosyalarındaki parser'lar ve `fixtures/` altındaki örnek PDF'lere karşı
  yazılan testler bu tür regresyonları yakalamak için var — yeni bir format
  kırılması fark ederseniz, önce başarısız bir test ekleyin, sonra düzeltin.
- **Yeni üniversite adaptörü:** README'deki "Yeni bir üniversite eklemek"
  bölümüne bakın.
- **Frontend:** `src/app/` altındaki sayfalar Next.js App Router Server
  Components kullanıyor; etkileşimli kısımlar (seçim, filtre) ayrı client
  component'lere ayrılmış durumda (`src/components/`).

## Pull request süreci

1. Değişikliğinizi küçük ve odaklı tutun.
2. İlgiliyse test ekleyin veya güncelleyin.
3. `npm run lint` ve `npm run build`'in temiz geçtiğinden emin olun.
4. PR açıklamasında neyi, neden değiştirdiğinizi kısaca belirtin.

## Davranış kuralları

Saygılı ve yapıcı bir iletişim bekliyoruz. Sorun yaşarsanız bir issue açarak
bize ulaşabilirsiniz.
