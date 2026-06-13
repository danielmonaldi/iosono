import { useState } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #0a0a0a;
    --bg1:        #111111;
    --bg2:        #1a1a1a;
    --border:     #2a2a2a;
    --border2:    #222222;
    --text:       #f0eeff;
    --text2:      #888888;
    --text3:      #555555;
    --purple:     #7c3aed;
    --purple-lt:  #a78bfa;
    --purple-bg:  #1a1228;
    --green:      #4ade80;
    --green-bg:   #0d2112;
    --amber:      #fbbf24;
    --amber-bg:   #1a1208;
    --red:        #f87171;
    --red-bg:     #1a0808;
    --blue:       #60a5fa;
    --blue-bg:    #0d1a2e;
    --radius:     12px;
    --radius-sm:  8px;
    --radius-lg:  16px;
    --font-display: 'Playfair Display', serif;
    --font-body:    'DM Sans', sans-serif;
  }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  .app { max-width: 680px; margin: 0 auto; padding: 0 16px 80px; }

  /* NAV */
  .nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10,10,10,0.95); backdrop-filter: blur(12px); border-top: 0.5px solid var(--border); display: flex; justify-content: center; gap: 0; z-index: 100; }
  .nav-item { flex: 1; max-width: 80px; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0 14px; cursor: pointer; color: var(--text3); font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; border: none; background: transparent; transition: color 0.15s; }
  .nav-item.active { color: var(--purple-lt); }
  .nav-item i { font-size: 20px; }

  /* LOGO */
  .logo { font-family: var(--font-display); font-size: 15px; color: var(--text2); letter-spacing: 0.2em; text-align: center; padding: 20px 0 10px; text-transform: uppercase; }
  .logo span { color: var(--purple-lt); font-style: italic; }

  /* CARDS */
  .card { background: var(--bg1); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 12px; }
  .card-sm { background: var(--bg2); border-radius: var(--radius); padding: 14px; }
  .card-title { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text2); margin-bottom: 14px; }

  /* HERO */
  .hero { background: var(--bg); border-radius: var(--radius-lg); padding: 28px 20px; margin-bottom: 12px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, #2a1a4a 0%, transparent 70%); pointer-events: none; }
  .hero-inner { position: relative; }

  /* TYPOGRAPHY */
  .display { font-family: var(--font-display); font-size: 32px; font-weight: 600; line-height: 1.2; }
  .display em { font-style: italic; color: var(--purple-lt); }
  .eyebrow { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--purple-lt); margin-bottom: 8px; }
  .subtitle { font-size: 13px; color: var(--text2); line-height: 1.6; }
  .section-title { font-family: var(--font-display); font-size: 18px; color: var(--text); margin-bottom: 4px; }

  /* PILLS */
  .pill { font-size: 11px; padding: 4px 12px; border-radius: 100px; display: inline-block; }
  .pill-purple { background: var(--purple-bg); color: var(--purple-lt); }
  .pill-green  { background: var(--green-bg);  color: var(--green); }
  .pill-amber  { background: var(--amber-bg);  color: var(--amber); }
  .pill-red    { background: var(--red-bg);    color: var(--red); }
  .pill-blue   { background: var(--blue-bg);   color: var(--blue); }
  .pill-gray   { background: var(--bg2);       color: var(--text2); }

  /* BUTTONS */
  .btn { border: none; border-radius: 100px; font-family: var(--font-body); font-size: 14px; font-weight: 500; cursor: pointer; padding: 12px 24px; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: var(--purple); color: #fff; }
  .btn-outline { background: transparent; border: 1px solid #3d2d6e; color: var(--purple-lt); }
  .btn-green { background: var(--green-bg); border: 1px solid rgba(74,222,128,0.3); color: var(--green); }
  .btn-red { background: var(--red-bg); border: 1px solid rgba(226,75,74,0.3); color: var(--red); }
  .btn-full { width: 100%; border-radius: var(--radius); padding: 13px; font-size: 15px; }
  .btn-sm { padding: 6px 14px; font-size: 12px; border-radius: var(--radius-sm); }

  /* INPUTS */
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 5px; }
  .field input, .field textarea, .field select {
    width: 100%; background: var(--bg2); border: 0.5px solid var(--border);
    border-radius: var(--radius-sm); padding: 11px 14px; font-size: 14px;
    color: var(--text); font-family: var(--font-body);
  }
  .field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: var(--purple); }
  .field textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  /* GRID */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }

  /* DIVIDER */
  .divider { height: 0.5px; background: var(--border); margin: 14px 0; }
  .divider-text { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
  .divider-text::before, .divider-text::after { content: ''; flex: 1; height: 0.5px; background: var(--border); }
  .divider-text span { font-size: 12px; color: var(--text2); }

  /* AVATAR */
  .avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 500; flex-shrink: 0; }
  .avatar-lg { width: 64px; height: 64px; font-size: 22px; }
  .avatar-md { width: 42px; height: 42px; font-size: 15px; }
  .avatar-sm { width: 30px; height: 30px; font-size: 11px; }

  /* STATS ROW */
  .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--border); border-radius: var(--radius-sm); overflow: hidden; }
  .stat-cell { background: var(--bg1); padding: 12px 8px; text-align: center; }
  .stat-num { font-size: 16px; font-weight: 500; }
  .stat-lbl { font-size: 10px; color: var(--text2); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* TOGGLE */
  .toggle-bar { display: flex; background: var(--bg2); border-radius: var(--radius); padding: 4px; gap: 4px; margin-bottom: 16px; }
  .toggle-btn { flex: 1; padding: 8px; border-radius: var(--radius-sm); border: none; background: transparent; font-size: 12px; color: var(--text2); cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 5px; }
  .toggle-btn.active { background: var(--bg1); color: var(--text); border: 0.5px solid var(--border); font-weight: 500; }
  .toggle-btn i { font-size: 14px; }

  /* TIMELINE */
  .timeline { padding-left: 22px; position: relative; }
  .timeline::before { content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px; width: 1px; background: var(--border); }
  .tl-item { position: relative; margin-bottom: 16px; }
  .tl-dot { position: absolute; left: -18px; top: 4px; width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--bg1); }
  .tl-dot.done   { background: var(--green); }
  .tl-dot.active { background: var(--purple-lt); }
  .tl-dot.pending{ background: var(--border); }
  .tl-time  { font-size: 11px; color: var(--text2); margin-bottom: 2px; }
  .tl-title { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
  .tl-desc  { font-size: 12px; color: var(--text2); line-height: 1.5; }

  /* ROW ITEM */
  .row-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 0.5px solid var(--border); }
  .row-item:last-child { border-bottom: none; }
  .row-info { flex: 1; }
  .row-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
  .row-sub { font-size: 12px; color: var(--text2); }
  .row-right { text-align: right; flex-shrink: 0; }
  .row-amount { font-size: 13px; font-weight: 500; }
  .row-date { font-size: 11px; color: var(--text2); margin-top: 2px; }

  /* CHAT */
  .chat-box { border: 0.5px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
  .chat-head { padding: 12px 14px; border-bottom: 0.5px solid var(--border); background: var(--bg2); display: flex; align-items: center; gap: 10px; }
  .chat-messages { padding: 14px; display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; }
  .msg { max-width: 80%; display: flex; flex-direction: column; gap: 3px; }
  .msg.left { align-self: flex-start; }
  .msg.right { align-self: flex-end; }
  .msg.center { align-self: center; max-width: 92%; }
  .msg-from { font-size: 10px; color: var(--text2); padding: 0 4px; }
  .msg.right .msg-from { text-align: right; }
  .msg-bubble { padding: 9px 13px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
  .msg.left  .msg-bubble { background: var(--bg2); border-radius: 4px 12px 12px 12px; }
  .msg.right .msg-bubble { background: var(--purple); color: #fff; border-radius: 12px 4px 12px 12px; }
  .msg.center .msg-bubble { background: var(--amber-bg); color: var(--amber); border-radius: 12px; font-size: 12px; border: 0.5px solid rgba(251,191,36,0.2); }
  .msg-time { font-size: 10px; color: var(--text2); padding: 0 4px; }
  .msg.right .msg-time { text-align: right; }
  .chat-input-row { padding: 10px 12px; border-top: 0.5px solid var(--border); background: var(--bg2); display: flex; gap: 8px; align-items: center; }
  .chat-input { flex: 1; background: var(--bg1); border: 0.5px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 13px; color: var(--text); font-family: var(--font-body); }
  .chat-send-btn { background: var(--purple); border: none; color: #fff; width: 36px; height: 36px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  /* STARS */
  .stars { display: flex; gap: 6px; }
  .star { font-size: 26px; cursor: pointer; color: var(--border); transition: color 0.1s; }
  .star.on { color: var(--amber); }

  /* MISC */
  .tag { display: inline-flex; align-items: center; gap: 5px; background: var(--bg2); border: 0.5px solid var(--border); border-radius: 100px; padding: 5px 13px; font-size: 12px; color: var(--text2); cursor: pointer; }
  .tag.on { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.5); color: var(--purple-lt); }
  .tag.danger.on { background: rgba(226,75,74,0.15); border-color: rgba(226,75,74,0.3); color: var(--red); }
  .tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

  .bar-horiz { height: 5px; background: var(--bg2); border-radius: 3px; overflow: hidden; margin-top: 5px; }
  .bar-fill { height: 100%; background: var(--purple); border-radius: 3px; }

  .escrow-note { display: flex; gap: 8px; align-items: flex-start; background: var(--green-bg); border-radius: var(--radius-sm); padding: 10px 12px; margin-top: 10px; }
  .escrow-note i { color: var(--green); font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .escrow-note span { font-size: 12px; color: #86efac; line-height: 1.5; }

  .notif-item { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 0.5px solid var(--border); }
  .notif-item:last-child { border-bottom: none; }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

  .progress-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 24px; }
  .prog-step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .prog-circle { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; border: 1.5px solid var(--border); color: var(--text2); background: var(--bg1); }
  .prog-circle.active { background: var(--purple); color: #fff; border-color: var(--purple); }
  .prog-circle.done   { background: var(--green-bg); color: var(--green); border-color: var(--green); }
  .prog-label { font-size: 10px; color: var(--text2); white-space: nowrap; }
  .prog-label.active { color: var(--purple-lt); }
  .prog-line { width: 40px; height: 1px; background: var(--border); margin-bottom: 16px; }
  .prog-line.done { background: var(--green); }

  .countdown-box { background: var(--purple-bg); border-radius: var(--radius); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .countdown-time { font-size: 24px; font-weight: 500; color: var(--purple-lt); font-variant-numeric: tabular-nums; }

  /* PORTFOLIO GRID */
  .portfolio-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .port-card { background: var(--bg2); border-radius: var(--radius); overflow: hidden; cursor: pointer; border: 0.5px solid var(--border); transition: border-color 0.15s; }
  .port-card:hover { border-color: var(--purple); }
  .port-thumb { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 28px; position: relative; }
  .port-badge { position: absolute; top: 6px; left: 6px; font-size: 10px; background: rgba(0,0,0,0.7); color: #fff; padding: 2px 8px; border-radius: 100px; }
  .port-brand { position: absolute; top: 6px; right: 6px; font-size: 10px; background: rgba(124,58,237,0.85); color: #fff; padding: 2px 8px; border-radius: 100px; }
  .port-metrics { padding: 8px; display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; }
  .port-metric { text-align: center; }
  .port-metric-num { font-size: 11px; font-weight: 500; }
  .port-metric-lbl { font-size: 9px; color: var(--text2); }

  /* INF CARD */
  .inf-card { background: var(--bg1); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 16px; cursor: pointer; transition: border-color 0.15s; }
  .inf-card:hover { border-color: var(--purple); }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal { background: var(--bg1); border: 0.5px solid var(--border); border-radius: var(--radius-lg); width: 100%; max-width: 480px; max-height: 80vh; overflow-y: auto; }
  .modal-head { padding: 14px 16px; border-bottom: 0.5px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .modal-body { padding: 16px; }

  /* BAR CHART */
  .bar-chart { display: flex; align-items: flex-end; gap: 5px; height: 70px; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end; }
  .bar-col-fill { width: 100%; background: var(--purple); border-radius: 3px 3px 0 0; }
  .bar-col-lbl { font-size: 9px; color: var(--text2); }

  /* SERVICE OPTION */
  .service-opt { background: var(--bg2); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 10px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: border-color 0.15s; }
  .service-opt.selected { border: 1.5px solid var(--purple); background: rgba(124,58,237,0.08); }

  /* ADMIN TABLE */
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10px; color: var(--text2); font-weight: 400; padding: 6px 0; border-bottom: 0.5px solid var(--border); letter-spacing: 0.06em; text-transform: uppercase; }
  td { padding: 10px 0; border-bottom: 0.5px solid var(--border); color: var(--text); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }

  /* SCROLL */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const INFLUENCERS = [
  { id:1, initials:'VL', name:'Vale López',    handle:'@valelopez', niche:'Moda y estilo',   followers:'28K', zone:'CABA',    eng:'4.8%', campaigns:12, rating:4.9, color:'#2a1a4a', textColor:'#a78bfa',
    services:[ {name:'Historia',    price:'USD 35',  icon:'ti-clock'},  {name:'Publicación', price:'USD 80',  icon:'ti-photo'}, {name:'Mención', price:'USD 20', icon:'ti-at'}, {name:'Reel', price:'USD 120', icon:'ti-player-play'}, {name:'Review', price:'USD 95', icon:'ti-star'} ],
    portfolio:[ {emoji:'👗', brand:'Tienda Nómade', type:'Reel',     reach:'48.2K', likes:'3.1K', comments:'284', eng:'6.4%'}, {emoji:'👠', brand:'Studio Luce', type:'Post',     reach:'22.7K', likes:'1.8K', comments:'156', eng:'5.1%'}, {emoji:'✨', brand:'Marca Savia', type:'Historia', reach:'12.4K', likes:'890', comments:'43',  eng:'7.2%'} ]
  },
  { id:2, initials:'MG', name:'Maxi González', handle:'@maxifit',   niche:'Fitness y salud', followers:'61K', zone:'Córdoba', eng:'5.2%', campaigns:8,  rating:4.7, color:'#0d2112', textColor:'#4ade80',
    services:[ {name:'Historia', price:'$45.000', icon:'ti-clock'}, {name:'Reel', price:'$150.000', icon:'ti-player-play'}, {name:'Live', price:'$200.000', icon:'ti-live-photo'} ],
    portfolio:[ {emoji:'💪', brand:'Gym Pro', type:'Reel', reach:'55K', likes:'4.2K', comments:'380', eng:'7.8%'}, {emoji:'🥗', brand:'NutriBar', type:'Post', reach:'30K', likes:'2.1K', comments:'190', eng:'6.2%'}, {emoji:'🏃', brand:'RunBA', type:'Historia', reach:'18K', likes:'1.2K', comments:'95', eng:'5.5%'} ]
  },
  { id:3, initials:'SR', name:'Sofi Ríos',     handle:'@sofibeauty', niche:'Belleza y skincare', followers:'9.2K', zone:'Rosario', eng:'6.1%', campaigns:3, rating:4.5, color:'#1a0d14', textColor:'#f472b6',
    services:[ {name:'Historia', price:'USD 18', icon:'ti-clock'}, {name:'Review', price:'USD 55', icon:'ti-star'}, {name:'Mención', price:'USD 12', icon:'ti-at'} ],
    portfolio:[ {emoji:'💄', brand:'Glam BA', type:'Post', reach:'8K', likes:'620', comments:'78', eng:'6.8%'}, {emoji:'🧴', brand:'Savia Skin', type:'Review', reach:'6K', likes:'480', comments:'55', eng:'6.2%'}, {emoji:'💅', brand:'NailCo', type:'Historia', reach:'4K', likes:'310', comments:'32', eng:'5.9%'} ]
  }
];

const NICHES = ['Moda y estilo','Gastronomía','Fitness y salud','Viajes','Tecnología','Belleza y skincare','Humor','Deporte','Maternidad','Mascotas','Bebidas'];
const ZONES  = ['CABA','GBA','Córdoba','Rosario','Mendoza','Interior'];
const SERVICES_LIST = ['Historia','Publicación','Mención','Reel','Live','Review'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Logo = () => <div className="logo"><span>Io</span> Sono</div>;

const AvatarEl = ({ initials, color, textColor, size = 'md' }) => (
  <div className={`avatar avatar-${size}`} style={{ background: color, color: textColor }}>
    {initials}
  </div>
);

// ─── SCREENS ──────────────────────────────────────────────────────────────────

// 1. LANDING
function Landing({ onNav }) {
  return (
    <div>
      <div className="hero" style={{ textAlign:'center', paddingTop:36, paddingBottom:36 }}>
        <div className="hero-inner">
          <div style={{ fontFamily:'var(--font-display)', fontSize:42, fontWeight:600, color:'var(--text)', letterSpacing:'0.08em', marginBottom:8 }}>
            <span style={{color:'var(--purple-lt)', fontStyle:'italic'}}>Io</span> Sono
          </div>
          <div style={{ fontSize:12, color:'var(--text2)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:20 }}>
            marketplace de influencers argentinos
          </div>
          <div className="display" style={{ marginBottom:12 }}>
            Tu marca,<br/>su voz. <em>Conectados.</em>
          </div>
          <div className="subtitle" style={{ maxWidth:360, margin:'0 auto 24px' }}>
            Encontrá el influencer ideal. Pagá seguro. Recibí resultados.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNav('register')}>Soy influencer ↗</button>
            <button className="btn btn-outline" onClick={() => onNav('register')}>Soy marca ↗</button>
          </div>
          <div className="tags-wrap" style={{ justifyContent:'center', marginTop:20 }}>
            {NICHES.slice(0,6).map(n => <span key={n} className="tag">{n}</span>)}
            <span className="tag">+5 más</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Buscá influencers</div>
        <div className="grid-2" style={{ marginBottom:10 }}>
          <select className="field" style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 12px', color:'var(--text)', fontSize:13, fontFamily:'var(--font-body)' }}>
            <option>Todos los nichos</option>
            {NICHES.map(n => <option key={n}>{n}</option>)}
          </select>
          <select style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 12px', color:'var(--text)', fontSize:13, fontFamily:'var(--font-body)' }}>
            <option>Todos los rangos</option>
            <option>Micro · 1K–10K</option>
            <option>Mid · 10K–100K</option>
            <option>Macro · 100K–500K</option>
            <option>Top · +500K</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {INFLUENCERS.map(inf => (
            <div key={inf.id} className="inf-card" style={{ flex:'1 1 160px' }} onClick={() => onNav('profile', inf)}>
              <AvatarEl initials={inf.initials} color={inf.color} textColor={inf.textColor} size="md" />
              <div style={{ marginTop:8, fontSize:14, fontWeight:500 }}>{inf.name}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>{inf.handle}</div>
              <span className="pill pill-purple" style={{ fontSize:10, marginBottom:8, display:'block', width:'fit-content' }}>{inf.niche}</span>
              <div style={{ fontSize:12, color:'var(--text2)' }}><strong style={{color:'var(--text)'}}>{inf.followers}</strong> seg · {inf.zone}</div>
              <div style={{ marginTop:10, fontSize:12 }}>
                {inf.services.slice(0,2).map(s => (
                  <div key={s.name} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0' }}>
                    <span style={{color:'var(--text2)'}}>{s.name}</span>
                    <span style={{fontWeight:500}}>{s.price}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline btn-sm btn-full" style={{ marginTop:10 }}>Ver perfil ↗</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">¿Cómo funciona el pago?</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
          {[['1','Elegís y pagás','El dinero queda retenido'],['2','Influencer publica','Sube el contenido acordado'],['3','Vos confirmás','Revisás que esté bien'],['4','Se libera el pago','El influencer cobra automáticamente']].map(([n,t,d]) => (
            <div key={n} style={{ background:'var(--bg1)', padding:'12px 10px', textAlign:'center' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--purple-bg)', color:'var(--purple-lt)', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>{n}</div>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:3 }}>{t}</div>
              <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.4 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. LOGIN
function Login({ onNav }) {
  const [role, setRole] = useState('marca');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    const email = document.getElementById('login-email')?.value;
    const pass  = document.getElementById('login-pass')?.value;
    if (!email || !pass) { setError('Completá email y contraseña para continuar.'); return; }
    setError('');
    onNav(role === 'marca' ? 'brand-panel' : 'inf-panel');
  };

  return (
    <div style={{ maxWidth:400, margin:'0 auto' }}>
      <div className="hero" style={{ textAlign:'center', marginBottom:16 }}>
        <div className="hero-inner">
          <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--text)', letterSpacing:'0.1em', marginBottom:4 }}>
            <span style={{color:'var(--purple-lt)', fontStyle:'italic'}}>Io</span> Sono
          </div>
          <div style={{ fontSize:11, color:'var(--text2)', letterSpacing:'0.14em', textTransform:'uppercase' }}>
            el marketplace de influencers argentinos
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toggle-bar">
          <button className={`toggle-btn ${role==='marca'?'active':''}`} onClick={() => setRole('marca')}>
            <i className="ti ti-building-store" /> Soy marca
          </button>
          <button className={`toggle-btn ${role==='influencer'?'active':''}`} onClick={() => setRole('influencer')}>
            <i className="ti ti-camera" /> Soy influencer
          </button>
        </div>

        {error && (
          <div style={{ background:'var(--red-bg)', border:'0.5px solid rgba(226,75,74,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:13, color:'var(--red)', marginBottom:14, display:'flex', gap:8, alignItems:'center' }}>
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input id="login-email" type="email" placeholder="hola@vos.com" />
        </div>
        <div className="field" style={{ marginBottom:6 }}>
          <label>Contraseña</label>
          <div style={{ position:'relative' }}>
            <input id="login-pass" type={showPass?'text':'password'} placeholder="Tu contraseña" style={{ paddingRight:40 }} />
            <i className={`ti ${showPass?'ti-eye-off':'ti-eye'}`} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text2)', cursor:'pointer', fontSize:16 }} onClick={() => setShowPass(!showPass)} />
          </div>
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:'var(--purple-lt)', cursor:'pointer', marginBottom:14 }}>¿Olvidaste tu contraseña?</div>

        <button className="btn btn-primary btn-full" onClick={handleLogin}>Ingresar →</button>

        <div className="divider-text"><span>o ingresá con</span></div>

        <div className="grid-2" style={{ marginBottom:14 }}>
          {[['ti-brand-google','Google'],['ti-brand-instagram','Instagram']].map(([icon,label]) => (
            <button key={label} style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', fontSize:13, color:'var(--text)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'var(--font-body)' }}>
              <i className={`ti ${icon}`} style={{ fontSize:17 }} /> {label}
            </button>
          ))}
        </div>

        <div style={{ textAlign:'center', fontSize:13, color:'var(--text2)' }}>
          ¿No tenés cuenta? <span style={{ color:'var(--purple-lt)', cursor:'pointer', fontWeight:500 }} onClick={() => onNav('register')}>Registrate gratis</span>
        </div>
      </div>
    </div>
  );
}

// 3. REGISTER
function Register({ onNav }) {
  const [role, setRole] = useState('marca');
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [activeServices, setActiveServices] = useState(['Historia','Publicación','Reel']);

  const toggleNiche = n => setSelectedNiches(prev => prev.includes(n) ? prev.filter(x=>x!==n) : [...prev,n]);
  const toggleService = s => setActiveServices(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev,s]);

  return (
    <div style={{ maxWidth:480, margin:'0 auto' }}>
      <Logo />
      <div className="toggle-bar">
        <button className={`toggle-btn ${role==='marca'?'active':''}`} onClick={() => setRole('marca')}><i className="ti ti-building-store" /> Soy marca</button>
        <button className={`toggle-btn ${role==='influencer'?'active':''}`} onClick={() => setRole('influencer')}><i className="ti ti-camera" /> Soy influencer</button>
      </div>

      <div className="card">
        {role === 'marca' ? (
          <>
            <div style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>Creá tu cuenta de marca</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>Encontrá al influencer ideal para tu negocio.</div>
            <div className="field"><label>Nombre completo</label><input placeholder="Ej: Martina García" /></div>
            <div className="field"><label>Email</label><input type="email" placeholder="hola@tumarca.com" /></div>
            <div className="field-row">
              <div className="field"><label>Contraseña</label><input type="password" placeholder="Mínimo 8 caracteres" /></div>
              <div className="field"><label>Repetir</label><input type="password" placeholder="Repetir" /></div>
            </div>
            <div className="divider" />
            <div className="card-title">Datos de tu negocio</div>
            <div className="field"><label>Nombre de la marca o empresa</label><input placeholder="Ej: Tienda Nómade" /></div>
            <div className="field-row">
              <div className="field"><label>Rubro</label>
                <select>{NICHES.map(n=><option key={n}>{n}</option>)}</select>
              </div>
              <div className="field"><label>Zona</label>
                <select>{ZONES.map(z=><option key={z}>{z}</option>)}</select>
              </div>
            </div>
            <div className="field"><label>Instagram o web (opcional)</label><input placeholder="@tumarca o www.tumarca.com" /></div>
          </>
        ) : (
          <>
            <div style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>Creá tu perfil de influencer</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>Mostrá lo que valés y empezá a cobrar.</div>
            <div className="field"><label>Nombre completo</label><input placeholder="Tu nombre real" /></div>
            <div className="field"><label>Email</label><input type="email" placeholder="hola@vos.com" /></div>
            <div className="field-row">
              <div className="field"><label>Contraseña</label><input type="password" placeholder="Mínimo 8 caracteres" /></div>
              <div className="field"><label>Repetir</label><input type="password" placeholder="Repetir" /></div>
            </div>
            <div className="divider" />
            <div className="card-title">Tu perfil público</div>
            <div className="field"><label>Usuario de Instagram</label><input placeholder="@tuusuario" /></div>
            <div className="field-row">
              <div className="field"><label>Seguidores</label><input type="number" placeholder="Ej: 28000" /></div>
              <div className="field"><label>Zona</label><select>{ZONES.map(z=><option key={z}>{z}</option>)}</select></div>
            </div>
            <div className="card-title" style={{ marginTop:4 }}>Nicho / categoría</div>
            <div className="tags-wrap">
              {NICHES.map(n => (
                <span key={n} className={`tag ${selectedNiches.includes(n)?'on':''}`} onClick={() => toggleNiche(n)}>{n}</span>
              ))}
            </div>
            <div className="divider" />
            <div className="card-title">Tus servicios</div>
            <div className="grid-2" style={{ marginBottom:12 }}>
              {SERVICES_LIST.map(s => (
                <div key={s} className={`service-opt ${activeServices.includes(s)?'selected':''}`} onClick={() => toggleService(s)}>
                  <span style={{ fontSize:13 }}>{s}</span>
                  <span style={{ fontSize:11, color: activeServices.includes(s) ? 'var(--purple-lt)' : 'var(--text2)' }}>
                    {activeServices.includes(s) ? '✓' : '+'}
                  </span>
                </div>
              ))}
            </div>
            {activeServices.map(s => (
              <div key={s} style={{ display:'grid', gridTemplateColumns:'auto 1fr 80px', gap:8, alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'var(--text2)', minWidth:80 }}>{s}</span>
                <input type="number" placeholder="Precio" style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'8px 10px', fontSize:13, color:'var(--text)', fontFamily:'var(--font-body)' }} />
                <select style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'8px 8px', fontSize:13, color:'var(--text)', fontFamily:'var(--font-body)' }}>
                  <option>ARS</option><option>USD</option>
                </select>
              </div>
            ))}
          </>
        )}
        <button className="btn btn-primary btn-full" style={{ marginTop:16 }} onClick={() => onNav(role==='marca'?'brand-panel':'inf-panel')}>
          Crear {role==='marca'?'cuenta':'perfil'} ↗
        </button>
        <div style={{ textAlign:'center', fontSize:12, color:'var(--text2)', marginTop:12 }}>
          ¿Ya tenés cuenta? <span style={{ color:'var(--purple-lt)', cursor:'pointer' }} onClick={() => onNav('login')}>Iniciá sesión</span>
        </div>
      </div>
    </div>
  );
}

// 4. INFLUENCER PROFILE
function Profile({ onNav, influencer }) {
  const inf = influencer || INFLUENCERS[0];
  const [tab, setTab] = useState('servicios');

  return (
    <div>
      <div className="hero">
        <div className="hero-inner">
          <div style={{ display:'flex', gap:14, alignItems:'flex-start', flexWrap:'wrap' }}>
            <AvatarEl initials={inf.initials} color={inf.color} textColor={inf.textColor} size="lg" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:22, fontWeight:500, marginBottom:3 }}>
                {inf.name}
                <span style={{ fontSize:11, color:'var(--green)', marginLeft:8, display:'inline-flex', alignItems:'center', gap:3 }}>
                  <i className="ti ti-rosette-discount-check" /> verificada
                </span>
              </div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:10 }}>{inf.handle} · Instagram</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                <span className="pill pill-purple">{inf.niche}</span>
                <span className="pill pill-green">{inf.followers} seg.</span>
                <span className="pill pill-gray">{inf.zone}</span>
              </div>
              <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
                Comparto contenido desde {inf.zone}. Trabajo con marcas que me representan genuinamente.
              </div>
            </div>
          </div>
          <div className="stats-row" style={{ marginTop:16 }}>
            <div className="stat-cell"><div className="stat-num">{inf.followers}</div><div className="stat-lbl">Seg.</div></div>
            <div className="stat-cell"><div className="stat-num">{inf.eng}</div><div className="stat-lbl">Eng.</div></div>
            <div className="stat-cell"><div className="stat-num">{inf.campaigns}</div><div className="stat-lbl">Campañas</div></div>
            <div className="stat-cell"><div className="stat-num">{inf.rating} ★</div><div className="stat-lbl">Rating</div></div>
          </div>
        </div>
      </div>

      <div className="toggle-bar">
        {['servicios','portfolio','reseñas'].map(t => (
          <button key={t} className={`toggle-btn ${tab===t?'active':''}`} onClick={() => setTab(t)} style={{ textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'servicios' && (
        <div className="card">
          <div className="card-title">Servicios y aranceles</div>
          {inf.services.map(s => (
            <div key={s.name} className="row-item">
              <i className={`ti ${s.icon}`} style={{ fontSize:18, color:'var(--purple-lt)' }} />
              <div className="row-info"><div className="row-name">{s.name}</div></div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, fontWeight:500 }}>{s.price}</span>
                <button className="btn btn-primary btn-sm" onClick={() => onNav('hire', { inf, service: s })}>Contratar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'portfolio' && (
        <div className="card">
          <div className="card-title">Portfolio con métricas</div>
          <div className="portfolio-grid">
            {inf.portfolio.map((p,i) => (
              <div key={i} className="port-card">
                <div className="port-thumb" style={{ background: i===0 ? '#1a0f2e' : i===1 ? '#0d1a2e' : '#1a1208' }}>
                  <span style={{ fontSize:28 }}>{p.emoji}</span>
                  <span className="port-badge">{p.type}</span>
                  <span className="port-brand">{p.brand}</span>
                </div>
                <div className="port-metrics">
                  <div className="port-metric"><div className="port-metric-num">{p.reach}</div><div className="port-metric-lbl">Alcance</div></div>
                  <div className="port-metric"><div className="port-metric-num">{p.likes}</div><div className="port-metric-lbl">Likes</div></div>
                  <div className="port-metric"><div className="port-metric-num">{p.comments}</div><div className="port-metric-lbl">Coment.</div></div>
                  <div className="port-metric"><div className="port-metric-num">{p.eng}</div><div className="port-metric-lbl">Eng.</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reseñas' && (
        <div className="card">
          <div className="card-title">Reseñas de marcas</div>
          {[['Tienda Nómade','★★★★★','Muy profesional, entregó antes del plazo. La seguimos contratando.','Reel'],['Studio Luce','★★★★★','El contenido tuvo un engagement increíble. Muy buena comunicación.','Historia'],['Glam BA','★★★★☆','Buen trabajo, cumplió en tiempo. Recomendable para campañas de moda.','Publicación']].map(([brand,stars,text,svc]) => (
            <div key={brand} className="row-item" style={{ flexDirection:'column', alignItems:'flex-start', gap:4 }}>
              <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{brand}</span>
                <span style={{ color:'var(--amber)', fontSize:12 }}>{stars}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{text}</div>
              <span style={{ fontSize:11, color:'var(--purple-lt)' }}>{svc}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'var(--bg)', borderRadius:'var(--radius-lg)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontSize:13, color:'var(--text2)' }}>
          <strong style={{color:'var(--text)'}}>El pago queda retenido hasta que publique.</strong>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-outline btn-sm">Consultar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav('hire', { inf, service: inf.services[0] })}>Contratar ahora ↗</button>
        </div>
      </div>
    </div>
  );
}

// 5. HIRE FLOW
function Hire({ onNav, data }) {
  const [step, setStep] = useState(1);
  const [selService, setSelService] = useState(data?.service || data?.inf?.services[0]);
  const [restrictions, setRestrictions] = useState([]);
  const inf = data?.inf || INFLUENCERS[0];

  const RESTRICT_TAGS = ['No mencionar competidores','No mostrar alcohol','Sin lenguaje negativo','No mostrar otras marcas','No mencionar política','Sin filtros que alteren el producto'];

  const toggleR = r => setRestrictions(prev => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev,r]);

  const priceNum = selService ? parseFloat((selService.price||'').replace(/[^0-9.]/g,'')) || 80 : 80;
  const fee = (priceNum * 0.05).toFixed(2);
  const infFee = (priceNum * 0.03).toFixed(2);
  const total = (priceNum * 1.05).toFixed(2);

  return (
    <div style={{ maxWidth:480, margin:'0 auto' }}>
      <Logo />
      <div className="progress-steps">
        {['Servicio','Briefing','Restricciones','Pago'].map((label,i) => (
          <>
            <div key={label} className="prog-step">
              <div className={`prog-circle ${step===i+1?'active':step>i+1?'done':''}`}>{step>i+1?'✓':i+1}</div>
              <div className={`prog-label ${step===i+1?'active':''}`}>{label}</div>
            </div>
            {i < 3 && <div key={`line-${i}`} className={`prog-line ${step>i+1?'done':''}`} />}
          </>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="card">
            <div className="card-title">Influencer seleccionada</div>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <AvatarEl initials={inf.initials} color={inf.color} textColor={inf.textColor} size="md" />
              <div><div style={{ fontSize:14, fontWeight:500 }}>{inf.name}</div><div style={{ fontSize:12, color:'var(--text2)' }}>{inf.handle} · {inf.followers} · {inf.niche}</div></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Elegí el servicio</div>
            <div className="grid-2">
              {inf.services.map(s => (
                <div key={s.name} className={`service-opt ${selService?.name===s.name?'selected':''}`} onClick={() => setSelService(s)}>
                  <span style={{ fontSize:13 }}>{s.name}</span>
                  <span style={{ fontSize:13, fontWeight:500 }}>{s.price}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>Continuar →</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="card">
            <div className="card-title">Briefing de la campaña</div>
            <div className="field"><label>¿Qué querés que comunique?</label><textarea placeholder="Ej: Presentar nuestra nueva línea de ropa de invierno..." /></div>
            <div className="field"><label>Objetivo principal</label>
              <select><option>Visibilidad de marca</option><option>Llevar tráfico a mi web</option><option>Ventas directas</option><option>Lanzamiento de producto</option></select>
            </div>
            <div className="field"><label>Hashtags o menciones obligatorias</label><input placeholder="Ej: #NuevaColección @mimarca" /></div>
            <div className="field"><label>Fecha límite de publicación</label><input type="date" /></div>
            <div className="field"><label>¿Querés aprobar el borrador primero?</label>
              <select><option>Sí, quiero ver el borrador primero</option><option>No, confío en el criterio del influencer</option></select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-full" onClick={() => setStep(1)}>← Volver</button>
            <button className="btn btn-primary btn-full" onClick={() => setStep(3)}>Continuar →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="card">
            <div className="card-title">Restricciones y límites</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:12, lineHeight:1.5 }}>
              Indicá qué NO querés que aparezca o se haga en el contenido.
            </div>
            <div className="tags-wrap">
              {RESTRICT_TAGS.map(r => (
                <span key={r} className={`tag ${restrictions.includes(r)?'danger on':''}`} onClick={() => toggleR(r)}>{r}</span>
              ))}
            </div>
            <div className="field"><label>Restricciones adicionales</label><textarea placeholder="Ej: No queremos que aparezcan otras personas usando el producto..." /></div>
            <div className="field"><label>Tono deseado</label>
              <select><option>Natural y auténtico</option><option>Aspiracional y premium</option><option>Divertido y cercano</option><option>Informativo y detallado</option></select>
            </div>
            <div style={{ background:'var(--amber-bg)', borderRadius:'var(--radius-sm)', padding:'10px 12px', fontSize:12, color:'var(--amber)', display:'flex', gap:6, alignItems:'flex-start' }}>
              <i className="ti ti-alert-triangle" style={{ flexShrink:0, marginTop:1 }} />
              <span>El influencer recibirá estas restricciones antes de aceptar el trabajo.</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-full" onClick={() => setStep(2)}>← Volver</button>
            <button className="btn btn-primary btn-full" onClick={() => setStep(4)}>Continuar →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="card">
            <div className="card-title">Resumen del pedido</div>
            <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'14px' }}>
              {[['Influencer', inf.name], ['Servicio', selService?.name], ['Subtotal', selService?.price], [`Comisión plataforma (5%)`, `${selService?.price?.includes('USD')?'USD':'$'} ${fee}`]].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:8 }}>
                  <span>{k}</span><span style={{color:'var(--text)'}}>{v}</span>
                </div>
              ))}
              <div style={{ height:'0.5px', background:'var(--border)', margin:'8px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:500 }}>
                <span>Total a pagar</span><span style={{color:'var(--green)'}}>
                  {selService?.price?.includes('USD')?'USD':'$'} {total}
                </span>
              </div>
            </div>
            <div className="escrow-note">
              <i className="ti ti-shield-check" />
              <span>Tu dinero queda retenido de forma segura. Se libera <strong>solo cuando confirmés</strong> que el influencer cumplió.</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Método de pago</div>
            <div className="grid-2">
              {[['ti-credit-card','Tarjeta'],['ti-building-bank','Transferencia'],['ti-currency-dollar','Crypto (USDT)'],['ti-device-mobile','Mercado Pago']].map(([icon,label]) => (
                <div key={label} className="service-opt"><i className={`ti ${icon}`} style={{ fontSize:17, color:'var(--text2)' }} /> <span style={{fontSize:13}}>{label}</span></div>
              ))}
            </div>
            <div className="field" style={{ marginTop:12 }}><label>Número de tarjeta</label><input placeholder="•••• •••• •••• ••••" /></div>
            <div className="field-row">
              <div className="field"><label>Vencimiento</label><input placeholder="MM/AA" /></div>
              <div className="field"><label>CVV</label><input placeholder="•••" /></div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-full" onClick={() => setStep(3)}>← Volver</button>
            <button className="btn btn-primary btn-full" onClick={() => onNav('tracking')}>Confirmar y pagar ↗</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. TRACKING
function Tracking({ onNav }) {
  const [view, setView] = useState('marca');
  const [resolved, setResolved] = useState(null);

  return (
    <div>
      <Logo />
      <div className="toggle-bar">
        <button className={`toggle-btn ${view==='marca'?'active':''}`} onClick={() => setView('marca')}><i className="ti ti-building-store" /> Vista marca</button>
        <button className={`toggle-btn ${view==='influencer'?'active':''}`} onClick={() => setView('influencer')}><i className="ti ti-camera" /> Vista influencer</button>
      </div>

      {view === 'marca' && (
        <div>
          <div className="hero">
            <div className="hero-inner">
              <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text2)', marginBottom:6 }}>Campaña activa</div>
              <div style={{ fontSize:18, fontWeight:500, color:'var(--text)', marginBottom:6 }}>Historia · Vale López</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:10 }}>Vale publicó el contenido. Tenés 24hs para confirmar o reclamar.</div>
              <span className="pill pill-amber"><i className="ti ti-clock" /> Esperando tu confirmación</span>
            </div>
          </div>

          <div className="countdown-box">
            <div>
              <div style={{ fontSize:12, color:'var(--purple-lt)' }}>Tiempo para confirmar o reclamar</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>Si no hacés nada, el pago se libera automáticamente</div>
            </div>
            <div className="countdown-time">18:42:07</div>
          </div>

          <div className="card">
            <div className="card-title">Contenido publicado</div>
            <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:12, display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
              <div style={{ width:56, height:56, background:'var(--purple-bg)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>👗</div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>Historia publicada · 5 jun · 14:32hs</div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>Instagram · @valelopez</div>
                <div style={{ fontSize:12, color:'var(--purple-lt)', marginTop:4, cursor:'pointer' }}><i className="ti ti-external-link" /> Ver en Instagram</div>
              </div>
            </div>
            {!resolved && (
              <div className="grid-2">
                <button className="btn btn-green btn-full" onClick={() => setResolved('ok')}>
                  <i className="ti ti-shield-check" /> Confirmar y liberar
                </button>
                <button className="btn btn-red btn-full" onClick={() => setResolved('claim')}>
                  <i className="ti ti-alert-circle" /> Tengo un reclamo
                </button>
              </div>
            )}
            {resolved === 'ok' && (
              <div style={{ background:'var(--green-bg)', borderRadius:'var(--radius-sm)', padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>✅</div>
                <div style={{ fontSize:15, fontWeight:500, color:'var(--green)', marginBottom:4 }}>¡Pago liberado!</div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>USD 35 fueron enviados a Vale López.</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={() => onNav('rating')}>Dejar reseña ↗</button>
              </div>
            )}
            {resolved === 'claim' && (
              <div style={{ marginTop:12 }}>
                <div className="card" style={{ border:'0.5px solid rgba(226,75,74,0.3)' }}>
                  <div className="card-title" style={{color:'var(--red)'}}>Formulario de reclamo</div>
                  <div className="field"><label>Motivo del reclamo</label>
                    <select><option>No respetó las restricciones acordadas</option><option>No publicó el contenido</option><option>El contenido difiere del borrador aprobado</option><option>Lo eliminó antes de tiempo</option></select>
                  </div>
                  <div className="field"><label>Describí el problema</label><textarea placeholder="Ej: La historia no incluyó el hashtag obligatorio..." /></div>
                  <button className="btn btn-red btn-full">Enviar reclamo ↗</button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Historial de la campaña</div>
            <div className="timeline">
              {[['done','3 jun · 10:15hs','Pago retenido en escrow','USD 38.50 retenidos. Vale recibió el briefing.'],['done','3 jun · 10:22hs','Trabajo aceptado','Vale aceptó las condiciones y restricciones.'],['done','4 jun · 16:00hs','Borrador aprobado','Vale envió el borrador y fue aprobado.'],['active','5 jun · 14:32hs','Contenido publicado ✓','Vale marcó el trabajo como completado.'],['pending','Pendiente','Confirmación de la marca','Tenés 24hs para revisar.'],['pending','Pendiente','Pago liberado','USD 35 irán a Vale López.']].map(([status,time,title,desc]) => (
                <div key={title} className="tl-item">
                  <div className={`tl-dot ${status}`} />
                  <div className="tl-time">{time}</div>
                  <div className="tl-title">{title}</div>
                  <div className="tl-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'influencer' && (
        <div>
          <div className="hero" style={{ background:'#0a120a' }}>
            <div className="hero-inner">
              <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text2)', marginBottom:6 }}>Tu campaña activa</div>
              <div style={{ fontSize:18, fontWeight:500, color:'var(--text)', marginBottom:6 }}>Historia · Tienda Nómade</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:10 }}>Publicaste el contenido. Estamos esperando la confirmación de la marca.</div>
              <span className="pill pill-green"><i className="ti ti-clock" /> Pago por liberarse · USD 35</span>
            </div>
          </div>

          <div className="countdown-box" style={{ background:'var(--green-bg)' }}>
            <div>
              <div style={{ fontSize:12, color:'var(--green)' }}>Tu pago se libera en</div>
              <div style={{ fontSize:11, color:'rgba(74,222,128,0.5)', marginTop:2 }}>Si la marca no reclama, el dinero es tuyo automáticamente</div>
            </div>
            <div className="countdown-time" style={{ color:'var(--green)' }}>18:42:07</div>
          </div>

          <div className="card">
            <div className="card-title">¿Todavía no publicaste?</div>
            <div style={{ border:'1px dashed var(--border)', borderRadius:'var(--radius-sm)', padding:'1.5rem', textAlign:'center', cursor:'pointer', marginBottom:12 }}>
              <i className="ti ti-upload" style={{ fontSize:28, color:'var(--text2)', display:'block', marginBottom:8 }} />
              <div style={{ fontSize:13, color:'var(--text2)' }}>Subí la captura de tu publicación</div>
              <div style={{ fontSize:12, color:'var(--purple-lt)' }}>PNG, JPG o link directo al post</div>
            </div>
            <div className="field"><label>Link directo a la publicación</label><input placeholder="https://instagram.com/p/..." /></div>
            <button className="btn btn-green btn-full">Marcar como completado ✓</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 7. BRAND PANEL
function BrandPanel({ onNav }) {
  const [tab, setTab] = useState('resumen');

  return (
    <div>
      <div className="hero">
        <div className="hero-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:500, color:'var(--text)', marginBottom:4 }}>Hola, Tienda Nómade 👋</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Tenés 2 campañas activas y 1 esperando confirmación.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNav('landing')}>+ Nueva campaña</button>
        </div>
      </div>

      <div className="toggle-bar" style={{ overflowX:'auto' }}>
        {[['resumen','ti-layout-dashboard','Resumen'],['campanas','ti-speakerphone','Campañas'],['favoritos','ti-heart','Favoritos'],['metricas','ti-chart-bar','Métricas'],['notifs','ti-bell','Alertas']].map(([id,icon,label]) => (
          <button key={id} className={`toggle-btn ${tab===id?'active':''}`} onClick={() => setTab(id)}><i className={`ti ${icon}`} />{label}</button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div>
          <div className="grid-4" style={{ marginBottom:12 }}>
            {[['Campañas totales','7','↑ 2 activas'],['Invertido total','USD 610','↑ +USD 155'],['Alcance total','184K','↑ personas'],['Eng. promedio','5.8%','↑ sobre mercado']].map(([l,n,d]) => (
              <div key={l} className="card-sm" style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--text2)', marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:18, fontWeight:500 }}>{n}</div>
                <div style={{ fontSize:11, color:'var(--green)', marginTop:3 }}>{d}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Campañas recientes</div>
            {[{initials:'VL',color:'#2a1a4a',tc:'#a78bfa',name:'Vale López · Historia',meta:'@valelopez · CABA',status:'Esperando OK',sc:'pill-amber',amount:'USD 35'},{initials:'MG',color:'#0d2112',tc:'#4ade80',name:'Maxi González · Reel',meta:'@maxifit · Córdoba',status:'En progreso',sc:'pill-purple',amount:'USD 120'},{initials:'LV',color:'#1a1228',tc:'#a78bfa',name:'Lucía Viajes · Post',meta:'@luciaviajes · CABA',status:'Completada',sc:'pill-green',amount:'USD 80'}].map(c => (
              <div key={c.name} className="row-item">
                <AvatarEl initials={c.initials} color={c.color} textColor={c.tc} size="sm" />
                <div className="row-info"><div className="row-name">{c.name}</div><div className="row-sub">{c.meta}</div></div>
                <div className="row-right"><span className={`pill ${c.sc}`}>{c.status}</span><div className="row-amount" style={{marginTop:4}}>{c.amount}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'campanas' && (
        <div className="card">
          <div className="card-title">Historial de campañas</div>
          {[{initials:'VL',color:'#2a1a4a',tc:'#a78bfa',name:'Vale López · Historia',date:'5 jun',sc:'pill-amber',status:'Esperando OK',amount:'USD 35',time:'18hs'},{initials:'MG',color:'#0d2112',tc:'#4ade80',name:'Maxi González · Reel',date:'3 jun',sc:'pill-purple',status:'En progreso',amount:'USD 120',time:'2 días'},{initials:'LV',color:'#1a1228',tc:'#a78bfa',name:'Lucía Viajes · Post',date:'28 may',sc:'pill-green',status:'Completada',amount:'USD 80',time:''},{initials:'SR',color:'#1a0d14',tc:'#f472b6',name:'Sofi Ríos · Review',date:'20 may',sc:'pill-green',status:'Completada',amount:'USD 55',time:''},{initials:'XX',color:'#1a0808',tc:'#f87171',name:'@modaba22 · Reel',date:'10 may',sc:'pill-red',status:'En reclamo',amount:'USD 120',time:''}].map(c => (
            <div key={c.name} className="row-item">
              <AvatarEl initials={c.initials} color={c.color} textColor={c.tc} size="sm" />
              <div className="row-info"><div className="row-name">{c.name}</div><div className="row-sub">{c.date}</div></div>
              <div className="row-right"><span className={`pill ${c.sc}`}>{c.status}</span><div className="row-amount" style={{marginTop:4}}>{c.amount}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'favoritos' && (
        <div>
          {INFLUENCERS.map(inf => (
            <div key={inf.id} className="inf-card" style={{ marginBottom:10 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <AvatarEl initials={inf.initials} color={inf.color} textColor={inf.textColor} size="md" />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ fontSize:14, fontWeight:500 }}>{inf.name}</div>
                    <i className="ti ti-heart-filled" style={{ color:'var(--red)', fontSize:16 }} />
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6 }}>{inf.handle} · {inf.followers} · {inf.eng} eng.</div>
                  <span className="pill pill-purple" style={{ fontSize:10 }}>{inf.niche}</span>
                </div>
              </div>
              <button className="btn btn-outline btn-sm btn-full" style={{ marginTop:10 }} onClick={() => onNav('hire', { inf, service: inf.services[0] })}>Contratar</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'metricas' && (
        <div className="card">
          <div className="card-title">Rendimiento de campañas</div>
          {[['ti-eye','Alcance total acumulado','184.200 personas'],['ti-heart','Likes totales','11.300'],['ti-message-circle','Comentarios totales','1.050'],['ti-click','Clicks en links','3.840'],['ti-chart-line','Engagement promedio','5.8%'],['ti-currency-dollar','Costo por 1000 alcanzados','USD 3.31']].map(([icon,label,val]) => (
            <div key={label} className="row-item">
              <i className={`ti ${icon}`} style={{ fontSize:18, color:'var(--purple-lt)' }} />
              <div className="row-info"><div className="row-name">{label}</div></div>
              <div style={{ fontSize:14, fontWeight:500 }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'notifs' && (
        <div className="card">
          <div className="card-title">Notificaciones</div>
          {[{dot:'var(--purple)',text:<><strong>Vale López</strong> publicó la historia. Tenés <strong>18hs</strong> para confirmar o reclamar.</>,time:'Hace 5 horas'},{dot:'var(--purple)',text:<><strong>Maxi González</strong> envió el borrador del reel para tu aprobación.</>,time:'Hace 2 horas'},{dot:'var(--border)',text:<><strong>Lucía Viajes</strong> completó el post. Pago de USD 80 liberado automáticamente.</>,time:'Ayer · 18:00hs'},{dot:'var(--border)',text:<>Tu reclamo contra <strong>@modaba22</strong> está siendo revisado por el equipo de Io Sono.</>,time:'Hace 3 días'}].map((n,i) => (
            <div key={i} className="notif-item">
              <div className="notif-dot" style={{ background:n.dot }} />
              <div>
                <div style={{ fontSize:13, lineHeight:1.5 }}>{n.text}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 8. INFLUENCER PANEL
function InfPanel({ onNav }) {
  const [tab, setTab] = useState('resumen');

  return (
    <div>
      <div className="hero" style={{ background:'#0a120a' }}>
        <div className="hero-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:500, color:'var(--text)', marginBottom:4 }}>Hola, Vale López 👋</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Tenés 2 trabajos activos y 1 oferta nueva.</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--green)', letterSpacing:'0.05em', textTransform:'uppercase' }}>Disponible</div>
            <div style={{ fontSize:24, fontWeight:500, color:'var(--green)' }}>USD 315</div>
            <div style={{ fontSize:11, color:'var(--text2)' }}>+ USD 35 por liberar</div>
          </div>
        </div>
      </div>

      <div className="toggle-bar" style={{ overflowX:'auto' }}>
        {[['resumen','ti-layout-dashboard','Resumen'],['trabajos','ti-briefcase','Trabajos'],['ingresos','ti-currency-dollar','Ingresos'],['ofertas','ti-bell','Ofertas']].map(([id,icon,label]) => (
          <button key={id} className={`toggle-btn ${tab===id?'active':''}`} onClick={() => setTab(id)}><i className={`ti ${icon}`} />{label}</button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div>
          <div className="grid-4" style={{ marginBottom:12 }}>
            {[['Trabajos','12','2 activos'],['Este mes','USD 155','+40%'],['Total','USD 980','acumulado'],['Rating','4.9 ★','11 reseñas']].map(([l,n,d]) => (
              <div key={l} className="card-sm" style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--text2)', marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:16, fontWeight:500 }}>{n}</div>
                <div style={{ fontSize:11, color:'var(--green)', marginTop:3 }}>{d}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Trabajos activos</div>
            {[{icon:'ti-clock',bg:'var(--purple-bg)',tc:'var(--purple-lt)',name:'Tienda Nómade · Historia',meta:'Publicaste · esperando confirmación',sc:'pill-amber',status:'18hs restantes',amount:'USD 35'},{icon:'ti-player-play',bg:'var(--green-bg)',tc:'var(--green)',name:'Viajes Latam · Reel',meta:'En progreso · vence en 3 días',sc:'pill-purple',status:'En progreso',amount:'USD 120'}].map(t => (
              <div key={t.name} className="row-item">
                <div style={{ width:38, height:38, background:t.bg, borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`ti ${t.icon}`} style={{ color:t.tc, fontSize:18 }} />
                </div>
                <div className="row-info"><div className="row-name">{t.name}</div><div className="row-sub">{t.meta}</div></div>
                <div className="row-right"><span className={`pill ${t.sc}`}>{t.status}</span><div className="row-amount" style={{marginTop:4}}>{t.amount}</div></div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Ingresos por mes</div>
            <div className="bar-chart">
              {[['Ene',39],['Feb',52],['Mar',36],['Abr',71],['May',65],['Jun',100]].map(([m,h]) => (
                <div key={m} className="bar-col">
                  <div className="bar-col-fill" style={{ height:`${h}%`, background: m==='Jun'?'var(--purple-lt)':'var(--green)' }} />
                  <div className="bar-col-lbl">{m}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'trabajos' && (
        <div className="card">
          <div className="card-title">Historial de trabajos</div>
          {[{icon:'ti-clock',bg:'var(--purple-bg)',tc:'var(--purple-lt)',name:'Tienda Nómade · Historia',date:'5 jun',sc:'pill-amber',status:'Esperando OK',amount:'USD 35'},{icon:'ti-player-play',bg:'var(--green-bg)',tc:'var(--green)',name:'Viajes Latam · Reel',date:'3 jun',sc:'pill-purple',status:'En progreso',amount:'USD 120'},{icon:'ti-check',bg:'var(--green-bg)',tc:'var(--green)',name:'Studio Luce · Post',date:'28 may',sc:'pill-green',status:'Pagado',amount:'USD 80'},{icon:'ti-check',bg:'var(--green-bg)',tc:'var(--green)',name:'Savia Skincare · Reel',date:'20 may',sc:'pill-green',status:'Pagado',amount:'USD 120'},{icon:'ti-alert-circle',bg:'var(--red-bg)',tc:'var(--red)',name:'Glam BA · Review',date:'10 may',sc:'pill-red',status:'En reclamo',amount:'USD 95'}].map(t => (
            <div key={t.name} className="row-item">
              <div style={{ width:36, height:36, background:t.bg, borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className={`ti ${t.icon}`} style={{ color:t.tc, fontSize:16 }} />
              </div>
              <div className="row-info"><div className="row-name">{t.name}</div><div className="row-sub">{t.date}</div></div>
              <div className="row-right"><span className={`pill ${t.sc}`}>{t.status}</span><div className="row-amount" style={{marginTop:4}}>{t.amount}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ingresos' && (
        <div>
          <div className="card">
            <div className="card-title">Historial de ingresos</div>
            {[{dot:'var(--amber)',brand:'Tienda Nómade',svc:'Historia · 5 jun · por liberar',amount:'USD 35',ac:'var(--amber)'},{dot:'var(--green)',brand:'Studio Luce',svc:'Post · 28 may · pagado',amount:'USD 80',ac:'var(--green)'},{dot:'var(--green)',brand:'Savia Skincare',svc:'Reel · 20 may · pagado',amount:'USD 120',ac:'var(--green)'},{dot:'var(--red)',brand:'Glam BA',svc:'Review · 10 may · en disputa',amount:'USD 95',ac:'var(--red)'}].map((i,idx) => (
              <div key={idx} className="row-item">
                <div style={{ width:8, height:8, borderRadius:'50%', background:i.dot, flexShrink:0 }} />
                <div className="row-info"><div className="row-name">{i.brand}</div><div className="row-sub">{i.svc}</div></div>
                <div style={{ fontSize:14, fontWeight:500, color:i.ac }}>{i.amount}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Retirar fondos</div>
            <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'14px', marginBottom:12 }}>
              {[['Saldo disponible','USD 315.00','var(--green)'],['Por liberar','USD 35.00','var(--amber)'],['En disputa','USD 95.00','var(--red)']].map(([l,v,c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{color:'var(--text2)'}}>{l}</span><span style={{fontWeight:500,color:c}}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-green btn-full">Retirar USD 315 →</button>
          </div>
        </div>
      )}

      {tab === 'ofertas' && (
        <div>
          {[{brand:'Glam BA · Nueva oferta',amount:'USD 140',svc:'Reel · Fecha límite: 12 jun',border:'var(--purple)'},{brand:'Tienda Nómade · Campaña recurrente',amount:'USD 35/mes',svc:'Historia mensual · 3 meses garantizados',border:'var(--green)'}].map(o => (
            <div key={o.brand} style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'12px 14px', marginBottom:8, borderLeft:`3px solid ${o.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{o.brand}</span>
                <span style={{ fontSize:14, fontWeight:500, color:'var(--green)' }}>{o.amount}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>{o.svc}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-green btn-sm">Aceptar ✓</button>
                <button className="btn btn-outline btn-sm">Declinar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 9. ADMIN PANEL
function AdminPanel() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div>
      <div style={{ textAlign:'center', padding:'16px 0 8px' }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:14, color:'var(--text2)', letterSpacing:'0.18em', textTransform:'uppercase' }}>
          <span style={{color:'var(--purple-lt)'}}>IO SONO</span> · admin
        </span>
        <span style={{ fontSize:10, color:'var(--red)', background:'var(--red-bg)', padding:'2px 8px', borderRadius:100, marginLeft:6 }}>● live</span>
      </div>

      <div className="toggle-bar" style={{ overflowX:'auto', gap:2 }}>
        {[['dashboard','ti-layout-dashboard','Dashboard'],['usuarios','ti-users','Usuarios'],['campanas','ti-speakerphone','Campañas'],['escrow','ti-shield-check','Escrow'],['reclamos','ti-alert-circle','Reclamos'],['verificacion','ti-rosette-discount-check','Verificación']].map(([id,icon,label]) => (
          <button key={id} className={`toggle-btn ${tab===id?'active':''}`} onClick={() => setTab(id)} style={{ fontSize:11 }}>
            <i className={`ti ${icon}`} style={{ fontSize:13 }} />{label}
            {id==='reclamos' && <span style={{ background:'var(--red)', color:'#fff', fontSize:9, padding:'1px 5px', borderRadius:100, marginLeft:2 }}>3</span>}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div>
          <div className="grid-4" style={{ marginBottom:12 }}>
            {[['Usuarios','1.284','+48 esta semana','var(--green)'],['Campañas activas','87','+12 hoy','var(--green)'],['En escrow','USD 4.2K','+USD 380 hoy','var(--green)'],['Comisiones mes','USD 892','+23% vs ant','var(--green)']].map(([l,n,d,c]) => (
              <div key={l} className="card-sm" style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text2)',marginBottom:4}}>{l}</div>
                <div style={{fontSize:18,fontWeight:500}}>{n}</div>
                <div style={{fontSize:10,color:c,marginTop:3}}>{d}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Actividad reciente</div>
            {[['pill-green','Pago liberado','@valelopez → Tienda Nómade','USD 35','Hace 5 min'],['pill-purple','Nueva campaña','Glam BA → @maxifit','USD 99','Hace 18 min'],['pill-amber','Reclamo abierto','@sofibeauty → Studio Luce','USD 55','Hace 42 min'],['pill-blue','Nuevo influencer','@luciaviajes','—','Hace 1h'],['pill-red','Cuenta suspendida','@fake_influencer99','—','Hace 2h']].map(([sc,type,who,amount,time]) => (
              <div key={who} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--border)' }}>
                <span className={`pill ${sc}`} style={{flexShrink:0,fontSize:10}}>{type}</span>
                <span style={{flex:1,fontSize:12,color:'var(--text2)'}}>{who}</span>
                <span style={{fontSize:12,fontWeight:500}}>{amount}</span>
                <span style={{fontSize:11,color:'var(--text2)'}}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'usuarios' && (
        <div>
          <div className="card">
            <div className="card-title">Influencers</div>
            <table>
              <thead><tr><th>Influencer</th><th>Nicho</th><th>Seg.</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {[{initials:'VL',color:'#2a1a4a',tc:'#a78bfa',name:'Vale López',handle:'@valelopez',niche:'Moda',seg:'28K',sc:'pill-green',status:'Verificada'},{initials:'MG',color:'#0d2112',tc:'#4ade80',name:'Maxi González',handle:'@maxifit',niche:'Fitness',seg:'61K',sc:'pill-green',status:'Verificado'},{initials:'SR',color:'#1a0d14',tc:'#f472b6',name:'Sofi Ríos',handle:'@sofibeauty',niche:'Belleza',seg:'9.2K',sc:'pill-amber',status:'En revisión'},{initials:'FI',color:'#1a1a1a',tc:'#888',name:'fake_influencer99',handle:'@fake99',niche:'—',seg:'1.1K',sc:'pill-red',status:'Suspendido'}].map(u => (
                  <tr key={u.handle}>
                    <td><div style={{display:'flex',gap:8,alignItems:'center'}}><AvatarEl initials={u.initials} color={u.color} textColor={u.tc} size="sm" /><div><div style={{fontSize:12,fontWeight:500}}>{u.name}</div><div style={{fontSize:11,color:'var(--text2)'}}>{u.handle}</div></div></div></td>
                    <td style={{fontSize:12,color:'var(--text2)'}}>{u.niche}</td>
                    <td style={{fontSize:12}}>{u.seg}</td>
                    <td><span className={`pill ${u.sc}`} style={{fontSize:10}}>{u.status}</span></td>
                    <td><button style={{background:'transparent',border:'0.5px solid var(--border)',color:'var(--text2)',fontSize:11,padding:'4px 10px',borderRadius:'var(--radius-sm)',cursor:'pointer'}}>Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reclamos' && (
        <div>
          {[{title:'Savia Skincare vs @sofibeauty',meta:'Motivo: No respetó restricciones · USD 55 · Review',sc:'pill-red',status:'Urgente',border:'var(--red)'},{title:'Studio Luce vs @luciamoda',meta:'Motivo: Publicó antes del lanzamiento · USD 80 · Post',sc:'pill-amber',status:'En revisión',border:'var(--amber)'},{title:'Viajes Latam vs @turismoba',meta:'Motivo: No publicó en horario prime · USD 95 · Historia',sc:'pill-blue',status:'Nuevo',border:'var(--blue)'}].map(r => (
            <div key={r.title} style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'12px 14px', marginBottom:8, borderLeft:`3px solid ${r.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{fontSize:13,fontWeight:500}}>{r.title}</span>
                <span className={`pill ${r.sc}`} style={{fontSize:10}}>{r.status}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>{r.meta}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-green btn-sm">Mediar ↗</button>
                <button style={{background:'transparent',border:'0.5px solid var(--border)',color:'var(--text2)',fontSize:11,padding:'4px 10px',borderRadius:'var(--radius-sm)',cursor:'pointer'}}>Ver campaña</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'verificacion' && (
        <div className="card">
          <div className="card-title">Pendientes de verificación</div>
          <table>
            <thead><tr><th>Influencer</th><th>Seg.</th><th>DNI</th><th>Instagram</th><th></th></tr></thead>
            <tbody>
              {[{initials:'SR',color:'#1a0d14',tc:'#f472b6',name:'Sofi Ríos',handle:'@sofibeauty',seg:'9.2K',dni:'pill-green',dniTxt:'Enviado',ig:'pill-green',igTxt:'Real'},{initials:'LV',color:'#1a1228',tc:'#a78bfa',name:'Lucía Viajes',handle:'@luciaviajes',seg:'14.5K',dni:'pill-amber',dniTxt:'Pendiente',ig:'pill-green',igTxt:'Real'},{initials:'FI',color:'#1a1a1a',tc:'#888',name:'fake_influencer99',handle:'@fake99',seg:'1.1K',dni:'pill-red',dniTxt:'No enviado',ig:'pill-red',igTxt:'Falsa'}].map(u => (
                <tr key={u.handle}>
                  <td><div style={{display:'flex',gap:8,alignItems:'center'}}><AvatarEl initials={u.initials} color={u.color} textColor={u.tc} size="sm" /><div><div style={{fontSize:12,fontWeight:500}}>{u.name}</div><div style={{fontSize:11,color:'var(--text2)'}}>{u.handle}</div></div></div></td>
                  <td style={{fontSize:12}}>{u.seg}</td>
                  <td><span className={`pill ${u.dni}`} style={{fontSize:10}}>{u.dniTxt}</span></td>
                  <td><span className={`pill ${u.ig}`} style={{fontSize:10}}>{u.igTxt}</span></td>
                  <td><div style={{display:'flex',gap:4}}><button className="btn btn-green btn-sm">OK</button><button className="btn btn-red btn-sm">✕</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'campanas' || tab === 'escrow') && (
        <div className="card">
          <div className="card-title">{tab === 'campanas' ? 'Campañas activas' : 'Fondos retenidos'}</div>
          {[{from:'Tienda Nómade → @valelopez',svc:'Historia',amount:'USD 35',sc:'pill-amber',status:'Esperando OK'},{from:'Glam BA → @maxifit',svc:'Reel',amount:'USD 120',sc:'pill-purple',status:'En progreso'},{from:'Savia Skincare → @sofibeauty',svc:'Review',amount:'USD 55',sc:'pill-red',status:'En reclamo'},{from:'Studio Luce → @luciaviajes',svc:'Post',amount:'USD 80',sc:'pill-green',status:'Completada'}].map(c => (
            <div key={c.from} className="row-item">
              <div className="row-info"><div className="row-name" style={{fontSize:12}}>{c.from}</div><div className="row-sub">{c.svc}</div></div>
              <div className="row-right"><span className={`pill ${c.sc}`} style={{fontSize:10}}>{c.status}</span><div className="row-amount" style={{marginTop:4,fontSize:13}}>{c.amount}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 10. CLAIM CHAT
function ClaimChat({ onNav }) {
  const [messages, setMessages] = useState([
    { type:'center', from:'Io Sono Admin', text:'🛡️ Este chat fue creado por el reclamo #1042. Los fondos de USD 55 están congelados hasta resolver.', time:'Hace 42 min' },
    { type:'left',   from:'Savia Skincare', text:'Reclamamos porque en el video aparece un producto de la competencia en el fondo. Eso estaba prohibido.', time:'Hace 38 min' },
    { type:'right',  from:'@sofibeauty', text:'Esa botella no es de un competidor directo, es un hidratante genérico. Puedo grabar una aclaración.', time:'Hace 30 min' },
    { type:'center', from:'Admin', text:'⚖️ Revisamos la captura. El producto visible es de Neutrogena, que compite directamente con Savia. Pedimos a @sofibeauty que proponga una solución.', time:'Hace 10 min' },
    { type:'right',  from:'@sofibeauty', text:'Propongo re-grabar el video sin ese producto y publicarlo hoy mismo sin costo adicional.', time:'Hace 5 min' },
  ]);
  const [input, setInput] = useState('');
  const [resolved, setResolved] = useState(null);

  const sendMsg = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { type:'right', from:'Admin Io Sono', text:input, time:'Ahora' }]);
    setInput('');
  };

  return (
    <div>
      <Logo />
      <div style={{ background:'#0a0808', borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:12, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 80% at 0% 50%, #1a0808 0%, transparent 70%)' }} />
        <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:500, marginBottom:4 }}>Reclamo #1042 · Savia Skincare vs @sofibeauty</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>Review · USD 55 en disputa · Abierto hace 42 min</div>
          </div>
          <span className="pill pill-red">⚡ En mediación</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Evidencia del caso</div>
        <div className="grid-2">
          {[['ti-file-text','Briefing original','Restricciones acordadas','pill-green','Verificado'],['ti-photo','Comprobante publicación','Captura + link','pill-green','Verificado'],['ti-camera','Captura del reclamo','Enviada por Savia','pill-amber','En revisión'],['ti-shield','Fondos en escrow','USD 55 congelados','pill-green','Congelado']].map(([icon,name,sub,sc,status]) => (
            <div key={name} style={{ display:'flex', gap:8, alignItems:'flex-start', background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'10px 12px' }}>
              <i className={`ti ${icon}`} style={{ fontSize:18, color:'var(--purple-lt)', flexShrink:0, marginTop:2 }} />
              <div>
                <div style={{fontSize:12,fontWeight:500}}>{name}</div>
                <div style={{fontSize:11,color:'var(--text2)'}}>{sub}</div>
                <span className={`pill ${sc}`} style={{fontSize:10,marginTop:4,display:'inline-block'}}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-box" style={{ marginBottom:12 }}>
        <div className="chat-head">
          <div style={{ display:'flex', gap:-4 }}>
            {[['#1a1228','#a78bfa','AS'],['#1a0d14','#f472b6','SR'],['#0d2112','#4ade80','IO']].map(([bg,tc,init]) => (
              <div key={init} className="avatar avatar-sm" style={{ background:bg, color:tc, marginLeft:-4, border:'2px solid var(--bg2)' }}>{init}</div>
            ))}
          </div>
          <div style={{ flex:1, marginLeft:8 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>Savia Skincare · @sofibeauty · Admin</div>
            <div style={{ fontSize:11, color:'var(--text2)' }}>3 participantes · Chat de mediación</div>
          </div>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)' }} />
        </div>
        <div className="chat-messages">
          {messages.map((m,i) => (
            <div key={i} className={`msg ${m.type}`}>
              {m.type !== 'center' && <div className="msg-from">{m.from}</div>}
              <div className="msg-bubble">{m.text}</div>
              <div className="msg-time">{m.time}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <i className="ti ti-paperclip" style={{ fontSize:18, color:'var(--text2)', cursor:'pointer' }} />
          <input className="chat-input" placeholder="Escribí un mensaje..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMsg()} />
          <button className="chat-send-btn" onClick={sendMsg}><i className="ti ti-send" style={{fontSize:16}} /></button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Resolución del admin</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:12, lineHeight:1.5 }}>
          Una vez revisada toda la evidencia, tomá una decisión. Es inapelable y se notifica a ambas partes.
        </div>
        {!resolved && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <button className="btn btn-full" style={{ background:'var(--blue-bg)', border:'1px solid rgba(96,165,250,0.3)', color:'var(--blue)', fontSize:12, borderRadius:'var(--radius-sm)' }} onClick={() => setResolved('marca')}>Dar razón a la marca</button>
            <button className="btn btn-full" style={{ background:'var(--green-bg)', border:'1px solid rgba(74,222,128,0.3)', color:'var(--green)', fontSize:12, borderRadius:'var(--radius-sm)' }} onClick={() => setResolved('influencer')}>Liberar al influencer</button>
            <button className="btn btn-full" style={{ background:'var(--red-bg)', border:'1px solid rgba(226,75,74,0.3)', color:'var(--red)', fontSize:12, borderRadius:'var(--radius-sm)' }} onClick={() => setResolved('dividir')}>Dividir el monto</button>
          </div>
        )}
        {resolved && (
          <div style={{ background:'var(--green-bg)', borderRadius:'var(--radius-sm)', padding:'12px 14px', fontSize:13, color:'var(--green)', lineHeight:1.5 }}>
            {resolved==='marca' && '✅ Los USD 55 serán reembolsados a Savia Skincare. @sofibeauty recibe una advertencia.'}
            {resolved==='influencer' && '✅ El pago se libera a @sofibeauty. El producto visible no constituye una violación directa.'}
            {resolved==='dividir' && '✅ El monto se divide. USD 27.50 para cada parte. Sin penalización para ninguno.'}
          </div>
        )}
      </div>
    </div>
  );
}

// 11. RATING
function Rating({ onNav }) {
  const [marcaStars, setMarcaStars] = useState(5);
  const [infStars, setInfStars]     = useState(5);
  const [sent, setSent]             = useState(false);

  return (
    <div>
      <Logo />
      <div className="hero">
        <div className="hero-inner" style={{textAlign:'center'}}>
          <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text2)', marginBottom:6 }}>Campaña completada</div>
          <div style={{ fontSize:20, fontWeight:500, marginBottom:4 }}>Historia · Tienda Nómade × @valelopez</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Pago de USD 35 liberado · Dejá tu reseña</div>
        </div>
      </div>

      {!sent ? (
        <div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Marca puntúa al influencer</div>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>¿Cómo fue Vale López?</div>
              <div className="stars" style={{marginBottom:14}}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={`star ${marcaStars>=n?'on':''}`} onClick={() => setMarcaStars(n)}>★</span>
                ))}
              </div>
              {[['Puntualidad',5],['Calidad del contenido',4],['Comunicación',5],['Respetó restricciones',5]].map(([label,def]) => (
                <div key={label} style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'8px 10px', marginBottom:6 }}>
                  <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>{label}</div>
                  <div style={{display:'flex',gap:4}}>
                    {[1,2,3,4,5].map(n => <span key={n} style={{fontSize:14,color:n<=def?'var(--amber)':'var(--border)',cursor:'pointer'}}>★</span>)}
                  </div>
                </div>
              ))}
              <div className="field" style={{marginTop:8}}><label>Comentario</label><textarea placeholder="Contale a otras marcas cómo fue trabajar con esta influencer..." /></div>
            </div>

            <div className="card">
              <div className="card-title">Influencer puntúa a la marca</div>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>¿Cómo fue Tienda Nómade?</div>
              <div className="stars" style={{marginBottom:14}}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={`star ${infStars>=n?'on':''}`} onClick={() => setInfStars(n)}>★</span>
                ))}
              </div>
              {[['Claridad del briefing',5],['Comunicación',4],['Pagó a tiempo',5],['Respetó mi trabajo',5]].map(([label,def]) => (
                <div key={label} style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'8px 10px', marginBottom:6 }}>
                  <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>{label}</div>
                  <div style={{display:'flex',gap:4}}>
                    {[1,2,3,4,5].map(n => <span key={n} style={{fontSize:14,color:n<=def?'var(--amber)':'var(--border)',cursor:'pointer'}}>★</span>)}
                  </div>
                </div>
              ))}
              <div className="field" style={{marginTop:8}}><label>Comentario</label><textarea placeholder="Contale a otros influencers cómo fue trabajar con esta marca..." /></div>
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => setSent(true)}>Publicar reseñas ↗</button>
        </div>
      ) : (
        <div className="card" style={{textAlign:'center',padding:32}}>
          <div style={{fontSize:40,marginBottom:12}}>⭐</div>
          <div style={{fontSize:20,fontWeight:500,marginBottom:8}}>¡Reseñas publicadas!</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Ambas reseñas ya están visibles en los perfiles correspondientes.</div>
          <div style={{background:'var(--bg2)',borderRadius:'var(--radius-sm)',padding:14,textAlign:'left',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:500}}>@valelopez</span>
              <span style={{color:'var(--amber)'}}>{'★'.repeat(marcaStars)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:13,fontWeight:500}}>Tienda Nómade</span>
              <span style={{color:'var(--amber)'}}>{'★'.repeat(infStars)}</span>
            </div>
          </div>
          <button className="btn btn-outline btn-full" onClick={() => onNav('landing')}>Volver al inicio</button>
        </div>
      )}
    </div>
  );
}

// ─── APP SHELL ─────────────────────────────────────────────────────────────────
export default function IoSono() {
  const [screen, setScreen] = useState('landing');
  const [screenData, setScreenData] = useState(null);

  const nav = (to, data = null) => {
    setScreen(to);
    setScreenData(data);
    window.scrollTo(0, 0);
  };

  const NAV_ITEMS = [
    { id:'landing',     icon:'ti-home',          label:'Inicio' },
    { id:'inf-panel',   icon:'ti-camera',         label:'Influencer' },
    { id:'brand-panel', icon:'ti-building-store', label:'Marca' },
    { id:'admin',       icon:'ti-layout-dashboard',label:'Admin' },
    { id:'login',       icon:'ti-user',           label:'Cuenta' },
  ];

  const renderScreen = () => {
    switch(screen) {
      case 'landing':     return <Landing      onNav={nav} />;
      case 'login':       return <Login        onNav={nav} />;
      case 'register':    return <Register     onNav={nav} />;
      case 'profile':     return <Profile      onNav={nav} influencer={screenData} />;
      case 'hire':        return <Hire         onNav={nav} data={screenData} />;
      case 'tracking':    return <Tracking     onNav={nav} />;
      case 'brand-panel': return <BrandPanel   onNav={nav} />;
      case 'inf-panel':   return <InfPanel     onNav={nav} />;
      case 'admin':       return <AdminPanel   />;
      case 'claim':       return <ClaimChat    onNav={nav} />;
      case 'rating':      return <Rating       onNav={nav} />;
      default:            return <Landing      onNav={nav} />;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {renderScreen()}
      </div>
      <nav className="nav">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`nav-item ${screen===item.id?'active':''}`} onClick={() => nav(item.id)}>
            <i className={`ti ${item.icon}`} />
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
