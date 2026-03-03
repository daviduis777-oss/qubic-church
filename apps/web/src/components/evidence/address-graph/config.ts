/**
 * Address Graph Visualization Configuration
 *
 * Centralized configuration for all magic numbers and constants
 * used throughout the Address Graph visualization components.
 */

export const GRAPH_CONFIG = {
  /**
   * Initial blockchain block to display on load
   * Default: 100,000 (early Bitcoin history with interesting patterns)
   */
  INITIAL_BLOCK: 100000,

  /**
   * Camera orbit controls damping factor
   * Lower = more responsive, Higher = smoother/dampened
   * Range: 0.01 (very responsive) to 0.2 (very smooth)
   */
  CAMERA_DAMPING: 0.05,

  /**
   * Light source positions in 3D space [x, y, z]
   */
  LIGHTS: {
    /** Main directional light from above */
    TOP: [0, 100, 0] as const,
    /** Accent light from top-right corner */
    ACCENT: [80, 30, 80] as const,
    /** Key light position */
    KEY: [40, 30, 0] as const,
  },

  /**
   * Node visualization sizes and spacing
   */
  NODES: {
    /** Base size for regular nodes */
    DEFAULT_SIZE: 0.4,
    /** Size multiplier for selected/highlighted nodes */
    SELECTED_SIZE_MULTIPLIER: 1.5,
    /** Minimum distance between nodes to prevent overlap */
    MIN_DISTANCE: 2.0,
  },

  /**
   * Edge (connection line) rendering configuration
   */
  EDGES: {
    /** Maximum number of edges to render simultaneously */
    MAX_VISIBLE: 50000,
    /** Base opacity for edge lines */
    BASE_OPACITY: 0.3,
    /** Opacity for highlighted/hovered edges */
    HIGHLIGHT_OPACITY: 0.8,
    /** Line width for edge rendering */
    LINE_WIDTH: 1.5,
  },

  /**
   * Performance and optimization settings
   */
  PERFORMANCE: {
    /** Target frames per second */
    TARGET_FPS: 60,
    /** Enable frustum culling for off-screen nodes */
    ENABLE_CULLING: true,
    /** Distance threshold for LOD (Level of Detail) switching */
    LOD_DISTANCE_THRESHOLD: 100,
  },

  /**
   * UI timing and animation durations (in milliseconds)
   */
  TIMINGS: {
    /** Duration to show copy notification */
    COPY_NOTIFICATION: 2000,
    /** Duration to show error messages */
    ERROR_DISPLAY: 3000,
    /** Debounce delay for search input */
    SEARCH_DEBOUNCE: 300,
    /** Camera animation transition duration */
    CAMERA_TRANSITION: 1000,
    /** Tooltip show delay on hover */
    TOOLTIP_DELAY: 200,
  },

  /**
   * Color scheme for XOR tiers (0-7)
   * Each tier represents a different XOR transformation value
   */
  COLORS: {
    TIER_0: '#3b82f6', // Blue - No XOR (base addresses)
    TIER_1: '#10b981', // Green - XOR 7
    TIER_2: '#f59e0b', // Amber - XOR 11
    TIER_3: '#ef4444', // Red - XOR 13
    TIER_4: '#8b5cf6', // Purple - XOR 19
    TIER_5: '#ec4899', // Pink - XOR 27 (CFB signature!)
    TIER_6: '#06b6d4', // Cyan - XOR 33
    TIER_7: '#f97316', // Orange - XOR 121 (NXT constant!)
  } as const,

  /**
   * Filter presets for common scenarios
   */
  FILTERS: {
    /** Show only CFB signature addresses (XOR 27) */
    CFB_SIGNATURE: { xor: [27] },
    /** Show only NXT-related addresses (XOR 121) */
    NXT_RELATED: { xor: [121] },
    /** Show special mathematical addresses (0x7b + 2299) */
    SPECIAL_ADDRESSES: { byteSum: 2299, firstByte: 0x7b },
  },
} as const;

/**
 * Keyboard shortcuts configuration
 * Maps keyboard events to actions
 */
export const KEYBOARD_SHORTCUTS = {
  RESET_CAMERA: 'r',
  TOGGLE_STATS: 's',
  TOGGLE_HELP: '?',
  TOGGLE_FILTERS: 'f',
  FOCUS_SEARCH: '/',
  NEXT_NODE: 'ArrowRight',
  PREV_NODE: 'ArrowLeft',
  ZOOM_IN: '+',
  ZOOM_OUT: '-',
} as const;

/**
 * Type exports for TypeScript
 */
export type TierColor = keyof typeof GRAPH_CONFIG.COLORS;
export type KeyboardAction = keyof typeof KEYBOARD_SHORTCUTS;
