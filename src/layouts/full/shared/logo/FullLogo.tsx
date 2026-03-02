import Logo from 'src/assets/images/logos/dark-logo.svg';
import Logowhite from 'src/assets/images/logos/light-logo.svg';
import { useSettings } from 'src/context/SettingsContext';

const FullLogo = () => {
  const { settings } = useSettings();

  // Use custom logo if available, otherwise use default theme-specific logos
  const customLogo = settings?.branding?.systemLogoUrl;
  const darkLogo = customLogo || Logo;
  const lightLogo = customLogo || Logowhite;

  // Apply size constraints for custom uploaded logos
  const imgClassName = customLogo 
    ? "max-h-20 max-w-[280px] w-auto h-auto object-contain rtl:scale-x-[-1]" 
    : "rtl:scale-x-[-1]";

  return (
    <>
      {/* Dark Logo   */}
      <img src={darkLogo} alt="logo" className={`block dark:hidden ${imgClassName}`} />
      {/* Light Logo  */}
      <img src={lightLogo} alt="logo" className={`hidden dark:block ${imgClassName}`} />
    </>
  );
};

export default FullLogo;
