export interface IFileBuffer {
    /**
     * 获取当前文件偏移
     */
    getFileOffset(): number

    /**
     * 设置当前文件偏移
     * @param offset
     */
    setFileOffset(offset: number): void

    /**
     * 重置文件偏移
     */
    resetFileOffset(): void

    /**
     * 从当前文件偏移处读取一个 int8 值
     */
    readInt8(): number

    /**
     * 从当前文件偏移处读取一个 uint8 值
     */
    readUInt8(): number

    /**
     * 从当前文件偏移处读取一个 int16 值
     */
    readInt16BE(): number

    /**
     * 从当前文件偏移处读取一个 uint16 值
     */
    readUInt16BE(): number

    /**
     * 从当前文件偏移处读取一个 int32 值
     */
    readInt32BE(): number

    /**
     * 从当前文件偏移处读取一个 uint32 值
     */
    readUInt32BE(): number

    /**
     * 从当前文件偏移处读取一个 int64 值
     */
    readBigInt64BE(): number

    /**
     * 从当前文件偏移处读取一个 uint64 值
     */
    readBigUInt64BE(): number

    /**
     * 从当前偏移处读取一个 FWord 值
     */
    readFWord(): number

    /**
     * 从当前偏移处读取一个 UFWord 值
     */
    readUFWord(): number

    /**
     * 从当前偏移处读取指定长度的buf
     */
    readBuffer(len: number): ArrayBuffer

    /**
     * 从当前偏移处读取一个 LongDateTime 值
     */
    readLongDateTime(): string

    /**
     * 切片
     */
    slice(len: number): IFileBuffer

    /**
     * 按照指定编码解析字符串
     * @param encoding
     */
    toString(encoding: "ascii" | "utf16le" | "utf16be"): string
}
