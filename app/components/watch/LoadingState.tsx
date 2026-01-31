export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        <p className="mt-4 text-gray-400 text-lg">Loading content...</p>
      </div>
    </div>
  );
}
