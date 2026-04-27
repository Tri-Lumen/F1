import { getTeamColor } from '../data';

export function SparkLine({ data, color, width = 64, height = 22 }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = 2 + ((v - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastV = data[data.length - 1];
  const lx = width - 2;
  const ly = 2 + ((lastV - min) / range) * (height - 4);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible', display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

export function LivePulse() {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      background:'#e1060022', border:'1px solid #e1060044',
      borderRadius:99, padding:'2px 8px 2px 6px' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'#e10600',
        animation:'pulseLive 1.4s ease-in-out infinite' }} />
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700,
        fontSize:11, letterSpacing:'0.08em', color:'#e10600' }}>LIVE</span>
    </span>
  );
}

export function TeamDot({ teamId, size = 8 }) {
  return (
    <span style={{ display:'inline-block', width:size, height:size,
      borderRadius:'50%', background:getTeamColor(teamId), flexShrink:0 }} />
  );
}

export function PosPill({ pos }) {
  const gold = { 1:'#FFD700', 2:'#A8A9AD', 3:'#CD7F32' };
  const c = gold[pos];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:26, height:22, borderRadius:4,
      background: c ? c+'1a' : '#1e1e1e',
      color: c || '#666',
      fontSize:12, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif",
      border:`1px solid ${c ? c+'40' : '#2a2a2a'}`,
      flexShrink:0,
    }}>{pos}</span>
  );
}
