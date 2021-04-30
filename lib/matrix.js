export class Matrix {
  constructor(typeVector, rows) {
    this.typeVector = typeVector;
    this.rows = rows;
  }

  slice(...args) {
    return new Matrix(this.typeVector.slice(...args), this.rows.map(cols => cols.slice(...args)));
  }
}
