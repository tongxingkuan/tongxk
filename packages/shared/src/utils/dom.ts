/**
 * DOM 操作工具函数
 */

export const isMobile = (): boolean => {
  return window.innerWidth < 768
}

export const isDesktop = (): boolean => {
  return !isMobile()
}

export const getScreenWidth = (): number => {
  return window.screen.width
}

export const getViewportWidth = (): number => {
  return window.innerWidth
}

export const getViewportHeight = (): number => {
  return window.innerHeight
}

export const isElementInViewport = (element: Element): boolean => {
  const rect = element.getBoundingClientRect()
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= getViewportHeight() && rect.right <= getViewportWidth()
}

export const scrollToElement = (element: Element | string, options: ScrollToOptions = {}): void => {
  const target = typeof element === 'string' ? document.querySelector(element) : element
  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options,
    })
  }
}

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
