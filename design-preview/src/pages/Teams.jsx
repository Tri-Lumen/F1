import { useState } from 'react';
import { CONSTRUCTORS, TEAM_EXT, getTeamColor, getLiveryBg, getTeamDrivers, getConstructorRank } from '../data';
import { DRIVER_EXT } from '../data';
import { useCountUp, useFadeIn } from '../hooks';
import { SparkLine, TeamDot } from '../components/Shared';

function TeamCard({ team, rank, selected, onClick }) {
  const color = getTeamColor(team.id);
  const ext = TEAM_EXT[team.id] || {};
  const teamDrivers = getTeamDrivers(team.id);
  const [hov, setHov] = useState(false);
  const pct = (team.pts / CONSTRUCTORS[0].pts) * 100;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius:10, overflow:'hidden', cursor:'pointer',
      border:`1px solid ${selected ? color+'55' : hov ? '#2e2e2e' : '#1c1c1c'}`,
      transition:'border-color 0.2s, transform 0.15s',
      transform: hov && !selected ? 'translateY(-1px)' : 'none',
    }}>
      <div style={{ height:2, background:`linear-gradient(90deg,${color},${color}44)` }} />
      <div style={{ padding:'13px 16px', background:'#131313', backgroundImage:getLiveryBg(team.id), position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:10, top:6, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:58, color:`${color}0a`, lineHeight:1, userSelect:'none' }}>P{rank}</div>
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:8, letterSpacing:'0.12em', color:'#484848', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:3 }}>#{rank} Constructor</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, lineHeight:1 }}>{team.name}</div>
              {ext.base && <div style={{ fontSize:10, color:'#484848', fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{ext.base}</div>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color, lineHeight:1 }}>{team.pts}</div>
              <div style={{ fontSize:9, color:'#484848', fontFamily:"'DM Sans',sans-serif" }}>pts</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {teamDrivers.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.45)', borderRadius:99, padding:'3px 9px 3px 7px', border:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }} />
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, letterSpacing:'0.04em' }}>{d.family}</span>
              </div>
            ))}
          </div>
          <div style={{ height:2, borderRadius:1, background:'#1e1e1e', overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${color},${color}66)`, width:`${pct}%`, borderRadius:1, transition:'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamDetail({ team }) {
  const color = getTeamColor(team.id);
  const ext = TEAM_EXT[team.id] || {};
  const rank = getConstructorRank(team.id);
  const teamDrivers = getTeamDrivers(team.id);
  const vis = useFadeIn(0);
  const pts = useCountUp(team.pts, 900, 80);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)', transition:'opacity 0.4s, transform 0.4s' }}>
      <div style={{ borderRadius:12, overflow:'hidden', marginBottom:14, border:`1px solid ${color}28`, background:'#0f0f0f' }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}44,transparent)` }} />
        <div style={{ padding:'20px 22px', backgroundImage:getLiveryBg(team.id), position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:16, top:4, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:88, color:`${color}09`, lineHeight:1, userSelect:'none' }}>P{rank}</div>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3e3e3e', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:5 }}>#{rank} Constructors Championship</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, lineHeight:1, marginBottom:14 }}>{team.name}</div>
            <div style={{ display:'flex', gap:22 }}>
              {[['PTS',pts,color],['TITLES',ext.titles||0,'#FFD700'],['SINCE',ext.founded,'#666']].map(([l,v,c]) => (
                <div key={l}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:c, lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', color:'#484848', fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderRadius:10, border:'1px solid #1c1c1c', background:'#131313', padding:'13px 16px', marginBottom:14 }}>
        <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:11 }}>Car & Organisation</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px 20px' }}>
          {[['Chassis',ext.chassis||'—'],['Engine',ext.engine||'—'],['Principal',ext.principal||'—'],['Base',ext.base||'—']].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize:9, color:'#3a3a3a', fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>{l}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:'0.02em' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:9 }}>Drivers This Season</div>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {teamDrivers.map(d => {
          const de = DRIVER_EXT[d.id] || {};
          return (
            <div key={d.id} style={{ borderRadius:10, border:'1px solid #1c1c1c', background:'#131313', padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color }}>{de.num||'—'}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, lineHeight:1 }}>{d.family}</div>
                <div style={{ fontSize:10, color:'#484848', fontFamily:"'DM Sans',sans-serif", marginTop:1 }}>{de.nat||''} · Age {de.age||'—'}</div>
              </div>
              <div style={{ display:'flex', gap:14 }}>
                {[['PTS',d.pts,color],['W',d.wins,'#FFD700']].map(([l,v,c]) => (
                  <div key={l} style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, color:c, lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:8, color:'#484848', fontFamily:"'DM Sans',sans-serif" }}>{l}</div>
                  </div>
                ))}
              </div>
              <SparkLine data={d.form} color={color} width={52} height={20} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const [selected, setSelected] = useState(CONSTRUCTORS[0].id);
  const selectedTeam = CONSTRUCTORS.find(c => c.id === selected);
  return (
    <div style={{ paddingTop:28, paddingBottom:60 }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:9, letterSpacing:'0.14em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Formula 1 · 2026 Season</div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:34, lineHeight:0.95, margin:0 }}>
          Constructor<br/><span style={{ color:'#e10600' }}>Championship</span>
        </h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {CONSTRUCTORS.map((team, i) => (
            <TeamCard key={team.id} team={team} rank={i+1}
              selected={selected === team.id}
              onClick={() => setSelected(team.id)} />
          ))}
        </div>
        <div>{selectedTeam && <TeamDetail team={selectedTeam} key={selected} />}</div>
      </div>
    </div>
  );
}
