import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router'],
    exclude: ['@vercel/node'],
  },
  ssr: {
    noExternal: ['zustand'],
  },
  plugins: [
    tailwindcss(), 
    reactRouter(), 
    tsconfigPaths(),
    // Custom plugin to handle API routes during development
    {
      name: 'api-routes',
      configureServer(server) {
        // Return middleware to run BEFORE internal middlewares
        server.middlewares.use(async (req, res, next) => {
          // Only handle API routes
          if (!req.url?.startsWith('/api/')) {
            return next();
          }

            try {
              // Map URL to file path
              const apiPath = req.url.split('?')[0];
              const relativePath = `./api${apiPath.replace('/api', '')}.ts`;
              
              // Load module using Vite's SSR loader (handles TS, imports, etc.)
              const module = await server.ssrLoadModule(relativePath);
              const handler = module.default;

              if (typeof handler !== 'function') {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid API handler' }));
                return;
              }

              // Create mock Vercel request object
              const vercelReq: any = {
                method: req.method,
                url: req.url,
                headers: req.headers,
                query: {},
                body: null,
              };

              // Parse query string
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              urlObj.searchParams.forEach((value, key) => {
                vercelReq.query[key] = value;
              });

              // For POST/PUT/PATCH requests, read the body
              if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                  chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'latin1') : chunk);
                }
                const bodyBuffer = Buffer.concat(chunks);
                
                // Check content type to decide how to parse
                const contentType = req.headers['content-type'] || '';
                
                if (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream')) {
                  // For binary data, keep as Buffer
                  vercelReq.body = bodyBuffer;
                } else {
                  // For JSON/text, convert to string and try to parse
                  const bodyString = bodyBuffer.toString('utf8');
                  try {
                    vercelReq.body = bodyString ? JSON.parse(bodyString) : null;
                  } catch {
                    vercelReq.body = bodyString;
                  }
                }
              }

              // Create mock Vercel response object
              const vercelRes: any = {
                statusCode: 200,
                status: (code: number) => {
                  vercelRes.statusCode = code;
                  res.statusCode = code;
                  return vercelRes;
                },
                json: (data: any) => {
                  if (!res.writableEnded) {
                    res.statusCode = vercelRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  }
                  return vercelRes;
                },
                send: (data: any) => {
                  if (!res.writableEnded) {
                    res.statusCode = vercelRes.statusCode;
                    res.end(data);
                  }
                  return vercelRes;
                },
                redirect: (codeOrUrl: number | string, url?: string) => {
                  if (!res.writableEnded) {
                    // Handle both redirect(url) and redirect(code, url)
                    if (typeof codeOrUrl === 'string') {
                      // redirect(url) - default to 302
                      res.statusCode = 302;
                      res.setHeader('Location', codeOrUrl);
                    } else {
                      // redirect(code, url)
                      res.statusCode = codeOrUrl;
                      res.setHeader('Location', url || '/');
                    }
                    res.end();
                  }
                  return vercelRes;
                },
                setHeader: (name: string, value: string) => {
                  if (!res.headersSent) {
                    res.setHeader(name, value);
                  }
                  return vercelRes;
                },
                getHeader: (name: string) => {
                  return res.getHeader(name);
                },
              };

              // Execute the handler
              await handler(vercelReq, vercelRes);

              // If handler didn't send a response, send empty 200
              if (!res.writableEnded) {
                res.statusCode = vercelRes.statusCode || 200;
                res.end();
              }
            } catch (error) {
              console.error('API route error:', error);
              if (!res.writableEnded) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  error: 'Internal server error',
                  message: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined
                }));
              }
            }
        });
      },
    },
  ],
});
