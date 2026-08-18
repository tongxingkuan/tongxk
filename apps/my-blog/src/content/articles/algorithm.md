---
title: '算法'
description: '算法'
querys: ['算法']
---

## 算法

### 二分法

```js
// 小红要用土把所有花圃的最低高度尽量抬高。每单位土的填埋成本为 U, 每车最多运 C 单位土，每启用一车另付运输费 F，一车土可分给多个花圃。预算为 B。求预算内所有花圃最终最低高度的最大值。

// 整体思路：二分答案（最大化最小值）
// 1. 单调性：若能抬高到 target，则抬高到任何更低的值成本只会更少，必然也可行 → 答案具有单调性，可以二分
// 2. 验证：关键在于"一车土可分给多个花圃"，所以车数只取决于总土方 need = Σ(target - h[i])，即 ceil(need / C)
//    总成本 = need * U + ceil(need / C) * F，与预算 B 比较即可，无需关心土怎么分配
// 3. 二分区间：下界 min(h)（成本为 0 必可行），上界 min(h) + floor(B / U)（纯土方费都不超预算的上限）

const rl = require('readline').createInterface({ input: process.stdin });
var iter = rl[Symbol.asyncIterator]();
const readline = async () => (await iter.next()).value;

void (async function () {
  // 输入格式：每行一个数，依次为 预算 B、每车容量 C、每车运输费 F、每单位土成本 U、花圃数 n，最后一行为各花圃高度
  // 样例输入 100/10/5/2/5/"1 2 5 3 4" → 输出 11（target=11 时 need=40，成本 40*2+4*5=100 恰好用满预算）
  const B = Number(await readline());
  const C = Number(await readline());
  const F = Number(await readline());
  const U = Number(await readline());
  await readline(); // 花圃数量 n，直接用 h.length 即可
  const h = (await readline()).split(' ').map(Number);

  // 计算把所有花圃都抬高到 target 的总成本
  function cost(target) {
    let need = 0;
    for (let i = 0; i < h.length; i++) {
      if (h[i] < target) {
        need += target - h[i];
      }
    }
    const trucks = Math.ceil(need / C);
    return trucks * F + need * U
  }

  // 二分最终的最低高度，找 cost(target) <= B 的最大 target
  let ans = 0;
  let maxH = Math.floor(B / U);
  while (ans < maxH) {
    let mid = Math.ceil((ans + maxH) / 2);
    if (cost(mid) < B) {
      ans = mid;
    } else {
      maxH = mid - 1;
    }
  }
  console.log(ans);
})();
```

### 动态规划

#### 1. 砖块问题

```js
// 题目：小明在玩一个游戏，游戏中有n块砖，每块砖有一个价值，小明可以每次走1-3步，问小明在m回合内能获得的最大价值是多少

const rl = require("readline").createInterface({ input: process.stdin });
var iter = rl[Symbol.asyncIterator]();
const readline = async () => (await iter.next()).value;

void (async function () {
    // Write your code here
    const [n, m] = (await readline()).split(" ").map(Number);
    const val = (await readline()).split(" ").map(Number);
    const INF = Number.NEGATIVE_INFINITY;
    // dp[i][j]: 第 i 回合到达第 j 块砖的最大价值
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(INF));
    dp[0][0] = 0;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            let maxPrev = INF;
            for (let step = 1; step <= 3; step++) {
                const prevPos = j - step;
                if (prevPos >= 0 && dp[i - 1][prevPos] !== INF) {
                    maxPrev = Math.max(maxPrev, dp[i - 1][prevPos]);
                }
            }
            if (maxPrev !== INF) {
                dp[i][j] = maxPrev + val[j - 1];
            }
        }
    }
    let ans = INF;
    for (let i = 1; i <= m; i++) {
        if (dp[i][n] > ans) ans = dp[i][n];
    }
    console.log(ans === INF ? -1 : ans)
})();

```

#### 2. 最少插入使 T 成为子序列（LCS）

