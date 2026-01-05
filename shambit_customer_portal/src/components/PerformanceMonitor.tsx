'use client';

import { useEffect } from 'react';

// Type definitions for Web Vitals
interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart?: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

// Global gtag function declaration
declare global {
  function gtag(...args: any[]): void;
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and if performance API is available
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined' || !window.performance) {
      return;
    }

    const measureCoreWebVitals = () => {
      // Measure Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            if (lastEntry) {
              const lcp = lastEntry.startTime;
              console.log('LCP:', lcp);
              
              // Send to analytics (replace with your analytics service)
              if (typeof window !== 'undefined' && 'gtag' in window) {
                (window as any).gtag('event', 'web_vitals', {
                  name: 'LCP',
                  value: Math.round(lcp),
                  event_category: 'Performance',
                });
              }
            }
          });
          
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Measure First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries() as PerformanceEntryWithProcessing[];
            entries.forEach((entry) => {
              if (entry.processingStart) {
                const fid = entry.processingStart - entry.startTime;
                console.log('FID:', fid);
                
                if (typeof window !== 'undefined' && 'gtag' in window) {
                  (window as any).gtag('event', 'web_vitals', {
                    name: 'FID',
                    value: Math.round(fid),
                    event_category: 'Performance',
                  });
                }
              }
            });
          });
          
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Measure Cumulative Layout Shift (CLS)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries() as LayoutShiftEntry[];
            entries.forEach((entry) => {
              if (!entry.hadRecentInput && entry.value) {
                clsValue += entry.value;
              }
            });
          });
          
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Report CLS when page is hidden
          const reportCLS = () => {
            console.log('CLS:', clsValue);
            
            if (typeof window !== 'undefined' && 'gtag' in window) {
              (window as any).gtag('event', 'web_vitals', {
                name: 'CLS',
                value: Math.round(clsValue * 1000),
                event_category: 'Performance',
              });
            }
          };

          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              reportCLS();
            }
          });

          // Cleanup observers after 30 seconds
          setTimeout(() => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
          }, 30000);

        } catch (error) {
          console.warn('Performance monitoring failed:', error);
        }
      }
    };

    // Wait for page load to start measuring
    if (document.readyState === 'complete') {
      measureCoreWebVitals();
    } else {
      window.addEventListener('load', measureCoreWebVitals);
    }

    return () => {
      window.removeEventListener('load', measureCoreWebVitals);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Hook for measuring custom performance metrics
export function usePerformanceMetric(name: string, value: number) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'custom_metric', {
        name,
        value: Math.round(value),
        event_category: 'Performance',
      });
    }
  }, [name, value]);
}