import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import { layDsPhanThuong } from '../../api/phanThuong.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { MAU } from '../../design/tokens.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatVND } from '../../utils/format.js'
import { NHAN_LOAI_PHAN_THUONG } from '../../utils/nhan.js'

const NGUONG_SAP_HET = 30

function TonKho({ soLuong }) {
  if (soLuong <= 0)
    return (
      <span className="nhan-trang-thai" style={{ color: MAU.loi }}>
        <WarningOutlined /> Hết quà
      </span>
    )
  if (soLuong < NGUONG_SAP_HET)
    return (
      <span className="nhan-trang-thai" style={{ color: MAU.dangCho }}>
        <ClockCircleOutlined /> Còn {formatDiem(soLuong)}, sắp hết
      </span>
    )
  return formatDiem(soLuong)
}

export default function PhanThuongAdmin() {
  const ds = useApi(() => layDsPhanThuong({}), [])
  const data = ds.data ?? []

  return (
    <div className="qt-trang" style={{ gap: 24 }}>
      <h1>Phần thưởng</h1>

      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : (
        <Table
          rowKey="MaPhanThuong"
          loading={ds.loading}
          dataSource={data}
          pagination={false}
          scroll={{ x: 960 }}
          columns={[
            { title: 'Mã', dataIndex: 'MaPhanThuong', width: 88 },
            {
              title: 'Phần thưởng',
              dataIndex: 'TenPhanThuong',
              render: (t, r) => (
                <span>
                  {t}
                  <span className="o-chu-phu">{r.MoTa}</span>
                </span>
              ),
            },
            { title: 'Loại', dataIndex: 'LoaiPhanThuong', width: 176, render: (l) => NHAN_LOAI_PHAN_THUONG[l] ?? l },
            {
              title: 'Điểm cần đổi',
              dataIndex: 'DiemCanDoi',
              align: 'right',
              width: 152,
              sorter: (a, b) => a.DiemCanDoi - b.DiemCanDoi,
              render: formatDiem,
            },
            { title: 'Giá trị', dataIndex: 'GiaTri', align: 'right', width: 112, render: formatVND },
            {
              title: 'Tồn kho',
              dataIndex: 'SoLuongTon',
              align: 'right',
              width: 176,
              sorter: (a, b) => a.SoLuongTon - b.SoLuongTon,
              render: (n) => <TonKho soLuong={n} />,
            },
            { title: 'Hạn dùng', dataIndex: 'HanSuDungNgay', align: 'right', width: 112, render: (n) => `${n} ngày` },
          ]}
        />
      )}
    </div>
  )
}
