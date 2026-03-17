"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { account, databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReloxUser {
    $id: string;
    username: string;
    bio: string;
    email: string;
    profileData?: any;
}

interface AuthContextType {
    user: ReloxUser | null;
    loading: boolean;
    loginWithGoogle: () => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<ReloxUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [tempAuthUser, setTempAuthUser] = useState<Models.User<any> | null>(null);

    const refreshUser = useCallback(async () => {
        try {
            const authUser = await account.get();
            setTempAuthUser(authUser);
            
            try {
                const doc = await databases.getDocument(
                    APPWRITE_CONFIG.DB_ID,
                    APPWRITE_CONFIG.USERS_COLLECTION,
                    authUser.$id
                );
                
                let profileData = {};
                try {
                    profileData = doc?.profileData ? JSON.parse(doc.profileData) : {};
                } catch (e) {
                    console.error("Failed to parse profileData", e);
                }
                
                setUser({
                    $id: doc.$id,
                    username: doc.username || 'relox_user',
                    bio: doc.bio || '',
                    email: authUser.email || '',
                    profileData,
                });
                setShowOnboarding(false);
            } catch (err: any) {
                // User document not found, need onboarding
                if (err?.code === 404) {
                    setShowOnboarding(true);
                    setUser(null);
                } else {
                    console.error("Failed to fetch user document", err);
                    setUser(null);
                }
            }
        } catch (err) {
            setUser(null);
            setTempAuthUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const loginWithGoogle = () => {
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            account.createOAuth2Session(
                'google',
                `${origin}/`,
                `${origin}/login-failure`
            );
        } catch (e) {
            console.error("Google login initiation failed", e);
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            setTempAuthUser(null);
        } catch (e) {
            console.error("Logout failed", e);
            setUser(null); // Force clear state anyway
        }
    };

    const handleOnboarding = async (username: string, bio: string) => {
        if (!tempAuthUser) return;
        
        try {
            const profileData = JSON.stringify({ joinedAt: new Date().toISOString() });
            await databases.createDocument(
                APPWRITE_CONFIG.DB_ID,
                APPWRITE_CONFIG.USERS_COLLECTION,
                tempAuthUser.$id,
                {
                    username,
                    bio,
                    profileData
                }
            );
            await refreshUser();
        } catch (err) {
            console.error("Onboarding failed", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
            {children}
            <OnboardingModal 
                isOpen={showOnboarding} 
                onSubmit={handleOnboarding} 
                email={tempAuthUser?.email || ''} 
            />
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

function OnboardingModal({ isOpen, onSubmit, email }: { isOpen: boolean, onSubmit: (u: string, b: string) => void, email: string }) {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(username, bio);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[425px] bg-black border-primary/50 text-white z-[999]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline text-primary neon-text">Welcome to Relox</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Choose a Username</Label>
                        <Input 
                            id="username" 
                            placeholder="@creative_soul" 
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">About You</Label>
                        <Textarea 
                            id="bio" 
                            placeholder="Tell the world your story..." 
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary min-h-[100px]"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            required
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-6 glow-magenta"
                    >
                        {submitting ? 'Creating Profile...' : 'Start Creating'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
