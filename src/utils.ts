import type {PathLike} from 'node:fs'
import fs from 'node:fs'
import {DirectoryEntry} from "../types/ParsedFont";


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

const FileOffset = {
    value: 0,
}

export function resetFileOffset() {
    FileOffset.value = 0
}

export function getFileOffset() {
    return FileOffset.value
}

export function readUInt32BE(data: Buffer): number {
    const value = data.readUInt32BE(FileOffset.value)
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

export function readBuffer(data: Buffer, len: number): Buffer {
    const buf = data.slice(FileOffset.value, FileOffset.value + len)
    FileOffset.value += len
    return buf
}

export function checkFileOffset(table: DirectoryEntry) {
    if (FileOffset.value !== table.offset) {
        throw new Error(`解析'${table.tag}'表时文件偏移不正确！\n\n期望偏移:${table.offset}, 实际偏移:${FileOffset.value}`)
    }
}
