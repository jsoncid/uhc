
import { Button } from "src/components/ui/button";
import ErrorImg from "/src/assets/images/backgrounds/errorimg.svg";
import { Link } from "react-router";

const Error = () => (
  <>
    <div className="h-screen flex items-center justify-center bg-white dark:bg-dark">
      <div className="text-center">
        <img src={ErrorImg} alt="error" className="mb-4" width={500} />
        <h1 className="text-ld text-4xl mb-6">Not Authorized</h1>
        <h6 className="text-xl text-ld">
           You don't have permission to access this page.
        </h6>
        <Button
          variant={"default"}
          className="w-fit mt-6 mx-auto rounded-md"
        >
          <Link to={"/"}>Go Back to Home</Link>
        </Button>
      </div>
    </div>
  </>
);

export default Error;





// import { useNavigate } from 'react-router';

// const Unauthorized = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="flex flex-col items-center justify-center h-screen text-center">
//       <h1 className="text-6xl font-bold text-red-500">403</h1>
//       <h2 className="text-2xl font-semibold mt-4">Not Authorized</h2>
//       <p className="text-muted-foreground mt-2">
//         You don't have permission to access this page.
//       </p>
//       <button
//         onClick={() => navigate('/')}
//         className="mt-6 px-4 py-2 bg-primary text-white rounded-md"
//       >
//         Go Back Home
//       </button>
//     </div>
//   );
// };

// export default Unauthorized;