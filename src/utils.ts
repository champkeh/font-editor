import type {PathLike} from 'node:fs'
import fs from 'node:fs'
import moment from "moment"
import {DirectoryEntry, NameRecord} from "../types/ParsedFont"
import {
    UnicodeEncodingIDMap,
    MacintoshEncodingIDMap,
    WindowsEncodingIDMap,
    PlatformIDMap,
    WindowsLanguageIDMap, MacintoshLanguageIDMap, NameIDMap
} from './map'


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

/**
 * 从当前偏移处读取指定长度的buf
 * @param data 原始数据
 * @param len 字节数
 */
export function readBuffer(data: Buffer, len: number): Buffer {
    const buf = data.slice(FileOffset.value, FileOffset.value + len)
    FileOffset.value += len
    return buf
}

/**
 * 从当前偏移处读取一个 uint32 值
 * @param data 原始数据
 */
export function readUInt32BE(data: Buffer): number {
    const value = data.readUInt32BE(FileOffset.value)
    FileOffset.value += 4
    return value
}

/**
 * 从当前偏移处读取一个 int32 值
 * @param data 原始数据
 */
export function readInt32BE(data: Buffer): number {
    const value = data.readInt32BE(FileOffset.value)
    FileOffset.value += 4
    return value
}

/**
 * 从当前偏移处读取一个 uint16 值
 * @param data 原始数据
 */
export function readUInt16BE(data: Buffer): number {
    const value = data.readUInt16BE(FileOffset.value)
    FileOffset.value += 2
    return value
}

/**
 * 从当前偏移处读取一个 int16 值
 * @param data 原始数据
 */
export function readInt16BE(data: Buffer): number {
    const value = data.readInt16BE(FileOffset.value)
    FileOffset.value += 2
    return value
}

/**
 * 从当前偏移处读取一个 int64 值
 * @param data 原始数据
 */
export function readBigInt64BE(data: Buffer): number {
    const value = data.readBigInt64BE(FileOffset.value)
    FileOffset.value += 8
    return Number(value)
}

/**
 * 从当前偏移处读取一个 FWord 值
 * @param data 原始数据
 */
export function readFWord(data: Buffer): number {
    return readInt16BE(data)
}

/**
 * 从当前偏移处读取一个 UFWord 值
 * @param data 原始数据
 */
export function readUFWord(data: Buffer): number {
    return readUInt16BE(data)
}

/**
 * 从当前偏移处读取一个 LongDateTime 值
 * @param data 原始数据
 */
export function readLongDateTime(data: Buffer): string {
    const seconds = readBigInt64BE(data)
    return moment("1904-01-01").add(seconds, 's').format()
}

/**
 * 解析 'name' 表中的 name 字符串
 * @param data
 * @param record
 */
export function parseNameStringInPlace(data: Buffer, record: NameRecord) {
    // 解析 platformID
    record._platform = PlatformIDMap[record.platformID] || 'unknown'
    record._name = NameIDMap[record.nameID] || 'unknown'

    switch (record.platformID) {
        case 0:
            // Unicode platform
            record._encoding = UnicodeEncodingIDMap[record.encodingID] || 'unknown'
            record._value = decodeBufferUtf16BE(data)
            break
        case 1:
            // Macintosh platform
            record._encoding = MacintoshEncodingIDMap[record.encodingID] || 'unknown'
            record._language = MacintoshLanguageIDMap[record.languageID] || 'unknown'
            record._value = data.toString('ascii')
            break
        case 3:
            // Windows platform
            record._encoding = WindowsEncodingIDMap[record.encodingID] || 'unknown'
            record._language = WindowsLanguageIDMap[('0'.repeat(4)+record.languageID.toString(16)).slice(-4)] || 'unknown'
            record._value = decodeBufferUtf16BE(data)
            break
        default:
            record._value = data.toString('ascii')
            break
    }
}

/**
 * 以 UTF-16BE 的方式解码数据
 * @param data
 */
function decodeBufferUtf16BE(data: Buffer): string {
    const buf = Buffer.from(new Uint8Array(data.length))
    for (let i = 0, len = data.length / 2; i < len; i++) {
        const val = data.readUInt16BE(i*2)
        buf.writeUInt16BE((val>>8) | (val<<8 & 0xFFFF), i*2)
    }
    return buf.toString('utf16le')
}
