import { useState } from 'react';
import { DRIVERS, CONSTRUCTORS, RECENT_RACES, SEASON_STATS, getTeamColor, getLiveryBg } from '../data';
import { useCountUp, useBarWidth, useFadeIn } from '../hooks';
import { SparkLine, TeamDot, PosPill } from './Shared';
import { FloatingNav, VerticalNav } from './Nav';
import {
  KPICard, StandingsRowItem, ConstructorBarRow, RaceResultCard,
  ChampStackedBar, NextRaceCard,
} from './Cards';

// ─── VARIANT A: PODIUM ────────────────────────────────────────────────────────

function PodiumCol({ driver, rank, elevated, delay }) {
  const color = getTeamColor(driver.team);
  const pts = useCountUp(driver.pts, 1100, delay + 280);
  const vis = useFadeIn(delay);
  return (
    <div style={{
      flex: elevated ? 1.12 : 1, borderRadius:12, position:'relative', overflow:'hidden',
      background:`linear-gradient(160deg, ${color}1a 0%, #161616 65%)`,
      backgroundImage: getLiveryBg(driver.team),
      border:`1px solid ${color}28`,
      padding: elevated ? '30px 22px 24px' : '22px 18px 20px',
      marginTop: elevated ? 0 : 20,
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)',
      transition:`opacity 0.55s, transform 0.55s`,
    }}>
      <div style={{
        position:'absolute', right:8, top:4,
        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
        fontSize: elevated ? 104 : 82, lineHeight:1,
        color:`${color}0d`, userSelect:'none', pointerEvents:'none', letterSpacing:'-0.02em',
      }}>P{rank}</div>
      <div style={{ width:30, height:3, borderRadius:2, background:color, marginBottom:11 }} />
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
        fontSize: elevated ? 36 : 27, letterSpacing:'0.01em', lineHeight:1.1 }}>
        {driver.family}
      </div>
      <div style={{ fontSize:11, color:'#555', marginTop:3, fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>
        {driver.name.split(' ')[0]} · {driver.team.replace(/_/g,' ')}
      </div>
      <div style={{ marginTop:16, display:'flex', alignItems:'baseline', gap:5 }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
          fontSize: elevated ? 54 : 42, color, lineHeight:1 }}>{pts}</span>
        <span style={{ fontSize:12, color:'#555' }}>PTS</span>
      </div>
      {driver.wins > 0 && (
        <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:5 }}>
          <TeamDot teamId={driver.team} size={6} />
          <span style={{ fontSize:11, color:'#555', fontFamily:"'DM Sans',sans-serif" }}>
            {driver.wins} win{driver.wins>1?'s':''} · {driver.wins} fastest laps
          </span>
        </div>
      )}
    </div>
  );
}

