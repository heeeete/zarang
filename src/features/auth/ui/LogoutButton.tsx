'use client'

import { createClient } from '@/src/shared/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/shared/ui/button'
import { LogOut } from 'lucide-react'

export const LogoutButton = () => {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
      <LogOut className="mr-2 h-4 w-4" />
      로그아웃
    </Button>
  )
}
