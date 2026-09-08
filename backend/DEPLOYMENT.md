# RN Mall 移动 API 部署

移动端 API 的公网基础地址为 `https://api.rn-mall.com/mobile/v1`。Node 服务本身只监听内网 `127.0.0.1:4000`，由反向代理负责 TLS 与公网流量。

## 必需配置

- `NODE_ENV=production`
- `MOBILE_API_TOKEN_SECRET`：至少 32 个字符的随机密钥，仅保存在部署平台的密钥管理中。
- 可选 `BACKEND_HOST` 与 `BACKEND_PORT`：默认分别为 `127.0.0.1` 与 `4000`。
- 仅当可信反向代理已设置客户端地址头时，设置 `TRUST_PROXY=true`。

服务命令：`pnpm backend`。健康检查：`GET /health`。

## Docker Compose（推荐）

在服务器的仓库根目录创建未提交的 `.env`，只包含 `MOBILE_API_TOKEN_SECRET`。使用 `openssl rand -base64 48` 生成它，然后运行 `docker compose up -d --build`。Compose 不发布 API 的 4000 端口；Caddy 仅暴露 80/443 并自动申请 TLS 证书。

## Nginx 示例

```nginx
server {
  listen 443 ssl http2;
  server_name api.rn-mall.com;

  location = /health {
    proxy_pass http://127.0.0.1:4000;
  }

  location /mobile/v1/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / { return 404; }
}
```

证书、DNS 与 HTTP 到 HTTPS 跳转由基础设施负责。不可将 `MOBILE_API_TOKEN_SECRET`、Nuxt BFF 服务凭证或任何演示以外的用户密码写入仓库。
