import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userSession = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;
    
    if (userSession) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

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
      <p style={{ fontSize: '18px', color: '#64748b' }}>Loading...</p>
    </div>
  );
}
