import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { Image } from 'expo-image'
import * as React from 'react'
import { View } from 'react-native'

type AvatarProps = {
  src?: string | null
  fallback: string
  size?: number
  className?: string
}

const Avatar = ({ src, fallback, size = 40, className }: AvatarProps) => (
  <View
    className={cn('items-center justify-center overflow-hidden rounded-full bg-muted', className)}
    style={{ width: size, height: size }}
  >
    {src ? (
      <Image source={{ uri: src }} style={{ width: size, height: size }} contentFit="cover" />
    ) : (
      <Text className="text-sm text-muted-foreground" style={{ fontWeight: '600' }}>
        {(fallback || '?').slice(0, 1).toUpperCase()}
      </Text>
    )}
  </View>
)

export { Avatar }
