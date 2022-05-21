import {
    parseNameStringInPlace,
    parseGlyfData,
    parseCmapSubtablesInPlace
} from './utils'
import {
    CmapEncodingSubtable,
    CmapTable,
    DirectoryEntry, DirectoryOffsetSubTable, DirectoryTable, GlyfDef, GlyfTable,
    HeadTable,
    HheaTable, HmtxTable, LocaEntry,
    LocaTable,
    MaxpTable, NameRecord, NameTable,
    ParsedFont,
    Tables, TableTagNameMap
} from "../../types/ParsedFont"
import {IFileBuffer} from "../adapter/IFileBuffer"


/**
 * 解析ttf字体
 * @param file 字体文件内容
 */
export function parseTtf(file: IFileBuffer): ParsedFont {
    // directory table
    const directory = parseDirectoryTable(file)

    // data table
    const tables = parseDataTable(file, directory.entries)

    return {
        directory,
        tables,
    }
}

/**
 * 解析字体的 directory 表
 * @param file
 */
function parseDirectoryTable(file: IFileBuffer): DirectoryTable {
    file.setFileOffset(0)

    // directory offset
    const offset = parseDirectoryOffset(file)

    // directory entries
    const entries = parseDirectoryEntries(file, offset.numTables)

    return {
        offset,
        entries,
    }
}

/**
 * 提取 directory offset 子表
 * @param file 字体数据
 */
function parseDirectoryOffset(file: IFileBuffer): DirectoryOffsetSubTable {
    const scalerType = file.readUInt32BE()
    if (scalerType !== 0x00010000 && scalerType !== 0x74727565) {
        throw new Error('该字体不是ttf字体')
    }

    const numTables = file.readUInt16BE()
    const searchRange = file.readUInt16BE()
    const entrySelector = file.readUInt16BE()
    const rangeShift = file.readUInt16BE()

    return {
        scalerType,
        numTables,
        searchRange,
        entrySelector,
        rangeShift,
        _blockSize: file.getFileOffset(),
    }
}

/**
 * 提取 directory entries 数组
 * @param file 字体数据
 * @param numTables 表格数
 */
function parseDirectoryEntries(file: IFileBuffer, numTables: number): DirectoryEntry[] {
    const entries: DirectoryEntry[] = []
    for (let i = 0; i < numTables; i++) {
        let blockStart = file.getFileOffset()
        const tag = file.slice(4).toString("ascii")
        const checksum = file.readUInt32BE()
        const offset = file.readUInt32BE()
        const length = file.readUInt32BE()
        entries.push({
            tag: tag as keyof TableTagNameMap,
            checksum,
            offset,
            length,
            _blockSize: file.getFileOffset() - blockStart,
            _pad: (4 - (length % 4)) % 4,
        })
    }
    return entries
}

/**
 * 提取 table 数据
 * @param file 字体文件数据
 * @param directory 表目录
 */
function parseDataTable(file: IFileBuffer, directory: DirectoryEntry[]): Tables {
    const tables: Tables = {}

    for (let i = 0; i < directory.length; i++) {
        const tableDesc = directory[i]
        if (tableDesc.tag === 'hhea') {
            tables.hhea = parseHheaTable(file, directory, tables)
        } else if (tableDesc.tag === 'head') {
            tables.head = parseHeadTable(file, directory, tables)
        } else if (tableDesc.tag === 'maxp') {
            tables.maxp = parseMaxpTable(file, directory, tables)
        } else if (tableDesc.tag === 'loca') {
            tables.loca = parseLocaTable(file, directory, tables)
        } else if (tableDesc.tag === "hmtx") {
            tables.hmtx = parseHmtxTable(file, directory, tables)
        } else if (tableDesc.tag === "name") {
            tables.name = parseNameTable(file, directory, tables)
        } else if (tableDesc.tag === "glyf") {
            tables.glyf = parseGlyfTable(file, directory, tables)
        } else if (tableDesc.tag === "cmap") {
            tables.cmap = parseCmapTable(file, directory, tables)
        }
    }

    return tables
}