export function DashboardPodium({ active, onNav }) {
  const [p1,p2,p3] = [DRIVERS[0], DRIVERS[1], DRIVERS[2]];
  return (
    <div style={{ minHeight:'100vh', paddingTop:76 }}>
      <FloatingNav active={active} onNav={onNav} />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px 48px' }}>
        <div style={{ marginBottom:26 }}>
          <div style={{ fontSize:9, letterSpacing:'0.14em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:7 }}>
            Formula 1 · 2026 Season · {SEASON_STATS.completedRaces}/{SEASON_STATS.totalRaces} Races
          </div>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:44, letterSpacing:'-0.01em', lineHeight:1 }}>
            Championship<br/><span style={{ color:'#e10600' }}>Standings</span>
          </h1>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', marginBottom:24 }}>
          <PodiumCol driver={p2} rank={2} elevated={false} delay={100} />
          <PodiumCol driver={p1} rank={1} elevated={true}  delay={0}   />
          <PodiumCol driver={p3} rank={3} elevated={false} delay={200} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <KPICard label="Races Completed" value={`${SEASON_STATS.completedRaces}/${SEASON_STATS.totalRaces}`} sub="21.7% of season" delay={250} />
          <KPICard label="Championship Lead" value={p1.pts - p2.pts} sub={`${p1.family} over ${p2.family}`} color='#e10600' accent delay={310} />
          <KPICard label="Different Winners" value={SEASON_STATS.differentWinners} sub="across 5 rounds" delay={370} />
          <KPICard label="Season DNFs" value={SEASON_STATS.totalDNFs} sub="retirements so far" delay={430} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:20, marginBottom:24 }}>
          <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 14px', borderBottom:'1px solid #1c1c1c' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em' }}>Driver Standings</span>
              <span style={{ fontSize:9, color:'#3a3a3a', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>form (last 5)</span>
            </div>
            {DRIVERS.slice(0,10).map((d,i) => <StandingsRowItem key={d.id} driver={d} rank={i+1} delay={i*50+200} />)}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
              <div style={{ padding:'13px 14px', borderBottom:'1px solid #1c1c1c' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em' }}>Constructors</span>
              </div>
              {CONSTRUCTORS.map((c,i) => <ConstructorBarRow key={c.id} team={c} maxPts={CONSTRUCTORS[0].pts} delay={i*60+300} />)}
            </div>
            <NextRaceCard />
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em', marginBottom:13 }}>Recent Races</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:13 }}>
            {RECENT_RACES.map((r,i) => <RaceResultCard key={r.round} race={r} delay={i*80+200} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VARIANT B: BROADCAST ─────────────────────────────────────────────────────

function BroadcastHero() {
  const ld = DRIVERS[0];
  const color = getTeamColor(ld.team);
  const pts = useCountUp(ld.pts, 1200, 200);
  const gap = ld.pts - DRIVERS[1].pts;
  const vis = useFadeIn(0);
  return (
    <div style={{
      borderRadius:14, overflow:'hidden', marginBottom:20,
      background:'#111', border:`1px solid ${color}24`,
      opacity: vis ? 1 : 0, transition:'opacity 0.7s',
    }}>
      <div style={{ height:3, background:`linear-gradient(90deg, ${color} 0%, ${color}44 70%, transparent 100%)` }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:0, backgroundImage:getLiveryBg(ld.team) }}>
        <div style={{ padding:'28px 32px' }}>
          <div style={{ fontSize:9, letterSpacing:'0.15em', color:'#444', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:9 }}>
            2026 Formula 1 · Championship Leader
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:56, lineHeight:1, letterSpacing:'-0.01em', marginBottom:8 }}>
            <span style={{ color:'#ccc' }}>{ld.name.split(' ')[0].toUpperCase()} </span>
            <span style={{ color }}>{ld.family.toUpperCase()}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:22 }}>
            <TeamDot teamId={ld.team} size={8} />
            <span style={{ fontSize:11, color:'#555', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.05em', textTransform:'uppercase' }}>
              {ld.team.replace(/_/g,' ')}
            </span>
          </div>
          <div style={{ display:'flex', gap:28 }}>
            {[['Points', pts, color],['Gap to P2', `+${gap}`, '#f0f0f0'],['Wins', ld.wins, '#FFD700'],['Podiums', ld.wins+1, '#888']].map(([lbl,val,c]) => (
              <div key={lbl}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:38, lineHeight:1, color:c }}>{val}</div>
                <div style={{ fontSize:9, letterSpacing:'0.1em', color:'#484848', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', padding:'0 32px 0 0', overflow:'hidden' }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:108, color:`${color}0c`, lineHeight:1, userSelect:'none', letterSpacing:'-0.025em', whiteSpace:'nowrap' }}>
            {ld.family.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function CompactDriverRow({ driver, rank, delay = 0 }) {
  const color = getTeamColor(driver.team);
  const pts = useCountUp(driver.pts, 900, delay + 200);
  const vis = useFadeIn(delay);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:9, padding:'7px 13px',
      borderBottom:'1px solid #1a1a1a',
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateX(-6px)',
      transition:'opacity 0.3s, transform 0.3s',
      cursor:'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background='#1d1d1d'}
    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:21, color: rank<=3 ? '#484848' : '#252525', width:22, textAlign:'right', flexShrink:0 }}>{rank}</span>
      <span style={{ width:3, height:24, borderRadius:2, background:color, flexShrink:0 }} />
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, flex:1, letterSpacing:'0.02em' }}>{driver.family}</span>
      <SparkLine data={driver.form} color={color} width={48} height={18} />
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color, width:42, textAlign:'right', flexShrink:0 }}>{pts}</span>
    </div>
  );
}

export function DashboardBroadcast({ active, onNav }) {
  return (
    <div style={{ minHeight:'100vh', paddingTop:76 }}>
      <FloatingNav active={active} onNav={onNav} />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px 48px' }}>
        <BroadcastHero />
        <ChampStackedBar />
        <div style={{ display:'grid', gridTemplateColumns:'5fr 7fr', gap:20 }}>
          <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
            <div style={{ padding:'13px 14px', borderBottom:'1px solid #1c1c1c', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em' }}>Drivers</span>
              <span style={{ fontSize:9, color:'#3a3a3a', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>pts · form</span>
            </div>
            {DRIVERS.map((d,i) => <CompactDriverRow key={d.id} driver={d} rank={i+1} delay={i*45+200} />)}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em', marginBottom:12 }}>Recent Results</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:11 }}>
                {RECENT_RACES.map((r,i) => <RaceResultCard key={r.round} race={r} delay={i*80+200} />)}
              </div>
            </div>
            <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
              <div style={{ padding:'13px 14px', borderBottom:'1px solid #1c1c1c' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em' }}>Constructors</span>
              </div>
              {CONSTRUCTORS.map((c,i) => <ConstructorBarRow key={c.id} team={c} maxPts={CONSTRUCTORS[0].pts} delay={i*45+300} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VARIANT C: COMMAND ───────────────────────────────────────────────────────

export function DashboardCommand({ onNav, active }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <VerticalNav active={active} onNav={onNav} />
      <main style={{ marginLeft:224, flex:1, padding:'26px 28px 48px' }}>
        <div style={{ maxWidth:860 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Formula 1 · 2026</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, marginTop:2, letterSpacing:'-0.01em' }}>Command Center</div>
            </div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5,
              background:'rgba(225,6,0,0.12)', border:'1px solid rgba(225,6,0,0.25)',
              borderRadius:99, padding:'3px 10px 3px 7px', cursor:'default' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#e10600',
                animation:'pulseLive 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, letterSpacing:'0.08em', color:'#e10600' }}>LIVE SESSION</span>
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:11, marginBottom:22 }}>
            <KPICard label="Season Progress" value={`5/24`} sub="Races run" delay={0} />
            <KPICard label="Drivers Leader" value={DRIVERS[0].family} sub={`${DRIVERS[0].pts} pts`} color='#e10600' accent delay={70} />
            <KPICard label="Constructors" value="McLaren" sub="339 pts" color={getTeamColor('mclaren')} accent delay={140} />
            <KPICard label="Next Race" value="MIA" sub="May 4 · USA" delay={210} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'5fr 7fr', gap:18, marginBottom:22 }}>
            <NextRaceCard large />
            <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
              <div style={{ padding:'13px 14px', borderBottom:'1px solid #1c1c1c' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em' }}>Constructor Championship</span>
              </div>
              {CONSTRUCTORS.map((c,i) => <ConstructorBarRow key={c.id} team={c} maxPts={CONSTRUCTORS[0].pts} delay={i*50+200} />)}
            </div>
          </div>
          <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'16px 18px', marginBottom:22 }}>
            <ChampStackedBar />
          </div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'0.04em', marginBottom:12 }}>Recent Results</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:13 }}>
              {RECENT_RACES.map((r,i) => <RaceResultCard key={r.round} race={r} delay={i*80+200} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── VARIANT D: STUDIO ────────────────────────────────────────────────────────

function StudioLeaderHero() {
  const ld = DRIVERS[0];
  const color = getTeamColor(ld.team);
  const pts = useCountUp(ld.pts, 1200, 150);
  const gap = ld.pts - DRIVERS[1].pts;
  const vis = useFadeIn(0);
  return (
    <div style={{
      borderRadius:13, overflow:'hidden', marginBottom:18,
      background:'#0f0f0f', border:`1px solid ${color}20`,
      opacity: vis ? 1 : 0, transition:'opacity 0.7s', position:'relative',
    }}>
      <div style={{ height:3, background:`linear-gradient(90deg, ${color} 0%, ${color}55 55%, transparent 100%)` }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:getLiveryBg(ld.team), pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
        <div style={{ padding:'22px 28px 20px' }}>
          <div style={{ fontSize:9, letterSpacing:'0.15em', color:'#3e3e3e', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:8 }}>Championship Leader · Round 5</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:50, lineHeight:0.95, letterSpacing:'-0.01em', marginBottom:10 }}>
            <span style={{ color:'#888' }}>{ld.name.split(' ')[0].toUpperCase()} </span>
            <span style={{ color }}>{ld.family.toUpperCase()}</span>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:18,
            background:`${color}14`, border:`1px solid ${color}28`, borderRadius:99, padding:'3px 10px 3px 8px' }}>
            <TeamDot teamId={ld.team} size={7} />
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, letterSpacing:'0.08em', color, textTransform:'uppercase' }}>
              {ld.team.replace(/_/g,' ')}
            </span>
          </div>
          <div style={{ display:'flex', gap:24, alignItems:'flex-end' }}>
            {[['Points',pts,color],['Gap',`+${gap}`,'#c0c0c0'],['Wins',ld.wins,'#FFD700']].map(([lbl,val,c]) => (
              <div key={lbl}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, lineHeight:1, color:c }}>{val}</div>
                <div style={{ fontSize:9, letterSpacing:'0.1em', color:'#404040', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{lbl}</div>
              </div>
            ))}
            <div style={{ flex:1, paddingBottom:6 }}>
              <div style={{ fontSize:9, letterSpacing:'0.1em', color:'#404040', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Season 5/24</div>
              <div style={{ height:3, borderRadius:2, background:'#1e1e1e', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:2, background:`linear-gradient(90deg,#e10600,#e10600aa)`, width:`${(5/24)*100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ paddingRight:28, overflow:'hidden', userSelect:'none', pointerEvents:'none' }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:100,
            color:`${color}09`, lineHeight:1, letterSpacing:'-0.025em', whiteSpace:'nowrap', display:'block' }}>
            {ld.family.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function StudioDriverRow({ driver, rank, delay = 0 }) {
  const color = getTeamColor(driver.team);
  const pts  = useCountUp(driver.pts, 980, delay + 200);
  const barW = useBarWidth((driver.pts / DRIVERS[0].pts) * 100, delay + 320);
  const vis  = useFadeIn(delay);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'7px 14px',
      borderBottom:'1px solid #191919',
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateX(-8px)',
      transition:'opacity 0.35s, transform 0.35s', cursor:'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background='#1c1c1c'}
    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <PosPill pos={rank} />
      <span style={{ width:3, height:26, borderRadius:2, background:color, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'0.02em' }}>{driver.family}</div>
        <div style={{ fontSize:9, color:'#404040', fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>{driver.team.replace(/_/g,' ')}</div>
      </div>
      <SparkLine data={driver.form} color={color} width={52} height={20} />
      <div style={{ width:80, display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ flex:1, height:2, borderRadius:1, background:'#1e1e1e', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:1, background:color, width:`${barW}%`, transition:'width 0.06s' }} />
        </div>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color, flexShrink:0, width:36, textAlign:'right' }}>{pts}</span>
      </div>
    </div>
  );
}

export function DashboardStudio({ onNav, active }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <VerticalNav active={active} onNav={onNav} />
      <main style={{ marginLeft:224, flex:1, padding:'24px 26px 48px', minWidth:0 }}>
        <StudioLeaderHero />
        <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'14px 18px', marginBottom:18 }}>
          <ChampStackedBar />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:18 }}>
          <div style={{ gridColumn:'span 2', borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderBottom:'1px solid #1c1c1c' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'0.04em' }}>Driver Standings</span>
              <span style={{ fontSize:9, color:'#3a3a3a', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>pts · last 5 form</span>
            </div>
            {DRIVERS.slice(0,10).map((d,i) => <StudioDriverRow key={d.id} driver={d} rank={i+1} delay={i*45+150} />)}
          </div>
          <NextRaceCard large />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #1c1c1c' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'0.04em' }}>Constructors</span>
            </div>
            {CONSTRUCTORS.map((c,i) => <ConstructorBarRow key={c.id} team={c} maxPts={CONSTRUCTORS[0].pts} delay={i*50+200} />)}
          </div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'0.04em', marginBottom:11 }}>Recent Results</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {RECENT_RACES.map((r,i) => <RaceResultCard key={r.round} race={r} delay={i*80+200} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
