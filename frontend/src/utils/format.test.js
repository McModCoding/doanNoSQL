import { describe, expect, it } from 'vitest'
import { formatDiem, formatDiemCoDau, formatMaThe, formatVND, nhomTheoThang } from './format.js'

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
  it('gom sổ điểm theo tháng, giữ thứ tự mới nhất trước', () => {
    const ds = [
      { id: 1, ngay: '2026-11-16T09:00:00' },
      { id: 2, ngay: '2026-11-02T09:00:00' },
      { id: 3, ngay: '2026-10-27T09:00:00' },
    ]
    const nhom = nhomTheoThang(ds, (m) => m.ngay)
    expect(nhom.map((n) => n.nhan)).toEqual(['Tháng 11/2026', 'Tháng 10/2026'])
    expect(nhom[0].ds.map((m) => m.id)).toEqual([1, 2])
  })
})
