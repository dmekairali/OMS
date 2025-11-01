import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import configService from '../lib/configService';

function MyApp({ Component, pageProps }) {
  const [configLoaded, setConfigLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load configuration once on app startup
    const initConfig = async () => {
      try {
        await configService.loadConfiguration();
        setConfigLoaded(true);
      } catch (error) {
        console.error('Failed to load configuration:', error);
        // Still allow app to load even if config fails
        setConfigLoaded(true);
      }
    };

    initConfig();
  }, []);

  // Show loading only for authenticated pages
  const publicPaths = ['/login', '/'];
  const isPublicPath = publicPaths.includes(router.pathname);

  if (!configLoaded && !isPublicPath) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p style={{ fontSize: '16px', color: '#64748b' }}>Loading system configuration...</p>
      </div>
    );
  }

  return <Component {...pageProps} />;
}

export default MyApp;
