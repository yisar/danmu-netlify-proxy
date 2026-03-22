// netlify/functions/proxy.js
const TARGET_URL = "https://www.calibur.cn";

// Netlify Functions 的主处理函数
export default async (req, context) => {
  try {
    // 1. 解析原始请求的路径和查询参数
    // 提取路径（去掉 /.netlify/functions/proxy 前缀）
    const pathname = req.url.replace(/^\/\.netlify\/functions\/proxy/, "") || "/";
    // 提取查询参数
    const searchParams = new URL(req.url, `http://${req.headers.host}`).search;
    const targetPath = pathname + searchParams;
    console.log("转发路径:", targetPath);
    
    const fullTargetUrl = new URL(targetPath, TARGET_URL);

    // 2. 构建转发请求头（过滤掉 Netlify 内部头，避免冲突）
    const forwardHeaders = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      // 排除 Netlify 特定头和 hop-by-hop 头
      if (!["host", "connection", "x-nf-request-id"].includes(key.toLowerCase())) {
        forwardHeaders[key] = value;
      }
    });

    // 3. 构建转发请求
    const proxyReqOptions = {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : null,
      redirect: "follow",
    };

    // 4. 转发请求到目标服务器
    const response = await fetch(fullTargetUrl.toString(), proxyReqOptions);

    // 5. 构建响应（处理跨域和响应头）
    const responseHeaders = new Headers(response.headers);
    // 解决跨域问题
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // 6. 返回最终响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    // 错误处理：返回 500 响应
    console.error("代理请求失败:", error);
    return new Response(`代理请求失败: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

// 处理 OPTIONS 预检请求（跨域必备）
export const config = {
  path: "/*", // 匹配所有路径
  method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 支持的请求方法
};
