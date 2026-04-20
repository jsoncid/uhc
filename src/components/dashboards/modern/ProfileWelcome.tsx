import userImg from '../../../assets/images/profile/user-1.jpg';
import supportImg from '../../../assets/images/dashboard/customer-support-img.png';
import { useUserProfile } from 'src/hooks/useUserProfile';

const ProfileWelcome = () => {
  const { profile, loading } = useUserProfile();
  
  // Get display name from profile
  const emailUsername = profile?.email?.split('@')[0];
  const displayName = profile?.name
    ? profile.name
    : emailUsername
    ? emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)
    : 'User';

  return (
    <div className="relative flex items-center justify-between bg-lightsecondary rounded-lg p-6">
      <div className="flex items-center gap-3">
        <div>
          <img 
            src={profile?.profilePictureUrl || userImg} 
            alt="user-img" 
            width={50} 
            height={50} 
            className="rounded-full object-cover w-[50px] h-[50px]" 
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <h5 className="card-title">
            {loading ? 'Welcome back! 👋' : `Welcome back! ${displayName} 👋`}
          </h5>
          <p className="text-muted-foreground">Check your reports</p>
        </div>
      </div>

      {/* Support Image */}
      <div className="hidden sm:block absolute right-8 bottom-0">
        <img src={supportImg} alt="support-img" width={145} height={95} />
      </div>
    </div>
  );
};

export default ProfileWelcome;
