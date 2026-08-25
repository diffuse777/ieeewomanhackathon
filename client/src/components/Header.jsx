import { Link } from 'react-router-dom';
import logoKare from '../assets/logo-kare.png';
import logoWieKare from '../assets/logo-wie-kare.jpg';
import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { ButtonLink } from './ButtonLink';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link to={ROUTES.HOME} className="site-header__brand" aria-label={`${HACKATHON.name} home`}>
          <img
            src={logoWieKare}
            alt="IEEE Women in Engineering KARE"
            className="site-header__logo site-header__logo--wie"
          />
        </Link>

        <div className="site-header__actions">
          <img
            src={logoKare}
            alt="Kalasalingam Academy of Research and Education"
            className="site-header__logo site-header__logo--kare"
          />
          <ButtonLink to={ROUTES.REGISTER}>Register Now</ButtonLink>
        </div>
      </div>
    </header>
  );
}
