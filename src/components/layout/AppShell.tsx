"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 flex items-center space-x-2">
                        <LayoutDashboard className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            Team Workload Manager
                        </span>
                    </div>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            {/* Add search or other header items here if needed */}
                        </div>
                        <ModeToggle />
                    </div>
                </div>
            </header>
            <main className="container py-6">
                {children}
            </main>
        </div>
    );
}
