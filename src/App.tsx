import { RouterProvider } from 'react-router';
import router from './routes/Router';
import './css/globals.css';
import './css/settings.css';
import { ThemeProvider } from './components/provider/theme-provider';
import { AuthProvider } from './components/provider/AuthProvider';
import { PermissionsProvider } from './context/PermissionsContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SettingsProvider>
          <AuthProvider>
            <PermissionsProvider>
              <RouterProvider router={router} />
            </PermissionsProvider>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
