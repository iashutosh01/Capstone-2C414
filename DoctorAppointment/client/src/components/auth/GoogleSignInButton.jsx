import { useEffect, useRef } from 'react';

const GoogleSignInButton = ({ onCredential, disabled = false }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const renderButton = () => {
      if (
        cancelled ||
        !window.google?.accounts?.id ||
        !containerRef.current ||
        !import.meta.env.VITE_GOOGLE_CLIENT_ID
      ) {
        return;
      }

      containerRef.current.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          if (!disabled && credential) {
            onCredential(credential);
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector('script[data-google-identity="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', renderButton);
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', renderButton);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.addEventListener('load', renderButton);
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', renderButton);
    };
  }, [disabled, onCredential]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  return <div ref={containerRef} className="flex justify-center" />;
};

export default GoogleSignInButton;
