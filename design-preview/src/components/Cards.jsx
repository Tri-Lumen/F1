import { useState, useEffect } from 'react';
import { DRIVERS, CONSTRUCTORS, NEXT_RACE, getTeamColor, getLiveryBg, getWinnerName } from '../data';
import { useCountUp, useBarWidth, useFadeIn } from '../hooks';
import { SparkLine, TeamDot, PosPill } from './Shared';

export function KPICard({ label, value, sub, color = '#e10600', accent = false, delay = 0 }) {
  const isNum = typeof value === 'number';
  const animated = useCountUp(isNum ? value : 0, 1000, delay + 250);
  const vis = useFadeIn(delay);
  return (
    <div style={{
      borderRadius:10, padding:'16px 18px',
      background: accent ? `linear-gradient(140deg, ${color}0f 0%, #191919 100%)` : '#181818',
      border:`1px solid ${accent ? color+'2e' : '#222'}`,
      borderTop: accent ? `2px solid ${color}` : '1px solid #222',
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)',
      transition:'opacity 0.4s, transform 0.4s',
    }}>
      <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#494949', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:7 }}>{label}</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, lineHeight:1, fontSize:isNum ? 38 : 22, color: accent ? color : '#f0f0f0' }}>
        {isNum ? animated : value}
      </div>
      {sub && <div style={{ fontSize:11, color:'#555', marginTop:5, fontFamily:"'DM Sans',sans-serif" }}>{sub}</div>}
    </div>
  );
}

export function StandingsRowItem({ driver, rank, delay = 0 }) {
  const color = getTeamColor(driver.team);
  const pts = useCountUp(driver.pts, 980, delay + 220);
  const vis = useFadeIn(delay);
  const barW = useBarWidth((driver.pts / DRIVERS[0].pts) * 100, delay + 320);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:9, padding:'8px 14px',
      borderBottom:'1px solid #1a1a1a',
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateX(-8px)',
      transition:'opacity 0.35s, transform 0.35s',
      cursor:'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background='#1d1d1d'}
    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <PosPill pos={rank} />
      <span style={{ width:3, height:28, borderRadius:2, background:color, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'0.025em' }}>{driver.family}</div>
        <div style={{ fontSize:10, color:'#484848', fontFamily:"'DM Sans',sans-serif", marginTop:1, textTransform:'capitalize' }}>
          {driver.team.replace(/_/g,' ')}
        </div>
      </div>
      <SparkLine data={driver.form} color={color} />
      <div style={{ width:36, height:3, borderRadius:2, background:'#1e1e1e', overflow:'hidden', flexShrink:0 }}>
        <div style={{ height:'100%', borderRadius:2, background:color, width:`${barW}%`, transition:'width 0.06s' }} />
      </div>
      <div style={{ width:46, textAlign:'right', flexShrink:0 }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19 }}>{pts}</span>
      </div>
    </div>
  );
}

export function ConstructorBarRow({ team, maxPts, delay = 0 }) {
  const color = getTeamColor(team.id);
  const w = useBarWidth((team.pts / maxPts) * 100, delay + 220);
  const pts = useCountUp(team.pts, 980, delay + 220);
  const vis = useFadeIn(delay);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'7px 14px',
      borderBottom:'1px solid #1a1a1a',
      opacity: vis ? 1 : 0, transition:'opacity 0.35s',
    }}>
      <TeamDot teamId={team.id} size={9} />
      <div style={{ width:106, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:'0.02em', flexShrink:0 }}>{team.name}</div>
      <div style={{ flex:1, height:3, borderRadius:2, background:'#1e1e1e', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:2, background:color, width:`${w}%`, transition:'width 0.06s' }} />
      </div>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, width:40, textAlign:'right', flexShrink:0 }}>{pts}</span>
    </div>
  );
}

