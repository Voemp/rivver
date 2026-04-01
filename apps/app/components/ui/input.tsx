import { cn } from '@/lib/utils'
import * as React from 'react'
import { TextInput, type TextInputProps } from 'react-native'

const Input = React.forwardRef<TextInput, TextInputProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <TextInput
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
        className,
      )}
      placeholderTextColor="hsl(0, 0%, 45.1%)"
      {...props}
    />
  ),
)

Input.displayName = 'Input'

export { Input }
