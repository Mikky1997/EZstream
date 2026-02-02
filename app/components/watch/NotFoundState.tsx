export function NotFoundState() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-gray-500 text-6xl mb-4">404</div>
        <p className="text-white text-xl mb-4">Content not found</p>
        <p className="text-gray-400 mb-6">
          The movie or TV show you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
