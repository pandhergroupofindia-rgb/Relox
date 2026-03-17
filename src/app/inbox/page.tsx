"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Loader2, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function Inbox() {
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchChats() {
            try {
                const res = await databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'chats', [
                    Query.or([
                        Query.equal('senderId', user.$id),
                        Query.equal('receiverId', user.$id)
                    ]),
                    Query.orderDesc('$createdAt'),
                    Query.limit(100)
                ]);

                // Group by other user
                const grouped = new Map();
                for (const msg of res.documents) {
                    const otherId = msg.senderId === user.$id ? msg.receiverId : msg.senderId;
                    if (!grouped.has(otherId)) {
                        grouped.set(otherId, msg);
                    }
                }
                
                const chatList = Array.from(grouped.values());
                
                // Fetch user details for each unique user
                const chatDetails = await Promise.all(chatList.map(async (msg) => {
                    const otherId = msg.senderId === user.$id ? msg.receiverId : msg.senderId;
                    try {
                        const otherUser = await databases.getDocument(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.USERS_COLLECTION, otherId);
                        return { ...msg, otherUser, otherId };
                    } catch {
                        if (otherId === 'relox_bot') {
                            return { ...msg, otherUser: { username: 'Relox Bot', profileData: '{"isBot":true}' }, otherId };
                        }
                        return { ...msg, otherUser: null, otherId };
                    }
                }));

                setChats(chatDetails.filter(c => c.otherUser));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchChats();
    }, [user]);

    if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="h-full bg-black text-white flex flex-col">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                <h1 className="text-xl font-bold">Messages</h1>
                <MessageSquare className="text-primary" />
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input className="bg-zinc-900 border-none pl-10 h-10 rounded-full" placeholder="Search friends..." />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-4">
                         <Avatar className="w-16 h-16 border border-primary/30">
                            <AvatarFallback className="bg-primary/20 text-primary">R</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="font-bold">Relox Official ✅</h3>
                            <p className="text-xs text-zinc-500">Welcome to the future of short video creation! Start a chat with someone to see it here.</p>
                        </div>
                        <Link href="/">
                            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Explore Feed</Button>
                        </Link>
                    </div>
                ) : (
                    chats.map(chat => (
                        <Link key={chat.$id} href={`/chat/${chat.otherId}`} className="flex items-center gap-4 p-4 hover:bg-zinc-900 transition-colors">
                            <Avatar className="w-14 h-14 border border-zinc-800">
                                <AvatarImage src={chat.otherUser.profileData ? JSON.parse(chat.otherUser.profileData).photoUrl : `https://picsum.photos/seed/${chat.otherId}/100`} />
                                <AvatarFallback className="bg-zinc-800">{chat.otherUser.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 border-b border-zinc-900/50 pb-4 h-full flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold truncate">{chat.otherUser.username}</h3>
                                    <span className="text-[10px] text-zinc-600">{new Date(chat.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-xs text-zinc-400 truncate pr-10">{chat.senderId === user?.$id ? 'You: ' : ''}{chat.message}</p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
