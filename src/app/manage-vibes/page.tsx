"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Loader2, ArrowLeft, BarChart2, MessageCircle, Heart, Share2, DollarSign, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

export default function ManageVibes() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchMyVideos() {
            try {
                const res = await databases.listDocuments(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.VIDEOS_COLLECTION, [
                    Query.equal('uploaderId', user.$id),
                    Query.orderDesc('$createdAt')
                ]);
                setVideos(res.documents);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchMyVideos();
    }, [user]);

    const handleDelete = async (vidId: string) => {
        if (!confirm("Are you sure? This vibe will be gone forever!")) return;
        try {
            await databases.deleteDocument(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.VIDEOS_COLLECTION, vidId);
            setVideos(videos.filter(v => v.$id !== vidId));
            toast({ title: "Vibe Deleted", description: "Successfully removed from the universe." });
        } catch (err) {
            toast({ variant: "destructive", title: "Deletion Failed" });
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="h-full bg-black text-white overflow-y-auto pb-20">
            <div className="p-4 flex items-center gap-4 border-b border-zinc-900 sticky top-0 bg-black z-10">
                <Link href="/profile"><ArrowLeft /></Link>
                <h1 className="text-xl font-bold">Relox Studio</h1>
            </div>

            <div className="p-4 space-y-4">
                {videos.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <BarChart2 className="mx-auto mb-4 w-12 h-12 opacity-20" />
                        <p>No vibes found. Start creating!</p>
                    </div>
                ) : (
                    videos.map(vid => (
                        <div key={vid.$id} className="flex gap-4 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                            <div className="w-24 h-32 rounded-lg bg-zinc-800 overflow-hidden shrink-0 relative">
                                <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                {user?.profileData?.isMonetized && (
                                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                                        <DollarSign size={12} className="text-black font-bold" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold truncate text-sm">{vid.title}</h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical size={16}/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer"><Edit2 className="mr-2" size={14}/> Edit Vibe</DropdownMenuItem>
                                                <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer"><Share2 className="mr-2" size={14}/> Share Link</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(vid.$id)} className="focus:bg-red-950 text-red-500 cursor-pointer"><Trash2 className="mr-2" size={14}/> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter mt-1">{vid.category} • {vid.visibility}</p>
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-zinc-400 mt-2">
                                    <div className="flex items-center gap-1 text-[10px]"><BarChart2 size={12}/> {vid.viewsCount || 0}</div>
                                    <div className="flex items-center gap-1 text-[10px]"><Heart size={12}/> {vid.likesCount || 0}</div>
                                    <div className="flex items-center gap-1 text-[10px]"><MessageCircle size={12}/> {vid.commentsCount || 0}</div>
                                    <div className="flex items-center gap-1 text-[10px]"><Share2 size={12}/> {vid.sharesCount || 0}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
