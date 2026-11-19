import { CheckCircleOutlined } from '@ant-design/icons'
import { App, Button, Modal, Segmented, Skeleton } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doiQua } from '../../api/doiThuong.js'
import { layDsPhanThuong } from '../../api/phanThuong.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { VeVoucher } from '../../components/VeVoucher.jsx'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem } from '../../utils/format.js'
import { NHAN_LOAI_PHAN_THUONG } from '../../utils/nhan.js'

const BO_LOC = [
  { label: 'Tất cả', value: '' },
  { label: 'Vé', value: 'VOUCHER_VE' },
  { label: 'Bắp nước', value: 'VOUCHER_BAP_NUOC' },
  { label: 'Quà tặng', value: 'QUA_HIEN_VAT' },
]

/** Một hàng trong bảng giá: số điểm in to bên trái, tên quà, nút đổi khi đủ điểm. */
function HangQua({ qua, diemHienTai, onDoi }) {
  const hetQua = qua.SoLuongTon <= 0
  const thieu = qua.DiemCanDoi - diemHienTai
  const doiDuoc = !hetQua && thieu <= 0
  const donVi = qua.LoaiPhanThuong === 'QUA_HIEN_VAT' ? 'phần quà' : 'suất'

  return (
    <li className={`qua${doiDuoc ? '' : ' qua--thieu'}`} data-testid={`reward-${qua.MaPhanThuong}`}>
      <span className="qua__diem">{formatDiem(qua.DiemCanDoi)}</span>
      <span className="qua__chu">
        <b>{qua.TenPhanThuong}</b>
        <small>
          {hetQua
            ? 'Hết quà'
            : thieu > 0
              ? `Thiếu ${formatDiem(thieu)} điểm`
              : `${NHAN_LOAI_PHAN_THUONG[qua.LoaiPhanThuong]}, còn ${formatDiem(qua.SoLuongTon)} ${donVi}`}
        </small>
      </span>
      {doiDuoc && (
        <Button onClick={() => onDoi(qua)} aria-label={`Đổi ${qua.TenPhanThuong} với ${formatDiem(qua.DiemCanDoi)} điểm`}>
          Đổi
        </Button>
      )}
    </li>
  )
}

export default function DoiThuong() {
  const { khachHang, taiLai } = useKhachHang()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [loai, setLoai] = useState('')
  const ds = useApi(() => layDsPhanThuong({ trangThai: 'ACTIVE' }), [])
  const [dangChon, setDangChon] = useState(null)
  const [dangDoi, setDangDoi] = useState(false)
  const [vuaDoi, setVuaDoi] = useState(null)

  const diem = khachHang.DiemHienTai
  const danhSach = (ds.data ?? [])
    .filter((p) => !loai || p.LoaiPhanThuong === loai)
    .sort((a, b) => a.DiemCanDoi - b.DiemCanDoi)
  const duDiem = danhSach.filter((p) => p.SoLuongTon > 0 && p.DiemCanDoi <= diem)
  const chuaDoiDuoc = danhSach.filter((p) => !(p.SoLuongTon > 0 && p.DiemCanDoi <= diem))

  const xacNhanDoi = async () => {
    setDangDoi(true)
    try {
      const kq = await doiQua({ MaKH: khachHang.MaKH, MaPhanThuong: dangChon.MaPhanThuong })
      setDangChon(null)
      setVuaDoi(kq.doiThuong)
      taiLai()
      ds.reload()
    } catch (e) {
      message.error(e.message)
    } finally {
      setDangDoi(false)
    }
  }

  let noiDung
  if (ds.error && !ds.data) noiDung = <ErrorState error={ds.error} onRetry={ds.reload} />
  else if (ds.loading && !ds.data) noiDung = <Skeleton active paragraph={{ rows: 6 }} />
  else if (danhSach.length === 0) noiDung = <p>Chưa có quà nào trong nhóm này.</p>
  else
    noiDung = (
      // Màn lớn (từ 1024px): nhóm "Đủ điểm đổi ngay" và "Chưa đổi được" đặt cạnh nhau
      <div className="doi-qua__nhom">
        {duDiem.length > 0 && (
          <section className="cap" aria-labelledby="du-diem">
            <h2 id="du-diem">Đủ điểm đổi ngay</h2>
            <ul className="ds-hang">
              {duDiem.map((p) => (
                <HangQua key={p.MaPhanThuong} qua={p} diemHienTai={diem} onDoi={setDangChon} />
              ))}
            </ul>
          </section>
        )}
        {chuaDoiDuoc.length > 0 && (
          <section className="cap" aria-labelledby="chua-doi-duoc">
            <h2 id="chua-doi-duoc">Chưa đổi được</h2>
            <ul className="ds-hang">
              {chuaDoiDuoc.map((p) => (
                <HangQua key={p.MaPhanThuong} qua={p} diemHienTai={diem} onDoi={setDangChon} />
              ))}
            </ul>
          </section>
        )}
      </div>
    )

  return (
    <div className="trang">
      <div className="nhom">
        <header className="dau-trang">
          <h1>Đổi quà</h1>
          <span data-testid="reward-points">
            <span className="so-vua">{formatDiem(diem)}</span> điểm
          </span>
        </header>
        <div className="cuon-ngang">
          <Segmented value={loai} onChange={setLoai} options={BO_LOC} aria-label="Lọc theo loại quà" />
        </div>
      </div>

      {noiDung}

      <Modal
        open={Boolean(dangChon)}
        title={dangChon ? `Đổi ${dangChon.TenPhanThuong}?` : ''}
        okText={dangChon ? `Đổi với ${formatDiem(dangChon.DiemCanDoi)} điểm` : 'Đổi'}
        cancelText="Để sau"
        confirmLoading={dangDoi}
        onOk={xacNhanDoi}
        onCancel={() => !dangDoi && setDangChon(null)}
        centered
        width={400}
      >
        {dangChon && (
          <div className="nhom">
            <p>{dangChon.MoTa}</p>
            <dl className="bang-so">
              <div>
                <dt>Điểm hiện có</dt>
                <dd>{formatDiem(diem)}</dd>
              </div>
              <div>
                <dt>Điểm dùng để đổi</dt>
                <dd>−{formatDiem(dangChon.DiemCanDoi)}</dd>
              </div>
              <div>
                <dt>Còn lại sau khi đổi</dt>
                <dd>{formatDiem(diem - dangChon.DiemCanDoi)}</dd>
              </div>
            </dl>
            <small>Đổi quà không làm giảm hạng thành viên, vì hạng xét theo tổng chi tiêu.</small>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(vuaDoi)} footer={null} centered width={400} onCancel={() => setVuaDoi(null)}>
        {vuaDoi && (
          <div className="nhom ket-qua">
            <span className="trang-thai-lon">
              <CheckCircleOutlined /> Đã đổi quà, trừ {formatDiem(vuaDoi.DiemDaDoi)} điểm
            </span>
            <VeVoucher doiThuong={vuaDoi} />
            <div className="cot-nut">
              <Button type="primary" block onClick={() => setVuaDoi(null)}>
                Đổi thêm quà khác
              </Button>
              <Button block onClick={() => navigate('/app/lich-su?tab=qua')}>
                Xem quà của tôi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