```js
// 题目：给定目标字符串 T 和源字符串 S。只能在 S 的任意位置插入字符，求最少插入多少个字符，才能使 T 成为新字符串的子序列。插入的字符必须来自 T 的字符集合。

// 整体思路：最少插入数 = |T| - LCS(T, S)
// 1. 插入不会改变 S 原有字符的相对顺序。T 成为新串子序列时，T 中被 S 原字符「就地匹配」
//    的部分必须按顺序对应相等——这正是一个公共子序列
// 2. 没被匹配的 T 字符只能靠插入补齐，插入的字符恰好就是这些字符本身
//    （天然来自 T 的字符集合，约束自动满足）
// 3. 所以让「就地匹配」部分尽量长即可：答案 = |T| - LCS(T, S)，标准二维 DP 求解

const rl = require('readline').createInterface({ input: process.stdin });
var iter = rl[Symbol.asyncIterator]();
const readline = async () => (await iter.next()).value;

void (async function () {
  // 输入格式（按需调整）：第一行 T，第二行 S
  const T = (await readline()).trim();
  const S = (await readline()).trim();

  const n = T.length,
    m = S.length;
  // dp[i][j]：T 前 i 个字符与 S 前 j 个字符的最长公共子序列长度
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (T[i - 1] === S[j - 1]) {
        // 字符相等：都退一格，LCS 长度 +1
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        // 字符不等：至少一侧的末字符不参与匹配，取两种退化中的较大者
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  console.log(n - dp[n][m]);
})();
```

### 双指针

#### 1. [三数之和](https://leetcode.cn/problems/3sum/)

```js
function threeSum(nums) {
  const result = []
  nums.sort((a, b) => a - b)
  let i = 0
  while (i < nums.length) {
    // 先对 i 去重，再计算 left/right，避免指针基于旧 i 错位
    if (i > 0 && nums[i] === nums[i - 1]) {
      i++
      continue
    }
    let left = i + 1,
      right = nums.length - 1
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
var longestPalindrome = function (s) {
  if (s.length < 2) return s

  let start = 0
  let maxLength = 1

  // 辅助函数：从中心向两边扩散
  function expandAroundCenter(left, right) {
    // 只要左右字符相等，且没越界，就继续扩
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLen = right - left + 1
      if (currentLen > maxLength) {
        maxLength = currentLen
        start = left
      }
      left--
      right++
    }
  }

  for (let i = 0; i < s.length; i++) {
    // 情况 1：回文串长度是奇数 (中心是一个字符，比如 'aba' 中的 'b')
    expandAroundCenter(i, i)

    // 情况 2：回文串长度是偶数 (中心是两个字符之间的间隙，比如 'abba' 中的 'bb')
    expandAroundCenter(i, i + 1)
  }

  return s.substring(start, start + maxLength)
}
```

#### 3. [盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/)

给定一个长度为 n 的整数数组 `height`，有 n 条垂线，第 i 条线的两个端点是 `(i, 0)` 和 `(i, height[i])`。找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水，返回最大水量。

```js
// 整体思路：双指针从两端向中间收拢
// 容量 = min(height[left], height[right]) * (right - left)，由短板和宽度共同决定
// 每次移动短板一侧：短板不动，宽度再减，容量不可能变大；移动长板才有可能遇到更高的板弥补宽度损失
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

#### 4. 两端开口水槽接雨水

```js
// 题目：一条左右两端开口的直线水槽中，从左到右有 n 块高度为 h[i] 的竖直挡板。相邻挡板间形成单位底面积槽位，雨水充足并达到稳定。求所有 n-1 个槽位中的水量之和。

// 整体思路：双指针
// 1. 稳定后第 i 个槽位（挡板 i 与 i+1 之间）的水面 = min(左侧最高挡板 max(h[0..i]), 右侧最高挡板 max(h[i+1..n-1]))
//    —— 水面若再高，就会从较矮一侧的开口溢出流走；槽底在高度 0，故水量 = 水面高度
// 2. 双指针 l、r 从两端向中间收拢，leftMax / rightMax 维护两侧已见最高挡板
// 3. 谁的 max 更小，谁那侧紧邻槽位的水面就能直接确定：
//    设 leftMax <= rightMax，则右侧链上的最高挡板 >= rightMax >= leftMax，min 必取 leftMax，
//    且右侧还有多少块挡板都不影响，可以放心结算槽位 l，然后 l 右移一格；反之结算 r 侧

