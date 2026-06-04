import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSiteConfig } from 'src/context/SiteConfigContext'
import { api } from 'src/lib/api'
import { getVisitorId } from 'src/lib/visitor-id'
import type { RootState } from 'src/store'

interface NotificationItem {
  id: string
  title: string
  content: string
  type: string
  read: boolean
  link: string | null
}

export default function NotificationBell() {
  const { user, guest } = useSelector((s: RootState) => s.auth)
  const { t } = useSiteConfig()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])

  const load = async () => {
    const list = await api.notifications.feed(getVisitorId())
    setItems(list)
  }

  useEffect(() => {
    void load()
  }, [user, guest])

  const unread = items.filter(i => !i.read).length

  const markRead = async (id: string) => {
    await api.notifications.markRead([id], getVisitorId())
    await load()
  }

  return (
    <div className="notification-bell">
      <button type="button" className="btn-ghost notification-trigger" onClick={() => setOpen(v => !v)}>
        {t('nav.notifications')}
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-panel">
          {items.length === 0 && <p className="notification-empty">{t('nav.noNotifications')}</p>}
          {items.map(item => (
            <div
              key={item.id}
              className={`notification-item ${item.read ? 'read' : 'unread'}`}
              onClick={() => void markRead(item.id)}
            >
              <strong>{item.title}</strong>
              <p>{item.content}</p>
              {item.link && <a href={item.link}>→</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
