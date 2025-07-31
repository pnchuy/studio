
"use client";

import { useState, useEffect } from 'react';

function getBooksPerPage(width: number): number {
    if (width < 1280) { // 2, 3, 4 cols
        return 36;
    }
    if (width < 1536) { // 5 cols
        return 35;
    }
    // 6 cols and up
    return 36;
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


export function useResponsivePaging() {
    const [booksPerPage, setBooksPerPage] = useState(36);

    useEffect(() => {
        const handleResize = () => {
            setBooksPerPage(getBooksPerPage(window.innerWidth));
        };
        
        const debouncedHandleResize = debounce(handleResize, 200);

        handleResize();

        window.addEventListener('resize', debouncedHandleResize);
        
        return () => window.removeEventListener('resize', debouncedHandleResize);
    }, []);

    return booksPerPage;
}
