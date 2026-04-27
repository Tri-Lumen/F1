import { useState } from 'react';
import { DRIVERS, DRIVER_EXT, getTeamColor } from '../data';

function CompareBar({ label, valueA, valueB, colorA, colorB, lowerBetter }) {
  const max = Math.max(valueA, valueB, 1);
  const pctA = (valueA / max) * 100;
  const pctB = (valueB / max) * 100;
  const aWins = lowerBetter ? valueA <= valueB : valueA >= valueB;
  const bWins = lowerBetter ? valueB <= valueA : valueB >= valueA;
  return (
    <div style={{ padding:'9px 0', borderBottom:'1px solid #1a1a1a', display:'grid', gridTemplateColumns:'1fr 80px 1fr', gap:10, alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color: aWins ? colorA : '#444', minWidth:32, textAlign:'right' }}>{valueA}</span>
        <div style={{ width:110, height:4, borderRadius:2, background:'#1a1a1a', overflow:'hidden', display:'flex', justifyContent:'flex-end' }}>
          <div style={{ width:`${pctA}%`, height:'100%', background:colorA, borderRadius:2, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
      </div>
      <div style={{ textAlign:'center', fontSize:9, letterSpacing:'0.1em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:110, height:4, borderRadius:2, background:'#1a1a1a', overflow:'hidden' }}>
          <div style={{ width:`${pctB}%`, height:'100%', background:colorB, borderRadius:2, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color: bWins ? colorB : '#444', minWidth:32 }}>{valueB}</span>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [dA, setDA] = useState('norris');
  const [dB, setDB] = useState('verstappen');
  const drA = DRIVERS.find(d => d.id === dA);
  const drB = DRIVERS.find(d => d.id === dB);
  const extA = DRIVER_EXT[dA] || {};
  const extB = DRIVER_EXT[dB] || {};
  const colorA = getTeamColor(drA.team);
  const colorB = getTeamColor(drB.team);

  const selectStyle = {
    width:'100%', padding:'9px 12px', borderRadius:9,
    background:'#131313', border:'1px solid #222',
    color:'#f0f0f0', fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:700, fontSize:14, cursor:'pointer', outline:'none',
    appearance:'none', letterSpacing:'0.04em',
  };

  const s2026 = [
    { label:'Points',       valueA:drA.pts,        valueB:drB.pts        },
    { label:'Wins',         valueA:drA.wins,       valueB:drB.wins       },
    { label:'Podiums',      valueA:extA.podiums||0, valueB:extB.podiums||0 },
    { label:'Pole Pos',     valueA:extA.poles||0,   valueB:extB.poles||0   },
    { label:'Fastest Laps', valueA:extA.fl||0,      valueB:extB.fl||0      },
    { label:'DNFs',         valueA:extA.dnf||0,     valueB:extB.dnf||0, lowerBetter:true },
  ];
  const career = [
    { label:'Starts',    valueA:extA.starts||0,  valueB:extB.starts||0  },
    { label:'Podiums',   valueA:extA.podiums||0, valueB:extB.podiums||0 },
    { label:'Poles',     valueA:extA.poles||0,   valueB:extB.poles||0   },
    { label:'Fast Laps', valueA:extA.fl||0,      valueB:extB.fl||0      },
  ];

  return (
    <div style={{ paddingTop:28, paddingBottom:60 }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:9, letterSpacing:'0.14em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Formula 1 · 2026 Season</div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:34, lineHeight:0.95, margin:0 }}>Driver<br/><span style={{ color:'#e10600' }}>Compare</span></h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'end', marginBottom:22 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Driver A</div>
          <select value={dA} onChange={e => setDA(e.target.value)} style={selectStyle}>
            {DRIVERS.map(d => <option key={d.id} value={d.id}>{d.family} · {d.team.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#2a2a2a', paddingBottom:8 }}>vs</div>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Driver B</div>
          <select value={dB} onChange={e => setDB(e.target.value)} style={selectStyle}>
            {DRIVERS.map(d => <option key={d.id} value={d.id}>{d.family} · {d.team.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 1fr', gap:10, padding:'0 0 14px', borderBottom:'1px solid #1c1c1c', marginBottom:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:26, borderRadius:2, background:colorA, flexShrink:0 }} />
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20 }}>{drA.family}</div>
            <div style={{ fontSize:10, color:'#484848', fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>{drA.team.replace(/_/g,' ')}</div>
          </div>
        </div>
        <div />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20 }}>{drB.family}</div>
            <div style={{ fontSize:10, color:'#484848', fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>{drB.team.replace(/_/g,' ')}</div>
          </div>
          <span style={{ width:3, height:26, borderRadius:2, background:colorB, flexShrink:0 }} />
        </div>
      </div>
      <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'14px 18px', marginBottom:12 }}>
        <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>2026 Season</div>
        {s2026.map(s => <CompareBar key={s.label} {...s} colorA={colorA} colorB={colorB} />)}
      </div>
      <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'14px 18px' }}>
        <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>Career</div>
        {career.map(s => <CompareBar key={s.label} {...s} colorA={colorA} colorB={colorB} />)}
      </div>
    </div>
  );
}
