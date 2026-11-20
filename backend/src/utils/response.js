/**
 * Chuẩn hóa phản hồi API theo Hợp đồng API (docs/01-hop-dong-api.md)
 */

export function successResponse(res, data = null, message = '', status = 200) {
  return res.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  })
}

export function errorResponse(res, message = 'Yêu cầu thất bại', status = 400, details = null) {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  })
}
