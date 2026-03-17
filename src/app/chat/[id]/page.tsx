"use client";

import React, { useEffect, useState, useRef, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Info, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ChatScreen({ params }: { params: Promise<{ id: string }> }) {
    const { id: otherUserId } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [selectedMsg, setSelectedMsg] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        async function init() {
            try {
                if (otherUserId === 'relox_bot') {
                    setOtherUser({ username: 'Relox Bot', profileData: '{"isBot":true}' });
                } else {
                    const doc = await databases.getDocument(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.USERS_COLLECTION, otherUserId);
                    setOtherUser(doc);
                }

                const res = await databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'chats', [
                    Query.or([
                        Query.and([Query.equal('senderId', user.$id), Query.equal('receiverId', otherUserId)]),
                        Query.and([Query.equal('senderId', otherUserId), Query.equal('receiverId', user.$id)])
                    ]),
                    Query.orderAsc('$createdAt'),
                    Query.limit(100)
                ]);
                setMessages(res.documents);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [user, otherUserId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user) return;

        const msgContent = inputText;
        setInputText('');

        try {
            const newDoc = await databases.createDocument(APPWRITE_CONFIG.DB_ID, 'chats', ID.unique(), {
                senderId: user.$id,
                receiverId: otherUserId,
                message: msgContent
            });
            setMessages(prev => [...prev, newDoc]);

            if (otherUserId === 'relox_bot') {
                setTimeout(async () => {
                    const reply = await databases.createDocument(APPWRITE_CONFIG.DB_ID, 'chats', ID.unique(), {
                        senderId: 'relox_bot',
                        receiverId: user.$id,
                        message: "Beep boop! 🤖 Relox Bot here. I've logged your vibe. Stay creative!"
                    });
                    setMessages(prev => [...prev, reply]);
                }, 1000);
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Message failed to send" });
        }
    };

    const handleDelete = async () => {
        if (!selectedMsg) return;
        try {
            await databases.deleteDocument(APPWRITE_CONFIG.DB_ID, 'chats', selectedMsg.$id);
            setMessages(prev => prev.filter(m => m.$id !== selectedMsg.$id));
            setSelectedMsg(null);
            toast({ title: "Message deleted" });
        } catch (err) {
            toast({ variant: "destructive", title: "Could not delete" });
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white relative">
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-black z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()}><ArrowLeft size={24}/></button>
                    <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={otherUser?.profileData ? JSON.parse(otherUser.profileData).photoUrl : `https://picsum.photos/seed/${otherUserId}/100`} />
                            <AvatarFallback className="bg-zinc-800">{otherUser?.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold text-sm">@{otherUser?.username}</h2>
                            <p className="text-[10px] text-green-500 font-bold">Online</p>
                        </div>
                    </div>
                </div>
                <button className="text-zinc-500"><Info size={20}/></button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {messages.length === 0 && (
                    <div className="text-center text-zinc-600 text-xs py-10">Say hi to start the conversation! 👋</div>
                )}
                {messages.map((msg) => (
                    <div 
                        key={msg.$id} 
                        onContextMenu={(e) => { e.preventDefault(); if (msg.senderId === user?.$id) setSelectedMsg(msg); }}
                        onClick={() => { if (msg.senderId === user?.$id) setSelectedMsg(msg); }}
                        className={cn("flex flex-col max-w-[80%]", msg.senderId === user?.$id ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                        <div className={cn(
                            "px-4 py-2 rounded-2xl text-sm",
                            msg.senderId === user?.$id ? "bg-primary text-white rounded-br-none" : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                        )}>
                            {msg.message}
                        </div>
                        <span className="text-[8px] text-zinc-600 mt-1 uppercase tracking-tighter">
                            {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-900 bg-black sticky bottom-0 z-20 flex gap-2">
                <Input 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a vibe message..." 
                    className="bg-zinc-900 border-none rounded-full"
                />
                <Button type="submit" size="icon" className="rounded-full bg-primary shrink-0 glow-magenta">
                    <Send size={18} />
                </Button>
            </form>

            {/* Delete Modal */}
            <Dialog open={!!selectedMsg} onOpenChange={() => setSelectedMsg(null)}>
                <DialogContent className="bg-black border-zinc-800 text-white max-w-[300px]">
                    <DialogHeader><DialogTitle>Message Options</DialogTitle></DialogHeader>
                    <Button variant="destructive" onClick={handleDelete} className="w-full flex items-center justify-center gap-2">
                        <Trash2 size={16}/> Delete for Everyone
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
