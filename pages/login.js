import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import styles from '../styles/Login.module.css';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const result = await signIn('google', {
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.url) {
      router.push(result.url);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📦</span>
          <h1>OrderFlow</h1>
        </div>
        
        <h2 className={styles.title}>Sign In</h2>
        <p className={styles.subtitle}>Enter your credentials to access the system</p>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className={styles.footer}>
          <p>Order Management System v1.0</p>
          <p style={{ marginTop: '8px', fontSize: '11px' }}>© 2025 Kairali Products</p>
          <div className={styles.watermark}>
            <span>Design & Developed by</span>
            <strong>Ambuj</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
