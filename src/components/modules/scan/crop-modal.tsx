"use client";

import { useState, useRef } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function CropModal({
  imageUrl,
  open,
  onClose,
  onComplete,
}: {
  imageUrl: string;
  open: boolean;
  onClose: () => void;
  onComplete: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        width / height,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }

  async function handleSave() {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const image = imgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = "high";

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY
      );

      canvas.toBlob(
        (blob) => {
          if (blob) onComplete(blob);
        },
        "image/jpeg",
        0.95
      );
    } else {
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Fişi Kırp" className="max-w-4xl p-0 overflow-hidden">
      <div className="flex flex-col">
        <p className="text-sm text-text-secondary px-6 pb-4">Fişin sadece önemli olan kısımlarını seçin.</p>
        <div className="p-4 flex flex-col items-center justify-center max-h-[70vh] overflow-y-auto bg-black/5">
           <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-[60vh]"
           >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                 ref={imgRef}
                 src={imageUrl}
                 alt="Crop preview"
                 onLoad={onImageLoad}
                 className="max-h-[60vh] object-contain"
                 crossOrigin="anonymous"
              />
           </ReactCrop>
        </div>
        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onClose}>İptal</Button>
          <Button onClick={handleSave}>Kırp ve Kaydet</Button>
        </div>
      </div>
    </Dialog>
  );
}
