export class Type {
  constructor(symbol) {
    this.symbol = symbol;
    this.type = this;
  }

  eq(other) {
    return this.type.symbol == other.type.symbol;
  }

  toString() {
    return this.symbol.description;
  }

  toHtml() {
    return textTag('value', this.toString());
  }

  signature() {
    return new TypeSet([this.type]);
  }
}

export class ConstructorType {
  constructor(type, terms = () => []) {
    this.type = new Type(type);
    this.terms = terms(this);
  }

  eq(other) {
    return this.type.eq(other.type);
  }

  signature() {
    return new TypeSet([this.type]);
  }

  ensure(other) {
    if (!other.type.eq(this.type)) return null;
    return this;
  }
}

export class OrType {
  constructor(type, terms) {
    this.type = new Type(type);
    this.terms = terms(this);
  }

  toString() {
    return this.type.toString();
  }

  eq(other) {
    return this.type.eq(other.type) && this.signature().eq(other.signature());
  }

  signature() {
    const set = new TypeSet();
    this.terms.forEach(term => set.addSet(term.signature()));
    return set;
  }

  ensure(other) {
    for (let i = 0; i < this.terms.length; i++) {
      const ensured = this.terms[i].ensure(other);
      if (ensured != null) return ensured;
    }
    return null;
  }

  toHtml() {
    return joinHtml(this.terms.map(t => t.toHtml()), pipe);
  }
}

export class TypeSet {
  constructor(types = []) {
    this.values = [];
    types.forEach(t => this.add(t));
  }

  add(value) {
    if (!this.has(value)) {
      this.values.push(value);
    }
  }

  has(value) {
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i].eq(value)) return true;
    }
    return false;
  }

  addSet(set) {
    set.values.forEach(v => this.add(v));
  }

  subset(set) {
    return this.values.every(v => set.has(v));
  }

  eq(set) {
    if (set.values.length != this.values.length) return false;
    return this.subset(set);
  }
}

export class InfiniteSet {
  constructor() {
    this.removed = [];
  }

  remove(value) {
    if (this.has(value)) {
      this.removed.push(value);
    }
  }

  has(value) {
    for (let i = 0; i < this.removed.length; i++) {
      if (this.removed[i].eq(value)) return false;
    }
    return true;
  }
}

export function typeEquals(t1, t2) {
  return t1 == t2;
}


export function rootConstructors(P) {
  // Iterate through rows
  const constructors = new TypeSet();
  for (let i = 0; i < P.rows.length; i++) {
    const row = P.rows[i];
    if (row.length == 0) {
      throw new Error('Cannot extract root constructors — empty matrix');
    }
    const p1 = row[0];
    constructors.addSet(p1.constructors());
  }
  return constructors;
}
