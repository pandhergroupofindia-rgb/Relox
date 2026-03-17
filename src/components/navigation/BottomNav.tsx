"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
    const pathname = usePathname();
    const { user, loginWithGoogle } = useAuth();

    const navItems = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Search, label: 'Discover', href: '/discover' },
        { icon: Plus, label: 'Upload', href: '/upload', special: true },
        { icon: MessageSquare, label: 'Inbox', href: '/inbox' },
        { icon: User, label: 'Profile', href: '/profile' },
    ];

    const handleClick = (e: React.MouseEvent, href: string) => {
        if (!user && (href === '/upload' || href === '/inbox' || href === '/profile')) {
            e.preventDefault();
            loginWithGoogle();
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] h-16 bg-black border-t border-gray-800 flex items-center justify-around px-4 sm:max-w-[430px] sm:mx-auto">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.special) {
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            onClick={(e) => handleClick(e, item.href)}
                            className="relative -top-3"
                        >
                            <div className="w-12 h-10 bg-gradient-to-r from-primary via-secondary to-primary rounded-xl flex items-center justify-center glow-magenta transition-transform active:scale-90">
                                <Plus className="w-8 h-8 text-white" strokeWidth={3} />
                            </div>
                        </Link>
                    );
                }

                return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={(e) => handleClick(e, item.href)}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
