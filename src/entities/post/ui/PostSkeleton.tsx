export default function PostSkeleton() {
  return (
    <div className="flex gap-[10px]">
      {/* 왼쪽 컬럼 */}
      <div className="flex flex-1 flex-col gap-[10px]">
        {[280, 200, 320, 240].map((height, i) => (
          <div key={`left-${i}`} className="flex flex-col gap-2">
            <div
              className="animate-pulse rounded-xl bg-neutral-100"
              style={{ height: `${height}px` }}
            />
          </div>
        ))}
      </div>
      {/* 오른쪽 컬럼 */}
      <div className="flex flex-1 flex-col gap-[10px]">
        {[220, 300, 180, 280].map((height, i) => (
          <div key={`right-${i}`} className="flex flex-col gap-2">
            <div
              className="animate-pulse rounded-xl bg-neutral-100"
              style={{ height: `${height}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
