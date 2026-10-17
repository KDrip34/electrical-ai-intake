"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_TYPES, MAX_PHOTOS } from "@/lib/photos";

type Props = {
  photos: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  error?: string;
  disabled?: boolean;
};

export default function PhotoDropzone({ photos, onAdd, onRemove, error, disabled }: Props) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const full = photos.length >= MAX_PHOTOS;

  // Thumbnail URLs; revoked when the photo list changes or the form unmounts.
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onAdd(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled || full) return;
    onAdd(Array.from(e.dataTransfer.files));
  }

  function handleRemove(index: number) {
    onRemove(index);
    // Keep keyboard focus inside the dropzone after a thumbnail disappears.
    inputRef.current?.focus();
  }

  return (
    <div>
      <p className="mb-1 block text-sm font-medium">
        Photos of your panel or work area <span className="font-normal text-neutral-500">(optional)</span>
      </p>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition",
          "has-[input:focus-visible]:border-brand has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand/25",
          dragging ? "border-brand bg-brand/5" : "border-neutral-300 bg-neutral-50 hover:border-brand/60 hover:bg-white",
          error && "border-brand",
          (disabled || full) && "cursor-not-allowed opacity-60 hover:border-neutral-300 hover:bg-neutral-50",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-ink text-white" aria-hidden>
          {dragging ? <ImagePlus className="size-6" /> : <Camera className="size-6" />}
        </span>
        <span className="font-semibold text-ink">
          {full ? "Photo limit reached" : dragging ? "Drop photos to add them" : "Tap to take or choose photos"}
        </span>
        <span id={hintId} className="text-sm text-neutral-500">
          <span className="hidden sm:inline">or drag them here · </span>
          JPEG, PNG, or WebP · up to {MAX_PHOTOS}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          disabled={disabled || full}
          onChange={handleChange}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className="sr-only"
        />
      </label>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-brand">
          {error}
        </p>
      )}

      {photos.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-neutral-600" aria-live="polite">
            <span className="font-semibold text-ink">{photos.length}</span> of {MAX_PHOTOS} photos added
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((f, i) => (
              <li
                key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
                className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
              >
                {previews[i] && (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
                  <img src={previews[i]} alt={f.name} className="size-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  disabled={disabled}
                  aria-label={`Remove ${f.name}`}
                  className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-ink/80 text-white transition hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
