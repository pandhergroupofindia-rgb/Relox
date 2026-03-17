"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Music, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VideoCardProps {
    video: {
        $id: string;
        title: string;
        description: string;
        videoUrl: string;
        username: string;
        likes: number;
        comments: number;
    }
}

export function VideoCard({ video }: VideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => {});
                    setIsPlaying(true);
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            });
        }, options);

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative h-full w-full bg-black group" onClick={togglePlay}>
            <video 
                ref={videoRef}
                src={video.videoUrl}
                className="h-full w-full object-cover"
                loop
                playsInline
                muted={false}
            />

            {/* Interaction Layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

            {/* Right Side Actions */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-20">
                <div className="flex flex-col items-center gap-1">
                    <div className="relative mb-2">
                        <Avatar className="w-12 h-12 border-2 border-white">
                            <AvatarImage src={`https://picsum.photos/seed/${video.username}/100`} />
                            <AvatarFallback>{video.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 pointer-events-auto">
                            <UserPlus size={14} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="p-1"
                    >
                        <Heart 
                            size={38} 
                            className={cn(liked ? "fill-primary text-primary" : "text-white")} 
                            strokeWidth={2}
                        />
                    </button>
                    <span className="text-white text-xs font-semibold">{video.likes + (liked ? 1 : 0)}</span>
                </div>

                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button className="p-1">
                        <MessageCircle size={38} className="text-white" strokeWidth={2} />
                    </button>
                    <span className="text-white text-xs font-semibold">{video.comments}</span>
                </div>

                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button className="p-1">
                        <Share2 size={38} className="text-white" strokeWidth={2} />
                    </button>
                    <span className="text-white text-xs font-semibold">Share</span>
                </div>

                <div className="mt-4 animate-spin-slow">
                     <div className="w-10 h-10 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center">
                        <Music size={20} className="text-white" />
                     </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 bottom-4 right-20 z-10 pointer-events-none">
                <h3 className="text-white font-bold text-lg mb-1">@{video.username}</h3>
                <p className="text-white text-sm line-clamp-2 mb-3">{video.description}</p>
                <div className="flex items-center gap-2 text-white/90">
                    <Music size={14} />
                    <marquee className="text-xs font-medium w-40">Original Sound - {video.username}</marquee>
                </div>
            </div>
        </div>
    );
}
