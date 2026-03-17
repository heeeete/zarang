import { SocialLoginButtons } from '@/src/features/auth/ui/SocialLoginButtons'

export const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-56px-64px)] px-6">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold tracking-tight mb-2">반가워요!</h1>
        <p className="text-muted-foreground">소셜 계정으로 1초 만에 로그인하세요.</p>
      </div>
      <SocialLoginButtons />
    </div>
  )
}
