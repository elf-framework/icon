import { build } from "vite";
import path from "path";
import fs from "fs"

; (async () => {



    const ROOT_DIR = path.resolve("./src/icons/");
    const INDEX_FILE = path.resolve("./src/icons/index.js");
    const TARGET_INDEX_FILE = path.resolve("./dist/esm/icons/index.js");
    // const files = [];
    
    let files = fs.readdirSync(ROOT_DIR)

    files = files.filter((file) => file !== "index.js" && !file.includes(".d.ts")).map(it => {
        return { name: `icons/${it.replace(".jsx", "")}`, file: `icons/${it}` };
    });

    files.push({ name: 'components/SvgIcon', file: 'components/SvgIcon.jsx' });
    // files.push({ name: 'icons/index', file: 'icons/index.js' })

    // // const input = {}
    const libs = files;

    await libs.forEach(async (item) => {

        await build({
            root: ".",
            esbuild: {
                jsxFactory: "createElementJsx",
                jsxFragment: "FragmentInstance",
                jsxInject: `import { createElementJsx } from "@elf-framework/sapa"`,
            },

            build: {
                emptyOutDir: false,
                minify: false,
                lib: {
                    entry: `./src/${item.file}`,
                    name: item.name,
                    formats: ["umd", "esm"],
                    fileName: (format) => {
                        return `${format}/${item.name}.js`
                    },
                },
                rollupOptions: {
                    // input,
                    // make sure to externalize deps that shouldn't be bundled
                    // into your library
                    external: [
                        "../components/SvgIcon",
                        "@elf-framework/sapa"
                    ],
                    output: {
                        // entryFileNames: '[format]/[name].js',
                        // Provide global variables to use in the UMD build
                        // for externalized deps
                        globals: {
                            "../components/SvgIcon": "SvgIcon",
                            "@elf-framework/sapa": "sapa",
                        },
                    },
                },
            },
        })
    })
})()
