import { authClient } from '@/api/auth-client.ts'
import { putAvatar } from '@/api/queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { env } from '@/config/env.ts'
import { AUTH_SESSION_QUERY_KEY, useAuth } from '@/hooks/use-auth.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [usernameInput, setUsernameInput] = useState('')
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const { session } = useAuth()
  const user = session?.user
  const queryClient = useQueryClient()

  const usernameMutation = useMutation({
    mutationFn: (name: string) => authClient.updateUser({ name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      toast.success('昵称已更新')
    },
    onError: (error: Error) => toast.error(error.message || '昵称更新失败'),
  })

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const profile = await putAvatar(file)
      await authClient.updateUser({ image: `${env.apiBaseUrl}${profile.avatarUrl}` })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      toast.success('头像已更新')
      setAvatarDialogOpen(false)
      resetAvatarEditor()
    },
    onError: (error: Error) => toast.error(error.message || '头像更新失败'),
  })

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }

    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [avatarFile])

  const resetAvatarEditor = () => {
    setAvatarFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleAvatarDialogChange = (nextOpen: boolean) => {
    setAvatarDialogOpen(nextOpen)
    if (!nextOpen) {
      resetAvatarEditor()
    }
  }

  const displayName = user?.name || '未设置用户名'
  const email = user?.email || '暂无邮箱'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>设置中心</DialogTitle>
          <DialogDescription>管理你的个人资料。</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card/70 p-4">
            <button
              type="button"
              className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 cursor-pointer"
              aria-label="更换头像"
              onClick={() => setAvatarDialogOpen(true)}
            >
              <Avatar className="size-16 ring-1 ring-border/70">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'avatar'} />
                <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className="pointer-events-none absolute inset-0 rounded-full bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Pencil className="size-4" />
              </span>
            </button>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">用户名</h3>
              <p className="text-xs text-muted-foreground">用于展示在个人资料中。</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Input
                  id="username"
                  placeholder={displayName}
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  const value = usernameInput.trim()
                  if (!value) {
                    toast.error('用户名不能为空')
                    return
                  }
                  void usernameMutation.mutateAsync(value)
                }}
                disabled={usernameMutation.isPending}
              >
                {usernameMutation.isPending ? '保存中...' : '保存用户名'}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>

      <Dialog open={avatarDialogOpen} onOpenChange={handleAvatarDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>更换头像</DialogTitle>
            <DialogDescription>上传后可进行 1:1 裁剪。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="text-xs text-muted-foreground">选择图片</Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setAvatarFile(file)
                }}
              />
            </div>

            {avatarPreview ? (
              <div className="grid gap-3 rounded-lg border border-border/60 bg-background p-3">
                <div className="relative h-60 w-full overflow-hidden rounded-md bg-muted">
                  <Cropper
                    image={avatarPreview}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => avatarFile && void avatarMutation.mutateAsync(avatarFile)}
                    disabled={!avatarFile || avatarMutation.isPending}
                  >
                    {avatarMutation.isPending ? '上传中...' : '上传头像'}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
                请选择要上传的图片
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

