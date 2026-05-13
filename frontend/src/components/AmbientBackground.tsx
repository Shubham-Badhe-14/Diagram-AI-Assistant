export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden motion-reduce:animate-none"
      aria-hidden
    >
      <div className="ambient-orb ambient-orb-a absolute -left-1/4 top-0 h-[70vh] w-[70vw] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="ambient-orb ambient-orb-b absolute -right-1/4 bottom-0 h-[60vh] w-[60vw] rounded-full bg-violet-600/15 blur-3xl" />
    </div>
  );
}
