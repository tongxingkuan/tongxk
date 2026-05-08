---
title: '寻找数组第 K 大元素'
description: '冒泡 / 选择排序改造，快速选择，堆排序'
querys: ['数组第K大', 'K大', 'topK', '冒泡', '选择排序', '堆', '快速选择']
---

## 寻找数组第 K 大元素

### 改造冒泡排序

每轮冒泡把最大值浮到最右侧，跑 K 轮即可确定第 K 大。

```js
function findK(k, arr) {
  if (k >= arr.length) return
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j + 1] < arr[j]) {
        let temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
      }
    }
    console.log(arr)
  }
  return arr[arr.length - k]
}
```

运行结果如下：

:c-image-with-thumbnail{alt=冒泡排序 src=/img/articles/bubbleSort.png}

### 改造选择排序

每轮选出剩余部分的最大值，放到已排序区末尾，跑 K 轮返回第 K 个。

```js
function findK(k, arr) {
  let len = arr.length
  if (k > len) return
  let temp, maxIndex
  for (let i = 0; i < k; i++) {
    maxIndex = i
    for (let j = i + 1; j < len; j++) {
      if (arr[j] > arr[maxIndex]) {
        maxIndex = j // 找到最大数的索引
      }
    }
    temp = arr[i]
    arr[i] = arr[maxIndex]
    arr[maxIndex] = temp
    console.log(arr)
  }
  return arr[k - 1]
}
```

运行结果如下：

:c-image-with-thumbnail{alt=选择排序 src=/img/articles/selectionSort.png}

### 进阶：复杂度对比

| 方案                        | 时间复杂度            | 空间复杂度 | 场景                |
| --------------------------- | --------------------- | ---------- | ------------------- |
| 改造冒泡 / 选择             | O(nk)                 | O(1)       | K 很小，数据量中等  |
| 全排序后取第 K 个           | O(n log n)            | O(1)       | 需要多次不同 K      |
| **快速选择（QuickSelect）** | 平均 O(n)，最坏 O(n²) | O(log n)   | 单次查找的最优解    |
| **小顶堆（维护大小为 K）**  | O(n log k)            | O(k)       | 海量数据 / 流式数据 |

### 快速选择（QuickSelect）思路

基于快排 partition：随机选 pivot 把数组分两半，根据 pivot 位置决定只递归其中一侧，**平均线性时间**。

```js
function findKthLargest(nums, k) {
  const target = nums.length - k
  const partition = (l, r) => {
    const pivot = nums[r]
    let i = l
    for (let j = l; j < r; j++) {
      if (nums[j] < pivot) {
        ;[nums[i], nums[j]] = [nums[j], nums[i]]
        i++
      }
    }
    ;[nums[i], nums[r]] = [nums[r], nums[i]]
    return i
  }
  const select = (l, r) => {
    if (l >= r) return nums[l]
    const p = partition(l, r)
    if (p === target) return nums[p]
    return p < target ? select(p + 1, r) : select(l, p - 1)
  }
  return select(0, nums.length - 1)
}
```

### 海量数据场景：小顶堆

面试高频追问"10 亿数据找 Top K"：用大小为 K 的小顶堆，遍历数组，比堆顶大就替换并下沉。空间 O(K)，适合内存放不下全量数据的流式处理。
