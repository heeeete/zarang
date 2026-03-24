/**
 * 이미지를 가공하고 메타데이터를 추출하는 유틸리티입니다.
 */

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

/**
 * 브라우저의 원본 기능을 사용하여 이미지를 가공합니다.
 * createImageBitmap의 imageOrientation 옵션을 통해 EXIF 회전 정보를 자동으로 처리합니다.
 */
export const processImage = async (
  file: File,
  options: { quality?: number; type?: string } = {}
): Promise<ProcessedImage> => {
  const { quality = 0.8, type = 'image/webp' } = options;

  // GIF는 가공 시 애니메이션이 손실되므로 회전 처리 없이 원본 유지
  if (file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ blob: file, width: img.width, height: img.height, type: file.type });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
    });
  }

  // createImageBitmap은 EXIF Orientation을 자동으로 처리해주는 가장 가볍고 빠른 네이티브 방법입니다.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context 생성 실패');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            width: canvas.width,
            height: canvas.height,
            type,
          });
        } else {
          reject(new Error('이미지 변환 실패'));
        }
      },
      type,
      quality
    );
  });
};
