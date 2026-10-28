import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lessons are read from the filesystem at runtime; make sure they ship with the page.
  outputFileTracingIncludes: {
    "/courses/[slug]/modules/[order]": ["./content/courses/*/lessons/*.md"],
  },
};

export default nextConfig;
