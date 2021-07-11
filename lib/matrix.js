export function eraseVector(vec, column) {
  return vec.slice(0, column).concat(vec.slice(column + 1));
}

function concatColumns(rows1, rows2) {
  if (rows1.length == 0) return rows2;
  if (rows2.length == 0) return rows1;
  return rows1.map((row, i) => row.concat(rows2[i]));
}

export class Matrix {
  constructor(typeVector, rows) {
    this.typeVector = typeVector;
    this.rows = rows;
  }

  shift(matrix) {
    // Insert matrix at front
    return new Matrix(matrix.typeVector.concat(this.typeVector), concatColumns(matrix.rows, this.rows));
  }

  sliceRows(...args) {
    return new Matrix(this.typeVector, this.rows.slice(...args));
  }

  sliceCols(...args) {
    return new Matrix(this.typeVector.slice(...args), this.rows.map(cols => cols.slice(...args)));
  }

  reduce(column) {
    return new Matrix([this.typeVector[column]], this.rows.map(r => [r[column]]));
  }

  erase(column) {
    return new Matrix(
      eraseVector(this.typeVector, column),
      this.rows.map(r => eraseVector(r, column))
    )
  }

  concat(otherMatrix) {
    return new Matrix(this.typeVector.concat(otherMatrix.typeVector),
      concatColumns(this.rows, otherMatrix.rows)
    )
  }

  pop(row) {
    return new Matrix(this.typeVector, this.rows.concat([row]))
  }
}
