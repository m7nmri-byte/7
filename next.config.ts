import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // صفحات هذا الموقع كلها معرّفة في الكود وتُولَّد ثابتة،
  // فلا حاجة للتوليد الجزئي — وإطفاؤه يعيد رمز 404 الصحيح للمسارات المجهولة.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
