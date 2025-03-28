// 需要缓存的接口
export const cachedApiConfig: CachedApiConfig[] = [
  {
    url: "/api/demos",
    filePath: "/src/server/data/demos.js",
    noCache: true,
  },
  {
    url: "/api/questions",
    filePath: "/src/server/data/questions.js",
    noCache: true,
  },
];
