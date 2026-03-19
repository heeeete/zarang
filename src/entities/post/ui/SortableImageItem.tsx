import Image from 'next/image';
import { XCircleIcon, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PostImageItem } from '../model/usePostImageManager';

interface SortableImageItemProps {
  item: PostImageItem;
  index: number;
  onRemove: (id: string) => void;
}

export const SortableImageItem = ({ item, index, onRemove }: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square overflow-hidden rounded-lg border bg-white"
    >
      <Image
        src={item.url}
        alt={`preview-${index}`}
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
        unoptimized
      />
      
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-1 left-1 z-10 rounded-md bg-black/30 p-1 text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute top-1 right-1 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <XCircleIcon className="size-5" />
      </button>
      
      {index === 0 && (
        <div className="absolute right-0 bottom-0 left-0 z-10 bg-primary/80 py-0.5 text-center text-[10px] text-white font-medium">
          대표 사진
        </div>
      )}
    </div>
  );
};
