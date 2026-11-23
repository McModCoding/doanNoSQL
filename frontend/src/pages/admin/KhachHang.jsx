import { PlusOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Descriptions, Drawer, Form, Grid, Input, Modal, Popconfirm, Select, Table, Tabs } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { layDsHang } from '../../api/hangThanhVien.js'
import {
  layBienDongDiem,
  layDoiThuongCuaKhach,
  layGiaoDichCuaKhach,
  layLichSuHang,
  suaKhachHang,
  themKhachHang,
  timKhachHang,
  xoaKhachHang,
} from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatDiemCoDau, formatNgay, formatNgayGio, formatVND } from '../../utils/format.js'
import { NHAN_LOAI_BIEN_DONG, NHAN_TRANG_THAI_KH, nhanTrangThaiDoiThuong, tomTatChiTiet } from '../../utils/nhan.js'
import { tinhTienDoHang } from '../../utils/tier.js'

function TrangThaiKhach({ trangThai }) {
  return (
    <span className={trangThai === 'ACTIVE' ? '' : 'chu-phu'}>{NHAN_TRANG_THAI_KH[trangThai] ?? trangThai}</span>
  )
}

function ChiTietKhachHang({ kh, dsHang, onClose }) {
  const maKH = kh?.MaKH
  const diem = useApi(() => (maKH ? layBienDongDiem(maKH) : []), [maKH])
  const gd = useApi(() => (maKH ? layGiaoDichCuaKhach(maKH) : []), [maKH])
  const qua = useApi(() => (maKH ? layDoiThuongCuaKhach(maKH) : []), [maKH])
  const hang = useApi(() => (maKH ? layLichSuHang(maKH) : []), [maKH])
  const tenHang = (ma) => dsHang.find((h) => h.MaHang === ma)?.TenHang ?? ma
  const tienDo = kh ? tinhTienDoHang(kh.TongChiTieu, dsHang) : null
  const manHinh = Grid.useBreakpoint()

  return (
    <Drawer
      open={Boolean(kh)}
      onClose={onClose}
      size={manHinh.md ? 760 : '100%'}
      title={kh ? `${kh.HoTen}, ${kh.MaKH}` : ''}
      destroyOnHidden
    >
      {kh && (
        <div className="nhom">
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 1, md: 2 }}
            bordered
            styles={{ label: { whiteSpace: 'nowrap', width: 136 } }}
            items={[
              { key: 'sdt', label: 'Số điện thoại', children: kh.SoDienThoai },
              { key: 'the', label: 'Mã thẻ', children: kh.MaThe },
              { key: 'email', label: 'Email', children: kh.Email ?? 'Chưa có', span: 'filled' },
              { key: 'ns', label: 'Ngày sinh', children: formatNgay(kh.NgaySinh) },
              { key: 'gt', label: 'Giới tính', children: kh.GioiTinh ?? 'Chưa có' },
              { key: 'dk', label: 'Ngày đăng ký', children: formatNgay(kh.NgayDangKy) },
              { key: 'tt', label: 'Trạng thái', children: <TrangThaiKhach trangThai={kh.TrangThai} /> },
              { key: 'hang', label: 'Hạng', children: <TierTag maHang={kh.MaHangHienTai} dsHang={dsHang} /> },
              { key: 'diem', label: 'Điểm hiện tại', children: <b>{formatDiem(kh.DiemHienTai)}</b> },
              { key: 'ct', label: 'Tổng chi tiêu', children: formatVND(kh.TongChiTieu) },
              {
                key: 'tien-do',
                label: 'Lên hạng',
                children: tienDo?.laHangCaoNhat
                  ? 'Đang ở hạng cao nhất'
                  : tienDo?.hangKeTiep
                    ? `Còn ${formatVND(tienDo.soTienCanThem)} nữa là lên hạng ${tienDo.hangKeTiep.TenHang}`
                    : 'Chưa có',
              },
            ]}
          />
          <Tabs
            items={[
              {
                key: 'diem',
                label: 'Biến động điểm',
                children: (
                  <Table
                    size="small"
                    rowKey={(r) => r.MaBienDong ?? r._id}
                    loading={diem.loading}
                    dataSource={diem.data}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'Thời gian', dataIndex: 'NgayTao', render: formatNgayGio, width: 176 },
                      { title: 'Loại', dataIndex: 'LoaiBienDong', width: 112, render: (l) => NHAN_LOAI_BIEN_DONG[l] ?? l },
                      { title: 'Nội dung', dataIndex: 'MoTa' },
                      { title: 'Điểm', dataIndex: 'SoDiem', align: 'right', width: 80, render: formatDiemCoDau },
                      { title: 'Số dư', dataIndex: 'SoDuSau', align: 'right', width: 90, render: formatDiem },
                    ]}
                  />
                ),
              },
              {
                key: 'gd',
                label: 'Giao dịch',
                children: (
                  <Table
                    size="small"
                    rowKey="MaGiaoDich"
                    loading={gd.loading}
                    dataSource={gd.data}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'Mã', dataIndex: 'MaGiaoDich', width: 100 },
                      { title: 'Thời gian', dataIndex: 'NgayTao', render: formatNgayGio, width: 176 },
                      { title: 'Nội dung', dataIndex: 'ChiTiet', render: tomTatChiTiet, ellipsis: true },
                      { title: 'Tổng tiền', dataIndex: 'TongTien', align: 'right', render: formatVND },
                      { title: 'Trạng thái', dataIndex: 'TrangThai', render: (t) => <StatusTag trangThai={t} /> },
                    ]}
                  />
                ),
              },
              {
                key: 'qua',
                label: 'Quà đã đổi',
                children: (
                  <Table
                    size="small"
                    rowKey="MaDoiThuong"
                    loading={qua.loading}
                    dataSource={qua.data}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'Ngày đổi', dataIndex: 'NgayDoi', render: formatNgay, width: 110 },
                      { title: 'Phần thưởng', dataIndex: 'TenPhanThuong' },
                      { title: 'Mã voucher', dataIndex: 'MaVoucher', width: 136, className: 'o-ma' },
                      { title: 'Điểm', dataIndex: 'DiemDaDoi', align: 'right', width: 80, render: formatDiem },
                      { title: 'Trạng thái', key: 'tt', width: 130, render: (_, r) => nhanTrangThaiDoiThuong(r) },
                    ]}
                  />
                ),
              },
              {
                key: 'hang',
                label: 'Lịch sử hạng',
                children: (
                  <Table
                    size="small"
                    rowKey={(r) => r._id ?? `${r.NgayThayDoi}-${r.HangMoi}`}
                    loading={hang.loading}
                    dataSource={hang.data}
                    pagination={false}
                    columns={[
                      { title: 'Ngày', dataIndex: 'NgayThayDoi', render: formatNgay, width: 110 },
                      { title: 'Hạng mới', dataIndex: 'HangMoi', render: (m) => <TierTag maHang={m} dsHang={dsHang} /> },
                      { title: 'Hạng trước', dataIndex: 'HangCu', render: (m) => (m ? `Hạng ${tenHang(m)}` : 'Chưa có') },
                      { title: 'Lý do', dataIndex: 'LyDo' },
                    ]}
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </Drawer>
  )
}

