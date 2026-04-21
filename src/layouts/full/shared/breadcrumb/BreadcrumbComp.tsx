import { JSX } from 'react';
import CardBox from '../../../../components/shared/CardBox';
import darkLogo from 'src/assets/images/logos/dark-logo.svg';
import lightLogo from 'src/assets/images/logos/light-logo.svg';
import { Link } from 'react-router';

interface BreadcrumbItem {
  title: string;
  to?: string;
}

interface BreadCrumbType {
  subtitle?: string;
  items?: BreadcrumbItem[];
  title: string;
  children?: JSX.Element;
}

const BreadcrumbComp = ({ title, items = [] }: BreadCrumbType) => {
  return (
    <CardBox
      className="mb-6 py-4 bg-lightsecondary overflow-hidden rounded-md border-none shadow-none! dark:shadow-none! relative"
    >
      <div className="grid grid-cols-12 gap-6 items-center">
        <div className="col-span-12 flex items-center justify-between">
          <h4 className="font-semibold text-xl">
            {title}
          </h4>
          <div className="flex justify-center max-h-[80px] max-w-[280px]">
            <div className="hidden sm:block">
              <img src={darkLogo} alt="UHC-logo" className="block dark:hidden h-16 w-auto object-contain" />
              <img src={lightLogo} alt="UHC-logo" className="hidden dark:block h-16 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>
    </CardBox>
  );
};

export default BreadcrumbComp;
