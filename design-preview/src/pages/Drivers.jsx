import { useState } from 'react';
import { DRIVERS, RECENT_RACES, DRIVER_EXT, getTeamColor, getLiveryBg } from '../data';
import { useCountUp, useFadeIn } from '../hooks';
import { SparkLine } from '../components/Shared';

function DriverFormChart({ data, color, width = 300, height = 76 }) {
  const pts = data.map((v, i) => ({
    x: 16 + (i / (data.length - 1)) * (width - 32),
    y: 8 + ((v - 1) / 19) * (height - 20),
    v,
  }));
  const pathD = pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length-1].x},${height-4} L${pts[0].x},${height-4} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible', display:'block' }}>
      {[1,5,10].map(pos => {
        const y = 8 + ((pos-1)/19)*(height-20);
        return <line key={pos} x1={14} x2={width-14} y1={y} y2={y} stroke="#1e1e1e" strokeWidth="1" />;
      })}
      <path d={areaD} fill={color} fillOpacity="0.06" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
          <text x={p.x} y={height-1} textAnchor="middle" fontSize="8" fill="#484848" fontFamily="DM Sans,sans-serif">P{p.v}</text>
        </g>
      ))}
    </svg>
  );
}

export default function DriversPage() {
  const [selectedId, setSelectedId] = useState('norris');
  const driver = DRIVERS.find(d => d.id === selectedId);
  const ext = DRIVER_EXT[selectedId] || {};
  const color = getTeamColor(driver.team);
  const pts = useCountUp(driver.pts, 900, 80);
  const teammate = DRIVERS.find(d => d.team === driver.team && d.id !== driver.id);
  const vis = useFadeIn(0);

  const statCells = [
    { l:'Season PTS',    v:driver.pts,     c:color     },
    { l:'Wins',          v:driver.wins,    c:'#FFD700' },
    { l:'Podiums',       v:ext.podiums||0, c:'#f0f0f0' },
    { l:'Pole Pos',      v:ext.poles||0,   c:'#f0f0f0' },
    { l:'Fastest Laps',  v:ext.fl||0,      c:'#a78bfa' },
    { l:'Career Starts', v:ext.starts||0,  c:'#f0f0f0' },
  ];

  return (
    <div style={{ paddingTop:28, paddingBottom:60 }}>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:9, letterSpacing:'0.14em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Formula 1 · 2026 Season</div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:34, lineHeight:0.95, margin:0 }}>
          Driver<br/><span style={{ color:'#e10600' }}>Profiles</span>
        </h1>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
        {DRIVERS.map(d => {
          const c = getTeamColor(d.team);
          const isActive = d.id === selectedId;
          return (
            <button key={d.id} onClick={() => setSelectedId(d.id)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
              borderRadius:99, border:`1px solid ${isActive ? c+'55' : '#222'}`,
              background: isActive ? `${c}16` : '#131313',
              cursor:'pointer', transition:'all 0.15s',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0 }} />
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:'0.04em', color: isActive ? '#f0f0f0' : '#666' }}>{d.family}</span>
            </button>
          );
        })}
      </div>
      <div key={selectedId} style={{ borderRadius:12, overflow:'hidden', marginBottom:14, border:`1px solid ${color}22`, background:'#0f0f0f', opacity: vis ? 1 : 0, transition:'opacity 0.4s' }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}44,transparent)` }} />
        <div style={{ padding:'20px 24px', backgroundImage:getLiveryBg(driver.team), position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:16, top:0, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:120, color:`${color}09`, lineHeight:1, userSelect:'none', letterSpacing:'-0.04em' }}>{ext.num}</div>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, letterSpacing:'0.08em', color, background:`${color}14`, border:`1px solid ${color}28`, borderRadius:99, padding:'2px 9px' }}>
                {driver.team.replace(/_/g,' ').toUpperCase()}
              </span>
              {ext.nat && <span style={{ fontSize:10, color:'#484848', fontFamily:"'DM Sans',sans-serif" }}>{ext.nat} · Age {ext.age}</span>}
            </div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:46, lineHeight:0.95, letterSpacing:'-0.01em', marginBottom:14 }}>
              <span style={{ color:'#777' }}>{driver.name.split(' ')[0].toUpperCase()} </span>
              <span style={{ color }}>{driver.family}</span>
            </div>
            <div style={{ display:'flex', gap:22 }}>
              {[['Points',pts,color],['Wins',driver.wins,'#FFD700'],['Podiums',ext.podiums||0,'#888']].map(([l,v,c]) => (
                <div key={l}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color:c, lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', color:'#484848', fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        {statCells.map(({ l, v, c }) => (
          <div key={l} style={{ borderRadius:9, border:'1px solid #1c1c1c', background:'#131313', padding:'12px 14px' }}>
            <div style={{ fontSize:9, letterSpacing:'0.11em', color:'#484848', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:5 }}>{l}</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:c, lineHeight:1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'15px' }}>
          <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>Race Form · Last 5</div>
          <DriverFormChart data={driver.form} color={color} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, padding:'0 14px' }}>
            {RECENT_RACES.map(r => (
              <span key={r.round} style={{ fontSize:9, color:'#3a3a3a', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>{r.short}</span>
            ))}
          </div>
        </div>
        {teammate && (
          <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'15px' }}>
            <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>vs Teammate · {teammate.family}</div>
            {[
              { l:'Points',  a:driver.pts,     b:teammate.pts                             },
              { l:'Wins',    a:driver.wins,    b:teammate.wins                            },
              { l:'Podiums', a:ext.podiums||0, b:(DRIVER_EXT[teammate.id]||{}).podiums||0 },
              { l:'Poles',   a:ext.poles||0,   b:(DRIVER_EXT[teammate.id]||{}).poles||0   },
            ].map(({ l, a, b }) => {
              const max = Math.max(a, b, 1);
              return (
                <div key={l} style={{ marginBottom:11 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color }}>{a}</span>
                    <span style={{ fontSize:9, color:'#484848', fontFamily:"'DM Sans',sans-serif" }}>{l}</span>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color:'#555' }}>{b}</span>
                  </div>
                  <div style={{ display:'flex', height:3, borderRadius:2, overflow:'hidden', gap:1, background:'#1a1a1a' }}>
                    <div style={{ flex:a, background:color, borderRadius:2 }} />
                    <div style={{ flex:b, background:'#2e2e2e', borderRadius:2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
