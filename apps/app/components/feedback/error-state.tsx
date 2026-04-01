import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { AlertTriangle } from 'lucide-react-native'
import { View } from 'react-native'

type ErrorStateProps = {
  message?: string
  onRetry?: () => void
}

export const ErrorState = ({ message = '加载失败，请稍后重试', onRetry }: ErrorStateProps) => (
  <View className="items-center justify-center px-6 py-16">
    <AlertTriangle size={48} color="hsl(0, 84.2%, 60.2%)" strokeWidth={1.5} />
    <Text className="mt-4 text-lg text-foreground" style={{ fontWeight: '600' }}>出错了</Text>
    <Text className="mt-1 text-center text-sm text-muted-foreground">{message}</Text>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-4" onPress={onRetry}>
        <Text>重试</Text>
      </Button>
    )}
  </View>
)
