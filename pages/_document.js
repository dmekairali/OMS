import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/2666/2666505.png" />
        
        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#7a8450" />
        <meta
          name="description"
          content="Order Management System for Kairali Products - Manage orders, dispatch, delivery, and payments efficiently"
        />
        
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
