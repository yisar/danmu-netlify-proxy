export default async (req, context) => {
  const url = new URL(req.url);
  
  // 1. 域名重定向逻辑
  if (url.host === 'ixipi.net') {
    return Response.redirect("https://www.ixipi.net", 301);
  }
  if (url.host === 'danmu.me') {
    return Response.redirect("https://www.danmu.me", 301);
  }

  const targetBase = "http://114.67.203.179:4000";
  const targetUrl = targetBase + url.pathname + url.search;

  // 判定内容类型
  let contentType = url.pathname.includes('.js') 
    ? 'application/javascript; charset=utf-8' 
    : url.pathname.includes('.css') 
      ? 'text/css' 
      : 'text/html';

  // 2. 静态资源与特定路径逻辑 (使用 Streaming 转发)
  if (['/', '/sponsor', '/login', '/register'].includes(url.pathname)
    || /^\/(uu|pub|assets|play)\//.test(url.pathname)) {
    
    const resp = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": contentType,
        "Token": req.headers.get('Token') || '',
        "Origin": req.headers.get('Origin') || '',
      },
      body: req.body
    });

    return new Response(resp.body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } 
  
  // 3. 其他请求逻辑 (获取文本后再返回)
  else {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get('Content-Type') || '',
        "Token": req.headers.get('Token') || '',
        "Origin": req.headers.get('Origin') || '',
      },
      body: req.body
    });

    const ret = await res.text();
    console.log(ret);

    return new Response(ret, {
      headers: {
        "Content-Type": res.headers.get('Content-Type') || 'text/plain',
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
};

// 配置路由：匹配所有路径
export const config = { path: "/*" };
