import { useState } from 'react';
import { DRIVERS, CONSTRUCTORS } from '../data';

function SettingsToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width:40, height:22, borderRadius:99, border:'none', cursor:'pointer',
      background: value ? '#e10600' : '#252525', padding:0, position:'relative', transition:'background 0.2s',
      flexShrink:0,
    }}>
      <span style={{
        position:'absolute', top:3, left: value ? 19 : 3,
        width:16, height:16, borderRadius:'50%', background:'#fff',
        transition:'left 0.2s', display:'block', boxShadow:'0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

function SettingsRow({ label, sub, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 0', borderBottom:'1px solid #1a1a1a', gap:16 }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, color:'#d0d0d0' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'#484848', fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{children}</div>
    </div>
  );
}

function SettingsMiniSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding:'5px 10px', borderRadius:7, background:'#1e1e1e', border:'1px solid #2e2e2e',
      color:'#ccc', fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:'pointer', outline:'none', appearance:'none',
    }}>
      {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}

function SettingsSection({ label, children }) {
  return (
    <div style={{ borderRadius:12, border:'1px solid #1c1c1c', background:'#131313', padding:'4px 18px', marginBottom:12 }}>
      <div style={{ fontSize:9, letterSpacing:'0.13em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", padding:'13px 0 4px' }}>{label}</div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState({
    favDriver:'norris', favTeam:'mclaren', speedUnit:'kmh',
    timeFormat:'24h', compactMode:false,
    raceAlerts:true, qualifying:true, practice:false,
    liveData:true, pushNotifications:false,
  });
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ paddingTop:28, paddingBottom:60 }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:9, letterSpacing:'0.14em', color:'#3a3a3a', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Application</div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:34, lineHeight:0.95, margin:0 }}>
          App<br/><span style={{ color:'#e10600' }}>Settings</span>
        </h1>
      </div>
      <div style={{ maxWidth:560 }}>
        <SettingsSection label="Favourites">
          <SettingsRow label="Favourite Driver" sub="Highlighted in standings and alerts">
            <SettingsMiniSelect value={s.favDriver} onChange={v => set('favDriver', v)}
              options={DRIVERS.map(d => ({ value:d.id, label:d.name }))} />
          </SettingsRow>
          <SettingsRow label="Favourite Team" sub="Used for quick-access widgets">
            <SettingsMiniSelect value={s.favTeam} onChange={v => set('favTeam', v)}
              options={CONSTRUCTORS.map(c => ({ value:c.id, label:c.name }))} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection label="Display">
          <SettingsRow label="Speed Units" sub="Telemetry and car data">
            <SettingsMiniSelect value={s.speedUnit} onChange={v => set('speedUnit', v)}
              options={[{value:'kmh',label:'km/h'},{value:'mph',label:'mph'}]} />
          </SettingsRow>
          <SettingsRow label="Time Format" sub="Session times and countdowns">
            <SettingsMiniSelect value={s.timeFormat} onChange={v => set('timeFormat', v)}
              options={[{value:'24h',label:'24-hour'},{value:'12h',label:'12-hour (AM/PM)'}]} />
          </SettingsRow>
          <SettingsRow label="Compact Mode" sub="Reduce spacing across all views">
            <SettingsToggle value={s.compactMode} onChange={v => set('compactMode', v)} />
          </SettingsRow>
          <SettingsRow label="Live Data Feed" sub="Real-time telemetry updates">
            <SettingsToggle value={s.liveData} onChange={v => set('liveData', v)} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection label="Notifications">
          <SettingsRow label="Race Start" sub="30 minutes before lights out">
            <SettingsToggle value={s.raceAlerts} onChange={v => set('raceAlerts', v)} />
          </SettingsRow>
          <SettingsRow label="Qualifying" sub="When qualifying session begins">
            <SettingsToggle value={s.qualifying} onChange={v => set('qualifying', v)} />
          </SettingsRow>
          <SettingsRow label="Practice Sessions" sub="FP1, FP2 and FP3">
            <SettingsToggle value={s.practice} onChange={v => set('practice', v)} />
          </SettingsRow>
          <SettingsRow label="Push Notifications" sub="Browser push alerts">
            <SettingsToggle value={s.pushNotifications} onChange={v => set('pushNotifications', v)} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection label="About">
          <SettingsRow label="Version">
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:'#484848' }}>2026.1.0</span>
          </SettingsRow>
          <SettingsRow label="Data Source" sub="Updated after each session">
            <span style={{ fontSize:11, color:'#484848', fontFamily:"'DM Sans',sans-serif" }}>Official F1 API</span>
          </SettingsRow>
          <SettingsRow label="Season">
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'#e10600' }}>2026</span>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
