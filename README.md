# Real-Time Emotion Recognition — Client

Next.js tabanlı gerçek zamanlı duygu tanıma uygulamasının istemci tarafı. Kamera üzerinden yüz analizi yaparak duygu verilerini toplar, event ve session bazında gruplandırarak bir backend API'ye kaydeder.

---

## Özellikler

- **Event Yönetimi** — Event oluşturma, listeleme ve silme
- **Session Yönetimi** — Event başına session oluşturma, listeleme ve silme
- **Gerçek Zamanlı Duygu Analizi** — Kamera üzerinden yüz tespiti ve duygu sınıflandırması (mutlu, üzgün, kızgın, şaşkın, korku, iğrenme, nötr)
- **Süre Bazlı Kayıt** — Session başlatılırken belirlenen süre dolunca kamera otomatik kapanır, geri sayım ekranda gösterilir
- **Karanlık / Aydınlık Tema** — Sistem temasına göre otomatik uyum

---

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 15 (App Router) |
| Dil | TypeScript |
| Stil | Tailwind CSS |
| API İletişimi | Fetch API (custom `api` client) |

---

## Kurulum

### Gereksinimler

- Node.js 18+
- Çalışır durumda bir backend API (varsayılan: `http://127.0.0.1:8080`)

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/Sudeguslu/Real-Time-Emotion-Recognition---Client.git
cd Real-Time-Emotion-Recognition---Client

# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.local.example .env.local
# .env.local dosyasını düzenle → NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## Ortam Değişkenleri

`.env.local` dosyasında aşağıdaki değişkeni tanımla:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

---

## Proje Yapısı

```
├── app/
│   ├── page.tsx                  # Ana sayfa → Event listesi
│   └── events/[id]/page.tsx      # Event detay sayfası → Session listesi
├── components/
│   ├── CameraSession.tsx         # Kamera + duygu analizi + geri sayım
│   ├── CreateEventModal.tsx      # Event oluşturma modalı
│   ├── CreateSessionModal.tsx    # Session oluşturma modalı
│   ├── EventList.tsx             # Event listesi
│   ├── Navbar.tsx                # Üst navigasyon
│   ├── SessionList.tsx           # Session listesi
│   └── ThemeProvider.tsx         # Tema yönetimi
├── lib/
│   ├── api/
│   │   ├── client.ts             # HTTP istemcisi (GET/POST/PUT/DELETE)
│   │   └── types.ts              # TypeScript tip tanımları
│   └── services/
│       ├── emotions.ts           # Duygu analizi ve kayıt servisi
│       ├── events.ts             # Event CRUD servisi
│       ├── eventSessions.ts      # Session CRUD servisi
│       └── logs.ts               # Log servisi
```

---

## Kullanım

1. **Event oluştur** — Ana sayfada "Event Tanımla" butonuna tıkla
2. **Session oluştur** — Event detay sayfasında "Session Oluştur" butonuna tıkla
3. **Analizi başlat** — Session satırındaki "Başlat" butonuna tıkla, çalışma süresini dakika cinsinden gir
4. **Kamera** — Belirlenen süre boyunca yüzleri algılar ve duygu verilerini kaydeder; süre dolunca otomatik durur
5. **Silme** — Event veya session satırındaki "Sil" butonu ile kayıtları kaldır

---

## Backend API

Bu uygulama aşağıdaki endpoint'leri kullanan bir REST API bekler:

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/events/` | Tüm eventleri listele |
| POST | `/events/` | Event oluştur |
| DELETE | `/events/{id}` | Event sil |
| GET | `/event-sessions/by-event/{id}` | Event'e ait sessionları listele |
| POST | `/event-sessions/` | Session oluştur |
| DELETE | `/event-sessions/{id}` | Session sil |
| POST | `/emotions/analyze` | Kare analizi (base64 görüntü) |
| POST | `/emotions/` | Duygu kaydı oluştur |

---

## Lisans

MIT
