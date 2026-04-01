import { ActivityIndicator, View } from 'react-native'

const Spinner = ({ size = 'small', color = '#0a0a0a' }: { size?: 'small' | 'large'; color?: string }) => (
  <View className="items-center justify-center py-8">
    <ActivityIndicator size={size} color={color} />
  </View>
)

export { Spinner }
