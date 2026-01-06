import { type RouteConfig, index} from "@react-router/dev/routes";
import {route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/auth", "routes/auth.tsx"),
    route("/plans", "routes/plans.tsx"),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/resumes', 'routes/resumes.tsx'),
    // route('/editor/:id?', 'routes/editor.tsx'), // Temporarily disabled - Create Resume feature
    route('/wipe', 'routes/wipe.tsx'),
    // Catch-all for .well-known and other special routes
    route('/.well-known/*', 'routes/well-known.tsx'),
] satisfies RouteConfig;
