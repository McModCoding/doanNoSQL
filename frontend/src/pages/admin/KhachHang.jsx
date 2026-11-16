import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Badge,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Timeline,
  Tooltip,
} from 'antd'
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
import { TierProgress } from '../../components/TierProgress.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatDiemCoDau, formatNgay, formatNgayGio, formatVND } from '../../utils/format.js'
import { NHAN_TRANG_THAI_KH, nhanTrangThaiDoiThuong, tomTatChiTiet } from '../../utils/nhan.js'

function ChiTietKhachHang({ kh, dsHang, onClose }) {
  const maKH = kh?.MaKH
  const diem = useApi(() => (maKH ? layBienDongDiem(maKH) : []), [maKH])
  const gd = useApi(() => (maKH ? layGiaoDichCuaKhach(maKH) : []), [maKH])
  const qua = useApi(() => (maKH ? layDoiThuongCuaKhach(maKH) : []), [maKH])
  const hang = useApi(() => (maKH ? layLichSuHang(maKH) : []), [maKH])

  return (
    <Drawer open={Boolean(kh)} onClose={onClose} size={760} title={kh ? `${kh.HoTen} (${kh.MaKH})` : ''} destroyOnHidden>
      {kh && (
        <>
          <Descriptions
            size="small"
            column={2}
            bordered
            styles={{ label: { whiteSpace: 'nowrap', width: 120 } }}
            items={[
              { key: 'sdt', label: 'Số điện thoại', children: kh.SoDienThoai },
              { key: 'the', label: 'Mã thẻ', children: kh.MaThe },
              { key: 'email', label: 'Email', children: kh.Email ?? '—', span: 2 },
              { key: 'ns', label: 'Ngày sinh', children: formatNgay(kh.NgaySinh) },
              { key: 'gt', label: 'Giới tính', children: kh.GioiTinh ?? '—' },
              { key: 'dk', label: 'Ngày đăng ký', children: formatNgay(kh.NgayDangKy) },
              { key: 'tt', label: 'Trạng thái', children: NHAN_TRANG_THAI_KH[kh.TrangThai] ?? kh.TrangThai },
              { key: 'diem', label: 'Điểm hiện tại', children: <b>{formatDiem(kh.DiemHienTai)}</b> },
              { key: 'ct', label: 'Tổng chi tiêu', children: formatVND(kh.TongChiTieu) },
            ]}
          />
          <div className="drawer-block">
            <TierProgress tongChiTieu={kh.TongChiTieu} dsHang={dsHang} hienQuyenLoi={false} />
          </div>
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
                      { title: 'Thời gian', dataIndex: 'NgayTao', render: formatNgayGio, width: 150 },
                      { title: 'Loại', dataIndex: 'LoaiBienDong', width: 90 },
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
                      { title: 'Mã', dataIndex: 'MaGiaoDich', width: 90 },
                      { title: 'Thời gian', dataIndex: 'NgayTao', render: formatNgayGio, width: 140 },
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
                      { title: 'Ngày đổi', dataIndex: 'NgayDoi', render: formatNgay, width: 100 },
                      { title: 'Phần thưởng', dataIndex: 'TenPhanThuong' },
                      { title: 'Mã voucher', dataIndex: 'MaVoucher' },
                      { title: 'Điểm', dataIndex: 'DiemDaDoi', align: 'right', render: formatDiem },
                      { title: 'Trạng thái', key: 'tt', render: (_, r) => nhanTrangThaiDoiThuong(r) },
                    ]}
                  />
                ),
              },
              {
                key: 'hang',
                label: 'Lịch sử hạng',
                children: (
                  <Timeline
                    items={(hang.data ?? []).map((l) => ({
                      key: l._id ?? l.NgayThayDoi,
                      title: formatNgay(l.NgayThayDoi),
                      content: (
                        <span>
                          {l.HangCu ? (
                            <>
                              <TierTag maHang={l.HangCu} dsHang={dsHang} /> → <TierTag maHang={l.HangMoi} dsHang={dsHang} />
                            </>
                          ) : (
                            <>
                              Bắt đầu: <TierTag maHang={l.HangMoi} dsHang={dsHang} />
                            </>
                          )}{' '}
                          <small>– {l.LyDo}</small>
                        </span>
                      ),
                    }))}
                  />
                ),
              },
            ]}
          />
        </>
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
      okText={dangSua ? 'Lưu thay đổi' : 'Thêm'}
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
        <Space size={16} style={{ display: 'flex' }}>
          <Form.Item name="NgaySinh" label="Ngày sinh">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="GioiTinh" label="Giới tính">
            <Select style={{ width: 120 }} allowClear options={['Nam', 'Nữ', 'Khác'].map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          {dangSua && (
            <Form.Item name="TrangThai" label="Trạng thái">
              <Select
                style={{ width: 170 }}
                options={Object.entries(NHAN_TRANG_THAI_KH).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          )}
        </Space>
        {!dangSua && <small>Khách mới bắt đầu ở hạng thấp nhất với 0 điểm.</small>}
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
    <div className="admin-page">
      <div className="filter-row">
        <Input.Search
          allowClear
          placeholder="Tìm theo tên, SĐT, mã KH, email"
          style={{ width: 300 }}
          onSearch={(q) => setBoLoc((b) => ({ ...b, q }))}
          aria-label="Tìm khách hàng"
        />
        <Select
          allowClear
          placeholder="Hạng"
          style={{ width: 130 }}
          value={boLoc.maHang}
          onChange={(maHang) => setBoLoc((b) => ({ ...b, maHang }))}
          options={hang.map((h) => ({ value: h.MaHang, label: h.TenHang }))}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 170 }}
          value={boLoc.trangThai}
          onChange={(trangThai) => setBoLoc((b) => ({ ...b, trangThai }))}
          options={Object.entries(NHAN_TRANG_THAI_KH).map(([value, label]) => ({ value, label }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setForm({ open: true, dangSua: null })} style={{ marginLeft: 'auto' }}>
          Thêm khách hàng
        </Button>
      </div>

      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : (
        <Table
          rowKey="MaKH"
          loading={ds.loading}
          dataSource={ds.data}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} khách hàng` }}
          scroll={{ x: 900 }}
          onRow={(r) => ({ onDoubleClick: () => setDangXem(r) })}
          columns={[
            { title: 'Mã KH', dataIndex: 'MaKH', width: 90 },
            { title: 'Họ tên', dataIndex: 'HoTen' },
            { title: 'Số điện thoại', dataIndex: 'SoDienThoai', width: 130 },
            { title: 'Hạng', dataIndex: 'MaHangHienTai', width: 100, render: (m) => <TierTag maHang={m} dsHang={hang} /> },
            {
              title: 'Điểm hiện tại',
              dataIndex: 'DiemHienTai',
              align: 'right',
              width: 130,
              sorter: (a, b) => a.DiemHienTai - b.DiemHienTai,
              render: formatDiem,
            },
            {
              title: 'Tổng chi tiêu',
              dataIndex: 'TongChiTieu',
              align: 'right',
              width: 150,
              sorter: (a, b) => a.TongChiTieu - b.TongChiTieu,
              render: formatVND,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'TrangThai',
              width: 160,
              render: (t) => <Badge status={t === 'ACTIVE' ? 'success' : 'default'} text={NHAN_TRANG_THAI_KH[t] ?? t} />,
            },
            {
              title: 'Thao tác',
              key: 'tt',
              width: 130,
              fixed: 'right',
              render: (_, r) => (
                <Space size={4}>
                  <Tooltip title="Xem chi tiết">
                    <Button size="small" icon={<EyeOutlined />} onClick={() => setDangXem(r)} aria-label={`Xem ${r.MaKH}`} />
                  </Tooltip>
                  <Tooltip title="Sửa">
                    <Button size="small" icon={<EditOutlined />} onClick={() => setForm({ open: true, dangSua: r })} aria-label={`Sửa ${r.MaKH}`} />
                  </Tooltip>
                  <Popconfirm
                    title={`Xóa khách hàng ${r.MaKH}?`}
                    description="Chỉ xóa được khách chưa có giao dịch/đổi quà."
                    okText="Xóa"
                    okButtonProps={{ danger: true }}
                    cancelText="Không"
                    onConfirm={() => xoa(r)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Xóa ${r.MaKH}`} />
                  </Popconfirm>
                </Space>
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
