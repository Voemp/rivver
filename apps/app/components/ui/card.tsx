import { TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { View, type ViewProps } from 'react-native'

const Card = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('rounded-xl border border-border bg-card', className)} {...props} />
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('p-4 pb-2', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('flex-row items-center p-4 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

const CardTitle = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <TextClassContext.Provider value="text-lg text-card-foreground">
      <View ref={ref} className={cn('', className)} {...props} />
    </TextClassContext.Provider>
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <TextClassContext.Provider value="text-sm text-muted-foreground">
      <View ref={ref} className={cn('', className)} {...props} />
    </TextClassContext.Provider>
  ),
)
CardDescription.displayName = 'CardDescription'

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription }
