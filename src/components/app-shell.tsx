import { AppSidebar } from './app-sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 overflow-y-auto bg-background">
        {children}
      </div>
    </div>
  )
}
