'use client'

import { useState, useEffect } from 'react'

interface ImageGalleryProps {
  images: string[]
  vehicleName: string
}

export default function ImageGallery({ images, vehicleName }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Gérer la fermeture avec la touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-dark-100 rounded-xl flex flex-col items-center justify-center border border-gray-800 shadow-2xl">
        <span className="text-6xl grayscale opacity-20 mb-4">🚗</span>
        <span className="text-gray-600 text-sm font-medium uppercase tracking-widest">Aucune image disponible</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Image principale */}
        <div 
          onClick={() => openLightbox(0)}
          className="aspect-video bg-dark-100 rounded-xl overflow-hidden shadow-2xl border border-gray-800 cursor-zoom-in group"
        >
          <img 
            src={images[0]} 
            alt={vehicleName} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(1, 9).map((img, i) => (
              <div 
                key={i} 
                onClick={() => openLightbox(i + 1)}
                className="aspect-video bg-dark-200 rounded-lg overflow-hidden border border-gray-800 hover:border-primary-500 transition cursor-zoom-in shadow-lg group"
              >
                <img 
                  src={img} 
                  alt={`${vehicleName} ${i + 2}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 transition-opacity duration-200">
          {/* Bouton Fermer */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 text-white text-4xl hover:text-primary-400 transition z-[110]"
          >
            ✕
          </button>

          {/* Flèche Gauche */}
          <button 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition text-2xl md:text-3xl z-[110]"
          >
            ‹
          </button>

          {/* Image Agrandie */}
          <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
            <img 
              key={currentIndex}
              src={images[currentIndex]} 
              alt={`${vehicleName} view`} 
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
            />
            
            {/* Compteur */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-gray-400 font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Flèche Droite */}
          <button 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition text-2xl md:text-3xl z-[110]"
          >
            ›
          </button>

          {/* Overlay de clic pour fermer */}
          <div className="absolute inset-0 z-[100]" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}
