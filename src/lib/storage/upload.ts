import { supabase } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import { v4 as uuidv4 } from 'uuid'

export interface UploadOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

/**
 * Compresses an image and uploads it to Supabase Storage.
 * @param file The file to upload.
 * @param userId The ID of the authenticated user.
 * @param options Compression options.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImage(
  file: File,
  userId: string,
  options: UploadOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920 }
): Promise<string> {
  try {
    // 1. Compress the image
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: true,
    })

    // 2. Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('flashcard-images')
      .upload(filePath, compressedFile)

    if (uploadError) {
      throw uploadError
    }

    // 4. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('flashcard-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadImage:', error)
    throw error
  }
}