function FormKhachHang({ dangSua, open, onClose, onSaved }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [dangLuu, setDangLuu] = useState(false)

  const luu = async () => {
    const v = await form.validateFields()
    const duLieu = { ...v, NgaySinh: v.NgaySinh ? v.NgaySinh.format('YYYY-MM-DD') : null }
    setDangLuu(true)
    try {
      const kh = dangSua ? await suaKhachHang(dangSua.MaKH, duLieu) : await themKhachHang(duLieu)
      message.success(dangSua ? `Đã cập nhật ${kh.MaKH}` : `Đã thêm khách hàng ${kh.MaKH}`)
      onSaved()
    } catch (e) {
      message.error(e.message)
    } finally {
      setDangLuu(false)
    }
  }

  return (
    <Modal
      open={open}
      title={dangSua ? `Sửa thông tin ${dangSua.MaKH}` : 'Thêm khách hàng'}
      okText={dangSua ? 'Lưu thay đổi' : 'Thêm khách hàng'}
      cancelText="Hủy"
      confirmLoading={dangLuu}
      onOk={luu}
      onCancel={onClose}
      destroyOnHidden
      afterOpenChange={(mo) => {
        if (!mo) return
        form.resetFields()
        if (dangSua) form.setFieldsValue({ ...dangSua, NgaySinh: dangSua.NgaySinh ? dayjs(dangSua.NgaySinh) : null })
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ TrangThai: 'ACTIVE' }}>
        <Form.Item name="HoTen" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="SoDienThoai"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Nhập số điện thoại' },
            { pattern: /^0\d{9}$/, message: 'Gồm 10 chữ số, bắt đầu bằng 0' },
          ]}
        >
          <Input inputMode="numeric" maxLength={10} />
        </Form.Item>
        <Form.Item name="Email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input />
        </Form.Item>
        <div className="hang-loc" style={{ alignItems: 'flex-start' }}>
          <Form.Item name="NgaySinh" label="Ngày sinh">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="GioiTinh" label="Giới tính">
            <Select style={{ width: 128 }} allowClear options={['Nam', 'Nữ', 'Khác'].map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          {dangSua && (
            <Form.Item name="TrangThai" label="Trạng thái">
              <Select
                style={{ width: 176 }}
                options={Object.entries(NHAN_TRANG_THAI_KH).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          )}
        </div>
      </Form>
    </Modal>
  )
}

