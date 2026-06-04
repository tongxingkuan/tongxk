import { defineComponent, h, onMounted, ref, computed } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { useAuth } from 'src/composables/use-auth'
import { api } from 'src/lib/api'

export default defineComponent({
  name: 'UsersPage',
  setup() {
    const message = useMessage()
    const { isSuperAdmin } = useAuth()
    const rows = ref<Record<string, unknown>[]>([])
    const roles = ref<{ label: string, value: string }[]>([])
    const showModal = ref(false)
    const editing = ref<Record<string, unknown> | null>(null)
    const form = ref({ role: 'user', status: 'active', displayName: '', password: '' })

    const load = async () => {
      rows.value = await api.users.list()
      if (isSuperAdmin.value) {
        const roleList = await api.roles.list()
        roles.value = roleList.map(r => ({
          label: String(r.name),
          value: String(r.code),
        }))
      }
    }

    onMounted(load)

    const openEdit = (row: Record<string, unknown>) => {
      editing.value = row
      form.value = {
        role: String(row.role),
        status: typeof row.status === 'string' ? row.status : 'active',
        displayName: typeof row.displayName === 'string' ? row.displayName : '',
        password: '',
      }
      showModal.value = true
    }

    const save = async () => {
      if (!editing.value) return
      try {
        await api.users.update(String(editing.value.id), {
          role: form.value.role,
          status: form.value.status,
          displayName: form.value.displayName || null,
        })
        if (form.value.password) {
          await api.users.resetPassword(String(editing.value.id), form.value.password)
        }
        message.success('已保存')
        showModal.value = false
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '保存失败')
      }
    }

    const remove = async (row: Record<string, unknown>) => {
      try {
        await api.users.remove(String(row.id))
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    }

    const columns = computed<DataTableColumns<Record<string, unknown>>>(() => {
      const base: DataTableColumns<Record<string, unknown>> = [
        { title: '用户名', key: 'username' },
        { title: '角色', key: 'role' },
        { title: '状态', key: 'status' },
        { title: '昵称', key: 'displayName' },
      ]
      if (isSuperAdmin.value) {
        base.push({
          title: '操作',
          key: 'actions',
          render: row =>
            h(NSpace, null, () => [
              h(NButton, { size: 'small', onClick: () => openEdit(row) }, () => '编辑'),
              h(NButton, { size: 'small', type: 'error', onClick: () => remove(row) }, () => '删除'),
            ]),
        })
      }
      return base
    })

    return () => (
      <NCard title="用户管理">
        {!isSuperAdmin.value && (
          <NAlert type="info" style="margin-bottom: 12px" showIcon={false}>
            当前为只读权限，编辑/删除用户需超级管理员操作
          </NAlert>
        )}
        <NDataTable columns={columns.value} data={rows.value} />
        {isSuperAdmin.value && (
          <NModal
            show={showModal.value}
            preset="card"
            title="编辑用户"
            style="width: 480px"
            onUpdateShow={(v: boolean) => {
              showModal.value = v
            }}
          >
            <NForm>
              <NFormItem label="角色">
                <NSelect
                  value={form.value.role}
                  options={roles.value}
                  onUpdateValue={(v: string) => {
                    form.value.role = v
                  }}
                />
              </NFormItem>
              <NFormItem label="状态">
                <NSelect
                  value={form.value.status}
                  options={[
                    { label: '正常', value: 'active' },
                    { label: '禁用', value: 'disabled' },
                  ]}
                  onUpdateValue={(v: string) => {
                    form.value.status = v
                  }}
                />
              </NFormItem>
              <NFormItem label="昵称">
                <NInput
                  value={form.value.displayName}
                  onUpdateValue={(v: string) => {
                    form.value.displayName = v
                  }}
                />
              </NFormItem>
              <NFormItem label="重置密码">
                <NInput
                  type="password"
                  value={form.value.password}
                  onUpdateValue={(v: string) => {
                    form.value.password = v
                  }}
                  placeholder="留空则不修改"
                />
              </NFormItem>
              <NButton type="primary" onClick={save}>
                保存
              </NButton>
            </NForm>
          </NModal>
        )}
      </NCard>
    )
  },
})
