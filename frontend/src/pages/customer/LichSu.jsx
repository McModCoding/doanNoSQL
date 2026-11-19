import { Modal, Skeleton, Tabs } from 'antd'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { layBienDongDiem, layDoiThuongCuaKhach, layGiaoDichCuaKhach, layLichSuHang } from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { VeVoucher } from '../../components/VeVoucher.jsx'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import {
  formatDiem,
  formatDiemCoDau,
  formatNgay,
  formatNgayNgan,
  formatVND,
  nhomTheoThang,
} from '../../utils/format.js'
import { nhanTrangThaiDoiThuong, tomTatChiTiet } from '../../utils/nhan.js'

/** Lo phần đang tải, lỗi và danh sách rỗng cho mọi tab. */
function KhungDuLieu({ api, children, rong }) {
  if (api.error && !api.data) return <ErrorState error={api.error} onRetry={api.reload} compact />
  if (api.loading && !api.data) return <Skeleton active paragraph={{ rows: 5 }} />
  if (!api.data?.length) return <p>{rong}</p>
  return children(api.data)
}

/**
 * Sổ ghi chia theo tháng: tiêu đề tháng, rồi các hàng ngày, nội dung, con số.
 * Máy tính (từ 768px): thêm hàng tiêu đề cột, mỗi hàng thành 4 cột như một bảng.
 */
