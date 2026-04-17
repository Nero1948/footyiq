export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0e13' }}>
      <div className="text-center">
        <p className="text-2xl font-black text-white mb-2">Set For Six</p>
        <p className="text-sm text-gray-500 animate-pulse">Loading today&apos;s game…</p>
      </div>
    </div>
  );
}
