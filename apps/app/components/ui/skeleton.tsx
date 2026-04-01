import { cn } from '@/lib/utils'
import * as React from 'react'
import { Animated, type ViewProps } from 'react-native'

const Skeleton = ({ className, style, ...props }: ViewProps) => {
  const opacity = React.useRef(new Animated.Value(0.4)).current

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      className={cn('rounded-md bg-muted', className)}
      style={[{ opacity }, style]}
      {...props}
    />
  )
}

Skeleton.displayName = 'Skeleton'

export { Skeleton }
