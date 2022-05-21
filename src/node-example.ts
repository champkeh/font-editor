import path from "path"
import fs, {PathLike} from 'fs'
import {FileBuffer} from "./adapter/node"
import {parseTtf} from "./core"

/**
 * 读取文件内容
 * @param path
 */
function readFileContent(path: PathLike | number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const buf = fs.readFileSync(path)
            resolve(buf)
        } catch (e) {
            reject(e)
        }
    })
}


const font1 = path.resolve(__dirname, '../assets/fonts/ShouXieTi.ttf')
const font2 = path.resolve(__dirname, '../assets/fonts/DIN_Alternate_Bold.ttf')
const font3 = path.resolve(__dirname, '../assets/fonts/min.ttf')

readFileContent(font3).then(data => {
    const fontObject = parseTtf(new FileBuffer(data))
    // console.log(fontObject)
    console.log(fontObject.directory)
    // console.log(fontObject.tables.glyf)
    // console.log(fontObject.tables.loca)
    // console.log(fontObject.tables.head)
    // console.log(fontObject.tables.hhea)
    // console.log(fontObject.tables.hmtx)
    // console.log(fontObject.tables.maxp)
    // console.log(fontObject.tables.name)
    // console.log(fontObject.tables.cmap?.subtables)
    // console.log(fontObject.tables.glyf?.entries[1])
    // console.log(fontObject.tables.cmap?.subtables.filter(s => s.format === 4)[0]._data)
    // console.log(fontObject.tables.cmap?.subtables.filter(s => s.format === 12)[1]._data)
})
