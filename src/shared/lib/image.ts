/**
 * 이미지 파일에서 EXIF 회전이 반영된 너비와 높이를 추출합니다.
 */
export const getImageMetadata = async (file: File) => {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = bitmap;
    bitmap.close();
    return { width, height };
  } catch (error) {
    console.error('메타데이터 추출 실패:', error);
    return { width: 0, height: 0 };
  }
};
