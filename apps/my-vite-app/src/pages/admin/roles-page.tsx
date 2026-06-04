import { defineComponent, h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NSwitch,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { api } from 'src/lib/api'

export default defineComponent({
  name: 'RolesPage',
  setup() {
    const message = useMessage()
    const rows = ref<Record<string, unknown>[]>([])
    const showModal = ref(false)
    const editing = ref<Record<string, unknown> | null>(null)
    const form = ref({
      code: '',
      name: '',
      description: '',
      permissions: '',
      active: true,
    })

    const load = async () => {
      rows.value = await api.roles.list()
    }
    onMounted(load)

    const openCreate = () => {
      editing.value = null
      form.value = { code: '', name: '', description: '', permissions: '', active: true }
      showModal.value = true
    }

    const openEdit = (row: Record<string, unknown>) => {
      editing.value = row
      form.value = {
        code: String(row.code),
        name: String(row.name),
        description: typeof row.description === 'string' ? row.description : '',
        permissions: ((row.permissions as string[]) ?? []).join(','),
        active: Boolean(row.active),
      }
      showModal.value = true
    }

    const save = async () => {
      const body = {
        name: form.value.name,
        description: form.value.description,
        permissions: form.value.permissions
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        active: form.value.active,
      }
      try {
        if (editing.value) {
          await api.roles.update(String(editing.value.id), body)
        } else {
          await api.roles.create({ ...body, code: form.value.code })
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
        await api.roles.remove(String(row.id))
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    }

    const columns: DataTableColumns<Record<string, unknown>> = [
      { title: '编码', key: 'code' },
      { title: '名称', key: 'name' },
      {
        title: '权限',
        key: 'permissions',
        render: row => ((row.permissions as string[]) ?? []).join(', '),
      },
      { title: '启用', key: 'active', render: row => (row.active ? '是' : '否') },
      {
        title: '操作',
        key: 'actions',
        render: row =>
          h(NSpace, null, () => [
            h(NButton, { size: 'small', onClick: () => openEdit(row) }, () => '编辑'),
            h(NButton, { size: 'small', type: 'error', onClick: () => remove(row) }, () => '删除'),
          ]),
      },
    ]

    return () => (
      <NCard title="角色管理">
        <NSpace style="margin-bottom: 12px">
          <NButton type="primary" onClick={openCreate}>
            新建角色
          </NButton>
        </NSpace>
        <NDataTable columns={columns} data={rows.value} />
        <NModal
          show={showModal.value}
          preset="card"
          title={editing.value ? '编辑角色' : '新建角色'}
          style="width: 520px"
          onUpdateShow={(v: boolean) => {
            showModal.value = v
          }}
        >
          <NForm>
            {!editing.value && (
              <NFormItem label="编码">
                <NInput
                  value={form.value.code}
                  onUpdateValue={(v: string) => {
                    form.value.code = v
                  }}
                />
              </NFormItem>
            )}
            <NFormItem label="名称">
              <NInput
                value={form.value.name}
                onUpdateValue={(v: string) => {
                  form.value.name = v
                }}
              />
            </NFormItem>
            <NFormItem label="描述">
              <NInput
                value={form.value.description}
                onUpdateValue={(v: string) => {
                  form.value.description = v
                }}
              />
            </NFormItem>
            <NFormItem label="权限（逗号分隔）">
              <NInput
                value={form.value.permissions}
                onUpdateValue={(v: string) => {
                  form.value.permissions = v
                }}
                placeholder="users:read,users:write"
              />
            </NFormItem>
            <NFormItem label="启用">
              <NSwitch
                value={form.value.active}
                onUpdateValue={(v: boolean) => {
                  form.value.active = v
                }}
              />
            </NFormItem>
            <NButton type="primary" onClick={save}>
              保存
            </NButton>
          </NForm>
        </NModal>
      </NCard>
    )
  },
})
