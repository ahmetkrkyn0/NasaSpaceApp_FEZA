import { useEffect, useRef } from 'react';
import { BrandMark, PRODUCT_NAME, PRODUCT_TAGLINE } from './BrandMark';
import { SplashBackdrop, SplashBackdropCaption, useDarkWhileMounted } from './SplashBackdrop';

/** Opening screen with the product name. Enter or the button opens the console. */
export function Splash({ onEnter }: { onEnter: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useDarkWhileMounted();

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <section className="splash-screen" aria-labelledby="splash-title">
      <SplashBackdrop />
      <div className="splash-content">
        <div className="splash-identity">
          <BrandMark size={112} />
          <h1 id="splash-title" className="splash-brand">
            {PRODUCT_NAME}
          </h1>
          <p className="splash-tagline">{PRODUCT_TAGLINE}</p>
        </div>
        <button ref={buttonRef} type="button" className="splash-enter" onClick={onEnter}>
          Open console
        </button>
      </div>
      <SplashBackdropCaption />
    </section>
  );
}
