# json-api UI

json-api Backend as a Service platformasi uchun Next.js + TypeScript frontend.

## O'rnatish

```bash
npm install
```

## Ishga tushirish

```bash
npm run dev
```

Brauzerda: [http://localhost:3000](http://localhost:3000)

## Qurilish

```bash
npm run build
npm start
```

## Loyiha tuzilmasi

```
src/
├── app/
│   ├── page.tsx                    # Landing sahifa
│   ├── layout.tsx                  # Root layout (SEO meta teglari)
│   ├── not-found.tsx               # 404 sahifa
│   ├── error.tsx                   # Xato sahifa
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx          # Kirish
│   │   └── register/page.tsx       # Ro'yxatdan o'tish (auto tenant yaratish)
│   └── dashboard/
│       ├── layout.tsx              # Dashboard sidebar
│       ├── page.tsx                # Bosh sahifa (statistika)
│       ├── loading.tsx
│       ├── collections/page.tsx    # Kolleksiyalar CRUD
│       ├── api-keys/page.tsx       # API kalitlar
│       ├── webhooks/page.tsx       # Webhooklar
│       ├── functions/page.tsx      # Edge funksiyalar
│       ├── notifications/page.tsx  # Bildirishnomalar
│       └── analytics/page.tsx      # Analitika
├── lib/
│   ├── api.ts                      # Barcha backend endpointlari
│   └── auth-context.tsx            # Auth holat boshqaruvi
└── ...
```

## Backend API

Backend: `https://api-backend-x89g.onrender.com`

### Asosiy endpointlar

| Metod | Endpoint | Tavsif |
|-------|----------|--------|
| POST | `/tenants` | Tenant yaratish |
| POST | `/auth/register` | Ro'yxatdan o'tish |
| POST | `/auth/login` | Kirish |
| POST | `/auth/refresh` | Token yangilash |
| POST | `/auth/logout` | Chiqish |
| GET | `/auth/me` | Joriy foydalanuvchi |
| GET | `/:slug/collections/schema` | Kolleksiyalar ro'yxati |
| POST | `/:slug/collections/schema` | Kolleksiya yaratish |
| GET | `/:slug/collections/:name` | Yozuvlar ro'yxati |
| POST | `/:slug/collections/:name` | Yozuv qo'shish |
| PUT/PATCH | `/:slug/collections/:name/:id` | Yozuvni yangilash |
| DELETE | `/:slug/collections/:name/:id` | Yozuvni o'chirish |
| GET | `/:slug/api-keys` | API kalitlar |
| POST | `/:slug/api-keys` | Kalit yaratish |
| GET | `/:slug/webhooks` | Webhooklar |
| POST | `/:slug/webhooks` | Webhook yaratish |
| GET | `/:slug/functions` | Edge funksiyalar |
| POST | `/:slug/functions` | Funksiya yaratish |
| POST | `/:slug/functions/:slug/invoke` | Funksiyani chaqirish |
| POST | `/:slug/notifications/send` | Bildirishnoma yuborish |
| GET | `/:slug/analytics/overview` | Analitika xulosasi |
| GET | `/:slug/analytics/requests` | So'rovlar tarixi |

## Texnologiyalar

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (minimalistik qora/oq dizayn)
- **DM Sans + DM Mono + Syne** (shriftlar)
