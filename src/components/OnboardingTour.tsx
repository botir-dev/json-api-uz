"use client";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import { usePathname } from "next/navigation";

// ─── Context ──────────────────────────────────────────────────────────────────
const OnboardingContext = createContext<{
  startModalTour: (k: string) => void;
}>({
  startModalTour: () => {},
});
export const useOnboarding = () => useContext(OnboardingContext);
export { OnboardingContext };

// ─── Types ────────────────────────────────────────────────────────────────────
interface Step {
  id: string;
  selector: string | null;
  placement: "center" | "top" | "bottom" | "left" | "right";
  title: string;
  description: string;
  warning?: string;
}
type Rect = { top: number; left: number; width: number; height: number };

// ─── Storage — versiya o'zgartirish = tour qayta boshlanadi ───────────────────
const STORE_KEY = "obt_v3";
function isDone(k: string): boolean {
  try {
    return !!JSON.parse(localStorage.getItem(STORE_KEY) || "{}")[k];
  } catch {
    return false;
  }
}
function markDone(k: string) {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    d[k] = true;
    localStorage.setItem(STORE_KEY, JSON.stringify(d));
  } catch {}
}

// ─── PAGE STEPS ───────────────────────────────────────────────────────────────
const PAGE_STEPS: Record<string, Step[]> = {
  "/dashboard": [
    {
      id: "d0",
      selector: null,
      placement: "center",
      title: "json-api platformasiga xush kelibsiz! 👋",
      description:
        "Bu sizning bosh boshqaruv panelingiz. Barcha elementlarni birga ko'rib chiqamiz. «Tushunarli» ni bosing yoki Enter bosing.",
    },
    {
      id: "d1",
      selector: "aside",
      placement: "center",
      title: "Navigatsiya paneli (Sidebar)",
      description:
        "Chap panel orqali barcha bo'limlarga o'tasiz: Bosh sahifa, Kolleksiyalar, API Kalitlari, Webhooklar, Funksiyalar, Bildirishnomalar va Analitika.",
    },
    {
      id: "d2",
      selector: "aside nav",
      placement: "center",
      title: "Menyu havolalari",
      description:
        "Har bir menyu elementi bir bo'limga olib boradi. Faol bo'lim ajralib turadi. Havolalarni bosib har bir bo'limni o'rganing.",
    },
    {
      id: "d3",
      selector: "aside div[style*='borderTop']",
      placement: "center",
      title: "Mavzu va Foydalanuvchi",
      description:
        "Dark/light rejimni almashtirish, foydalanuvchi ma'lumotlari va chiqish tugmasi. Mavzu tanlov keyingi kirishda ham saqlanib qoladi.",
    },
    {
      id: "d4",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Sahifa sarlavhasi",
      description:
        "Sizning ismingiz va tenant slug ko'rsatiladi. Tenant nomi barcha API so'rovlaringizda asosiy yo'l sifatida ishlatiladi.",
    },
    {
      id: "d5",
      selector: ".grid.grid-cols-2",
      placement: "bottom",
      title: "Statistika kartalar",
      description:
        "4 ta karta real-time yangilanadi: Foydalanuvchilar, Kolleksiyalar, 30 kundagi so'rovlar va muvaffaqiyat foizi. Yashil — yaxshi, sariq — e'tibor bering.",
    },
    {
      id: "d6",
      selector: ".card.p-5.space-y-3",
      placement: "bottom",
      title: "API Manzili (Base URL)",
      description:
        "Shaxsiy API endpoint'ingiz. Barcha ilovalaringizda shu URL ishlatiladi. «Nusxa» tugmasi clipboard'ga nusxalaydi. So'rovlarda Authorization: Bearer token kerak.",
    },
    {
      id: "d7",
      selector: ".label.mb-3",
      placement: "bottom",
      title: "Tezkor harakatlar",
      description:
        "Eng ko'p ishlatiladigan amallarga tez kirish: Kolleksiya, API kalit, Webhook, Funksiya. Har birini bosib o'sha bo'limga darhol o'tasiz.",
    },
  ],

  "/dashboard/api-keys": [
    {
      id: "ak0",
      selector: null,
      placement: "center",
      title: "API Kalitlari bo'limi 🔑",
      description:
        "Bu yerda ilovalaringiz uchun xavfsiz API kalitlar yaratasiz. Har bir kalit o'z ruxsati, tezlik chegarasi va muddatiga ega.",
    },
    {
      id: "ak1",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Bo'lim sarlavhasi",
      description:
        "Sahifa nomi va «+ Yangi kalit» tugmasi — tugmani bosib yangi API kalit yaratasiz.",
    },
    {
      id: "ak2",
      selector: "button.btn-primary",
      placement: "bottom",
      title: "Yangi kalit yaratish",
      description:
        "Bu tugmani bosing — modal oynasi ochiladi. Nom, tezlik chegarasi, muddati va ruxsatlarni belgilaysiz.",
    },
    {
      id: "ak3",
      selector: null,
      placement: "center",
      title: "⚠️ JUDA MUHIM — Kalitni saqlang!",
      description:
        "API kalit yaratilganda «bk_...» bilan boshlanadigan to'liq kalit faqat bir marta ko'rsatiladi! Keyingi safar sahifaga kirsangiz, to'liq kalitni ko'ra olmaysiz.",
      warning:
        "Kalit faqat BIR MARTA ko'rsatiladi! Darhol «Nusxa» tugmasini bosib, xavfsiz joyga (.env fayliga) saqlang. Yo'qotilsa — o'chirib yangisini yaratasiz.",
    },
    {
      id: "ak4",
      selector: "div.space-y-2, div.card.p-14",
      placement: "top",
      title: "Kalitlar ro'yxati",
      description:
        "Yaratilgan kalitlar: nom, prefiks (bk_xxx...), tezlik limiti, ishlatilish soni, holat. O'chirish tugmasi bilan kerakmas kalitni o'chirasiz.",
    },
  ],

  "/dashboard/collections": [
    {
      id: "co0",
      selector: null,
      placement: "center",
      title: "Kolleksiyalar bo'limi ⬡",
      description:
        "Kolleksiyalar — ma'lumotlar jadvallari (SQL jadval yoki MongoDB collection kabi). Bu yerda sxema yaratasiz va yozuvlar qo'shasiz.",
    },
    {
      id: "co1",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Kolleksiyalar sarlavhasi",
      description: "«+ Yangi kolleksiya» tugmasi bilan yangi jadval yaratasiz.",
    },
    {
      id: "co2",
      selector: "button.btn-primary",
      placement: "bottom",
      title: "Yangi kolleksiya",
      description:
        "Bu tugmani bosing — modal ochiladi. Kod nomi, Ko'rsatma nomi va maydonlarni belgilaysiz.",
    },
    {
      id: "co3",
      selector: null,
      placement: "center",
      title: "Avtomatik REST API",
      description:
        "Kolleksiya yaratilgach avtomatik endpointlar tayyor: GET (ro'yxat), POST (qo'shish), GET/:id, PUT/:id, DELETE/:id. Hamma so'rov Authorization: Bearer token talab qiladi.",
    },
  ],

  "/dashboard/webhooks": [
    {
      id: "wh0",
      selector: null,
      placement: "center",
      title: "Webhooklar bo'limi ◉",
      description:
        "Hodisalar sodir bo'lganda sizning serveringizga avtomatik HTTP POST so'rov yuboradi. Masalan, yangi foydalanuvchi yoki kalit yaratilganda.",
    },
    {
      id: "wh1",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Webhooklar sarlavhasi",
      description:
        "Barcha webhook obunalaringiz ko'rinadi. Har webhook — URL va tinglayotgan hodisalar.",
    },
    {
      id: "wh2",
      selector: "button.btn-primary",
      placement: "bottom",
      title: "Webhook qo'shish",
      description:
        "Qabul qiluvchi URL va hodisalarni tanlaysiz: collection.created, user.registered, api_key.created va boshqalar.",
    },
    {
      id: "wh3",
      selector: null,
      placement: "center",
      title: "Webhookni sinab ko'rish",
      description:
        "Webhook yaratgach ro'yxatda «Test» tugmasi paydo bo'ladi. Haqiqiy hodisani kutmasdan sinab ko'ring — endpoint'ingiz 200 OK qaytarishi kerak.",
    },
  ],

  "/dashboard/functions": [
    {
      id: "fn0",
      selector: null,
      placement: "center",
      title: "Funksiyalar bo'limi ◧",
      description:
        "Edge Funksiyalar — serveringiz bo'lmasa ham ishlaydigan JavaScript kodlari. Serverless arxitekturada ishlaydi.",
    },
    {
      id: "fn1",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Funksiyalar sarlavhasi",
      description:
        "Yaratilgan funksiyalar ro'yxati. Tahrirlash, o'chirish va chaqirish mumkin.",
    },
    {
      id: "fn2",
      selector: "button.btn-primary",
      placement: "bottom",
      title: "Yangi funksiya",
      description:
        "Nom kiriting va JavaScript kodi yozing. req.body orqali ma'lumot olasiz, return bilan JSON javob yuborasiz.",
    },
    {
      id: "fn3",
      selector: null,
      placement: "center",
      title: "Funksiyani chaqirish",
      description:
        "POST /functions/{nom}/invoke orqali chaqirasiz. Body'da JSON yuborasiz, JSON javob olasiz.",
    },
  ],

  "/dashboard/notifications": [
    {
      id: "nt0",
      selector: null,
      placement: "center",
      title: "Bildirishnomalar bo'limi ◎",
      description:
        "Email va boshqa kanallar orqali bildirishnomalar yuborish uchun shablonlar yaratasiz va yuborilgan xabarlar tarixini ko'rasiz.",
    },
    {
      id: "nt1",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Bildirishnomalar sarlavhasi",
      description:
        "Ikkita tab: «Shablonlar» — qayta ishlatiladigan qoliplar; «Jurnal» — barcha yuborilgan bildirishnomalar tarixi.",
    },
    {
      id: "nt2",
      selector: "button.btn-primary",
      placement: "bottom",
      title: "Yuborish tugmasi",
      description:
        "Bildirishnoma yuborish uchun «Yuborish» tugmasini, shablon yaratish uchun «Shablon» tugmasini bosing.",
    },
    {
      id: "nt3",
      selector: null,
      placement: "center",
      title: "Yuborish jurnali",
      description:
        "«Jurnal» tabida har yuborilgan bildirishnomaning holati (yuborildi ✓, xato ✗) va vaqti ko'rsatiladi.",
    },
  ],

  "/dashboard/analytics": [
    {
      id: "an0",
      selector: null,
      placement: "center",
      title: "Analitika bo'limi ▦",
      description:
        "API so'rovlaringiz statistikasi: so'rovlar soni, javob vaqti, xatolar va muvaffaqiyat foizi.",
    },
    {
      id: "an1",
      selector: "h1.page-title",
      placement: "bottom",
      title: "Analitika sarlavhasi",
      description:
        "Sana filtri: 24 soat, 7 kun yoki 30 kunlik statistika. Real vaqtda yangilanadi.",
    },
    {
      id: "an2",
      selector: null,
      placement: "center",
      title: "Statistika grafiklar",
      description:
        "Vaqt bo'yicha so'rovlar grafigi, endpoint taqsimlash, HTTP status kodlar va eng sekin so'rovlar — barchasi bir joyda.",
    },
  ],
};

