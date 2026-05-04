/**
 * Analysis Page Loading Skeleton
 * Sacred Ivory Light Theme — Streaming analysis with progress + results panel
 */
export default function AnalysisLoading() {
  return (
    <main className="min-h-screen bg-[#FFFCF8]">
      {/* Session Header Skeleton */}
      <div className="bg-white border-b border-[#F0E8DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[#F5EFE7] rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-[#F5EFE7] rounded-lg animate-pulse w-40" />
              <div className="h-3 bg-[#F5EFE7] rounded-lg animate-pulse w-24" />
            </div>
          </div>
          <div className="h-9 bg-[#F5EFE7] rounded-xl animate-pulse w-28" />
        </div>
      </div>

      {/* Progress Indicator Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="bg-white border border-[#F0E8DE] rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-[#F5EFE7] rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[#F5EFE7] rounded-full animate-pulse w-full" />
              <div className="h-4 bg-[#F5EFE7] rounded-lg animate-pulse w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[#F5EFE7] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Results Panel Skeleton */}
        <div className="bg-white border border-[#F0E8DE] rounded-2xl p-6 space-y-4">
          <div className="h-6 bg-[#F5EFE7] rounded-lg animate-pulse w-48" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#F5EFE7] rounded-xl animate-pulse w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
