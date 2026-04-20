import { Link } from 'react-router';
import LogoIcon from 'src/assets/images/logos/logo-icon.svg';
import { useSettings } from 'src/context/SettingsContext';

const Logo = () => {
  const { settings } = useSettings();
  
  // Use custom logo if available, otherwise use default icon
  const logoSrc = settings?.branding?.systemLogoUrl || LogoIcon;

  return (
    <Link to={'/'}>
      <img src={logoSrc} alt="logo" />
    </Link>
  );
};

export default Logo;
