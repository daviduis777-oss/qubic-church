// Contact Cube Constants
// Mapping the 128x128 Anna Matrix to a 3D cube structure

import type { CubeFaceId, ColorTheme } from './types'

// Matrix dimensions
export const MATRIX_SIZE = 128
export const CUBE_FACE_SIZE = 64 // Each face is 64x64 cells
export const TOTAL_CELLS = MATRIX_SIZE * MATRIX_SIZE // 16,384

// 3D Cube dimensions
export const CUBE_SCALE = 10 // Visual scale of the cube
export const DEPTH_SCALE = 2 // How much XOR values affect Z-depth
export const CELL_SIZE = CUBE_SCALE / CUBE_FACE_SIZE

// Face mappings: How the 128x128 matrix maps to 6 cube faces
// Front + Back are opposite, Left + Right are opposite, Top + Bottom are opposite
export const FACE_MAPPINGS: Record<CubeFaceId, { rowStart: number; colStart: number; rowEnd: number; colEnd: number }> = {
  front: { rowStart: 0, colStart: 0, rowEnd: 63, colEnd: 63 },
  back: { rowStart: 64, colStart: 64, rowEnd: 127, colEnd: 127 },
  left: { rowStart: 0, colStart: 64, rowEnd: 63, colEnd: 127 },
  right: { rowStart: 64, colStart: 0, rowEnd: 127, colEnd: 63 },
  top: { rowStart: 0, colStart: 0, rowEnd: 63, colEnd: 127 }, // Full width, top half
  bottom: { rowStart: 64, colStart: 0, rowEnd: 127, colEnd: 127 }, // Full width, bottom half
}

// Alternative mapping: Quadrant-based (4 faces from quadrants, 2 from middle bands)
export const QUADRANT_FACE_MAPPINGS: Record<CubeFaceId, { rowStart: number; colStart: number }> = {
  front: { rowStart: 0, colStart: 0 },     // Q1: Top-left
  back: { rowStart: 64, colStart: 64 },    // Q4: Bottom-right (opposite)
  left: { rowStart: 0, colStart: 64 },     // Q2: Top-right
  right: { rowStart: 64, colStart: 0 },    // Q3: Bottom-left (opposite)
  top: { rowStart: 32, colStart: 0 },      // Middle band left
  bottom: { rowStart: 32, colStart: 64 },  // Middle band right (opposite)
}

// Opposing faces (for overlay comparison)
export const OPPOSING_FACES: Record<CubeFaceId, CubeFaceId> = {
  front: 'back',
  back: 'front',
  left: 'right',
  right: 'left',
  top: 'bottom',
  bottom: 'top',
}

// All face pairs for comparison
export const FACE_PAIRS: [CubeFaceId, CubeFaceId][] = [
  ['front', 'back'],
  ['left', 'right'],
  ['top', 'bottom'],
]

// Animation timings (in milliseconds)
export const ANIMATION_TIMINGS = {
  flatDisplayDuration: 2000,
  foldingDuration: 4000,
  cubePauseDuration: 1500,
  overlayRevealDuration: 3000,
  rotationSpeed: 0.002, // radians per frame
  markerPulseSpeed: 2, // Hz
}

// Easing function for smooth animations
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Flat layout positions (cross pattern like a cube net)
// Standard cross layout:
//        [top]
// [left][front][right][back]
//       [bottom]
export const FLAT_POSITIONS: Record<CubeFaceId, [number, number, number]> = {
  front: [0, 0, 0],
  back: [CUBE_SCALE * 2, 0, 0],    // To the right of 'right'
  left: [-CUBE_SCALE, 0, 0],
  right: [CUBE_SCALE, 0, 0],
  top: [0, CUBE_SCALE, 0],
  bottom: [0, -CUBE_SCALE, 0],
}

// Cube positions (when fully folded)
export const CUBE_POSITIONS: Record<CubeFaceId, [number, number, number]> = {
  front: [0, 0, CUBE_SCALE / 2],
  back: [0, 0, -CUBE_SCALE / 2],
  left: [-CUBE_SCALE / 2, 0, 0],
  right: [CUBE_SCALE / 2, 0, 0],
  top: [0, CUBE_SCALE / 2, 0],
  bottom: [0, -CUBE_SCALE / 2, 0],
}

