// // 请求日志打印
// export default defineEventHandler(async event => {
//   const cookies = parseCookies(event)
//   const path = getRequestPath(event)
//   const method = getMethod(event)
//   if (method === 'GET') {
//     const query = await getQuery(event)
//   } else if (method === 'POST') {
//     const body = await readBody(event)
//   }
//   // console.log({
//   //   method,
//   //   path,
//   //   cookies,
//   //   query,
//   //   body
//   // })
// })
