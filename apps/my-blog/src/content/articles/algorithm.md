---
title: '算法'
description: '算法'
querys: ['算法']
---

## 算法

### 双指针

#### 1. [三数之和](https://leetcode.cn/problems/3sum/)

```js
function threeSum(nums) {
  const result = []
  nums.sort((a, b) => a - b)
  let i = 0
  while (i < nums.length) {
    let left = i + 1,
      right = nums.length - 1
    while (nums[i] === nums[i - 1]) i++
    while (left < right) {
      let sum = nums[i] + nums[left] + nums[right]
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]])
        while (nums[left] === nums[left + 1]) left++
        while (nums[right] === nums[right - 1]) right--
        left++
        right--
      } else if (sum < 0) {
        left++
      } else {
        right--
      }
    }
    i++
  }
  return result
}
```

#### 2. 最长的回文子串

```js
function longestPalindrome(s) {
  let maxLen = 0,
    startIndex = 0,
    len = s.length
  for (let i = 0; i < len; i++) {
    let left = i - 1
    let len = 1
    while (s[i + 1] === s[i]) {
      i++
      len++
    }
    let right = i + 1
    while (s[left] === s[right] && left >= 0 && s[right] !== undefined) {
      left--
      right++
      len += 2
    }
    if (len > maxLen) {
      maxLen = len
      startIndex = left + 1
    }
  }
  return s.slice(startIndex, startIndex + maxLen)
}
```

#### 3. 盛最多水的容器

```js
function maxArea(height) {
  let max = 0,
    left = 0,
    right = height.length - 1
  while (left < right) {
    max = Math.max(max, Math.min(height[left], height[right]) * (right - left))
    if (height[left] < height[right]) {
      left++
    } else {
      right--
    }
  }
  return max
}
```

#### 4. 分发饼干

```js
function findContentChildren(g, s) {
  g.sort((a, b) => a - b)
  s.sort((a, b) => a - b)
  let count = 0
  let i = 0,
    j = 0
  while (i < g.length && j < s.length) {
    if (g[i] <= s[j]) {
      count++
      i++
      j++
    } else {
      j++
    }
  }
  return count
}
```

### 其他

#### 1. 将数字转换为千分位格式，如 `123456789` 转换为 `123,456,789`，保留两位小数

```js
// 这个是js自带的api，可以实现千分位格式化，保留两位小数
function formatNumber(num) {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

// 正则实现
function formatNumber(num) {
  let str = num.toString()
  let [integer, decimal] = str.split('.')
  decimal = decimal.padEnd(2, '0').slice(0, 2)
  // 详细解析一下这个正则
  // \B 表示非单词边界
  // (?=(\d{3})+) 表示一个或多个3位数字
  // (?!\d) 表示不是数字
  // 所以 \B(?=(\d{3})+(?!\d)) 表示非单词边界，且前面有1个或多个3位数字，且后面不是数字
  // 所以 \B(?=(\d{3})+(?!\d))/g 表示全局匹配
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimal ? `${integer}.${decimal}` : integer
}

// 手搓实现
function formatNumber(num) {
  if (typeof num !== 'number') {
    return '-'
  }
  let str = num.toString()
  let [integer, decimal = ''] = str.split('.')
  decimal = decimal.padEnd(2, '0').slice(0, 2)
  let result = [],
    count = 0
  for (let i = integer.length - 1; i >= 0; i--) {
    count++
    result.unshift(integer[i])
    if (count % 3 === 0 && i !== 0) {
      result.unshift(',')
    }
  }
  return `${result.join('')}.${decimal}`
}
```
