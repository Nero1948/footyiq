'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    console.log('[PostHog] init running, key present:', !!key, 'host:', process.env.NEXT_PUBLIC_POSTHOG_HOST);
    if (!key) { console.warn('[PostHog] no key — skipping init'); return; }
    if (posthog.__loaded) { console.log('[PostHog] already loaded'); return; }
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      loaded: (ph) => {
        console.log('[PostHog] loaded successfully');
        window.posthog = ph;
      },
    });
  }, []);

  return null;
}
