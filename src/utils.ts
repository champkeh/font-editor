import type {PathLike} from 'node:fs'
import fs from 'node:fs'
import {DirectoryEntry, NameRecord} from "../types/ParsedFont";
import moment from "moment";


/**
 * 读取文件内容
 * @param path
 */
export function readFileContent(path: PathLike | number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const buf = fs.readFileSync(path)
            resolve(buf)
        } catch (e) {
            reject(e)
        }
    })
}

/**
 * 字体文件偏移对象
 */
const FileOffset = {
    value: 0,
}

/**
 * 设置文件偏移
 * @param offset 文件偏移
 */
export function setFileOffset(offset: number) {
    FileOffset.value = offset
}

/**
 * 重置文件偏移
 */
export function resetFileOffset() {
    setFileOffset(0)
}

/**
 * 获取当前文件偏移
 */
export function getFileOffset() {
    return FileOffset.value
}

export function readBuffer(data: Buffer, len: number): Buffer {
    const buf = data.slice(FileOffset.value, FileOffset.value + len)
    FileOffset.value += len
    return buf
}

export function checkFileOffset(table: DirectoryEntry, prev: DirectoryEntry) {
    if (FileOffset.value !== table.offset) {
        throw new Error(`
解析'${table.tag}'表时文件偏移不正确！
期望偏移:${table.offset}, 实际偏移:${FileOffset.value}
最后解析的表为'${prev.tag}'
`)
    }
}

export function readUInt32BE(data: Buffer): number {
    const value = data.readUInt32BE(FileOffset.value)
    FileOffset.value += 4
    return value
}

export function readInt32BE(data: Buffer): number {
    const value = data.readInt32BE(FileOffset.value)
    FileOffset.value += 4
    return value
}

export function readUInt16BE(data: Buffer): number {
    const value = data.readUInt16BE(FileOffset.value)
    FileOffset.value += 2
    return value
}

export function readInt16BE(data: Buffer): number {
    const value = data.readInt16BE(FileOffset.value)
    FileOffset.value += 2
    return value
}

export function readBigInt64BE(data: Buffer): number {
    const value = data.readBigInt64BE(FileOffset.value)
    FileOffset.value += 8
    return Number(value)
}

export function readFWord(data: Buffer): number {
    return readInt16BE(data)
}

export function readUFWord(data: Buffer): number {
    return readUInt16BE(data)
}

export function readLongDateTime(data: Buffer): string {
    const seconds = readBigInt64BE(data)
    return moment("1904-01-01").add(seconds, 's').format()
}

/**
 * 解析 'name' 表中的 name 字符串
 * @param data
 * @param record
 */
export function parseNameString(data: Buffer, record: NameRecord): [string, string] {
    // 目前只解析 Macintosh 平台
    if (record.platformID !== 1) {
        return ['not implemented', 'none']
    }

    return [data.toString('ascii'), nameDescMap[record.nameID as keyof typeof nameDescMap]]
}

const nameDescMap = {
    0: 'Copyright',
    1: 'Family',
    2: 'Style',
    3: 'Unique',
    4: 'Full',
    5: 'Version',
    6: 'PostScript',
    7: 'Trademark',
    8: 'Manufacturer',
    9: 'Designer',
    10: 'Description',
    11: 'VendorURL',
    12: 'DesignerURL',
    13: 'License',
    14: 'LicenseURL',
    15: 'Reserved',
    16: 'Preferred Family',
    17: 'Preferred Style',
    18: 'Compatible Full',
    19: 'Sample text',
    20: 'Defined by OpenType',
    21: 'Defined by OpenType',
    22: 'Defined by OpenType',
    23: 'Defined by OpenType',
    24: 'Defined by OpenType',
    25: 'Variations PostScript Name Prefix',
}