const rl = require('readline').createInterface({ input: process.stdin });
var iter = rl[Symbol.asyncIterator]();
const readline = async () => (await iter.next()).value;

void (async function () {
  // 输入格式（按需调整）：第一行挡板数 n，第二行 n 块挡板高度
  const n = Number(await readline());
  const h = (await readline()).split(' ').map(Number);

  if (n < 2) {
    console.log(0);
    return;
  }

  let l = 0,
    r = n - 1,
    leftMax = h[l],
    rightMax = h[r],
    water = 0;
  // 每收缩一端就结算一端的紧邻槽位，直到两指针相遇，恰好覆盖全部 n-1 个槽位
  while (l < r) {
    if (leftMax <= rightMax) {
      // 此刻 leftMax 是 h[0..l] 的最大值，右侧最高 >= rightMax >= leftMax
      // → 槽位 l（挡板 l 与 l+1 之间）水面 = leftMax
      water += leftMax;
      l++;
      leftMax = Math.max(leftMax, h[l]);
    } else {
      // 对称：槽位 r-1 的水面 = rightMax
      water += rightMax;
      r--;
      rightMax = Math.max(rightMax, h[r]);
    }
  }
  console.log(water);
})();
```

### 贪心

#### 1. 信号站覆盖问题

```js
// 题目：一条直线上有 N 个目标点，小红可以在任意一个目标点放置信号站，覆盖与该位置距离不超过 M 的所有目标点，
// 求覆盖全部目标点最少需要多少个信号站。多个目标点可以位于同一位置。
// 输入：第一行 N、M，第二行 N 个目标点位置。样例：N=5、M=2，点为 1 3 6 8 10 → 输出 2（站放在 3 和 8）

// 整体思路：排序 + 贪心（经典「Saruman's Army」模型）
// 1. 站只能放在目标点上。排序后看最左未覆盖点 x：能覆盖 x 的站只能位于 [x, x+M] 内的目标点
//    （x 左侧的点均已覆盖，无需再为它们考虑设站）
// 2. 站的位置 p 越靠右，覆盖区间 [p-M, p+M] 的右端越远，而左端 p-M ≤ x 依然罩得住 x
//    → 把站放在 [x, x+M] 内最右侧的目标点上，新覆盖的点不会少于任何其他放法（交换论证可证最优）
// 3. 跳过该站已覆盖的点（位置 ≤ p+M），对下一个未覆盖点重复上述过程，直到覆盖所有点

const rl = require('readline').createInterface({ input: process.stdin })
var iter = rl[Symbol.asyncIterator]()
const readline = async () => (await iter.next()).value

void (async function () {
  const [n, M] = (await readline()).split(' ').map(Number)
  const points = (await readline()).split(' ').map(Number).sort((a, b) => a - b)

  let i = 0
  let count = 0
  while (i < n) {
    // x：当前最左未覆盖点，放站的候选范围是 [x, x+M]
    const x = points[i]
    // 第一轮右移：越过所有 ≤ x+M 的点，i-1 即 [x, x+M] 内最右的目标点，站放这里
    while (i < n && points[i] <= x + M) {
      i++
    }
    const p = points[i - 1]
    count++
    // 第二轮右移：跳过该站覆盖的所有点（与 p 距离不超过 M）
    while (i < n && points[i] <= p + M) {
      i++
    }
  }
  console.log(count)
})()
```

#### 2. 最少跳跃次数

```js
// 给出一个非负整数数组，每个元素代表你在该位置最大可以向右跳跃的步数。初始位置在数组的第一个下标（索引 0）处。目标是用最少的跳跃次数到达数组的最后一个位置。假设你总是可以到达最后一个位置。
// 输入描述：第一行输入一个整数 N ，表示数组长度。第二行输入 N 个以空格分隔的非负整数，表示每个位置的最大跳跃距离。
// 输出描述：输出一个整数，表示到达最后一个位置所需的最少跳跃次数。