// Flat rotations (all faces face the camera in the cross layout)
export const FLAT_ROTATIONS: Record<CubeFaceId, [number, number, number]> = {
  front: [0, 0, 0],
  back: [0, 0, 0],   // Faces camera in flat mode
  left: [0, 0, 0],
  right: [0, 0, 0],
  top: [0, 0, 0],
  bottom: [0, 0, 0],
}

// Cube rotations (when fully folded into 3D cube)
// Each face must rotate to point outward from the cube center
export const CUBE_ROTATIONS: Record<CubeFaceId, [number, number, number]> = {
  front: [0, 0, 0],                    // Front face stays facing forward
  back: [0, Math.PI, 0],               // Back face rotates 180° to face backward
  left: [0, -Math.PI / 2, 0],          // Left face rotates -90° around Y
  right: [0, Math.PI / 2, 0],          // Right face rotates 90° around Y
  top: [-Math.PI / 2, 0, 0],           // Top face rotates -90° around X
  bottom: [Math.PI / 2, 0, 0],         // Bottom face rotates 90° around X
}

// Color themes
export const COLOR_THEMES: Record<ColorTheme, { negative: string; zero: string; positive: string; background: string }> = {
  default: {
    negative: '#3B82F6', // Blue
    zero: '#6B7280',     // Gray
    positive: '#F59E0B', // Orange
    background: '#0a0a0a',
  },
  fire: {
    negative: '#1E3A5F', // Deep blue
    zero: '#DC2626',     // Red
    positive: '#FCD34D', // Yellow
    background: '#0f0505',
  },
  ice: {
    negative: '#1E40AF', // Deep blue
    zero: '#06B6D4',     // Cyan
    positive: '#FFFFFF', // White
    background: '#050a0f',
  },
  matrix: {
    negative: '#000000', // Black
    zero: '#166534',     // Dark green
    positive: '#22C55E', // Bright green
    background: '#000000',
  },
  scientific: {
    negative: '#7C3AED', // Purple
    zero: '#FFFFFF',     // White
    positive: '#EF4444', // Red
    background: '#0f0f0f',
  },
}

// Registration mark (anomaly) colors
export const ANOMALY_COLORS = {
  normal: '#FF6B6B',     // Red for anomalies
  special: '#FFD700',    // Gold for special [22,22]
  highlight: '#00FFFF',  // Cyan for selected
  line: '#FF6B6B80',     // Semi-transparent red for mirror lines
}

// Special positions
export const SPECIAL_POSITIONS = {
  boot: { row: 21, col: 4, address: 2692, label: 'Boot Address' },
  pocz: { row: 96, col: 84, address: 12372, label: 'POCZ Address' },
  primer: { row: 22, col: 22, value: 100, label: 'Self-Mirror Point' },
}

// Camera presets
export const CAMERA_PRESETS = {
  default: { position: [15, 12, 15] as [number, number, number], fov: 60 },
  top: { position: [0, 25, 0] as [number, number, number], fov: 50 },
  front: { position: [0, 0, 25] as [number, number, number], fov: 50 },
  side: { position: [25, 0, 0] as [number, number, number], fov: 50 },
  isometric: { position: [15, 15, 15] as [number, number, number], fov: 45 },
}

// Contact movie parallel texts
export const CONTACT_PARALLELS = {
  title: 'The Contact Principle',
  subtitle: 'Inspired by the 1997 film',
  description: `In "Contact" (1997), scientists discovered that alien blueprints were hidden
in TV signals - but only visible when 2D pages were folded into a 3D cube.
Registration marks on each page aligned perfectly when viewed in 3D.`,
  annaParallel: `The Anna Matrix parallel: 68 anomaly cells (0.41%) break the 99.59%
point-symmetry. These could be "registration marks" that align when
opposite faces are overlaid - revealing hidden messages.`,
  primer: `The "Primer" in Contact was a mathematical key teaching TRUE/FALSE.
In the Anna Matrix, symmetric cells = TRUE, anomalies = FALSE.`,
}
