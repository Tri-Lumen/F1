import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTweaks } from './hooks';
import { TweaksPanel, TweakSection, TweakRadio } from './components/TweaksPanel';
import { InfoSidebar } from './components/Nav';
import {
  DashboardPodium,
  DashboardBroadcast,
  DashboardCommand,
  DashboardStudio,
} from './components/DashboardVariants';
import TeamsPage from './pages/Teams';
import DriversPage from './pages/Drivers';
import ComparePage from './pages/Compare';
import SettingsPage from './pages/Settings';

function Dashboard() {
  const [tweaks, setTweak] = useTweaks({ variant: 'studio' });
  const [activeNav, setActiveNav] = useState('dashboard');
  const hasSidebar = tweaks.variant === 'command' || tweaks.variant === 'studio';

  return (
    <>
      {tweaks.variant === 'podium'    && <DashboardPodium   active={activeNav} onNav={setActiveNav} />}
      {tweaks.variant === 'broadcast' && <DashboardBroadcast active={activeNav} onNav={setActiveNav} />}
      {tweaks.variant === 'command'   && <DashboardCommand   active={activeNav} onNav={setActiveNav} />}
      {tweaks.variant === 'studio'    && <DashboardStudio    active={activeNav} onNav={setActiveNav} />}
      <TweaksPanel title="Theme Designer">
        <TweakSection label="Layout Variant" />
        <TweakRadio
          label="Style"
          value={tweaks.variant}
          options={['podium','broadcast','command','studio']}
          onChange={v => setTweak('variant', v)}
        />
      </TweaksPanel>
    </>
  );
}

function InfoLayout({ children }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <InfoSidebar />
      <main style={{ marginLeft:224, flex:1, padding:'0 32px 48px', minWidth:0, overflowX:'hidden' }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teams"    element={<InfoLayout><TeamsPage /></InfoLayout>} />
        <Route path="/drivers"  element={<InfoLayout><DriversPage /></InfoLayout>} />
        <Route path="/compare"  element={<InfoLayout><ComparePage /></InfoLayout>} />
        <Route path="/settings" element={<InfoLayout><SettingsPage /></InfoLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
