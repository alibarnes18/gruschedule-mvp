# Gruschedule — Teknik Spesifikasyon

## 1. Proje Özeti

**Ne yapıyor:** Giresun Üniversitesi'nin PDF olarak yayınladığı akademik takvim,
sınav takvimi (vize/final/bütünleme), ders programı (haftalık zaman çizelgesi)
ve yemekhane menüsü verilerini otomatik olarak çekip yapılandırılmış
(structured) hale getirip, fakülte/bölüm/şube bazlı filtrelenebilir bir web
arayüzünde ve Telegram bot üzerinden öğrencilere sunar.

**Neden var:** Bu bilgiler şu an sadece PDF içinde, dağınık, güncellendiğinde
kimse haberdar olmuyor. Gruschedule bunu tek, aranabilir, bildirim gönderen bir
sisteme çeviriyor.

**Kapsam (v1):** Tek üniversite (Giresun Üniversitesi). Mimari, ileride başka
üniversite eklenebilecek şekilde (adapter pattern) tasarlanacak ama v1'de
sadece bir üniversite hedefleniyor.

**Açık kaynak:** Evet — MIT lisansı önerilir. README'de kurulum, mimari
diyagramı ve "yeni üniversite adaptörü nasıl eklenir" bölümü olmalı.

---

## 2. Mimari

```
┌─────────────────────┐
│ Üniversite web sitesi│
│  (PDF kaynakları)    │
└──────────┬───────────┘
           │ periyodik kontrol (pg_cron → Edge Function)
           ▼
┌──────────────────────────────┐
│ Supabase Edge Function:       │
│ check-for-updates              │
│ - PDF'i indirir                │
│ - hash'ini önceki hash ile      │
│   karşılaştırır                 │
│ - değişiklik varsa parse-pdf'i  │
│   tetikler                      │
└──────────┬─────────────────────┘
           ▼
┌──────────────────────────────┐
│ Supabase Edge Function:       │
│ parse-pdf                     │
│ - PDF'ten tabloyu/metni çıkarır│
│ - normalize eder (JSON)        │
│ - Postgres'e yazar              │
└──────────┬─────────────────────┘
           ▼
┌─────────────────────┐      ┌────────────────────────┐
│ Supabase Postgres     │◄────│ Edge Function:          │
│ (ana veri deposu)     │      │ notify-changes           │
└──────────┬────────────┘      │ - Telegram'a bildirim    │
           │                   │   gönderir                │
           │                   └────────────────────────┘
           ▼
┌─────────────────────┐
│ Next.js Frontend      │
│ (API routes + UI)     │
└──────────┬────────────┘
           ▼
┌─────────────────────┐
│ Telegram Bot           │
│ (bildirim + sorgu)     │
└─────────────────────┘
```

**Not — ders programı formatı farklı:** Sınav takvimi ve akademik takvim
düz satır-satır tablo iken, ders programı genelde bir **grid/matris**
formatında gelir (satır: saat aralığı, sütun: gün). Parser bu ikisini ayrı
mantıkla işlemeli — grid parsing için hücre pozisyonuna göre gün/saat
çıkarımı yapılması gerekir, bu Seçenek A (basit regex) için daha zorlayıcı
olabilir, Seçenek B (Python/camelot) grid tablolarda daha güvenilir sonuç verir.

**Not — PDF parsing kısıtı:** Supabase Edge Functions Deno üzerinde çalışır,
Python değil. Karmaşık tablo çıkarımı (camelot/pdfplumber seviyesinde) Deno'da
zayıf. Bu yüzden iki seçenek var, ikisi de spec'e dahil, karar Faz 1'de verilecek:

- **Seçenek A (basit):** Deno'da `unpdf` veya benzeri bir npm paketiyle
  metin çıkarımı yap, regex/heuristic ile parse et. PDF'ler çok karmaşık
  tablo değilse (çoğu üniversite PDF'i satır bazlı düz tablo) bu yeterli olur.
- **Seçenek B (güçlü):** Ayrı, küçük bir Python microservice (Railway/Fly.io
  free tier) sadece "PDF gönder → JSON dön" işini yapar. Edge Function bu
  servise HTTP isteğiyle PDF'i gönderir, dönen JSON'u Postgres'e yazar.
  n8n'in yaptığı orkestrasyon işini burada pg_cron + Edge Function üstleniyor,
  n8n'e hiç gerek kalmıyor.

Önerim: Seçenek A ile başla (daha basit, tamamen Supabase içinde kalır),
parse doğruluğu yetersiz kalırsa Seçenek B'ye geç.

---

## 3. Veritabanı Şeması (Postgres / Supabase)

```sql
create table faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references faculties(id) on delete cascade,
  name text not null,
  slug text not null
);

-- ders programı bölüm bazlı değil, çoğu zaman sınıf + şube bazlı değişir
create table sections (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  grade_level int not null, -- 1, 2, 3, 4
  section_label text -- 'A', 'B' gibi, tek şube varsa null
);

create table class_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  course_name text not null,
  instructor text,
  day_of_week int not null check (day_of_week between 1 and 7), -- 1=Pazartesi
  start_time time not null,
  end_time time not null,
  location text,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exam_events (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  exam_type text not null check (exam_type in ('midterm', 'final', 'makeup')),
  course_name text not null,
  exam_date date not null,
  exam_time time,
  location text,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table academic_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  description text,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now()
);

create table menu_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  items text[] not null,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now()
);

-- kaynak PDF takibi: hangi PDF'ten geldi, hash neydi (değişiklik tespiti için)
create table source_documents (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  document_type text not null check (document_type in ('exam_schedule', 'academic_calendar', 'menu', 'class_schedule')),
  content_hash text not null,
  fetched_at timestamptz default now(),
  parse_status text default 'pending' check (parse_status in ('pending', 'success', 'failed', 'needs_review'))
);

-- kullanıcı bildirim tercihleri (Telegram chat_id bazlı, auth yok)
create table notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id text unique not null,
  department_id uuid references departments(id),
  created_at timestamptz default now()
);
```

**RLS (Row Level Security):** Tüm okuma tabloları (`faculties`, `departments`,
`exam_events`, `academic_calendar_events`, `menu_days`) herkese açık `select`
izni versin. Yazma işlemleri sadece `service_role` key ile (Edge Functions
üzerinden) yapılsın — frontend'den doğrudan yazma olmasın.

---

## 4. Supabase Edge Functions

| Fonksiyon | Tetikleyici | Görevi |
|---|---|---|
| `check-for-updates` | pg_cron (her 6 saatte bir) | PDF kaynaklarını kontrol eder, hash değiştiyse `parse-pdf`'i çağırır |
| `parse-pdf` | `check-for-updates` tarafından çağrılır | PDF'i parse eder, `source_documents`'a kayıt açar, tabloya yazar |
| `notify-changes` | `parse-pdf` başarılı bittiğinde (DB trigger veya doğrudan çağrı) | Değişen kayıtları tespit edip Telegram'a bildirim gönderir |
| `telegram-webhook` | Telegram'dan gelen mesaj (webhook) | Bot komutlarını işler (`/bugun`, `/menu`, `/sinavlarim`, `/bolum_sec`) |
| `generate-ics` | Frontend'den çağrılır (public) | Belirli bir sınav/etkinlik için `.ics` dosyası üretip döner |

**pg_cron kurulumu:** Supabase'de `pg_cron` + `pg_net` extension'ları
açılacak, `check-for-updates` fonksiyonunu HTTP üzerinden periyodik tetikleyen
bir cron job tanımlanacak.

---

## 5. Frontend (Next.js + TypeScript)

**Sayfalar:**
- `/` — Dashboard: bugün/bu hafta özeti (şu an ders varsa "şu an X dersindesin, Y binasında" gösterimi dahil)
- `/ders-programi` — fakülte/bölüm/sınıf/şube seçimiyle haftalık grid görünümü (Pazartesi-Cuma, saat bazlı tablo)
- `/sinav-takvimi` — fakülte/bölüm filtreli sınav listesi
- `/akademik-takvim` — timeline görünümü
- `/menu` — haftalık yemek menüsü
- `/hakkinda` — proje hakkında, açık kaynak katkı rehberine link

**State/veri çekme:** Server Components ile Supabase'den direkt veri çek
(API route'a gerek yok çoğu yerde), client-side sadece fakülte/bölüm seçimi
gibi etkileşimler için `useState` + `localStorage`.

**Stil:** Tailwind CSS, dark-mode default (bkz. Lovable prompt'u tasarım
yönergeleri ile birebir uyumlu olacak şekilde).

---

## 6. Telegram Bot

Komutlar:
- `/start` — bölüm seçim akışını başlatır
- `/bolum_sec` — fakülte → bölüm seçim menüsü (inline keyboard)
- `/sinavlarim` — kayıtlı bölümün yaklaşan sınavları
- `/menu` — bugünün/bu haftanın yemek menüsü
- `/takvim` — akademik takvimdeki yaklaşan etkinlik
- `/simdi` — şu an hangi ders (varsa), nerede — bot'un en çok kullanılacak komutu olabilir
- `/programim` — kayıtlı şubenin haftalık ders programı

Bildirimler: bir sınav tarihi eklendiğinde/değiştiğinde, kayıtlı
`notification_subscriptions` üzerinden ilgili bölüme abone olan kullanıcılara
otomatik mesaj.

---

## 7. ICS / Takvim Entegrasyonu

Mevcut ICS generator (luhive.com/tools/ics-generator) mantığı buraya
taşınacak: her sınav/etkinlik kartında "Takvime Ekle" butonu → client-side
`.ics` dosyası üretip indirir. Ayrıca "tüm sınavlarımı indir" toplu seçeneği.

---

## 8. Çoklu Üniversite İçin Genişleme Noktası (v2, şimdilik sadece tasarım)

- `source_documents` tablosuna `university_id` kolonu eklenecek şekilde
  ileride migrate edilebilir.
- `parse-pdf` fonksiyonu üniversiteye özel bir "adapter config" (hangi PDF
  formatı, hangi regex/kolon eşleşmesi) okuyacak şekilde tasarlanmalı —
  v1'de hardcoded olsa da, fonksiyonun içinde bu config'i tek bir yerde
  (örn. `adapters/giresun.ts`) tutmak, v2'de yeni adapter eklemeyi
  kolaylaştırır.

---

## 9. Test & CI/CD

- Parser için unit testler: örnek PDF'ler (`fixtures/`) üzerinde beklenen
  JSON çıktısını doğrulayan testler
- GitHub Actions: PR açıldığında testleri çalıştır, `main`'e merge olduğunda
  Edge Functions'ı Supabase'e deploy et
- Frontend için en azından temel Playwright smoke testleri (dashboard yükleniyor mu,
  filtre çalışıyor mu)

---

## 10. Fazlar (Claude Code için sıralı görev listesi)

1. **Faz 1 — Temel altyapı:** Supabase projesi kur, şemayı oluştur, RLS
   politikalarını yaz, `faculties`/`departments` için seed data (Giresun
   Üniversitesi fakülte/bölüm listesi)
2. **Faz 2 — Parser:** Seçenek A ile başla (Deno + npm PDF paketi), örnek
   bir PDF üzerinde çalıştır, `source_documents` + ilgili tabloya yazan
   `parse-pdf` fonksiyonunu yaz. Ders programı grid formatı ayrı bir parser
   fonksiyonu/dalı olarak ele alınmalı (bkz. Bölüm 2, grid parsing notu)
3. **Faz 3 — Otomasyon:** `check-for-updates` + pg_cron kurulumu, hash
   karşılaştırma mantığı
4. **Faz 4 — Frontend:** Next.js sayfaları, Lovable'dan çıkan tasarımı
   entegre et veya sıfırdan Tailwind ile kur
5. **Faz 5 — Telegram bot:** `telegram-webhook` + `notify-changes`
6. **Faz 6 — ICS entegrasyonu**
7. **Faz 7 — Açık kaynak hazırlığı:** README, CONTRIBUTING.md, LICENSE, demo
   video/GIF

---

## 11. Açık Sorular

- Seçenek A mı B mi (parser mimarisi) — ilk gerçek PDF örneğiyle test edilip
  karara bağlanacak.
- Öğrenci "kendi bölümünü" seçerken hesap/login olmadan (localStorage) mı,
  yoksa Telegram chat_id üzerinden mi kalıcı hale getirilecek — v1'de ikisi
  paralel, ayrı senkronize değil.
