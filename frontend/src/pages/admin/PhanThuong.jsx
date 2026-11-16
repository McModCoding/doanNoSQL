import { WarningOutlined } from '@ant-design/icons'
import { Table, Tag } from 'antd'
import { layDsPhanThuong } from '../../api/phanThuong.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatVND } from '../../utils/format.js'
import { NHAN_LOAI_PHAN_THUONG } from '../../utils/nhan.js'

export default function PhanThuongAdmin() {
  const ds = useApi(() => layDsPhanThuong({}), [])
  if (ds.error && !ds.data) return <ErrorState error={ds.error} onRetry={ds.reload} />
  return (
    <div className="admin-page">
      <Table
        rowKey="MaPhanThuong"
        loading={ds.loading}
        dataSource={ds.data}
        pagination={false}
        scroll={{ x: 900 }}
        columns={[
          { title: 'Mã', dataIndex: 'MaPhanThuong', width: 80 },
          {
            title: 'Phần thưởng',
            dataIndex: 'TenPhanThuong',
            render: (t, r) => (
              <span className="reward-cell">
                <span aria-hidden>{r.HinhAnh}</span>
                <span>
                  {t}
                  <small className="muted">{r.MoTa}</small>
                </span>
              </span>
            ),
          },
          { title: 'Loại', dataIndex: 'LoaiPhanThuong', width: 170, render: (l) => <Tag variant="filled">{NHAN_LOAI_PHAN_THUONG[l] ?? l}</Tag> },
          { title: 'Điểm cần đổi', dataIndex: 'DiemCanDoi', align: 'right', width: 120, render: formatDiem },
          { title: 'Giá trị', dataIndex: 'GiaTri', align: 'right', width: 110, render: formatVND },
          {
            title: 'Tồn kho',
            dataIndex: 'SoLuongTon',
            align: 'right',
            width: 140,
            render: (n) =>
              n <= 0 ? (
                <Tag color="error" icon={<WarningOutlined />}>
                  Hết hàng
                </Tag>
              ) : n < 30 ? (
                <span>
                  {n} <Tag color="warning">Sắp hết</Tag>
                </span>
              ) : (
                formatDiem(n)
              ),
          },
          { title: 'Hạn dùng (ngày)', dataIndex: 'HanSuDungNgay', align: 'right', width: 130 },
        ]}
      />
    </div>
  )
}
