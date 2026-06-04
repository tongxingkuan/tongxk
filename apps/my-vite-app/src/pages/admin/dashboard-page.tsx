import { defineComponent, onMounted, ref } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NSpace, NTag } from 'naive-ui'
import { api } from 'src/lib/api'

export default defineComponent({
  name: 'DashboardPage',
  setup() {
    const metrics = ref<Record<string, unknown> | null>(null)
    const analytics = ref<Record<string, unknown> | null>(null)

    onMounted(async () => {
      try {
        metrics.value = await api.metrics()
        analytics.value = await api.analytics.overview(7)
      } catch {
        /* ignore */
      }
    })

    return () => {
      const summary = (analytics.value?.summary ?? {}) as Record<string, number>
      return (
        <NSpace vertical size="large">
          <NGrid cols={4} xGap={12}>
            <NGi>
              <NCard>
                <NStatistic label="7日 PV" value={summary.pv ?? 0} />
              </NCard>
            </NGi>
            <NGi>
              <NCard>
                <NStatistic label="7日 UV" value={summary.uv ?? 0} />
              </NCard>
            </NGi>
            <NGi>
              <NCard>
                <NStatistic label="登录 UV" value={summary.loggedInUv ?? 0} />
              </NCard>
            </NGi>
            <NGi>
              <NCard>
                <NStatistic label="服务请求数" value={(metrics.value?.totalRequests as number) ?? 0} />
              </NCard>
            </NGi>
          </NGrid>
          <NCard title="服务状态">
            <NSpace>
              <NTag type="success">API 运行中</NTag>
              <span>运行时长 {(metrics.value?.uptimeSec as number) ?? 0} 秒</span>
              <span>错误率 {((metrics.value?.errorRate as number) ?? 0) * 100}%</span>
            </NSpace>
          </NCard>
        </NSpace>
      )
    }
  },
})