export default function KhachHangAdmin() {
  const { message } = App.useApp()
  const [boLoc, setBoLoc] = useState({ q: '', maHang: undefined, trangThai: undefined })
  const ds = useApi(() => timKhachHang(boLoc), [boLoc.q, boLoc.maHang, boLoc.trangThai])
  const dsHang = useApi(layDsHang, [])
  const [dangXem, setDangXem] = useState(null)
  const [form, setForm] = useState({ open: false, dangSua: null })
  const manHinh = Grid.useBreakpoint()

  const xoa = async (kh) => {
    try {
      await xoaKhachHang(kh.MaKH)
      message.success(`Đã xóa ${kh.MaKH}`)
      ds.reload()
    } catch (e) {
      message.error(e.message)
    }
  }

  const hang = dsHang.data ?? []

  return (
    <div className="qt-trang" style={{ gap: 24 }}>
      <div className="qt-muc-dau">
        <h1>Khách hàng</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setForm({ open: true, dangSua: null })}>
          Thêm khách hàng
        </Button>
      </div>

      <div className="hang-loc">
        <Input.Search
          allowClear
          placeholder="Tìm tên, số điện thoại, mã KH, email"
          style={{ width: 320 }}
          onSearch={(q) => setBoLoc((b) => ({ ...b, q }))}
          aria-label="Tìm khách hàng"
        />
        <Select
          allowClear
          placeholder="Hạng"
          style={{ width: 128 }}
          value={boLoc.maHang}
          onChange={(maHang) => setBoLoc((b) => ({ ...b, maHang }))}
          options={hang.map((h) => ({ value: h.MaHang, label: `Hạng ${h.TenHang}` }))}
          aria-label="Lọc theo hạng"
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 176 }}
          value={boLoc.trangThai}
          onChange={(trangThai) => setBoLoc((b) => ({ ...b, trangThai }))}
          options={Object.entries(NHAN_TRANG_THAI_KH).map(([value, label]) => ({ value, label }))}
          aria-label="Lọc theo trạng thái"
        />
      </div>

      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : (
        <Table
          rowKey="MaKH"
          loading={ds.loading}
          dataSource={ds.data}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} khách hàng` }}
          scroll={{ x: 1088 }}
          onRow={(r) => ({ onDoubleClick: () => setDangXem(r) })}
          columns={[
            { title: 'Mã KH', dataIndex: 'MaKH', width: 96 },
            {
              title: 'Họ tên',
              dataIndex: 'HoTen',
              render: (t, r) => (
                <span>
                  {t}
                  <span className="o-chu-phu">{r.SoDienThoai}</span>
                </span>
              ),
            },
            { title: 'Hạng', dataIndex: 'MaHangHienTai', width: 128, render: (m) => <TierTag maHang={m} dsHang={hang} /> },
            {
              title: 'Điểm',
              dataIndex: 'DiemHienTai',
              align: 'right',
              width: 112,
              sorter: (a, b) => a.DiemHienTai - b.DiemHienTai,
              render: formatDiem,
            },
            {
              title: 'Tổng chi tiêu',
              dataIndex: 'TongChiTieu',
              align: 'right',
              width: 176,
              sorter: (a, b) => a.TongChiTieu - b.TongChiTieu,
              render: formatVND,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'TrangThai',
              width: 176,
              render: (t) => <TrangThaiKhach trangThai={t} />,
            },
            {
              title: 'Thao tác',
              key: 'tt',
              width: 200,
              fixed: manHinh.md ? 'right' : undefined,
              render: (_, r) => (
                <span className="cap-nut">
                  <Button size="small" onClick={() => setDangXem(r)} aria-label={`Xem ${r.MaKH}`}>
                    Xem
                  </Button>
                  <Button size="small" onClick={() => setForm({ open: true, dangSua: r })} aria-label={`Sửa ${r.MaKH}`}>
                    Sửa
                  </Button>
                  <Popconfirm
                    title={`Xóa khách hàng ${r.MaKH}?`}
                    description="Chỉ xóa được khách chưa có giao dịch hoặc lượt đổi quà."
                    okText="Xóa khách hàng"
                    cancelText="Không"
                    onConfirm={() => xoa(r)}
                  >
                    <Button size="small" aria-label={`Xóa ${r.MaKH}`}>
                      Xóa
                    </Button>
                  </Popconfirm>
                </span>
              ),
            },
          ]}
        />
      )}

      <ChiTietKhachHang kh={dangXem} dsHang={hang} onClose={() => setDangXem(null)} />
      <FormKhachHang
        open={form.open}
        dangSua={form.dangSua}
        onClose={() => setForm({ open: false, dangSua: null })}
        onSaved={() => {
          setForm({ open: false, dangSua: null })
          ds.reload()
        }}
      />
    </div>
  )
}
