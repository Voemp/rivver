import { Text } from '@/components/ui/text'
import { Inbox } from 'lucide-react-native'
import { View } from 'react-native'

type EmptyStateProps = {
  title: string
  description?: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <View className="items-center justify-center px-6 py-16">
    <Inbox size={48} color="hsl(0, 0%, 45.1%)" strokeWidth={1.5} />
    <Text className="mt-4 text-lg text-foreground" style={{ fontWeight: '600' }}>{title}</Text>
    {description && <Text className="mt-1 text-center text-sm text-muted-foreground">{description}</Text>}
  </View>
)
