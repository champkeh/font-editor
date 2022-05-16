import path from "node:path";
import {readFileContent} from "./utils";
import {parseTtf} from "./index";

const font1 = path.resolve(__dirname, '../assets/fonts/ShouXieTi.ttf')
const font2 = path.resolve(__dirname, '../assets/fonts/DIN_Alternate_Bold.ttf')
const font3 = path.resolve(__dirname, '../assets/fonts/min.ttf')

readFileContent(font3).then(data => {
    const fontObject = parseTtf(data)
    console.log(fontObject)
    console.log(fontObject.tables.loca)
})
