import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DRIVERS, CONSTRUCTORS, getTeamColor } from '../data';

const NAV_LINKS = ['Dashboard','Live','Races','Drivers','Teams','Stats','More'];

const MORE_ITEMS = [
  { label:'Teams',    to:'/teams',    desc:'Constructor standings & detail' },
  { label:'Drivers',  to:'/drivers',  desc:'Full driver profiles & stats'   },
  { label:'Compare',  to:'/compare',  desc:'Head-to-head driver comparison' },
  { label:'Settings', to:'/settings', desc:'App preferences & display'      },
];

function MoreFlyout({ onClose, sidebar = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const posStyle = sidebar
    ? { position:'absolute', left:'calc(100% + 8px)', bottom:0 }
    : { position:'absolute', top:'calc(100% + 10px)', right:0 };

  return (
    <div ref={ref} style={{
      ...posStyle,
      background:'rgba(13,13,13,0.97)',
      backdropFilter:'blur(32px) saturate(180%)',
      WebkitBackdropFilter:'blur(32px) saturate(180%)',
      border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:14, padding:8, minWidth:240,
      boxShadow:'0 8px 48px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.04) inset',
      zIndex:500,
    }}>
      <div style={{ fontSize:8, letterSpacing:'0.14em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", padding:'4px 10px 8px' }}>Info Pages</div>
      {MORE_ITEMS.map(({ label, to, desc }) => (
        <Link key={to} to={to} onClick={onClose} style={{
          display:'flex', flexDirection:'column', gap:2,
          padding:'9px 12px', borderRadius:8, textDecoration:'none',
          transition:'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'0.03em', color:'#f0f0f0' }}>{label}</span>
          <span style={{ fontSize:11, color:'#484848', fontFamily:"'DM Sans',sans-serif" }}>{desc}</span>
        </Link>
      ))}
    </div>
  );
}

export function FloatingNav({ active, onNav }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div style={{
      position:'fixed', top:14, left:'50%', transform:'translateX(-50%)',
      zIndex:300, display:'flex', alignItems:'center',
      background:'rgba(13,13,13,0.85)',
      backdropFilter:'blur(24px) saturate(180%)',
      WebkitBackdropFilter:'blur(24px) saturate(180%)',
      border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:999, padding:'3px 4px',
      boxShadow:'0 2px 24px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset',
      gap:1,
    }}>
      <div style={{ padding:'4px 12px 4px 10px', borderRight:'1px solid rgba(255,255,255,0.07)', marginRight:3, flexShrink:0 }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#e10600', letterSpacing:'-0.01em', lineHeight:1 }}>F1</span>
      </div>
      {NAV_LINKS.map(label => {
        const id = label.toLowerCase();
        const isActive = active === id;
        if (id === 'more') return (
          <div key="more" style={{ position:'relative' }}>
            <button onClick={() => setMoreOpen(o => !o)} style={{
              background: moreOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
              border:'none', cursor:'pointer',
              padding:'6px 11px', borderRadius:999,
              color: moreOpen ? '#fff' : 'rgba(255,255,255,0.42)',
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
              transition:'all 0.15s', whiteSpace:'nowrap', letterSpacing:'0.01em',
              display:'flex', alignItems:'center', gap:4,
            }}>
              More
              <span style={{ fontSize:9, opacity:0.6, transform: moreOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>▼</span>
            </button>
            {moreOpen && <MoreFlyout onClose={() => setMoreOpen(false)} />}
          </div>
        );
        return (
          <button key={id} onClick={() => onNav(id)} style={{
            background: isActive ? '#e10600' : 'transparent',
            border:'none', cursor:'pointer',
            padding:'6px 11px', borderRadius:999,
            color: isActive ? '#fff' : 'rgba(255,255,255,0.42)',
            fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
            transition:'all 0.15s', whiteSpace:'nowrap', letterSpacing:'0.01em',
          }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function VerticalNav({ active, onNav }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <aside style={{
      width:224, height:'100vh', position:'fixed', left:0, top:0,
      background:'#0c0c0c', borderRight:'1px solid #1c1c1c',
      display:'flex', flexDirection:'column', zIndex:200, flexShrink:0,
    }}>
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid #181818' }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color:'#e10600', lineHeight:1 }}>F1</span>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:14, color:'#383838', marginLeft:8, letterSpacing:'0.1em' }}>2026</span>
      </div>
      <nav style={{ padding:'10px 8px' }}>
        {NAV_LINKS.map(label => {
          const id = label.toLowerCase();
          const isActive = active === id;
          if (id === 'more') return (
            <div key="more" style={{ position:'relative' }}>
              <button onClick={() => setMoreOpen(o => !o)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
                padding:'8px 12px', borderRadius:8, marginBottom:1,
                background: moreOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
                border:'none', cursor:'pointer', textAlign:'left',
                color: moreOpen ? '#fff' : 'rgba(255,255,255,0.35)',
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
                transition:'all 0.15s',
              }}>
                More
                <span style={{ fontSize:10, opacity:0.5, transform: moreOpen ? 'rotate(90deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>›</span>
              </button>
              {moreOpen && <MoreFlyout sidebar onClose={() => setMoreOpen(false)} />}
            </div>
          );
          return (
            <button key={id} onClick={() => onNav(id)} style={{
              display:'flex', alignItems:'center', width:'100%',
              padding:'8px 12px', borderRadius:8, marginBottom:1,
              background: isActive ? 'rgba(225,6,0,0.1)' : 'transparent',
              border:'none', cursor:'pointer', textAlign:'left',
              color: isActive ? '#e10600' : 'rgba(255,255,255,0.35)',
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
              transition:'all 0.15s',
            }}>
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ flex:1, overflowY:'auto', borderTop:'1px solid #181818', paddingTop:12 }}>
        <div style={{ padding:'0 14px 8px', fontSize:9, letterSpacing:'0.14em', color:'#383838', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Driver Standings</div>
        {DRIVERS.slice(0,10).map((d, i) => {
          const color = getTeamColor(d.team);
          return (
            <div key={d.id} style={{
              display:'flex', alignItems:'center', gap:7, padding:'5px 14px',
              cursor:'pointer', transition:'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='#181818'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, color:'#333', width:14, flexShrink:0 }}>{i+1}</span>
              <span style={{ width:2, height:18, borderRadius:1, background:color, flexShrink:0 }} />
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, flex:1, letterSpacing:'0.02em', color:'#ccc' }}>{d.family}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, color }}>{d.pts}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

const INFO_PAGES = [
  { id:'teams',    label:'Teams'    },
  { id:'drivers',  label:'Drivers'  },
  { id:'compare',  label:'Compare'  },
  { id:'settings', label:'Settings' },
];

export function InfoSidebar() {
  const location = useLocation();
  const active = location.pathname.replace('/', '');

  return (
    <aside style={{
      width:224, height:'100vh', position:'fixed', left:0, top:0,
      background:'#0c0c0c', borderRight:'1px solid #1c1c1c',
      display:'flex', flexDirection:'column', zIndex:200, flexShrink:0,
    }}>
      <Link to="/" style={{ padding:'20px 20px 16px', borderBottom:'1px solid #181818', textDecoration:'none', display:'block' }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'#e10600', lineHeight:1 }}>F1</span>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:13, color:'#2e2e2e', marginLeft:8, letterSpacing:'0.1em' }}>2026</span>
      </Link>
      <nav style={{ padding:'10px 8px 0' }}>
        <div style={{ fontSize:8, letterSpacing:'0.14em', color:'#282828', textTransform:'uppercase', padding:'4px 12px 8px', fontFamily:"'DM Sans',sans-serif" }}>Info Pages</div>
        {INFO_PAGES.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <Link key={id} to={`/${id}`} style={{
              display:'flex', alignItems:'center', width:'100%', padding:'8px 12px',
              borderRadius:8, marginBottom:1, textDecoration:'none',
              background: isActive ? 'rgba(225,6,0,0.1)' : 'transparent',
              color: isActive ? '#e10600' : 'rgba(255,255,255,0.32)',
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
              transition:'all 0.15s',
            }}>
              {label}
            </Link>
          );
        })}
        <Link to="/" style={{
          display:'flex', alignItems:'center', width:'100%', padding:'8px 12px',
          borderRadius:8, marginTop:4, textDecoration:'none',
          color:'rgba(255,255,255,0.2)', fontFamily:"'DM Sans',sans-serif",
          fontWeight:600, fontSize:13, transition:'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}
        onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
          ← Dashboard
        </Link>
      </nav>
      <div style={{ borderTop:'1px solid #181818', marginTop:12, paddingTop:12, flex:1, overflowY:'auto' }}>
        <div style={{ padding:'0 14px 8px', fontSize:8, letterSpacing:'0.14em', color:'#282828', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Constructors</div>
        {CONSTRUCTORS.map((c, i) => {
          const color = getTeamColor(c.id);
          return (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 14px', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#181818'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:11, color:'#2e2e2e', width:14, flexShrink:0 }}>{i+1}</span>
              <span style={{ width:2, height:16, borderRadius:1, background:color, flexShrink:0 }} />
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, flex:1, color:'#aaa', letterSpacing:'0.02em' }}>{c.name}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, color }}>{c.pts}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
