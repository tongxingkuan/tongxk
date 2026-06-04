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
  name: 'PageConfigPage',
  setup() {
    const message = useMessage()
    const rows = ref<Record<string, unknown>[]>([])
    const showModal = ref(false)
    const editing = ref<Record<string, unknown> | null>(null)
    const form = ref({
      key: '',
      group: 'home',
      label: '',
      description: '',
      valueJson: '{}',
      enabled: true,
    })

    const load = async () => {
      rows.value = await api.pageConfig.list()
    }
    onMounted(load)

    const openCreate = () => {
      editing.value = null
      form.value = { key: '', group: 'home', label: '', description: '', valueJson: '{}', enabled: true }
      showModal.value = true
    }

    const openEdit = (row: Record<string, unknown>) => {
      editing.value = row
      form.value = {
        key: String(row.key),
        group: String(row.group),
        label: String(row.label),
        description: typeof row.description === 'string' ? row.description : '',
        valueJson: JSON.stringify(row.value ?? {}, null, 2),
        enabled: Boolean(row.enabled),
      }
      showModal.value = true
    }

    const save = async () => {
      let value: Record<string, unknown>
      try {
        value = JSON.parse(form.value.valueJson)
      } catch {
        message.error('JSON 格式不正确')
        return
      }
      const body = {
        group: form.value.group,
        label: form.value.label,
        description: form.value.description,
        value,
        enabled: form.value.enabled,
      }
      try {
        if (editing.value) {
          await api.pageConfig.update(String(editing.value.id), body)
        } else {
          await api.pageConfig.create({ ...body, key: form.value.key })
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
        await api.pageConfig.remove(String(row.id))
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    }

    const columns: DataTableColumns<Record<string, unknown>> = [
      { title: 'Key', key: 'key' },
      { title: '分组', key: 'group' },
      { title: '标签', key: 'label' },
      { title: '启用', key: 'enabled', render: row => (row.enabled ? '是' : '否') },
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
      <NCard title="页面配置">
        <NSpace style="margin-bottom: 12px">
          <NButton type="primary" onClick={openCreate}>
            新建配置
          </NButton>
        </NSpace>
        <NDataTable columns={columns} data={rows.value} />
        <NModal
          show={showModal.value}
          preset="card"
          title={editing.value ? '编辑配置' : '新建配置'}
          style="width: 640px"
          onUpdateShow={(v: boolean) => {
            showModal.value = v
          }}
        >
          <NForm>
            {!editing.value && (
              <NFormItem label="Key">
                <NInput
                  value={form.value.key}
                  onUpdateValue={(v: string) => {
                    form.value.key = v
                  }}
                />
              </NFormItem>
            )}
            <NFormItem label="分组">
              <NInput
                value={form.value.group}
                onUpdateValue={(v: string) => {
                  form.value.group = v
                }}
              />
            </NFormItem>
            <NFormItem label="标签">
              <NInput
                value={form.value.label}
                onUpdateValue={(v: string) => {
                  form.value.label = v
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
            <NFormItem label="值 (JSON)">
              <NInput
                type="textarea"
                rows={8}
                value={form.value.valueJson}
                onUpdateValue={(v: string) => {
                  form.value.valueJson = v
                }}
              />
            </NFormItem>
            <NFormItem label="启用">
              <NSwitch
                value={form.value.enabled}
                onUpdateValue={(v: boolean) => {
                  form.value.enabled = v
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
