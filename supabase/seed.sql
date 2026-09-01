-- PLACEHOLDER seed data (spec.md Faz 1).
-- These are generic Turkish faculty/department names, not verified against
-- Giresun Üniversitesi's actual current list. Replace this file once the
-- real fakülte/bölüm list is provided.
--
-- Kept in sync with what's actually applied on the live project
-- (jwybrwnwdxgehpoyxeyw): 4 faculties, 6 departments.

insert into faculties (name, slug) values
  ('Mühendislik Fakültesi', 'muhendislik'),
  ('İktisadi ve İdari Bilimler Fakültesi', 'iibf'),
  ('Fen-Edebiyat Fakültesi', 'fen-edebiyat'),
  ('Eğitim Fakültesi', 'egitim');

insert into departments (faculty_id, name, slug)
select f.id, d.name, d.slug
from faculties f
join (values
  ('muhendislik', 'Bilgisayar Mühendisliği', 'bilgisayar-muhendisligi'),
  ('muhendislik', 'İnşaat Mühendisliği', 'insaat-muhendisligi'),
  ('iibf', 'İşletme', 'isletme'),
  ('iibf', 'İktisat', 'iktisat'),
  ('fen-edebiyat', 'Türk Dili ve Edebiyatı', 'turk-dili-ve-edebiyati'),
  ('egitim', 'Sınıf Öğretmenliği', 'sinif-ogretmenligi')
) as d(faculty_slug, name, slug) on d.faculty_slug = f.slug;
