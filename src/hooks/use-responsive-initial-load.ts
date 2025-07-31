
"use client";

import { useState, useEffect } from 'react';

interface ResponsiveLoadConfig {
  initialLoadCount: number;
  itemsPerRow: number;
}

function getResponsiveConfig(width: number): ResponsiveLoadConfig {
    if (width >= 1536) { // 2xl, 6 cols
        return { initialLoadCount: 18, itemsPerRow: 6 };
    }
    if (width >= 1280) { // xl, 5 cols
        return { initialLoadCount: 15, itemsPerRow: 5 };
    }
    if (width >= 1024) { // lg, 4 cols
        return { initialLoadCount: 12, itemsPerRow: 4 };
    }
    if (width >= 768) { // md, 3 cols
        return { initialLoadCount: 9, itemsPerRow: 3 };
    }
    return { initialLoadCount: 6, itemsPerRow: 2 }; // base, 2 cols
}

function debounce(fn: () => void, ms: number) {
  let timer: NodeJS.Timeout;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn();
    }, ms);
  };
}

export function useResponsiveInitialLoad(): ResponsiveLoadConfig {
    const [config, setConfig] = useState<ResponsiveLoadConfig>({ initialLoadCount: 15, itemsPerRow: 5 }); // Default for server

    useEffect(() => {
        const handleResize = () => {
            setConfig(getResponsiveConfig(window.innerWidth));
        };
        
        const debouncedHandleResize = debounce(handleResize, 200);

        handleResize(); // Set initial client-side value

        window.addEventListener('resize', debouncedHandleResize);
        
        return () => window.removeEventListener('resize', debouncedHandleResize);
    }, []);

    return config;
}
