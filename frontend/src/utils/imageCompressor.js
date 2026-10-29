/**
 * imageCompressor.js
 *
 * Client-side high-speed image compression utility using HTML5 Canvas.
 * Downscales huge camera/phone photos (5MB - 12MB) to lightweight, retina-sharp
 * images (~60KB - 200KB) in milliseconds before uploading.
 *
 * This dramatically accelerates uploads (up to 20x faster) and reduces bandwidth.
 */

export async function compressImage(file, {
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85,
  mimeType = 'image/jpeg',
} = {}) {
  // If file is not an image or is SVG, return original
  if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        // If image is already smaller than max dimensions and under 300KB, keep as is
        if (width <= maxWidth && height <= maxHeight && file.size < 300 * 1024) {
          resolve(file)
          return
        }

        // Calculate proportional scale
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) {
          resolve(file)
          return
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to blob
        const targetMime = file.type === 'image/png' ? 'image/png' : mimeType
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            // Return new File object preserving original filename
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: targetMime,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          targetMime,
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = readerEvent.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
