import * as Buffer from "buffer";

export interface DirectoryOffsetSubTable {
    scalerType: number
    numTables: number
    searchRange: number
    entrySelector: number
    rangeShift: number
    _blockSize: number
}

export interface DirectoryEntry {
    tag: keyof TableTagNameMap
    checksum: number
    offset: number
    length: number
    _blockSize: number
    _pad: number
}

export type Tables = {
    [tag in keyof TableTagNameMap]?: TableTagNameMap[tag]
}

interface TableTagNameMap {
    "hhea": HheaTable
    "head": HeadTable
    "maxp": MaxpTable
    "loca": LocaTable
    "hmtx": HmtxTable
    "name": NameTable
    "glyf": GlyfTable
}

export interface ParsedFont {
    directory: DirectoryTable
    tables: Tables
}

export interface DirectoryTable {
    offset: OffsetSubTable
    entries: DirectoryEntry[]
}

export interface HheaTable {
    version: string
    ascent: number
    descent: number
    lineGap: number
    advanceWidthMax: number
    minLeftSideBearing: number
    minRightSideBearing: number
    xMaxExtent: number
    caretSlopeRise: number
    caretSlopeRun: number
    caretOffset: number
    reserved: Buffer
    metricDataFormat: number
    numOfLongHorMetrics: number
}

export interface HeadTable {
    version: string
    fontRevision: string
    checkSumAdjustment: number
    magicNumber: number
    flags: number
    unitsPerEm: number
    created: string
    modified: string
    xMin: number
    yMin: number
    xMax: number
    yMax: number
    macStyle: number
    lowestRecPPEM: number
    fontDirectionHint: number
    indexToLocFormat: 'short' | 'long'
    glyphDataFormat: number
}

export interface MaxpTable {
    version: string
    numGlyphs: number
    maxPoints: number
    maxContours: number
    maxComponentPoints: number
    maxComponentContours: number
    maxZones: number
    maxTwilightPoints: number
    maxStorage: number
    maxFunctionDefs: number
    maxInstructionDefs: number
    maxStackElements: number
    maxSizeOfInstructions: number
    maxComponentElements: number
    maxComponentDepth: number
}

export type LocaTable = {
    offset: number
    _length: number
    _index: number
}[]

export interface LongHorMetric {
    advanceWidth: number
    leftSideBearing: number
}
export interface HmtxTable {
    hMetrics: LongHorMetric[]
    leftSideBearing?: number[]
}

export interface NameRecord {
    platformID: number
    encodingID: number
    languageID: number
    nameID: number
    length: number
    offset: number
    _index: number
    _platform?: string
    _encoding?: string
    _language?: string
    _name?: string
    _value?: string
}
export interface NameTable {
    format: number
    count: number
    stringOffset: number
    nameRecord: NameRecord[]
}

export interface EmptyGlyfDef {
    _index: number
    _length: 0
}
export interface NotEmptyGlyfDef {
    numberOfContours: number
    xMin: number
    yMin: number
    xMax: number
    yMax: number
    data: Buffer
    _index: number
    _length: number
    _kind: 'simple' | 'compound'
}
export type GlyfDef = EmptyGlyfDef | NotEmptyGlyfDef

export type GlyfTable = GlyfDef[]
