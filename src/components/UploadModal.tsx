"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, Film, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { toast } from '@/hooks/use-toast';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const { user } = useAuth();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Entertainment');
    const [visibility, setVisibility] = useState('unlisted');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoFile || !thumbnailFile || !user) return;

        try {
            setUploading(true);
            setProgress(5);
            setStatus('Uploading thumbnail...');

            // 1. Upload thumbnail to Cloudinary
            const thumbFormData = new FormData();
            thumbFormData.append('file', thumbnailFile);
            const thumbRes = await axios.post('/api/upload-image', thumbFormData);
            const thumbnailUrl = thumbRes.data.secure_url;

            setProgress(20);
            setStatus('Authenticating with YouTube...');

            // 2. Get YouTube Token
            const tokenRes = await axios.post('/api/yt-token');
            const accessToken = tokenRes.data.access_token;

            setProgress(30);
            setStatus('Uploading video to YouTube...');

            // 3. Upload video to YouTube
            const metadata = {
                snippet: {
                    title: title || 'Relox Video',
                    description: description || 'Created with Relox',
                    categoryId: '22', // People & Blogs
                },
                status: {
                    privacyStatus: 'unlisted',
                },
            };

            const ytFormData = new FormData();
            ytFormData.append(
                'metadata',
                new Blob([JSON.stringify(metadata)], { type: 'application/json' })
            );
            ytFormData.append('video', videoFile);

            const ytRes = await axios.post(
                'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
                ytFormData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 60) / (progressEvent.total || 1)) + 30;
                        setProgress(percentCompleted);
                    }
                }
            );

            const videoId = ytRes.data.id;
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

            setProgress(95);
            setStatus('Saving to Relox...');

            // 4. Save to Appwrite
            await databases.createDocument(
                APPWRITE_CONFIG.DB_ID,
                APPWRITE_CONFIG.VIDEOS_COLLECTION,
                ID.unique(),
                {
                    title,
                    description,
                    videoUrl: youtubeUrl,
                    thumbnailUrl,
                    category,
                    visibility,
                    uploaderId: user.$id,
                    username: user.username,
                    viewsCount: 0,
                    likesCount: 0,
                    commentsCount: 0,
                    sharesCount: 0,
                    youtubeId: videoId
                }
            );

            setProgress(100);
            setStatus('Success!');
            toast({
                title: "Upload Successful",
                description: "Your video is now live on Relox!",
            });
            setTimeout(() => {
                onClose();
                resetForm();
            }, 1500);

        } catch (error: any) {
            console.error('Upload flow error:', error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.response?.data?.error || error.message || "An error occurred during upload.",
            });
        } finally {
            setUploading(false);
            setProgress(0);
            setStatus('');
        }
    };

    const resetForm = () => {
        setVideoFile(null);
        setThumbnailFile(null);
        setTitle('');
        setDescription('');
        setCategory('Entertainment');
        setVisibility('unlisted');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !uploading && !open && onClose()}>
            <DialogContent className="max-w-[430px] w-full h-[100dvh] sm:h-auto bg-black border-none text-white z-[100] p-0 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <DialogTitle className="text-xl font-bold text-primary neon-text flex items-center gap-2">
                        <Upload size={24} /> New Creation
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={uploading} className="text-white hover:bg-zinc-900">
                        <X size={24} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {uploading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
                            <div className="relative w-32 h-32">
                                <Loader2 size={128} className="text-primary animate-spin opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                                </div>
                            </div>
                            <div className="w-full space-y-2">
                                <Progress value={progress} className="h-2 bg-zinc-800" />
                                <p className="text-center text-zinc-400 font-medium animate-pulse">{status}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Video Content</Label>
                                    <label className="flex flex-col items-center justify-center w-full aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                        {videoFile ? (
                                            <div className="text-center p-2">
                                                <Film className="w-8 h-8 text-primary mx-auto mb-2" />
                                                <p className="text-[10px] truncate max-w-[120px]">{videoFile.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-2">
                                                <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                                <p className="text-[10px] text-zinc-500">Tap to Upload</p>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="video/*" 
                                            capture="environment"
                                            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                            required
                                        />
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Thumbnail</Label>
                                    <label className="flex flex-col items-center justify-center w-full aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                        {thumbnailFile ? (
                                            <div className="text-center p-2">
                                                <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                                                <p className="text-[10px] truncate max-w-[120px]">{thumbnailFile.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-2">
                                                <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                                <p className="text-[10px] text-zinc-500">Tap to Upload</p>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                            required
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Catchy Title</Label>
                                    <Input 
                                        id="title" 
                                        placeholder="What's happening?" 
                                        className="bg-zinc-900 border-zinc-800 focus:border-primary"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea 
                                        id="description" 
                                        placeholder="Add some details..." 
                                        className="bg-zinc-900 border-zinc-800 focus:border-primary min-h-[80px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="Entertainment">Entertainment</SelectItem>
                                                <SelectItem value="Devotional">Devotional</SelectItem>
                                                <SelectItem value="Gaming">Gaming</SelectItem>
                                                <SelectItem value="Educational">Educational</SelectItem>
                                                <SelectItem value="Music">Music</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Visibility</Label>
                                        <Select value={visibility} onValueChange={setVisibility}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="public">Public</SelectItem>
                                                <SelectItem value="unlisted">Unlisted</SelectItem>
                                                <SelectItem value="private">Private</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-6 rounded-xl glow-magenta transition-transform active:scale-95"
                                disabled={!videoFile || !thumbnailFile}
                            >
                                Publish Video
                            </Button>
                        </>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
