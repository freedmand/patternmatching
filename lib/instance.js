export function instance(pattern, value) {
  if (pattern instanceof Wildcard) return true;
  if (pattern instanceof OrPattern) {
    return pattern.patterns.some(subpattern => instance(subpattern, value));
  }
  if (pattern instanceof ConstructedPattern) {
    // Ensure constructed types are the same
    if (!typeEquals(pattern.type, value.type)) {
      throw new Error('Mismatched types');
    }
    return instance(pattern.patterns, value.values);
  }
  if (Array.isArray(pattern) && Array.isArray(value)) {
    // Ensure arrays are of equal length
    if (pattern.length != value.length) {
      throw new Error('Different number of args');
    }
    return pattern.every((subpattern, i) => instance(subpattern, value[i]));
  }
  throw new Error('Unexpected args');
}

