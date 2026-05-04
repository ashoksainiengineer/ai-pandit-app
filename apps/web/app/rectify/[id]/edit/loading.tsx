/**
 * Edit Session Page Loading Skeleton
 * Sacred Ivory Light Theme — Edit form skeleton
 */
export default function EditSessionLoading() {
  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#F0E8DE]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-[#F5EFE7] rounded-lg animate-pulse" />
          <div className="h-6 bg-[#F5EFE7] rounded-lg animate-pulse w-48" />
        </div>
      </nav>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-3 mb-8">
          <div className="h-8 bg-[#F5EFE7] rounded-xl animate-pulse w-64" />
          <div className="h-4 bg-[#F5EFE7] rounded-lg animate-pulse w-80" />
        </div>

        {/* Sections */}
        <div className="bg-white border border-[#F0E8DE] rounded-2xl p-6 space-y-6">
          <div className="h-5 bg-[#F5EFE7] rounded-lg animate-pulse w-32" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-[#F5EFE7] rounded-lg animate-pulse w-20" />
              <div className="h-12 bg-[#F5EFE7] rounded-xl animate-pulse w-full" />
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#F0E8DE] rounded-2xl p-6 space-y-4">
          <div className="h-5 bg-[#F5EFE7] rounded-lg animate-pulse w-36" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[#F5EFE7] rounded-xl animate-pulse w-full" />
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <div className="h-12 bg-[#F5EFE7] rounded-xl animate-pulse w-36" />
        </div>
      </div>
    </div>
  );
}
