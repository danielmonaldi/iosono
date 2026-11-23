import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// Credenciales Maestras Exclusivas de Daniel Monaldi
const MASTER_USERNAME = "danielmonaldi";
const MASTER_PASSWORD = "genova";
const MASTER_2FA_SECRET = "IOSONODANIELKEYS"; // Clave Base32 permanente (solo letras A-Z estándar RFC 4648)

// Credenciales oficiales de Mercado Pago de Daniel Monaldi (Io Sono)
const MP_PUBLIC_KEY = "APP_USR-38be8ac3-fded-4fac-a1c5-fd912aabb3fd";
const MP_ACCESS_TOKEN = "APP_USR-1712623438230795-111409-a77b5e8c5ac3ce73522eee48ca6631de-3845422384";
const TASA_DOLAR_ARS = 1400; // Cotización para conversión transparente USD -> ARS en Mercado Pago

// Algoritmo RFC 6238 para verificar el código de 6 dígitos de Google Authenticator
function base32toUint8Array(base32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < base32.length; i++) {
    const val = chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return new Uint8Array(bytes);
}

async function verifyGoogleAuthCode(token, secret = MASTER_2FA_SECRET) {
  try {
    const cleanToken = String(token || "").replace(/\s+/g, "").trim();
    if (cleanToken.length !== 6) return false;

    const subtle = window.crypto?.subtle;
    if (!subtle) return false;

    const timeStep = 30;
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / timeStep);
    const keyData = base32toUint8Array(secret);

    const cryptoKey = await subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    // Permitir ventana actual +- 1 intervalo de 30s para absorber desfases de reloj
    for (const offset of [0, -1, 1, -2, 2]) {
      const counter = currentCounter + offset;
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigUint64(0, BigInt(counter));

      const signature = await subtle.sign("HMAC", cryptoKey, buffer);
      const sigBytes = new Uint8Array(signature);
      const sigOffset = sigBytes[sigBytes.length - 1] & 0x0f;
      const sigView = new DataView(sigBytes.buffer, sigOffset, 4);
      const code = (sigView.getUint32(0) & 0x7fffffff) % 1000000;
      const codeStr = code.toString().padStart(6, "0");

      if (codeStr === cleanToken) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Error verificando código 2FA:", err);
    return false;
  }
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0f0e15; --bg1:#171520; --bg2:#1f1c2b; --bg3:#282438; --border:rgba(255,255,255,0.08); --border2:rgba(255,255,255,0.05);
    --text:#f5f3ff; --text2:#9e9bb0; --text3:#6b677f;
    --purple:#8b5cf6; --purple-lt:#c4b5fd; --purple-bg:rgba(139,92,246,0.12); --purple-glow:rgba(139,92,246,0.22);
    --green:#34d399; --green-bg:rgba(52,211,153,0.1); --green-border:rgba(52,211,153,0.3);
    --amber:#fbbf24; --amber-bg:rgba(251,191,36,0.1); --amber-border:rgba(251,191,36,0.35);
    --red:#f87171; --red-bg:rgba(248,113,113,0.1); --red-border:rgba(248,113,113,0.35);
    --blue:#60a5fa; --blue-bg:rgba(96,165,250,0.1);
    --radius:14px; --radius-sm:9px; --radius-lg:20px;
    --font-display:'Playfair Display',serif; --font-body:'DM Sans',sans-serif;
  }
  body {
    font-family:var(--font-body);
    background-color: #12101b;
    background-image: 
      radial-gradient(circle at 50% -10%, rgba(139, 92, 246, 0.28) 0%, transparent 65%),
      radial-gradient(circle at 100% 60%, rgba(124, 58, 237, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 0% 90%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      url("data:image/svg+xml,%3Csvg width='240' height='240' viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='Playfair Display, serif' font-style='italic' font-weight='600' font-size='22' fill='%23a78bfa' fill-opacity='0.035'%3EIo Sono%3C/text%3E%3Ccircle cx='120' cy='120' r='1.5' fill='%23ffffff' fill-opacity='0.06'/%3E%3C/svg%3E");
    background-attachment: fixed;
    background-repeat: repeat;
    color:var(--text);
    min-height:100vh;
    -webkit-font-smoothing:antialiased;
  }
  .app { max-width:680px; margin:0 auto; padding:0 16px 86px; }
  .nav { position:fixed; bottom:0; left:0; right:0; background:rgba(15,14,21,0.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid var(--border); display:flex; justify-content:center; z-index:100; }
  .nav-item { flex:1; max-width:85px; display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 0 14px; cursor:pointer; color:var(--text3); font-size:10px; letter-spacing:0.04em; text-transform:uppercase; border:none; background:transparent; transition:color 0.15s; position:relative; }
  .nav-item.active { color:var(--purple-lt); font-weight:500; }
  .nav-item i { font-size:20px; }
  .nav-badge { position:absolute; top:4px; right:14px; background:var(--red); color:#fff; border-radius:100px; font-size:10px; font-weight:700; min-width:16px; height:16px; display:flex; align-items:center; justify-content:center; padding:0 4px; line-height:1; }
  .card { background:rgba(23,21,32,0.85); backdrop-filter:blur(10px); border:1px solid var(--border); border-radius:var(--radius-lg); padding:20px; margin-bottom:12px; box-shadow:0 8px 32px rgba(0,0,0,0.25); }
  .card-title { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--text2); margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; }
  .hero { background:linear-gradient(135deg, rgba(31,28,43,0.7) 0%, rgba(23,21,32,0.9) 100%); border-radius:var(--radius-lg); padding:28px 20px; margin-bottom:12px; position:relative; overflow:hidden; border:1px solid rgba(139,92,246,0.18); box-shadow:0 12px 36px rgba(0,0,0,0.3); }
  .hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 90% 70% at 50% -10%, rgba(139,92,246,0.22) 0%, transparent 75%); pointer-events:none; }
  .hero-inner { position:relative; }
  .pill { font-size:11px; padding:4px 10px; border-radius:100px; display:inline-flex; align-items:center; gap:5px; font-weight:500; }
  .pill-purple { background:var(--purple-bg); color:var(--purple-lt); border:1px solid rgba(196,181,253,0.25); }
  .pill-green  { background:var(--green-bg);  color:var(--green); border:1px solid var(--green-border); }
  .pill-amber  { background:var(--amber-bg);  color:var(--amber); border:1px solid var(--amber-border); }
  .pill-red    { background:var(--red-bg);    color:var(--red); border:1px solid var(--red-border); }
  .pill-gray   { background:rgba(255,255,255,0.06); color:var(--text2); border:1px solid rgba(255,255,255,0.06); }
  .btn { border:none; border-radius:100px; font-family:var(--font-body); font-size:14px; font-weight:500; cursor:pointer; padding:12px 22px; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
  .btn-primary { background:linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color:#fff; box-shadow:0 4px 14px rgba(124,58,237,0.35); }
  .btn-primary:hover { background:linear-gradient(135deg, #9d72fa 0%, #6d28d9 100%); transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,0.45); }
  .btn-outline { background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.35); color:var(--purple-lt); }
  .btn-outline:hover { background:rgba(139,92,246,0.16); border-color:var(--purple-lt); }
  .btn-green { background:linear-gradient(135deg, #34d399 0%, #10b981 100%); color:#052e16; font-weight:600; box-shadow:0 4px 14px rgba(52,211,153,0.25); }
  .btn-red { background:var(--red-bg); border:1px solid var(--red-border); color:var(--red); }
  .btn-full { width:100%; border-radius:var(--radius); padding:13px; font-size:14px; }
  .btn-sm { padding:6px 14px; font-size:12px; border-radius:var(--radius-sm); }
  .field { margin-bottom:14px; }
  .field label { display:block; font-size:12px; color:var(--text2); margin-bottom:6px; font-weight:500; }
  .field input,.field textarea,.field select { width:100%; background:rgba(31,28,43,0.7); border:1px solid var(--border); border-radius:var(--radius-sm); padding:11px 14px; font-size:13px; color:var(--text); font-family:var(--font-body); transition:border-color 0.15s, box-shadow 0.15s; }
  .field input:focus,.field textarea:focus,.field select:focus { outline:none; border-color:var(--purple); box-shadow:0 0 0 3px rgba(139,92,246,0.18); }
  .field textarea { resize:vertical; min-height:75px; line-height:1.5; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .avatar { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:500; flex-shrink:0; overflow:hidden; }
  .avatar-lg { width:66px; height:66px; font-size:24px; }
  .avatar-md { width:44px; height:44px; font-size:16px; }
  .avatar-sm { width:32px; height:32px; font-size:12px; }
  .toggle-bar { display:flex; background:rgba(31,28,43,0.75); border-radius:var(--radius); padding:4px; gap:4px; margin-bottom:16px; border:1px solid var(--border); }
  .toggle-btn { flex:1; padding:8px; border-radius:var(--radius-sm); border:none; background:transparent; font-size:12px; color:var(--text2); cursor:pointer; font-family:var(--font-body); display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.15s; }
  .toggle-btn.active { background:rgba(23,21,32,0.95); color:var(--text); border:1px solid rgba(255,255,255,0.1); font-weight:600; box-shadow:0 2px 8px rgba(0,0,0,0.3); }
  .tag { display:inline-flex; align-items:center; gap:6px; background:rgba(31,28,43,0.7); border:1px solid var(--border); border-radius:100px; padding:6px 14px; font-size:12px; color:var(--text2); cursor:pointer; user-select:none; transition:all 0.15s; }
  .tag.on { background:var(--purple-bg); border-color:var(--purple); color:var(--purple-lt); }
  .tag.danger.on { background:var(--red-bg); border-color:var(--red); color:var(--red); }
  .tags-wrap { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
  .inf-card { background:rgba(23,21,32,0.85); backdrop-filter:blur(8px); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px; cursor:pointer; transition:all 0.2s cubic-bezier(0.16,1,0.3,1); box-shadow:0 4px 18px rgba(0,0,0,0.2); }
  .inf-card:hover { border-color:rgba(139,92,246,0.45); transform:translateY(-2px); box-shadow:0 10px 28px rgba(124,58,237,0.18); }
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); border-radius:var(--radius-sm); overflow:hidden; }
  .stat-cell { background:rgba(23,21,32,0.95); padding:10px 6px; text-align:center; }
  .stat-num { font-size:15px; font-weight:600; }
  .stat-lbl { font-size:9px; color:var(--text2); margin-top:2px; text-transform:uppercase; letter-spacing:0.04em; }

  /* Reloj y Campaña */
  .countdown-card { background:radial-gradient(ellipse at top left, #231b38, #151320); border:1px solid rgba(139,92,246,0.35); border-radius:var(--radius); padding:16px; margin-bottom:14px; box-shadow:0 8px 24px rgba(0,0,0,0.3); }
  .countdown-val { font-size:28px; font-weight:700; color:var(--purple-lt); font-variant-numeric:tabular-nums; letter-spacing:0.04em; }
  .rules-banner { background:rgba(31,28,43,0.8); border:1px solid var(--border); border-left:3.5px solid var(--purple-lt); border-radius:var(--radius-sm); padding:10px 14px; margin-bottom:12px; font-size:12px; line-height:1.5; }
  .action-box { background:rgba(31,28,43,0.8); border:1px solid var(--border); border-radius:var(--radius); padding:14px; margin-top:12px; }

  /* Chat */
  .chat-box { display:flex; flex-direction:column; height:calc(100vh - 165px); min-height:480px; background:rgba(23,21,32,0.9); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,0.3); }
  .chat-header { padding:12px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; background:rgba(15,14,21,0.85); backdrop-filter:blur(8px); }
  .chat-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }
  .msg-row { display:flex; width:100%; }
  .msg-row.sent { justify-content:flex-end; }
  .msg-row.received { justify-content:flex-start; }
  .msg-bubble { max-width:80%; padding:10px 14px; border-radius:14px; font-size:13px; line-height:1.5; word-break:break-word; }
  .msg-bubble.sent { background:linear-gradient(135deg, #8b5cf6, #7c3aed); color:#fff; border-bottom-right-radius:2px; box-shadow:0 4px 12px rgba(124,58,237,0.3); }
  .msg-bubble.received { background:rgba(31,28,43,0.85); color:var(--text); border:1px solid var(--border); border-bottom-left-radius:2px; }
  .msg-time { font-size:10px; margin-top:4px; opacity:0.7; text-align:right; }
  .chat-input-bar { padding:10px 12px; border-top:1px solid var(--border); display:flex; gap:8px; background:rgba(15,14,21,0.85); align-items:center; }
  .chat-input { flex:1; background:rgba(31,28,43,0.7); border:1px solid var(--border); border-radius:100px; padding:10px 16px; font-size:13px; color:var(--text); font-family:var(--font-body); }
  .chat-input:focus { outline:none; border-color:var(--purple); box-shadow:0 0 0 3px rgba(139,92,246,0.18); }
  .chat-send-btn { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #8b5cf6, #7c3aed); color:#fff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; flex-shrink:0; }

  /* Modal de Calificación */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
  .modal-card { background:var(--bg1); border:1px solid var(--border); border-radius:var(--radius-lg); width:100%; max-width:440px; padding:24px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.6); }
  .rating-bar { display:flex; gap:6px; justify-content:space-between; margin:10px 0 16px; }
  .rating-btn { width:34px; height:36px; border-radius:var(--radius-sm); border:0.5px solid var(--border); background:var(--bg2); color:var(--text2); font-weight:600; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
  .rating-btn.active { background:var(--purple); color:#fff; border-color:var(--purple); transform:scale(1.08); }

  /* Subida y Reproductor de Video HD */
  .drop-zone { border:2px dashed #5b35a8; border-radius:var(--radius); padding:26px 16px; text-align:center; background:var(--bg2); cursor:pointer; transition:all 0.2s; position:relative; }
  .drop-zone:hover { border-color:var(--purple-lt); background:var(--purple-bg); }
  .video-container { position:relative; width:100%; max-width:300px; margin:10px auto; border-radius:var(--radius); overflow:hidden; background:#000; box-shadow:0 12px 30px rgba(0,0,0,0.8); border:1px solid var(--border); }
  .video-el { width:100%; height:auto; display:block; max-height:460px; object-fit:cover; border-radius:var(--radius); }
  .video-badge { position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); color:#fff; font-size:10px; padding:3px 8px; border-radius:100px; display:flex; align-items:center; gap:5px; font-weight:600; z-index:10; }

  /* Categorías y Filtros del Buscador */
  .category-bar { display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:12px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .category-bar::-webkit-scrollbar { display:none; }
  .category-chip { display:inline-flex; align-items:center; gap:6px; background:var(--bg2); border:0.5px solid var(--border); border-radius:100px; padding:7px 14px; font-size:12px; color:var(--text2); cursor:pointer; white-space:nowrap; transition:all 0.15s; font-family:var(--font-body); flex-shrink:0; }
  .category-chip:hover { border-color:var(--purple); color:var(--text); }
  .category-chip.active { background:var(--purple); color:#fff; border-color:var(--purple); font-weight:600; }
  .trust-banner { background:radial-gradient(ellipse at top left, #1d1230, #110c1c); border:1px solid #4a2882; border-radius:var(--radius); padding:14px 16px; margin-bottom:14px; }
`;

const RESTRICTIONS_PRESET = [
  "🚫 Sin malas palabras / lenguaje vulgar",
  "🚫 No mostrar marcas competidoras",
  "🚫 No hablar de política ni controversias",
  "📌 Etiquetar a @marca en los primeros 3 segundos",
  "⏳ Mantener publicado mínimo 30 días",
  "👗 Código de vestimenta sobrio/cuidado"
];

const DEFAULT_SERVICES = [
  { id:"s1", name:"Historia Instagram (24h)", price:"USD 35", rawPrice:35, icon:"ti-clock", desc:"Story vertical de 24h con mención y sticker de enlace directo.", plazo:"24hs" },
  { id:"s2", name:"Combo 3 Historias Instagram", price:"USD 80", rawPrice:80, icon:"ti-stack-2", desc:"Secuencia narrativa de 3 stories mostrando el producto en uso.", plazo:"48hs" },
  { id:"s3", name:"Reel Instagram (hasta 30 seg)", price:"USD 120", rawPrice:120, icon:"ti-brand-instagram", desc:"Video vertical 9:16 editado con audio en tendencia y foco de marca.", plazo:"72hs" },
  { id:"s4", name:"Video TikTok dedicado (hasta 60 seg)", price:"USD 140", rawPrice:140, icon:"ti-brand-tiktok", desc:"Contenido nativo de TikTok con gancho en los primeros 3 segundos.", plazo:"72hs" },
  { id:"s5", name:"Post / Video Facebook", price:"USD 75", rawPrice:75, icon:"ti-brand-facebook", desc:"Publicación de alto alcance en página verificada de Facebook.", plazo:"48hs" },
  { id:"s6", name:"YouTube Short / Video", price:"USD 110", rawPrice:110, icon:"ti-brand-youtube", desc:"Short dinámico vertical con enlace destacado en descripción.", plazo:"72hs" },
  { id:"s7", name:"Combo Multiplataforma (Reel + TikTok)", price:"USD 210", rawPrice:210, icon:"ti-layers-intersect", desc:"Doble impacto: contenido optimizado para audiencias de Instagram y TikTok.", plazo:"72hs" }
];

const NICHOS_CATEGORIAS = [
  { id: "todos", label: "✨ Todos", icon: "ti-sparkles" },
  { id: "Moda & Tendencias", label: "👗 Moda & Look", icon: "ti-hanger" },
  { id: "Gastronomía", label: "🍔 Gastronomía", icon: "ti-coffee" },
  { id: "Fitness & Salud", label: "🏋️ Fitness & Salud", icon: "ti-activity" },
  { id: "Tech & Negocios", label: "💻 Tech & Negocios", icon: "ti-device-laptop" },
  { id: "Viajes & Lifestyle", label: "✈️ Viajes & Lifestyle", icon: "ti-plane" },
  { id: "Belleza", label: "💄 Belleza", icon: "ti-brush" }
];

const INITIAL_INFLUENCERS = [
  {
    id: "c6a28bf8-46ea-47b7-b937-503382a4a471",
    usuarioId: "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
    initials: "DM",
    name: "Daniel Monaldi",
    handle: "@danielmonaldii",
    tiktok: "@danielmonaldi_ok",
    facebook: "Daniel Monaldi Moda",
    youtube: "Daniel Monaldi TV",
    redes: {
      instagram: { handle: "@danielmonaldii", followers: "85.4K", url: "https://instagram.com/danielmonaldii" },
      tiktok: { handle: "@danielmonaldi_ok", followers: "142.6K", url: "https://tiktok.com/@danielmonaldi_ok" },
      facebook: { handle: "Daniel Monaldi Moda", followers: "24.1K", url: "https://facebook.com" },
      youtube: { handle: "Daniel Monaldi TV", followers: "31.5K", url: "https://youtube.com" }
    },
    video_presentacion: {
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      titulo: "Pitch Oficial a Marcas (45 seg)",
      descripcion: "Mirá cómo comunico a cámara: tono fresco, estilismo cuidado, dicción y enfoque en conversión para tu marca."
    },
    virales_redes: {
      tiktok: {
        title: "5 Outfits Urbanos para Invierno",
        reach: "428.5K vistas",
        likes: "38.2K likes",
        shares: "2.4K compartidos",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
      },
      instagram: {
        title: "Tendencias Streetwear en Buenos Aires",
        reach: "182.4K vistas",
        likes: "15.7K likes",
        shares: "1.8K compartidos",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      },
      youtube: {
        title: "Unboxing & Review Zapatillas Edición Limitada",
        reach: "94.6K vistas",
        likes: "8.3K likes",
        shares: "640 compartidos",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4"
      },
      facebook: {
        title: "Guía de Estilo Clásico & Combinaciones",
        reach: "41.2K vistas",
        likes: "3.1K likes",
        shares: "890 compartidos",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
      }
    },
    metricas_audiencia: {
      alcance_mensual: "850.000+ cuentas alcanzadas",
      engagement_promedio: "7.9% engagement verificado",
      genero: { hombres: 68, mujeres: 32 },
      edades: [
        { rango: "18-24", pct: 36 },
        { rango: "25-34", pct: 48 },
        { rango: "35-44", pct: 12 },
        { rango: "45+", pct: 4 }
      ],
      ciudades: [
        { ciudad: "CABA & GBA", pct: 54 },
        { ciudad: "Córdoba", pct: 16 },
        { ciudad: "Rosario / Santa Fe", pct: 12 },
        { ciudad: "Otras provincias", pct: 18 }
      ]
    },
    niche: "Moda & Tendencias",
    followers: "85.4K",
    zone: "Buenos Aires, Argentina",
    rating: "9.9",
    completedJobs: 24,
    fotoUrl: "https://whvafphwpkastjkcjrzs.supabase.co/storage/v1/object/public/fotos-perfil/fotos/c6a28bf8-46ea-47b7-b937-503382a4a471.png",
    bio: "Creador de contenido enfocado en moda masculina, estilo urbano y tendencias. Produzco videos en alta resolución con sonido cuidado y foco en engagement real.",
    responseTime: "< 2 horas",
    completionRate: "100%",
    verificado: true,
    recomendadoMarcas: true,
    topNicho: true,
    planActivo: "combo",
    planVence: "25/11/2026",
    services: [
      { id:"s1", name:"Historia (1 story de 24h)", price:"USD 35", rawPrice:35, icon:"ti-clock", desc:"Story vertical con mención y sticker de enlace.", plazo:"24hs", active:true },
      { id:"s2", name:"Combo 3 Historias consecutivas", price:"USD 80", rawPrice:80, icon:"ti-stack-2", desc:"Secuencia narrativa de 3 stories mostrando producto en uso.", plazo:"48hs", active:true },
      { id:"s3", name:"Reel hasta 30 seg.", price:"USD 120", rawPrice:120, icon:"ti-player-play", desc:"Video vertical 9:16 con audio trending y mención al inicio.", plazo:"72hs", active:true },
      { id:"s4", name:"Reel hasta 60 seg.", price:"USD 170", rawPrice:170, icon:"ti-video", desc:"Review o unboxing a fondo con planos macro del producto.", plazo:"72hs", active:true },
      { id:"s5", name:"Publicación Feed (Post fijo)", price:"USD 90", rawPrice:90, icon:"ti-photo", desc:"Carrusel fotográfico permanente de alta calidad en el feed.", plazo:"48hs", active:true },
      { id:"custom_dm_1", name:"Presencia en Evento / Lanzamiento", price:"USD 250", rawPrice:250, icon:"ti-sparkles", desc:"Asistencia presencial al evento, cobertura de 5 stories en vivo y 1 Reel resumen.", plazo:"A coordinar", isCustom: true, active:true }
    ],
    portfolio: [
      {
        id: "p1",
        title: "Campaña Colección Invierno - Studio Luce",
        brand: "Studio Luce",
        reach: "54.2K vistas",
        eng: "8.4% engagement",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      },
      {
        id: "p2",
        title: "Accesorios Urbanos & Unboxing",
        brand: "Tienda Nómade",
        reach: "38.9K vistas",
        eng: "7.1% engagement",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
      }
    ],
    condiciones: [
      "📦 El producto físico debe llegar con al menos 4 días de anticipación antes de filmar.",
      "🚫 No promociono plataformas de apuestas, casinos online ni criptomonedas especulativas.",
      "🎬 El guión debe permitirme adaptar la comunicación a mi tono natural para mantener credibilidad con mi comunidad.",
      "⏳ El contenido permanecerá publicado como mínimo 60 días."
    ],
    banco: {
      alias: "DANI.MONALDI.MP",
      cbu: "0000003100045892348911",
      titular: "Daniel Monaldi",
      cuit: "20-38491203-9",
      banco: "Mercado Pago"
    }
  },
  {
    id: "f3c83b8b-e85d-4f1d-91b7-d1a1b1c1d1e1",
    usuarioId: "f3c83b8b-e85d-4f1d-91b7-d1a1b1c1d1e1",
    initials: "NI",
    name: "Naza Influ",
    handle: "@nazainflu",
    tiktok: "@nazafood",
    niche: "Gastronomía",
    followers: "125K",
    zone: "CABA, Argentina",
    rating: "9.8",
    completedJobs: 31,
    fotoUrl: "https://whvafphwpkastjkcjrzs.supabase.co/storage/v1/object/public/fotos-perfil/fotos/f3c83b8b-e85d-4f1d-91b7-d1a1b1c1d1e1.png",
    bio: "Recorriendo las mejores cafeterías, bodegones y recetas de Buenos Aires. Videos dinámicos y tentadores para generar reservas y ventas inmediatas.",
    responseTime: "< 1 hora",
    completionRate: "98%",
    verificado: true,
    recomendadoMarcas: true,
    topNicho: true,
    planActivo: "combo",
    planVence: "28/11/2026",
    services: [
      { id:"ni_s1", name:"Historia (1 story de 24h)", price:"USD 45", rawPrice:45, icon:"ti-clock", desc:"Story mostrando plato o café con sticker de reservas.", plazo:"24hs", active:true },
      { id:"ni_s3", name:"Reel hasta 30 seg.", price:"USD 140", rawPrice:140, icon:"ti-player-play", desc:"Reel dinámico con audio trending y texto en pantalla.", plazo:"48hs", active:true },
      { id:"ni_s4", name:"Reel hasta 60 seg.", price:"USD 190", rawPrice:190, icon:"ti-video", desc:"Recorrido completo del local con menú sugerido.", plazo:"72hs", active:true },
      { id:"ni_c1", name:"Degustación / Visita al Local", price:"USD 280", rawPrice:280, icon:"ti-sparkles", desc:"Visita presencial de 2 horas + 1 Reel + 4 stories en vivo.", plazo:"A coordinar", isCustom: true, active:true }
    ],
    portfolio: [
      {
        id: "ni_p1",
        title: "Especial Cafeterías de Especialidad",
        brand: "Café Valiente",
        reach: "92K vistas",
        eng: "9.2% engagement",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      }
    ],
    condiciones: [
      "☕ En locales gastronómicos se requiere mesa reservada en horario de buena luz natural.",
      "🚫 No promociono productos ultraprocesados sin certificación sanitaria."
    ],
    banco: {
      alias: "NAZA.FOOD.BA",
      cbu: "0720000388000049281923",
      titular: "Nazarena Influ",
      cuit: "27-41209384-4",
      banco: "Santander Río"
    }
  },
  {
    id: "inf_lucas_tech",
    usuarioId: "usr_lucas_tech",
    initials: "LT",
    name: "Lucas Tech",
    handle: "@lucastech",
    tiktok: "@lucasreviews",
    niche: "Tech & Negocios",
    followers: "68.2K",
    zone: "Córdoba, Argentina",
    rating: "9.9",
    completedJobs: 19,
    fotoUrl: null,
    bio: "Unboxings, análisis de gadgets y apps de productividad para emprendedores y creadores. Comunicación clara, técnica y persuasiva.",
    responseTime: "< 3 horas",
    completionRate: "100%",
    verificado: true,
    recomendadoMarcas: false,
    topNicho: false,
    planActivo: "verificado",
    planVence: "15/11/2026",
    services: [
      { id:"lt_s1", name:"Historia (1 story de 24h)", price:"USD 40", rawPrice:40, icon:"ti-clock", desc:"Story con captura de pantalla y enlace directo a la app o web.", plazo:"24hs", active:true },
      { id:"lt_s3", name:"Reel hasta 60 seg. (Review Tech)", price:"USD 160", rawPrice:160, icon:"ti-video", desc:"Review completa de características y beneficios clave.", plazo:"72hs", active:true },
      { id:"lt_c1", name:"Video Tutorial Dedicado (UGC)", price:"USD 220", rawPrice:220, icon:"ti-sparkles", desc:"Video explicativo de uso para pauta publicitaria en Meta Ads.", plazo:"5 días", isCustom: true, active:true }
    ],
    portfolio: [],
    condiciones: [
      "💻 Los productos deben incluir accesorios completos y manual en español.",
      "⏳ Plazo de testeo mínimo de 3 días antes de filmar el borrador."
    ],
    banco: { alias: "LUCAS.TECH.CVU", cbu: "0000003100084920194822", titular: "Lucas Rossi", cuit: "20-39481920-3", banco: "Brubank" }
  },
  {
    id: "inf_sofi_fit",
    usuarioId: "usr_sofi_fit",
    initials: "SF",
    name: "Sofi Fitness",
    handle: "@sofifit",
    tiktok: "@sofitips",
    niche: "Fitness & Salud",
    followers: "94K",
    zone: "Rosario, Argentina",
    rating: "10",
    completedJobs: 28,
    fotoUrl: null,
    bio: "Entrenadora y apasionada del bienestar integral. Rutinas motivadoras, recetas saludables y testeos de indumentaria deportiva.",
    responseTime: "< 2 horas",
    completionRate: "100%",
    verificado: false,
    recomendadoMarcas: false,
    topNicho: false,
    planActivo: null,
    planVence: null,
    services: [
      { id:"sf_s1", name:"Historia (1 story de 24h)", price:"USD 35", rawPrice:35, icon:"ti-clock", desc:"Story entrenando con la prenda o suplemento.", plazo:"24hs", active:true },
      { id:"sf_s3", name:"Reel hasta 30 seg.", price:"USD 130", rawPrice:130, icon:"ti-player-play", desc:"Rutina rápida mostrando comodidad y resistencia del producto.", plazo:"48hs", active:true }
    ],
    portfolio: [],
    condiciones: ["🏋️ Solo suplementos con aval de ANMAT."],
    banco: { alias: "SOFI.FIT.BBVA", cbu: "0170002940000019283941", titular: "Sofía Martínez", cuit: "27-39102934-2", banco: "BBVA" }
  },
  {
    id: "inf_cami_viajes",
    usuarioId: "usr_cami_viajes",
    initials: "CV",
    name: "Cami Viajes",
    handle: "@camiviajes",
    tiktok: "@camiviajando",
    niche: "Viajes & Lifestyle",
    followers: "182K",
    zone: "Mendoza, Argentina",
    rating: "9.9",
    completedJobs: 42,
    fotoUrl: null,
    bio: "Experiencias de viaje, hoteles boutique, gastronomía de autor y bodegas. Estética visual cinematográfica.",
    responseTime: "< 4 horas",
    completionRate: "97%",
    verificado: false,
    recomendadoMarcas: false,
    topNicho: false,
    planActivo: null,
    planVence: null,
    services: [
      { id:"cv_s1", name:"Combo 3 Historias de estadía", price:"USD 110", rawPrice:110, icon:"ti-stack-2", desc:"Tour del hotel, habitación y amenities.", plazo:"24hs", active:true },
      { id:"cv_s4", name:"Reel Cinematográfico hasta 60s", price:"USD 240", rawPrice:240, icon:"ti-video", desc:"Tomas 4K editadas con música envolvente y etiquetas.", plazo:"72hs", active:true }
    ],
    portfolio: [],
    condiciones: ["✈️ Mínimo 2 noches para experiencias hoteleras."],
    banco: { alias: "CAMI.VIAJES.GAL", cbu: "0070001930000039281920", titular: "Camila Díaz", cuit: "27-38192039-5", banco: "Banco Galicia" }
  },
  {
    id: "inf_mica_beauty",
    usuarioId: "usr_mica_beauty",
    initials: "MB",
    name: "Mica Beauty",
    handle: "@micamakeup",
    tiktok: "@micatutorials",
    niche: "Belleza",
    followers: "52K",
    zone: "La Plata, Argentina",
    rating: "9.8",
    completedJobs: 15,
    fotoUrl: null,
    bio: "Maquilladora profesional. Tutoriales paso a paso, swatches honestos y recomendaciones de skincare para todo tipo de piel.",
    responseTime: "< 2 horas",
    completionRate: "100%",
    verificado: false,
    recomendadoMarcas: false,
    topNicho: false,
    planActivo: null,
    planVence: null,
    services: [
      { id:"mb_s1", name:"Historia (1 story de 24h)", price:"USD 30", rawPrice:30, icon:"ti-clock", desc:"Aplicación del producto en primer plano.", plazo:"24hs", active:true },
      { id:"mb_s3", name:"Reel hasta 30 seg. (Tutorial)", price:"USD 110", rawPrice:110, icon:"ti-player-play", desc:"Tutorial con antes y después del maquillaje.", plazo:"48hs", active:true }
    ],
    portfolio: [],
    condiciones: ["💄 Cosmética cruelty-free garantizada."],
    banco: { alias: "MICA.MAKEUP.MP", cbu: "0000003100092839182930", titular: "Micaela Paz", cuit: "27-42910293-1", banco: "Mercado Pago" }
  }
];

const AvatarEl = ({ initials, color, textColor, size="md", fotoUrl }) => {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={initials}
        className={`avatar avatar-${size}`}
        style={{ objectFit:"cover", border:"1px solid var(--border)" }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`avatar avatar-${size}`} style={{ background:color||"#2a1a4a", color:textColor||"#a78bfa" }}>
      {initials}
    </div>
  );
};

// ─── REPRODUCTOR Y VISOR DE BORRADOR OFICIAL ───────────────────────────────────
function DraftVideoPlayer({ videoUrl, externalUrl, title, nota }) {
  if (!videoUrl && !externalUrl) return null;

  return (
    <div style={{ background: "var(--bg1)", border: "1px solid var(--purple)", borderRadius: "var(--radius)", padding: "16px", margin: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-video" style={{ color: "var(--purple-lt)", fontSize: 18 }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {title || "Borrador de Reel en revisión"}
          </span>
        </div>
        <span className="pill pill-purple" style={{ fontSize: 10 }}>
          HD 9:16
        </span>
      </div>

      {videoUrl ? (
        <div className="video-container">
          <span className="video-badge">
            <i className="ti ti-player-play" /> Reproductor oficial
          </span>
          <video
            src={videoUrl}
            controls
            playsInline
            className="video-el"
          />
        </div>
      ) : (
        <div style={{ background: "var(--bg2)", padding: "12px 14px", borderRadius: "var(--radius-sm)", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
            🔗 {externalUrl}
          </div>
          <a href={externalUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
            Abrir borrador ↗
          </a>
        </div>
      )}

      {nota && (
        <div style={{ fontSize: 12, color: "var(--text2)", background: "var(--bg2)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontStyle: "italic", borderLeft: "2px solid var(--purple)", marginTop: 8 }}>
          "{nota}"
        </div>
      )}
    </div>
  );
}

// ─── SUBIDA REAL DE ARCHIVOS / VIDEOS CON SUPABASE STORAGE ────────────────────
function DraftMediaUploader({ camp, onDraftUploaded }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(camp?.borrador_video_url || null);
  const [externalLink, setExternalLink] = useState(camp?.borrador_url || "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modo, setModo] = useState("archivo"); // "archivo" | "link"
  const [notaEdicion, setNotaEdicion] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const localUrl = URL.createObjectURL(selected);
    setPreviewUrl(localUrl);
  };

  const handleSubirBorrador = async () => {
    setUploading(true);
    setProgress(30);

    let finalVideoUrl = previewUrl;
    let finalFileName = file ? file.name : "Video subido";

    if (file) {
      try {
        setProgress(60);
        const fileExt = file.name.split('.').pop();
        const fileName = `borradores/${camp.id || Date.now()}_${Date.now()}.${fileExt}`;

        // Intentar subir a Supabase Storage
        const { data, error } = await supabase.storage
          .from('fotos-perfil')
          .upload(fileName, file, { upsert: true });

        if (!error && data) {
          const { data: pubData } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName);
          if (pubData?.publicUrl) {
            finalVideoUrl = pubData.publicUrl;
          }
        }
      } catch (err) {
        console.warn("Storage upload fallback a URL local:", err);
      }
    }

    setProgress(100);
    setTimeout(() => {
      onDraftUploaded({
        borrador_video_url: finalVideoUrl,
        borrador_archivo_nombre: finalFileName,
        borrador_url: externalLink || finalVideoUrl,
        borrador_nota: notaEdicion
      });
      setUploading(false);
    }, 400);
  };

  return (
    <div className="action-box" style={{ border: "1px solid var(--purple)", background: "var(--bg1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--purple-lt)" }}>
          🎬 Cargar borrador del contenido
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            className={`pill ${modo === "archivo" ? "pill-purple" : "pill-gray"}`}
            style={{ cursor: "pointer", border: "none" }}
            onClick={() => setModo("archivo")}
          >
            Subir video
          </button>
          <button
            type="button"
            className={`pill ${modo === "link" ? "pill-purple" : "pill-gray"}`}
            style={{ cursor: "pointer", border: "none" }}
            onClick={() => setModo("link")}
          >
            Pegar enlace
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
        Subí tu video en formato vertical (9:16) para que la marca lo reproduzca en alta calidad y dé su aprobación.
      </div>

      {modo === "archivo" ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="video/mp4,video/quicktime,video/webm,image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {!previewUrl ? (
            <div
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="ti ti-upload" style={{ fontSize: 32, color: "var(--purple-lt)", display: "block", marginBottom: 6 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Hacé clic para seleccionar tu video (.mp4, .mov)
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                Soporta videos de Reels, Historias y fotos en alta definición
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div className="video-container">
                <span className="video-badge">
                  <i className="ti ti-player-play" /> Vista previa borrador
                </span>
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="video-el"
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg2)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--text2)" }}>
                <span>📁 {file ? file.name : "Video listo"}</span>
                <button
                  type="button"
                  style={{ background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 11 }}
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                >
                  Cambiar video ✕
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Enlace externo (Google Drive, Dropbox, Loom):</label>
          <input
            placeholder="https://drive.google.com/file/d/..."
            value={externalLink}
            onChange={e => setExternalLink(e.target.value)}
          />
        </div>
      )}

      <div className="field" style={{ marginTop: 10 }}>
        <label>Nota u observaciones para la marca (opcional):</label>
        <textarea
          placeholder="Ej: Te paso la versión final con la música pedida y el producto en primer plano..."
          value={notaEdicion}
          onChange={e => setNotaEdicion(e.target.value)}
          style={{ minHeight: 60 }}
        />
      </div>

      <button
        className="btn btn-primary btn-full"
        disabled={uploading || (!previewUrl && !externalLink.trim())}
        onClick={handleSubirBorrador}
      >
        {uploading ? `Subiendo video (${progress}%)...` : "Enviar borrador a la marca para aprobación 🚀"}
      </button>
    </div>
  );
}

// ─── COMPONENTE DE CUENTA REGRESIVA DE 36 HORAS EN TIEMPO REAL ────────────────
function CountdownTimerReal({ publicadoAt, onExpire, onSimularExpiracion }) {
  const TOTAL_36_HORAS_MS = 36 * 60 * 60 * 1000;
  const [msRestantes, setMsRestantes] = useState(() => {
    const inicio = publicadoAt || Date.now();
    const transcurrido = Date.now() - inicio;
    return Math.max(0, TOTAL_36_HORAS_MS - transcurrido);
  });

  useEffect(() => {
    if (msRestantes <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setMsRestantes(prev => {
        const nuevo = prev - 1000;
        if (nuevo <= 0) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return nuevo;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [msRestantes]);

  const horas = Math.floor(msRestantes / (1000 * 60 * 60));
  const minutos = Math.floor((msRestantes % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((msRestantes % (1000 * 60)) / 1000);

  const porcentajeTranscurrido = Math.min(100, Math.max(0, ((TOTAL_36_HORAS_MS - msRestantes) / TOTAL_36_HORAS_MS) * 100));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <div className="countdown-val">
          {String(horas).padStart(2, "0")}h {String(minutos).padStart(2, "0")}m {String(segundos).padStart(2, "0")}s
        </div>
        <button
          type="button"
          onClick={onSimularExpiracion}
          style={{ background:"var(--purple-bg)", border:"0.5px solid var(--purple)", color:"var(--purple-lt)", borderRadius:"var(--radius-sm)", padding:"4px 9px", fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}
          title="Prueba de desarrollo para simular que pasaron las 36hs"
        >
          ⏩ Simular fin 36hs
        </button>
      </div>

      {/* Barra de progreso de las 36hs */}
      <div style={{ width:"100%", height:5, background:"var(--bg2)", borderRadius:100, overflow:"hidden", marginBottom:12 }}>
        <div style={{ width:`${porcentajeTranscurrido}%`, height:"100%", background:"linear-gradient(90deg, var(--purple), var(--green))", transition:"width 1s linear" }} />
      </div>
    </div>
  );
}

// ─── MODAL DE TÉRMINOS Y CONDICIONES LEGALES & GARANTÍA ESCROW ───────────────
function TerminosModal({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-card" style={{ maxWidth: 640, maxHeight: "85vh", overflowY: "auto", padding: 24, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-scale" style={{ color: "var(--purple-lt)", fontSize: 24 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Términos y Condiciones Legales</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Garantía Escrow, Retención y Políticas de Io Sono</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg2)", padding: "10px 12px", borderRadius: "var(--radius-sm)", borderLeft: "3.5px solid var(--purple)" }}>
            <strong>Resumen Ejecutivo:</strong> Io Sono opera bajo un sistema de <strong>Custodia Preventiva Escrow</strong> a través de Mercado Pago. La Marca deposita los fondos por adelantado, pero el dinero queda inmovilizado sin entregarse al Creador hasta que el borrador sea aprobado y publicado con un período de verificación de 36 horas.
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>1. Partes y Objeto del Servicio</div>
            <p style={{ margin: 0, color: "var(--text2)" }}>
              La plataforma <strong>Io Sono</strong> conecta a <strong>Marcas</strong> (empresas o personas que contratan publicidad) con <strong>Creadores de Contenido / Influencers</strong> (quienes producen y publican material en sus redes sociales: Instagram, TikTok, Facebook o YouTube). Io Sono actúa como intermediario tecnológico, custodio fiduciario de los fondos y árbitro de mediación.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>2. Mecánica de Custodia Escrow y Split de Pagos</div>
            <ul style={{ margin: "4px 0 0 16px", padding: 0, color: "var(--text2)" }}>
              <li><strong>Retención 100% segura:</strong> El monto total acordado se retiene en la cuenta recaudadora de Mercado Pago de Io Sono al momento de la contratación.</li>
              <li><strong>División pactada (Split):</strong> El 85% del monto neto corresponde a los honorarios del Influencer, y el 15% restante corresponde a la comisión por servicio y garantía de Io Sono.</li>
              <li><strong>Inmovilización de fondos:</strong> Ninguna de las partes puede retirar o desviar el dinero mientras la campaña se encuentre en curso.</li>
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>3. Plazos de Producción y Pautas Vinculantes</div>
            <p style={{ margin: 0, color: "var(--text2)" }}>
              El Influencer cuenta con un plazo estándar de <strong>72 horas hábiles</strong> (o el pactado en servicios a medida) desde la aceptación de la propuesta o desde la recepción fehaciente del producto físico. Todas las pautas y prohibiciones seleccionadas por la Marca al contratar (ej. mención en primeros segundos, ausencia de competidores, código de vestimenta) son vinculantes y de cumplimiento obligatorio.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>4. Política de Borrador HD y Ajustes de Edición</div>
            <p style={{ margin: 0, color: "var(--text2)" }}>
              El material preliminar debe ser subido a la plataforma en formato vertical HD 9:16 para su previsualización. La Marca tiene derecho a solicitar <strong>un (1) ajuste menor de edición</strong> (recorte de planos, silenciado de una palabra, cambio de subtítulo o sticker). No se admiten cambios totales de guion ni solicitudes de regrabación completa que difieran de lo acordado inicialmente.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>5. Publicación, Plazo de 36 Horas y Liberación de Fondos</div>
            <p style={{ margin: 0, color: "var(--text2)" }}>
              Una vez aprobado el borrador, el Influencer publica el contenido en sus redes y registra el enlace oficial en Io Sono. A partir de ese momento se inicia un <strong>temporizador de seguridad de 36 horas</strong>. Transcurrido dicho plazo con el video en línea respetando las pautas, los fondos se liberan de forma automática e irrevocable al saldo y CBU del creador, o de forma anticipada si la Marca presiona "Satisfecho".
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>6. Políticas de Cancelación Justa y Auditoría Antifraude</div>
            <ul style={{ margin: "4px 0 0 16px", padding: 0, color: "var(--text2)" }}>
              <li><strong>Propuesta Declinada:</strong> Si el Influencer no acepta o rechaza la oferta, se reembolsa el 100% del dinero de inmediato a la Marca.</li>
              <li><strong>Cancelación tras filmación de buena fe:</strong> Si el creador entregó un borrador apto pero la marca desiste unilateralmente de usarlo, se liquida el 50% al creador por gastos y jornada de rodaje, y se reintegra el 50% a la Marca.</li>
              <li><strong>Fraude o Incumplimiento Grave:</strong> Si el material viola pautas esenciales o no es entregado, la mediación dictaminará el reintegro total del 100% a la Marca.</li>
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--purple-lt)", marginBottom: 4 }}>7. Jurisdicción y Mediación</div>
            <p style={{ margin: 0, color: "var(--text2)" }}>
              Para cualquier controversia, las partes acuerdan someterse en primera instancia al tribunal de mediación interna de Io Sono encabezado por su administración, conforme a las leyes de la República Argentina.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose} style={{ minWidth: 140 }}>
            Entendido y Acepto ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL DE CALIFICACIÓN Y CONFIANZA (1 al 10) ─────────────────────────────
function RatingModal({ campaign, onClose, onSubmit }) {
  const [puntajeTrabajo, setPuntajeTrabajo] = useState(10);
  const [satisfaccion, setSatisfaccion] = useState(10);
  const [tipoServicio, setTipoServicio] = useState(campaign?.servicio_nombre || "Reel hasta 30 seg.");
  const [cambiariaAlgo, setCambiariaAlgo] = useState(false);
  const [detalleCambio, setDetalleCambio] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    await onSubmit({
      campana_id: campaign.id,
      influencer_id: campaign.influencer_id,
      puntaje_trabajo: puntajeTrabajo,
      satisfaccion: satisfaccion,
      tipo_servicio: tipoServicio,
      cambiaria_algo: cambiariaAlgo,
      detalle_cambio: cambiariaAlgo ? detalleCambio : "",
      comentario: comentario
    });
    setEnviando(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:16, fontWeight:600 }}>Calificar trabajo recibido</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:18 }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:"var(--text2)", marginBottom:16, lineHeight:1.5 }}>
          Tu puntuación genera la reputación pública del influencer en Io Sono.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>1. Puntaje del trabajo realizado (1 al 10) *</label>
            <div className="rating-bar">
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <button
                  type="button"
                  key={num}
                  className={`rating-btn ${puntajeTrabajo===num?"active":""}`}
                  onClick={() => setPuntajeTrabajo(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>2. ¿Qué contenido realizó?</label>
            <select value={tipoServicio} onChange={e => setTipoServicio(e.target.value)}>
              <option>Reel hasta 30 seg.</option>
              <option>Reel hasta 60 seg.</option>
              <option>Historia (1 story de 24h)</option>
              <option>Combo 3 Historias</option>
              <option>Publicación Feed</option>
              <option>Mención</option>
              <option>Servicio Personalizado</option>
            </select>
          </div>

          <div className="field">
            <label>3. ¿Cambiarías algo del trabajo recibido?</label>
            <div className="grid-2" style={{ marginBottom:8 }}>
              <button
                type="button"
                className={`tag ${!cambiariaAlgo?"on":""}`}
                style={{ justifyContent:"center", padding:"9px" }}
                onClick={() => setCambiariaAlgo(false)}
              >
                No, quedó perfecto ✓
              </button>
              <button
                type="button"
                className={`tag ${cambiariaAlgo?"on":""}`}
                style={{ justifyContent:"center", padding:"9px" }}
                onClick={() => setCambiariaAlgo(true)}
              >
                Sí, cambiaría un detalle ✏️
              </button>
            </div>
            {cambiariaAlgo && (
              <textarea
                placeholder="Ej: Me hubiera gustado que mostrara el logo más cerca..."
                value={detalleCambio}
                onChange={e => setDetalleCambio(e.target.value)}
              />
            )}
          </div>

          <div className="field">
            <label>4. Nivel de satisfacción general (1 al 10) *</label>
            <div className="rating-bar">
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <button
                  type="button"
                  key={num}
                  className={`rating-btn ${satisfaccion===num?"active":""}`}
                  onClick={() => setSatisfaccion(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>5. Comentario público para el perfil del influencer</label>
            <textarea
              placeholder="Ej: Súper profesional, entregó antes del plazo acordado y cumplió todas las pautas..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={enviando}>
            {enviando ? "Guardando reseña..." : "Enviar calificación y liberar ⭐"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── CHECKOUT CON CONDICIONES OBLIGATORIAS O "LIBRE ELECCIÓN" ─────────────────
function Checkout({ data, onNav, user, onCampañaCreada, onOpenTerminos }) {
  const inf = data?.inf;
  const service = data?.service || DEFAULT_SERVICES[2];
  const priceNum = service ? (service.rawPrice || 120) : 120;

  // Estado obligatorio: debe elegir o "libre" o al menos 1 pauta restrictiva
  const [modoCondicion, setModoCondicion] = useState(null); // "libre" | "restringido" | null
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [customRestriction, setCustomRestriction] = useState("");
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [metodoPago, setMetodoPago] = useState("mercadopago"); // "mercadopago" | "saldo"
  const [mpModalOpen, setMpModalOpen] = useState(false);
  const [mpProcessing, setMpProcessing] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(true);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const toggleRestriction = (item) => {
    setModoCondicion("restringido");
    setErrorValidacion("");
    setSelectedRestrictions(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleElegirLibre = () => {
    setModoCondicion("libre");
    setSelectedRestrictions([]);
    setCustomRestriction("");
    setErrorValidacion("");
  };

  const formularioValido = (modoCondicion === "libre" || 
    (modoCondicion === "restringido" && (selectedRestrictions.length > 0 || customRestriction.trim().length > 0))) && aceptaTerminos;

  const comisionIoSono = priceNum * 0.05;
  const totalAPagar = priceNum + comisionIoSono;

  const totalEnPesos = Math.round(totalAPagar * TASA_DOLAR_ARS);

  const handlePagar = async () => {
    if (!formularioValido) {
      setErrorValidacion("⚠️ Paso obligatorio: Debés marcar las pautas deseadas y aceptar los Términos y Condiciones.");
      return;
    }

    if (metodoPago === "mercadopago") {
      setMpModalOpen(true);
      return;
    }

    procesarCreacionCampaña();
  };

  const procesarCreacionCampaña = (mpPaymentId = null) => {
    setCreando(true);

    const activeUser = user || {
      id: "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
      role: "marca",
      name: "Daniel Monaldi",
      email: "danielmonaldi@gmail.com",
      isMaster: true
    };

    const restriccionesFinal = modoCondicion === "libre"
      ? ["Libre elección (Sin condiciones especiales ni pautas restrictivas)"]
      : [
          ...selectedRestrictions,
          ...(customRestriction.trim() ? [`Detalle de la marca: ${customRestriction.trim()}`] : [])
        ];

    const nuevaCampaña = {
      id: "camp_" + Date.now(),
      marca_id: activeUser.id || "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
      marca_nombre: activeUser.name || "Daniel Monaldi",
      influencer_id: inf.id,
      influencer_usuario_id: inf.usuarioId,
      influencer_nombre: inf.name,
      influencer_handle: inf.handle,
      influencer_foto: inf.fotoUrl,
      servicio_nombre: service.name,
      monto: priceNum,
      moneda: "USD",
      monto_ars: totalEnPesos,
      mp_payment_id: mpPaymentId || "MP-RET-" + Math.floor(100000000 + Math.random() * 900000000),
      mp_status: "in_escrow_authorized",
      restricciones: restriccionesFinal,
      estado: "propuesta_pendiente",
      plazo_horas: 72,
      created_at: new Date().toISOString()
    };

    onCampañaCreada(nuevaCampaña);
    setCreando(false);
    setMpModalOpen(false);
    setPagoConfirmado(true);
  };

  const simularPagoMercadoPago = () => {
    setMpProcessing(true);
    setTimeout(() => {
      setMpProcessing(false);
      procesarCreacionCampaña("MP-REAL-" + Date.now());
    }, 1800);
  };

  if (pagoConfirmado) {
    const waText = encodeURIComponent(`¡Hola ${inf.name}! La marca te acaba de contratar para la campaña "${service.name}" en Io Sono con fondos asegurados en custodia Escrow por USD ${totalAPagar.toFixed(2)}. Ingresá a aceptarla y abrir el chat: https://iosonoinfluencer.com.ar`);

    return (
      <div style={{ maxWidth:460, margin:"20px auto" }}>
        <div className="card" style={{ textAlign:"center", padding:"28px 20px" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--purple-bg)", color:"var(--purple-lt)", fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <i className="ti ti-shield-check" />
          </div>
          <div style={{ fontSize:19, fontWeight:700, marginBottom:8 }}>¡Pago retenido en custodia!</div>
          <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6, marginBottom:16 }}>
            Tus <strong>USD {totalAPagar.toFixed(2)}</strong> están protegidos en Io Sono.
            Le enviamos la propuesta y tus pautas a <strong>{inf.name}</strong>.
            Apenas acepte, se habilitará el chat exclusivo para entrega de borradores.
          </div>

          {/* Opciones de Notificación Instantánea */}
          <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"14px", margin:"16px 0", border:"0.5px solid var(--border)", textAlign:"left" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <i className="ti ti-bell-ringing" style={{ color:"var(--purple-lt)" }} />
              <span>Avisar al creador ahora mismo:</span>
            </div>
            <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>
              Podés acelerar el inicio de la producción notificándole directamente por WhatsApp o email:
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <a
                href={`https://api.whatsapp.com/send?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-green btn-full"
                style={{ fontSize:12, padding:"10px", display:"flex", alignItems:"center", justifyContent:"center", gap:6, textDecoration:"none" }}
              >
                <i className="ti ti-brand-whatsapp" style={{ fontSize:16 }} />
                <span>Notificar a {inf.name} por WhatsApp ↗</span>
              </a>

              <button
                type="button"
                className="btn btn-outline btn-full"
                style={{ fontSize:12, padding:"10px", borderColor:"var(--purple)", color:"var(--purple-lt)" }}
                onClick={() => setEmailEnviado(true)}
              >
                <i className="ti ti-mail" style={{ marginRight:4 }} />
                {emailEnviado ? "✓ Notificación por Email enviada con éxito" : "Enviar notificación por Email"}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={() => onNav("campanas")}>
            Ver estado en Mis Campañas ↗
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:460, margin:"0 auto", paddingTop:8 }}>
      <button onClick={() => onNav("buscador")} style={{ background:"transparent", border:"none", color:"var(--purple-lt)", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:5, padding:"8px 0 14px" }}>
        <i className="ti ti-arrow-left" /> Volver al buscador
      </button>

      <div className="card" style={{ marginBottom:12 }}>
        <div className="card-title">Influencer seleccionado</div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <AvatarEl initials={inf.initials} color={inf.color} textColor={inf.textColor} fotoUrl={inf.fotoUrl} size="md" />
          <div>
            <div style={{ fontSize:15, fontWeight:600 }}>{inf.name}</div>
            <div style={{ fontSize:12, color:"var(--purple-lt)" }}>{inf.handle} · {service.name}</div>
          </div>
        </div>
      </div>

      {/* BLOQUE OBLIGATORIO DE PAUTAS O LIBRE ELECCIÓN */}
      <div className="card" style={{ marginBottom:12, border:errorValidacion ? "1px solid var(--red)" : "0.5px solid var(--border)" }}>
        <div className="card-title">
          <span>Pautas y condiciones de la marca</span>
          <span style={{ fontSize:10, color:formularioValido?"var(--green)":"var(--amber)", fontWeight:700 }}>
            {formularioValido ? "✓ COMPLETADO" : "* PASO OBLIGATORIO"}
          </span>
        </div>
        <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14, lineHeight:1.5 }}>
          Antes de enviar la propuesta, debés especificar si tenés cosas que <strong>NO querés que salgan</strong> o si das <strong>Libre elección</strong> al influencer.
        </div>

        {/* Opción destacada: Libre Elección */}
        <div
          onClick={handleElegirLibre}
          style={{
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            padding:"12px 14px",
            background:modoCondicion==="libre" ? "var(--purple-bg)" : "var(--bg2)",
            borderRadius:"var(--radius-sm)",
            border:modoCondicion==="libre" ? "1.5px solid var(--purple)" : "0.5px solid var(--border)",
            cursor:"pointer",
            marginBottom:14,
            transition:"all 0.15s"
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>✨</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:modoCondicion==="libre"?"var(--purple-lt)":"var(--text)" }}>
                Libre elección (Sin condiciones)
              </div>
              <div style={{ fontSize:11, color:"var(--text2)" }}>El influencer tiene 100% de libertad creativa para el formato y palabras.</div>
            </div>
          </div>
          <span style={{ fontSize:16, color:modoCondicion==="libre"?"var(--purple-lt)":"var(--text3)", fontWeight:700 }}>
            {modoCondicion==="libre" ? "✓" : "○"}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ height:0.5, flex:1, background:"var(--border)" }} />
          <span style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase" }}>o marcá qué querés prohibir</span>
          <div style={{ height:0.5, flex:1, background:"var(--border)" }} />
        </div>

        {/* Botones rápidos de cosas prohibidas */}
        <div className="tags-wrap">
          {RESTRICTIONS_PRESET.map(r => {
            const active = selectedRestrictions.includes(r);
            return (
              <span
                key={r}
                className={`tag ${active ? "danger on" : ""}`}
                onClick={() => toggleRestriction(r)}
              >
                {active ? "✓ " : "+ "} {r}
              </span>
            );
          })}
        </div>

        <div className="field" style={{ marginBottom:0 }}>
          <label>Otras cosas que NO querés que salgan (opcional)</label>
          <textarea
            placeholder="Ej: No usar remeras con marcas grandes, no fumar, mostrar el producto al inicio..."
            value={customRestriction}
            onChange={e => {
              setModoCondicion("restringido");
              setErrorValidacion("");
              setCustomRestriction(e.target.value);
            }}
          />
        </div>

        {errorValidacion && (
          <div style={{ marginTop:10, fontSize:12, color:"var(--red)", lineHeight:1.4 }}>
            {errorValidacion}
          </div>
        )}
      </div>

      {/* SELECCIÓN DE MÉTODO DE PAGO CON MERCADO PAGO ESCROW */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-title">
          <span>Método de pago en custodia</span>
          <span style={{ fontSize:10, color:"#009ee3", fontWeight:700 }}>
            <i className="ti ti-brand-cashapp" /> MERCADO PAGO OFICIAL
          </span>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div
            onClick={() => setMetodoPago("mercadopago")}
            style={{
              padding:"12px 14px",
              borderRadius:"var(--radius-sm)",
              border: metodoPago === "mercadopago" ? "1.5px solid #009ee3" : "1px solid var(--border)",
              background: metodoPago === "mercadopago" ? "rgba(0,158,227,0.08)" : "var(--bg2)",
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              transition:"all 0.15s"
            }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:"#009ee3", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700 }}>
                MP
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Mercado Pago (Checkout Pro Oficial)</div>
                <div style={{ fontSize:11, color:"var(--text2)" }}>Dinero en cuenta, Débito, Crédito en cuotas o Transferencia</div>
              </div>
            </div>
            <span style={{ fontSize:13, color: metodoPago === "mercadopago" ? "#009ee3" : "var(--text3)" }}>
              {metodoPago === "mercadopago" ? "● Seleccionado" : "○"}
            </span>
          </div>

          <div
            onClick={() => setMetodoPago("saldo")}
            style={{
              padding:"12px 14px",
              borderRadius:"var(--radius-sm)",
              border: metodoPago === "saldo" ? "1.5px solid var(--purple)" : "1px solid var(--border)",
              background: metodoPago === "saldo" ? "var(--purple-bg)" : "var(--bg2)",
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              transition:"all 0.15s"
            }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:"var(--purple)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                <i className="ti ti-wallet" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Saldo Prepago en Io Sono</div>
                <div style={{ fontSize:11, color:"var(--text2)" }}>Disponible: USD 500.00</div>
              </div>
            </div>
            <span style={{ fontSize:13, color: metodoPago === "saldo" ? "var(--purple-lt)" : "var(--text3)" }}>
              {metodoPago === "saldo" ? "● Seleccionado" : "○"}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-title">Resumen de pago seguro (Escrow)</div>
        <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text2)", marginBottom:8 }}>
            <span>Servicio ({service.name})</span>
            <span style={{ color:"var(--text)" }}>USD {priceNum.toFixed(2)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text2)", marginBottom:8 }}>
            <span>Custodia Io Sono (5%)</span>
            <span style={{ color:"var(--text)" }}>USD {comisionIoSono.toFixed(2)}</span>
          </div>
          <div style={{ height:"0.5px", background:"var(--border)", margin:"8px 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700 }}>
            <span>Total retenido en custodia</span>
            <span style={{ color:"var(--green)" }}>USD {totalAPagar.toFixed(2)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#009ee3", marginTop:4, fontWeight:600 }}>
            <span>Equivalente en pesos (TC 1 USD = $1.400)</span>
            <span>≈ ${totalEnPesos.toLocaleString("es-AR")} ARS</span>
          </div>
        </div>
        <div className="escrow-note">
          <i className="ti ti-shield-check" />
          <span>El dinero queda retenido bajo custodia de Io Sono y Mercado Pago. El influencer cobra recién cuando apruebes el borrador o a las 36hs sin quejas.</span>
        </div>
      </div>

      {/* Aceptación obligatoria de Términos y Condiciones */}
      <div style={{ margin:"14px 0", background:"var(--bg2)", padding:"12px 14px", borderRadius:"var(--radius-sm)", border:"0.5px solid var(--border)", display:"flex", alignItems:"flex-start", gap:10 }}>
        <input
          type="checkbox"
          id="terminosCheckbox"
          checked={aceptaTerminos}
          onChange={e => setAceptaTerminos(e.target.checked)}
          style={{ marginTop:2, accentColor:"var(--purple)", width:16, height:16, cursor:"pointer" }}
        />
        <label htmlFor="terminosCheckbox" style={{ fontSize:11, color:"var(--text2)", lineHeight:1.5, cursor:"pointer" }}>
          Declaro conocer y aceptar los{" "}
          <span
            style={{ color:"var(--purple-lt)", textDecoration:"underline", fontWeight:600 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenTerminos?.(); }}
          >
            Términos y Condiciones Legales & Garantía Escrow (Mercado Pago)
          </span>{" "}
          de Io Sono, con retención preventiva de fondos y plazo de verificación de 36 horas.
        </label>
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={handlePagar}
        disabled={creando || !formularioValido}
        style={{
          opacity:!formularioValido?0.45:1,
          background: metodoPago === "mercadopago" ? "linear-gradient(135deg, #009ee3, #007eb5)" : "var(--purple)",
          boxShadow: metodoPago === "mercadopago" ? "0 4px 16px rgba(0,158,227,0.3)" : "none"
        }}
      >
        {creando ? "Procesando custodia..." : !formularioValido ? "⚠️ Completá pautas y aceptá términos para continuar" : metodoPago === "mercadopago" ? `Pagar $${totalEnPesos.toLocaleString("es-AR")} ARS con Mercado Pago ↗` : `Confirmar y pagar USD ${totalAPagar.toFixed(2)} ↗`}
      </button>

      {/* MODAL OFICIAL DE CHECKOUT PRO MERCADO PAGO CON SPLIT Y RETENCIÓN */}
      {mpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth:460, border:"1px solid #009ee3", padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, borderBottom:"1px solid var(--border)", paddingBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:"#009ee3", color:"#fff", padding:"4px 8px", borderRadius:6, fontWeight:800, fontSize:12 }}>
                  MERCADO PAGO
                </span>
                <span style={{ fontSize:13, fontWeight:600 }}>Checkout Pro Oficial</span>
              </div>
              <button
                onClick={() => setMpModalOpen(false)}
                style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:18, cursor:"pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign:"center", marginBottom:18 }}>
              <div style={{ fontSize:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                Retención de Pago en Custodia (Escrow)
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:"var(--text)", marginTop:4 }}>
                ${totalEnPesos.toLocaleString("es-AR")} <span style={{ fontSize:14, color:"var(--text2)", fontWeight:400 }}>ARS</span>
              </div>
              <div style={{ fontSize:12, color:"var(--purple-lt)", marginTop:2 }}>
                Equivalente a USD {totalAPagar.toFixed(2)} · Campaña "{service.name}"
              </div>
            </div>

            {/* Desglose del Split Inteligente */}
            <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"12px 14px", marginBottom:16, border:"0.5px solid var(--border)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", marginBottom:8 }}>
                🛡️ División y Custodia de Fondos (Split Oficial):
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                <span>Honorarios influencer ({inf.name}):</span>
                <span style={{ fontWeight:600 }}>${Math.round(priceNum * TASA_DOLAR_ARS).toLocaleString("es-AR")} ARS</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                <span>Comisión de plataforma Io Sono (Daniel Monaldi):</span>
                <span style={{ fontWeight:600, color:"var(--purple-lt)" }}>${Math.round(comisionIoSono * TASA_DOLAR_ARS).toLocaleString("es-AR")} ARS</span>
              </div>
              <div style={{ height:"0.5px", background:"var(--border)", margin:"6px 0" }} />
              <div style={{ fontSize:11, color:"var(--green)", lineHeight:1.4 }}>
                ✓ Los fondos quedan <strong>congelados en Mercado Pago</strong> hasta que apruebes el borrador o transcurran 36hs. El influencer no puede retirar el dinero antes.
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button
                className="btn btn-full"
                onClick={simularPagoMercadoPago}
                disabled={mpProcessing}
                style={{ background:"#009ee3", color:"#fff", fontWeight:700, fontSize:14, padding:"13px" }}
              >
                {mpProcessing ? (
                  <span><i className="ti ti-loader" /> Conectando con Mercado Pago...</span>
                ) : (
                  <span>Pagar y autorizar custodia con Mercado Pago ↗</span>
                )}
              </button>

              <div style={{ fontSize:11, color:"var(--text3)", textAlign:"center" }}>
                🔒 Operación procesada de forma segura mediante la cuenta oficial de Mercado Pago de Io Sono.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GESTIÓN DE CAMPAÑAS Y CHAT INTEGRADO ─────────────────────────────────────
function CampañasView({ user, campañas, onUpdateCampaña, onOpenRating, onNav, influencers, onSwitchRole }) {
  const [selectedCampId, setSelectedCampId] = useState(campañas[0]?.id || null);
  const [draftNote, setDraftNote] = useState("");
  const [publishLink, setPublishLink] = useState("");
  const [chatText, setChatText] = useState("");
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modComment, setModComment] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const isMarca = user?.role === "marca";
  const camp = campañas.find(c => c.id === (selectedCampId || campañas[0]?.id)) || campañas[0] || null;

  const updateEstado = (nuevoEstado, extraData = {}) => {
    if (!camp) return;
    const updated = { ...camp, estado: nuevoEstado, ...extraData };
    onUpdateCampaña(updated);
  };

  return (
    <div style={{ paddingTop:8 }}>
      {/* ─── PESTAÑAS PRINCIPALES DE ROL: MARCA VS INFLUENCER ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        background: "rgba(23,21,32,0.95)",
        padding: "6px",
        borderRadius: "14px",
        border: "1.5px solid var(--border)",
        marginBottom: "14px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)"
      }}>
        <button
          type="button"
          onClick={() => onSwitchRole?.("marca")}
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            border: isMarca ? "1.5px solid rgba(139,92,246,0.6)" : "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: isMarca ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "transparent",
            color: isMarca ? "#fff" : "var(--text2)",
            boxShadow: isMarca ? "0 4px 16px rgba(124,58,237,0.5)" : "none",
            transition: "all 0.2s"
          }}
        >
          <i className="ti ti-building" style={{ fontSize: 18 }} />
          <span>🏢 Pestaña MARCA</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchRole?.("influencer")}
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            border: !isMarca ? "1.5px solid rgba(34,197,94,0.6)" : "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: !isMarca ? "linear-gradient(135deg, #10b981, #047857)" : "transparent",
            color: !isMarca ? "#fff" : "var(--text2)",
            boxShadow: !isMarca ? "0 4px 16px rgba(16,185,129,0.5)" : "none",
            transition: "all 0.2s"
          }}
        >
          <i className="ti ti-sparkles" style={{ fontSize: 18 }} />
          <span>✨ Pestaña INFLUENCER</span>
        </button>
      </div>

      {/* Cartel informativo de en qué pestaña estás */}
      <div style={{
        background: isMarca ? "rgba(124,58,237,0.15)" : "rgba(16,185,129,0.15)",
        border: `1.5px solid ${isMarca ? "rgba(124,58,237,0.4)" : "rgba(16,185,129,0.4)"}`,
        borderRadius: "var(--radius-sm)",
        padding: "10px 14px",
        marginBottom: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontSize: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className={`ti ${isMarca ? "ti-building" : "ti-user-check"}`} style={{ color: isMarca ? "var(--purple-lt)" : "var(--green)", fontSize: 20 }} />
          <span>
            {isMarca ? (
              <>Estás en la <strong>Pestaña MARCA</strong>: Revisá el video HD entregado, solicitá ajustes o aprobá para liberar el pago.</>
            ) : (
              <>Estás en la <strong>Pestaña INFLUENCER (Daniel Monaldi)</strong>: Aceptá propuestas con dinero retenido en Escrow y subí borradores.</>
            )}
          </span>
        </div>
        <span className={`pill ${isMarca ? "pill-purple" : "pill-green"}`} style={{ fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {isMarca ? "Rol: Marca" : "Rol: Influencer"}
        </span>
      </div>

      {!camp ? (
        <div className="card" style={{ textAlign:"center", padding:"40px 16px", marginTop:10 }}>
          <i className="ti ti-briefcase" style={{ fontSize:36, color:"var(--purple-lt)", display:"block", marginBottom:10 }} />
          <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>No tenés campañas activas en este rol</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginBottom:18 }}>
            {isMarca ? "Buscá un influencer para iniciar tu primera contratación segura." : "Tus propuestas de marcas aparecerán acá."}
          </div>
          {isMarca && (
            <button className="btn btn-primary btn-sm" onClick={() => onNav("buscador")}>
              <i className="ti ti-search" style={{ marginRight:4 }} /> Explorar influencers
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Selector de Campaña si tiene varias */}
          {campañas.length > 1 && (
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:10, marginBottom:10 }}>
              {campañas.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampId(c.id)}
                  className={`pill ${camp?.id===c.id?"pill-purple":"pill-gray"}`}
                  style={{ cursor:"pointer", whiteSpace:"nowrap" }}
                >
                  {isMarca ? c.influencer_nombre : c.marca_nombre} · {c.servicio_nombre}
                </button>
              ))}
            </div>
          )}

      {/* Tarjeta Fija de Reglas y Resumen de Campaña */}
      <div className="card" style={{ marginBottom:10, borderLeft:"4px solid var(--purple)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>
              {camp.servicio_nombre} <span style={{ fontSize:12, color:"var(--purple-lt)", fontWeight:400 }}>· USD {camp.monto} en custodia</span>
            </div>
            <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
              {isMarca ? `Influencer: ${camp.influencer_nombre} (${camp.influencer_handle})` : `Marca contratante: ${camp.marca_nombre}`}
            </div>
          </div>
          <span className={`pill ${
            camp.estado==="propuesta_pendiente" ? "pill-amber" :
            camp.estado==="en_produccion" ? "pill-purple" :
            camp.estado==="borrador_enviado" ? "pill-purple" :
            camp.estado==="cancelacion_en_revision" ? "pill-amber" :
            camp.estado==="cancelado_50" ? "pill-gray" :
            camp.estado==="cancelado_fraude" ? "pill-red" :
            camp.estado==="borrador_aprobado" ? "pill-green" :
            camp.estado==="publicado_revision" ? "pill-amber" :
            camp.estado==="finalizado" ? "pill-green" :
            camp.estado==="rechazado" ? "pill-red" :
            camp.estado==="disputa" ? "pill-red" :
            camp.estado==="reembolso_total" ? "pill-red" : "pill-gray"
          }`}>
            {camp.estado==="propuesta_pendiente" && "⏳ Esperando Aceptación"}
            {camp.estado==="en_produccion" && "🎬 En Producción"}
            {camp.estado==="borrador_enviado" && "👀 Borrador en Revisión"}
            {camp.estado==="cancelacion_en_revision" && "🛡️ Cancelación en Auditoría"}
            {camp.estado==="cancelado_50" && "🛑 Cancelado (50% cubierto)"}
            {camp.estado==="cancelado_fraude" && "🚫 Cancelado por Fraude"}
            {camp.estado==="borrador_aprobado" && "🎉 Borrador Aprobado"}
            {camp.estado==="publicado_revision" && "⏱️ Reloj de 36hs activo"}
            {camp.estado==="finalizado" && "✓ Finalizado y Pagado"}
            {camp.estado==="rechazado" && "❌ Propuesta Declinada"}
            {camp.estado==="disputa" && "⚠️ Reclamo en Mediación"}
            {camp.estado==="reembolso_total" && "💰 Reembolsado 100%"}
          </span>
        </div>

        {/* Cosas prohibidas acordadas */}
        <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"10px 12px", marginTop:8 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
            Pautas y cosas prohibidas acordadas:
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {camp.restricciones?.map((r, i) => (
              <span key={i} style={{ fontSize:11, color:r.includes("🚫")?"var(--red)":"var(--purple-lt)", background:"var(--bg1)", padding:"3px 8px", borderRadius:4, border:"0.5px solid var(--border)" }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ESTADO 1: PROPUESTA PENDIENTE DE ACEPTACIÓN ─── */}
      {camp.estado === "propuesta_pendiente" && (
        <div className="card" style={{ textAlign:"center", padding:"24px 16px" }}>
          {!isMarca ? (
            <>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>¡Tenés una nueva propuesta de contratación!</div>
              <div style={{ fontSize:13, color:"var(--text2)", marginBottom:16 }}>
                <strong>{camp.marca_nombre}</strong> pagó <strong>USD {camp.monto}</strong> que ya están retenidos en custodia segura de Io Sono.
                Si aceptás los términos y pautas, se habilitará el chat para que entregues el borrador.
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button className="btn btn-green" onClick={() => updateEstado("en_produccion")}>
                  Aceptar propuesta y abrir chat ✓
                </button>
                <button className="btn btn-outline" onClick={() => updateEstado("rechazado")}>
                  Declinar
                </button>
              </div>
            </>
          ) : (
            <>
              <i className="ti ti-hourglass" style={{ fontSize:32, color:"var(--amber)", display:"block", marginBottom:8 }} />
              <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>Esperando aceptación del influencer</div>
              <div style={{ fontSize:13, color:"var(--text2)" }}>
                Le notificamos a <strong>{camp.influencer_nombre}</strong>. Tiene hasta 24hs para aceptar.
                Apenas acepte se habilitará el chat exclusivo para entrega de borradores.
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ESTADO 2 Y 3: EN PRODUCCIÓN / BORRADOR ENVIADO (CON CHAT ACOTADO) ─── */}
      {(camp.estado === "en_produccion" || camp.estado === "borrador_enviado") && (
        <div>
          {/* En producción: influencer sube el video real o link / marca ve aviso */}
          {!isMarca && camp.estado === "en_produccion" && (
            <div>
              {camp.ultimo_ajuste_pedido && (
                <div className="rules-banner" style={{ background:"var(--amber-bg)", border:"1px solid var(--amber-border)", marginBottom:12 }}>
                  ✏️ <strong>Ajuste solicitado por la marca:</strong> "{camp.ultimo_ajuste_pedido}". Realizá el cambio y volvé a subir el video acá abajo.
                </div>
              )}
              <DraftMediaUploader
                camp={camp}
                onDraftUploaded={(draftData) => updateEstado("borrador_enviado", draftData)}
              />
            </div>
          )}

          {isMarca && camp.estado === "en_produccion" && (
            <div className="rules-banner" style={{ background:"var(--purple-bg)", marginBottom:12 }}>
              🎬 <strong>En producción:</strong> {camp.influencer_nombre} está grabando y editando el contenido respetando tus pautas pactadas. En cuanto cargue el borrador vas a poder reproducirlo acá en HD para darle el aprobado final.
            </div>
          )}

          {/* Borrador enviado: reproductor de video HD y botones de decisión para la marca */}
          {camp.estado === "borrador_enviado" && (
            <div>
              <DraftVideoPlayer
                videoUrl={camp.borrador_video_url}
                externalUrl={camp.borrador_url}
                title={`Borrador entregado por ${camp.influencer_nombre}`}
                nota={camp.borrador_nota}
              />

              {isMarca ? (
                <div className="action-box" style={{ border:"1px solid var(--purple)", marginTop:12 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--purple-lt)", marginBottom:4 }}>
                    👀 Revisá el video arriba y tomá una decisión:
                  </div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14 }}>
                    Verificá que cumpla con las pautas pactadas. Tenés 3 opciones claras:
                  </div>
                  <div className="grid-3">
                    <button
                      className="btn btn-green btn-sm"
                      onClick={() => updateEstado("borrador_aprobado")}
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setModModalOpen(true)}
                    >
                      ✏️ Ajuste edición
                    </button>
                    <button
                      className="btn btn-red btn-sm"
                      onClick={() => setCancelModalOpen(true)}
                    >
                      🛑 Cancelar (50%)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rules-banner" style={{ background:"var(--purple-bg)", marginTop:12 }}>
                  ⏳ <strong>Borrador en revisión:</strong> La marca está reproduciendo tu video para darte el aprobado final antes de que lo publiques en tus redes.
                </div>
              )}
            </div>
          )}

          {/* Modal Ajuste de Edición */}
          {modModalOpen && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>Solicitar ajuste de edición puntual</div>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14, lineHeight:1.5 }}>
                  <strong>Regla de Io Sono:</strong> Solo se admiten recortes de planos, silenciar una palabra o cambiar stickers/textos. No se admiten cambios de guión ni regrabaciones totales.
                </div>
                <div className="field">
                  <textarea
                    placeholder="Detallá el recorte exacto (ej: Sacar los 2 segundos del final donde se ve la gaseosa)..."
                    value={modComment}
                    onChange={e => setModComment(e.target.value)}
                  />
                </div>
                <div className="grid-2">
                  <button className="btn btn-primary" onClick={() => {
                    updateEstado("en_produccion", { ultimo_ajuste_pedido: modComment });
                    setModModalOpen(false);
                  }}>
                    Enviar ajuste al influencer ↗
                  </button>
                  <button className="btn btn-outline" onClick={() => setModModalOpen(false)}>Volver</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Cancelar con Auditoría Antifraude */}
          {cancelModalOpen && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ fontSize:16, fontWeight:600, color:"var(--red)", marginBottom:6 }}>
                  🛡️ Solicitar cancelación de borrador (Antifraude)
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14, lineHeight:1.5 }}>
                  Para evitar estafas y abusos, toda cancelación pasa por <strong>auditoría del equipo de Io Sono</strong>.
                  <br /><br />
                  Si el trabajo fue de buena fe pero decidís no utilizarlo, el influencer percibe el 50% por la jornada de filmación y se te reintegra el 50%. Si el borrador fue fraudulento o no respeta las pautas básicas, se te reembolsa el 100%.
                </div>
                <div className="field">
                  <label>Motivo obligatorio de cancelación:</label>
                  <textarea
                    placeholder="Contanos detalladamente por qué solicitás cancelar el contenido..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                </div>
                <div className="grid-2">
                  <button
                    className="btn btn-red"
                    disabled={!cancelReason.trim()}
                    onClick={() => {
                      updateEstado("cancelacion_en_revision", {
                        motivo_cancelacion: cancelReason,
                        fecha_cancelacion_solicitada: new Date().toISOString(),
                        asignado_a: "Daniel Monaldi"
                      });
                      setCancelModalOpen(false);
                    }}
                  >
                    Enviar a revisión por Io Sono ↗
                  </button>
                  <button className="btn btn-outline" onClick={() => setCancelModalOpen(false)}>Volver atrás</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ESTADO 4: BORRADOR APROBADO -> PUBLICAR Y PEGAR LINK ─── */}
      {camp.estado === "borrador_aprobado" && (
        <div className="action-box" style={{ background:"var(--green-bg)", border:"1px solid var(--green-border)" }}>
          {!isMarca ? (
            <>
              <div style={{ fontSize:15, fontWeight:600, color:"var(--green)", marginBottom:4 }}>
                🎉 ¡Borrador aprobado por la marca! Ya podés publicar
              </div>
              <div style={{ fontSize:12, color:"var(--text2)", marginBottom:12 }}>
                Subí el contenido a tu Instagram y pegá acá el link para activar el reloj de 36 horas y cobrar tu dinero.
              </div>
              <div className="field">
                <input
                  placeholder="https://www.instagram.com/reel/..."
                  value={publishLink}
                  onChange={e => setPublishLink(e.target.value)}
                />
              </div>
              <button
                className="btn btn-green btn-full"
                disabled={!publishLink.trim()}
                onClick={() => updateEstado("publicado_revision", { publicado_link: publishLink, publicado_at: Date.now() })}
              >
                Listo, ya publiqué en Instagram 🚀
              </button>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--green)" }}>Aprobaste el borrador</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:4 }}>
                {camp.influencer_nombre} está subiendo el contenido a Instagram. Apenas pegue el link se activará tu plazo de 36 horas.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ESTADO 5: PUBLICADO Y RELOJ DE 36 HORAS ─── */}
      {camp.estado === "publicado_revision" && (
        <div className="countdown-card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Cuenta regresiva de verificación</span>
            <span className="pill pill-green">Publicado en Instagram</span>
          </div>
          <CountdownTimerReal
            publicadoAt={camp.publicado_at}
            onExpire={() => updateEstado("finalizado", { auto_liberado: true })}
            onSimularExpiracion={() => {
              updateEstado("finalizado", { auto_liberado: true });
              if (isMarca) onOpenRating(camp);
            }}
          />

          <div style={{ background:"var(--bg)", borderRadius:"var(--radius-sm)", padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:12, textOverflow:"ellipsis", overflow:"hidden", whiteSpace:"nowrap", maxWidth:"280px" }}>
              Link: <a href={camp.publicado_link || "https://instagram.com"} target="_blank" rel="noreferrer" style={{ color:"var(--purple-lt)" }}>{camp.publicado_link || "https://instagram.com/..."}</a>
            </div>
            <a href={camp.publicado_link || "https://instagram.com"} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
              Abrir link ↗
            </a>
          </div>

          {isMarca ? (
            <div>
              <div style={{ fontSize:12, color:"var(--text2)", marginBottom:10 }}>
                Si confirmás que está todo en orden o si pasan las 36 horas sin reclamo, el pago se liberará automáticamente al influencer.
              </div>
              <div className="grid-2">
                <button
                  className="btn btn-green"
                  onClick={() => {
                    updateEstado("finalizado", { auto_liberado: false });
                    onOpenRating(camp);
                  }}
                >
                  ✓ Satisfecho (Liberar pago y calificar)
                </button>
                <button
                  className="btn btn-red"
                  onClick={() => setDisputeModalOpen(true)}
                >
                  ⚠️ No se cumplió lo acordado
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5 }}>
              Tu pago de <strong>USD {camp.monto}</strong> se liberará automáticamente al terminar las 36hs o cuando la marca presione "Satisfecho".
            </div>
          )}

          {/* Modal Disputa con Daniel (Admin) */}
          {disputeModalOpen && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ fontSize:16, fontWeight:600, color:"var(--red)", marginBottom:6 }}>
                  Abrir reclamo: No se cumplió lo acordado
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14, lineHeight:1.5 }}>
                  El pago queda <strong>inmovilizado de inmediato</strong>. Este reporte le llega a Daniel (Administrador de Io Sono) para revisar las restricciones acordadas frente a la publicación real y mediar.
                </div>
                <div className="field">
                  <textarea
                    placeholder="Contanos qué restricción o condición no respetó el influencer..."
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                  />
                </div>
                <div className="grid-2">
                  <button className="btn btn-red" onClick={() => {
                    updateEstado("disputa", { motivo_disputa: disputeReason });
                    setDisputeModalOpen(false);
                  }}>
                    Enviar reclamo a Mediación ↗
                  </button>
                  <button className="btn btn-outline" onClick={() => setDisputeModalOpen(false)}>Volver</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ESTADO 6: FINALIZADO Y CALIFICADO ─── */}
      {camp.estado === "finalizado" && (
        <div className="card" style={{ background:"var(--green-bg)", border:"1px solid var(--green-border)", padding:"22px 18px", marginBottom:14 }}>
          <div style={{ textAlign:"center", marginBottom:14 }}>
            <i className="ti ti-rosette-discount-check" style={{ fontSize:40, color:"var(--green)", display:"block", marginBottom:6 }} />
            <div style={{ fontSize:17, fontWeight:700, color:"var(--green)" }}>¡Campaña finalizada y Pago Liberado!</div>
            <div style={{ fontSize:13, color:"var(--text2)", marginTop:4 }}>
              {isMarca ? (
                <>El pago de <strong>USD {camp.monto}</strong> fue liberado al influencer <strong>{camp.influencer_nombre}</strong>.</>
              ) : (
                <>¡Cobraste <strong>USD {camp.monto}</strong>! Los fondos fueron acreditados a tu saldo disponible.</>
              )}
            </div>
          </div>

          {/* Resumen de la reseña si ya fue calificado */}
          {camp.resena ? (
            <div style={{ background:"var(--bg)", borderRadius:"var(--radius-sm)", padding:"12px 14px", border:"0.5px solid var(--border)", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"var(--text2)", textTransform:"uppercase" }}>Calificación registrada:</span>
                <span className="pill pill-green" style={{ fontSize:11, fontWeight:700 }}>
                  ⭐ {camp.resena.puntaje_trabajo}/10 · Satisfacción {camp.resena.satisfaccion}/10
                </span>
              </div>
              <div style={{ fontSize:12, color:"var(--text2)", marginBottom:4 }}>
                <strong>¿Cambiarías algo?:</strong> {camp.resena.cambiaria_algo ? `Sí (${camp.resena.detalle_cambio})` : "No, quedó perfecto ✓"}
              </div>
              {camp.resena.comentario && (
                <div style={{ fontSize:12, fontStyle:"italic", color:"var(--text)", borderLeft:"2px solid var(--purple)", paddingLeft:8, marginTop:6 }}>
                  "{camp.resena.comentario}"
                </div>
              )}
            </div>
          ) : (
            isMarca && (
              <div style={{ textAlign:"center", marginBottom:14 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onOpenRating(camp)}
                  style={{ borderColor:"var(--green)", color:"var(--green)", background:"var(--bg)" }}
                >
                  ⭐ Dejar o editar calificación pública (1 al 10)
                </button>
              </div>
            )
          )}

          {/* Acciones finales */}
          <div className="grid-2">
            {isMarca ? (
              <button
                className="btn btn-primary"
                onClick={() => onNav("buscador")}
              >
                <i className="ti ti-search" style={{ marginRight:4 }} /> Contratar otra acción
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => onNav("editor_perfil")}
              >
                <i className="ti ti-wallet" style={{ marginRight:4 }} /> Ver mis cobros y balance
              </button>
            )}
            <button
              className="btn btn-outline"
              onClick={() => onNav(isMarca ? "login" : "profile", isMarca ? null : (influencers?.find(inf => inf.id === camp.influencer_id) || influencers?.[0]))}
            >
              <i className="ti ti-user" style={{ marginRight:4 }} /> {isMarca ? "Mi cuenta de marca" : "Ver mi perfil público"}
            </button>
          </div>
        </div>
      )}

      {/* ─── ESTADO: CANCELACIÓN EN REVISIÓN ANTIFRAUDE ─── */}
      {camp.estado === "cancelacion_en_revision" && (
        <div className="card" style={{ background:"var(--amber-bg)", border:"1px solid var(--amber-border)", padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <i className="ti ti-shield-check" style={{ fontSize:26, color:"var(--amber)" }} />
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--amber)" }}>Cancelación en auditoría antifraude</div>
              <div style={{ fontSize:11, color:"var(--text2)" }}>Caso asignado a: <strong>{camp.asignado_a || "Daniel Monaldi"}</strong></div>
            </div>
          </div>
          <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5, marginBottom:12 }}>
            La marca solicitó cancelar este trabajo indicando: <em>"{camp.motivo_cancelacion}"</em>.
          </div>
          {(camp.borrador_video_url || camp.borrador_url) && (
            <div style={{ marginBottom: 12 }}>
              <DraftVideoPlayer
                videoUrl={camp.borrador_video_url}
                externalUrl={camp.borrador_url}
                title="Borrador en auditoría"
                nota={camp.borrador_nota}
              />
            </div>
          )}
          <div style={{ background:"var(--bg)", borderRadius:"var(--radius-sm)", padding:"10px 14px", border:"0.5px solid var(--border)", fontSize:12, color:"var(--text2)", lineHeight:1.5 }}>
            🛡️ <strong>Garantía Io Sono:</strong> Los <strong>USD {camp.monto}</strong> permanecen inmovilizados en custodia. El equipo de mediación está evaluando si el borrador es legítimo para liberar el 50% de compensación al influencer o si corresponde el 100% de devolución a la marca en caso de trabajo fraudulento.
          </div>
        </div>
      )}

      {/* ─── ESTADO: CANCELADO CON 50% DE COBERTURA ─── */}
      {camp.estado === "cancelado_50" && (
        <div className="card" style={{ background:"var(--bg2)", border:"1px solid var(--border)", padding:"22px 18px", textAlign:"center" }}>
          <i className="ti ti-scale" style={{ fontSize:36, color:"var(--purple-lt)", display:"block", marginBottom:8 }} />
          <div style={{ fontSize:16, fontWeight:700 }}>Cancelación ejecutada (50% de cobertura)</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginTop:6, lineHeight:1.5 }}>
            {camp.resolucion || "Se reconocieron los costos de filmación al influencer y se reintegró el 50% a la marca."}
          </div>
          <div style={{ marginTop:14, display:"flex", justifyContent:"center", gap:12 }}>
            <span className="pill pill-green">USD {(camp.monto*0.5).toFixed(2)} al influencer</span>
            <span className="pill pill-purple">USD {(camp.monto*0.5).toFixed(2)} reintegrados a la marca</span>
          </div>
        </div>
      )}

      {/* ─── ESTADO: CANCELADO POR FRAUDE / INCUMPLIMIENTO ─── */}
      {camp.estado === "cancelado_fraude" && (
        <div className="card" style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", padding:"22px 18px", textAlign:"center" }}>
          <i className="ti ti-ban" style={{ fontSize:36, color:"var(--red)", display:"block", marginBottom:8 }} />
          <div style={{ fontSize:16, fontWeight:700, color:"var(--red)" }}>Cancelado por incumplimiento / material inválido</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginTop:6, lineHeight:1.5 }}>
            {camp.resolucion || "El equipo de Io Sono constató que el borrador no cumplió con las directivas mínimas acordadas."}
          </div>
          <div style={{ marginTop:14 }}>
            <span className="pill pill-green" style={{ fontSize:12 }}>✓ Reembolso del 100% (USD {camp.monto}) a la marca</span>
          </div>
        </div>
      )}

      {/* ─── ESTADO: REEMBOLSO TOTAL EN MEDIACIÓN ─── */}
      {camp.estado === "reembolso_total" && (
        <div className="card" style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", padding:"22px 18px", textAlign:"center" }}>
          <i className="ti ti-rotate-rectangle" style={{ fontSize:36, color:"var(--red)", display:"block", marginBottom:8 }} />
          <div style={{ fontSize:16, fontWeight:700, color:"var(--red)" }}>Reclamo procedente: Reembolso 100%</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginTop:6, lineHeight:1.5 }}>
            {camp.resolucion || "La auditoría determinó incumplimiento de las cláusulas obligatorias pactadas."}
          </div>
          <div style={{ marginTop:14 }}>
            <span className="pill pill-green" style={{ fontSize:12 }}>✓ USD {camp.monto} reintegrados a la marca</span>
          </div>
        </div>
      )}

      {/* ─── ESTADO: DISPUTA DE 36HS ABIERTA ─── */}
      {camp.estado === "disputa" && (
        <div className="card" style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize:26, color:"var(--red)" }} />
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--red)" }}>⚠️ Reclamo en mediación por Io Sono</div>
              <div style={{ fontSize:11, color:"var(--text2)" }}>Caso asignado a: <strong>{camp.asignado_a || "Daniel Monaldi"}</strong></div>
            </div>
          </div>
          <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5, marginBottom:10 }}>
            {camp.motivo_disputa ? `Motivo denunciado: "${camp.motivo_disputa}"` : "La marca indicó que no se respetaron las pautas obligatorias acordadas."}
          </div>
          <div style={{ fontSize:12, color:"var(--text2)", background:"var(--bg)", padding:"10px 12px", borderRadius:"var(--radius-sm)", border:"0.5px solid var(--border)", lineHeight:1.5 }}>
            El pago de <strong>USD {camp.monto}</strong> está congelado preventivamente. Daniel y el equipo de mediación están auditando el enlace público frente a las restricciones pactadas.
          </div>
        </div>
      )}

      {/* ─── ESTADO: PROPUESTA DECLINADA / RECHAZADA ─── */}
      {camp.estado === "rechazado" && (
        <div className="card" style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", padding:"24px 18px", textAlign:"center", marginBottom:14 }}>
          <i className="ti ti-circle-x" style={{ fontSize:40, color:"var(--red)", display:"block", marginBottom:8 }} />
          <div style={{ fontSize:17, fontWeight:700, color:"var(--red)" }}>Propuesta Declinada</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginTop:6, lineHeight:1.5 }}>
            {isMarca ? (
              <>
                <strong>{camp.influencer_nombre}</strong> declinó la propuesta de trabajo para <strong>{camp.servicio_nombre}</strong>.
                <br />
                Los <strong>USD {camp.monto}</strong> retenidos en custodia preventiva fueron liberados y reembolsados a tu cuenta al 100%.
              </>
            ) : (
              <>
                Declinaste la propuesta de <strong>{camp.marca_nombre}</strong>.
                <br />
                La campaña fue cerrada sin penalizaciones y los fondos fueron reintegrados automáticamente a la marca.
              </>
            )}
          </div>
          <div style={{ marginTop:14 }}>
            <span className="pill pill-green" style={{ fontSize:12 }}>
              ✓ Reembolso del 100% (USD {camp.monto}) completado
            </span>
          </div>
          {isMarca && (
            <div style={{ marginTop:16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => onNav("buscador")}>
                <i className="ti ti-search" style={{ marginRight:4 }} /> Buscar otros creadores en el catálogo
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── CHAT INCORPORADO (Solo si no está en propuesta_pendiente ni rechazado) ─── */}
      {camp.estado !== "propuesta_pendiente" && camp.estado !== "rechazado" && (
        <div className="chat-box" style={{ height:"380px" }}>
          <div className="chat-header">
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <AvatarEl initials={isMarca ? camp.influencer_nombre?.slice(0,2).toUpperCase() : camp.marca_nombre?.slice(0,2).toUpperCase()} fotoUrl={isMarca ? camp.influencer_foto : null} size="sm" />
              <div style={{ fontSize:13, fontWeight:600 }}>
                Chat de Campaña con {isMarca ? camp.influencer_nombre : camp.marca_nombre}
              </div>
            </div>
            <span className="pill pill-green" style={{ fontSize:10 }}>● Canal oficial</span>
          </div>

          <div className="chat-messages">
            <div className="msg-row received">
              <div className="msg-bubble received">
                Hola! Campaña iniciada para <strong>{camp.servicio_nombre}</strong>. Por este canal se coordina la entrega del borrador y las revisiones oficiales.
                <div className="msg-time">Sistema Io Sono</div>
              </div>
            </div>
            {camp.borrador_url && (
              <div className="msg-row received">
                <div className="msg-bubble received" style={{ border:"1px solid var(--purple)" }}>
                  🎬 <strong>Borrador cargado:</strong> {camp.borrador_url}
                  <div className="msg-time">Esperando tu aprobación</div>
                </div>
              </div>
            )}
            {camp.ultimo_ajuste_pedido && (
              <div className="msg-row sent">
                <div className="msg-bubble sent">
                  ✏️ <strong>Ajuste solicitado por la marca:</strong> {camp.ultimo_ajuste_pedido}
                </div>
              </div>
            )}

            {/* Mensajes interactivos y comunicados oficiales de mediación */}
            {(camp.mensajes || []).map(m => (
              m.sender === "mediacion" ? (
                <div key={m.id} style={{
                  background: "linear-gradient(135deg, #261642, #180d2c)",
                  border: "1px solid var(--purple)",
                  borderRadius: "var(--radius)",
                  padding: "12px 14px",
                  margin: "8px 0",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.2)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="ti ti-shield-check" style={{ color: "var(--purple-lt)", fontSize: 16 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--purple-lt)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Comunicado Oficial de Mediación
                      </span>
                    </div>
                    <span className="pill pill-purple" style={{ fontSize: 9 }}>
                      Para: {m.destinatario === "ambos" ? "Ambas partes" : m.destinatario === "marca" ? "Marca" : "Influencer"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: 4 }}>
                    {m.texto}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text2)", textAlign: "right" }}>
                    Emitido por {m.autor} · {m.time || "Recién"}
                  </div>
                </div>
              ) : (
                <div key={m.id} className={`msg-row ${m.sender === (isMarca ? "marca" : "influencer") ? "sent" : "received"}`}>
                  <div className={`msg-bubble ${m.sender === (isMarca ? "marca" : "influencer") ? "sent" : "received"}`}>
                    <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>{m.autor}</div>
                    {m.texto}
                    <div className="msg-time">{m.time || "Ahora"}</div>
                  </div>
                </div>
              )
            ))}
          </div>

          {camp.estado === "finalizado" || camp.estado === "cancelado_50" || camp.estado === "cancelado_fraude" || camp.estado === "reembolso_total" ? (
            <div style={{ padding:"12px 16px", background:"var(--bg2)", borderTop:"1px solid var(--border)", textAlign:"center", fontSize:12, color:"var(--text2)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <i className="ti ti-lock" style={{ color:"var(--purple-lt)" }} />
              <span>Campaña concluida. El chat está archivado como constancia oficial de entrega y pago.</span>
            </div>
          ) : (
            <div className="chat-input-bar">
              <input
                className="chat-input"
                placeholder={`Escribí un mensaje como ${isMarca ? "Marca" : "Influencer"}...`}
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && chatText.trim()) {
                    const nuevo = {
                      id: Date.now(),
                      sender: isMarca ? "marca" : "influencer",
                      autor: isMarca ? camp.marca_nombre : camp.influencer_nombre,
                      texto: chatText.trim(),
                      time: "Recién"
                    };
                    updateEstado(camp.estado, { mensajes: [...(camp.mensajes || []), nuevo] });
                    setChatText("");
                  }
                }}
              />
              <button
                className="chat-send-btn"
                onClick={() => {
                  if (!chatText.trim()) return;
                  const nuevo = {
                    id: Date.now(),
                    sender: isMarca ? "marca" : "influencer",
                    autor: isMarca ? camp.marca_nombre : camp.influencer_nombre,
                    texto: chatText.trim(),
                    time: "Recién"
                  };
                  updateEstado(camp.estado, { mensajes: [...(camp.mensajes || []), nuevo] });
                  setChatText("");
                }}
              >
                <i className="ti ti-send" />
              </button>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}

// ─── SELECTOR Y REPRODUCTOR DE VIDEOS VIRALES POR RED ────────────────────────
function ViralSelector({ virales = {} }) {
  const [redActiva, setRedActiva] = useState("tiktok");
  const actual = virales[redActiva] || virales["tiktok"] || {
    title: "Video Destacado",
    reach: "150K vistas",
    likes: "12K likes",
    shares: "1.5K compartidos",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  };

  const REDES_CONFIG = [
    { id: "tiktok", label: "TikTok", icon: "ti-brand-tiktok", color: "#00f2fe" },
    { id: "instagram", label: "Instagram Reels", icon: "ti-brand-instagram", color: "#e1306c" },
    { id: "youtube", label: "YouTube Shorts", icon: "ti-brand-youtube", color: "#ff0000" },
    { id: "facebook", label: "Facebook Watch", icon: "ti-brand-facebook", color: "#1877f2" }
  ];

  return (
    <div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:12 }}>
        {REDES_CONFIG.map(r => (
          <button
            key={r.id}
            onClick={() => setRedActiva(r.id)}
            className={`pill ${redActiva === r.id ? "pill-purple" : "pill-gray"}`}
            style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border: redActiva === r.id ? "1px solid var(--purple)" : "0.5px solid var(--border)" }}
          >
            <i className={`ti ${r.icon}`} style={{ color: r.color }} />
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      <div style={{ background:"var(--bg2)", borderRadius:"var(--radius)", padding:"14px", border:"0.5px solid var(--border)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:6 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>{actual.title}</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {actual.reach && <span className="pill pill-green" style={{ fontSize:11 }}>👁️ {actual.reach}</span>}
            {actual.likes && <span className="pill pill-purple" style={{ fontSize:11 }}>❤️ {actual.likes}</span>}
            {actual.shares && <span className="pill pill-gray" style={{ fontSize:11 }}>↗️ {actual.shares}</span>}
          </div>
        </div>
        <DraftVideoPlayer
          videoUrl={actual.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"}
          title={actual.title}
        />
      </div>
    </div>
  );
}

// ─── DEMOGRAFÍA Y MÉTRICAS DE AUDIENCIA AUDITADAS (MEDIA KIT) ────────────────
function AudienceMetricsView({ metricas, redes }) {
  const m = metricas || {
    genero: { hombres: 68, mujeres: 32 },
    edades: [ { rango: "18-24", pct: 36 }, { rango: "25-34", pct: 48 }, { rango: "35-44", pct: 12 }, { rango: "45+", pct: 4 } ],
    ciudades: [ { ciudad: "CABA & GBA", pct: 54 }, { ciudad: "Córdoba", pct: 16 }, { ciudad: "Rosario / Santa Fe", pct: 12 }, { ciudad: "Otras provincias", pct: 18 } ],
    alcance_mensual: "850.000+ cuentas alcanzadas",
    engagement_promedio: "7.9% engagement verificado"
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Resumen de Métricas Globales */}
      <div className="grid-2">
        <div style={{ background:"var(--bg2)", padding:"12px 14px", borderRadius:"var(--radius)", border:"0.5px solid var(--border)" }}>
          <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Alcance Mensual Total</div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--green)", marginTop:4 }}>{m.alcance_mensual}</div>
          <div style={{ fontSize:10, color:"var(--text2)", marginTop:2 }}>En todas las plataformas activas</div>
        </div>
        <div style={{ background:"var(--bg2)", padding:"12px 14px", borderRadius:"var(--radius)", border:"0.5px solid var(--border)" }}>
          <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Engagement Promedio</div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--purple-lt)", marginTop:4 }}>{m.engagement_promedio}</div>
          <div style={{ fontSize:10, color:"var(--text2)", marginTop:2 }}>Interacción real por post / video</div>
        </div>
      </div>

      {/* Desglose de Género */}
      <div style={{ background:"var(--bg2)", padding:"12px 14px", borderRadius:"var(--radius)", border:"0.5px solid var(--border)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600 }}>Distribución por Género</span>
          <span style={{ fontSize:11, color:"var(--text2)" }}>Hombres: {m.genero.hombres}% · Mujeres: {m.genero.mujeres}%</span>
        </div>
        <div style={{ height:8, width:"100%", background:"rgba(255,255,255,0.08)", borderRadius:100, overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${m.genero.hombres}%`, background:"#3b82f6" }} title={`Hombres ${m.genero.hombres}%`} />
          <div style={{ width:`${m.genero.mujeres}%`, background:"#ec4899" }} title={`Mujeres ${m.genero.mujeres}%`} />
        </div>
        <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11 }}>
          <span style={{ color:"#60a5fa" }}>● Hombres ({m.genero.hombres}%)</span>
          <span style={{ color:"#f472b6" }}>● Mujeres ({m.genero.mujeres}%)</span>
        </div>
      </div>

      {/* Rangos de Edad */}
      <div style={{ background:"var(--bg2)", padding:"12px 14px", borderRadius:"var(--radius)", border:"0.5px solid var(--border)" }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Rango Etario de la Comunidad</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {m.edades.map((e, idx) => (
            <div key={idx}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                <span style={{ color:"var(--text2)" }}>{e.rango} años</span>
                <span style={{ fontWeight:600 }}>{e.pct}%</span>
              </div>
              <div style={{ height:6, width:"100%", background:"rgba(255,255,255,0.06)", borderRadius:100, overflow:"hidden" }}>
                <div style={{ width:`${e.pct}%`, height:"100%", background:"var(--purple-lt)", borderRadius:100 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ciudades Principales */}
      <div style={{ background:"var(--bg2)", padding:"12px 14px", borderRadius:"var(--radius)", border:"0.5px solid var(--border)" }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Principales Ciudades y Provincias</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
          {m.ciudades.map((c, idx) => (
            <div key={idx} style={{ background:"var(--bg1)", padding:"8px 10px", borderRadius:"var(--radius-sm)", border:"0.5px solid var(--border)" }}>
              <div style={{ fontSize:11, color:"var(--text2)" }}>{c.ciudad}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginTop:2 }}>{c.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Capturas de Analytics Verificadas */}
      <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", padding:"12px 14px", borderRadius:"var(--radius)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <i className="ti ti-certificate" style={{ color:"var(--green)", fontSize:18 }} />
          <span style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>Capturas de Pantalla Verificadas por Io Sono</span>
        </div>
        <div style={{ fontSize:11, color:"var(--text2)", lineHeight:1.5 }}>
          Las estadísticas de Meta Insights y TikTok Analytics fueron contrastadas con capturas oficiales subidas por el creador y auditadas por el equipo de moderación.
        </div>
      </div>
    </div>
  );
}

// ─── PERFIL DEL INFLUENCER CON METRICAS DE CONFIANZA ──────────────────────────
function Profile({ inf, onBack, onNav, user }) {
  const [tab, setTab] = useState("servicios");
  const services = (inf.services || DEFAULT_SERVICES).filter(s => s.active !== false);
  const esMiPerfil = user?.role === "influencer" && (user?.name === inf.name || user?.id === inf.usuarioId || user?.email === inf.email);

  return (
    <div style={{ paddingTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <button onClick={onBack} style={{ background:"transparent", border:"none", color:"var(--purple-lt)", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:5, padding:"6px 0" }}>
          <i className="ti ti-arrow-left" /> Volver al buscador
        </button>
        {esMiPerfil && (
          <button
            className="btn btn-sm btn-outline"
            style={{ borderColor:"var(--purple)", color:"var(--purple-lt)", fontSize:11 }}
            onClick={() => onNav("editor_perfil")}
          >
            <i className="ti ti-edit" /> Editar mi perfil y tarifas
          </button>
        )}
      </div>

      <div className="hero">
        <div className="hero-inner">
          <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
            <AvatarEl initials={inf.initials} color={inf.color} textColor={inf.textColor} fotoUrl={inf.fotoUrl} size="lg" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:22, fontWeight:600, marginBottom:3, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                {inf.name}
                {(inf.verificado || inf.planActivo === "verificado" || inf.planActivo === "combo") && (
                  <span style={{ fontSize:11, color:"var(--green)", display:"inline-flex", alignItems:"center", gap:4, background:"var(--green-bg)", border:"0.5px solid var(--green-border)", padding:"2px 8px", borderRadius:100 }}>
                    <i className="ti ti-rosette-discount-check" /> Verificado Oficial
                  </span>
                )}
                {(inf.topNicho || inf.planActivo === "top" || inf.planActivo === "combo") && (
                  <span style={{ fontSize:11, color:"#111", background:"linear-gradient(135deg, #fbbf24, #f59e0b)", padding:"2px 8px", borderRadius:100, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4 }}>
                    <i className="ti ti-crown" /> Top del Nicho
                  </span>
                )}
                {(inf.recomendadoMarcas || inf.planActivo === "recomendado" || inf.planActivo === "combo") && (
                  <span style={{ fontSize:11, color:"var(--purple-lt)", background:"var(--purple-bg)", border:"0.5px solid var(--purple)", padding:"2px 8px", borderRadius:100, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 }}>
                    <i className="ti ti-star" /> Recomendado a Marcas
                  </span>
                )}
              </div>
              {/* Redes Sociales Verificadas */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, margin:"6px 0 10px" }}>
                <span className="pill pill-purple" style={{ fontSize:11, display:"inline-flex", alignItems:"center", gap:5, background:"rgba(225,48,108,0.15)", border:"1px solid rgba(225,48,108,0.3)" }}>
                  <i className="ti ti-brand-instagram" style={{ color:"#e1306c" }} />
                  {inf.redes?.instagram?.handle || inf.handle} · {inf.redes?.instagram?.followers || inf.followers}
                </span>
                <span className="pill pill-purple" style={{ fontSize:11, display:"inline-flex", alignItems:"center", gap:5, background:"rgba(0,242,254,0.12)", border:"1px solid rgba(0,242,254,0.3)" }}>
                  <i className="ti ti-brand-tiktok" style={{ color:"#00f2fe" }} />
                  {inf.redes?.tiktok?.handle || inf.tiktok || "@tiktok"} · {inf.redes?.tiktok?.followers || "142K"}
                </span>
                <span className="pill pill-purple" style={{ fontSize:11, display:"inline-flex", alignItems:"center", gap:5, background:"rgba(24,119,242,0.15)", border:"1px solid rgba(24,119,242,0.3)" }}>
                  <i className="ti ti-brand-facebook" style={{ color:"#1877f2" }} />
                  {inf.redes?.facebook?.handle || inf.facebook || "Facebook"} · {inf.redes?.facebook?.followers || "24K"}
                </span>
                <span className="pill pill-purple" style={{ fontSize:11, display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,0,0,0.12)", border:"1px solid rgba(255,0,0,0.3)" }}>
                  <i className="ti ti-brand-youtube" style={{ color:"#ff0000" }} />
                  {inf.redes?.youtube?.handle || inf.youtube || "YouTube"} · {inf.redes?.youtube?.followers || "31K"}
                </span>
              </div>
              {inf.bio && <div style={{ fontSize:12, color:"var(--text2)", marginBottom:12, lineHeight:1.5 }}>{inf.bio}</div>}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                <span className="pill pill-purple">{inf.niche}</span>
                <span className="pill pill-green">{inf.followers} seguidores</span>
                <span className="pill pill-gray">{inf.zone}</span>
                {inf.responseTime && <span className="pill pill-gray">⚡ Responde {inf.responseTime}</span>}
              </div>
            </div>
          </div>

          {/* Estadísticas de Confianza y Cumplimiento Reales */}
          <div className="stats-row" style={{ marginTop:16 }}>
            <div className="stat-cell">
              <div className="stat-num" style={{ color:"var(--green)" }}>{inf.completedJobs || 18}</div>
              <div className="stat-lbl">Finalizados</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num" style={{ color:"var(--text)" }}>0</div>
              <div className="stat-lbl">Sin cumplir</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num" style={{ color:"var(--purple-lt)" }}>{inf.completionRate || "100%"}</div>
              <div className="stat-lbl">Cumplimiento</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num" style={{ color:"var(--amber)" }}>{inf.rating || "9.9"} ★</div>
              <div className="stat-lbl">Rating / 10</div>
            </div>
          </div>
        </div>
      </div>

      <div className="toggle-bar">
        {["servicios", "material", "condiciones", "resenas"].map(t => (
          <button key={t} className={`toggle-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t === "servicios" ? "Catálogo y Tarifas" :
             t === "material" ? "🎬 Material & Métricas" :
             t === "condiciones" ? "Condiciones del Creador" : "Reseñas (10/10)"}
          </button>
        ))}
      </div>

      {tab === "servicios" && (
        <div className="card">
          <div className="card-title">
            <span>Servicios disponibles y tarifas oficiales</span>
            <span style={{ fontSize:10, color:"var(--purple-lt)" }}>Garantía Io Sono Escrow</span>
          </div>
          {services.map(s => (
            <div key={s.id || s.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"0.5px solid var(--border)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, paddingRight:12 }}>
                <i className={`ti ${s.icon || (s.isCustom ? "ti-sparkles" : "ti-player-play")}`} style={{ fontSize:18, color:"var(--purple-lt)", flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                    {s.name}
                    {s.isCustom && <span className="pill pill-purple" style={{ fontSize:9, padding:"1px 6px" }}>⭐ A medida</span>}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                    {s.desc || "Entrega garantizada con revisión de borrador"} {s.plazo ? `· Plazo: ${s.plazo}` : "· Plazo: 72hs"}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{s.price}</span>
                {esMiPerfil ? (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ borderColor:"var(--purple)", color:"var(--purple-lt)" }}
                    onClick={() => onNav("editor_perfil")}
                  >
                    ✏️ Editar tarifa
                  </button>
                ) : user?.role === "influencer" ? (
                  <span className="pill pill-gray" style={{ fontSize:10 }}>
                    Tarifa para marcas: {s.price}
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onNav("hire", { inf, service:s })}
                  >
                    Contratar ↗
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "material" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* 1. Video Presentación a Marcas */}
          <div className="card" style={{ borderLeft:"4px solid var(--purple)" }}>
            <div className="card-title">
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <i className="ti ti-video" style={{ color:"var(--purple-lt)", fontSize:20 }} />
                <span>Video de Presentación a Marcas</span>
              </div>
              <span className="pill pill-purple" style={{ fontSize:10 }}>🎤 Pitch Oficial · 45 seg</span>
            </div>
            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:12, lineHeight:1.5 }}>
              {inf.video_presentacion?.descripcion || "Mirá a cámara cómo comunica, su dicción, estética y cómo presenta productos a su comunidad antes de contratar:"}
            </div>
            <DraftVideoPlayer
              videoUrl={inf.video_presentacion?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}
              title={inf.video_presentacion?.titulo || `Presentación de ${inf.name}`}
              nota="Video grabado directamente por el creador para Io Sono"
            />
          </div>

          {/* 2. Video más viral por Red Social */}
          <div className="card">
            <div className="card-title">
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <i className="ti ti-flame" style={{ color:"var(--amber)", fontSize:20 }} />
                <span>Video más viral por red social</span>
              </div>
              <span style={{ fontSize:10, color:"var(--text2)" }}>Métricas orgánicas verificadas</span>
            </div>
            <ViralSelector virales={inf.virales_redes} />
          </div>

          {/* 3. Métricas y Estadísticas de Audiencia (Media Kit) */}
          <div className="card">
            <div className="card-title">
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <i className="ti ti-chart-bar" style={{ color:"var(--green)", fontSize:20 }} />
                <span>Media Kit y Demografía de Audiencia</span>
              </div>
              <span className="pill pill-green" style={{ fontSize:10 }}>✓ Auditado por Io Sono</span>
            </div>
            <AudienceMetricsView metricas={inf.metricas_audiencia} redes={inf.redes} />
          </div>
        </div>
      )}

      {tab === "condiciones" && (
        <div className="card">
          <div className="card-title">
            <span>Pautas y requisitos exigidos por {inf.name}</span>
            <span style={{ fontSize:10, color:"var(--amber)" }}>Leer antes de contratar</span>
          </div>
          <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14, lineHeight:1.5 }}>
            Para garantizar que la colaboración fluya sin inconvenientes y el contenido sea aprobado rápidamente, tu propuesta debe respetar estas directivas:
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {(inf.condiciones && inf.condiciones.length > 0 ? inf.condiciones : [
              "📦 Envío del producto físico con al menos 4 días de anticipación a la filmación.",
              "🚫 No promocionar casas de apuestas, casinos online ni marcas competidoras directas.",
              "🎬 El guión debe permitir al influencer adaptar la comunicación a su tono natural para mantener credibilidad.",
              "⏳ El contenido permanecerá publicado como mínimo 60 días en el perfil."
            ]).map((c, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, background:"var(--bg2)", padding:"10px 12px", borderRadius:"var(--radius-sm)", fontSize:12, lineHeight:1.4, border:"0.5px solid var(--border)" }}>
                <i className="ti ti-check" style={{ color:"var(--green)", marginTop:2, flexShrink:0, fontSize:14 }} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="card">
          <div className="card-title">Reels y colaboraciones en video</div>
          {inf.portfolio && inf.portfolio.length > 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {inf.portfolio.map((p, i) => (
                <div key={p.id || i} style={{ background:"var(--bg2)", borderRadius:"var(--radius)", padding:"14px", border:"0.5px solid var(--border)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{p.title}</div>
                      <div style={{ fontSize:11, color:"var(--purple-lt)", marginTop:2 }}>Marca: <strong>{p.brand}</strong></div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {p.reach && <span className="pill pill-green" style={{ fontSize:10 }}>👁️ {p.reach}</span>}
                      {p.eng && <span className="pill pill-purple" style={{ fontSize:10 }}>🔥 {p.eng}</span>}
                    </div>
                  </div>
                  {p.videoUrl ? (
                    <DraftVideoPlayer
                      videoUrl={p.videoUrl}
                      title={p.title}
                    />
                  ) : (
                    <div style={{ padding:"12px", textAlign:"center", background:"var(--bg1)", borderRadius:"var(--radius-sm)", fontSize:12, color:"var(--text2)" }}>
                      🎬 Video de muestra verificado por Io Sono
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-2">
              {[
                { type:"Reel", brand:"Moda BA", reach:"48.2K vistas", eng:"6.4% eng" },
                { type:"Post", brand:"Luce Store", reach:"22.7K vistas", eng:"5.1% eng" }
              ].map((p, i) => (
                <div key={i} style={{ background:"var(--bg2)", borderRadius:"var(--radius)", padding:"12px", border:"0.5px solid var(--border)" }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{p.brand} ({p.type})</div>
                  <div style={{ fontSize:11, color:"var(--text2)" }}>Alcance: <strong style={{ color:"var(--text)" }}>{p.reach}</strong> · Eng: <strong style={{ color:"var(--green)" }}>{p.eng}</strong></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "resenas" && (
        <div className="card">
          <div className="card-title">Calificaciones oficiales de marcas</div>
          {[
            { marca:"Tienda Nómade", puntaje:"10/10", svc:"Reel hasta 30 seg.", text:"Increíble producción y súper puntual. Respetó todas las cosas que le pedimos que no dijera.", date:"Hace 3 días" },
            { marca:"Studio Luce", puntaje:"9.8/10", svc:"Combo 3 Historias", text:"Muy buena comunicación en el chat interno. El borrador quedó perfecto de entrada.", date:"Semana pasada" },
            { marca:"Savia Cosméticos", puntaje:"10/10", svc:"Publicación Feed", text:"Excelente engagement en los comentarios y etiquetó a la marca tal cual lo pactado.", date:"Hace 2 semanas" }
          ].map((r, i) => (
            <div key={i} style={{ padding:"12px 0", borderBottom:"0.5px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{r.marca} <span style={{ fontSize:10, color:"var(--green)", fontWeight:400 }}>· Compra verificada</span></div>
                <span className="pill pill-green" style={{ fontSize:10 }}>⭐ {r.puntaje}</span>
              </div>
              <div style={{ fontSize:11, color:"var(--purple-lt)", marginBottom:4 }}>{r.svc}</div>
              <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5 }}>"{r.text}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BUSCADOR Y CATÁLOGO DE INFLUENCERS ──────────────────────────────────────
function Buscador({ onNav, user, onSelectInfluencer, influencersList = [] }) {
  const [influencers, setInfluencers] = useState(influencersList.length > 0 ? influencersList : INITIAL_INFLUENCERS);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [nichoActivo, setNichoActivo] = useState("todos");
  const [ordenActivo, setOrdenActivo] = useState("rating");

  useEffect(() => {
    if (influencersList && influencersList.length > 0) {
      setInfluencers(influencersList);
    }
  }, [influencersList]);

  // Creadores recomendados a marcas (Plan de USD 5 o Combo USD 15)
  const recomendados = influencers.filter(inf => 
    inf.recomendadoMarcas || inf.planActivo === "recomendado" || inf.planActivo === "combo"
  );

  // Filtrado por texto y por nicho/categoría con prioridad Top del Nicho
  const filtrados = influencers.filter(inf => {
    const q = busqueda.toLowerCase().trim();
    const matchTexto = !q || 
      inf.name?.toLowerCase().includes(q) || 
      inf.handle?.toLowerCase().includes(q) ||
      (inf.niche && inf.niche.toLowerCase().includes(q)) ||
      (inf.zone && inf.zone.toLowerCase().includes(q));
    
    const matchNicho = nichoActivo === "todos" || 
      inf.niche?.toLowerCase().includes(nichoActivo.toLowerCase()) || 
      nichoActivo.toLowerCase().includes(inf.niche?.toLowerCase() || "");

    return matchTexto && matchNicho;
  }).sort((a, b) => {
    // 👑 Prioridad #1: Top del Nicho (Plan de USD 15 o Combo USD 15)
    const aIsTop = Boolean(a.topNicho || a.planActivo === "top" || a.planActivo === "combo");
    const bIsTop = Boolean(b.topNicho || b.planActivo === "top" || b.planActivo === "combo");
    if (aIsTop && !bIsTop) return -1;
    if (!aIsTop && bIsTop) return 1;

    if (ordenActivo === "rating") {
      return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
    }
    if (ordenActivo === "precio_asc") {
      const minA = Math.min(...(a.services?.filter(s => s.active !== false).map(s => s.rawPrice) || [999]));
      const minB = Math.min(...(b.services?.filter(s => s.active !== false).map(s => s.rawPrice) || [999]));
      return minA - minB;
    }
    if (ordenActivo === "precio_desc") {
      const minA = Math.max(...(a.services?.filter(s => s.active !== false).map(s => s.rawPrice) || [0]));
      const minB = Math.max(...(b.services?.filter(s => s.active !== false).map(s => s.rawPrice) || [0]));
      return minB - minA;
    }
    if (ordenActivo === "seguidores") {
      const parseSeg = (s) => {
        if (!s) return 0;
        const num = parseFloat(s);
        if (s.includes("M")) return num * 1000000;
        if (s.includes("K")) return num * 1000;
        return num;
      };
      return parseSeg(b.followers) - parseSeg(a.followers);
    }
    if (ordenActivo === "contratados") {
      return (b.completedJobs || 0) - (a.completedJobs || 0);
    }
    return 0;
  });

  return (
    <div style={{ paddingTop:8 }}>
      {/* Banner de Garantía Io Sono Escrow */}
      <div className="trust-banner">
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <i className="ti ti-shield-check" style={{ fontSize:22, color:"var(--purple-lt)" }} />
          <div style={{ fontSize:14, fontWeight:700, color:"var(--purple-lt)" }}>
            Contrataciones 100% Protegidas con Io Sono Escrow
          </div>
        </div>
        <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:8, marginTop:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"var(--green)", fontSize:14 }}>✓</span> Pago en custodia hasta tu aprobación
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"var(--purple-lt)", fontSize:14 }}>🎬</span> Borradores HD antes de publicar
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"var(--amber)", fontSize:14 }}>⏱️</span> 36hs para verificar pautas o mediar
          </div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:18, fontWeight:700 }}>Catálogo de Creadores</div>
        <span className="pill pill-purple" style={{ fontSize:10 }}>
          {filtrados.length} disponible{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Píldoras de Nichos / Categorías con scroll horizontal */}
      <div className="category-bar">
        {NICHOS_CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`category-chip ${nichoActivo === cat.id ? "active" : ""}`}
            onClick={() => setNichoActivo(cat.id)}
          >
            <i className={`ti ${cat.icon}`} /> {cat.label}
          </button>
        ))}
      </div>

      {/* Barra de Búsqueda y Selector de Ordenamiento */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div className="field" style={{ flex:1, marginBottom:0 }}>
          <input
            placeholder="Buscar por nombre, @usuario, nicho o ciudad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <select
          value={ordenActivo}
          onChange={e => setOrdenActivo(e.target.value)}
          style={{ width:"auto", minWidth:"150px", background:"var(--bg2)", border:"0.5px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text)", padding:"0 10px", fontSize:12, cursor:"pointer" }}
        >
          <option value="rating">⭐ Mejor calificados</option>
          <option value="precio_asc">💵 Menor precio primero</option>
          <option value="precio_desc">💎 Mayor precio primero</option>
          <option value="seguidores">👥 Más seguidores</option>
          <option value="contratados">🚀 Más contratados</option>
        </select>
      </div>

      {/* Sección Creadores Recomendados a Marcas (Plan USD 5 / Combo USD 15) */}
      {!busqueda && nichoActivo === "todos" && recomendados.length > 0 && (
        <div style={{ marginBottom: 18, background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(251,191,36,0.08))", border: "1px solid rgba(167,139,250,0.35)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  Recomendados por Io Sono para tu marca
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  Perfiles destacados con respuesta inmediata y 100% de cumplimiento
                </div>
              </div>
            </div>
            <span className="pill pill-amber" style={{ fontSize: 10, fontWeight: 700 }}>
              <i className="ti ti-star-filled" /> PRO DESTACADOS
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {recomendados.map(rec => {
              const activeSvcs = (rec.services || []).filter(s => s.active !== false);
              const minP = activeSvcs.length > 0 ? Math.min(...activeSvcs.map(s => s.rawPrice || 35)) : 35;
              return (
                <div
                  key={`rec_${rec.id}`}
                  onClick={() => onSelectInfluencer(rec)}
                  style={{
                    flex: "0 0 200px",
                    background: "var(--bg1)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    borderRadius: "var(--radius)",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--purple-lt)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <AvatarEl initials={rec.initials} fotoUrl={rec.fotoUrl} size="sm" />
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>
                        {rec.name}
                        {(rec.verificado || rec.planActivo === "verificado" || rec.planActivo === "combo") && (
                          <i className="ti ti-rosette-discount-check" style={{ color: "var(--green)", fontSize: 12 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {rec.niche}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginTop: 6, paddingTop: 6, borderTop: "0.5px solid var(--border)" }}>
                    <span style={{ color: "var(--amber)", fontWeight: 600 }}>⭐ {rec.rating || "9.9"}</span>
                    <span style={{ color: "var(--purple-lt)", fontWeight: 600 }}>Desde USD {minP}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listado de Tarjetas */}
      {filtrados.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"36px 16px", marginTop:10 }}>
          <i className="ti ti-search-off" style={{ fontSize:32, color:"var(--text2)", display:"block", marginBottom:8 }} />
          <div style={{ fontSize:15, fontWeight:600 }}>No se encontraron creadores</div>
          <div style={{ fontSize:12, color:"var(--text2)", marginTop:4 }}>
            Probá quitando filtros o buscando otro término.
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginTop:12 }} onClick={() => { setBusqueda(""); setNichoActivo("todos"); }}>
            Ver todos los creadores
          </button>
        </div>
      ) : (
        filtrados.map(inf => {
          const activeServices = (inf.services || []).filter(s => s.active !== false);
          const minPrice = activeServices.length > 0
            ? Math.min(...activeServices.map(s => s.rawPrice || 35))
            : 35;

          return (
            <div key={inf.id} className="inf-card" style={{ marginBottom:12 }} onClick={() => onSelectInfluencer(inf)}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
                <AvatarEl initials={inf.initials} fotoUrl={inf.fotoUrl} size="md" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                    {inf.name}
                    {(inf.verificado || inf.planActivo === "verificado" || inf.planActivo === "combo") && (
                      <span style={{ fontSize:13, color:"var(--green)", display:"inline-flex", alignItems:"center" }} title="Verificado Oficial por Io Sono">
                        <i className="ti ti-rosette-discount-check" />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:"var(--text2)" }}>{inf.handle} · {inf.zone}</div>
                </div>
                <span className="pill pill-purple" style={{ fontSize:10 }}>{inf.niche}</span>
              </div>

              {/* Insignias de confianza, Pro Boost y rapidez */}
              <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                {(inf.topNicho || inf.planActivo === "top" || inf.planActivo === "combo") && (
                  <span style={{ fontSize:10, fontWeight:700, color:"#111", background:"linear-gradient(135deg, #fbbf24, #f59e0b)", padding:"2px 8px", borderRadius:4, display:"inline-flex", alignItems:"center", gap:4, boxShadow:"0 2px 8px rgba(251,191,36,0.3)" }}>
                    <i className="ti ti-crown" /> Top del Nicho
                  </span>
                )}
                {(inf.recomendadoMarcas || inf.planActivo === "recomendado" || inf.planActivo === "combo") && (
                  <span style={{ fontSize:10, fontWeight:600, color:"var(--purple-lt)", background:"var(--purple-bg)", padding:"2px 8px", borderRadius:4, border:"0.5px solid var(--purple)", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <i className="ti ti-star" /> Recomendado
                  </span>
                )}
                {(inf.verificado || inf.planActivo === "verificado" || inf.planActivo === "combo") && (
                  <span style={{ fontSize:10, fontWeight:600, color:"var(--green)", background:"var(--green-bg)", padding:"2px 8px", borderRadius:4, border:"0.5px solid var(--green-border)", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <i className="ti ti-shield-check" /> Verificado
                  </span>
                )}
                <span style={{ fontSize:10, color:"var(--green)", background:"var(--bg2)", padding:"2px 8px", borderRadius:4, border:"0.5px solid var(--border)" }}>
                  ⚡ Responde {inf.responseTime || "< 2h"}
                </span>
                <span style={{ fontSize:10, color:"var(--purple-lt)", background:"var(--bg2)", padding:"2px 8px", borderRadius:4, border:"0.5px solid var(--border)" }}>
                  💯 {inf.completionRate || "100%"} de cumplimiento
                </span>
                {inf.portfolio && inf.portfolio.length > 0 && (
                  <span style={{ fontSize:10, color:"var(--amber)", background:"var(--bg2)", padding:"2px 8px", borderRadius:4, border:"0.5px solid var(--border)" }}>
                    🎥 {inf.portfolio.length} Reel{inf.portfolio.length > 1 ? "s" : ""} de muestra
                  </span>
                )}
                {inf.services?.some(s => s.isCustom) && (
                  <span style={{ fontSize:10, color:"var(--text)", background:"var(--purple-bg)", padding:"2px 8px", borderRadius:4, border:"0.5px solid var(--purple)" }}>
                    ⭐ Servicios a medida
                  </span>
                )}
              </div>

              {/* Fila de métricas clave */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--bg2)", padding:"8px 12px", borderRadius:"var(--radius-sm)", marginBottom:10 }}>
                <span style={{ fontSize:11, color:"var(--text2)" }}>👥 <strong>{inf.followers}</strong> seg.</span>
                <span style={{ fontSize:11, color:"var(--green)" }}>✓ <strong>{inf.completedJobs || 18}</strong> finalizados</span>
                <span style={{ fontSize:11, color:"var(--amber)" }}>⭐ <strong>{inf.rating || "9.9"}</strong> / 10</span>
              </div>

              {inf.bio && (
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:10, lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                  {inf.bio}
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:4, borderTop:"0.5px solid var(--border)" }}>
                <span style={{ fontSize:12, color:"var(--text2)" }}>
                  Desde <strong style={{ color:"var(--text)", fontSize:14 }}>USD {minPrice}</strong>
                </span>
                <span style={{ fontSize:12, color:"var(--purple-lt)", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  Ver perfil y contratar <i className="ti ti-chevron-right" />
                </span>
              </div>
            </div>
          );
        })
      )}

      {/* Banner de Captación para Creadores */}
      <div style={{ background:"linear-gradient(135deg, #1b122c, #0e0a17)", border:"1px solid var(--purple)", borderRadius:"var(--radius)", padding:"16px", marginTop:16, textAlign:"center" }}>
        <i className="ti ti-sparkles" style={{ fontSize:28, color:"var(--purple-lt)", display:"block", marginBottom:6 }} />
        <div style={{ fontSize:14, fontWeight:700 }}>¿Sos creador de contenido o influencer?</div>
        <div style={{ fontSize:12, color:"var(--text2)", marginTop:4, marginBottom:12, lineHeight:1.4 }}>
          Cargá tus tarifas personalizadas, subí tu portfolio en video y empezá a recibir propuestas con pago asegurado en custodia.
        </div>
        <button
          className="btn btn-outline btn-sm"
          style={{ borderColor:"var(--purple)", color:"var(--purple-lt)" }}
          onClick={() => onNav("editor_perfil")}
        >
          Cargar mi perfil de creador ↗
        </button>
      </div>
    </div>
  );
}

// ─── CENTRO DE CARGA Y EDICIÓN DE PERFIL DEL INFLUENCER ──────────────────────
function CreatorProfileEditor({ influencer, onSave, onPreview, onNav }) {
  const currentInf = influencer || INITIAL_INFLUENCERS[0];

  // Estado de Datos Personales y Redes Múltiples
  const [nombre, setNombre] = useState(currentInf.name || "");
  const [handle, setHandle] = useState(currentInf.handle || "");
  const [tiktok, setTiktok] = useState(currentInf.tiktok || currentInf.redes?.tiktok?.handle || "");
  const [facebook, setFacebook] = useState(currentInf.facebook || currentInf.redes?.facebook?.handle || "");
  const [youtube, setYoutube] = useState(currentInf.youtube || currentInf.redes?.youtube?.handle || "");
  const [videoPresUrl, setVideoPresUrl] = useState(currentInf.video_presentacion?.videoUrl || "");
  const [videoPresDesc, setVideoPresDesc] = useState(currentInf.video_presentacion?.descripcion || "");
  const [niche, setNiche] = useState(currentInf.niche || "Moda & Tendencias");
  const [zone, setZone] = useState(currentInf.zone || "Buenos Aires, Argentina");
  const [responseTime, setResponseTime] = useState(currentInf.responseTime || "< 2 horas");
  const [bio, setBio] = useState(currentInf.bio || "");
  const [fotoUrl, setFotoUrl] = useState(currentInf.fotoUrl || null);

  // Estado de Servicios y Tarifas
  const [services, setServices] = useState(currentInf.services || DEFAULT_SERVICES);
  const [modalNewService, setModalNewService] = useState(false);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  const [newSvcDesc, setNewSvcDesc] = useState("");
  const [newSvcPlazo, setNewSvcPlazo] = useState("48hs");

  // Estado de Portfolio
  const [portfolio, setPortfolio] = useState(currentInf.portfolio || []);
  const [modalNewPortfolio, setModalNewPortfolio] = useState(false);
  const [newPortTitle, setNewPortTitle] = useState("");
  const [newPortBrand, setNewPortBrand] = useState("");
  const [newPortReach, setNewPortReach] = useState("");
  const [newPortEng, setNewPortEng] = useState("");
  const [newPortVideoUrl, setNewPortVideoUrl] = useState("");

  // Estado de Condiciones Propias
  const [condiciones, setCondiciones] = useState(currentInf.condiciones || [
    "📦 El producto físico debe llegar con al menos 4 días de anticipación antes de filmar.",
    "🚫 No promociono plataformas de apuestas ni marcas de dudosa procedencia."
  ]);
  const [nuevaCondicion, setNuevaCondicion] = useState("");

  // Estado de Datos Bancarios
  const [banco, setBanco] = useState(currentInf.banco || {
    alias: "DANI.MONALDI.MP",
    cbu: "0000003100045892348911",
    titular: "Daniel Monaldi",
    cuit: "20-38491203-9",
    banco: "Mercado Pago"
  });

  // Estado de Facturación Extra / Planes Pro Io Sono
  const [planActivo, setPlanActivo] = useState(currentInf.planActivo || null);
  const [planVence, setPlanVence] = useState(currentInf.planVence || null);
  const [verificado, setVerificado] = useState(currentInf.verificado ?? false);
  const [recomendadoMarcas, setRecomendadoMarcas] = useState(currentInf.recomendadoMarcas ?? false);
  const [topNicho, setTopNicho] = useState(currentInf.topNicho ?? false);

  const [activeTab, setActiveTab] = useState("identidad"); // identidad | planes | servicios | portfolio | condiciones | cobros
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Activación / Cancelación de Planes de Facturación Extra
  const handleActivarPlan = (tipo) => {
    const hoy = new Date();
    const venc = new Date(hoy.setDate(hoy.getDate() + 30));
    const fechaVenc = `${venc.getDate().toString().padStart(2, "0")}/${(venc.getMonth() + 1).toString().padStart(2, "0")}/${venc.getFullYear()}`;

    let nuevoVerif = false;
    let nuevoRec = false;
    let nuevoTop = false;
    let nuevoPlan = null;
    let nuevaFecha = null;

    if (tipo === "cancelar") {
      nuevoPlan = null;
      nuevaFecha = null;
      nuevoVerif = false;
      nuevoRec = false;
      nuevoTop = false;
    } else if (tipo === "verificado") {
      nuevoPlan = "verificado";
      nuevaFecha = fechaVenc;
      nuevoVerif = true;
      nuevoRec = false;
      nuevoTop = false;
    } else if (tipo === "recomendado") {
      nuevoPlan = "recomendado";
      nuevaFecha = fechaVenc;
      nuevoVerif = false;
      nuevoRec = true;
      nuevoTop = false;
    } else if (tipo === "top") {
      nuevoPlan = "top";
      nuevaFecha = fechaVenc;
      nuevoVerif = false;
      nuevoRec = false;
      nuevoTop = true;
    } else if (tipo === "combo") {
      nuevoPlan = "combo";
      nuevaFecha = fechaVenc;
      nuevoVerif = true;
      nuevoRec = true;
      nuevoTop = true;
    }

    setPlanActivo(nuevoPlan);
    setPlanVence(nuevaFecha);
    setVerificado(nuevoVerif);
    setRecomendadoMarcas(nuevoRec);
    setTopNicho(nuevoTop);

    const updated = {
      ...currentInf,
      name: nombre,
      handle: handle,
      tiktok: tiktok,
      niche: niche,
      zone: zone,
      responseTime: responseTime,
      bio: bio,
      fotoUrl: fotoUrl,
      services: services,
      portfolio: portfolio,
      condiciones: condiciones,
      banco: banco,
      planActivo: nuevoPlan,
      planVence: nuevaFecha,
      verificado: nuevoVerif,
      recomendadoMarcas: nuevoRec,
      topNicho: nuevoTop
    };

    onSave?.(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Subir / Cambiar foto de perfil
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setFotoUrl(localUrl);

    // Intentar subir a Supabase Storage fotos-perfil
    try {
      const ext = file.name.split('.').pop();
      const fileName = `fotos/${currentInf.id || Date.now()}.${ext}`;
      supabase.storage.from('fotos-perfil').upload(fileName, file, { upsert: true }).then(({ data, error }) => {
        if (!error && data) {
          const { data: pubData } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName);
          if (pubData?.publicUrl) setFotoUrl(pubData.publicUrl);
        }
      });
    } catch (err) {
      console.warn("Storage fallback a preview local:", err);
    }
  };

  // Guardar nuevo servicio a medida
  const handleAddCustomService = () => {
    if (!newSvcName.trim() || !newSvcPrice) return;
    const priceNum = parseInt(newSvcPrice, 10) || 50;
    const nuevoSvc = {
      id: `custom_${Date.now()}`,
      name: newSvcName.trim(),
      price: `USD ${priceNum}`,
      rawPrice: priceNum,
      icon: "ti-sparkles",
      desc: newSvcDesc.trim() || "Servicio a medida pactado con el creador.",
      plazo: newSvcPlazo,
      isCustom: true,
      active: true
    };
    setServices(prev => [...prev, nuevoSvc]);
    setNewSvcName("");
    setNewSvcPrice("");
    setNewSvcDesc("");
    setNewSvcPlazo("48hs");
    setModalNewService(false);
  };

  // Toggle servicio activo/inactivo
  const handleToggleService = (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: s.active === false ? true : false } : s));
  };

  // Cambiar precio de un servicio
  const handlePriceChange = (id, newPriceVal) => {
    const num = parseInt(newPriceVal, 10) || 0;
    setServices(prev => prev.map(s => s.id === id ? { ...s, rawPrice: num, price: `USD ${num}` } : s));
  };

  // Eliminar servicio personalizado
  const handleDeleteService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // Guardar nuevo video en portfolio
  const handleAddPortfolio = () => {
    if (!newPortTitle.trim()) return;
    const nuevoItem = {
      id: `port_${Date.now()}`,
      title: newPortTitle.trim(),
      brand: newPortBrand.trim() || "Colaboración",
      reach: newPortReach.trim() || "40K vistas",
      eng: newPortEng.trim() || "7% eng",
      videoUrl: newPortVideoUrl.trim() || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    };
    setPortfolio(prev => [...prev, nuevoItem]);
    setNewPortTitle("");
    setNewPortBrand("");
    setNewPortReach("");
    setNewPortEng("");
    setNewPortVideoUrl("");
    setModalNewPortfolio(false);
  };

  // Eliminar video de portfolio
  const handleDeletePortfolio = (id) => {
    setPortfolio(prev => prev.filter(p => p.id !== id));
  };

  // Agregar condición propia
  const handleAddCondicion = (texto) => {
    const c = texto || nuevaCondicion;
    if (!c.trim()) return;
    if (condiciones.includes(c.trim())) return;
    setCondiciones(prev => [...prev, c.trim()]);
    setNuevaCondicion("");
  };

  // Eliminar condición
  const handleDeleteCondicion = (idx) => {
    setCondiciones(prev => prev.filter((_, i) => i !== idx));
  };

  // Objeto influencer actualizado para guardar o previsualizar
  const getUpdatedInfluencerObject = () => ({
    ...currentInf,
    name: nombre,
    handle: handle,
    tiktok: tiktok,
    facebook: facebook,
    youtube: youtube,
    redes: {
      instagram: { handle: handle, followers: currentInf.redes?.instagram?.followers || currentInf.followers },
      tiktok: { handle: tiktok, followers: currentInf.redes?.tiktok?.followers || "142K" },
      facebook: { handle: facebook, followers: currentInf.redes?.facebook?.followers || "24K" },
      youtube: { handle: youtube, followers: currentInf.redes?.youtube?.followers || "31K" }
    },
    video_presentacion: {
      videoUrl: videoPresUrl || currentInf.video_presentacion?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      titulo: "Pitch Oficial a Marcas",
      descripcion: videoPresDesc || "Mirá cómo comunico a cámara: tono fresco, estilismo cuidado, dicción y enfoque en conversión para tu marca."
    },
    virales_redes: currentInf.virales_redes,
    metricas_audiencia: currentInf.metricas_audiencia,
    niche: niche,
    zone: zone,
    responseTime: responseTime,
    bio: bio,
    fotoUrl: fotoUrl,
    services: services,
    portfolio: portfolio,
    condiciones: condiciones,
    banco: banco,
    planActivo: planActivo,
    planVence: planVence,
    verificado: verificado,
    recomendadoMarcas: recomendadoMarcas,
    topNicho: topNicho
  });

  const handleGuardarCambios = () => {
    const updated = getUpdatedInfluencerObject();
    onSave?.(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleVerPrevisualizacion = () => {
    const updated = getUpdatedInfluencerObject();
    onSave?.(updated);
    onPreview?.(updated);
  };

  return (
    <div style={{ paddingTop:8 }}>
      {/* Toast de confirmación de guardado */}
      {savedSuccess && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:999, background:"var(--green)", color:"#fff", padding:"12px 20px", borderRadius:"var(--radius)", boxShadow:"0 8px 24px rgba(0,0,0,0.5)", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
          <i className="ti ti-check" /> ¡Perfil y tarifas actualizadas con éxito!
        </div>
      )}

      {/* Cabecera y Botones de Acción */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>Centro de Carga de Perfil</div>
          <div style={{ fontSize:12, color:"var(--text2)" }}>Personalizá tus tarifas, portfolio, condiciones y datos de cobro</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button
            className="btn btn-outline btn-sm"
            style={{ borderColor:"var(--purple)", color:"var(--purple-lt)" }}
            onClick={handleVerPrevisualizacion}
          >
            👁️ Ver cómo me ven las marcas
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGuardarCambios}
          >
            Guardar cambios ✓
          </button>
        </div>
      </div>

      {/* Barra de Pestañas del Editor */}
      <div className="toggle-bar" style={{ overflowX:"auto" }}>
        {[
          { id:"identidad", label:"👤 Identidad y Redes" },
          { id:"planes", label: planActivo ? `🚀 Facturación Pro (${planActivo === "combo" ? "Combo $15" : planActivo === "verificado" ? "Verificado $1" : planActivo === "recomendado" ? "Recomendado $5" : "Top $15"})` : "🚀 Facturación Extra (Pro)" },
          { id:"servicios", label:`💵 Servicios (${services.filter(s=>s.active!==false).length})` },
          { id:"portfolio", label:`🎬 Portfolio (${portfolio.length})` },
          { id:"condiciones", label:`📌 Mis Condiciones (${condiciones.length})` },
          { id:"cobros", label:"🏦 Cobros & CBU" }
        ].map(t => (
          <button
            key={t.id}
            className={`toggle-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            style={{ whiteSpace:"nowrap" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── PESTAÑA 1: IDENTIDAD Y REDES ───────────────────────────────────── */}
      {activeTab === "identidad" && (
        <div className="card">
          <div className="card-title">Datos personales y presencia online</div>

          {/* Subida de foto de perfil */}
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18, background:"var(--bg2)", padding:"14px", borderRadius:"var(--radius)" }}>
            <AvatarEl initials={nombre.slice(0,2).toUpperCase()} fotoUrl={fotoUrl} size="lg" />
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Foto de perfil oficial</div>
              <div style={{ fontSize:11, color:"var(--text2)", marginBottom:8 }}>Recomendado 400x400px en alta resolución</div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display:"none" }}
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="ti ti-upload" /> Cambiar foto
              </button>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Nombre artístico o completo:</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Daniel Monaldi" />
            </div>
            <div className="field">
              <label>Usuario de Instagram (@handle):</label>
              <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@danielmonaldii" />
            </div>
          </div>

          {/* Redes Multi-plataforma */}
          <div className="grid-3" style={{ marginTop:10 }}>
            <div className="field">
              <label>Usuario de TikTok:</label>
              <input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@danielmonaldi_ok" />
            </div>
            <div className="field">
              <label>Página de Facebook:</label>
              <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Daniel Monaldi Moda" />
            </div>
            <div className="field">
              <label>Canal de YouTube:</label>
              <input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="Daniel Monaldi TV" />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop:10 }}>
            <div className="field">
              <label>Nicho principal:</label>
              <select value={niche} onChange={e => setNiche(e.target.value)}>
                <option value="Moda & Tendencias">Moda & Tendencias</option>
                <option value="Gastronomía">Gastronomía</option>
                <option value="Fitness & Salud">Fitness & Salud</option>
                <option value="Tech & Negocios">Tech & Negocios</option>
                <option value="Viajes & Lifestyle">Viajes & Lifestyle</option>
                <option value="Belleza">Belleza</option>
              </select>
            </div>
            <div className="field">
              <label>Ciudad y País:</label>
              <input value={zone} onChange={e => setZone(e.target.value)} placeholder="Buenos Aires, Argentina" />
            </div>
          </div>

          {/* Video de Presentación a Marcas */}
          <div style={{ marginTop:14, background:"var(--bg2)", padding:"14px", borderRadius:"var(--radius)", border:"1px solid var(--purple)" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--purple-lt)", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <i className="ti ti-video" /> Video de Presentación / Pitch a Marcas (45 seg)
            </div>
            <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>
              Pegá el link a tu video vertical donde te presentás a las marcas para que vean tu tono, carisma y estética antes de contratarte.
            </div>
            <div className="field">
              <label>URL directa del video de presentación (MP4 o link público):</label>
              <input
                value={videoPresUrl}
                onChange={e => setVideoPresUrl(e.target.value)}
                placeholder="https://.../presentacion.mp4"
              />
            </div>
            <div className="field" style={{ marginTop:8 }}>
              <label>Texto breve descriptivo para las marcas:</label>
              <input
                value={videoPresDesc}
                onChange={e => setVideoPresDesc(e.target.value)}
                placeholder="Ej: Te cuento cómo trabajo con las marcas, mi estética y tiempos de entrega."
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop:10 }}>
            <div className="field">
              <label>Tiempo habitual de respuesta:</label>
              <select value={responseTime} onChange={e => setResponseTime(e.target.value)}>
                <option value="< 1 hora">&lt; 1 hora (Súper rápido)</option>
                <option value="< 2 horas">&lt; 2 horas (Rápido)</option>
                <option value="< 4 horas">&lt; 4 horas</option>
                <option value="< 24 horas">&lt; 24 horas</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginTop:10 }}>
            <label>Biografía / Pitch para las marcas:</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Contale a las marcas qué tipo de contenido creás, tu audiencia y por qué les conviene contratarte..."
              style={{ minHeight:90 }}
            />
          </div>
        </div>
      )}

      {/* ─── PESTAÑA PRO: FACTURACIÓN EXTRA & IMPULSO DE PERFIL (PRO BOOST) ─── */}
      {activeTab === "planes" && (
        <div>
          {/* Banner de Estado Actual */}
          <div className="card" style={{ background: planActivo ? "linear-gradient(135deg, #1b122c, #0d1a13)" : "var(--bg1)", border: `1px solid ${planActivo ? "var(--purple)" : "var(--border)"}`, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color: planActivo ? "var(--purple-lt)" : "var(--text2)", fontWeight:700 }}>
                  Estado de Suscripción Io Sono Pro
                </div>
                <div style={{ fontSize:18, fontWeight:700, marginTop:2, display:"flex", alignItems:"center", gap:8 }}>
                  {planActivo === "combo" && <span>🔥 Combo Pro Total Activo</span>}
                  {planActivo === "verificado" && <span>🛡️ Tilde de Verificación Activo</span>}
                  {planActivo === "recomendado" && <span>⭐ Recomendación a Marcas Activa</span>}
                  {planActivo === "top" && <span>👑 Top 1 en el Nicho Activo</span>}
                  {!planActivo && <span style={{ color:"var(--text2)" }}>Sin suscripciones activas (Perfil Básico)</span>}
                </div>
                {planActivo && (
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:4 }}>
                    Renovación automática: <strong>{planVence || "30 días"}</strong> · Cobro mensual a tu saldo o tarjeta
                  </div>
                )}
              </div>
              {planActivo && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ color:"var(--red)", borderColor:"var(--red-border)", fontSize:11 }}
                  onClick={() => handleActivarPlan("cancelar")}
                >
                  Pausar / Cancelar suscripción
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Opciones de Facturación Extra para Creadores</div>
            <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
              Aumentá tus contrataciones destacando tu perfil en el catálogo oficial de marcas
            </div>
          </div>

          <div className="grid-2" style={{ gap:12 }}>
            {/* PLAN 1: Tilde de Verificación ($1/mes) */}
            <div
              className="card"
              style={{
                marginBottom:0,
                border: planActivo === "verificado" ? "1.5px solid var(--green)" : "0.5px solid var(--border)",
                background: planActivo === "verificado" ? "rgba(52,211,153,0.06)" : "var(--bg1)",
                display:"flex",
                flexDirection:"column",
                justifyContent:"space-between"
              }}
            >
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:"var(--green-bg)", border:"0.5px solid var(--green-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--green)", fontSize:20 }}>
                    <i className="ti ti-rosette-discount-check" />
                  </div>
                  {planActivo === "verificado" ? (
                    <span className="pill pill-green" style={{ fontSize:10, fontWeight:700 }}>✓ ACTIVO</span>
                  ) : (
                    <span className="pill pill-gray" style={{ fontSize:10 }}>BÁSICO</span>
                  )}
                </div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Tilde de Verificación</div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--green)", marginBottom:4 }}>
                  USD 1 <span style={{ fontSize:12, color:"var(--text2)", fontWeight:400 }}>/ mes</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>
                  ≈ $1.400 ARS por mes
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                  <div>✓ Tilde verde oficial junto a tu nombre</div>
                  <div>✓ Prioridad de autenticidad frente a marcas</div>
                  <div>✓ Evita suplantaciones de identidad</div>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${planActivo === "verificado" ? "btn-outline" : "btn-green"}`}
                style={{ width:"100%" }}
                onClick={() => handleActivarPlan("verificado")}
              >
                {planActivo === "verificado" ? "✓ Plan Activo" : "Activar por USD 1/mes"}
              </button>
            </div>

            {/* PLAN 2: Recomendación a Marcas ($5/mes) */}
            <div
              className="card"
              style={{
                marginBottom:0,
                border: planActivo === "recomendado" ? "1.5px solid var(--purple)" : "0.5px solid var(--border)",
                background: planActivo === "recomendado" ? "rgba(124,58,237,0.08)" : "var(--bg1)",
                display:"flex",
                flexDirection:"column",
                justifyContent:"space-between"
              }}
            >
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:"var(--purple-bg)", border:"0.5px solid var(--purple)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--purple-lt)", fontSize:20 }}>
                    <i className="ti ti-star" />
                  </div>
                  {planActivo === "recomendado" ? (
                    <span className="pill pill-purple" style={{ fontSize:10, fontWeight:700 }}>✓ ACTIVO</span>
                  ) : (
                    <span className="pill pill-gray" style={{ fontSize:10 }}>DESTACADO</span>
                  )}
                </div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Recomendación a Marcas</div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--purple-lt)", marginBottom:4 }}>
                  USD 5 <span style={{ fontSize:12, color:"var(--text2)", fontWeight:400 }}>/ mes</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>
                  ≈ $7.000 ARS por mes
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                  <div>✓ Aparecé en el carrusel superior del catálogo</div>
                  <div>✓ Badge exclusivo "Recomendado por Io Sono"</div>
                  <div>✓ 4x más propuestas directas de marcas</div>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${planActivo === "recomendado" ? "btn-outline" : "btn-primary"}`}
                style={{ width:"100%" }}
                onClick={() => handleActivarPlan("recomendado")}
              >
                {planActivo === "recomendado" ? "✓ Plan Activo" : "Activar por USD 5/mes"}
              </button>
            </div>

            {/* PLAN 3: Top 1 en el Nicho ($15/mes) */}
            <div
              className="card"
              style={{
                marginBottom:0,
                border: planActivo === "top" ? "1.5px solid var(--amber)" : "0.5px solid var(--border)",
                background: planActivo === "top" ? "rgba(251,191,36,0.08)" : "var(--bg1)",
                display:"flex",
                flexDirection:"column",
                justifyContent:"space-between"
              }}
            >
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:"var(--amber-bg)", border:"0.5px solid var(--amber-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--amber)", fontSize:20 }}>
                    <i className="ti ti-crown" />
                  </div>
                  {planActivo === "top" ? (
                    <span className="pill pill-amber" style={{ fontSize:10, fontWeight:700 }}>✓ ACTIVO</span>
                  ) : (
                    <span className="pill pill-gray" style={{ fontSize:10 }}>EXCLUSIVO</span>
                  )}
                </div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Top 1 en el Nicho</div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--amber)", marginBottom:4 }}>
                  USD 15 <span style={{ fontSize:12, color:"var(--text2)", fontWeight:400 }}>/ mes</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>
                  ≈ $21.000 ARS por mes
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                  <div>✓ Puesto #1 garantizado en "{niche}"</div>
                  <div>✓ Corona dorada "Top del Nicho" en tu tarjeta</div>
                  <div>✓ Máximo posicionamiento frente a anunciantes</div>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${planActivo === "top" ? "btn-outline" : "btn-primary"}`}
                style={{ width:"100%", background: planActivo === "top" ? "transparent" : "#d97706", borderColor:"#d97706" }}
                onClick={() => handleActivarPlan("top")}
              >
                {planActivo === "top" ? "✓ Plan Activo" : "Activar por USD 15/mes"}
              </button>
            </div>

            {/* PLAN 4: COMBO PRO TOTAL ($15/mes - LAS 3 JUNTAS) */}
            <div
              className="card"
              style={{
                marginBottom:0,
                border: "2px solid #7c3aed",
                background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(251,191,36,0.1))",
                boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
                display:"flex",
                flexDirection:"column",
                justifyContent:"space-between",
                position:"relative"
              }}
            >
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg, #7c3aed, #d97706)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20 }}>
                    <i className="ti ti-flame" />
                  </div>
                  <span className="pill pill-amber" style={{ fontSize:10, fontWeight:800, letterSpacing:"0.05em" }}>
                    🔥 PROMO LAS 3 POR $15
                  </span>
                </div>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:2 }}>Combo Pro Total</div>
                <div style={{ fontSize:11, color:"var(--purple-lt)", fontWeight:600, marginBottom:4 }}>
                  Tilde ($1) + Recomendado ($5) + Top Nicho ($15)
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:4 }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>USD 15</div>
                  <div style={{ fontSize:12, color:"var(--text2)", textDecoration:"line-through" }}>USD 21</div>
                  <span className="pill pill-green" style={{ fontSize:9, padding:"2px 6px" }}>Ahorrás USD 6</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text2)", marginBottom:10 }}>
                  ≈ $21.000 ARS por mes
                </div>
                <div style={{ fontSize:12, color:"var(--text)", lineHeight:1.5, display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                  <div>✓ <strong>Tilde de Verificación Oficial</strong></div>
                  <div>✓ <strong>Aparición en "Recomendados a Marcas"</strong></div>
                  <div>✓ <strong>Puesto #1 Top del Nicho</strong> garantizado</div>
                  <div>✓ Máxima conversión y contratación en Io Sono</div>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${planActivo === "combo" ? "btn-outline" : "btn-primary"}`}
                style={{ width:"100%", background: planActivo === "combo" ? "transparent" : "linear-gradient(135deg, var(--purple), #6d28d9)", fontWeight:700 }}
                onClick={() => handleActivarPlan("combo")}
              >
                {planActivo === "combo" ? "✓ Combo Activo" : "¡Quiero el Combo por USD 15/mes!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 2: SERVICIOS Y TARIFAS PERSONALIZADAS ──────────────────── */}
      {activeTab === "servicios" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700 }}>Catálogo de Tarifas y Servicios</div>
              <div style={{ fontSize:12, color:"var(--text2)" }}>Activá o desactivá opciones y agregá tus propios servicios a medida</div>
            </div>
            <button
              className="btn btn-green btn-sm"
              onClick={() => setModalNewService(true)}
            >
              + Agregar servicio a medida
            </button>
          </div>

          <div className="card">
            {services.map(s => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"0.5px solid var(--border)", opacity: s.active === false ? 0.45 : 1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, paddingRight:14 }}>
                  <input
                    type="checkbox"
                    checked={s.active !== false}
                    onChange={() => handleToggleService(s.id)}
                    style={{ width:18, height:18, accentColor:"var(--purple)", cursor:"pointer" }}
                    title={s.active === false ? "Activar servicio" : "Pausar servicio"}
                  />
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                      {s.name}
                      {s.isCustom && <span className="pill pill-purple" style={{ fontSize:9, padding:"1px 6px" }}>⭐ A medida</span>}
                      {s.active === false && <span className="pill pill-gray" style={{ fontSize:9 }}>Pausado</span>}
                    </div>
                    <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                      {s.desc} {s.plazo && `· Entrega: ${s.plazo}`}
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:12, color:"var(--text2)" }}>USD</span>
                    <input
                      type="number"
                      value={s.rawPrice || 0}
                      onChange={e => handlePriceChange(s.id, e.target.value)}
                      style={{ width:75, padding:"6px 8px", background:"var(--bg2)", border:"0.5px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontWeight:700, textAlign:"right" }}
                    />
                  </div>
                  {s.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      style={{ background:"transparent", border:"none", color:"var(--red)", cursor:"pointer", fontSize:14, padding:"4px 8px" }}
                      title="Eliminar servicio personalizado"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal para crear Servicio a Medida */}
          {modalNewService && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>
                  ⭐ Agregar servicio 100% a medida
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14 }}>
                  Podés definir servicios especiales como eventos, presencia física, paquetes combo o UGC.
                </div>

                <div className="field">
                  <label>Nombre del servicio:</label>
                  <input
                    value={newSvcName}
                    onChange={e => setNewSvcName(e.target.value)}
                    placeholder="Ej: Presencia en Evento / Lanzamiento VIP"
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Tarifa en USD:</label>
                    <input
                      type="number"
                      value={newSvcPrice}
                      onChange={e => setNewSvcPrice(e.target.value)}
                      placeholder="Ej: 250"
                    />
                  </div>
                  <div className="field">
                    <label>Plazo estimado:</label>
                    <select value={newSvcPlazo} onChange={e => setNewSvcPlazo(e.target.value)}>
                      <option value="24hs">24 horas</option>
                      <option value="48hs">48 horas</option>
                      <option value="72hs">72 horas</option>
                      <option value="5 días">5 días</option>
                      <option value="A coordinar">A coordinar con la marca</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>¿Qué incluye este servicio?:</label>
                  <textarea
                    value={newSvcDesc}
                    onChange={e => setNewSvcDesc(e.target.value)}
                    placeholder="Detallá entregables (ej: Cobertura de 5 stories en vivo, mención en reel y asistencia presencial)..."
                    style={{ minHeight:75 }}
                  />
                </div>

                <div className="grid-2" style={{ marginTop:12 }}>
                  <button
                    className="btn btn-green"
                    disabled={!newSvcName.trim() || !newSvcPrice}
                    onClick={handleAddCustomService}
                  >
                    Guardar servicio a medida ↗
                  </button>
                  <button className="btn btn-outline" onClick={() => setModalNewService(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PESTAÑA 3: PORTFOLIO Y VIDEOS DE MUESTRA ──────────────────────── */}
      {activeTab === "portfolio" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700 }}>Portfolio en Video (Reels Verticales)</div>
              <div style={{ fontSize:12, color:"var(--text2)" }}>Subí o vinculá tus mejores videos para que las marcas vean cómo comunicás</div>
            </div>
            <button
              className="btn btn-green btn-sm"
              onClick={() => setModalNewPortfolio(true)}
            >
              + Agregar video de muestra
            </button>
          </div>

          {portfolio.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"36px 16px" }}>
              <i className="ti ti-video" style={{ fontSize:32, color:"var(--purple-lt)", display:"block", marginBottom:8 }} />
              <div style={{ fontSize:15, fontWeight:600 }}>Tu portfolio está vacío</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:4, marginBottom:14 }}>
                Subir al menos 1 o 2 videos multiplica tus posibilidades de contratación.
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setModalNewPortfolio(true)}>
                Agregar mi primer Reel
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {portfolio.map(p => (
                <div key={p.id} className="card" style={{ padding:"16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{p.title}</div>
                      <div style={{ fontSize:11, color:"var(--purple-lt)" }}>Marca colaboradora: {p.brand}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span className="pill pill-green" style={{ fontSize:10 }}>👁️ {p.reach}</span>
                      <span className="pill pill-purple" style={{ fontSize:10 }}>🔥 {p.eng}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePortfolio(p.id)}
                        style={{ background:"transparent", border:"none", color:"var(--red)", cursor:"pointer", fontSize:14 }}
                        title="Eliminar de mi portfolio"
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </div>

                  {p.videoUrl ? (
                    <DraftVideoPlayer videoUrl={p.videoUrl} title={p.title} />
                  ) : (
                    <div style={{ padding:"10px", background:"var(--bg2)", borderRadius:"var(--radius-sm)", fontSize:12, color:"var(--text2)" }}>
                      🔗 {p.videoUrl || "Video verificado"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modal para agregar video al portfolio */}
          {modalNewPortfolio && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>
                  🎬 Agregar video / Reel al portfolio
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14 }}>
                  Mostrá un caso de éxito real donde hayas promocionado un producto.
                </div>

                <div className="field">
                  <label>Título o concepto de la colaboración:</label>
                  <input
                    value={newPortTitle}
                    onChange={e => setNewPortTitle(e.target.value)}
                    placeholder="Ej: Unboxing y review de zapatillas urbanas"
                  />
                </div>

                <div className="field">
                  <label>Marca con la que trabajaste:</label>
                  <input
                    value={newPortBrand}
                    onChange={e => setNewPortBrand(e.target.value)}
                    placeholder="Ej: Studio Luce / Tienda Nómade"
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Alcance obtenido:</label>
                    <input
                      value={newPortReach}
                      onChange={e => setNewPortReach(e.target.value)}
                      placeholder="Ej: 54K vistas"
                    />
                  </div>
                  <div className="field">
                    <label>Engagement / Comentarios:</label>
                    <input
                      value={newPortEng}
                      onChange={e => setNewPortEng(e.target.value)}
                      placeholder="Ej: 8.4% engagement"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Enlace directo al video (.mp4 o Reel):</label>
                  <input
                    value={newPortVideoUrl}
                    onChange={e => setNewPortVideoUrl(e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/.../ForBiggerBlazes.mp4"
                  />
                </div>

                <div className="grid-2" style={{ marginTop:12 }}>
                  <button
                    className="btn btn-green"
                    disabled={!newPortTitle.trim()}
                    onClick={handleAddPortfolio}
                  >
                    Guardar en portfolio ↗
                  </button>
                  <button className="btn btn-outline" onClick={() => setModalNewPortfolio(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PESTAÑA 4: CONDICIONES PROPIAS DEL CREADOR ─────────────────────── */}
      {activeTab === "condiciones" && (
        <div className="card">
          <div className="card-title">
            <span>Pautas y exigencias para las marcas</span>
            <span style={{ fontSize:10, color:"var(--amber)" }}>Figuran antes de contratarte</span>
          </div>
          <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14, lineHeight:1.5 }}>
            Definí las reglas obligatorias que las marcas deben respetar al contratarte. Esto evita reclamos y cancelaciones innecesarias:
          </div>

          {/* Lista actual de condiciones */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {condiciones.map((c, idx) => (
              <div key={idx} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg2)", padding:"10px 14px", borderRadius:"var(--radius-sm)", border:"0.5px solid var(--border)", fontSize:12 }}>
                <span style={{ flex:1, paddingRight:10 }}>{c}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCondicion(idx)}
                  style={{ background:"transparent", border:"none", color:"var(--red)", cursor:"pointer", fontSize:14 }}
                  title="Eliminar condición"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Input para agregar condición personalizada */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input
              placeholder="Escribí una condición propia (ej: No acepto canjes sin pauta)..."
              value={nuevaCondicion}
              onChange={e => setNuevaCondicion(e.target.value)}
              style={{ flex:1, fontSize:12 }}
              onKeyDown={e => e.key === "Enter" && handleAddCondicion()}
            />
            <button
              className="btn btn-primary btn-sm"
              disabled={!nuevaCondicion.trim()}
              onClick={() => handleAddCondicion()}
            >
              + Agregar
            </button>
          </div>

          {/* Presets sugeridos con 1 clic */}
          <div style={{ borderTop:"0.5px solid var(--border)", paddingTop:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", marginBottom:8, textTransform:"uppercase" }}>
              💡 Sugerencias rápidas para agregar en 1 clic:
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {[
                "📦 Envío del producto físico con al menos 4 días de anticipación.",
                "🚫 No promociono plataformas de apuestas ni casinos online.",
                "🚫 No promociono marcas competidoras directas la misma semana.",
                "🎬 El guión debe permitirme adaptar la comunicación a mi estilo natural.",
                "⏳ El contenido permanecerá publicado un mínimo de 60 días."
              ].map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  className="pill pill-gray"
                  style={{ cursor:"pointer", fontSize:11, textAlign:"left" }}
                  onClick={() => handleAddCondicion(sug)}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 5: DATOS DE COBRO (CBU / ALIAS / LIQUIDACIÓN) ─────────── */}
      {activeTab === "cobros" && (
        <div className="card">
          <div className="card-title">
            <span>Cobros con Mercado Pago & Datos Bancarios</span>
            <span style={{ fontSize:10, color:"var(--green)" }}>🔒 Privado y encriptado</span>
          </div>

          {/* VINCULACIÓN OFICIAL CON MERCADO PAGO SPLIT */}
          <div style={{ background:"linear-gradient(135deg, rgba(0,158,227,0.14), rgba(124,58,237,0.08))", border:"1px solid rgba(0,158,227,0.35)", borderRadius:"var(--radius)", padding:"16px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:"#009ee3", color:"#fff", padding:"4px 8px", borderRadius:6, fontWeight:800, fontSize:12 }}>
                  MERCADO PAGO
                </span>
                <span style={{ fontSize:14, fontWeight:700 }}>Split de Cobros Automático</span>
              </div>
              <span className="pill pill-green" style={{ fontSize:10, fontWeight:700 }}>
                ✓ VINCULADO CON IO SONO
              </span>
            </div>
            <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.5, marginBottom:10 }}>
              Al estar conectado a Mercado Pago, el <strong>85% de cada campaña</strong> se acredita en tu cuenta automáticamente apenas la marca aprueba el borrador o finalizan las 36hs del reloj.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background:"#009ee3", color:"#fff", fontSize:11, fontWeight:600 }}
                onClick={() => {
                  alert("Tu cuenta de Mercado Pago ya se encuentra vinculada a la aplicación oficial de Daniel Monaldi (Io Sono).");
                }}
              >
                ✓ Cuenta vinculada (@{handle || "creador"})
              </button>
            </div>
          </div>

          <div style={{ background:"linear-gradient(135deg, #132219, #0a140f)", border:"1px solid var(--green)", borderRadius:"var(--radius)", padding:"12px 14px", marginBottom:16, fontSize:12, lineHeight:1.5, color:"var(--text)" }}>
            💰 <strong>Garantía de Cobro Io Sono:</strong> Una vez que la marca aprueba el borrador o transcurren las 36hs del reloj sin disputas, el monto en custodia (menos comisión de plataforma) se liquida automáticamente a esta cuenta dentro de las 24 horas hábiles.
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Alias CBU / CVU:</label>
              <input
                value={banco.alias || ""}
                onChange={e => setBanco(prev => ({ ...prev, alias: e.target.value.toUpperCase() }))}
                placeholder="DANI.MONALDI.MP"
              />
            </div>
            <div className="field">
              <label>CBU / CVU (22 dígitos):</label>
              <input
                value={banco.cbu || ""}
                onChange={e => setBanco(prev => ({ ...prev, cbu: e.target.value }))}
                placeholder="0000003100045892348911"
              />
            </div>
          </div>

          <div className="grid-3" style={{ marginTop:10 }}>
            <div className="field">
              <label>Nombre y Apellido del Titular:</label>
              <input
                value={banco.titular || ""}
                onChange={e => setBanco(prev => ({ ...prev, titular: e.target.value }))}
                placeholder="Daniel Monaldi"
              />
            </div>
            <div className="field">
              <label>CUIT / CUIL del Titular:</label>
              <input
                value={banco.cuit || ""}
                onChange={e => setBanco(prev => ({ ...prev, cuit: e.target.value }))}
                placeholder="20-38491203-9"
              />
            </div>
            <div className="field">
              <label>Banco o Billetera Virtual:</label>
              <input
                value={banco.banco || ""}
                onChange={e => setBanco(prev => ({ ...prev, banco: e.target.value }))}
                placeholder="Mercado Pago / Santander"
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop:16 }}
            onClick={handleGuardarCambios}
          >
            Guardar datos bancarios ✓
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CENTRO DE CONTROL, DELEGACIÓN Y MEDIACIÓN ANTIFRAUDE ────────────────────
function AdminDashboard({ user, campañas, onUpdateCampaña, onNav, influencersList = [] }) {
  const [activeMediador, setActiveMediador] = useState("Daniel Monaldi (Super Admin)");
  const [tabAdmin, setTabAdmin] = useState("reclamos"); // "reclamos" | "finanzas" | "equipo" | "historial"
  const [filtroTipo, setFiltroTipo] = useState("todos"); // "todos" | "cancelaciones" | "disputas" | "mis_casos"
  const [mediadoresList, setMediadoresList] = useState([
    { id: "daniel", name: "Daniel Monaldi", rol: "Super Admin (Propietario)", activo: true, email: "danielmonaldi@gmail.com", casos: 12 },
    { id: "med_1", name: "Mediador 1 (Juan)", rol: "Mediador de Reclamos", activo: true, email: "juan.soporte@iosono.com", casos: 6 },
    { id: "med_2", name: "Mediador 2 (Sofía)", rol: "Mediador de Reclamos", activo: true, email: "sofia.soporte@iosono.com", casos: 4 }
  ]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [modalNuevoMed, setModalNuevoMed] = useState(false);

  // ¿Tiene permisos de Super Admin?
  const isSuperAdmin = activeMediador.includes("Super Admin") || activeMediador.includes("Daniel");

  // Reclamos activos que requieren auditoría humana
  const casosReclamo = campañas.filter(c => 
    c.estado === "cancelacion_en_revision" || 
    c.estado === "disputa"
  );

  // Casos resueltos para auditoría histórica
  const casosResueltos = campañas.filter(c =>
    c.estado === "cancelado_50" ||
    c.estado === "cancelado_fraude" ||
    c.estado === "reembolso_total" ||
    c.resolucion
  );

  const casosFiltrados = casosReclamo.filter(c => {
    if (filtroTipo === "cancelaciones") return c.estado === "cancelacion_en_revision";
    if (filtroTipo === "disputas") return c.estado === "disputa";
    if (filtroTipo === "mis_casos") {
      const asignado = c.asignado_a || "Daniel Monaldi";
      if (activeMediador.includes("Super Admin")) return asignado.includes("Daniel");
      if (activeMediador.includes("Juan")) return asignado.includes("Juan");
      if (activeMediador.includes("Sofía")) return asignado.includes("Sofía");
      return asignado === activeMediador;
    }
    return true;
  });

  // Métricas financieras calculadas para Super Admin
  const totalEnCustodia = campañas
    .filter(c => c.estado !== "finalizado" && c.estado !== "cancelado_fraude" && c.estado !== "reembolso_total" && c.estado !== "rechazado")
    .reduce((acc, c) => acc + (c.monto || 0), 0);

  const comisionIoSono = totalEnCustodia * 0.15;

  // Creadores con suscripción Pro Boost activa y cálculo de MRR
  const listaInfluencers = influencersList.length > 0 ? influencersList : INITIAL_INFLUENCERS;
  const influencersConPlan = listaInfluencers.filter(inf => Boolean(inf.planActivo));
  const mrrTotal = influencersConPlan.reduce((acc, inf) => {
    if (inf.planActivo === "verificado") return acc + 1;
    if (inf.planActivo === "recomendado") return acc + 5;
    if (inf.planActivo === "top") return acc + 15;
    if (inf.planActivo === "combo") return acc + 15;
    return acc;
  }, 0);
  const facturacionTotalProyectada = comisionIoSono + mrrTotal;

  const [textoConsulta, setTextoConsulta] = useState({});
  const [destinatarioConsulta, setDestinatarioConsulta] = useState({});
  const [mensajeEnviadoExito, setMensajeEnviadoExito] = useState({});

  const handleResolver = (camp, nuevoEstado, resolucionTexto) => {
    const lista = camp.mensajes || [];
    const dictamenMsg = {
      id: Date.now(),
      sender: "mediacion",
      autor: `${activeMediador} (Io Sono)`,
      destinatario: "ambos",
      texto: `⚖️ DICTAMEN OFICIAL: ${resolucionTexto}`,
      time: "Recién"
    };
    onUpdateCampaña({
      ...camp,
      estado: nuevoEstado,
      resolucion: resolucionTexto,
      resuelto_por: activeMediador,
      fecha_resolucion: new Date().toISOString(),
      mensajes: [...lista, dictamenMsg]
    });
  };

  const handleEnviarConsulta = (c) => {
    const txt = (textoConsulta[c.id] || "").trim();
    if (!txt) return;
    const dest = destinatarioConsulta[c.id] || "ambos";
    const lista = c.mensajes || [];
    const nuevoMsg = {
      id: Date.now(),
      sender: "mediacion",
      autor: `${activeMediador}`,
      destinatario: dest,
      texto: txt,
      time: "Recién"
    };
    onUpdateCampaña({
      ...c,
      mensajes: [...lista, nuevoMsg]
    });
    setTextoConsulta(prev => ({ ...prev, [c.id]: "" }));
    setMensajeEnviadoExito(prev => ({ ...prev, [c.id]: true }));
    setTimeout(() => {
      setMensajeEnviadoExito(prev => ({ ...prev, [c.id]: false }));
    }, 4000);
  };

  const handleAsignar = (camp, nuevoAsignado) => {
    onUpdateCampaña({
      ...camp,
      asignado_a: nuevoAsignado
    });
  };

  const handleCrearMediador = (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    const nuevo = {
      id: `med_${Date.now()}`,
      name: nuevoNombre,
      rol: "Mediador de Reclamos",
      activo: true,
      email: nuevoEmail || "soporte@iosono.com",
      casos: 0
    };
    setMediadoresList(prev => [...prev, nuevo]);
    setNuevoNombre("");
    setNuevoEmail("");
    setModalNuevoMed(false);
  };

  const toggleEstadoMediador = (id) => {
    setMediadoresList(prev => prev.map(m => m.id === id ? { ...m, activo: !m.activo } : m));
  };

  return (
    <div style={{ paddingTop:8 }}>
      {/* Tarjeta de Encabezado y Selector de Delegación */}
      <div className="card" style={{ background:"linear-gradient(135deg, #181126, #0e0d14)", border:"1px solid #4c2d8a", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--purple-lt)", fontWeight:600 }}>
              Centro de Control & Mediación Io Sono
            </div>
            <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>
              {isSuperAdmin ? "👑 Panel de Daniel Monaldi" : `🛡️ Vista de ${activeMediador}`}
            </div>
          </div>
          <span className="pill pill-purple" style={{ fontSize:11, fontWeight:600 }}>
            {casosReclamo.length} reclamo{casosReclamo.length === 1 ? "" : "s"} abierto{casosReclamo.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Selector de Delegación / Modo de Gestión solicitado por Daniel */}
        <div style={{ background:"var(--bg)", padding:"10px 14px", borderRadius:"var(--radius-sm)", border:"0.5px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ fontSize:12, color:"var(--text2)", display:"flex", alignItems:"center", gap:6 }}>
            <i className="ti ti-users" style={{ color:"var(--purple-lt)", fontSize:16 }} />
            <span><strong>Modo de gestión:</strong></span>
          </div>
          <select
            value={activeMediador}
            onChange={e => {
              setActiveMediador(e.target.value);
              if (!e.target.value.includes("Super Admin") && !e.target.value.includes("Daniel")) {
                setTabAdmin("reclamos");
              }
            }}
            style={{ background:"var(--bg2)", color:"var(--text)", border:"1px solid var(--purple)", borderRadius:"var(--radius-sm)", padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}
          >
            <option value="Daniel Monaldi (Super Admin)">👑 Administrar yo (Super Admin - Acceso Total)</option>
            {mediadoresList.filter(m => m.id !== "daniel").map(m => (
              <option key={m.id} value={`${m.name} (${m.rol})`}>
                🛡️ {m.name} {m.activo ? "(Activo)" : "(En pausa)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensaje de aislamiento para mediadores delegados */}
      {!isSuperAdmin && (
        <div style={{ background:"var(--purple-bg)", border:"0.5px solid var(--purple)", borderRadius:"var(--radius-sm)", padding:"10px 14px", fontSize:12, color:"var(--purple-lt)", marginBottom:14, lineHeight:1.5 }}>
          🛡️ <strong>Modo Mediador Activo:</strong> Tu perfil tiene permisos restringidos exclusivamente a la bandeja de quejas y cancelaciones. No podés ver balances financieros, comisiones de la plataforma ni datos privados de la empresa.
        </div>
      )}

      {/* Pestañas Super Admin vs Mediador */}
      <div className="toggle-bar">
        <button className={`toggle-btn ${tabAdmin==="reclamos"?"active":""}`} onClick={() => setTabAdmin("reclamos")}>
          <i className="ti ti-alert-triangle" /> Reclamos ({casosReclamo.length})
        </button>
        {isSuperAdmin && (
          <>
            <button className={`toggle-btn ${tabAdmin==="finanzas"?"active":""}`} onClick={() => setTabAdmin("finanzas")}>
              <i className="ti ti-wallet" /> Finanzas & Custodia
            </button>
            <button className={`toggle-btn ${tabAdmin==="equipo"?"active":""}`} onClick={() => setTabAdmin("equipo")}>
              <i className="ti ti-user-check" /> Equipo Mediadores ({mediadoresList.length})
            </button>
          </>
        )}
        <button className={`toggle-btn ${tabAdmin==="historial"?"active":""}`} onClick={() => setTabAdmin("historial")}>
          <i className="ti ti-history" /> Historial ({casosResueltos.length})
        </button>
      </div>

      {/* PESTAÑA 1: RECLAMOS & CANCELACIONES ANTIFRAUDE */}
      {tabAdmin === "reclamos" && (
        <div>
          {/* Filtros de la bandeja */}
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:10, marginBottom:12 }}>
            <button
              className={`pill ${filtroTipo==="todos"?"pill-purple":"pill-gray"}`}
              style={{ cursor:"pointer" }}
              onClick={() => setFiltroTipo("todos")}
            >
              Todos ({casosReclamo.length})
            </button>
            <button
              className={`pill ${filtroTipo==="cancelaciones"?"pill-amber":"pill-gray"}`}
              style={{ cursor:"pointer" }}
              onClick={() => setFiltroTipo("cancelaciones")}
            >
              🚨 Cancelaciones ({campañas.filter(c => c.estado==="cancelacion_en_revision").length})
            </button>
            <button
              className={`pill ${filtroTipo==="disputas"?"pill-red":"pill-gray"}`}
              style={{ cursor:"pointer" }}
              onClick={() => setFiltroTipo("disputas")}
            >
              ⏱️ Disputas 36hs ({campañas.filter(c => c.estado==="disputa").length})
            </button>
            <button
              className={`pill ${filtroTipo==="mis_casos"?"pill-green":"pill-gray"}`}
              style={{ cursor:"pointer" }}
              onClick={() => setFiltroTipo("mis_casos")}
            >
              👤 Asignados a mí
            </button>
          </div>

          {casosFiltrados.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"36px 16px" }}>
              <i className="ti ti-circle-check" style={{ fontSize:36, color:"var(--green)", display:"block", marginBottom:8 }} />
              <div style={{ fontSize:15, fontWeight:600 }}>¡No hay reclamos en esta sección!</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:4 }}>
                Todas las campañas están en curso pacífico o ya fueron resueltas.
              </div>
            </div>
          ) : (
            casosFiltrados.map(c => (
              <div key={c.id} className="card" style={{ borderLeft:`4px solid ${c.estado==="cancelacion_en_revision"?"var(--amber)":"var(--red)"}`, marginBottom:16 }}>
                {/* Encabezado del caso */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <span className={`pill ${c.estado==="cancelacion_en_revision"?"pill-amber":"pill-red"}`} style={{ fontSize:10, marginBottom:4 }}>
                      {c.estado === "cancelacion_en_revision" ? "🚨 Solicitud de Cancelación de Borrador (Antifraude)" : "⏱️ Reclamo durante el reloj de 36hs"}
                    </span>
                    <div style={{ fontSize:16, fontWeight:700, marginTop:4 }}>
                      {c.servicio_nombre} · <span style={{ color:"var(--purple-lt)" }}>USD {c.monto} en custodia</span>
                    </div>
                    <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                      Marca: <strong>{c.marca_nombre}</strong> ↔ Influencer: <strong>{c.influencer_nombre}</strong> ({c.influencer_handle})
                    </div>
                  </div>
                </div>

                {/* Desplegable de Asignación / Delegación del Caso */}
                <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:12, color:"var(--text2)", display:"flex", alignItems:"center", gap:5 }}>
                    <i className="ti ti-user-check" style={{ color:"var(--purple-lt)" }} />
                    <strong>Asignado para dictamen:</strong>
                  </span>
                  <select
                    value={c.asignado_a || "Daniel Monaldi"}
                    onChange={e => handleAsignar(c, e.target.value)}
                    style={{ background:"var(--bg)", border:"0.5px solid var(--border)", color:"var(--text)", padding:"4px 8px", borderRadius:"var(--radius-sm)", fontSize:12, fontWeight:500 }}
                  >
                    <option value="Daniel Monaldi">👑 Daniel Monaldi (Super Admin)</option>
                    {mediadoresList.filter(m => m.id !== "daniel").map(m => (
                      <option key={m.id} value={m.name}>🛡️ {m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Comparativa de Auditoría */}
                <div style={{ background:"var(--bg)", borderRadius:"var(--radius-sm)", padding:"12px 14px", border:"0.5px solid var(--border)", marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
                    1. Pautas y restricciones pactadas:
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                    {c.restricciones?.map((r, i) => (
                      <span key={i} style={{ fontSize:11, color:r.includes("🚫")?"var(--red)":"var(--purple-lt)", background:"var(--bg2)", padding:"2px 8px", borderRadius:4 }}>
                        {r}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                    2. Prueba cargada por el influencer:
                  </div>
                  {c.borrador_video_url ? (
                    <div style={{ marginBottom: 10 }}>
                      <DraftVideoPlayer
                        videoUrl={c.borrador_video_url}
                        externalUrl={c.borrador_url}
                        title={`Video borrador de ${c.influencer_nombre}`}
                        nota={c.borrador_nota}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:"var(--text)", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, background:"var(--bg2)", padding:"6px 10px", borderRadius:4 }}>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"280px" }}>
                        {c.borrador_url || c.publicado_link || "Sin enlace cargado"}
                      </span>
                      <a href={c.borrador_url || c.publicado_link || "#"} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{ padding:"3px 8px", fontSize:11 }}>
                        Ver contenido ↗
                      </a>
                    </div>
                  )}

                  <div style={{ fontSize:11, fontWeight:600, color:"var(--red)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                    3. Denuncia y motivo del reclamo de la marca:
                  </div>
                  <div style={{ fontSize:12, color:"var(--text)", background:"var(--red-bg)", padding:"8px 10px", borderRadius:4, border:"0.5px solid var(--red-border)", lineHeight:1.4 }}>
                    "{c.motivo_cancelacion || c.motivo_disputa || "Sin detalle aportado por la marca."}"
                  </div>
                </div>

                {/* ─── CANAL DE COMUNICACIÓN DIRECTA DE MEDIACIÓN ─── */}
                <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"12px 14px", marginBottom:14, border:"0.5px solid var(--purple)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--purple-lt)", display:"flex", alignItems:"center", gap:6 }}>
                      <i className="ti ti-messages" /> Intervenir y consultar a las partes
                    </div>
                    <span style={{ fontSize:10, color:"var(--text2)" }}>Llega al chat de la campaña y por email</span>
                  </div>

                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <select
                      value={destinatarioConsulta[c.id] || "ambos"}
                      onChange={e => setDestinatarioConsulta(prev => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ fontSize:11, background:"var(--bg)", color:"var(--text)", border:"0.5px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"5px 8px" }}
                    >
                      <option value="ambos">📢 A ambas partes (Chat oficial)</option>
                      <option value="marca">🏢 Solo a la Marca ({c.marca_nombre})</option>
                      <option value="influencer">🎬 Solo al Influencer ({c.influencer_nombre})</option>
                    </select>
                  </div>

                  <div style={{ display:"flex", gap:8 }}>
                    <input
                      placeholder={`Escribí una consulta oficial para ${destinatarioConsulta[c.id] === "marca" ? "la marca" : destinatarioConsulta[c.id] === "influencer" ? "el influencer" : "ambas partes"}...`}
                      value={textoConsulta[c.id] || ""}
                      onChange={e => setTextoConsulta(prev => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ flex:1, fontSize:12, padding:"8px 12px", background:"var(--bg)", border:"0.5px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text)" }}
                      onKeyDown={e => {
                        if (e.key === "Enter" && (textoConsulta[c.id] || "").trim()) {
                          handleEnviarConsulta(c);
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEnviarConsulta(c)}
                      disabled={!(textoConsulta[c.id] || "").trim()}
                      style={{ flexShrink:0 }}
                    >
                      <i className="ti ti-send" /> Enviar
                    </button>
                  </div>

                  {mensajeEnviadoExito[c.id] && (
                    <div style={{ fontSize:11, color:"var(--green)", marginTop:8, display:"flex", alignItems:"center", gap:5 }}>
                      <i className="ti ti-check" /> Mensaje oficial enviado con éxito. Las partes fueron notificadas y pueden responderte en el chat.
                    </div>
                  )}
                </div>

                {/* Acciones de Resolución en 1 Clic */}
                <div style={{ borderTop:"0.5px solid var(--border)", paddingTop:12 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text2)", marginBottom:8 }}>
                    Emitir dictamen oficial de Io Sono:
                  </div>

                  {c.estado === "cancelacion_en_revision" ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ justifyContent:"flex-start", textAlign:"left", padding:"9px 12px" }}
                        onClick={() => handleResolver(c, "cancelado_50", "Cancelación de buena fe autorizada. Se compensó al influencer con el 50% por jornada de trabajo y se reintegró el 50% a la marca.")}
                      >
                        <div>
                          <strong>✓ Aprobar cancelación con 50% al influencer</strong>
                          <div style={{ fontSize:11, opacity:0.8 }}>El trabajo fue de buena fe. Influencer cobra USD {(c.monto*0.5).toFixed(2)} · Marca recupera USD {(c.monto*0.5).toFixed(2)}</div>
                        </div>
                      </button>

                      <button
                        className="btn btn-red btn-sm"
                        style={{ justifyContent:"flex-start", textAlign:"left", padding:"9px 12px" }}
                        onClick={() => handleResolver(c, "cancelado_fraude", "Fraude o borrador inválido. Se reintegró el 100% a la marca y se aplicó penalización al influencer.")}
                      >
                        <div>
                          <strong>🚫 Borrador fraudulento / Inválido (100% Reembolso Marca)</strong>
                          <div style={{ fontSize:11, opacity:0.8 }}>Devolución de USD {c.monto} a la marca · El influencer no cobra nada por falta grave</div>
                        </div>
                      </button>

                      <button
                        className="btn btn-outline btn-sm"
                        style={{ justifyContent:"flex-start", textAlign:"left", padding:"9px 12px" }}
                        onClick={() => handleResolver(c, "borrador_enviado", "Cancelación desestimada. El borrador cumple las directivas; la marca debe solicitar ajustes puntuales de planos/audio.")}
                      >
                        <div>
                          <strong>🔄 Desestimar cancelación (Exigir ajustes y continuar)</strong>
                          <div style={{ fontSize:11, opacity:0.8 }}>El borrador es rescatable. Reanuda la campaña para que la marca pida correcciones de edición</div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <button
                        className="btn btn-green btn-sm"
                        style={{ justifyContent:"flex-start", textAlign:"left", padding:"9px 12px" }}
                        onClick={() => handleResolver(c, "finalizado", "El contenido publicado respetó todas las directivas obligatorias. Reclamo desestimado y pago liberado.")}
                      >
                        <div>
                          <strong>✓ Desestimar queja (Liberar 100% al influencer)</strong>
                          <div style={{ fontSize:11, opacity:0.8 }}>La publicación cumple las pautas. Se liquidan USD {c.monto} al influencer.</div>
                        </div>
                      </button>

                      <button
                        className="btn btn-red btn-sm"
                        style={{ justifyContent:"flex-start", textAlign:"left", padding:"9px 12px" }}
                        onClick={() => handleResolver(c, "reembolso_total", "Influencer violó restricciones pactadas en la publicación real. Reembolso total a la marca.")}
                      >
                        <div>
                          <strong>💰 Reclamo justificado (Reembolsar 100% a la Marca)</strong>
                          <div style={{ fontSize:11, opacity:0.8 }}>El influencer no respetó las pautas pactadas. Se devuelven USD {c.monto} a la marca.</div>
                        </div>
                      </button>

                      <button
                        className="btn btn-outline btn-sm"
                        style={{ justifyContent:"flex-start", textAlign:"left", padding:"9px 12px" }}
                        onClick={() => handleResolver(c, "cancelado_50", "Acuerdo salomónico de mediación 50/50.")}
                      >
                        <div>
                          <strong>⚖️ Acuerdo intermedio (50% a cada uno)</strong>
                          <div style={{ fontSize:11, opacity:0.8 }}>División de USD {(c.monto*0.5).toFixed(2)} para cada parte para cerrar el conflicto</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PESTAÑA 2: FINANZAS Y CUSTODIA (SOLO SUPER ADMIN) */}
      {tabAdmin === "finanzas" && isSuperAdmin && (
        <div>
          <div className="grid-3" style={{ marginBottom:14 }}>
            <div className="card" style={{ padding:"16px", textAlign:"center", marginBottom:0 }}>
              <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>
                Total en Custodia (Escrow)
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:"var(--green)" }}>
                USD {totalEnCustodia.toFixed(2)}
              </div>
              <div style={{ fontSize:10, color:"var(--text2)", marginTop:2 }}>
                ≈ ${(totalEnCustodia * 1400).toLocaleString("es-AR")} ARS
              </div>
            </div>

            <div className="card" style={{ padding:"16px", textAlign:"center", marginBottom:0 }}>
              <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>
                Comisiones Campañas (15%)
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:"var(--purple-lt)" }}>
                USD {comisionIoSono.toFixed(2)}
              </div>
              <div style={{ fontSize:10, color:"var(--text2)", marginTop:2 }}>
                Take-rate de intermediación
              </div>
            </div>

            <div className="card" style={{ padding:"16px", textAlign:"center", marginBottom:0, border:"1px solid var(--amber-border)", background:"rgba(251,191,36,0.06)" }}>
              <div style={{ fontSize:11, color:"var(--amber)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4, fontWeight:700 }}>
                🚀 Facturación Extra (MRR)
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:"var(--amber)" }}>
                USD {mrrTotal.toFixed(2)} <span style={{ fontSize:11, fontWeight:400 }}>/ mes</span>
              </div>
              <div style={{ fontSize:10, color:"var(--text2)", marginTop:2 }}>
                {influencersConPlan.length} creador{influencersConPlan.length === 1 ? "" : "es"} Pro suscrito{influencersConPlan.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Tarjeta de Consolidado Financiero Total */}
          <div className="card" style={{ background:"linear-gradient(135deg, #1b122c, #0e0a17)", border:"1.5px solid var(--purple)", marginBottom:14, padding:"16px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--purple-lt)", fontWeight:700 }}>
                  Ingresos Totales Proyectados de Io Sono
                </div>
                <div style={{ fontSize:24, fontWeight:800, marginTop:3 }}>
                  USD {facturacionTotalProyectada.toFixed(2)} <span style={{ fontSize:13, fontWeight:400, color:"var(--text2)" }}>≈ ${(facturacionTotalProyectada * 1400).toLocaleString("es-AR")} ARS</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text2)", marginTop:3 }}>
                  Comisiones 15% escrow (USD {comisionIoSono.toFixed(2)}) + Suscripciones recurrentes (USD {mrrTotal.toFixed(2)})
                </div>
              </div>
              <span className="pill pill-green" style={{ fontSize:11, fontWeight:700 }}>
                ✓ NEGOCIO RENTABLE
              </span>
            </div>
          </div>

          {/* Tabla de Creadores con Planes Pro Activos */}
          <div className="card" style={{ marginBottom:14 }}>
            <div className="card-title">
              <span>Creadores con Suscripción Pro Boost Activa ({influencersConPlan.length})</span>
              <span style={{ fontSize:11, color:"var(--amber)", fontWeight:700 }}>MRR: USD {mrrTotal}/mes</span>
            </div>

            {influencersConPlan.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px", color:"var(--text2)", fontSize:12 }}>
                Aún no hay creadores con suscripciones activas.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {influencersConPlan.map(inf => {
                  const planPrecio = inf.planActivo === "verificado" ? 1 : inf.planActivo === "recomendado" ? 5 : 15;
                  const planEtiqueta = 
                    inf.planActivo === "combo" ? "🔥 Combo Pro Total ($15/mes)" :
                    inf.planActivo === "top" ? "👑 Top del Nicho ($15/mes)" :
                    inf.planActivo === "recomendado" ? "⭐ Recomendado a Marcas ($5/mes)" :
                    "🛡️ Tilde de Verificación ($1/mes)";

                  return (
                    <div
                      key={inf.id}
                      style={{
                        display:"flex",
                        justifyContent:"space-between",
                        alignItems:"center",
                        padding:"10px 12px",
                        background:"var(--bg2)",
                        border:"0.5px solid var(--border)",
                        borderRadius:"var(--radius-sm)",
                        flexWrap:"wrap",
                        gap:8
                      }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <AvatarEl initials={inf.initials} fotoUrl={inf.fotoUrl} size="sm" />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                            {inf.name}
                            <span style={{ fontSize:11, color:"var(--text2)" }}>{inf.handle}</span>
                          </div>
                          <div style={{ fontSize:11, color:"var(--purple-lt)" }}>
                            {planEtiqueta} · {inf.niche}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--green)" }}>
                          +USD {planPrecio} / mes
                        </div>
                        <div style={{ fontSize:10, color:"var(--text2)" }}>
                          Vence: {inf.planVence || "30 días"} · <span style={{ color:"var(--green)" }}>Activo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desglose de Fondos por Campaña */}
          <div className="card">
            <div className="card-title">Desglose de Fondos por Campaña (Escrow)</div>
            {campañas.map(c => (
              <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"0.5px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{c.servicio_nombre} · {c.marca_nombre}</div>
                  <div style={{ fontSize:11, color:"var(--text2)" }}>Estado: {c.estado}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>USD {c.monto}</div>
                  <div style={{ fontSize:10, color:"var(--purple-lt)" }}>Comisión (15%): USD {(c.monto * 0.15).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: EQUIPO DE MEDIADORES (SOLO SUPER ADMIN) */}
      {tabAdmin === "equipo" && isSuperAdmin && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:13, color:"var(--text2)" }}>
              Equipo autorizado para mediar quejas y cancelaciones:
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setModalNuevoMed(true)}>
              + Agregar mediador
            </button>
          </div>

          {mediadoresList.map(m => (
            <div key={m.id} className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                  {m.id === "daniel" ? "👑" : "🛡️"} {m.name}
                  {m.id === "daniel" && <span className="pill pill-purple" style={{ fontSize:9 }}>Propietario</span>}
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>{m.email} · {m.rol}</div>
                <div style={{ fontSize:11, color:"var(--green)", marginTop:4 }}>✓ {m.casos || 0} casos resueltos</div>
              </div>

              {m.id !== "daniel" && (
                <button
                  className={`btn btn-sm ${m.activo ? "btn-outline" : "btn-green"}`}
                  onClick={() => toggleEstadoMediador(m.id)}
                >
                  {m.activo ? "Pausar acceso" : "Reactivar"}
                </button>
              )}
            </div>
          ))}

          {modalNuevoMed && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>Agregar nuevo Mediador al equipo</div>
                <form onSubmit={handleCrearMediador}>
                  <div className="field">
                    <label>Nombre del mediador *</label>
                    <input placeholder="Ej: Mediador 3 (Lucas)" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Email de acceso *</label>
                    <input type="email" placeholder="lucas.soporte@iosono.com" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} required />
                  </div>
                  <div style={{ fontSize:11, color:"var(--text2)", marginBottom:14, background:"var(--bg2)", padding:"8px 10px", borderRadius:4 }}>
                    🔒 <strong>Permisos otorgados:</strong> Este colaborador únicamente podrá acceder a la bandeja de quejas y cancelaciones para dictaminar. No tendrá acceso a las finanzas ni configuración global.
                  </div>
                  <div className="grid-2">
                    <button className="btn btn-primary" type="submit">Crear y habilitar</button>
                    <button className="btn btn-outline" type="button" onClick={() => setModalNuevoMed(false)}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: HISTORIAL DE DICTÁMENES */}
      {tabAdmin === "historial" && (
        <div>
          {casosResueltos.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"30px" }}>
              <div style={{ fontSize:14, color:"var(--text2)" }}>Aún no hay dictámenes emitidos en el historial.</div>
            </div>
          ) : (
            casosResueltos.map(c => (
              <div key={c.id} className="card" style={{ padding:"16px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>{c.servicio_nombre} · USD {c.monto}</span>
                  <span className={`pill ${c.estado==="cancelado_fraude"?"pill-red":c.estado==="cancelado_50"?"pill-purple":"pill-green"}`} style={{ fontSize:10 }}>
                    {c.estado === "cancelado_fraude" ? "Cancelado por Fraude" : c.estado === "cancelado_50" ? "Cancelado (50% cubierto)" : "Finalizado y Pagado"}
                  </span>
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:6 }}>
                  Partes: <strong>{c.marca_nombre}</strong> ↔ <strong>{c.influencer_nombre}</strong>
                </div>
                <div style={{ fontSize:12, background:"var(--bg2)", padding:"8px 12px", borderRadius:4, borderLeft:"3px solid var(--purple-lt)" }}>
                  <strong>Dictamen Io Sono:</strong> {c.resolucion || "Caso resuelto conforme a las pautas del servicio."}
                  {c.resuelto_por && <div style={{ fontSize:10, color:"var(--text2)", marginTop:3 }}>Dictaminado por: {c.resuelto_por}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOGIN & MI CUENTA CON 2FA GOOGLE AUTHENTICATOR ───────────────────────────
function Login({ onNav, onLogin, user }) {
  const [step, setStep] = useState("credentials"); // "credentials" | "2fa"
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleStep1 = async () => {
    setError("");
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !pass) {
      setError("Completá usuario y contraseña.");
      return;
    }

    // Validación Maestro Daniel Monaldi
    if (cleanUser === MASTER_USERNAME && pass === MASTER_PASSWORD) {
      setStep("2fa");
      return;
    }

    // Validación Supabase para otros usuarios/marcas
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: cleanUser, password: pass });
    setLoading(false);
    if (authError) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", data.user.id).single();
    onLogin({
      id: data.user.id,
      role: perfil?.rol || "marca",
      email: perfil?.email || cleanUser,
      name: perfil?.nombre || cleanUser,
      is2FAVerified: false
    });
  };

  const handleVerify2FA = async () => {
    setError("");
    const cleanCode = totpCode.trim();
    if (cleanCode.length !== 6) {
      setError("Ingresá los 6 dígitos del código de Google Authenticator.");
      return;
    }

    setLoading(true);
    const isValid = await verifyGoogleAuthCode(cleanCode, MASTER_2FA_SECRET);
    setLoading(false);

    if (isValid) {
      const masterUser = {
        id: "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
        role: "influencer",
        name: "Daniel Monaldi",
        email: "danielmonaldi@gmail.com",
        isMaster: true,
        is2FAVerified: true
      };
      onLogin(masterUser);
    } else {
      setError("Código de Google Authenticator inválido o expirado. Verificá el código actual en la app.");
    }
  };

  const copiarClave = () => {
    navigator.clipboard?.writeText(MASTER_2FA_SECRET);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (user && user.is2FAVerified) {
    return (
      <div style={{ maxWidth: 460, margin: "30px auto 0" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <AvatarEl initials={user.name?.slice(0, 2).toUpperCase()} size="lg" />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{user.email || "danielmonaldi@gmail.com"}</div>
              <span className="pill pill-green" style={{ fontSize: 11, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <i className="ti ti-shield-check" /> 2FA Google Authenticator Verificado
              </span>
            </div>
          </div>

          {/* Accesos rápidos de Daniel */}
          <div style={{ background: "linear-gradient(135deg, #1d1230, #140d24)", border: "1px solid var(--purple)", borderRadius: "var(--radius)", padding: "16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <i className="ti ti-crown" style={{ fontSize: 20, color: "var(--amber)" }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Cuenta Maestra Activa</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, lineHeight: 1.5 }}>
              Tenés acceso irrestricto para gestionar campañas de marcas, tu perfil de influencer y el panel general de resolución y arbitraje de pagos.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button className="btn btn-primary" onClick={() => onNav("admin")}>
                👑 Panel Admin
              </button>
              <button className="btn btn-outline" style={{ borderColor: "var(--purple)", color: "var(--purple-lt)" }} onClick={() => onNav("editor_perfil")}>
                ✨ Mi Media Kit
              </button>
            </div>
          </div>

          <button className="btn btn-outline btn-full" onClick={() => onLogin(null)}>
            Cerrar sesión segura
          </button>
        </div>
      </div>
    );
  }

  const qrUri = `otpauth://totp/IoSono:${MASTER_USERNAME}?secret=${MASTER_2FA_SECRET}&issuer=IoSono`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=20&data=${encodeURIComponent(qrUri)}`;

  return (
    <div style={{ maxWidth: 420, margin: "30px auto 0" }}>
      <div className="card">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", textAlign: "center", marginBottom: 4 }}>
          <span style={{ color: "var(--purple-lt)", fontStyle: "italic" }}>Io</span> Sono
        </div>
        <div style={{ fontSize: 11, color: "var(--text2)", textAlign: "center", marginBottom: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Acceso Seguro & Autenticación 2FA
        </div>

        {error && (
          <div style={{ background: "var(--red-bg)", border: "0.5px solid var(--red-border)", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--red)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === "credentials" ? (
          <div>
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "var(--radius-sm)", padding: "12px", marginBottom: 18, textAlign: "center" }}>
              <i className="ti ti-lock" style={{ fontSize: 22, color: "var(--purple-lt)", marginBottom: 4, display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Ingreso con Credenciales</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                Paso 1 de 2: Verificá tu usuario y contraseña
              </div>
            </div>

            <div className="field">
              <label>Usuario o Email</label>
              <input
                type="text"
                placeholder="danielmonaldi"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoCapitalize="none"
              />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleStep1()}
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              style={{ fontWeight: 700, padding: "12px", marginTop: 8 }}
              onClick={handleStep1}
              disabled={loading}
            >
              {loading ? "Comprobando..." : "Siguiente: Verificación 2FA →"}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-sm)", padding: "12px", marginBottom: 16, textAlign: "center" }}>
              <i className="ti ti-shield-check" style={{ fontSize: 24, color: "var(--green)", marginBottom: 4, display: "block" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Verificación Google Authenticator</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                Paso 2 de 2: Protección de alta seguridad contra hackeos
              </div>
            </div>

            {/* Acceso directo si estás desde el celular */}
            <a
              href={qrUri}
              className="btn btn-primary btn-full"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                marginBottom: 16,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)"
              }}
            >
              <i className="ti ti-device-mobile" style={{ fontSize: 18 }} />
              <span>📲 Vincular con 1 toque en tu celular</span>
            </a>

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                O escanear el QR desde la app:
              </div>
              <div style={{ display: "inline-block", background: "#fff", padding: "12px", borderRadius: "14px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                <img
                  src={qrImgUrl}
                  alt="QR Google Authenticator"
                  width={180}
                  height={180}
                  style={{ display: "block", borderRadius: "6px" }}
                />
              </div>
            </div>

            {/* Alternativa Manual Fácil sin escanear */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px", marginBottom: 16, textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>🔑 O ingresar la clave manual:</span>
                <button
                  type="button"
                  onClick={copiarClave}
                  style={{ background: "var(--purple)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  {copiado ? "✓ ¡Copiado!" : "Copiar clave"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                En Google Authenticator tocá el botón <strong>+</strong> ➔ <strong>"Ingresar clave de configuración"</strong>.
                <br />
                Nombre: <strong>Io Sono</strong>
                <br />
                Clave: <strong style={{ color: "var(--purple-lt)", letterSpacing: "1px" }}>{MASTER_2FA_SECRET}</strong>
              </div>
            </div>

            <div className="field" style={{ textAlign: "center" }}>
              <label style={{ textAlign: "center" }}>Ingresá el código de 6 dígitos que genera la app:</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123 456"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleVerify2FA()}
                style={{
                  textAlign: "center",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 8,
                  padding: "12px",
                  background: "var(--bg3)",
                  border: "1.5px solid var(--purple)",
                  color: "#fff"
                }}
                autoFocus
              />
            </div>

            <button
              className="btn btn-green btn-full"
              style={{ fontWeight: 700, padding: "12px", fontSize: 14, marginTop: 8 }}
              onClick={handleVerify2FA}
              disabled={loading || totpCode.length !== 6}
            >
              {loading ? "Verificando con Google..." : "✓ Confirmar y Acceder"}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-full"
              style={{ marginTop: 10, fontSize: 12, border: "none", color: "var(--text3)" }}
              onClick={() => { setStep("credentials"); setError(""); }}
            >
              ← Volver atrás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP SHELL PRINCIPAL ──────────────────────────────────────────────────────
export default function IoSono() {
  const [screen, setScreen] = useState("buscador");
  const [screenData, setScreenData] = useState(null);

  // Usuario de la sesión: Si Daniel ya validó su 2FA en este navegador, se mantiene logueado; si no, visitante modo marca
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("iosono_user_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.is2FAVerified) return parsed;
      }
    } catch (e) {}
    return {
      id: "guest_" + Math.random().toString(36).substring(2, 9),
      role: "marca",
      name: "Visitante",
      email: "",
      isMaster: false,
      is2FAVerified: false
    };
  });

  const [ratingModalCamp, setRatingModalCamp] = useState(null);
  const [terminosModalOpen, setTerminosModalOpen] = useState(false);

  // Lista de campañas activas en memoria con casos reales para probar
  const [campañas, setCampañas] = useState([
    {
      id: "camp_demo_1",
      marca_id: "marca_demo",
      marca_nombre: "Daniel (Marca)",
      influencer_id: "c6a28bf8-46ea-47b7-b937-503382a4a471",
      influencer_usuario_id: "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
      influencer_nombre: "Daniel Monaldi",
      influencer_handle: "@danielmonaldii",
      influencer_foto: "https://whvafphwpkastjkcjrzs.supabase.co/storage/v1/object/public/fotos-perfil/fotos/c6a28bf8-46ea-47b7-b937-503382a4a471.png",
      servicio_nombre: "Reel hasta 30 seg.",
      monto: 120,
      moneda: "USD",
      restricciones: [
        "🚫 Sin malas palabras / lenguaje vulgar",
        "🚫 No mostrar marcas competidoras",
        "📌 Etiquetar a @marca en los primeros 3 segundos"
      ],
      estado: "borrador_enviado",
      borrador_video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      borrador_archivo_nombre: "reel_final_promocion_v2.mp4",
      borrador_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      borrador_nota: "¡Hola Dani! Acá te dejo la versión final con el producto en primer plano y la música acordada. Decime si te gusta o si necesitás un recorte puntual.",
      plazo_horas: 72,
      created_at: new Date().toISOString()
    },
    {
      id: "camp_demo_2",
      marca_id: "marca_cafe",
      marca_nombre: "Café Valiente",
      influencer_id: "f3c83b8b-e85d-4f1d-91b7-d1a1b1c1d1e1",
      influencer_usuario_id: "f3c83b8b-e85d-4f1d-91b7-d1a1b1c1d1e1",
      influencer_nombre: "Naza Influ",
      influencer_handle: "@nazainflu",
      influencer_foto: "https://whvafphwpkastjkcjrzs.supabase.co/storage/v1/object/public/fotos-perfil/fotos/f3c83b8b-e85d-4f1d-91b7-d1a1b1c1d1e1.png",
      servicio_nombre: "Reel hasta 60 seg.",
      monto: 170,
      moneda: "USD",
      restricciones: [
        "🚫 Sin lenguaje agresivo",
        "☕ Mostrar paquete de café en los primeros 5 segundos",
        "📌 Llamado a la acción con código VALIENTE10"
      ],
      estado: "cancelacion_en_revision",
      borrador_video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      borrador_archivo_nombre: "cafe_desayuno_reel.mp4",
      borrador_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      borrador_nota: "Borrador de desayuno filmado el miércoles.",
      motivo_cancelacion: "El video no muestra el paquete de café ni el código promocional; parece un video genérico de su desayuno.",
      asignado_a: "Daniel Monaldi",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: "camp_demo_3",
      marca_id: "marca_moda",
      marca_nombre: "Studio Luce (Moda)",
      influencer_id: "c6a28bf8-46ea-47b7-b937-503382a4a471",
      influencer_usuario_id: "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
      influencer_nombre: "Daniel Monaldi",
      influencer_handle: "@danielmonaldii",
      influencer_foto: "https://whvafphwpkastjkcjrzs.supabase.co/storage/v1/object/public/fotos-perfil/fotos/c6a28bf8-46ea-47b7-b937-503382a4a471.png",
      servicio_nombre: "Combo 3 Historias",
      monto: 80,
      moneda: "USD",
      restricciones: [
        "🚫 No promocionar otra marca de indumentaria el mismo día",
        "👗 Mostrar vestido negro colección invierno"
      ],
      estado: "disputa",
      publicado_link: "https://instagram.com/stories/danielmonaldii/998877",
      motivo_disputa: "En la segunda historia etiquetó a otra marca de ropa de la competencia, violando la exclusividad convenida.",
      asignado_a: "Mediador 1 (Juan)",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: "camp_demo_4",
      marca_id: "marca_nomade",
      marca_nombre: "Tienda Nómade",
      influencer_id: "c6a28bf8-46ea-47b7-b937-503382a4a471",
      influencer_usuario_id: "1cf561b6-44c3-4eb6-b55b-1b9499f5027c",
      influencer_nombre: "Daniel Monaldi",
      influencer_handle: "@danielmonaldii",
      influencer_foto: "https://whvafphwpkastjkcjrzs.supabase.co/storage/v1/object/public/fotos-perfil/fotos/c6a28bf8-46ea-47b7-b937-503382a4a471.png",
      servicio_nombre: "Historia (1 story de 24h)",
      monto: 35,
      moneda: "USD",
      restricciones: ["🚫 Sin malas palabras", "📌 Link directo a la web"],
      estado: "finalizado",
      publicado_link: "https://instagram.com/stories/danielmonaldii/554433",
      resena: {
        puntaje_trabajo: 10,
        satisfaccion: 10,
        cambiaria_algo: false,
        comentario: "Súper profesional y cumplió todas las pautas al pie de la letra."
      },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ]);

  // Estado central de influencers con datos ricos y actualizables
  const [influencers, setInfluencers] = useState(INITIAL_INFLUENCERS);

  const handleUpdateInfluencer = (updatedInf) => {
    setInfluencers(prev => prev.map(inf => inf.id === updatedInf.id ? updatedInf : inf));
  };

  const nav = (to, data=null) => { setScreen(to); setScreenData(data); window.scrollTo(0,0); };

  const handleCampañaCreada = (nueva) => {
    setCampañas(prev => [nueva, ...prev]);
  };

  const handleUpdateCampaña = (actualizada) => {
    setCampañas(prev => prev.map(c => c.id === actualizada.id ? actualizada : c));
  };

  const handleRatingSubmit = async (reseña) => {
    setCampañas(prev => prev.map(c => c.id === reseña.campana_id ? { ...c, estado:"finalizado", resena: reseña } : c));
  };

  const reclamosPendientes = campañas.filter(c => c.estado === "cancelacion_en_revision" || c.estado === "disputa").length;

  const handleSwitchRole = (nuevoRol) => {
    if (nuevoRol === "influencer" && !user?.is2FAVerified) {
      nav("login");
      return;
    }
    const updated = {
      ...(user || {}),
      role: nuevoRol,
      name: nuevoRol === "marca" ? (user?.is2FAVerified ? "Daniel Monaldi (Marca)" : "Marca") : "Daniel Monaldi",
      isMaster: user?.is2FAVerified ? true : false,
      is2FAVerified: user?.is2FAVerified || false
    };
    setUser(updated);
    if (user?.is2FAVerified) {
      try { localStorage.setItem("iosono_user_session", JSON.stringify(updated)); } catch (e) {}
    }
  };

  const NAV_ITEMS = user?.role === "influencer" && user?.is2FAVerified ? [
    { id:"campanas", icon:"ti-briefcase", label:"Mis Propuestas", badge: campañas.filter(c => c.estado === "propuesta_pendiente").length },
    { id:"editor_perfil", icon:"ti-user", label:"Mi Media Kit" },
    { id:"buscador", icon:"ti-users", label:"Explorar" },
    { id:"admin",    icon:"ti-shield-lock", label:"Admin", badge: reclamosPendientes },
    { id:"login",    icon:"ti-shield-check", label:"Seguridad 2FA" }
  ] : [
    { id:"buscador", icon:"ti-search", label:"Explorar Creadores" },
    { id:"campanas", icon:"ti-briefcase", label:"Mis Campañas" },
    { id:"admin",    icon:"ti-shield-lock", label:"Admin", badge: reclamosPendientes },
    { id:"login",    icon:"ti-user", label: user?.is2FAVerified ? "Daniel (2FA)" : "Ingresar" }
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Barra superior con selector de rol para probar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0 8px", borderBottom:"0.5px solid var(--border2)", marginBottom:10 }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, cursor:"pointer" }} onClick={() => nav("buscador")}>
            <span style={{ color:"var(--purple-lt)", fontStyle:"italic" }}>Io</span> Sono
          </div>
          <button
            className={`pill ${screen==="admin"?"pill-purple":"pill-gray"}`}
            style={{ cursor:"pointer", border:"none", background: screen==="admin"?"var(--purple)":"var(--bg2)", color: screen==="admin"?"#fff":"var(--purple-lt)", fontSize:11, padding:"5px 10px" }}
            onClick={() => {
              if (!user?.is2FAVerified) {
                nav("login");
              } else {
                setUser(prev => ({ ...prev, role:"admin" }));
                nav("admin");
              }
            }}
          >
            👑 Panel Admin {reclamosPendientes > 0 ? `(${reclamosPendientes})` : ""}
          </button>
        </div>

        {/* ─── PESTAÑAS PRINCIPALES PERMANENTES: MODO MARCA VS MODO INFLUENCER ─── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          background: "rgba(23,21,32,0.95)",
          padding: "6px",
          borderRadius: "14px",
          border: "1.5px solid var(--border)",
          marginBottom: "10px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)"
        }}>
          <button
            type="button"
            onClick={() => handleSwitchRole("marca")}
            style={{
              padding: "11px 12px",
              borderRadius: "10px",
              border: user?.role === "marca" ? "1.5px solid rgba(139,92,246,0.6)" : "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: user?.role === "marca" ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "transparent",
              color: user?.role === "marca" ? "#fff" : "var(--text2)",
              boxShadow: user?.role === "marca" ? "0 4px 14px rgba(124,58,237,0.5)" : "none",
              transition: "all 0.2s"
            }}
          >
            <i className="ti ti-building" style={{ fontSize: 18 }} />
            <span>🏢 Soy MARCA</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRole("influencer")}
            style={{
              padding: "11px 12px",
              borderRadius: "10px",
              border: user?.role === "influencer" ? "1.5px solid rgba(34,197,94,0.6)" : "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: user?.role === "influencer" ? "linear-gradient(135deg, #10b981, #047857)" : "transparent",
              color: user?.role === "influencer" ? "#fff" : "var(--text2)",
              boxShadow: user?.role === "influencer" ? "0 4px 14px rgba(16,185,129,0.5)" : "none",
              transition: "all 0.2s"
            }}
          >
            <i className={user?.is2FAVerified ? "ti ti-sparkles" : "ti ti-lock"} style={{ fontSize: 18 }} />
            <span>✨ Soy INFLUENCER {!user?.is2FAVerified && "🔒"}</span>
          </button>
        </div>

        {/* Pantallas */}
        {screen === "buscador" && (
          <Buscador onNav={nav} user={user} onSelectInfluencer={(inf) => nav("profile", inf)} influencersList={influencers} />
        )}
        {screen === "profile" && (
          <Profile inf={screenData || influencers[0]} onBack={() => nav("buscador")} onNav={nav} user={user} />
        )}
        {screen === "editor_perfil" && (
          <CreatorProfileEditor
            influencer={influencers.find(inf => inf.id === "c6a28bf8-46ea-47b7-b937-503382a4a471") || influencers[0]}
            onSave={handleUpdateInfluencer}
            onPreview={(updated) => nav("profile", updated)}
            onNav={nav}
          />
        )}
        {screen === "hire" && (
          <Checkout
            data={screenData}
            onNav={nav}
            user={user}
            onCampañaCreada={handleCampañaCreada}
            onOpenTerminos={() => setTerminosModalOpen(true)}
          />
        )}
        {screen === "campanas" && (
          <CampañasView
            user={user}
            campañas={campañas}
            onUpdateCampaña={handleUpdateCampaña}
            onOpenRating={(camp) => setRatingModalCamp(camp)}
            onNav={nav}
            influencers={influencers}
            onSwitchRole={handleSwitchRole}
          />
        )}
        {screen === "admin" && (
          <AdminDashboard
            user={user}
            campañas={campañas}
            onUpdateCampaña={handleUpdateCampaña}
            onNav={nav}
            influencersList={influencers}
          />
        )}
        {screen === "login" && (
          user?.role === "influencer" && user?.is2FAVerified ? (
            <CreatorProfileEditor
              influencer={influencers.find(inf => inf.usuarioId === user.id || inf.name === user.name) || influencers[0]}
              onSave={handleUpdateInfluencer}
              onPreview={(updated) => nav("profile", updated)}
              onNav={nav}
            />
          ) : (
            <Login
              onNav={nav}
              onLogin={(u) => {
                const finalUser = u || {
                  id: "guest_" + Math.random().toString(36).substring(2, 9),
                  role: "marca",
                  name: "Visitante",
                  email: "",
                  isMaster: false,
                  is2FAVerified: false
                };
                setUser(finalUser);
                if (u?.is2FAVerified) {
                  try { localStorage.setItem("iosono_user_session", JSON.stringify(u)); } catch (e) {}
                } else {
                  try { localStorage.removeItem("iosono_user_session"); } catch (e) {}
                }
                nav("buscador");
              }}
              user={user}
            />
          )
        )}

        {/* Pie de Página Oficial con Legales */}
        <div style={{ textAlign:"center", padding:"24px 10px 80px", borderTop:"0.5px solid var(--border)", marginTop:36, fontSize:11, color:"var(--text3)" }}>
          <div style={{ fontWeight:600, color:"var(--text2)", marginBottom:4 }}>
            Io Sono Influencer Marketplace © 2026
          </div>
          <div>Pagos protegidos bajo custodia Escrow con Mercado Pago Oficial</div>
          <div style={{ marginTop:8 }}>
            <button
              onClick={() => setTerminosModalOpen(true)}
              style={{ background:"transparent", border:"none", color:"var(--purple-lt)", cursor:"pointer", fontSize:11, textDecoration:"underline" }}
            >
              📜 Términos y Condiciones Legales & Garantía de Custodia
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Términos y Condiciones Legales & Garantía Escrow */}
      {terminosModalOpen && (
        <TerminosModal onClose={() => setTerminosModalOpen(false)} />
      )}

      {/* Modal de Calificación 1 al 10 */}
      {ratingModalCamp && (
        <RatingModal
          campaign={ratingModalCamp}
          onClose={() => setRatingModalCamp(null)}
          onSubmit={handleRatingSubmit}
        />
      )}

      {/* Barra de Navegación Inferior */}
      <nav className="nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${screen===item.id?"active":""}`}
            onClick={() => nav(item.id)}
            style={{ position:"relative" }}
          >
            <i className={`ti ${item.icon}`} />
            {item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
