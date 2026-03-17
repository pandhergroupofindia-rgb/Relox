"use client";

import { VideoFeed } from '@/components/video/VideoFeed';

export default function Home() {
  return (
    <div className="h-full w-full relative">
        {/* Immersive Feed Area */}
        <VideoFeed />
    </div>
  );
}
