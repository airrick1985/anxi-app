/** Stack independently calculated plan layouts on one worksheet without mixing rates or categories. */
export function combineCommissionGrids(grids, name) {
  if (!grids.length) return null;
  const nCols = Math.max(...grids.map(g => g.nCols));
  const result = { name, nCols, nRows: 0, cols: Array(nCols).fill(0), rowHeights: [], cells: [], merges: [], base: grids[0].base };
  grids.forEach((grid, index) => {
    if (index) {
      result.cells.push(Array(nCols).fill(null));
      result.rowHeights.push(24);
      result.nRows++;
    }
    const offset = result.nRows;
    grid.cols.forEach((width, col) => { result.cols[col] = Math.max(result.cols[col], width); });
    result.cells.push(...grid.cells.map(row => [...row, ...Array(nCols - row.length).fill(null)]));
    result.rowHeights.push(...grid.rowHeights);
    result.merges.push(...grid.merges.map(m => ({ ...m, r1: m.r1 + offset, r2: m.r2 + offset })));
    result.nRows += grid.nRows;
  });
  return result;
}
