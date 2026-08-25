import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { SiteBackdrop } from '../components/SiteBackdrop';
import { ROUTES } from '../constants/routes';
import { useScrollToHash } from '../hooks/useScrollToHash';

export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === ROUTES.HOME;
  useScrollToHash();

  return (
    <div className={isHome ? 'app-shell' : 'app-shell app-shell--cinematic'}>
      <SiteBackdrop />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className={isHome ? 'app-main app-main--home' : 'app-main app-main--page'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
