import { api } from './api'
import { getSessionId, getVisitorId } from './visitor-id'

export function trackPageView(path: string, pageTitle?: string) {
  void api
    .track({
      path,
      pageTitle,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      referrer: document.referrer || undefined,
      source: 'react-app',
    })
    .catch(() => {
      /* ignore tracking errors */
    })
}
