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
    const [columns, setColumns] = useState(getColumns());

    useEffect(() => {
        const debouncedHandleResize = debounce(() => {
            setColumns(getColumns());
        }, 200);

        window.addEventListener('resize', debouncedHandleResize);
        
        setColumns(getColumns());

        return () => window.removeEventListener('resize', debouncedHandleResize);
    }, []);

    return columns;
}
