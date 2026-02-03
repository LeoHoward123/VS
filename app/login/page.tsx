'use client'
import { createClient } from '@/utils/supabase/client'
import { Chrome } from 'lucide-react' // Using Chrome icon as Google placeholder

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-6">Teacher Portal</h1>
        <button
          onClick={handleLogin}
          className="flex items-center justify-center gap-2 w-full bg-black text-white p-3 rounded hover:bg-gray-800 transition"
        >
          <Chrome /> Sign in with Google
        </button>
      </div>
    </div>
  )
}