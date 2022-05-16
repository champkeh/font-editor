import * as Buffer from "buffer";

export interface OffsetSubTable {
    scalerType: number
    numTables: number
    searchRange: number
    entrySelector: number
    rangeShift: number
    _blockSize: number
}

export interface DirectoryEntry {
    tag: string
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
}

export interface ParsedFont {
    offset: OffsetSubTable
    directory: DirectoryEntry[]
    tables: Tables
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
