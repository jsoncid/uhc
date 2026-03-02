/**
 * PatientAvatar - Avatar component showing patient initials with gender-based colors
 */
import { PatientWithRepository } from './types';

interface PatientAvatarProps {
  patient: PatientWithRepository;
}

export const PatientAvatar = ({ patient }: PatientAvatarProps) => {
  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
  const sexUpper = patient.sex?.toUpperCase() || '';
  const isMale = sexUpper === 'M' || sexUpper === 'MALE';
  const isFemale = sexUpper === 'F' || sexUpper === 'FEMALE';
  
  const bgColor = isMale 
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
    : isFemale 
    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' 
    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${bgColor}`}>
      {initials}
    </div>
  );
};

export default PatientAvatar;
