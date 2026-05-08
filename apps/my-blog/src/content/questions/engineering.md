---
title: '前端工程化面试题'
description: 'git merge/rebase、原子性提交、peerDependencies、pnpm'
querys: ['git', 'merge', 'rebase', '原子性提交', 'peerDependencies', 'pnpm', '包管理器']
---

## 前端工程化面试题

### git merge 和 git rebase

#### 使用场景

`merge` 命令一般用于将开发分支、热修复分支等合并到主分支上，因为该命令`不会修改分支的历史信息`，只会增加新节点，非常适合`主分支`这种`稳定性`且需要用于版本控制的分支上。

`rebase` 命令一般用于将主分支的新提交记录，合并到正在进行开发任务或修复任务的分支上，因为该命令能保证开发分支的历史与主分支的历史保持一致，从而减少污染性。

#### 操作步骤

1. 通过`git stash`，将自己开发分支的代码保存到暂存区中，恢复本地仓库到修改前的状态
2. `git checkout master`进入主分支，`git pull`拉取 master 的最新 commits（提交记录）
3. `git checkout myDev`进入开发分支，通过`git rebase master`将 master 最新的提交，合并到自己的开发分支上，保证该分支的历史提交与 master 相同
4. `git stash pop`将自己的修改取出；`git commit` `git push`提交到远程开发分支上
5. 切换到 master 分支下，然后发起 `git merge myDev` 请求，将分支 myDev 合并到 master 分支

### 原子性提交（Atomic Commit）

原子性提交（Atomic Commit）是指在版本控制系统（如 Git）中，每次提交只做一件独立且完整的事情。这样做的好处包括：

1. 提高代码回溯和回滚的可读性和可操作性；
2. 便于代码审查（review），每次 review 的内容聚焦于单一功能或修复；
3. 降低合并冲突的复杂度；
4. 方便定位和修复 bug。

**原子性提交的最佳实践：**

- 每次提交只包含一个功能、修复或重构；
- 提交信息要简明扼要，准确描述本次提交的内容；
- 避免将无关的更改混合在同一次提交中。

### peerDependencies（对等依赖）

peerDependencies（对等依赖）是 npm 包中的一个字段，用于声明你的包在运行时需要哪些"宿主"环境下的依赖包，但这些依赖包并不会被自动安装。

**主要作用：**

1. 告诉使用者：你的包需要哪些依赖，并且这些依赖应该由使用者的项目来提供，而不是你的包自己安装。
2. 解决多个包依赖同一个库但版本不一致时可能出现的冲突问题，确保项目中只存在一份依赖。

**典型场景：**

- 前端组件库通常会将 React、Vue 等核心库声明为 peerDependencies，避免多份副本导致运行时冲突。

**示例（package.json）：**

```js
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

**注意事项：**

- peerDependencies 不会被自动安装（npm7 之前），需要开发者手动安装。
- 如果缺失 peerDependencies，npm/yarn 会有警告提示。

### pnpm 速度优势

pnpm 相比 npm、yarn 等包管理器速度更快，主要原因有以下几点：

1. **硬链接与内容寻址存储（Content-addressable storage）：**

   - pnpm 安装依赖时，会将所有包下载到全局的 store 目录（如 ~/.pnpm-store），
   - 项目 node_modules 目录下只创建硬链接（hard link）指向全局 store 的真实文件。
   - 这样多个项目间可以共享依赖，避免重复下载和占用磁盘空间，极大提升安装速度。

2. **严格的 node_modules 结构（扁平但隔离）：**

   - pnpm 采用类似虚拟文件系统的 node_modules 结构，保证依赖隔离且查找高效，
   - 避免 npm、yarn 传统嵌套结构下的重复安装和查找性能问题。

3. **并行下载与高效缓存：**

   - pnpm 支持依赖的并行下载和解压，充分利用带宽和多核 CPU 资源。
   - 已下载的包会被缓存到本地 store，后续安装时无需重新下载。

4. **更少的磁盘占用：**

   - 由于依赖包只存储一份，多个项目间通过硬链接共享，极大减少磁盘空间浪费。

5. **安装流程优化：**
   - pnpm 安装流程经过高度优化，依赖解析、下载、链接等步骤效率更高。

**总结：** pnpm 通过"全局内容寻址存储 + 硬链接 + 并行下载 + 高效缓存"等机制，实现了比 npm、yarn 更快的依赖安装速度和更低的磁盘占用，非常适合大型 monorepo 或多项目场景。
