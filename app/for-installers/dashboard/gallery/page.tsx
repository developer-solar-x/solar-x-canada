'use client'

// Installer project gallery page

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus,
  Grid3x3,
  List
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProjectPhoto {
  id: string
  url: string
  title: string
  category: string
  uploadedAt: string
  systemSize?: string
  location?: string
}

export default function ProjectGalleryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUploading, setIsUploading] = useState(false)

  // Mock project photos - will be replaced with real data when backend is connected
  const [photos] = useState<ProjectPhoto[]>([
    {
      id: 'photo-1',
      url: '/api/placeholder/800/600',
      title: 'Residential Solar Installation - Toronto',
      category: 'residential',
      uploadedAt: '2024-01-15',
      systemSize: '7.0 kW',
      location: 'Toronto, ON',
    },
    {
      id: 'photo-2',
      url: '/api/placeholder/800/600',
      title: 'Commercial Rooftop System',
      category: 'commercial',
      uploadedAt: '2024-01-10',
      systemSize: '50.0 kW',
      location: 'Mississauga, ON',
    },
    {
      id: 'photo-3',
      url: '/api/placeholder/800/600',
      title: 'Battery Storage Installation',
      category: 'battery',
      uploadedAt: '2024-01-05',
      systemSize: '16 kWh',
      location: 'Brampton, ON',
    },
  ])

  const categories = [
    { value: 'all', label: 'All Projects' },
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'battery', label: 'Battery Storage' },
  ]

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(photo => photo.category === selectedCategory)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    // TODO: Upload to backend when connected
    console.log('Uploading files:', Array.from(files).map(f => f.name))
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsUploading(false)
    
    alert('Photos uploaded successfully! (Mock - no backend connected)')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/for-installers/dashboard" 
            className="text-white/80 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold font-display">Project Gallery</h1>
          <p className="text-white/90 mt-2">Showcase your completed installations</p>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Controls */}
          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Category Filter */}
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-forest-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-forest-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    <Grid3x3 size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-forest-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    <List size={20} />
                  </button>
                </div>

                {/* Upload Button */}
                <label className="btn-primary cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <>
                      <Upload size={18} className="mr-2 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="mr-2" />
                      Upload Photos
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredPhotos.length} of {photos.length} projects
            </div>
          </div>

          {/* Gallery Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video bg-gray-200">
                    <Image
                      src={photo.url}
                      alt={photo.title}
                      fill
                      className="object-cover"
                    />
                    <button className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2">
                      <X size={16} className="text-gray-700" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {photo.systemSize && (
                        <p>System: {photo.systemSize}</p>
                      )}
                      {photo.location && (
                        <p>Location: {photo.location}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(photo.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-xl shadow-md p-6 flex gap-6 hover:shadow-lg transition-shadow"
                >
                  <div className="relative w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0">
                    <Image
                      src={photo.url}
                      alt={photo.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{photo.title}</h3>
                      <button className="text-red-600 hover:text-red-700">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      {photo.systemSize && (
                        <div>
                          <span className="font-semibold">System Size:</span> {photo.systemSize}
                        </div>
                      )}
                      {photo.location && (
                        <div>
                          <span className="font-semibold">Location:</span> {photo.location}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Category:</span> {photo.category}
                      </div>
                      <div>
                        <span className="font-semibold">Uploaded:</span> {new Date(photo.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredPhotos.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-md text-center">
              <ImageIcon className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600 mb-4">No projects found in this category.</p>
              <label className="btn-primary inline-flex items-center cursor-pointer">
                <Upload size={18} className="mr-2" />
                Upload Your First Project
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

