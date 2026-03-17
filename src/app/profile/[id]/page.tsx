"use client";

import React, { useEffect, useState, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Grid3X3, MessageCircle, UserPlus, UserCheck, Loader2, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OtherUserProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id: profileId } = use(params);
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [targetUser, setTargetUser] = useState<any>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [counts, setCounts] = useState({ followers: 0, following: 0, videos: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (currentUser?.$id === profileId) {
            router.replace('/profile');
            return;
        }

        async function fetchData() {
            try {
                const userDoc = await databases.getDocument(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.USERS_COLLECTION, profileId);
                const profileData = userDoc.profileData ? JSON.parse(userDoc.profileData) : {};
                setTargetUser({ ...userDoc, profileData });

                const [vids, followers, following, followCheck] = await Promise.all([
                    databases.listDocuments(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.VIDEOS_COLLECTION, [Query.equal('uploaderId', profileId)]),
                    databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'followers', [Query.equal('followingId', profileId)]),
                    databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'followers', [Query.equal('followerId', profileId)]),
                    currentUser ? databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'followers', [
                        Query.equal('followerId', currentUser.$id),
                        Query.equal('followingId', profileId)
                    ]) : { total: 0 }
                ]);

                setVideos(vids.documents);
                setCounts({ videos: vids.total, followers: followers.total, following: following.total });
                setIsFollowing(followCheck.total > 0);
            } catch (err) {
                console.error("Fetch profile failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [profileId, currentUser, router]);

    const handleFollow = async () => {
        if (!currentUser) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                const existing = await databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'followers', [
                    Query.equal('followerId', currentUser.$id),
                    Query.equal('followingId', profileId)
                ]);
                if (existing.total > 0) {
                    await databases.deleteDocument(APPWRITE_CONFIG.DB_ID, 'followers', existing.documents[0].$id);
                    setIsFollowing(false);
                    setCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
                }
            } else {
                await databases.createDocument(APPWRITE_CONFIG.DB_ID, 'followers', ID.unique(), {
                    followerId: currentUser.$id,
                    followingId: profileId
                });
                setIsFollowing(true);
                setCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
        } catch (err) {
            console.error("Follow logic failed", err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;
    if (!targetUser) return <div className="h-full flex items-center justify-center bg-black text-white">Creator not found.</div>;

    return (
        <div className="h-full bg-black text-white overflow-y-auto pb-20">
            {/* Nav */}
            <div className="p-4 flex items-center gap-4 border-b border-zinc-900 sticky top-0 bg-black z-10">
                <button onClick={() => router.back()}><ArrowLeft /></button>
                <h2 className="font-bold">@{targetUser.username}</h2>
            </div>

            {/* Profile Info */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
                <Avatar className="w-24 h-24 border-2 border-zinc-800">
                    <AvatarImage src={targetUser.profileData?.photoUrl || `https://picsum.photos/seed/${targetUser.$id}/200`} />
                    <AvatarFallback className="bg-zinc-800">{targetUser.username?.[0]}</AvatarFallback>
                </Avatar>
                
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">@{targetUser.username}</h2>
                    <p className="text-zinc-400 text-sm">{targetUser.bio || 'Vibing on Relox'}</p>
                </div>

                <div className="flex gap-8 py-2">
                    <div className="text-center"><p className="font-bold">{counts.following}</p><p className="text-zinc-500 text-xs">Following</p></div>
                    <div className="text-center"><p className="font-bold">{counts.followers}</p><p className="text-zinc-500 text-xs">Followers</p></div>
                    <div className="text-center"><p className="font-bold">{counts.videos}</p><p className="text-zinc-500 text-xs">Vibes</p></div>
                </div>

                <div className="flex gap-2 w-full max-w-sm">
                    <Button 
                        onClick={handleFollow} 
                        disabled={followLoading}
                        className={isFollowing ? "flex-1 bg-zinc-900 hover:bg-zinc-800 border-zinc-800" : "flex-1 bg-primary hover:bg-primary/80 glow-magenta"}
                    >
                        {followLoading ? <Loader2 className="animate-spin" /> : (isFollowing ? <><UserCheck className="mr-2" size={18} /> Following</> : <><UserPlus className="mr-2" size={18} /> Follow</>)}
                    </Button>
                    <Link href={`/chat/${targetUser.$id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-zinc-800 bg-zinc-900">
                            <MessageCircle className="mr-2" size={18} /> Message
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Grid */}
            <div className="border-t border-zinc-900 mt-4">
                <div className="flex justify-center p-3 border-b border-zinc-900"><Grid3X3 className="text-primary" size={24} /></div>
                <div className="grid grid-cols-3 gap-[1px]">
                    {videos.map((vid) => (
                        <div key={vid.$id} className="aspect-[3/4] bg-zinc-900 relative">
                            <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] font-bold">
                                <Heart size={10} className="fill-white" /> {vid.likesCount || 0}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
