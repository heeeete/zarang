/**
 * 이미지를 가공하고 메타데이터를 추출하는 유틸리티입니다.
 */
export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * 브라우저의 기능을 사용하여 이미지의 회전을 교정하고 고화질로 최적화하여 반환합니다.
 */
export const processImage = async (file: File): Promise<ProcessedImage> => {
  // imageOrientation: 'from-image' 옵션으로 EXIF 회전 정보를 자동 적용합니다.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = bitmap;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context 생성 실패');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    // 가장 안정적이고 효율적인 image/jpeg 포맷 사용 (품질 0.8은 sharp의 80과 유사)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width, height });
        } else {
          reject(new Error('이미지 변환 실패'));
        }
      },
      'image/jpeg',
      0.8
    );
  });
};
