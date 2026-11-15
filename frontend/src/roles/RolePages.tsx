import { useEffect } from 'react';
import { applyTheme, themeStore } from '../shell/theme';
import { EducatorPage } from './EducatorPage';
import { EngineerPage } from './EngineerPage';
import { Frame } from './parts';
import { PublicPage } from './PublicPage';
import type { RoleRoute } from './route';
import { StartPage } from './StartPage';
import './roles.css';

function Page({ route }: { route: RoleRoute }) {
  if (route === 'public') return <PublicPage />;
  if (route === 'educator') return <EducatorPage />;
  if (route === 'engineer') return <EngineerPage />;
  return <StartPage />;
}

/**
 * The role pages. They are drawn on a night sky, so they keep the dark palette while they are
 * open and give the chosen theme back to the console on the way out.
 */
export default function RolePages({ route }: { route: RoleRoute }) {
  useEffect(() => {
    applyTheme('dark');
    return () => applyTheme(themeStore.getState().theme);
  }, []);

  return (
    <Frame route={route}>
      <Page route={route} />
    </Frame>
  );
}
