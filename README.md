# Gruschedule

Giresun Üniversitesi'nin PDF olarak yayınladığı akademik takvim, sınav
takvimi, ders programı ve yemekhane menüsü verilerini otomatik olarak çekip
yapılandırılmış hâle getirip; fakülte/bölüm/şube bazlı filtrelenebilir bir
web arayüzünde ve (yakında) bir Telegram bot üzerinden öğrencilere sunar.

Bu bilgiler şu an sadece PDF içinde, dağınık, güncellendiğinde kimse haberdar
olmuyor. Gruschedule bunu tek, aranabilir, bildirim gönderen bir sisteme
çeviriyor.

**Kapsam (v1):** Tek üniversite (Giresun Üniversitesi). Mimari, ileride başka
üniversiteler eklenebilecek şekilde (adaptör deseni) tasarlandı, ama v1
sadece bir üniversiteyi hedefliyor.

## Mimari

```
Üniversite web sitesi (PDF kaynakları)
         │  periyodik kontrol (pg_cron → Edge Function)
         ▼
check-for-updates  ──(hash değiştiyse)──▶  parse-pdf
         │                                     │
         │                                     ▼
         │                          Supabase Postgres (ana veri deposu)
         │                                     │
         └──────────────▶ notify-changes ◀─────┘
                                (Telegram bildirimi, yakında)
                                     │
                        Next.js Frontend (bu repo, App Router)
                                     │
                              Telegram Bot (yakında)
```

- **Supabase Edge Functions** (`supabase/functions/`): PDF indirme,
  değişiklik tespiti (içerik hash'i), parse etme ve Postgres'e yazma.
- **Supabase Postgres**: fakülte/bölüm/şube, ders programı, sınav takvimi,
  akademik takvim ve yemekhane menüsü tabloları. Şema `supabase/migrations/`
  altında.
- **Next.js frontend** (`src/app/`): Server Components ile Supabase'den
  doğrudan veri çeken sayfalar — Dashboard, ders programı, sınav takvimi,
  akademik takvim, yemekhane menüsü.

Detaylı teknik spesifikasyon için [`gruschedule.md`](./gruschedule.md)
dosyasına bakabilirsiniz.

## Kurulum

Gereksinimler: Node.js 20+, bir Supabase projesi (veya
[Supabase CLI](https://supabase.com/docs/guides/local-development) ile
local development stack).

```bash
npm install
cp .env.local.example .env.local
# .env.local içine Supabase proje ayarlarından
# (Project Settings > API) URL ve anon key'i doldurun
npm run dev
```

Veritabanı şemasını kurmak için (yeni bir Supabase projesinde):

```bash
supabase link --project-ref <proje-ref>
supabase db push        # supabase/migrations/ altındaki şemayı uygular
psql "$DATABASE_URL" -f supabase/seed.sql   # örnek fakülte/bölüm verisi
```

Edge Functions'ı deploy etmek için:

```bash
supabase functions deploy parse-pdf
supabase functions deploy check-for-updates
supabase functions deploy telegram-webhook
supabase functions deploy notify-changes
```

### Telegram bot kurulumu

1. [@BotFather](https://t.me/BotFather)'dan yeni bir bot oluşturup token alın.
2. Token'ı Edge Function secret olarak ekleyin:
   `supabase secrets set TELEGRAM_BOT_TOKEN=<token>`
3. Webhook'u `telegram-webhook` fonksiyonunuzun deploy edilmiş URL'sine
   yönlendirin:
   `curl "https://api.telegram.org/bot<token>/setWebhook?url=<function-url>"`

Bot komutları: `/start`, `/bolum_sec`, `/sinavlarim`, `/menu`, `/takvim`,
`/simdi`, `/programim` — bkz. `gruschedule.md` bölüm 6.

## Proje yapısı

```
src/app/            Next.js sayfaları (App Router)
src/components/      Paylaşılan React bileşenleri
src/lib/             Supabase client'ları, veri çekme, ICS üretimi, yardımcılar
supabase/migrations/ Veritabanı şeması, RLS politikaları, cron kurulumu
supabase/functions/  PDF indirme/parse etme/yazma Edge Functions
fixtures/            Parser testleri için örnek PDF/HTML dosyaları
```

## Yeni bir üniversite eklemek

Mimari, `supabase/functions/_shared/adapters/` altında üniversiteye özel bir
adaptör dosyası (bugün için `giresun.ts`) üzerinden çalışacak şekilde
tasarlandı: PDF kaynaklarının nerede olduğu, hangi grid/regex formatının
kullanılacağı gibi üniversiteye özel bilgiler bu dosyada toplanıyor. Yeni bir
üniversite eklemek isterseniz:

1. `supabase/functions/_shared/adapters/` altına yeni bir adaptör dosyası
   ekleyin (mevcut `giresun.ts` iyi bir başlangıç noktasıdır).
2. Üniversitenin PDF formatı farklıysa (satır bazlı tablo mı, grid/matris mi)
   ilgili parser'ı (`parse-*.ts`) genelleştirin veya yeni bir parser ekleyin.
3. `source_documents` tablosuna `university_id` kolonu ekleyip mevcut
   tabloları buna göre migrate edin (bkz. `gruschedule.md` bölüm 8).

Detaylı katkı süreci için [`CONTRIBUTING.md`](./CONTRIBUTING.md) dosyasına
bakın.

## Lisans

[Apache License 2.0](./LICENSE).
