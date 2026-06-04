import { defineComponent, h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { api } from 'src/lib/api'

export default defineComponent({
  name: 'NotificationsPage',
  setup() {
    const message = useMessage()
    const rows = ref<Record<string, unknown>[]>([])
    const showModal = ref(false)
    const editing = ref<Record<string, unknown> | null>(null)
    const form = ref({
      title: '',
      content: '',
      type: 'info',
      targetRoles: '',
      targetUserIds: '',
      priority: 0,
      link: '',
    })

    const load = async () => {
      rows.value = await api.notifications.list()
    }
    onMounted(load)

    const openCreate = () => {
      editing.value = null
      form.value = { title: '', content: '', type: 'info', targetRoles: '', targetUserIds: '', priority: 0, link: '' }
      showModal.value = true
    }

    const openEdit = (row: Record<string, unknown>) => {
      editing.value = row
      form.value = {
        title: String(row.title),
        content: String(row.content),
        type: String(row.type),
        targetRoles: ((row.targetRoles as string[]) ?? []).join(','),
        targetUserIds: ((row.targetUserIds as string[]) ?? []).join(','),
        priority: Number(row.priority ?? 0),
        link: typeof row.link === 'string' ? row.link : '',
      }
      showModal.value = true
    }

    const save = async () => {
      const body = {
        title: form.value.title,
        content: form.value.content,
        type: form.value.type,
        targetRoles: form.value.targetRoles
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        targetUserIds: form.value.targetUserIds
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        priority: form.value.priority,
        link: form.value.link || undefined,
      }
      try {
        if (editing.value) {
          await api.notifications.update(String(editing.value.id), body)
        } else {
          await api.notifications.create(body)
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
        await api.notifications.remove(String(row.id))
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    }

    const columns: DataTableColumns<Record<string, unknown>> = [
      { title: '标题', key: 'title' },
      { title: '类型', key: 'type' },
      { title: '优先级', key: 'priority' },
      {
        title: '目标角色',
        key: 'targetRoles',
        render: row => ((row.targetRoles as string[]) ?? []).join(', ') || '全部',
      },
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
      <NCard title="通知中心管理">
        <p style="margin-bottom: 12px; color: #666">
          支持按角色/用户推送个性化通知，前台 react-app 会根据登录状态自动拉取 feed。
        </p>
        <NSpace style="margin-bottom: 12px">
          <NButton type="primary" onClick={openCreate}>
            新建通知
          </NButton>
        </NSpace>
        <NDataTable columns={columns} data={rows.value} />
        <NModal
          show={showModal.value}
          preset="card"
          title={editing.value ? '编辑通知' : '新建通知'}
          style="width: 560px"
          onUpdateShow={(v: boolean) => {
            showModal.value = v
          }}
        >
          <NForm>
            <NFormItem label="标题">
              <NInput
                value={form.value.title}
                onUpdateValue={(v: string) => {
                  form.value.title = v
                }}
              />
            </NFormItem>
            <NFormItem label="内容">
              <NInput
                type="textarea"
                value={form.value.content}
                onUpdateValue={(v: string) => {
                  form.value.content = v
                }}
              />
            </NFormItem>
            <NFormItem label="类型">
              <NSelect
                value={form.value.type}
                options={[
                  { label: '系统', value: 'system' },
                  { label: '推荐', value: 'recommend' },
                  { label: '活动', value: 'promo' },
                  { label: '信息', value: 'info' },
                ]}
                onUpdateValue={(v: string) => {
                  form.value.type = v
                }}
              />
            </NFormItem>
            <NFormItem label="目标角色（逗号分隔，空=全部）">
              <NInput
                value={form.value.targetRoles}
                onUpdateValue={(v: string) => {
                  form.value.targetRoles = v
                }}
                placeholder="user,guest"
              />
            </NFormItem>
            <NFormItem label="目标用户 ID">
              <NInput
                value={form.value.targetUserIds}
                onUpdateValue={(v: string) => {
                  form.value.targetUserIds = v
                }}
              />
            </NFormItem>
            <NFormItem label="优先级">
              <NInputNumber
                value={form.value.priority}
                onUpdateValue={(v: number | null) => {
                  form.value.priority = v ?? 0
                }}
              />
            </NFormItem>
            <NFormItem label="跳转链接">
              <NInput
                value={form.value.link}
                onUpdateValue={(v: string) => {
                  form.value.link = v
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
