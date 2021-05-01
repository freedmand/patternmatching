import { clear, tag } from "./display";

export class Tester {
  constructor() {
    this.suites = [];
  }

  addSuite(name) {
    const suite = new TestSuite(name);
    this.suites.push(suite);
    return suite;
  }

  run() {
    this.suites.forEach(suite => suite.run());
  }

  report(container) {
    clear(container);

    // Fails first
    const passes = [];
    let numTestsPassed = 0;
    let fails = 0;
    this.suites.forEach(suite => {
      if (suite.fails.length > 0) {
        container.appendChild(suite.report());
        fails++;
      } else {
        passes.push(suite);
      }
      numTestsPassed += suite.passes.length;
    });

    // Passes
    const details = document.createElement('details');
    details.appendChild(tag('pass', `Suites passed ${passes.length}/${this.suites.length} (tests passed: ${numTestsPassed})`, 'summary'));
    const ul = document.createElement('ul');
    passes.forEach(suite => {
      ul.appendChild(tag('pass', `${suite.name}`, 'li'));
    });
    details.appendChild(ul);
    container.appendChild(details);
  }
}

export class TestSuite {
  constructor(name) {
    this.name = name;
    this.cases = [];
    this.passes = [];
    this.fails = [];
  }

  report() {
    if (this.fails.length == 0) {
      const details = document.createElement('details');
      details.appendChild(tag('pass', `${this.name}: All tests passed (n=${this.passes.length})`, 'summary'));
      const ul = document.createElement('ul');
      this.passes.forEach(name => {
        ul.appendChild(tag('pass', `${name}`, 'li'));
      });
      details.appendChild(ul);
      return details;
    } else {
      const details = document.createElement('details');
      details.appendChild(tag('fail', `${this.name}: Tests passed ${this.passes.length}/${this.passes.length + this.fails.length} (${this.fails.length} failed)`, 'summary'));
      const ul = document.createElement('ul');
      this.fails.forEach(({ name, e }) => {
        ul.appendChild(tag('fail', `${name}: ${e}`, 'li'));
        console.groupCollapsed(name);
        console.error(e);
        console.groupEnd();
      });
      details.appendChild(ul);
      return details;
    }
  }

  reset() {
    this.passes = [];
    this.fails = [];
  }

  case(name, fn) {
    this.cases.push({ name, fn });
  }

  run() {
    this.reset();
    this.cases.forEach(({ name, fn }) => {
      try {
        fn();
        this.passes.push(name);
      } catch (e) {
        this.fails.push({ name, e });
      }
    });
  }
}

export function err(msg) {
  throw new Error(msg);
}

export function expectMatrixEq(m1, m2) {
  if (m1.typeVector.length != m2.typeVector.length) {
    err(
      `Uneven type vector length ${m1.typeVector.length} vs ${m2.typeVector.length}`
    );
  }
  for (let i = 0; i < m1.typeVector.length; i++) {
    if (!m1.typeVector[i].eq(m2.typeVector[i])) {
      err(`Mismatch type at col ${i}`);
    }
  }
  if (m1.rows.length != m2.rows.length) {
    err(`Uneven rows ${m1.rows.length} vs ${m2.rows.length}`);
  }
  for (let i = 0; i < m1.rows.length; i++) {
    const c1 = m1.rows[i];
    const c2 = m2.rows[i];
    if (c1.length != c2.length) {
      err(`Uneven cols in row ${i}: ${c1.length} vs ${c2.length}`);
    }
    for (let j = 0; j < c1.length; j++) {
      if (!c1[j].eq(c2[j])) {
        err(`Mismatch row ${i} col ${j}`);
      }
    }
  }
  return 'pass';
}

export function expectEq(e1, e2) {
  if (e1.eq(e2)) return 'pass';
  throw new Error(`expected to be equal: ${e1} vs ${e2}`);
}

export function expectNotEq(e1, e2) {
  if (!e1.eq(e2)) return 'pass';
  throw new Error(`expected to not be equal: ${e1} vs ${e2}`);
}

export function expectSame(e1, e2) {
  if (e1 == e2) return 'pass';
  throw new Error(`expected to be same: ${e1} vs ${e2}`);
}

export function exportNotSame(e1, e2) {
  if (e1 != e2) return 'pass';
  throw new Error(`expected to not be same: ${e1} vs ${e2}`);
}

export function expectTrue(e) {
  if (e) return 'pass';
  throw new Error(`expected ${e} to be truthy`);
}

export function expectFalse(e) {
  if (!e) return 'pass';
  throw new Error(`expected ${e} to be falsy`);
}
