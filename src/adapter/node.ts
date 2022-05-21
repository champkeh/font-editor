import { addSeconds2Date } from '../shared/utils'
import {IFileBuffer} from "./IFileBuffer"


/**
 * node 平台的 FileBuffer 实现
 */
export class FileBuffer implements IFileBuffer {
    #fileOffset: number = 0

    constructor(public file: Buffer) {
    }

    setFileOffset(offset: number) {
        this.#fileOffset = offset
    }

    getFileOffset() {
        return this.#fileOffset
    }

    resetFileOffset() {
        this.setFileOffset(0)
    }


    readInt8() {
        const value = this.file.readInt8(this.#fileOffset)
        this.#fileOffset += 1
        return value
    }

    readUInt8() {
        const value = this.file.readUInt8(this.#fileOffset)
        this.#fileOffset += 1
        return value
    }

    readInt16BE() {
        const value = this.file.readInt16BE(this.#fileOffset)
        this.#fileOffset += 2
        return value
    }

    readUInt16BE() {
        const value = this.file.readUInt16BE(this.#fileOffset)
        this.#fileOffset += 2
        return value
    }

    readInt32BE() {
        const value = this.file.readInt32BE(this.#fileOffset)
        this.#fileOffset += 4
        return value
    }

    readUInt32BE() {
        const value = this.file.readUInt32BE(this.#fileOffset)
        this.#fileOffset += 4
        return value
    }

    readBigInt64BE() {
        const value = this.file.readBigInt64BE(this.#fileOffset)
        this.#fileOffset += 8
        return Number(value)
    }

    readBigUInt64BE() {
        const value = this.file.readBigUInt64BE(this.#fileOffset)
        this.#fileOffset += 8
        return Number(value)
    }

    readFWord(): number {
        return this.readInt16BE()
    }

    readUFWord(): number {
        return this.readUInt16BE()
    }

    readBuffer(len: number): ArrayBuffer {
        const buf = this.file.slice(this.#fileOffset, this.#fileOffset + len)
        this.#fileOffset += len
        return buf
    }

    readLongDateTime(): string {
        const seconds = this.readBigInt64BE()
        return addSeconds2Date(new Date(1904, 0, 1), seconds)
    }

    slice(len: number): IFileBuffer {
        const buf = this.readBuffer(len)
        return new FileBuffer(Buffer.from(buf))
    }

    toString(encoding: "ascii" | "utf16le" | "utf16be"): string {
        switch (encoding) {
            case "ascii":
                return this.file.toString("ascii")
            case "utf16be":
                return decodeBufferUtf16BE(this.file)
            case "utf16le":
                return this.file.toString("utf16le")
            default:
                throw new Error(`unsupported encoding: "${encoding}".`)
        }
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