function SoTheoThang({ ds, layNgay, renderHang, cot, ...rest }) {
  return (
    <div className="nhom" {...rest}>
      {cot && (
        <div className="so-cai__dau" aria-hidden="true">
          {cot.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      )}
      {nhomTheoThang(ds, layNgay).map((t) => (
        <section key={t.khoa} className="cap" aria-labelledby={`thang-${t.khoa}`}>
          <h2 id={`thang-${t.khoa}`}>{t.nhan}</h2>
          <ol className="so-cai">{t.ds.map(renderHang)}</ol>
        </section>
      ))}
    </div>
  )
}

function TabDiem({ maKH }) {
  const api = useApi(() => layBienDongDiem(maKH), [maKH])
  return (
    <KhungDuLieu api={api} rong="Bạn chưa có biến động điểm nào.">
      {(ds) => (
        <SoTheoThang
          data-testid="points-history"
          ds={ds}
          cot={['Ngày', 'Nội dung', 'Điểm', 'Số dư']}
          layNgay={(b) => b.NgayTao}
          renderHang={(b) => (
            <li key={b.MaBienDong ?? b._id} className="so-cai__hang so-cai__hang--4 so-cai__hang--so-du">
              <span className="so-cai__ngay">{formatNgayNgan(b.NgayTao)}</span>
              <span className="so-cai__noi-dung">{b.MoTa}</span>
              <span className="so-cai__so">{formatDiemCoDau(b.SoDiem)}</span>
              {b.SoDuSau !== undefined && (
                <span className="so-cai__phu">
                  <span className="nhan-dien-thoai">Số dư </span>
                  {formatDiem(b.SoDuSau)}
                  <span className="nhan-dien-thoai"> điểm</span>
                </span>
              )}
            </li>
          )}
        />
      )}
    </KhungDuLieu>
  )
}

function TabGiaoDich({ maKH }) {
  const api = useApi(() => layGiaoDichCuaKhach(maKH), [maKH])
  return (
    <KhungDuLieu api={api} rong="Bạn chưa có giao dịch nào.">
      {(ds) => (
        <SoTheoThang
          ds={ds}
          cot={['Ngày', 'Giao dịch', 'Số tiền', 'Điểm cộng']}
          layNgay={(g) => g.NgayTao}
          renderHang={(g) => (
            <li key={g.MaGiaoDich} className="so-cai__hang so-cai__hang--4">
              <span className="so-cai__ngay">{formatNgayNgan(g.NgayTao)}</span>
              <span className="so-cai__noi-dung">
                <span>
                  <b>{g.MaGiaoDich}</b> <StatusTag trangThai={g.TrangThai} />
                </span>
                <small>{tomTatChiTiet(g.ChiTiet)}</small>
                {g.TrangThai === 'PENDING' && <Link to={`/app/thanh-toan/${g.MaGiaoDich}`}>Tiếp tục thanh toán</Link>}
              </span>
              <span className="so-cai__so">{formatVND(g.TongTien)}</span>
              {g.TrangThai === 'COMPLETED' && (
                <span className="so-cai__phu">
                  +{formatDiem(g.DiemCong)}
                  <span className="nhan-dien-thoai"> điểm</span>
                </span>
              )}
            </li>
          )}
        />
      )}
    </KhungDuLieu>
  )
}

function TabQua({ maKH }) {
  const api = useApi(() => layDoiThuongCuaKhach(maKH), [maKH])
  const [dangXem, setDangXem] = useState(null)
  return (
    <>
      <KhungDuLieu api={api} rong="Bạn chưa đổi quà nào.">
        {(ds) => (
          <SoTheoThang
            ds={ds}
            cot={['Ngày', 'Quà', 'Điểm', 'Mã voucher']}
            layNgay={(d) => d.NgayDoi}
            renderHang={(d) => (
              <li key={d.MaDoiThuong} className="so-cai__hang so-cai__hang--4">
                <span className="so-cai__ngay">{formatNgayNgan(d.NgayDoi)}</span>
                <span className="so-cai__noi-dung">
                  <b>{d.TenPhanThuong}</b>
                  <small>
                    {nhanTrangThaiDoiThuong(d)}, hạn dùng đến {formatNgay(d.HanSuDung)}
                  </small>
                </span>
                <span className="so-cai__so">{formatDiemCoDau(-d.DiemDaDoi)}</span>
                <span className="so-cai__phu">
                  <button type="button" className="nut-link" onClick={() => setDangXem(d)}>
                    Xem mã
                  </button>
                </span>
              </li>
            )}
          />
        )}
      </KhungDuLieu>
      <Modal open={Boolean(dangXem)} footer={null} centered width={400} onCancel={() => setDangXem(null)}>
        {dangXem && <VeVoucher doiThuong={dangXem} hienTrangThai />}
      </Modal>
    </>
  )
}

function TabHang({ maKH, dsHang }) {
  const api = useApi(() => layLichSuHang(maKH), [maKH])
  const tenHang = (ma) => dsHang.find((h) => h.MaHang === ma)?.TenHang ?? ma
  return (
    <KhungDuLieu api={api} rong="Chưa có lịch sử hạng.">
      {(ds) => (
        <ol className="so-cai">
          {ds.map((l) => (
            <li key={l._id ?? `${l.NgayThayDoi}-${l.HangMoi}`} className="so-cai__hang so-cai__hang--rong">
              <span className="so-cai__noi-dung">
                <TierTag maHang={l.HangMoi} dsHang={dsHang} />
                <small>
                  {l.HangCu ? `Lên từ hạng ${tenHang(l.HangCu)}. ${l.LyDo}.` : `${l.LyDo}.`}
                </small>
              </span>
              <span className="so-cai__ngay">{formatNgay(l.NgayThayDoi)}</span>
            </li>
          ))}
        </ol>
      )}
    </KhungDuLieu>
  )
}

export default function LichSu() {
  const { khachHang, dsHang } = useKhachHang()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'diem'
  const maKH = khachHang.MaKH

  return (
    <div className="trang" style={{ gap: 24 }}>
      <header className="dau-trang">
        <h1>Lịch sử</h1>
        <span>
          <span className="so-vua">{formatDiem(khachHang.DiemHienTai)}</span> điểm
        </span>
      </header>
      <Tabs
        activeKey={tab}
        onChange={(k) => setParams(k === 'diem' ? {} : { tab: k }, { replace: true })}
        items={[
          { key: 'diem', label: 'Điểm', children: <TabDiem maKH={maKH} /> },
          { key: 'giao-dich', label: 'Giao dịch', children: <TabGiaoDich maKH={maKH} /> },
          { key: 'qua', label: 'Quà của tôi', children: <TabQua maKH={maKH} /> },
          { key: 'hang', label: 'Hạng', children: <TabHang maKH={maKH} dsHang={dsHang} /> },
        ]}
      />
    </div>
  )
}
