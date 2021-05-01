export class Matrix {
  constructor(typeVector, rows) {
    this.typeVector = typeVector;
    this.rows = rows;
  }

  sliceRows(...args) {
    return new Matrix(this.typeVector, this.rows.slice(...args));
  }

  sliceCols(...args) {
    return new Matrix(this.typeVector.slice(...args), this.rows.map(cols => cols.slice(...args)));
  }
}
