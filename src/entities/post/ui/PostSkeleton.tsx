interface PostSkeletonProps {
  columns?: number;
}

/**
 * Masonry 레이아웃의 불규칙한 높이를 시뮬레이션하는 스켈레톤 컴포넌트입니다.
 */
export default function PostSkeleton({ columns = 2 }: PostSkeletonProps) {
  // 각 컬럼별로 서로 다른 높이 배열을 정의하여 Masonry 특유의 리듬감을 유지합니다.
  const heightPresets = [
    [280, 200, 320, 240], // 컬럼 1
    [220, 300, 180, 280], // 컬럼 2
    [250, 310, 210, 260], // 컬럼 3 (3열 대응)
  ];

  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div key={`col-${colIndex}`} className="flex flex-1 flex-col gap-[3px]">
          {/* 정의된 프리셋이 있으면 사용하고, 없으면 첫 번째 프리셋을 순환하여 사용합니다. */}
          {heightPresets[colIndex % heightPresets.length].map((height, i) => (
            <div key={`skeleton-${colIndex}-${i}`} className="flex flex-col gap-[3px]">
              <div className="animate-pulse bg-neutral-100" style={{ height: `${height}px` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
