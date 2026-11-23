import { Link } from 'react-router-dom'
import { NGUON_ANH } from '../data/anh.js'

/** Nguồn, tác giả và giấy phép của các ảnh minh họa (ghi nguồn theo yêu cầu của giấy phép CC BY, CC BY-SA). */
export default function NguonAnh() {
  return (
    <main className="trang-nguon">
      <div className="cap">
        <Link to="/">Về trang đầu</Link>
        <h1>Nguồn ảnh minh họa</h1>
        <p>
          Ảnh trong app là ảnh minh họa tạm thời, lấy từ Wikimedia Commons và dùng theo giấy phép ghi ở từng dòng. Ảnh đã được
          cắt và thu nhỏ. Khi nhóm có poster phim hoặc ảnh rạp thật được phép dùng, các ảnh này sẽ được thay.
        </p>
      </div>
      <ul className="ds-hang">
        {NGUON_ANH.map((a) => (
          <li key={a.tenTep} className="dong-nguon">
            <img className="anh-vuong" src={a.anh} alt="" loading="lazy" decoding="async" />
            <span className="cap">
              <b>{a.dungCho}</b>
              <small>
                Ảnh <a href={a.trang}>{a.tenTep}</a>, tác giả {a.tacGia}, giấy phép{' '}
                {a.urlGiayPhep ? <a href={a.urlGiayPhep}>{a.giayPhep}</a> : a.giayPhep}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