/**
 * 解析 'hhea' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseHheaTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): HheaTable {
    const tableDesc = directory.find(table => table.tag === 'hhea')
    if (!tableDesc) {
        throw new Error(`'hhea' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const major = file.readInt16BE()
    const minor = file.readInt16BE()
    const version = `${major}.${minor}`

    const ascent = file.readInt16BE()
    const descent = file.readInt16BE()
    const lineGap = file.readInt16BE()
    const advanceWidthMax = file.readUInt16BE()
    const minLeftSideBearing = file.readInt16BE()
    const minRightSideBearing = file.readInt16BE()
    const xMaxExtent = file.readInt16BE()
    const caretSlopeRise = file.readInt16BE()
    const caretSlopeRun = file.readInt16BE()
    const caretOffset = file.readInt16BE()
    const reserved = file.readBuffer(8)
    const metricDataFormat = file.readInt16BE()
    const numOfLongHorMetrics = file.readUInt16BE()

    return {
        _parsed: true,
        version,
        ascent,
        descent,
        lineGap,
        advanceWidthMax,
        minLeftSideBearing,
        minRightSideBearing,
        xMaxExtent,
        caretSlopeRise,
        caretSlopeRun,
        caretOffset,
        reserved,
        metricDataFormat,
        numOfLongHorMetrics,
    }
}

/**
 * 解析 'head' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseHeadTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): HeadTable {
    const tableDesc = directory.find(table => table.tag === 'head')
    if (!tableDesc) {
        throw new Error(`'head' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const versionMajor = file.readInt16BE()
    const versionMinor = file.readInt16BE()
    const version = `${versionMajor}.${versionMinor}`

    const fontRevisionMajor = file.readInt16BE()
    const fontRevisionMinor = file.readInt16BE()
    const fontRevision = `${fontRevisionMajor}.${fontRevisionMinor}`

    const checkSumAdjustment = file.readUInt32BE()
    const magicNumber = file.readUInt32BE()
    const flags = file.readUInt16BE()
    const unitsPerEm = file.readUInt16BE()
    const created = file.readLongDateTime()
    const modified = file.readLongDateTime()
    const xMin = file.readInt16BE()
    const yMin = file.readInt16BE()
    const xMax = file.readInt16BE()
    const yMax = file.readInt16BE()
    const macStyle = file.readUInt16BE()
    const lowestRecPPEM = file.readUInt16BE()
    const fontDirectionHint = file.readInt16BE()
    const indexToLocFormat = file.readInt16BE() === 0 ? 'short' : 'long'
    const glyphDataFormat = file.readInt16BE()

    return {
        _parsed: true,
        version,
        fontRevision,
        checkSumAdjustment,
        magicNumber,
        flags,
        unitsPerEm,
        created,
        modified,
        xMin,
        yMin,
        xMax,
        yMax,
        macStyle,
        lowestRecPPEM,
        fontDirectionHint,
        indexToLocFormat,
        glyphDataFormat,
    }
}

/**
 * 解析 'maxp' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseMaxpTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): MaxpTable {
    const tableDesc = directory.find(table => table.tag === 'maxp')
    if (!tableDesc) {
        throw new Error(`'maxp' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const major = file.readInt16BE()
    const minor = file.readInt16BE()
    const version = `${major}.${minor}`

    const numGlyphs = file.readUInt16BE()
    const maxPoints = file.readUInt16BE()
    const maxContours = file.readUInt16BE()
    const maxComponentPoints = file.readUInt16BE()
    const maxComponentContours = file.readUInt16BE()
    const maxZones = file.readUInt16BE()
    const maxTwilightPoints = file.readUInt16BE()
    const maxStorage = file.readUInt16BE()
    const maxFunctionDefs = file.readUInt16BE()
    const maxInstructionDefs = file.readUInt16BE()
    const maxStackElements = file.readUInt16BE()
    const maxSizeOfInstructions = file.readUInt16BE()
    const maxComponentElements = file.readUInt16BE()
    const maxComponentDepth = file.readUInt16BE()

    return {
        _parsed: true,
        version,
        numGlyphs,
        maxPoints,
        maxContours,
        maxComponentPoints,
        maxComponentContours,
        maxZones,
        maxTwilightPoints,
        maxStorage,
        maxFunctionDefs,
        maxInstructionDefs,
        maxStackElements,
        maxSizeOfInstructions,
        maxComponentElements,
        maxComponentDepth,
    }
}

/**
 * 解析 'loca' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseLocaTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): LocaTable {
    const tableDesc = directory.find(table => table.tag === 'loca')
    if (!tableDesc) {
        throw new Error(`'loca' 表不存在`)
    }

    // 确保 loca 表所依赖的表先进行解析
    if (!tables.maxp || !tables.maxp._parsed) {
        tables.maxp = parseMaxpTable(file, directory, tables)
    }
    if (!tables.head || !tables.head._parsed) {
        tables.head = parseHeadTable(file, directory, tables)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const locas: LocaEntry[] = []

    let previousGlyphsOffset = 0
    const numGlyphs = tables.maxp.numGlyphs
    for (let i = 0; i < numGlyphs + 1; i++) {
        let currentGlyphsOffset = 0
        if (tables.head.indexToLocFormat === 'short') {
            currentGlyphsOffset = file.readUInt16BE() * 2
        } else {
            currentGlyphsOffset = file.readUInt32BE()
        }

        if (i > 0) {
            locas.push({
                offset: previousGlyphsOffset,
                _length: currentGlyphsOffset - previousGlyphsOffset,
                _index: i - 1,
            })
        }
        previousGlyphsOffset = currentGlyphsOffset
    }
    return {
        _parsed: true,
        entries: locas,
    }
}

/**
 * 解析 'hmtx' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseHmtxTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): HmtxTable {
    const tableDesc = directory.find(table => table.tag === 'hmtx')
    if (!tableDesc) {
        throw new Error(`'hmtx' 表不存在`)
    }

    // 确保 hmtx 表所依赖的表先进行解析
    if (!tables.hhea || !tables.hhea._parsed) {
        tables.hhea = parseHheaTable(file, directory, tables)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const numOfLongHorMetrics = tables.hhea.numOfLongHorMetrics

    const hmtxTable: HmtxTable = {
        _parsed: false,
        hMetrics: []
    }
    for (let i = 0; i < numOfLongHorMetrics; i++) {
        const advanceWidth = file.readUInt16BE()
        const leftSideBearing = file.readInt16BE()
        hmtxTable.hMetrics.push({advanceWidth, leftSideBearing})
    }

    const numOfLeftSideBearing = (tableDesc.length - numOfLongHorMetrics * 4) / 2
    if (numOfLeftSideBearing > 0) {
        hmtxTable.leftSideBearing = []
        for (let i = 0; i < numOfLeftSideBearing; i++) {
            hmtxTable.leftSideBearing.push(file.readFWord())
        }
    }

    hmtxTable._parsed = true
    return hmtxTable
}

/**
 * 解析 'name' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseNameTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): NameTable {
    const tableDesc = directory.find(table => table.tag === 'name')
    if (!tableDesc) {
        throw new Error(`'name' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const format = file.readUInt16BE()
    const count = file.readUInt16BE()
    const stringOffset = file.readUInt16BE()

    const nameRecord: NameRecord[] = []
    for (let i = 0; i < count; i++) {
        const platformID = file.readUInt16BE()
        const encodingID = file.readUInt16BE()
        const languageID = file.readUInt16BE()
        const nameID = file.readUInt16BE()
        const length = file.readUInt16BE()
        const offset = file.readUInt16BE()
        nameRecord.push({
            platformID,
            encodingID,
            languageID,
            nameID,
            length,
            offset,
            _index: i,
        })
    }

    if (stringOffset !== 6 + count * 12) {
        throw new Error('[warn] string offset of name table not next to header.')
    }

    for (let i = 0; i < count; i++) {
        const record = nameRecord[i]

        file.setFileOffset(tableDesc.offset + stringOffset + record.offset)
        const nameBuf = file.slice(record.length)
        parseNameStringInPlace(nameBuf, record)
    }

    return {
        _parsed: true,
        format,
        count,
        stringOffset,
        nameRecord,
    }
}

/**
 * 解析 'glyf' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseGlyfTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): GlyfTable {
    const tableDesc = directory.find(table => table.tag === 'glyf')
    if (!tableDesc) {
        throw new Error(`'glyf' 表不存在`)
    }

    // 确保 glyf 表所依赖的表先进行解析
    if (!tables.loca || !tables.loca._parsed) {
        tables.loca = parseLocaTable(file, directory, tables)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    tables.loca.entries.sort((a, b) => a._index > b._index ? 1 : -1)

    const glyfDefs: GlyfDef[] = []
    tables.loca.entries.forEach(loca => {
        if (loca._length === 0) {
            // 表示该位置的字型是缺失的
            glyfDefs.push({
                _index: loca._index,
                _length: 0,
            })
            return
        }
        const numberOfContours = file.readInt16BE()
        const xMin = file.readFWord()
        const yMin = file.readFWord()
        const xMax = file.readFWord()
        const yMax = file.readFWord()
        // const buf = readBuffer(file, loca._length - 10)
        const buf = parseGlyfData(file, numberOfContours, loca._length - 10)
        glyfDefs.push({
            numberOfContours,
            xMin,
            yMin,
            xMax,
            yMax,
            data: buf,
            _index: loca._index,
            _length: loca._length,
            _kind: numberOfContours >= 0 ? 'simple' : 'compound',
        })
    })

    return {
        _parsed: true,
        entries: glyfDefs,
    }
}

/**
 * 解析 'cmap' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseCmapTable(file: IFileBuffer, directory: DirectoryEntry[], tables: Tables): CmapTable {
    const tableDesc = directory.find(table => table.tag === 'cmap')
    if (!tableDesc) {
        throw new Error(`'cmap' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    file.setFileOffset(tableDesc.offset)

    const version = file.readUInt16BE()
    const numberSubtables = file.readUInt16BE()

    const subtables: CmapEncodingSubtable[] = []
    for (let i = 0; i < numberSubtables; i++) {
        const platformID = file.readUInt16BE()
        const encodingID = file.readUInt16BE()
        const offset = file.readUInt32BE()
        subtables.push({
            platformID,
            encodingID,
            offset,
        })
    }
    parseCmapSubtablesInPlace(file, tableDesc, subtables)

    return {
        _parsed: true,
        version,
        numberSubtables,
        subtables,
    }
}
