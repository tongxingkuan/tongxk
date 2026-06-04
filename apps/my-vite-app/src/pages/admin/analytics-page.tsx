import { defineComponent, onMounted, ref } from 'vue'
import { NCard, NDataTable, NGrid, NGi, NStatistic, NSelect, NSpace } from 'naive-ui'
import { api } from 'src/lib/api'

export default defineComponent({
  name: 'AnalyticsPage',
  setup() {
    const days = ref(7)
    const data = ref<Record<string, unknown> | null>(null)

    const load = async () => {
      data.value = await api.analytics.overview(days.value)
    }
    onMounted(load)

    const onDaysChange = async (v: number) => {
      days.value = v
      await load()
    }

    return () => {
      const summary = (data.value?.summary ?? {}) as Record<string, number>
      const daily = (data.value?.daily ?? []) as Record<string, unknown>[]
      const topPages = (data.value?.topPages ?? []) as Record<string, unknown>[]
      const recent = (data.value?.recent ?? []) as Record<string, unknown>[]

      return (
        <NSpace vertical size="large">
          <NSpace align="center">
            <span>统计范围</span>
            <NSelect
              style="width: 120px"
              value={days.value}
              options={[
                { label: '7 天', value: 7 },
                { label: '14 天', value: 14 },
                { label: '30 天', value: 30 },
              ]}
              onUpdateValue={onDaysChange}
            />
          </NSpace>
          <NGrid cols={3} xGap={12}>
            <NGi>
              <NCard>
                <NStatistic label="PV" value={summary.pv ?? 0} />
              </NCard>
            </NGi>
            <NGi>
              <NCard>
                <NStatistic label="UV" value={summary.uv ?? 0} />
              </NCard>
            </NGi>
            <NGi>
              <NCard>
                <NStatistic label="登录用户 UV" value={summary.loggedInUv ?? 0} />
              </NCard>
            </NGi>
          </NGrid>
          <NCard title="每日趋势">
            <NDataTable
              columns={[
                { title: '日期', key: 'date' },
                { title: 'PV', key: 'pv' },
                { title: 'UV', key: 'uv' },
              ]}
              data={daily}
            />
          </NCard>
          <NCard title="热门页面 Top 20">
            <NDataTable
              columns={[
                { title: '路径', key: 'path' },
                { title: 'PV', key: 'pv' },
                { title: 'UV', key: 'uv' },
              ]}
              data={topPages}
            />
          </NCard>
          <NCard title="最近访问">
            <NDataTable
              columns={[
                { title: '路径', key: 'path' },
                { title: '访客 ID', key: 'visitorId' },
                { title: '用户 ID', key: 'userId' },
                { title: '来源', key: 'source' },
                { title: '时间', key: 'createdAt', render: row => new Date(String(row.createdAt)).toLocaleString() },
              ]}
              data={recent}
            />
          </NCard>
        </NSpace>
      )
    }
  },
})
