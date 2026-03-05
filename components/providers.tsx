"use client"

import React from "react"

import { RoleProvider } from "@/contexts/role-context"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden md:block fixed inset-y-0 left-0 z-50 w-64">
          <Sidebar />
        </aside>
        <div className="flex-1 flex flex-col md:pl-64">
          <MobileNav />
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  )
}
