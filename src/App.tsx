import { RouterProvider } from 'react-router';
import router from './routes/Router';
import './css/globals.css';
import { ThemeProvider } from './components/provider/theme-provider';
import { AuthProvider } from './components/provider/AuthProvider';
import { PermissionsProvider } from './context/PermissionsContext';

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <PermissionsProvider>
            <RouterProvider router={router} />
          </PermissionsProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
