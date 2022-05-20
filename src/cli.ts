import path from "node:path";
import {readFileContent} from "./utils";
import {parseTtf} from "./index";

const font1 = path.resolve(__dirname, '../assets/fonts/ShouXieTi.ttf')
const font2 = path.resolve(__dirname, '../assets/fonts/DIN_Alternate_Bold.ttf')
const font3 = path.resolve(__dirname, '../assets/fonts/min.ttf')

readFileContent(font3).then(data => {
    const fontObject = parseTtf(data)
    // console.log(fontObject)
    console.log(fontObject.directory)
    // console.log(fontObject.tables.glyf)
    console.log(fontObject.tables.loca)
    // console.log(fontObject.tables.head)
    // console.log(fontObject.tables.hhea)
    // console.log(fontObject.tables.hmtx)
    // console.log(fontObject.tables.maxp)
    // console.log(fontObject.tables.name)
    console.log(fontObject.tables.cmap?.subtables)
    // console.log(fontObject.tables.glyf?.entries[1])
    console.log(fontObject.tables.cmap?.subtables.filter(s => s.format === 4)[0]._data)
    console.log(fontObject.tables.cmap?.subtables.filter(s => s.format === 12)[1]._data)
})
