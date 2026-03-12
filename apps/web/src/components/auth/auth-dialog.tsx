import { authClient } from '@/api/auth-client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { useAuth } from '@/hooks/use-auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const authSchema = z.object({
  name: z.string().min(2, '昵称至少 2 位').optional().or(z.literal('')),
  email: z.email('请输入正确的邮箱'),
  password: z.string().min(6, '密码至少 6 位'),
  rememberMe: z.boolean().default(false).optional(),
})

type AuthFormValues = z.infer<typeof authSchema>

export function AuthDialog() {
  const { authDialogMode, authDialogOpen, closeAuthDialog, openAuthDialog, refreshSession } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const isSignIn = authDialogMode === 'sign-in'

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: '', email: '', password: '', rememberMe: false },
  })

  useEffect(() => {
    if (!authDialogOpen) form.reset()
    form.clearErrors()
  }, [authDialogMode, authDialogOpen, form])

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AuthFormValues) => {
      const { data, error } = isSignIn
        ? await authClient.signIn.email({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
        })
        : await authClient.signUp.email({ email: values.email, password: values.password, name: values.name! })

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: async () => {
      await refreshSession()
      toast.success(isSignIn ? '欢迎回来' : '账号创建成功')
      closeAuthDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={authDialogOpen} onOpenChange={(open) => !open && closeAuthDialog()}>
      <DialogContent className="sm:max-w-100 p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {isSignIn ? '登录 Rivver' : '创建账号'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isSignIn ? '登录后可执行收藏与转发' : '注册后可同步订阅与阅读行为'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <FieldGroup>
              {!isSignIn && (
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">用户名</FieldLabel>
                      <Input {...field} placeholder="John" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">邮箱</FieldLabel>
                    <Input {...field} type="email" placeholder="name@example.com" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">密码</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id="inline-end-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="password"
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button" aria-label="ShowPassword" title="显示/隐藏密码" size="icon-xs"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {isSignIn && (
                <Controller
                  name="rememberMe"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label
                        htmlFor="rememberMe"
                        className="text-sm font-medium leading-none cursor-pointer select-none"
                      >
                        记住我
                      </Label>
                    </div>
                  )}
                />
              )}

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isPending}>
                {isPending && <Spinner data-icon="inline-start" />}
                {isSignIn
                  ? isPending ? '登录中' : '登录'
                  : isPending ? '注册中' : '注册'}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
            {isSignIn ? '还没有账号? ' : '已有账号? '}
            <Button
              variant="link"
              onClick={() => openAuthDialog(isSignIn ? 'sign-up' : 'sign-in')}
              className="pl-1"
            >
              {isSignIn ? '立即注册' : '点击登录'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}