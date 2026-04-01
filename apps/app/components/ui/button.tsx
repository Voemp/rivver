import { TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  outline: 'border border-input bg-background',
  ghost: '',
  destructive: 'bg-destructive',
  secondary: 'bg-secondary',
  link: '',
}

const buttonSizes: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
  icon: 'h-10 w-10',
}

const textVariants: Record<ButtonVariant, string> = {
  default: 'text-sm text-primary-foreground',
  outline: 'text-sm text-foreground',
  ghost: 'text-sm text-foreground',
  destructive: 'text-sm text-destructive-foreground',
  secondary: 'text-sm text-secondary-foreground',
  link: 'text-sm text-primary underline',
}

type ButtonProps = PressableProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  className?: string
  textClassName?: string
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ variant = 'default', size = 'default', loading, className, children, disabled, ...props }, ref) => (
    <TextClassContext.Provider value={textVariants[variant]}>
      <Pressable
        ref={ref}
        className={cn(
          'flex-row items-center justify-center rounded-md',
          buttonVariants[variant],
          buttonSizes[size],
          (disabled || loading) && 'opacity-50',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'default' ? '#fafafa' : '#0a0a0a'} />
        ) : (
          children
        )}
      </Pressable>
    </TextClassContext.Provider>
  ),
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
