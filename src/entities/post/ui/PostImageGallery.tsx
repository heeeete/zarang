'use client';

import { useState } from 'react';
import { RowsPhotoAlbum } from 'react-photo-album';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'react-photo-album/rows.css';

interface PostImageGalleryProps {
  images: Array<{
    id: string;
    image_url: string;
    width?: number | null;
    height?: number | null;
  }>;
  postTitle: string;
}

/**
 * 게시글의 이미지들을 Photo Gallery(Rows) 형식으로 보여주는 컴포넌트예요.
 * 서버에 저장된 실제 넓이와 높이를 사용하여 원본 비율에 맞는 예쁜 레이아웃을 구성합니다.
 */
export const PostImageGallery = ({ images, postTitle }: PostImageGalleryProps) => {
  const [index, setIndex] = useState(-1);

  // 데이터베이스에 저장된 실제 넓이와 높이를 사용해요.
  // 값이 없는 경우(기존 데이터)를 대비해 기본값 800을 설정합니다.
  const photos = images.map((img) => ({
    src: img.image_url,
    width: img.width || 800,
    height: img.height || 800,
    alt: postTitle,
  }));

  return (
    <div className="bg-white px-4 py-2">
      <RowsPhotoAlbum
        photos={photos}
        onClick={({ index }) => setIndex(index)}
        rowConstraints={{
          maxPhotos: images.length === 1 ? 1 : 2,
        }}
      />

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={photos}
        plugins={[Zoom, Counter]}
        counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
        }}
      />
    </div>
  );
};
