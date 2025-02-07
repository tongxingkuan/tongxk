let id = 0

export const createStringId = (prefix = '') => {
  id += 1
  return prefix ? `${prefix}-${id}` : id.toString()
}

export const createNumberId = () => {
  id += 1
  return id
}
