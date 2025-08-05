import { demos } from '../../data/demos'

const getAllTag = () => {
  const tags = new Set<string>()
  demos.forEach(demo => {
    const len = demo.tags.length
    let i = 0
    while (i < len) {
      tags.add(demo.tags[i])
      i++
    }
  })
  return Array.from(tags).map(tag => ({
    tag: tag,
    count: count(tag),
  }))
}

const count = (tag: string) => {
  let result = 0
  demos.forEach(demo => {
    if (demo.tags.indexOf(tag) > -1) {
      result += 1
    }
  })
  return result
}

export default defineEventHandler(event => {
  return {
    tags: getAllTag(),
  }
})