export function RaceResultCard({ race, delay = 0 }) {
  const color = getTeamColor(race.winnerTeam);
  const vis = useFadeIn(delay);
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      borderRadius:10, overflow:'hidden', border:`1px solid ${hovered ? color+'44' : '#1e1e1e'}`,
      opacity: vis ? 1 : 0, transform: vis ? (hovered ? 'translateY(-2px)' : 'none') : 'translateY(12px)',
      transition:'opacity 0.4s, transform 0.3s, border-color 0.2s',
      cursor:'pointer',
    }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}>
      <div style={{ height:2, background:`linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div style={{ padding:'13px 14px', background:'#171717', backgroundImage:getLiveryBg(race.winnerTeam) }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:9, color:'#464646', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Rd {race.round} · {race.date}</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, marginTop:3, lineHeight:1.1 }}>{race.name}</div>
          </div>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'#242424', lineHeight:1 }}>{race.short}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
          {[['Winner', race.winner, race.winnerTeam],['Pole', race.pole, null],['Fastest', race.fastest, null]].map(([lbl, did]) => (
            <div key={lbl}>
              <div style={{ fontSize:8, color:'#3a3a3a', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:2 }}>{lbl}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:13,
                color: lbl==='Winner' ? color : lbl==='Fastest' ? '#a78bfa' : '#888' }}>
                {getWinnerName(did)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackedSeg({ team, totalPts, delay }) {
  const pct = (team.pts / totalPts) * 100;
  const w = useBarWidth(pct, delay);
  const color = getTeamColor(team.id);
  return (
    <div title={`${team.name}: ${team.pts} pts`} style={{
      width:`${w}%`, background:color, minWidth: w > 2 ? 2 : 0, overflow:'hidden',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'width 0.06s',
    }}>
      {w > 7 && (
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:9,
          color:'rgba(0,0,0,0.6)', whiteSpace:'nowrap', letterSpacing:'0.04em' }}>
          {team.name.split(' ')[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function ChampStackedBar() {
  const total = CONSTRUCTORS.reduce((s, c) => s + c.pts, 0);
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:8 }}>
        Constructors · {total} pts across 5 races
      </div>
      <div style={{ display:'flex', height:26, borderRadius:6, overflow:'hidden', gap:1 }}>
        {CONSTRUCTORS.map((c, i) => <StackedSeg key={c.id} team={c} totalPts={total} delay={i*80+300} />)}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px 14px', marginTop:8 }}>
        {CONSTRUCTORS.map(c => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <TeamDot teamId={c.id} size={7} />
            <span style={{ fontSize:10, color:'#555', fontFamily:"'DM Sans',sans-serif" }}>{c.name} <strong style={{ color:'#888' }}>{c.pts}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NextRaceCard({ large = false }) {
  const [tick, setTick] = useState({ d:7, h:14, m:22, s:37 });
  useEffect(() => {
    const id = setInterval(() => {
      setTick(c => {
        let {d,h,m,s} = c; s--;
        if(s<0){s=59;m--;} if(m<0){m=59;h--;} if(h<0){h=23;d--;}
        return {d,h,m,s};
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const p = n => String(Math.max(0,n)).padStart(2,'0');
  const units = [['d','Days'],['h','Hrs'],['m','Min'],['s','Sec']];
  return (
    <div style={{ borderRadius:12, border:'1px solid rgba(225,6,0,0.22)', background:'linear-gradient(140deg, rgba(225,6,0,0.07) 0%, #151515 60%)', overflow:'hidden' }}>
      <div style={{ height: large ? 140 : 96, background:'#111', display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid #1a1a1a', position:'relative', overflow:'hidden' }}>
        <svg width="200" height="88" viewBox="0 0 200 88" style={{ opacity:0.18 }}>
          <rect x="18" y="12" width="164" height="64" rx="32" fill="none" stroke="#e10600" strokeWidth="8"/>
          <rect x="54" y="30" width="92" height="28" rx="14" fill="none" stroke="#e10600" strokeWidth="5"/>
          <line x1="100" y1="12" x2="100" y2="30" stroke="#e10600" strokeWidth="5"/>
        </svg>
        <div style={{ position:'absolute', bottom:7, left:14, fontSize:9, letterSpacing:'0.1em', color:'#353535', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{NEXT_RACE.circuit}</div>
        <div style={{ position:'absolute', top:8, right:10 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'#1c1c1c' }}>{NEXT_RACE.short}</span>
        </div>
        <div style={{ position:'absolute', top:8, left:12 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:'#e10600', textTransform:'uppercase',
            background:'rgba(225,6,0,0.12)', border:'1px solid rgba(225,6,0,0.25)', borderRadius:99, padding:'2px 7px' }}>Round {NEXT_RACE.round}</span>
        </div>
      </div>
      <div style={{ padding: large ? '18px 22px' : '13px 14px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize: large ? 26 : 20, lineHeight:1.1, marginBottom:14 }}>
          {NEXT_RACE.name}
          <span style={{ fontSize:12, color:'#555', fontFamily:"'DM Sans',sans-serif", fontWeight:400, marginLeft:8 }}>{NEXT_RACE.country}</span>
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {units.map(([key,lbl]) => (
            <div key={key} style={{ flex:1, textAlign:'center', background:'#111', borderRadius:7, padding:'8px 4px' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, lineHeight:1, color:'#e10600' }}>{p(tick[key])}</div>
              <div style={{ fontSize:8, letterSpacing:'0.1em', color:'#444', textTransform:'uppercase', marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {NEXT_RACE.sessions.map(s => (
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                color: s.label==='Race' ? '#e10600' : s.label==='Qualifying' ? '#ccc' : '#484848' }}>{s.label}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:11, color:'#3a3a3a', letterSpacing:'0.04em' }}>
                {s.day} · {s.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
