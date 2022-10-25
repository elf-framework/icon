import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    jsxFactory: "createElementJsx",
    jsxFragment: "FragmentInstance",
    jsxInject: `import { createElementJsx } from "@elf-framework/sapa"`,
  },
  build: {
    emptyOutDir: false,
    minify: true,
    lib: {
      entry: {
        "components/SvgIcon" : "src/components/SvgIcon.jsx",
        "icons/AbcFilled" : "src/icons/AbcFilled.jsx",
      },
      name: "icon",
      manifest: true,
      formats: ["esm"],
      fileName: (format, ...args) => {
        return `${format}/[name].js`
      }
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["@elf-framework/sapa"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@elf-framework/sapa": "sapa",
        },
      },
    },
  },
});
