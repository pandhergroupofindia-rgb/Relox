"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Grid3X3, Settings, LogOut, DollarSign, Loader2, Edit3, Heart } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

export default function CurrentUserProfile() {
    const { user, logout, refreshUser } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [counts, setCounts] = useState({ followers: 0, following: 0, videos: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editPhoto, setEditPhoto] = useState<File | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!user) return;
        setEditName(user.username || '');
        setEditBio(user.bio || '');

        async function fetchProfileData() {
            try {
                const [vids, followers, following] = await Promise.all([
                    databases.listDocuments(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.VIDEOS_COLLECTION, [Query.equal('uploaderId', user.$id)]),
                    databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'followers', [Query.equal('followingId', user.$id)]),
                    databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'followers', [Query.equal('followerId', user.$id)])
                ]);

                setVideos(vids.documents);
                setCounts({
                    videos: vids.total,
                    followers: followers.total,
                    following: following.total
                });
            } catch (err) {
                console.error("Profile fetch error", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfileData();
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            setUpdating(true);
            let photoUrl = user.profileData?.photoUrl;

            if (editPhoto) {
                const formData = new FormData();
                formData.append('file', editPhoto);
                const res = await axios.post('/api/upload-image', formData);
                photoUrl = res.data.secure_url;
            }

            const newProfileData = JSON.stringify({
                ...user.profileData,
                photoUrl,
                updatedAt: new Date().toISOString()
            });

            await databases.updateDocument(
                APPWRITE_CONFIG.DB_ID,
                APPWRITE_CONFIG.USERS_COLLECTION,
                user.$id,
                {
                    username: editName,
                    bio: editBio,
                    profileData: newProfileData
                }
            );

            await refreshUser();
            setIsEditModalOpen(false);
            toast({ title: "Profile Updated", description: "Your vibe has been refreshed!" });
        } catch (err) {
            toast({ variant: "destructive", title: "Update Failed", description: "Check your connection and try again." });
        } finally {
            setUpdating(false);
        }
    };

    if (!user) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="h-full bg-black text-white overflow-y-auto pb-20">
            {/* Header */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-primary glow-magenta">
                        <AvatarImage src={user.profileData?.photoUrl || `https://picsum.photos/seed/${user.$id}/200`} />
                        <AvatarFallback className="bg-zinc-800 text-2xl">{user.username?.[0]}</AvatarFallback>
                    </Avatar>
                </div>
                
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">@{user.username}</h2>
                    <p className="text-zinc-400 text-sm max-w-[280px] line-clamp-2">{user.bio || 'Creating waves on Relox'}</p>
                </div>

                <div className="flex gap-8 py-2">
                    <div className="text-center">
                        <p className="font-bold text-lg">{counts.following}</p>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest">Following</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg">{counts.followers}</p>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg">{counts.videos}</p>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest">Vibes</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full">
                    <Button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800">
                        Edit Profile
                    </Button>
                    <Link href="/manage-vibes" className="flex-1">
                        <Button className="w-full bg-primary hover:bg-primary/80 glow-magenta">
                            Manage Vibes
                        </Button>
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} className="border-zinc-800">
                        <Settings size={20} />
                    </Button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="border-t border-zinc-900 mt-4">
                <div className="flex justify-center p-3 border-b border-zinc-900">
                    <Grid3X3 className="text-primary" size={24} />
                </div>
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-700" /></div>
                ) : (
                    <div className="grid grid-cols-3 gap-[1px]">
                        {videos.map((vid) => (
                            <div key={vid.$id} className="aspect-[3/4] bg-zinc-900 relative group overflow-hidden">
                                <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] font-bold">
                                    <Heart size={10} className="fill-white" />
                                    {vid.likesCount || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-black border-zinc-800 text-white max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Update Your Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bio</Label>
                            <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="bg-zinc-900 border-zinc-800 min-h-[100px]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Profile Photo</Label>
                            <Input type="file" accept="image/*" onChange={e => setEditPhoto(e.target.files?.[0] || null)} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <Button type="submit" disabled={updating} className="w-full bg-primary glow-magenta">
                            {updating ? <Loader2 className="animate-spin mr-2" /> : <Edit3 size={18} className="mr-2" />}
                            Save Changes
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Settings Modal */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="bg-black border-zinc-800 text-white p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b border-zinc-900">
                        <DialogTitle>Settings & Privacy</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col">
                        <Link href="/monetization" className="p-4 hover:bg-zinc-900 flex items-center gap-3">
                            <DollarSign className="text-green-500" /> Monetization Dashboard
                        </Link>
                        <button className="p-4 hover:bg-zinc-900 flex items-center gap-3 text-left">
                            <span className="w-6 text-center">🛡️</span> Privacy Policy
                        </button>
                        <button className="p-4 hover:bg-zinc-900 flex items-center gap-3 text-left border-b border-zinc-900">
                            <span className="w-6 text-center">📄</span> Terms of Service
                        </button>
                        <button onClick={logout} className="p-4 hover:bg-red-950/20 flex items-center gap-3 text-red-500 font-bold">
                            <LogOut /> Log Out
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
