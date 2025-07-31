
"use client";

import { useState, useEffect } from 'react';

function getBooksPerPage(width: number): number {
    if (width < 768) { // 2 cols
        return 20;
    }
    if (width < 1024) { // 3 cols
        return 21;
    }
    if (width < 1280) { // 4 cols
        return 20;
    }
    // 5 cols and up
    return 20;
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
    const [booksPerPage, setBooksPerPage] = useState(20);

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
