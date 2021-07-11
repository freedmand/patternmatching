import { ConstructedPattern, Wildcard, OrPattern } from "./patterns";
import { rootConstructors, TypeSet } from "./types";
import { Matrix, eraseVector } from "./matrix";

const EXAMPLE_OR_CUTOFF = 3; // above this number, just pick one constructor at random

export function specialized(c, P) {
  const newRows = [];
  for (let i = 0; i < P.rows.length; i++) {
    const p1 = P.rows[i][0];
    const pRest = P.rows[i].slice(1);
    if (p1 instanceof ConstructedPattern) {
      if (p1.type.eq(c)) {
        // Condition (1) -- constructor
        const newRow = [];
        p1.patterns.forEach((p) => newRow.push(p));
        pRest.forEach((p) => newRow.push(p));
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
      pRest.forEach((p) => newRow.push(p));
      newRows.push(newRow);
    }
    if (p1 instanceof OrPattern) {
      // Condition (4) -- or
      const newMatrix = [];
      [p1.pattern1, p1.pattern2].forEach((p) => {
        const newRow = [p];
        pRest.forEach((pr) => newRow.push(pr));
        newMatrix.push(newRow);
      });
      const newSpecialized = specialized(
        c,
        new Matrix(P.typeVector, newMatrix)
      );
      newSpecialized.rows.forEach((newRow) => newRows.push(newRow));
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
      [p1.pattern1, p1.pattern2].forEach((p) => {
        const newRow = [p];
        pRest.forEach((pr) => newRow.push(pr));
        explodedMatrix.push(newRow);
      });
      const newDefault = defaultMatrix(P.typeVector, explodedMatrix);
      newDefault.forEach((newRow) => newRows.push(newRow));
    }
  }
  return new Matrix(P.typeVector.slice(1), newRows);
}

export function useful(P, q) {
  // Handle base cases
  if (P.rows.length == 0) {
    return true;
  }
  if (P.rows[0].length == 0) {
    return false;
  }

  const constructorUseful = (c) => {
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
    const sigma = rootConstructors(P);
    const signature = P.typeVector[0].signature();
    if (sigma.eq(signature)) {
      // (a) Complete signature
      return sigma.values.some((c) => constructorUseful(c));
    } else {
      // (b) Incomplete signature
      return useful(defaultMatrix(P), q.slice(1));
    }
  }
  if (q1 instanceof OrPattern) {
    // Case 3: or-pattern
    return [q1.pattern1, q1.pattern2].some((pattern) =>
      useful(P, [pattern].concat(q.slice(1)))
    );
  }
  throw new Error("Unexpected input");
}

export function uselessPatterns(P, p, Q = null, q = null, R = null, r = null) {
  // Initialization
  if (Q == null) Q = new Matrix([], []);
  if (R == null) R = new Matrix([], []);
  if (q == null) q = [];
  if (r == null) r = [];

  const constructorUseful = (c) => {
    const subSpecialized = specialized(c, new Matrix(P.typeVector, [p]));
    if (subSpecialized.rows.length != 1) {
      throw new Error(
        `Expected pattern to generate one row, got ${subSpecialized.rows.length}`
      );
    }
    return uselessPatterns(
      specialized(c, P),
      subSpecialized.rows[0],
      Q,
      q,
      R,
      r
    );
  };

  // E computation
  const eLogic = (r1, r2, e1, e2) => {
    // Following figure 1 (p. 22)
    if (e1 == null && e2 == null) return null;
    if (e1 == null && e2.length == 0) return new TypeSet([r1]);
    if (e1 == null) return new TypeSet([r1]).concat(e2);
    if (e2 == null && e1.length == 0) return new TypeSet([r2]);
    if (e2 == null) return e1.concat(new TypeSet([r2]));
    return e1.concat(e2);
  };
  const E1 = (j) => {
    const rj = r[j];
    const t1 = rj.pattern1;
    return uselessPatterns(
      R.reduce(j),
      [t1],
      R.erase(j).concat(Q),
      eraseVector(r, j).concat(q),
      null,
      null
    );
  };
  const E2 = (j) => {
    const rj = r[j];
    const t1 = rj.pattern1;
    const t2 = rj.pattern2;
    const newR = R.reduce(j).pop([t1]);
    const rSubJQ = eraseVector(r, j).concat(q);
    return uselessPatterns(
      newR,
      [t2],
      R.erase(j).concat(Q).pop(rSubJQ),
      rSubJQ,
      null,
      null
    );
  };
  const ER = (j) => {
    const rj = r[j];
    const r1 = rj.pattern1;
    const r2 = rj.pattern2;
    const e1 = E1(j);
    const e2 = E2(j);
    return eLogic(r1, r2, e1, e2);
  };
  const eUnion = (eSets) => {
    const result = new TypeSet();
    for (let i = 0; i < eSets.length; i++) {
      if (eSets[i] == null) {
        if (i != 0)
          throw new Error("Useless pattern should not occur later in stream");
        return null;
      }
      result.addSet(eSets[i]);
    }
    return result;
  };

  // Shift functions
  const shift1 = () => {
    const firstCol = P.sliceCols(0, 1);
    const firstTerm = p.slice(0, 1);
    return uselessPatterns(
      P.sliceCols(1),
      p.slice(1),
      Q.shift(firstCol),
      firstTerm.concat(q),
      R,
      r
    );
  };
  const shift2 = () => {
    const firstCol = P.sliceCols(0, 1);
    const firstTerm = p.slice(0, 1);
    return uselessPatterns(
      P.sliceCols(1),
      p.slice(1),
      Q,
      q,
      R.shift(firstCol),
      firstTerm.concat(r)
    );
  };

  // Handle base cases
  if (P.rows.length == 0) {
    return new TypeSet();
  }
  if (P.rows[0].length == 0) {
    // Case 4 (from paper, thus out-of-order): no columns
    if (r.length == 0) {
      // (a) No or-patterns
      const qUseful = useful(Q, q);
      // Empty typeset means there are no useless patterns and the row is useful
      // null (distinguished) means all patterns are useless and so is the row
      return qUseful ? new TypeSet() : null;
    } else {
      // (b) Examine or-patterns
      const eSet = new TypeSet();
      for (let i = 0; i < r.length; i++) {
        const eResults = ER(i);
        if (eResults == null) {
          if (i != 0)
            throw new Error("Useless pattern should not occur later in stream");
          return null;
        }
        eSet.addSet(eResults);
      }
      return eSet;
    }
  }

  const p1 = p[0];
  if (p1 instanceof ConstructedPattern) {
    // Case 1: constructed pattern
    const c = p1.type;
    return constructorUseful(c);
  }
  if (p1 instanceof Wildcard) {
    // Case 2: wildcard
    return shift1();
  }
  if (p1 instanceof OrPattern) {
    // Case 3: or-pattern
    return shift2();
  }
}

export function uselessClause(P) {
  for (let i = 1; i < P.rows.length; i++) {
    if (!useful(P.sliceRows(0, i), P.rows[i])) return i;
  }
  return null;
}

export function exhaustive(P) {
  const wildcards = Wildcard.n(P.typeVector.length);
  return !useful(P, wildcards);
}

export function counterExample(P) {
  // Handle base cases
  if (P.rows.length == 0) {
    return [];
  }
  if (P.rows[0].length == 0) {
    // Exhaustiveness indicated by null
    return null;
  }

  // Induction
  const sigma = rootConstructors(P);
  const signature = P.typeVector[0].signature();
  if (sigma.eq(signature)) {
    // 1. Complete signature
    const constructors = sigma.values.filter(
      (constructor) => constructor instanceof ConstructedPattern
    );
    for (let i = 0; i < constructors.length; i++) {
      // Check for counter-examples amongst constructors recursively
      const constructor = constructors[i];
      const example = counterExample(specialized(constructor, P));
      if (example != null) {
        // a. Counter-example found: unravel
        return [constructor].concat(example.slice(constructor.terms.length));
      }
      // b. No counter-examples found? Exhaustive
      return null;
    }
  } else {
    // 2. Incomplete signature
    const example = counterExample(defaultMatrix(P));
    if (example == null) {
      // a. Default matrix is exhaustive
      return null;
    } else if (sigma.values.length == 0) {
      // b. Sigma is empty
      return [new Wildcard()].concat(example);
    } else {
      // c. Sigma is not empty: find an unused constructor
      const unused = signature.subtract(sigma);
      if (unused.length == 0) {
        throw new Error("Expected incomplete signature");
      }
      if (unused.length <= EXAMPLE_OR_CUTOFF && unused.length > 1) {
        // If under cutoff, specify a range of or-patterns
        return [
          new OrPattern(
            unused.map(
              (u) => new ConstructedPattern(u, ...Wildcard.n(u.type.numTerms))
            )
          ),
        ].concat(example);
      }
      return [
        new ConstructedPattern(
          unused[0],
          ...Wildcard.n(unused[0].type.numTerms)
        ),
      ].concat(example);
    }
  }
}
