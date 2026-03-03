/**
 * Neuraxon Visualization Configuration
 *
 * Centralized configuration for all magic numbers and constants
 * used throughout the Neuraxon neural network visualization.
 */

export const NEURAXON_CONFIG = {
  /**
   * Neural network node visualization
   */
  NODES: {
    /** Base size for neuron nodes */
    DEFAULT_SIZE: 1.0,
    /** Size multiplier for active/firing neurons */
    ACTIVE_SIZE_MULTIPLIER: 1.5,
    /** Pulse animation speed for active neurons */
    PULSE_SPEED: 2.0,
  },

  /**
   * Network connection parameters
   */
  CONNECTIONS: {
    /** Maximum connection distance between neurons */
    MAX_DISTANCE: 50,
    /** Base opacity for connection lines */
    BASE_OPACITY: 0.2,
    /** Opacity for active signal paths */
    ACTIVE_OPACITY: 0.9,
    /** Signal propagation speed */
    SIGNAL_SPEED: 5.0,
  },

  /**
   * Camera presets for different viewing angles
   * [x, y, z] positions in 3D space
   */
  CAMERA_PRESETS: {
    /** Overview of entire neural network */
    OVERVIEW: [0, 50, 100] as const,
    /** Top-down view for layer analysis */
    TOP_DOWN: [0, 150, 0] as const,
    /** Side view for signal flow visualization */
    SIDE_VIEW: [150, 50, 0] as const,
    /** Close-up for detailed neuron inspection */
    CLOSE_UP: [20, 20, 20] as const,
  },

  /**
   * Network data fetching and retry logic
   */
  FETCH: {
    /** Maximum number of retry attempts on fetch failure */
    MAX_RETRIES: 3,
    /** Delay between retry attempts (ms) */
    RETRY_DELAY: 1000,
    /** Request timeout (ms) */
    TIMEOUT: 10000,
  },

  /**
   * UI timing and animations (in milliseconds)
   */
  TIMINGS: {
    /** Duration to show notifications */
    NOTIFICATION_DURATION: 3000,
    /** Debounce delay for search input */
    SEARCH_DEBOUNCE: 300,
    /** Camera transition animation duration */
    CAMERA_TRANSITION: 1200,
    /** Tooltip show delay on hover */
    TOOLTIP_DELAY: 150,
  },

  /**
   * Color scheme for neural network layers
   */
  COLORS: {
    /** Input layer neurons */
    INPUT_LAYER: '#3b82f6',
    /** Hidden layer neurons */
    HIDDEN_LAYER: '#8b5cf6',
    /** Output layer neurons */
    OUTPUT_LAYER: '#ef4444',
    /** Active/firing neurons */
    ACTIVE_NEURON: '#10b981',
    /** Connection lines */
    CONNECTION: '#6b7280',
    /** Active signal path */
    ACTIVE_CONNECTION: '#f59e0b',
  } as const,

  /**
   * Performance optimization settings
   */
  PERFORMANCE: {
    /** Target frames per second */
    TARGET_FPS: 60,
    /** Enable frustum culling */
    ENABLE_CULLING: true,
    /** Maximum nodes to render simultaneously */
    MAX_VISIBLE_NODES: 10000,
  },
} as const;

/**
 * Keyboard shortcuts for Neuraxon visualization
 */
export const NEURAXON_SHORTCUTS = {
  RESET_CAMERA: 'r',
  TOGGLE_HELP: '?',
  CYCLE_PRESETS: 'Tab',
  PLAY_PAUSE: 'Space',
  STEP_FORWARD: 'ArrowRight',
  STEP_BACKWARD: 'ArrowLeft',
  TOGGLE_CONNECTIONS: 'c',
  TOGGLE_LABELS: 'l',
} as const;

/**
 * Qiner Algorithm Configuration
 * From: https://github.com/qubic/qiner
 */
export const QINER_CONFIG = {
  /**
   * Algorithm variants with their specific constants
   */
  VARIANTS: {
    /** Addition algorithm (current) - learns A + B = C */
    ADDITION: {
      K: 14,          // Input neurons (7 bits × 2 operands)
      L: 8,           // Output neurons (8-bit sum)
      N: 120,         // Max ticks per simulation
      S: 100,         // Mutations per training round
      M: 364,         // Max neighbors per neuron (728/2)
      P: 122,         // Population threshold (K + L + S)
      threshold: 0.80, // Solution accuracy threshold
    },
    /** Hyperidentity algorithm (legacy) - pattern matching */
    HYPERIDENTITY: {
      K: 256,
      L: 256,
      N: 120,
      S: 100,
      M: 364,
      P: 512,
      threshold: 0.80,
    },
  },

  /**
   * Tick simulation visualization settings
   */
  TICK: {
    /** Animation speed in milliseconds per tick */
    ANIMATION_SPEED_MS: 50,
    /** Maximum visible ticks in history */
    MAX_VISIBLE_TICKS: 120,
    /** Check for convergence every N ticks */
    CONVERGENCE_CHECK_INTERVAL: 10,
  },

  /**
   * Evolution visualization settings
   */
  EVOLUTION: {
    /** Maximum generations to track in history */
    MAX_HISTORY_SIZE: 1000,
    /** Mutation log entries to display */
    MUTATION_LOG_SIZE: 50,
    /** Chart data points */
    CHART_POINTS: 100,
  },

  /**
   * Ternary weight color scheme
   */
  WEIGHT_COLORS: {
    /** +1 Excitatory synapse */
    POSITIVE: '#22C55E',    // Green
    /** 0 Neutral synapse */
    NEUTRAL: '#6B7280',     // Gray
    /** -1 Inhibitory synapse */
    NEGATIVE: '#EF4444',    // Red
  },

  /**
   * Ternary state color scheme
   */
  STATE_COLORS: {
    /** +1 Excited neuron */
    POSITIVE: '#F59E0B',    // Orange/Gold
    /** 0 Neutral neuron */
    NEUTRAL: '#6B7280',     // Gray
    /** -1 Inhibited neuron */
    NEGATIVE: '#3B82F6',    // Blue
  },

  /**
   * Evolution event colors
   */
  EVOLUTION_COLORS: {
    /** Mutation improved score */
    IMPROVEMENT: '#22C55E',
    /** Mutation worsened score (rolled back) */
    REGRESSION: '#EF4444',
    /** No change */
    NEUTRAL: '#6B7280',
    /** New neuron inserted */
    INSERTION: '#06B6D4',
    /** Neuron pruned */
    PRUNING: '#F97316',
  },
} as const;

/**
 * Type exports for TypeScript
 */
export type CameraPreset = keyof typeof NEURAXON_CONFIG.CAMERA_PRESETS;
export type LayerColor = keyof typeof NEURAXON_CONFIG.COLORS;
export type QinerVariant = keyof typeof QINER_CONFIG.VARIANTS;
