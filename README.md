# LabOS – Laboratory Inventory Management

Supabase destekli, React + Vite + TypeScript ile yazılmış laboratuvar envanter takip uygulaması.

## Gereksinimler
- Node.js 18+ (npm ile geliyor)
- Supabase proje bilgileri (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) `.env` dosyasında olmalı. `.env` repoda yok, kendi değerlerinle oluştur.

## Kurulum ve Çalıştırma (Geliştirme)
```bash
# Bağımlılıkları kur
npm install

# Dev sunucu (http://localhost:5173)
npm run dev
```

## Supabase Kurulumu (kendi projen için)
1) Supabase’te yeni proje aç.
2) `supabase/migrations/20251222131146_53c62f9a-cb24-4ef6-8a4f-b85f8bf90059.sql` dosyasını SQL Editor’da çalıştırarak tablo, RLS ve fonksiyonları oluştur.
3) `.env` dosyanı aşağıdaki formatta oluştur:
```
VITE_SUPABASE_URL="https://<proje_ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon_key>"
VITE_SUPABASE_PROJECT_ID="<proje_ref>"
```
4) Giriş yaptıktan sonra admin rolü için gerekirse:
```sql
insert into public.user_roles (user_id, role)
values ('<KULLANICI_ID>', 'admin')
on conflict (user_id, role) do nothing;
```

## Üretim build’i
```bash
npm run build
```
`dist/` içeriğini statik bir sunucuyla yayınlayabilir veya herhangi bir hosting’e yükleyebilirsin.

## Hızlı başlatma (Windows)
`start_labos.bat` dosyasına çift tıkla:
- Node’u bulur, yoksa uyarır.
- `node_modules` yoksa `npm install` yapar.
- `npm run dev` başlatır ve tarayıcıda `http://localhost:5173` açar.

## Notlar
- `.env` repoya eklenmez; kendi değerlerinle yerelde oluştur.
- Logo/Favicon: `public/icon_no_bg.png` ve `public/favicon.svg/png`.
