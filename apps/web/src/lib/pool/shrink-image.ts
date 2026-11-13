import { base64Bytes, fitWithin, REPORT } from './report.ts'

/* Screenshots for reports, prepared in the browser: never the original file, never its metadata. */

export type Shot = { dataUrl: string; w: number; h: number; bytes: number; type: 'jpeg' | 'webp' }

/** Decode a picked file: an ImageBitmap where the browser has one (it applies EXIF rotation), else an <img>. */
async function decode(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; done: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const b = await createImageBitmap(file)
      return { src: b, w: b.width, h: b.height, done: () => b.close() }
    } catch {}
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

/**
 * Downscale to at most 1600 px on the longest side and re-encode as WebP (JPEG where the browser cannot
 * write WebP), stepping the quality, then the size, down until it is small. Re-encoding drops the file's
 * metadata, location included.
 */
export async function shrink(file: File): Promise<Shot> {
  if (!file.type.startsWith('image/')) throw new Error('Only a picture can be attached.')
  if (file.size > REPORT.rawMaxBytes) throw new Error('That picture is too large. Take a screenshot of just the part that matters.')
  let pic: Awaited<ReturnType<typeof decode>>
  try {
    pic = await decode(file)
  } catch {
    throw new Error('That picture could not be opened. Try a PNG or JPEG screenshot.')
  }
  try {
    let { w, h } = fitWithin(pic.w, pic.h)
    const canvas = document.createElement('canvas')
    for (let pass = 0; pass < 5; pass++) {
      canvas.width = w
      canvas.height = h
      const g = canvas.getContext('2d')
      if (!g) throw new Error('This browser cannot prepare the picture.')
      g.fillStyle = '#fff'
      g.fillRect(0, 0, w, h)
      g.imageSmoothingQuality = 'high'
      g.drawImage(pic.src, 0, 0, w, h)
      for (const q of [0.86, 0.74, 0.62]) {
        let url = canvas.toDataURL('image/webp', q)
        if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', q)
        const bytes = base64Bytes(url.slice(url.indexOf(',') + 1))
        if (bytes <= REPORT.imageTargetBytes || (pass >= 2 && bytes <= REPORT.imageMaxBytes))
          return { dataUrl: url, w, h, bytes, type: url.startsWith('data:image/webp') ? 'webp' : 'jpeg' }
      }
      w = Math.max(1, Math.round(w * 0.8))
      h = Math.max(1, Math.round(h * 0.8))
    }
    throw new Error('That picture stays too large. Crop it to the part that matters.')
  } finally {
    pic.done()
  }
}

export const kb = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`)
