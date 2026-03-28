/**
 * 클라이언트 사이드에서 이미지를 리사이징하여 미리보기용 데이터 URL을 생성합니다.
 */
export const createThumbnail = (file: File, maxWidth = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        
        // 원본이 이미 작으면 그대로 사용
        if (scale >= 1) {
          resolve(event.target?.result as string);
          return;
        }

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // 이미지 부드럽게 리사이징
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 낮은 품질의 JPEG로 변환하여 메모리 사용량 최소화
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
