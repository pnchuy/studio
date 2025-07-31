
"use client";

import { useEffect, type RefObject } from 'react';

export function useInfiniteScroll(
  ref: RefObject<HTMLElement>,
  callback: () => void,
  hasMore: boolean
) {
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 1.0 }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, callback, hasMore]);
}
