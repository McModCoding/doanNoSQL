import { describe, expect, it } from 'vitest'
import { formatDiem, formatDiemCoDau, formatMaThe, formatVND } from './format.js'

describe('format', () => {
  it('định dạng tiền Việt', () => {
    expect(formatVND(150000)).toBe('150.000đ')
    expect(formatVND(10040000)).toBe('10.040.000đ')
    expect(formatVND(0)).toBe('0đ')
    expect(formatVND(undefined)).toBe('0đ')
  })
  it('định dạng điểm', () => {
    expect(formatDiem(9500)).toBe('9.500')
    expect(formatDiemCoDau(190)).toBe('+190')
    expect(formatDiemCoDau(-500)).toBe('−500')
  })
  it('định dạng mã thẻ', () => {
    expect(formatMaThe('LC00000001')).toBe('LC00 0000 01')
  })
})
