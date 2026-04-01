import { cn } from '@/lib/utils'
import * as React from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'

const TextClassContext = React.createContext<string | undefined>(undefined)

type TextProps = RNTextProps & { className?: string }

const Text = React.forwardRef<RNText, TextProps>(({ className, ...props }, ref) => {
  const textClass = React.useContext(TextClassContext)
  return (
    <RNText
      ref={ref}
      className={cn('text-base text-foreground', textClass, className)}
      {...props}
    />
  )
})

Text.displayName = 'Text'

export { Text, TextClassContext }
