'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with PeerJS
const Game = dynamic(() => import('@/components/Game').then((mod) => mod.Game), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🎨</div>
        <div className="text-zinc-400">Loading Graffiti Master...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <Game />;
}
