"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { Loader2, ArrowLeft, TrendingUp, DollarSign, Wallet, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function Monetization() {
    const { user, refreshUser } = useAuth();
    const [status, setStatus] = useState<any>(null);
    const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0, estimatedEarnings: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', bankAcc: '', ifsc: '', upiId: ''
    });

    useEffect(() => {
        if (!user) return;
        async function checkMonetization() {
            try {
                const res = await databases.listDocuments(APPWRITE_CONFIG.DB_ID, 'monetization', [
                    Query.equal('userId', user.$id)
                ]);
                
                if (res.total > 0) {
                    setStatus(res.documents[0]);
                    
                    if (res.documents[0].status === 'approved') {
                        // Calc stats
                        const vids = await databases.listDocuments(APPWRITE_CONFIG.DB_ID, APPWRITE_CONFIG.VIDEOS_COLLECTION, [
                            Query.equal('uploaderId', user.$id)
                        ]);
                        const views = vids.documents.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
                        const likes = vids.documents.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);
                        setStats({
                            totalViews: views,
                            totalLikes: likes,
                            estimatedEarnings: (views * 0.05) // $0.05 per view fake logic
                        });
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        checkMonetization();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await databases.createDocument(APPWRITE_CONFIG.DB_ID, 'monetization', ID.unique(), {
                userId: user.$id,
                status: 'pending',
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                bankAccount: formData.bankAcc,
                ifsc: formData.ifsc,
                upiId: formData.upiId
            });
            setStatus({ status: 'pending' });
            toast({ title: "Application Submitted", description: "HQ is reviewing your creative empire." });
        } catch (err) {
            toast({ variant: "destructive", title: "Submission failed" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="h-full bg-black text-white overflow-y-auto pb-20">
            <div className="p-4 flex items-center gap-4 border-b border-zinc-900 sticky top-0 bg-black z-10">
                <Link href="/profile"><ArrowLeft /></Link>
                <h1 className="text-xl font-bold">Monetization HQ</h1>
            </div>

            <div className="p-6">
                {!status ? (
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                                <TrendingUp className="text-primary w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold">Apply for the Creator Fund</h2>
                            <p className="text-zinc-500 text-sm">Turn your vibes into value. Approved creators earn based on views, engagement, and reach.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                                <h3 className="font-bold flex items-center gap-2"><CheckCircle2 size={18} className="text-primary"/> Personal Details</h3>
                                <div className="space-y-2">
                                    <Label>Legal Name</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black border-zinc-800" placeholder="As per bank records" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-black border-zinc-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-black border-zinc-800" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                                <h3 className="font-bold flex items-center gap-2"><Building2 size={18} className="text-primary"/> Payout Settings</h3>
                                <div className="space-y-2">
                                    <Label>Bank Account Number</Label>
                                    <Input required value={formData.bankAcc} onChange={e => setFormData({...formData, bankAcc: e.target.value})} className="bg-black border-zinc-800" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>IFSC Code</Label>
                                        <Input required value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} className="bg-black border-zinc-800 uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>UPI ID (Optional)</Label>
                                        <Input value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})} className="bg-black border-zinc-800" placeholder="vibe@upi" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={submitting} className="w-full bg-primary h-14 text-lg font-bold glow-magenta">
                                {submitting ? <Loader2 className="animate-spin" /> : "Submit Application"}
                            </Button>
                        </form>
                    </div>
                ) : status.status === 'pending' ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircle className="text-yellow-500 w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Under Review by HQ ⏳</h2>
                            <p className="text-zinc-500 text-sm max-w-[300px] mx-auto">We're auditing your engagement quality. This usually takes 2-3 business days.</p>
                        </div>
                        <Link href="/profile" className="w-full"><Button variant="outline" className="w-full border-zinc-800">Back to Profile</Button></Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-3xl glow-magenta">
                            <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Total Balance</p>
                            <h2 className="text-4xl font-bold flex items-center gap-2">
                                <DollarSign size={32}/> {stats.estimatedEarnings.toLocaleString()}
                            </h2>
                            <div className="flex justify-between items-end mt-8">
                                <div className="space-y-1">
                                    <p className="text-xs text-white/60">Payout Date</p>
                                    <p className="font-bold text-sm">Every 1st of Month</p>
                                </div>
                                <Button className="bg-white text-black hover:bg-zinc-100 font-bold rounded-full">Withdraw</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                <BarChart2 className="text-primary mb-2" />
                                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Total Views</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                <Heart className="text-red-500 mb-2" />
                                <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Total Likes</p>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                <Wallet className="text-green-500" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Vibe Fund Status</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Auto-deposits enabled for {status.bankAccount.slice(-4)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const BarChart2 = ({ className, size = 24 }: { className?: string, size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);
