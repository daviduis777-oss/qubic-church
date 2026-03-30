// Contact Cube - 3D Matrix Visualization
// Inspired by the 1997 film "Contact"

export { ContactCubeScene } from './ContactCubeScene'
export { ContactCubeControls } from './ContactCubeControls'
export { ContactCubeInfoPanel } from './ContactCubeInfoPanel'
export { CubeFace, CubeFaceOutline } from './CubeFace'
export { FoldingAnimation, FoldingProgressIndicator, AxisHelper } from './FoldingAnimation'
export { RegistrationMarkers } from './RegistrationMarkers'
export { OverlayComparison, PrimerDisplay } from './OverlayComparison'

// Hooks
export { useContactCubeData } from './hooks/useContactCubeData'
export { useFoldingAnimation } from './hooks/useFoldingAnimation'

// Types
export type {
  CubeFaceId,
  ViewMode,
  ColorTheme,
  CubeFaceData,
  AnomalyCell,
  FoldingState,
  OverlayState,
  ContactCubeState,
  MatrixData,
  AnomalyData,
  FaceTransform,
  PrimerCell,
} from './types'

// Constants
export {
  MATRIX_SIZE,
  CUBE_FACE_SIZE,
  TOTAL_CELLS,
  CUBE_SCALE,
  DEPTH_SCALE,
  CELL_SIZE,
  FACE_MAPPINGS,
  QUADRANT_FACE_MAPPINGS,
  OPPOSING_FACES,
  FACE_PAIRS,
  ANIMATION_TIMINGS,
  easeInOutCubic,
  FLAT_POSITIONS,
  CUBE_POSITIONS,
  CUBE_ROTATIONS,
  COLOR_THEMES,
  ANOMALY_COLORS,
  SPECIAL_POSITIONS,
  CAMERA_PRESETS,
  CONTACT_PARALLELS,
} from './constants'
