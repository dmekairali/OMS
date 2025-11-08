// App.js or _app.js (Next.js)
import 'select2/dist/css/select2.css';
import { useEffect, useState } from 'react';
import SetupDataService from '../services/SetupDataService';
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Load setup data once when app starts
    const loadSetupData = async () => {
      try {
        await SetupDataService.loadAllData();
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading setup data:', error);
        setDataLoaded(true); // Continue even if load fails
      }
    };

    loadSetupData();
  }, []);

  if (!dataLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#7a8450'
      }}>
        Loading application...
      </div>
    );
  }

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
