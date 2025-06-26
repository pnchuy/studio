"use client";

import { useState, useEffect } from 'react';

function debounce(fn: () => void, ms: number) {
  let timer: NodeJS.Timeout;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn();
    }, ms);
  };
}


const getColumns = () => {
    if (typeof window === 'undefined') {
        return 5;
    }
    if (window.innerWidth >= 1280) { // xl
        return 5;
    }
    if (window.innerWidth >= 1024) { // lg
        return 4;
    }
    if (window.innerWidth >= 768) { // md
        return 3;
    }
    return 2; // base
};

export function useResponsiveColumns() {
    const [columns, setColumns] = useState(5); // Start with a server-safe default

    useEffect(() => {
        // This effect runs only on the client, after the initial render.
        const debouncedHandleResize = debounce(() => {
            setColumns(getColumns());
        }, 200);

        // Set the correct number of columns for the client's screen size
        setColumns(getColumns());

        window.addEventListener('resize', debouncedHandleResize);
        
        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', debouncedHandleResize);
    }, []); // Empty dependency array ensures this runs only once on mount

    return columns;
}
