/**
 * Shared Configuration for Evidence Visualizations
 *
 * Configuration values that are shared across multiple
 * visualization components (Address Graph, Qortex, Tables, etc.)
 */

export const SHARED_CONFIG = {
  /**
   * Common UI timing constants (in milliseconds)
   * Used consistently across all visualization components
   */
  TIMINGS: {
    /** Duration to show "Copied!" notification after copy action */
    COPY_NOTIFICATION: 2000,

    /** Duration to show error messages before auto-dismiss */
    ERROR_NOTIFICATION: 3000,

    /** Duration to show success messages */
    SUCCESS_NOTIFICATION: 2000,

    /** Debounce delay for search/filter inputs */
    SEARCH_DEBOUNCE: 300,

    /** Tooltip show delay on hover (prevents flickering) */
    TOOLTIP_DELAY: 200,

    /** Default animation/transition duration */
    DEFAULT_TRANSITION: 300,

    /** Camera movement animation duration */
    CAMERA_TRANSITION: 1000,
  },

  /**
   * Accessibility settings
   */
  A11Y: {
    /** Minimum contrast ratio for text (WCAG AA) */
    MIN_CONTRAST_RATIO: 4.5,

    /** Focus outline width */
    FOCUS_OUTLINE_WIDTH: 2,

    /** Reduced motion media query check */
    RESPECT_REDUCED_MOTION: true,
  },

  /**
   * Common color palette for consistency
   */
  COLORS: {
    /** Primary brand color */
    PRIMARY: '#3b82f6',

    /** Success state */
    SUCCESS: '#10b981',

    /** Warning state */
    WARNING: '#f59e0b',

    /** Error state */
    ERROR: '#ef4444',

    /** Info state */
    INFO: '#06b6d4',

    /** Neutral/disabled */
    NEUTRAL: '#6b7280',
  } as const,

  /**
   * Performance monitoring thresholds
   */
  PERFORMANCE: {
    /** Target FPS for smooth animation */
    TARGET_FPS: 60,

    /** Warning threshold for low FPS */
    LOW_FPS_THRESHOLD: 30,

    /** Maximum memory usage before warning (MB) */
    MAX_MEMORY_MB: 512,
  },

  /**
   * Common keyboard shortcuts across all visualizations
   */
  KEYBOARD: {
    /** Show help/shortcuts overlay */
    HELP: '?',

    /** Reset view/camera to default */
    RESET: 'r',

    /** Toggle fullscreen */
    FULLSCREEN: 'f',

    /** Escape closes modals/overlays */
    ESCAPE: 'Escape',
  } as const,
} as const;

/**
 * Format duration in milliseconds to human-readable string
 * @example formatDuration(2000) => "2s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Check if reduced motion is preferred by user
 * (for accessibility compliance)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Type exports for TypeScript
 */
export type ColorKey = keyof typeof SHARED_CONFIG.COLORS;
export type TimingKey = keyof typeof SHARED_CONFIG.TIMINGS;
