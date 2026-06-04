import { PageConfigEntity } from './entities/page-config.entity'

type DefaultConfig = Omit<PageConfigEntity, 'id' | 'createdAt' | 'updatedAt'>

export const DEFAULT_PAGE_CONFIGS: DefaultConfig[] = [
  {
    key: 'home.hero',
    group: 'home',
    label: '首页 Hero 区',
    value: {
      'zh-CN': {
        badge: '全栈微前端平台',
        title: '欢迎来到 TongXK',
        subtitle: '支持登录注册与游客访问，主题与语言由后台动态配置下发',
        ctaText: '立即注册',
        ctaSecondary: '浏览列表',
        ctaLink: '/register',
        stats: {
          users: '用户体系',
          analytics: 'PV/UV 埋点',
          notify: '通知推送',
        },
      },
      'en-US': {
        badge: 'Full-stack Micro-frontend',
        title: 'Welcome to TongXK',
        subtitle:
          'Login, register, or browse as guest. Theme & locale are configured from admin.',
        ctaText: 'Sign Up',
        ctaSecondary: 'Browse List',
        ctaLink: '/register',
        stats: {
          users: 'User System',
          analytics: 'PV/UV Tracking',
          notify: 'Notifications',
        },
      },
      'ja-JP': {
        badge: 'フルスタックマイクロフロントエンド',
        title: 'TongXK へようこそ',
        subtitle:
          'ログイン・登録・ゲスト閲覧に対応。テーマと言語は管理画面から配信',
        ctaText: '今すぐ登録',
        ctaSecondary: 'リストを見る',
        ctaLink: '/register',
        stats: {
          users: 'ユーザー体系',
          analytics: 'PV/UV 計測',
          notify: '通知',
        },
      },
      'ko-KR': {
        badge: '풀스택 마이크로 프론트엔드',
        title: 'TongXK에 오신 것을 환영합니다',
        subtitle:
          '로그인·회원가입·게스트 접속 지원. 테마와 언어는 관리자에서 설정',
        ctaText: '지금 가입',
        ctaSecondary: '목록 보기',
        ctaLink: '/register',
        stats: {
          users: '사용자 체계',
          analytics: 'PV/UV 추적',
          notify: '알림',
        },
      },
    },
    enabled: true,
    description: '多语言：顶层按 locale 分块，API ?locale= 下发对应语言',
  },
  {
    key: 'home.features',
    group: 'home',
    label: '首页特性列表',
    value: {
      'zh-CN': {
        title: '平台能力',
        items: [
          {
            icon: '👤',
            title: '用户体系',
            desc: '登录、注册、角色权限与游客模式',
          },
          {
            icon: '📊',
            title: '数据埋点',
            desc: '自动采集 PV/UV，后台可视化统计',
          },
          { icon: '🔔', title: '通知中心', desc: '按角色与用户个性化消息推送' },
        ],
      },
      'en-US': {
        title: 'Capabilities',
        items: [
          {
            icon: '👤',
            title: 'User System',
            desc: 'Auth, roles, permissions and guest access',
          },
          {
            icon: '📊',
            title: 'Analytics',
            desc: 'Automatic PV/UV collection with admin dashboard',
          },
          {
            icon: '🔔',
            title: 'Notification Hub',
            desc: 'Personalized messages by role and user',
          },
        ],
      },
      'ja-JP': {
        title: 'プラットフォーム機能',
        items: [
          {
            icon: '👤',
            title: 'ユーザー体系',
            desc: '認証・ロール・ゲストモード',
          },
          { icon: '📊', title: 'データ計測', desc: 'PV/UV 自動収集と管理画面' },
          {
            icon: '🔔',
            title: '通知センター',
            desc: 'ロールとユーザー別の通知',
          },
        ],
      },
      'ko-KR': {
        title: '플랫폼 기능',
        items: [
          { icon: '👤', title: '사용자 체계', desc: '인증, 역할, 게스트 모드' },
          {
            icon: '📊',
            title: '데이터 추적',
            desc: 'PV/UV 자동 수집 및 관리 대시보드',
          },
          { icon: '🔔', title: '알림 센터', desc: '역할·사용자별 맞춤 알림' },
        ],
      },
    },
    enabled: true,
    description: '多语言特性卡片，按 locale 分块',
  },
  {
    key: 'site.brand',
    group: 'global',
    label: '站点品牌',
    value: {
      logoUrl:
        'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 64 64%22%3E%3Crect width%3D%2264%22 height%3D%2264%22 rx%3D%2214%22 fill%3D%22%2318a058%22%2F%3E%3Ctext x%3D%2232%22 y%3D%2243%22 text-anchor%3D%22middle%22 fill%3D%22%23fff%22 font-size%3D%2230%22 font-weight%3D%22700%22 font-family%3D%22system-ui%2Csans-serif%22%3ET%3C%2Ftext%3E%3C%2Fsvg%3E',
      logoText: 'TongXK',
      logoMark: 'T',
      tagline: {
        'zh-CN': '企业数字化门户',
        'en-US': 'Enterprise Digital Portal',
        'ja-JP': '企業デジタルポータル',
        'ko-KR': '기업 디지털 포털',
      },
    },
    enabled: true,
    description: 'Logo 与品牌文案，tagline 支持多语言',
  },
  {
    key: 'home.banner',
    group: 'home',
    label: '首页 Banner 轮播',
    value: {
      'zh-CN': {
        guest: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80',
              title: '构建下一代企业门户',
              subtitle: '注册账号，解锁完整功能与个性化体验',
              ctaText: '免费注册',
              ctaLink: '/register',
            },
            {
              image:
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
              title: '了解行业最新动态',
              subtitle: '浏览公开资讯，或登录后获取更多内容',
              ctaText: '浏览资讯',
              ctaLink: '/list',
            },
          ],
        },
        member: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1400&q=80',
              title: '欢迎回到 TongXK',
              subtitle: '您已登录，可查看会员专属动态与通知',
              ctaText: '查看动态',
              ctaLink: '/list',
            },
            {
              image:
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
              title: '专属内容已更新',
              subtitle: '最新产品进展与运营公告，第一时间送达',
              ctaText: '阅读资讯',
              ctaLink: '/list',
            },
          ],
        },
      },
      'en-US': {
        guest: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80',
              title: 'Build the Next-gen Portal',
              subtitle:
                'Sign up for the full experience and personalized content',
              ctaText: 'Sign Up Free',
              ctaLink: '/register',
            },
            {
              image:
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
              title: 'Explore Industry News',
              subtitle: 'Browse public updates or sign in for more',
              ctaText: 'Browse News',
              ctaLink: '/list',
            },
          ],
        },
        member: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1400&q=80',
              title: 'Welcome Back',
              subtitle:
                'You are signed in — member updates and notifications await',
              ctaText: 'View Updates',
              ctaLink: '/list',
            },
            {
              image:
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
              title: 'New Member Content',
              subtitle: 'Latest product news and announcements for you',
              ctaText: 'Read News',
              ctaLink: '/list',
            },
          ],
        },
      },
      'ja-JP': {
        guest: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80',
              title: '次世代ポータルを構築',
              subtitle: '登録してフル機能とパーソナライズ体験を',
              ctaText: '無料登録',
              ctaLink: '/register',
            },
            {
              image:
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
              title: '業界ニュースをチェック',
              subtitle: '公開情報を閲覧、ログインでさらに詳しく',
              ctaText: 'ニュース',
              ctaLink: '/list',
            },
          ],
        },
        member: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1400&q=80',
              title: 'おかえりなさい',
              subtitle: '会員向けの最新情報と通知をご確認ください',
              ctaText: '更新を見る',
              ctaLink: '/list',
            },
          ],
        },
      },
      'ko-KR': {
        guest: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80',
              title: '차세대 포털 구축',
              subtitle: '가입하여 전체 기능과 맞춤형 경험을 이용하세요',
              ctaText: '무료 가입',
              ctaLink: '/register',
            },
            {
              image:
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
              title: '업계 뉴스 둘러보기',
              subtitle: '공개 콘텐츠를 보거나 로그인하여 더 많은 정보 확인',
              ctaText: '뉴스 보기',
              ctaLink: '/list',
            },
          ],
        },
        member: {
          autoplayMs: 5000,
          slides: [
            {
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1400&q=80',
              title: '다시 오신 것을 환영합니다',
              subtitle: '회원 전용 업데이트와 알림을 확인하세요',
              ctaText: '업데이트 보기',
              ctaLink: '/list',
            },
          ],
        },
      },
    },
    enabled: true,
    description: '首页 Banner：guest 未登录 / member 已登录 分开展示',
  },
  {
    key: 'home.news',
    group: 'home',
    label: '首页新闻资讯',
    value: {
      'zh-CN': {
        guest: {
          title: '行业资讯',
          moreText: '查看更多',
          moreLink: '/list',
          items: [
            {
              id: 'g1',
              title: 'TongXK 门户平台正式发布',
              summary:
                '支持多语言、主题切换与后台可视化配置，快速搭建企业官网。',
              image:
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
              date: '2026-06-01',
              category: '产品',
              link: '/list',
            },
            {
              id: 'g2',
              title: '企业数字化转型趋势报告',
              summary: '2026 年企业门户建设要点与最佳实践摘要。',
              image:
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
              date: '2026-05-28',
              category: '行业',
              link: '/list',
            },
            {
              id: 'g3',
              title: '微前端架构实践分享',
              summary:
                '基于 qiankun 的主子应用方案，React/Vue 子应用灵活接入。',
              image:
                'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
              date: '2026-05-20',
              category: '架构',
              link: '/list',
            },
          ],
        },
        member: {
          title: '会员动态',
          moreText: '查看更多',
          moreLink: '/list',
          items: [
            {
              id: 'm1',
              title: '您的账号已激活全部功能',
              summary: '登录后可接收个性化通知，浏览会员专属公告与更新。',
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=80',
              date: '2026-06-04',
              category: '账户',
              link: '/list',
            },
            {
              id: 'm2',
              title: '6 月产品更新说明',
              summary: '门户配置、多语言与主题切换能力进一步增强，欢迎体验。',
              image:
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
              date: '2026-06-01',
              category: '产品',
              link: '/list',
            },
            {
              id: 'm3',
              title: '通知中心使用指南',
              summary: '点击右上角通知图标，及时获取系统消息与运营推送。',
              image:
                'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80',
              date: '2026-05-25',
              category: '指南',
              link: '/list',
            },
          ],
        },
      },
      'en-US': {
        guest: {
          title: 'Industry News',
          moreText: 'View All',
          moreLink: '/list',
          items: [
            {
              id: 'g1',
              title: 'TongXK Portal Officially Launched',
              summary:
                'Multi-language, themes and admin-driven configuration out of the box.',
              image:
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
              date: '2026-06-01',
              category: 'Product',
              link: '/list',
            },
            {
              id: 'g2',
              title: 'Digital Transformation Trends 2026',
              summary: 'Key insights for building modern enterprise portals.',
              image:
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
              date: '2026-05-28',
              category: 'Industry',
              link: '/list',
            },
          ],
        },
        member: {
          title: 'Member Updates',
          moreText: 'View All',
          moreLink: '/list',
          items: [
            {
              id: 'm1',
              title: 'Your Account Is Fully Activated',
              summary:
                'Signed-in users receive personalized notifications and member announcements.',
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=80',
              date: '2026-06-04',
              category: 'Account',
              link: '/list',
            },
            {
              id: 'm2',
              title: 'June Product Release Notes',
              summary:
                'Enhanced portal config, i18n and theme switching — try it now.',
              image:
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
              date: '2026-06-01',
              category: 'Product',
              link: '/list',
            },
          ],
        },
      },
      'ja-JP': {
        guest: {
          title: '業界ニュース',
          moreText: 'もっと見る',
          moreLink: '/list',
          items: [
            {
              id: 'g1',
              title: 'TongXK ポータル正式リリース',
              summary: '多言語・テーマ・管理画面設定に対応した企業ポータル。',
              image:
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
              date: '2026-06-01',
              category: '製品',
              link: '/list',
            },
          ],
        },
        member: {
          title: '会員向けお知らせ',
          moreText: 'もっと見る',
          moreLink: '/list',
          items: [
            {
              id: 'm1',
              title: 'アカウント機能が有効になりました',
              summary:
                'ログイン中はパーソナライズ通知と会員向け更新を受け取れます。',
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=80',
              date: '2026-06-04',
              category: 'アカウント',
              link: '/list',
            },
          ],
        },
      },
      'ko-KR': {
        guest: {
          title: '업계 뉴스',
          moreText: '더보기',
          moreLink: '/list',
          items: [
            {
              id: 'g1',
              title: 'TongXK 포털 정식 출시',
              summary: '다국어·테마·관리자 설정을 지원하는 기업 포털.',
              image:
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
              date: '2026-06-01',
              category: '제품',
              link: '/list',
            },
          ],
        },
        member: {
          title: '회원 소식',
          moreText: '더보기',
          moreLink: '/list',
          items: [
            {
              id: 'm1',
              title: '계정의 모든 기능이 활성화되었습니다',
              summary:
                '로그인 시 맞춤 알림과 회원 전용 공지를 받을 수 있습니다.',
              image:
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=80',
              date: '2026-06-04',
              category: '계정',
              link: '/list',
            },
          ],
        },
      },
    },
    enabled: true,
    description: '首页新闻：guest 公开资讯 / member 会员动态',
  },
  {
    key: 'site.themes',
    group: 'global',
    label: '主题列表',
    value: {
      default: 'fresh-green',
      items: [
        {
          id: 'fresh-green',
          label: {
            'zh-CN': '清新绿',
            'en-US': 'Fresh Green',
            'ja-JP': 'フレッシュグリーン',
            'ko-KR': '프레시 그린',
          },
          mode: 'light',
          colors: {
            primary: '#18a058',
            primaryHover: '#36ad6a',
            bg: '#f4f7f5',
            surface: '#ffffff',
            surfaceElevated: '#ffffff',
            text: '#0f172a',
            textMuted: '#64748b',
            border: '#dce5df',
            heroStart: '#e8f5ee',
            heroEnd: '#f4f7f5',
          },
        },
        {
          id: 'ocean-blue',
          label: {
            'zh-CN': '海洋蓝',
            'en-US': 'Ocean Blue',
            'ja-JP': 'オーシャンブルー',
            'ko-KR': '오션 블루',
          },
          mode: 'light',
          colors: {
            primary: '#2080f0',
            primaryHover: '#4098fc',
            bg: '#f0f6ff',
            surface: '#ffffff',
            surfaceElevated: '#ffffff',
            text: '#0f172a',
            textMuted: '#64748b',
            border: '#d6e4ff',
            heroStart: '#dbeafe',
            heroEnd: '#f0f6ff',
          },
        },
        {
          id: 'midnight',
          label: {
            'zh-CN': '午夜黑',
            'en-US': 'Midnight',
            'ja-JP': 'ミッドナイト',
            'ko-KR': '미드나잇',
          },
          mode: 'dark',
          colors: {
            primary: '#63e2b7',
            primaryHover: '#7fe7c4',
            bg: '#101014',
            surface: '#18181c',
            surfaceElevated: '#1f1f23',
            text: '#f1f5f9',
            textMuted: '#94a3b8',
            border: '#2d2d33',
            heroStart: '#1a2332',
            heroEnd: '#101014',
          },
        },
        {
          id: 'sunset',
          label: {
            'zh-CN': '暮光紫',
            'en-US': 'Sunset Purple',
            'ja-JP': 'サンセットパープル',
            'ko-KR': '선셋 퍼플',
          },
          mode: 'dark',
          colors: {
            primary: '#a78bfa',
            primaryHover: '#c4b5fd',
            bg: '#13111a',
            surface: '#1c1824',
            surfaceElevated: '#252030',
            text: '#f5f3ff',
            textMuted: '#a8a29e',
            border: '#3b3448',
            heroStart: '#2e1065',
            heroEnd: '#13111a',
          },
        },
      ],
    },
    enabled: true,
    description: '主题 label 支持字段级多语言',
  },
  {
    key: 'site.locales',
    group: 'global',
    label: '语言列表',
    value: {
      default: 'zh-CN',
      items: [
        { code: 'zh-CN', label: '简体中文' },
        { code: 'en-US', label: 'English' },
        { code: 'ja-JP', label: '日本語' },
        { code: 'ko-KR', label: '한국어' },
      ],
    },
    enabled: true,
    description: '前台可选语言列表',
  },
  {
    key: 'site.i18n',
    group: 'global',
    label: '通用 UI 文案',
    value: {
      'zh-CN': {
        'site.title': 'TongXK 前台',
        'nav.home': '首页',
        'nav.list': '资讯',
        'nav.news': '新闻',
        'nav.login': '登录',
        'nav.register': '注册',
        'nav.guest': '游客访问',
        'nav.guestMode': '游客模式',
        'nav.logout': '退出',
        'nav.welcome': '欢迎，{name}',
        'nav.notifications': '通知',
        'nav.noNotifications': '暂无通知',
        'nav.theme': '主题',
        'nav.language': '语言',
        'home.welcome.title': '欢迎回来，{name}',
        'home.welcome.subtitle': '以下是为您准备的会员专属动态',
        'home.welcome.cta': '查看动态',
        'home.guest.title': '探索 TongXK 企业门户',
        'home.guest.subtitle':
          '登录或注册账号获取完整体验；也可游客浏览公开资讯',
        'home.guest.login': '登录',
        'home.guest.register': '免费注册',
        'home.guest.browse': '游客浏览',
        'home.list.guestDesc': '公开行业资讯，登录后可查看更多会员内容',
        'home.list.memberDesc': '会员专属动态与公告',
      },
      'en-US': {
        'site.title': 'TongXK Portal',
        'nav.home': 'Home',
        'nav.list': 'News',
        'nav.news': 'News',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'nav.guest': 'Guest Mode',
        'nav.guestMode': 'Guest',
        'nav.logout': 'Logout',
        'nav.welcome': 'Welcome, {name}',
        'nav.notifications': 'Notifications',
        'nav.noNotifications': 'No notifications',
        'nav.theme': 'Theme',
        'nav.language': 'Language',
        'home.welcome.title': 'Welcome back, {name}',
        'home.welcome.subtitle': 'Here are your member-only updates',
        'home.welcome.cta': 'View Updates',
        'home.guest.title': 'Explore TongXK Portal',
        'home.guest.subtitle':
          'Sign in or register for the full experience, or browse as a guest',
        'home.guest.login': 'Sign In',
        'home.guest.register': 'Sign Up Free',
        'home.guest.browse': 'Browse as Guest',
        'home.list.guestDesc':
          'Public industry news — sign in for member content',
        'home.list.memberDesc': 'Member updates and announcements',
      },
      'ja-JP': {
        'site.title': 'TongXK ポータル',
        'nav.home': 'ホーム',
        'nav.list': 'ニュース',
        'nav.news': 'ニュース',
        'nav.login': 'ログイン',
        'nav.register': '登録',
        'nav.guest': 'ゲスト',
        'nav.guestMode': 'ゲストモード',
        'nav.logout': 'ログアウト',
        'nav.welcome': 'ようこそ、{name}',
        'nav.notifications': '通知',
        'nav.noNotifications': '通知はありません',
        'nav.theme': 'テーマ',
        'nav.language': '言語',
        'home.welcome.title': 'おかえりなさい、{name}',
        'home.welcome.subtitle': '会員向けの最新情報をご確認ください',
        'home.welcome.cta': '更新を見る',
        'home.guest.title': 'TongXK ポータルを探索',
        'home.guest.subtitle':
          'ログインまたは登録でフル機能を、ゲストで公開情報を閲覧',
        'home.guest.login': 'ログイン',
        'home.guest.register': '無料登録',
        'home.guest.browse': 'ゲスト閲覧',
        'home.list.guestDesc': '公開ニュース — ログインで会員向けコンテンツへ',
        'home.list.memberDesc': '会員向けのお知らせと更新',
      },
      'ko-KR': {
        'site.title': 'TongXK 포털',
        'nav.home': '홈',
        'nav.list': '뉴스',
        'nav.news': '뉴스',
        'nav.login': '로그인',
        'nav.register': '회원가입',
        'nav.guest': '게스트',
        'nav.guestMode': '게스트 모드',
        'nav.logout': '로그아웃',
        'nav.welcome': '환영합니다, {name}',
        'nav.notifications': '알림',
        'nav.noNotifications': '알림 없음',
        'nav.theme': '테마',
        'nav.language': '언어',
        'home.welcome.title': '다시 오신 것을 환영합니다, {name}',
        'home.welcome.subtitle': '회원 전용 최신 소식을 확인하세요',
        'home.welcome.cta': '업데이트 보기',
        'home.guest.title': 'TongXK 포털 둘러보기',
        'home.guest.subtitle':
          '로그인 또는 가입으로 전체 기능 이용, 게스트로 공개 콘텐츠 열람',
        'home.guest.login': '로그인',
        'home.guest.register': '무료 가입',
        'home.guest.browse': '게스트 둘러보기',
        'home.list.guestDesc': '공개 업계 뉴스 — 로그인 시 회원 콘텐츠 제공',
        'home.list.memberDesc': '회원 전용 소식 및 공지',
      },
    },
    enabled: true,
    description: '导航/通用 UI 文案，按 locale 分块',
  },
  {
    key: 'site.theme',
    group: 'global',
    label: '站点主题（旧版兼容）',
    value: { primaryColor: '#18a058', layout: 'default' },
    enabled: false,
    description: '已迁移至 site.themes',
  },
]
