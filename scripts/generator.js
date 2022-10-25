import fs from "fs";
import path from "path";

import {parseXml} from "@rgrove/parse-xml";

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const files = {

};

// alias for icon name
const iconNames = {
  'addchart': 'add_chart',
}

const filteredTheme = {
  'outlined': true,
  'filled': true
}
const filterCategoryList = ['content', 'Android', 'editor', 'file', "Text Formatting", "Photo\u0026Image", 'action', 'navigation', "Common actions"]

// how to get material icon list 
// https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true
function getMaterialIconList() {
  const iconJSON = JSON.parse(fs.readFileSync("./data/icon.json", { encoding: 'utf8' }));

  const list = iconJSON.icons.filter(it => it.categories.some(c => filterCategoryList.includes(c)));

  return list.map(it => {

    const name = it.name;
    const key = iconNames[name] || name;

    files[name] = true;
    return {
      name: key,
      originName: name,
      categories: it.categories,
    }
  });
}


getMaterialIconList();


const ROOT_DIR = "./node_modules/@material-design-icons/svg";
const SRC_DIR = "./src";
const TEMPLATE_DIR = "./template";

const ICONS_DIR = SRC_DIR + "/icons"
const ICONS_ROOT_DIR = TEMPLATE_DIR + "/root_icons"


function umdTemplate(fullName, json) {
  return `(function(e,n){typeof exports=="object"&&typeof module!="undefined"?module.exports=n(require("@elf-framework/sapa"),require("../components/SvgIcon")):typeof define=="function"&&define.amd?define(["@elf-framework/sapa","../components/SvgIcon"],n):(e=typeof globalThis!="undefined"?globalThis:e||self,e["icons/${fullName}"]=n(e.sapa,e.SvgIcon))})(this,function(e,n){"use strict";const t=(c={})=>n.SvgIcon(${json},c);return t.displayName="${fullName}",t});`
}

function declarationTS(fullName, json) {
  return `
  // GENERATE BY ./scripts/generator.js
  // DON NOT EDIT IT MANUALLY    
  import {UIElement} from '@elf-framework/sapa';

  interface ${fullName}Props {
    fill: "currentColor" | string;
    width: number;
    height: number;
    stroke: "currentColor" | string;
    strokeWidth: number;
  }
  
  export default class ${fullName} extends UIElement {
      props: ${fullName}Props;
  };
  `
}

function rootDeclarationTS(fullName, json) {
  return `
  export { default } from "./esm/icons/${fullName}";
  `
}

function srcTemplate(fullName, json) {
  return `
// GENERATE BY ./scripts/generator.js
// DON NOT EDIT IT MANUALLY  
import {SvgIcon} from "../components/SvgIcon";

const  ${fullName} = (props = {}) => {
    return SvgIcon(${json}, props);
}

${fullName}.displayName = "${fullName}";

export default ${fullName};
          `;
}

function rootSrcTemplate(fullName, json) {
  return `
  export { default } from "./esm/icons/${fullName}";
          `;
}

const rootFiles = []

console.time("generate");

function makeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

}

function elementToAbstractNode(el) {
  const { name: tag, attributes = {}, children } = el;

  return { tag, attributes: { ...attributes }, children: children.map(elementToAbstractNode) }
}

const indexFiles = [];

fs.readdirSync(ROOT_DIR, { withFileTypes: true })
  .filter((dir) => dir.isDirectory())
  .forEach((dir) => {
    //   const local = path.join(ROOT_DIR, dir);

    const theme = dir.name;

    if (!filteredTheme[theme]) {
      return;
    }

    const localDir = path.join(ROOT_DIR, dir.name);
    const srcDir = path.join(ICONS_DIR);
    const srcRootDir = path.join(ICONS_ROOT_DIR);


    rootFiles.push(dir.name);

    let typeName = capitalizeFirstLetter(dir.name);
    typeName = typeName
      .split("-")
      .map((it) => capitalizeFirstLetter(it))
      .join("");

    makeDirectory(srcDir);
    makeDirectory(srcRootDir);


    const localList = fs.readdirSync(localDir);


    localList.forEach((file) => {
      let filename = file.replace(".svg", "");
      let componentName = filename;

      if (/^[0-9]/.test(filename.charAt(0))) {
        componentName = "N" + filename;
      }
      // console.log(filename);

      if (!files[filename]) {
        return;
      }


      const sourceFile = path.join(localDir, file);

      // alias 적용 
      componentName = iconNames[componentName] || componentName;      

      const targetFileName = componentName
        .split(/[_-]/g)
        .map((it) => capitalizeFirstLetter(it))
        .join("");
      const iconName = targetFileName + typeName;

      const targetFile = path.join(srcDir, iconName + ".jsx");
      const targetFileTS = path.join(srcDir, iconName + ".d.ts");
      const targetRootFile = path.join(srcRootDir, iconName + ".js");
      const targetRootFileTS = path.join(srcRootDir, iconName + ".d.ts");

      const source = fs.readFileSync(sourceFile, "utf8");

      // create data 
      const json = elementToAbstractNode(parseXml(source)).children[0];
      const data = JSON.stringify({
        name: targetFileName,
        theme,
        icon: json
      });

      // source 
      const template = srcTemplate(iconName, data);
      fs.writeFileSync(targetFile, template);

      const dts = declarationTS(iconName, data);
      fs.writeFileSync(targetFileTS, dts);

      const rootTemplate = rootSrcTemplate(iconName, data);
      fs.writeFileSync(targetRootFile, rootTemplate);      

      const rootDts = rootDeclarationTS(iconName, data);
      fs.writeFileSync(targetRootFileTS, rootDts);            


      indexFiles.push(`export { default as ${iconName} } from "./${iconName}";`);
    });

  });

fs.writeFileSync(SRC_DIR + "/icons/index.js", indexFiles.join("\n") + "\n");


console.timeEnd("generate");