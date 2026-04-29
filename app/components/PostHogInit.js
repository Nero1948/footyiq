'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (posthog.__loaded) return;
    posthog.init(key, {
      api_host: '/relay-x7q3',
      ui_host: 'https://us.posthog.com',
    });
  }, []);

  return null;
}