const rl = require('readline').createInterface({ input: process.stdin })
var iter = rl[Symbol.asyncIterator]()
const readline = async () => (await iter.next()).value

void (async function () {
  const n = parseInt(await readline());
  const arr = (await readline()).split(' ').map(Number);
  if (n <= 1) {
    console.log(0);
    return;
  }

  let maxReach = 0;
  let currentEnd = 0;
  let steps = 0;

  for (let i = 0; i < n - 1; i++) {
    maxReach = Math.max(maxReach, i + arr[i]);

    if (i === currentEnd) {
      steps++;
      currentEnd = maxReach;

      if (currentEnd >= n - 1) {
        break;
      }
    }
    console.log(steps);
  }
})()
```

#### 3. 活动安排问题

```js
// 题目：小红负责一块活动场地，候选活动各自占用一个半开时间段 [si, ei)。同一时刻场地最多安排一个活动；
// 若一个活动的结束时间等于另一个活动的开始时间，两者可以连续举行。求一天最多能安排多少个活动。
// 输入：第一行 n，接下来 n 行每行 si ei。样例：4 个活动 1 2 / 2 3 / 3 4 / 2 5 → 输出 3（选 [1,2) [2,3) [3,4) 连续举行）

// 整体思路：按结束时间排序 + 贪心（经典「活动安排」模型）
// 1. 半开区间 [s, e) 且「结束=开始可连续」→ 下一个活动的选中条件是 s >= lastEnd（写成 s > lastEnd 会漏掉首尾相接的方案）
// 2. 每次优先选「结束最早」的活动：它给后续活动留出的剩余时间最多，选它不会比选其他更差（交换论证可证最优）
// 3. 排序后扫一遍，能接上就选并更新 lastEnd，计数即为答案

const rl = require('readline').createInterface({ input: process.stdin })
var iter = rl[Symbol.asyncIterator]()
const readline = async () => (await iter.next()).value

void (async function () {
  const n = Number(await readline())
  const acts = []
  for (let i = 0; i < n; i++) {
    const [s, e] = (await readline()).split(' ').map(Number)
    acts.push([s, e])
  }

  // 按结束时间升序；结束相同再按开始时间升序（保证 [3,5) 排在 [5,5) 前，零长度活动不挤掉更早开始的活动）
  acts.sort((a, b) => a[1] - b[1] || a[0] - b[0])

  let count = 0
  let lastEnd = -Infinity
  for (const [s, e] of acts) {
    // s === lastEnd 时上一场恰好结束，场地已空，可以直接开始
    if (s >= lastEnd) {
      count++
      lastEnd = e
    }
  }
  console.log(count)
})()
```

### ES6新特性

#### 1. 将数字转换为千分位格式

如 `123456789` 转换为 `123,456,789`，保留两位小数

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

// 改造版本
function formatNumber(num) {
  // 1. 严格校验：如果不是有效数字，直接返回 '-'
  if (typeof num !== 'number' || isNaN(num)) {
    return '-'
  }

  // 2. 核心改造：利用 Math.round 进行真正的四舍五入（放大100倍再缩小100倍）
  //    这样可以确保无论原始数字有几位小数，都会被规整为最多 2 位小数
  let roundedNum = Math.round(num * 100) / 100
  // 3. 转为字符串，开始切分整数和小数
  let str = roundedNum.toString()

  // 这一步可以直接替代2和3步骤
  // let str = num.toFixed(2)

  let [integer, decimal = ''] = str.split('.')

  // 4. 补齐小数位：因为上面处理后，decimal 最长也就是2位，所以 padEnd 补零后直接用就行
  decimal = decimal.padEnd(2, '0')

  // 5. 千分位核心逻辑（保持原汁原味）
  let result = [],
    count = 0
  for (let i = integer.length - 1; i >= 0; i--) {
    // 照顾负数的情况：如果是负号，不参与千分位计数，直接放进去并结束循环
    if (integer[i] === '-') {
      result.unshift('-')
      break
    }

    count++
    result.unshift(integer[i])
    if (count % 3 === 0 && i !== 0) {
      result.unshift(',')
    }
  }

  return `${result.join('')}.${decimal}`
}
```
