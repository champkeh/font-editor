import {IFileBuffer} from "./IFileBuffer"
import {addSeconds2Date} from "../shared/utils"

export class FileBuffer implements IFileBuffer {
    #fileOffset: number = 0
    #dataView: DataView

    constructor(public file: ArrayBuffer) {
        this.#dataView = new DataView(file)
    }

    setFileOffset(offset: number): void {
        this.#fileOffset = offset
    }

    getFileOffset(): number {
        return this.#fileOffset
    }

    resetFileOffset(): void {
        this.setFileOffset(0)
    }


    readInt8(): number {
        const value = this.#dataView.getInt8(this.#fileOffset)
        this.#fileOffset += 1
        return value
    }

    readUInt8(): number {
        const value = this.#dataView.getUint8(this.#fileOffset)
        this.#fileOffset += 1
        return value
    }

    readInt16BE(): number {
        const value = this.#dataView.getInt16(this.#fileOffset)
        this.#fileOffset += 2
        return value
    }

    readUInt16BE(): number {
        const value = this.#dataView.getUint16(this.#fileOffset)
        this.#fileOffset += 2
        return value
    }

    readInt32BE(): number {
        const value = this.#dataView.getInt32(this.#fileOffset)
        this.#fileOffset += 4
        return value
    }

    readUInt32BE(): number {
        const value = this.#dataView.getUint32(this.#fileOffset)
        this.#fileOffset += 4
        return value
    }

    readBigInt64BE(): number {
        const value = this.#dataView.getBigInt64(this.#fileOffset)
        this.#fileOffset += 8
        return Number(value)
    }

    readBigUInt64BE(): number {
        const value = this.#dataView.getBigUint64(this.#fileOffset)
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
        return new FileBuffer(buf)
    }

    toString(encoding: "ascii" | "utf16le" | "utf16be"): string {
        switch (encoding) {
            case "ascii":
                return ""
            case "utf16le":
                return ""
            case "utf16be":
                return ""
            default:
                throw new Error(`unsupported encoding: "${encoding}".`)
        }
    }
}
