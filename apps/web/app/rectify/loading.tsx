/**
 * Rectify Page Loading Skeleton
 * Sacred Ivory Light Theme — Multi-step form skeleton
 */
export default function RectifyLoading() {
  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      {/* Step Indicators */}
      <div className="pt-28 pb-8">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-12">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-3 bg-[#F5EFE7] rounded-full animate-pulse"
                style={{ width: `${48 + i * 8}px` }}
              />
            ))}
          </div>

          {/* Form Area */}
          <div className="space-y-6">
            <div className="h-8 bg-[#F5EFE7] rounded-xl animate-pulse w-48 mx-auto" />
            <div className="h-4 bg-[#F5EFE7] rounded-lg animate-pulse w-80 mx-auto" />

            <div className="space-y-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-[#F5EFE7] rounded-lg animate-pulse w-24" />
                  <div className="h-12 bg-[#F5EFE7] rounded-xl animate-pulse w-full" />
                </div>
              ))}
            </div>

            <div className="h-32 bg-[#F5EFE7] rounded-xl animate-pulse w-full mt-4" />
          </div>
        </div>
      </div>

      {/* Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0E8DE] p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="h-10 bg-[#F5EFE7] rounded-xl animate-pulse w-24" />
          <div className="h-10 bg-[#F5EFE7] rounded-xl animate-pulse w-32" />
        </div>
      </div>
    </div>
  );
}
