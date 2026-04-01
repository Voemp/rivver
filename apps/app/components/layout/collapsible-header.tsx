import * as React from 'react'
import { type NativeScrollEvent, type NativeSyntheticEvent, View } from 'react-native'
import Animated, {
  Extrapolation, interpolate, type SharedValue, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const HEADER_EXPANDED = 100
const HEADER_COLLAPSED = 52
const SCROLL_THRESHOLD = 48

type CollapsibleHeaderProps = {
  title: string
  subtitle?: string
  rightAction?: React.ReactNode
  children: React.ReactNode
  scrollY: SharedValue<number>
}

export const CollapsibleHeader = ({
                                    title,
                                    subtitle,
                                    rightAction,
                                    scrollY,
                                  }: Omit<CollapsibleHeaderProps, 'children'>) => {
  const insets = useSafeAreaInsets()

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [HEADER_EXPANDED, HEADER_COLLAPSED],
      Extrapolation.CLAMP,
    )
    return { height }
  })

  const subtitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD * 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    )
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, -10],
      Extrapolation.CLAMP,
    )
    return { opacity, transform: [{ translateY }] }
  })

  const titleStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [24, 18],
      Extrapolation.CLAMP,
    )
    return { fontSize }
  })

  return (
    <Animated.View
      className="border-b border-border bg-background px-8"
      style={[{ paddingTop: insets.top }, headerStyle]}
    >
      <View className="flex-1 flex-row items-end justify-between pb-2">
        <View className="flex-1">
          {subtitle && (
            <Animated.Text
              className="text-[10px] uppercase text-muted-foreground"
              style={[{ letterSpacing: 3 }, subtitleStyle]}
            >
              {subtitle}
            </Animated.Text>
          )}
          <Animated.Text
            className="text-foreground"
            style={[{ fontWeight: '700' }, titleStyle]}
          >
            {title}
          </Animated.Text>
        </View>
        {rightAction && <View className="ml-3">{rightAction}</View>}
      </View>
    </Animated.View>
  )
}

export const useCollapsibleScroll = () => {
  const scrollY = useSharedValue(0)

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y
    },
    [scrollY.value],
  )

  return { scrollY, onScroll }
}

export { HEADER_EXPANDED, HEADER_COLLAPSED }
