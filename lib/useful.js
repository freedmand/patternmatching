import { ConstructedPattern, Wildcard, OrPattern } from './patterns';
import { rootConstructors } from './types';
import { Matrix } from './matrix';

export function specialized(c, P) {
  const newRows = [];
  for (let i = 0; i < P.rows.length; i++) {
    const p1 = P.rows[i][0];
    const pRest = P.rows[i].slice(1);
    if (p1 instanceof ConstructedPattern) {
      if (p1.type.eq(c)) {
        // Condition (1) -- constructor
        const newRow = [];
        p1.patterns.forEach(p => newRow.push(p));
        pRest.forEach(p => newRow.push(p));
        newRows.push(newRow);
      }
      // Condition (2) -- no row, otherwise
    }
    if (p1 instanceof Wildcard) {
      // Condition (3) -- wildcard
      const newRow = [];
      for (let j = 0; j < c.terms.length; j++) {
        newRow.push(new Wildcard());
      }
      pRest.forEach(p => newRow.push(p));
      newRows.push(newRow);
    }
    if (p1 instanceof OrPattern) {
      // Condition (4) -- or
      const newMatrix = [];
      p1.patterns.forEach(p => {
        const newRow = [p];
        pRest.forEach(pr => newRow.push(pr));
        newMatrix.push(newRow);
      });
      const newSpecialized = specialized(c, newMatrix);
      newSpecialized.forEach(newRow => newRows.push(newRow));
    }
  }
  return new Matrix([...c.terms, ...P.typeVector.slice(1)], newRows);
}

export function defaultMatrix(P) {
  const newRows = [];
  for (let i = 0; i < P.rows.length; i++) {
    const p1 = P.rows[i][0];
    const pRest = P.rows[i].slice(1);
    if (p1 instanceof ConstructedPattern) {
      // Condition (1) -- no row
      continue;
    }
    if (p1 instanceof Wildcard) {
      // Condition (2) -- wildcard
      newRows.push(pRest);
    }
    if (p1 instanceof OrPattern) {
      // Condition (3) -- or
      const explodedMatrix = [];
      p1.patterns.forEach(p => {
        const newRow = [p];
        pRest.forEach(pr => newRow.push(pr));
        explodedMatrix.push(newRow);
      });
      const newDefault = defaultMatrix(P.typeVector, explodedMatrix);
      newDefault.forEach(newRow => newRows.push(newRow));
    }
  }
  return new Matrix(P.typeVector.slice(1), newRows);
}

export function useful(P, q) {
  console.log(q);
  // Handle base cases
  if (P.rows.length == 0) {
    return true;
  }
  if (P.rows[0].length == 0) {
    return false;
  }

  const constructorUseful = c => {
    const subSpecialized = specialized(c, new Matrix(P.typeVector, [q]));
    if (subSpecialized.rows.length != 1) {
      throw new Error(
        `Expected pattern to generate one row, got ${subSpecialized.rows.length}`
      );
    }
    return useful(specialized(c, P), subSpecialized.rows[0]);
  };

  // Induction
  const q1 = q[0];
  if (q1 instanceof ConstructedPattern) {
    // Case 1: constructed pattern
    const c = q1.type;
    return constructorUseful(c);
  }
  if (q1 instanceof Wildcard) {
    // Case 2: wildcard
    const constructors = rootConstructors(P);
    const signature = P.typeVector[0].signature();
    if (constructors.eq(signature)) {
      // (a) Complete signature
      return constructors.values.some(c => constructorUseful(c));
    } else {
      // (b) Not complete signature
      return useful(defaultMatrix(P), q.slice(1));
    }
  }
  if (q1 instanceof OrPattern) {
    // Case 3: or pattern
    return q1.patterns.some(pattern => useful(P, [pattern].concat(q.slice(1))));
  }
  throw new Error('Unexpected input');
}

export function exhaustive(P) {
  const wildcards = P.typeVector.map(_ => new Wildcard());
  return !useful(P, wildcards);
}
