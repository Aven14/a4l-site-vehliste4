'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { convertToWebP } from '@/lib/client-image-utils'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
  maxImages?: number
}

export default function ImageUpload({ images, onChange, disabled, maxImages }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      const files = Array.from(e.target.files)
      const newUrls: string[] = []

      for (const file of files) {
        // Conversion en WebP si ce n'est pas déjà le cas
        let uploadFile: File | Blob = file
        let fileName = `${Math.random()}.webp`

        if (file.type !== 'image/webp') {
          try {
            uploadFile = await convertToWebP(file)
          } catch (e) {
            console.error('WebP conversion failed, using original:', e)
            const fileExt = file.name.split('.').pop()
            fileName = `${Math.random()}.${fileExt}`
          }
        }

        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('vehicles')
          .upload(filePath, uploadFile, {
            contentType: 'image/webp'
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('vehicles')
          .getPublicUrl(filePath)

        newUrls.push(publicUrl)
      }

      onChange([...images, ...newUrls])
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Erreur lors de l\'upload de l\'image. Assurez-vous que le bucket "vehicles" existe sur Supabase.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === images.length - 1) return

    const newImages = [...images]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const [movedImage] = newImages.splice(index, 1)
    newImages.splice(targetIndex, 0, movedImage)
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div key={url + index} className="relative aspect-video bg-dark-200 rounded-lg overflow-hidden group">
            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
            
            {/* Overlay d'index */}
            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
              #{index + 1}
            </div>

            {/* Contrôles */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded transition disabled:opacity-30"
                  title="Déplacer vers le début"
                >
                  ⬅️
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 'down')}
                  disabled={index === images.length - 1}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded transition disabled:opacity-30"
                  title="Déplacer vers la fin"
                >
                  ➡️
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition text-xs"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}

        {/* Bouton d'ajout / Zone de drop */}
        {(!maxImages || images.length < maxImages) && (
          <div
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            className={`
              aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition
              ${uploading ? 'bg-dark-200 border-gray-600' : 'bg-dark-300 border-gray-700 hover:border-primary-500 hover:bg-dark-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent animate-spin rounded-full"></div>
                <span className="text-xs text-gray-500">Upload...</span>
              </div>
            ) : (
              <>
                <span className="text-2xl mb-1">📸</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">Ajouter</span>
              </>
            )}
            <input
              type="file"
              multiple={!maxImages || maxImages > 1}
              accept="image/*"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              disabled={disabled || uploading}
            />
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-500">
        {maxImages === 1 
          ? 'Format WebP automatique • Max 5MB' 
          : 'Glissez les images pour changer l\'ordre • Format WebP automatique • Max 5MB'}
      </p>
    </div>
  )
}
