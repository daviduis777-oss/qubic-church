'use client'

import { Button } from '@/components/ui/button'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
  Keyboard,
  Share2,
  Camera,
} from 'lucide-react'
import { CAMERA_PRESETS } from './constants'

interface ContactCubeControlBarProps {
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onResetCamera: () => void
  onShowInfo: () => void
  onShowKeyboardShortcuts: () => void
  onShare: () => void
  cameraPreset: keyof typeof CAMERA_PRESETS
  onCameraPresetChange: (preset: keyof typeof CAMERA_PRESETS) => void
}

export function ContactCubeControlBar({
  isFullscreen,
  onToggleFullscreen,
  onResetCamera,
  onShowInfo,
  onShowKeyboardShortcuts,
  onShare,
  cameraPreset,
  onCameraPresetChange,
}: ContactCubeControlBarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Main actions */}
      <div className="flex gap-1 bg-black/70 backdrop-blur-md border border-white/[0.04] p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={onResetCamera}
          title="Reset camera (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={onShowInfo}
          title="What is Contact Cube? (I)"
        >
          <Info className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={onShowKeyboardShortcuts}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={onShare}
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Camera presets */}
      <div className="bg-black/70 backdrop-blur-md border border-white/[0.04] p-1">
        <div className="text-[10px] text-gray-500 px-2 py-1 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Camera
        </div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(CAMERA_PRESETS) as (keyof typeof CAMERA_PRESETS)[]).map((key) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={`h-7 text-xs capitalize ${
                cameraPreset === key
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => onCameraPresetChange(key)}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
