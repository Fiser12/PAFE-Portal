const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Proxy para las APIs de autenticación móvil
      if (req.url.startsWith("/api")) {
        const proxy = createProxyMiddleware({
          target: "http://localhost:3000",
          changeOrigin: true,
          logLevel: "debug",
        });
        return proxy(req, res, next);
      }

      return middleware(req, res, next);
    };
  },
};

module.exports = config;
