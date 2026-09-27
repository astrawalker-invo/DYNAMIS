/**
 * @param {import('@influxdata/influxdb-client').QueryApi} queryApiInstance
 * @param {string} fluxQuery
 * @returns {Promise<Record<string, unknown>[]>}
 */
export function runFlux(queryApiInstance, fluxQuery) {
  if (!queryApiInstance) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const rows = [];
    queryApiInstance.queryRows(fluxQuery, {
      next(row, tableMeta) {
        rows.push(tableMeta.toObject(row));
      },
      error: reject,
      complete() {
        resolve(rows);
      },
    });
  });
}
