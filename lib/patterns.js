import { oldConstructorHtml, textTag } from './display';
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
  constructor(...patterns) {
    this.patterns = patterns;
  }

  toHtml() {
    return joinHtml(this.patterns.map(p => p.toHtml()), pipe);
  }

  eq(other) {
    return (
      other instanceof OrPattern &&
      this.patterns.length == other.patterns.length &&
      this.patterns.every((p, i) => p.eq(other.patterns[i]))
    );
  }

  constructors() {
    const result = new TypeSet();
    this.patterns.forEach(p => result.addSet(p.constructors()));
    return result;
  }
}
