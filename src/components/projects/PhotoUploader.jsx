import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';

export default function PhotoUploader({ photos = [], onPhotosChange, label = 'Photos' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    onPhotosChange([...photos, ...newUrls]);
    setUploading(false);
  };

  const removePhoto = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mt-1">Add</span>
            </>
          )}
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
}