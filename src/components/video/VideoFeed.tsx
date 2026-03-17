"use client";

import React, { useEffect, useState, useRef } from 'react';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { Loader2, Heart, MessageCircle, Share2, Music, UserPlus, MoreVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function VideoFeed() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        async function fetchVideos() {
            setLoading(true);
            try {
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DB_ID,
                    APPWRITE_CONFIG.VIDEOS_COLLECTION,
                    [Query.limit(20), Query.orderDesc('$createdAt')]
                );
                setVideos(response?.documents || []);
            } catch (err) {
                console.error("Failed to fetch videos", err);
                setVideos([]);
            } finally {
                setLoading(false);
            }
        }
        fetchVideos();
    }, []);

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-4 text-white">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-zinc-500 font-medium">Brewing fresh content...</p>
            </div>
        );
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-black text-white">
                <Film className="w-16 h-16 text-zinc-800 mb-4" />
                <p className="text-zinc-500">The feed is quiet. Be the first to spark it!</p>
            </div>
        );
    }

    return (
        <div className="video-snap-container h-full w-full bg-black">
            {videos.map((video) => (
                <div key={video?.$id || Math.random()} className="video-snap-item">
                    <VideoPlayer video={video} currentUserId={user?.$id} />
                </div>
            ))}
        </div>
    );
}

function VideoPlayer({ video, currentUserId }: { video: any, currentUserId?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [liked, setLiked] = useState(false);
    const [viewLogged, setViewLogged] = useState(false);

    useEffect(() => {
        const options = { threshold: 0.6 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    try {
                        await videoRef.current?.play();
                        setIsPlaying(true);
                    } catch (e) {
                        // Autoplay might be blocked by browser
                    }
                    
                    // Views Logic
                    if (!viewLogged && currentUserId && video?.$id) {
                        try {
                            const existingView = await databases.listDocuments(
                                APPWRITE_CONFIG.DB_ID,
                                'views',
                                [
                                    Query.equal('userId', currentUserId),
                                    Query.equal('videoId', video.$id)
                                ]
                            );

                            if (existingView.total === 0) {
                                // Log view doc
                                await databases.createDocument(
                                    APPWRITE_CONFIG.DB_ID,
                                    'views',
                                    ID.unique(),
                                    { userId: currentUserId, videoId: video.$id }
                                );
                                // Increment video views
                                await databases.updateDocument(
                                    APPWRITE_CONFIG.DB_ID,
                                    APPWRITE_CONFIG.VIDEOS_COLLECTION,
                                    video.$id,
                                    { viewsCount: (video?.viewsCount || 0) + 1 }
                                );
                                setViewLogged(true);
                            }
                        } catch (err) {
                            console.error("View logging failed", err);
                        }
                    }
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            });
        }, options);

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, [viewLogged, currentUserId, video]);

    const handleTogglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play().catch(() => {});
            setIsPlaying(!isPlaying);
        }
    };

    const isYoutube = video?.videoUrl?.includes('youtube.com') || video?.videoUrl?.includes('youtu.be');
    const displayVideoUrl = isYoutube 
        ? "https://cdn.pixabay.com/video/2023/11/04/187766-880918076_tiny.mp4" 
        : video?.videoUrl;

    if (!displayVideoUrl) return null;

    return (
        <div className="relative h-full w-full bg-black overflow-hidden" onClick={handleTogglePlay}>
            <video 
                ref={videoRef}
                src={displayVideoUrl}
                className="h-full w-full object-cover"
                loop
                playsInline
                muted={false}
            />

            {/* Interaction Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            {/* Actions Sidebar */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-20">
                <div className="relative mb-2">
                    <Avatar className="w-12 h-12 border-2 border-white glow-magenta">
                        <AvatarImage src={`https://picsum.photos/seed/${video?.username || 'user'}/100`} />
                        <AvatarFallback className="bg-primary text-white font-bold">{video?.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border border-white">
                        <UserPlus size={14} className="text-white" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-transform active:scale-125"
                    >
                        <Heart size={38} className={cn(liked ? "fill-primary text-primary" : "text-white")} strokeWidth={2} />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{(video?.likesCount || 0) + (liked ? 1 : 0)}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="transition-transform active:scale-110">
                        <MessageCircle size={38} className="text-white" strokeWidth={2} />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{video?.commentsCount || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="transition-transform active:scale-110">
                        <Share2 size={38} className="text-white" strokeWidth={2} />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-lg">Share</span>
                </div>

                <button className="mt-2">
                    <MoreVertical size={24} className="text-white/60" />
                </button>

                <div className="mt-4 animate-spin-slow">
                     <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden">
                        <Music size={18} className="text-white" />
                     </div>
                </div>
            </div>

            {/* Content Info */}
            <div className="absolute left-4 bottom-4 right-20 z-10 pointer-events-none">
                <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">@{video?.username || 'relox_creator'}</h3>
                <p className="text-white/90 text-sm line-clamp-2 mb-3 drop-shadow-sm font-medium">
                    {video?.title || ''} {video?.description ? `- ${video.description}` : ''}
                </p>
                <div className="flex items-center gap-2 text-white/80 bg-black/30 backdrop-blur-sm w-fit px-3 py-1 rounded-full">
                    <Music size={12} className="animate-pulse" />
                    <marquee className="text-[10px] font-semibold w-32 uppercase tracking-wider">
                        Original Audio - {video?.username || 'relox'}
                    </marquee>
                </div>
            </div>
        </div>
    );
}

const Film = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 3v18" />
        <path d="M17 3v18" />
        <path d="M3 7h4" />
        <path d="M3 12h4" />
        <path d="M3 17h4" />
        <path d="M17 7h4" />
        <path d="M17 12h4" />
        <path d="M17 17h4" />
    </svg>
);
