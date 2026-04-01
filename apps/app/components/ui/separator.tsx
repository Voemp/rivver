import { cn } from '@/lib/utils'
import * as React from 'react'
import { View, type ViewProps } from 'react-native'

const Separator = React.forwardRef<View, ViewProps & { className?: string; orientation?: 'horizontal' | 'vertical' }>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
)

Separator.displayName = 'Separator'

export { Separator }
