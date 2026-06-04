import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { Repository } from 'typeorm'
import { idWhere } from '../common/db/id.util'
import {
  CreatePageConfigDto,
  UpdatePageConfigDto,
} from './dto/page-config.dto'
import { PageConfigEntity } from './entities/page-config.entity'
import { resolveConfigI18n } from './page-config-i18n.util'
import { DEFAULT_PAGE_CONFIGS } from './page-config.defaults'

const LEGACY_LOGO_HOSTS = ['unsplash.com', 'images.unsplash.com']

@Injectable()
export class PageConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(PageConfigEntity)
    private readonly configs: Repository<PageConfigEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const cfg of DEFAULT_PAGE_CONFIGS) {
      const exist = await this.configs.findOne({ where: { key: cfg.key } })
      if (exist) continue
      const now = new Date()
      await this.configs.save(
        this.configs.create({
          id: randomUUID(),
          ...cfg,
          createdAt: now,
          updatedAt: now,
        }),
      )
    }
    await this.migrateLegacyConfigs()
    await this.mergeMissingI18nKeys()
    await this.mergeMissingBrandConfig()
  }

  /** 将旧版单语言 / titleKey 结构升级为多语言分块 */
  private async migrateLegacyConfigs() {
    const migrations: { key: string, test: (v: unknown) => boolean }[] = [
      {
        key: 'home.hero',
        test: v => {
          const o = v as Record<string, unknown>
          return typeof o?.title === 'string' && !('zh-CN' in o)
        },
      },
      {
        key: 'home.features',
        test: v => {
          const items = (
            v as { items?: { title?: string, titleKey?: string }[] }
          )?.items
          return !!items?.[0] && (!!items[0].title || !!items[0].titleKey)
        },
      },
      {
        key: 'site.themes',
        test: v => {
          const items = (v as { items?: { label?: unknown }[] })?.items
          return typeof items?.[0]?.label === 'string'
        },
      },
      {
        key: 'home.banner',
        test: v => {
          const zh = (v as Record<string, unknown>)['zh-CN'] as
            | Record<string, unknown>
            | undefined
          return !!zh?.slides && !('guest' in zh)
        },
      },
      {
        key: 'home.news',
        test: v => {
          const zh = (v as Record<string, unknown>)['zh-CN'] as
            | Record<string, unknown>
            | undefined
          return !!zh?.items && !('guest' in zh)
        },
      },
    ]

    for (const { key, test } of migrations) {
      const row = await this.configs.findOne({ where: { key } })
      if (!row || !test(row.value)) continue
      const fresh = DEFAULT_PAGE_CONFIGS.find(c => c.key === key)
      if (!fresh) continue
      row.value = fresh.value
      row.updatedAt = new Date()
      await this.configs.save(row)
    }
  }

  /** 将 defaults 中新增的 i18n key 合并进已有 site.i18n，避免老库缺文案 */
  private async mergeMissingI18nKeys() {
    const row = await this.configs.findOne({ where: { key: 'site.i18n' } })
    const fresh = DEFAULT_PAGE_CONFIGS.find(c => c.key === 'site.i18n')
    if (!row || !fresh?.value) return

    const current = row.value as Record<string, Record<string, string>>
    const defaults = fresh.value as Record<string, Record<string, string>>
    let changed = false

    for (const [locale, defaultMsgs] of Object.entries(defaults)) {
      if (!current[locale]) {
        current[locale] = { ...defaultMsgs }
        changed = true
        continue
      }
      for (const [key, val] of Object.entries(defaultMsgs)) {
        if (!current[locale][key]) {
          current[locale][key] = val
          changed = true
        }
      }
    }

    if (changed) {
      row.value = current
      row.updatedAt = new Date()
      await this.configs.save(row)
    }
  }

  /** 补全 site.brand 字段，并将不可用的外链 Logo 换为内置 SVG */
  private async mergeMissingBrandConfig() {
    const row = await this.configs.findOne({ where: { key: 'site.brand' } })
    const fresh = DEFAULT_PAGE_CONFIGS.find(c => c.key === 'site.brand')
    if (!row || !fresh?.value) return

    const current = { ...row.value }
    const defaults = fresh.value
    let changed = false

    for (const key of ['logoUrl', 'logoText', 'logoMark'] as const) {
      if (!current[key] && defaults[key]) {
        current[key] = defaults[key]
        changed = true
      }
    }

    const logoUrl = typeof current.logoUrl === 'string' ? current.logoUrl : ''
    if (!logoUrl || LEGACY_LOGO_HOSTS.some(host => logoUrl.includes(host))) {
      current.logoUrl = defaults.logoUrl
      changed = true
    }

    if (!current.tagline && defaults.tagline) {
      current.tagline = defaults.tagline
      changed = true
    }

    if (changed) {
      row.value = current
      row.updatedAt = new Date()
      await this.configs.save(row)
    }
  }

  findAllAdmin() {
    return this.configs.find({ order: { group: 'ASC', key: 'ASC' } })
  }

  /**
   * 前台公开读取配置，按 locale 解析多语言字段。
   * @param group 可选分组过滤
   * @param locale 目标语言，如 zh-CN
   */
  async findPublic(group?: string, locale?: string) {
    const list = await this.configs.find({
      where: group ? { group, enabled: true } : { enabled: true },
      order: { key: 'ASC' },
    })

    const localesRow = list.find(c => c.key === 'site.locales')
    const fallback
      = (localesRow?.value as { default?: string } | undefined)?.default
        ?? 'zh-CN'
    const activeLocale = locale ?? fallback

    const resolved = list.reduce<Record<string, Record<string, unknown>>>(
      (acc, item) => {
        acc[item.key] = resolveConfigI18n(
          item.value,
          activeLocale,
          fallback,
        ) as Record<string, unknown>
        return acc
      },
      {},
    )

    return {
      _meta: { locale: activeLocale, fallbackLocale: fallback },
      ...resolved,
    }
  }

  async findOne(id: string) {
    const cfg = await this.configs.findOne({ where: idWhere(id) })
    if (!cfg) throw new NotFoundException(`配置 ${id} 不存在`)
    return cfg
  }

  async create(dto: CreatePageConfigDto) {
    const now = new Date()
    return this.configs.save(
      this.configs.create({
        id: randomUUID(),
        key: dto.key,
        group: dto.group,
        label: dto.label,
        value: dto.value ?? {},
        enabled: dto.enabled ?? true,
        description: dto.description ?? null,
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  async update(id: string, dto: UpdatePageConfigDto) {
    const cfg = await this.findOne(id)
    Object.assign(cfg, {
      ...(dto.group !== undefined && { group: dto.group }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.value !== undefined && { value: dto.value }),
      ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      ...(dto.description !== undefined && { description: dto.description }),
      updatedAt: new Date(),
    })
    return this.configs.save(cfg)
  }

  async remove(id: string) {
    const cfg = await this.findOne(id)
    await this.configs.remove(cfg)
    return { ok: true }
  }
}
