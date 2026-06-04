/** 后台 site.i18n 缺 key 时的兜底文案（与 page-config.defaults 保持一致） */
export const I18N_FALLBACKS: Record<string, Record<string, string>> = {
  'zh-CN': {
    'home.welcome.title': '欢迎回来，{name}',
    'home.welcome.subtitle': '以下是为您准备的会员专属动态',
    'home.welcome.cta': '查看动态',
    'home.guest.title': '探索 TongXK 企业门户',
    'home.guest.subtitle': '登录或注册账号获取完整体验；也可游客浏览公开资讯',
    'home.guest.login': '登录',
    'home.guest.register': '免费注册',
    'home.guest.browse': '游客浏览',
    'home.list.guestDesc': '公开行业资讯，登录后可查看更多会员内容',
    'home.list.memberDesc': '会员专属动态与公告',
  },
  'en-US': {
    'home.welcome.title': 'Welcome back, {name}',
    'home.welcome.subtitle': 'Here are your member-only updates',
    'home.welcome.cta': 'View Updates',
    'home.guest.title': 'Explore TongXK Portal',
    'home.guest.subtitle': 'Sign in or register for the full experience, or browse as a guest',
    'home.guest.login': 'Sign In',
    'home.guest.register': 'Sign Up Free',
    'home.guest.browse': 'Browse as Guest',
    'home.list.guestDesc': 'Public industry news — sign in for member content',
    'home.list.memberDesc': 'Member updates and announcements',
  },
  'ja-JP': {
    'home.welcome.title': 'おかえりなさい、{name}',
    'home.welcome.subtitle': '会員向けの最新情報をご確認ください',
    'home.welcome.cta': '更新を見る',
    'home.guest.title': 'TongXK ポータルを探索',
    'home.guest.subtitle': 'ログインまたは登録でフル機能を、ゲストで公開情報を閲覧',
    'home.guest.login': 'ログイン',
    'home.guest.register': '無料登録',
    'home.guest.browse': 'ゲスト閲覧',
    'home.list.guestDesc': '公開ニュース — ログインで会員向けコンテンツへ',
    'home.list.memberDesc': '会員向けのお知らせと更新',
  },
  'ko-KR': {
    'home.welcome.title': '다시 오신 것을 환영합니다, {name}',
    'home.welcome.subtitle': '회원 전용 최신 소식을 확인하세요',
    'home.welcome.cta': '업데이트 보기',
    'home.guest.title': 'TongXK 포털 둘러보기',
    'home.guest.subtitle': '로그인 또는 가입으로 전체 기능 이용, 게스트로 공개 콘텐츠 열람',
    'home.guest.login': '로그인',
    'home.guest.register': '무료 가입',
    'home.guest.browse': '게스트 둘러보기',
    'home.list.guestDesc': '공개 업계 뉴스 — 로그인 시 회원 콘텐츠 제공',
    'home.list.memberDesc': '회원 전용 소식 및 공지',
  },
}

export function resolveI18nText(
  key: string,
  messages: Record<string, string>,
  locale: string,
  fallbackLocale: string,
  params?: Record<string, string>,
): string {
  const localeFallbacks = I18N_FALLBACKS[locale] ?? I18N_FALLBACKS[fallbackLocale] ?? I18N_FALLBACKS['zh-CN']
  let text = messages[key] || localeFallbacks?.[key] || ''
  if (!text) return ''
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v)
    }
  }
  return text
}