// ─── MODAL STEPS ──────────────────────────────────────────────────────────────
const MODAL_STEPS: Record<string, Step[]> = {
  "create-api-key": [
    {
      id: "mak0",
      selector: "input[placeholder='Mobil Ilova']",
      placement: "bottom",
      title: "Kalit nomi",
      description:
        "API kalitga tushunarli nom bering. Masalan: «Mobil Ilova», «Web Frontend». Bu nom keyinchalik kalitni tanib olishga yordam beradi.",
    },
    {
      id: "mak1",
      selector: "input[type='number']",
      placement: "bottom",
      title: "Tezlik chegarasi (Rate Limit)",
      description:
        "Bir daqiqada nechta so'rov bo'lishini belgilaydi. Ishlab chiqarish uchun 1000+, test uchun 100. Haddan oshsa 429 xatosi qaytariladi.",
    },
    {
      id: "mak2",
      selector: "input[type='datetime-local']",
      placement: "top",
      title: "Muddati (ixtiyoriy)",
      description:
        "Kalit muddatini belgilasangiz, o'sha vaqtdan keyin avtomatik o'chib qoladi. Xavfsizlik uchun doimiy emas, muddatli kalitlar ishlating.",
    },
    {
      id: "mak3",
      selector: "input[placeholder='read, write, delete']",
      placement: "top",
      title: "Ruxsatlar (Permissions)",
      description:
        "Vergul bilan ajrating: read, write, delete. Bo'sh qoldirsangiz — barcha amallarga ruxsat. Xavfsizlik uchun minimal ruxsat bering.",
    },
    {
      id: "mak4",
      selector: "button[type='submit']",
      placement: "top",
      title: "Yaratish — Diqqat!",
      description:
        "Yaratish ni bosing. Kalit yaratilgach ekranda to'liq «bk_...» kalit ko'rsatiladi — uni DARHOL nusxalab .env faylingizga saqlang!",
      warning:
        "Kalit FAQAT BIR MARTA ko'rsatiladi. Nusxalamay oynani yopsangiz — qayta ko'ra olmaysiz!",
    },
  ],
  "create-collection": [
    {
      id: "mco0",
      selector: "input[placeholder='products']",
      placement: "bottom",
      title: "Kod nomi",
      description:
        "API URL'da ishlatiladi. Faqat kichik harf, raqam va pastki chiziq. Masalan: products, users, blog_posts. Yaratilgach o'zgartirib bo'lmaydi!",
    },
    {
      id: "mco1",
      selector: "input[placeholder='Mahsulotlar']",
      placement: "bottom",
      title: "Ko'rsatma nomi",
      description:
        "Foydalanuvchilarga ko'rinadigan chiroyli nom. Masalan: «Mahsulotlar», «Foydalanuvchilar».",
    },
    {
      id: "mco2",
      selector: "div.space-y-2",
      placement: "top",
      title: "Maydonlar (Fields)",
      description:
        "Har maydon uchun: nom, tip (string, number, boolean, date...), required (majburiy). «+ Qo'shish» bilan yangi maydon qo'shasiz.",
    },
    {
      id: "mco3",
      selector: "button[type='submit']",
      placement: "top",
      title: "Kolleksiya yaratish",
      description:
        "«Yaratish» ni bosing. Yaratilgach unga avtomatik REST API endpointlari tayyor bo'ladi va darhol ishlaydi.",
    },
  ],
  "create-webhook": [
    {
      id: "mwh0",
      selector: "input[type='url']",
      placement: "bottom",
      title: "Webhook URL",
      description:
        "POST so'rov yuboriladigan URL. Masalan: https://sizningsayt.com/webhook. URL public bo'lishi va POST so'rovni qabul qila olishi kerak.",
    },
    {
      id: "mwh1",
      selector: "div.grid.grid-cols-2",
      placement: "top",
      title: "Hodisalarni tanlash",
      description:
        "Qaysi hodisalarda xabar olishni tanlaysiz: collection.created/updated/deleted, user.registered/login, api_key.created/deleted.",
    },
    {
      id: "mwh2",
      selector: "button[type='submit']",
      placement: "top",
      title: "Webhook saqlash",
      description:
        "Saqlangach ro'yxatda «Test» tugmasi paydo bo'ladi. Haqiqiy hodisani kutmasdan sinab ko'ring — endpoint'ingiz 200 OK qaytarishi kerak.",
    },
  ],
  "create-function": [
    {
      id: "mfn0",
      selector: "input[placeholder='Salomlash']",
      placement: "bottom",
      title: "Funksiya nomi",
      description:
        "Foydalanuvchiga ko'rinadigan nom. Masalan: Salomlash, Email yuborish.",
    },
    {
      id: "mfn1",
      selector: "textarea",
      placement: "top",
      title: "JavaScript kodi",
      description:
        "req.body dan ma'lumot olasiz, return bilan JSON javob yuborasiz. Starter kod allaqachon yozilgan — uning ustiga davom eting.",
    },
    {
      id: "mfn2",
      selector: "button[type='submit']",
      placement: "top",
      title: "Funksiya yaratish",
      description:
        "«Yaratish» ni bosing. Ro'yxatda funksiya ko'rinadi. POST /functions/{slug}/invoke orqali chaqirasiz.",
    },
  ],
  "create-notification": [
    {
      id: "mnt0",
      selector: "input[placeholder='xush-kelibsiz']",
      placement: "bottom",
      title: "Shablon nomi",
      description:
        "API da chaqirganingizda shu nom ishlatiladi. Masalan: welcome-email, password-reset.",
    },
    {
      id: "mnt1",
      selector: "select",
      placement: "bottom",
      title: "Kanal",
      description:
        "Bildirishnoma qaysi kanal orqali yuborilsin: email, sms, push...",
    },
    {
      id: "mnt2",
      selector: "textarea",
      placement: "top",
      title: "HTML matni",
      description:
        "{{firstName}}, {{orderId}} kabi o'zgaruvchilar qo'shasiz — API chaqiruvda haqiqiy ma'lumot o'rniga qo'yiladi.",
    },
    {
      id: "mnt3",
      selector: "button[type='submit']",
      placement: "top",
      title: "Shablonni saqlash",
      description:
        "Saqlangach POST /notifications/send ga {template: 'nom', to: 'email', data: {...}} yuborib bildirishnoma yubora olasiz.",
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRect(sel: string): Rect | null {
  try {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  } catch {
    return null;
  }
}

function getPopW(): number {
  if (typeof window === "undefined") return 340;
  const vw = window.innerWidth;
  if (vw < 420) return vw - 24;
  if (vw < 640) return 320;
  return 360;
}

function calcPos(
  rect: Rect | null,
  placement: Step["placement"],
  pw: number,
  ph: number,
) {
  if (typeof window === "undefined")
    return { top: 100, left: 100, side: "center" as const };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 12,
    mg = 10;

  // Small screens or center placement → always center
  if (!rect || placement === "center" || vw < 500) {
    return {
      top: Math.max(mg, vh / 2 - ph / 2),
      left: Math.max(mg, vw / 2 - pw / 2),
      side: "center" as const,
    };
  }

  let top = 0,
    left = 0,
    side = placement;

  if (placement === "bottom") {
    top = rect.top + rect.height + gap;
    left = rect.left + rect.width / 2 - pw / 2;
    if (top + ph > vh - mg) {
      top = rect.top - ph - gap;
      side = "top";
    }
  } else if (placement === "top") {
    top = rect.top - ph - gap;
    left = rect.left + rect.width / 2 - pw / 2;
    if (top < mg) {
      top = rect.top + rect.height + gap;
      side = "bottom";
    }
  } else if (placement === "right") {
    left = rect.left + rect.width + gap;
    top = rect.top + rect.height / 2 - ph / 2;
    if (left + pw > vw - mg) {
      left = rect.left - pw - gap;
      side = "left";
    }
  } else if (placement === "left") {
    left = rect.left - pw - gap;
    top = rect.top + rect.height / 2 - ph / 2;
    if (left < mg) {
      left = rect.left + rect.width + gap;
      side = "right";
    }
  }

  // If still out of bounds → center
  if (top < mg || top + ph > vh - mg || left < mg || left + pw > vw - mg) {
    return {
      top: Math.max(mg, vh / 2 - ph / 2),
      left: Math.max(mg, vw / 2 - pw / 2),
      side: "center" as const,
    };
  }

  left = Math.max(mg, Math.min(left, vw - pw - mg));
  top = Math.max(mg, Math.min(top, vh - ph - mg));
  return { top, left, side: side as Step["placement"] };
}

// ─── Spotlight ────────────────────────────────────────────────────────────────
function Spotlight({ rect, show }: { rect: Rect | null; show: boolean }) {
  const [dims, setDims] = useState({ vw: 1920, vh: 1080 });

  useEffect(() => {
    const update = () =>
      setDims({ vw: window.innerWidth, vh: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!show) return null;
  const pad = 8,
    rx = 10;

  if (!rect) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(1.5px)",
        }}
      />
    );
  }

  const sx = rect.left - pad,
    sy = rect.top - pad;
  const sw = rect.width + pad * 2,
    sh = rect.height + pad * 2;

  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9990,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <mask id="ob-mask">
          <rect x={0} y={0} width={dims.vw} height={dims.vh} fill="white" />
          <rect x={sx} y={sy} width={sw} height={sh} rx={rx} fill="black" />
        </mask>
      </defs>
      <rect
        x={0}
        y={0}
        width={dims.vw}
        height={dims.vh}
        fill="rgba(0,0,0,0.72)"
        mask="url(#ob-mask)"
      />
      <rect
        x={sx}
        y={sy}
        width={sw}
        height={sh}
        rx={rx}
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
      />
      <circle cx={sx + sw / 2} cy={sy + sh} r="4" fill="rgba(255,255,255,0.9)">
        <animate
          attributeName="r"
          values="4;11;4"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;0;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={sx + sw / 2} cy={sy + sh} r="4" fill="white" />
    </svg>
  );
}

// ─── Popover ──────────────────────────────────────────────────────────────────
function Popover({
  step,
  idx,
  total,
  rect,
  show,
  onNext,
  onPrev,
  onClose,
}: {
  step: Step;
  idx: number;
  total: number;
  rect: Rect | null;
  show: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const pw = getPopW();
  const ph = step.warning ? 295 : 215;
  const pos = calcPos(rect, step.placement, pw, ph);
  const isFirst = idx === 0,
    isLast = idx === total - 1;
  const pct = ((idx + 1) / total) * 100;

  const arrow = () => {
    if (pos.side === "center") return null;
    const s = 8;
    const b: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
      borderStyle: "solid",
    };
    if (pos.side === "bottom")
      return (
        <div
          style={{
            ...b,
            top: -s,
            left: "50%",
            transform: "translateX(-50%)",
            borderWidth: `0 ${s}px ${s}px`,
            borderColor: `transparent transparent rgba(13,13,17,0.98)`,
          }}
        />
      );
    if (pos.side === "top")
      return (
        <div
          style={{
            ...b,
            bottom: -s,
            left: "50%",
            transform: "translateX(-50%)",
            borderWidth: `${s}px ${s}px 0`,
            borderColor: `rgba(13,13,17,0.98) transparent transparent`,
          }}
        />
      );
    if (pos.side === "right")
      return (
        <div
          style={{
            ...b,
            left: -s,
            top: "50%",
            transform: "translateY(-50%)",
            borderWidth: `${s}px ${s}px ${s}px 0`,
            borderColor: `transparent rgba(13,13,17,0.98) transparent transparent`,
          }}
        />
      );
    if (pos.side === "left")
      return (
        <div
          style={{
            ...b,
            right: -s,
            top: "50%",
            transform: "translateY(-50%)",
            borderWidth: `${s}px 0 ${s}px ${s}px`,
            borderColor: `transparent transparent transparent rgba(13,13,17,0.98)`,
          }}
        />
      );
    return null;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pw,
        maxWidth: "calc(100vw - 20px)",
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transform: `translateY(${show ? 0 : 8}px)`,
        transition: "opacity 0.28s ease, transform 0.28s ease",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      {arrow()}
      <div
        style={{
          background: "rgba(13,13,17,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 13,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        {/* Progress */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "rgba(255,255,255,0.5)",
              borderRadius: "0 2px 2px 0",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <div style={{ padding: "15px 17px 14px" }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 9,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "monospace",
                letterSpacing: "0.08em",
              }}
            >
              {idx + 1} / {total}
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                padding: "0 2px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.75)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
              }
            >
              ×
            </button>
          </div>

          <h3
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: "#f0f0f0",
              marginBottom: 7,
              lineHeight: 1.3,
            }}
          >
            {step.title}
          </h3>
          <p
            style={{
              fontSize: 12.5,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.65,
              marginBottom: step.warning ? 10 : 14,
            }}
          >
            {step.description}
          </p>

          {step.warning && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "9px 12px",
                marginBottom: 12,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>
                ⚠️
              </span>
              <p
                style={{
                  fontSize: 11.5,
                  color: "rgba(252,165,165,0.9)",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {step.warning}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 7 }}>
            <button
              onClick={onPrev}
              disabled={isFirst}
              style={{
                flexShrink: 0,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: isFirst
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.5)",
                borderRadius: 7,
                padding: "8px 13px",
                fontSize: 12,
                cursor: isFirst ? "default" : "pointer",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isFirst) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isFirst) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }
              }}
            >
              ← Oldingi
            </button>
            <button
              onClick={onNext}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.92)",
                color: "#111",
                border: "none",
                borderRadius: 7,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.transform = "scale(1.01)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isLast ? (
                "Tayyor ✓"
              ) : (
                <>
                  {" "}
                  Tushunarli{" "}
                  <span style={{ opacity: 0.4, fontSize: 10 }}>Enter</span>
                </>
              )}
            </button>
          </div>
          <p
            onClick={onClose}
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: 10,
              color: "rgba(255,255,255,0.18)",
              cursor: "pointer",
            }}
          >
            O'tkazib yuborish (Esc)
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingTour({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageKey =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  const [steps, setSteps] = useState<Step[]>([]);
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState(false);
  const [show, setShow] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const isModal = useRef(false);
  const modalKey = useRef("");

  // ── Start tour ─────────────────────────────────────────────────────────────
  const launch = useCallback((ss: Step[], modal: boolean, mkey = "") => {
    isModal.current = modal;
    modalKey.current = mkey;
    setSteps(ss);
    setIdx(0);
    setShow(false);
    setActive(true);
  }, []);

  // ── Page tour on first visit ───────────────────────────────────────────────
  useEffect(() => {
    // Stop any running tour when page changes
    setActive(false);
    setShow(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const ss = PAGE_STEPS[pageKey];
    if (!ss) return;
    if (isDone(`p:${pageKey}`)) return;

    const t = setTimeout(() => launch(ss, false), 900);
    return () => clearTimeout(t);
  }, [pageKey, launch]);

  // ── Modal tour ─────────────────────────────────────────────────────────────
  const startModalTour = useCallback(
    (mkey: string) => {
      const ss = MODAL_STEPS[mkey];
      if (!ss) return;
      if (isDone(`m:${mkey}`)) return;
      setTimeout(() => launch(ss, true, mkey), 500);
    },
    [launch],
  );

  // ── Update rect when step changes ─────────────────────────────────────────
  useEffect(() => {
    if (!active || !steps[idx]) return;
    const step = steps[idx];

    setShow(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const update = () => {
      if (step.selector && step.placement !== "center") {
        setRect(getRect(step.selector));
      } else {
        setRect(null);
      }
      setTimeout(() => setShow(true), 80);
    };

    const t1 = setTimeout(update, 100);
    const t2 = setTimeout(update, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [idx, active, steps]);

  // ── Live rect tracking ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !steps[idx]) return;
    const step = steps[idx];
    if (!step.selector || step.placement === "center") return;

    const track = () => {
      const r = getRect(step.selector!);
      if (r) setRect(r);
      rafRef.current = requestAnimationFrame(track);
    };
    rafRef.current = requestAnimationFrame(track);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, idx, steps]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        doClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const goNext = useCallback(() => {
    setIdx((i) => {
      if (i < steps.length - 1) return i + 1;
      // last step → close
      setTimeout(doClose, 0);
      return i;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const goPrev = useCallback(() => {
    setIdx((i) => (i > 0 ? i - 1 : i));
  }, []);

  const doClose = useCallback(() => {
    setShow(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTimeout(() => {
      setActive(false);
      if (isModal.current && modalKey.current) {
        markDone(`m:${modalKey.current}`);
      } else {
        markDone(`p:${pageKey}`);
      }
      isModal.current = false;
      modalKey.current = "";
    }, 280);
  }, [pageKey]);

  return (
    <OnboardingContext.Provider value={{ startModalTour }}>
      {children}
      {active && steps[idx] && (
        <>
          <Spotlight rect={rect} show={show} />
          <Popover
            step={steps[idx]}
            idx={idx}
            total={steps.length}
            rect={rect}
            show={show}
            onNext={goNext}
            onPrev={goPrev}
            onClose={doClose}
          />
        </>
      )}
    </OnboardingContext.Provider>
  );
}
