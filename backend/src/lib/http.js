export function ok(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null
  });
}

export function fail(res, status, error, data = null) {
  return res.status(status).json({
    success: false,
    data,
    error
  });
}
