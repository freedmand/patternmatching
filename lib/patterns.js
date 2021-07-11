import { joinHtml, oldConstructorHtml, textTag, pipe } from './display';
import { TypeSet } from './types';

export class Wildcard {
  toHtml() {
    return textTag('null', '_');
  }

  eq(other) {
    return other instanceof Wildcard;
  }

  constructors() {
    return new TypeSet();
  }

  static n(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      results.push(new Wildcard());
    }
    return results;
  }
}

export class ConstructedPattern {
  constructor(type, ...patterns) {
    this.type = type;
    this.patterns = patterns;
  }

  toHtml() {
    return oldConstructorHtml(this.type.type.toString(), this.patterns);
  }

  eq(other) {
    return (
      other instanceof ConstructedPattern &&
      this.type.eq(other.type) &&
      this.patterns.length == other.patterns.length &&
      this.patterns.every((p, i) => p.eq(other.patterns[i]))
    );
  }

  constructors() {
    return new TypeSet([this.type]);
  }
}

export class OrPattern {
  constructor(pattern1, pattern2) {
    this.pattern1 = pattern1;
    this.pattern2 = pattern2;
  }

  static init(...patterns) {
    if (patterns.length == 0) throw new Error('too few patterns');
    if (patterns.length == 1) return patterns[0];
    return new OrPattern(patterns[0], OrPattern.init(...patterns.slice(1)));
  }

  toHtml() {
    return joinHtml([this.pattern1, this.pattern2].map(p => p.toHtml()), pipe);
  }

  eq(other) {
    return (
      other instanceof OrPattern &&
      [this.pattern1, this.pattern2].every((p, i) => p.eq(other.patterns[i]))
    );
  }

  constructors() {
    const result = new TypeSet();
    result.addSet(this.pattern1.constructors());
    result.addSet(this.pattern2.constructors());
    return result;
  }
}
