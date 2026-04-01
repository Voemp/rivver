import { authClient } from '@/api/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'

export const AuthModal = () => {
  const { authModalVisible, authModalMode, closeAuthModal, openAuthModal, refreshSession } = useAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const isSignUp = authModalMode === 'sign-up'

  const reset = () => {
    setEmail('')
    setPassword('')
    setName('')
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    closeAuthModal()
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('提示', '请填写邮箱和密码')
      return
    }
    if (isSignUp && !name.trim()) {
      Alert.alert('提示', '请填写用户名')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({ email: email.trim(), password, name: name.trim() })
        if (res.error) throw new Error(res.error.message || '注册失败')
      } else {
        const res = await authClient.signIn.email({ email: email.trim(), password })
        if (res.error) throw new Error(res.error.message || '登录失败')
      }
      await refreshSession()
      queryClient.clear()
      handleClose()
    } catch (err: any) {
      Alert.alert('错误', err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={authModalVisible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
        <View className="rounded-t-3xl bg-background px-6 pb-10 pt-4">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl text-foreground" style={{ fontWeight: '700' }}>
              {isSignUp ? '创建账号' : '登录'}
            </Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={22} color="hsl(0, 0%, 45.1%)" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {isSignUp && (
              <View className="mb-3">
                <Text className="mb-1.5 text-sm text-foreground" style={{ fontWeight: '500' }}>用户名</Text>
                <Input placeholder="输入用户名" value={name} onChangeText={setName} autoCapitalize="none" />
              </View>
            )}

            <View className="mb-3">
              <Text className="mb-1.5 text-sm text-foreground" style={{ fontWeight: '500' }}>邮箱</Text>
              <Input
                placeholder="输入邮箱"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View className="mb-5">
              <Text className="mb-1.5 text-sm text-foreground" style={{ fontWeight: '500' }}>密码</Text>
              <Input
                placeholder="输入密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <Button onPress={handleSubmit} loading={loading} className="mb-4">
              <Text>{isSignUp ? '注册' : '登录'}</Text>
            </Button>

            <Pressable
              onPress={() => openAuthModal(isSignUp ? 'sign-in' : 'sign-up')}
              className="items-center py-2"
            >
              <Text className="text-sm text-muted-foreground">
                {isSignUp ? '已有账号？' : '没有账号？'}
                <Text className="text-foreground" style={{ fontWeight: '500' }}>{isSignUp ? '去登录' : '去注册'}</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
