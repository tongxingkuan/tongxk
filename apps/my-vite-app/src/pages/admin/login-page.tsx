import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useAuth } from 'src/composables/use-auth'

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const message = useMessage()
    const { login, loading } = useAuth()
    const username = ref('superadmin')
    const password = ref('superadmin@123')

    const onSubmit = async () => {
      try {
        await login(username.value, password.value)
        message.success('登录成功')
        void router.replace('/admin/dashboard')
      } catch (e) {
        message.error(e instanceof Error ? e.message : '登录失败')
      }
    }

    return () => (
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fa">
        <NCard title="后台登录" style="width: 400px">
          <NForm>
            <NFormItem label="用户名">
              <NInput
                value={username.value}
                onUpdateValue={(v: string) => {
                  username.value = v
                }}
              />
            </NFormItem>
            <NFormItem label="密码">
              <NInput
                type="password"
                value={password.value}
                onUpdateValue={(v: string) => {
                  password.value = v
                }}
                onKeyup={(e: KeyboardEvent) => e.key === 'Enter' && void onSubmit()}
              />
            </NFormItem>
            <NButton type="primary" block loading={loading.value} onClick={onSubmit}>
              登录
            </NButton>
          </NForm>
          <p style="margin-top: 12px; color: #888; font-size: 12px">默认账号 superadmin / superadmin@123</p>
        </NCard>
      </div>
    )
  },
})
