import {
  expectMatrixEq,
  expectEq,
  expectNotEq,
  expectFalse,
  expectTrue,
  Tester,
  expectSame,
} from "./tester";
import {
  Type,
  OrType,
  ConstructorType,
  TypeSet,
  rootConstructors,
} from "./types";
import { Wildcard, ConstructedPattern, OrPattern } from "./patterns";
import { Matrix } from "./matrix";
import {
  counterExample,
  exhaustive,
  specialized,
  useful,
  uselessClause,
  uselessPatterns,
} from "./useful";
import { matrixToHtml, tag } from "./display";

// Define types
const intType = new Type(Symbol("int"));
const mylist = new OrType(
  Symbol("mylist"),
  () => new ConstructorType(Symbol("Nil")),
  (mylist) =>
    new OrType(
      Symbol("mylist2"),
      () => new ConstructorType(Symbol("One"), () => [intType]),
      () => new ConstructorType(Symbol("Cons"), () => [intType, mylist])
    )
);
const nilType = mylist.term1;
const oneType = mylist.term2.term1;
const consType = mylist.term2.term2;

const wildcardPattern = new Wildcard();
const nilPattern = new ConstructedPattern(nilType);
const onePattern = new ConstructedPattern(oneType, wildcardPattern);
const consPattern = new ConstructedPattern(
  consType,
  wildcardPattern,
  wildcardPattern
);

// Define matrices
const P = new Matrix(
  [mylist, mylist],
  [
    [nilPattern, wildcardPattern],
    [wildcardPattern, nilPattern],
  ]
);
const Q = new Matrix(
  [mylist, mylist],
  [
    [nilPattern, wildcardPattern],
    [wildcardPattern, nilPattern],
    [onePattern, wildcardPattern],
    [wildcardPattern, onePattern],
    [consPattern, wildcardPattern],
    [wildcardPattern, consPattern],
  ]
);
const QPrime = new Matrix(
  [mylist, mylist],
  [
    [OrPattern.init(nilPattern, onePattern), wildcardPattern],
    [wildcardPattern, OrPattern.init(nilPattern, onePattern)],
    [onePattern, wildcardPattern],
    [wildcardPattern, onePattern],
    [consPattern, wildcardPattern],
    [wildcardPattern, consPattern],
  ]
);

// Scratchpad
document.body.appendChild(tag("", "Matrix:", "h3"));
document.body.appendChild(matrixToHtml(Q));
document.body.appendChild(document.createElement("hr"));

export default function runTests(container) {
  const t = new Tester();

  // Type equality
  const typeEqualitySuite = t.addSuite("Type Equality");
  typeEqualitySuite.case("nil == nil", () => expectTrue(nilType.eq(nilType)));
  typeEqualitySuite.case("nil.type == nil.type", () =>
    expectTrue(nilType.type.eq(nilType.type))
  );
  typeEqualitySuite.case("nil == nil.type", () =>
    expectTrue(nilType.eq(nilType.type))
  );
  typeEqualitySuite.case("nil.type == nil", () =>
    expectTrue(nilType.type.eq(nilType))
  );

  // Specialized
  const specializedSuite = t.addSuite("Specialized");
  specializedSuite.case("Q with Nil", () =>
    expectMatrixEq(
      specialized(nilType, Q),
      new Matrix(
        [mylist],
        [[wildcardPattern], [nilPattern], [onePattern], [consPattern]]
      )
    )
  );
  specializedSuite.case("Q with One", () =>
    expectMatrixEq(
      specialized(oneType, Q),
      new Matrix(
        [intType, mylist],
        [
          [wildcardPattern, nilPattern],
          [wildcardPattern, wildcardPattern],
          [wildcardPattern, onePattern],
          [wildcardPattern, consPattern],
        ]
      )
    )
  );
  specializedSuite.case("Q with Cons", () =>
    expectMatrixEq(
      specialized(consType, Q),
      new Matrix(
        [intType, mylist, mylist],
        [
          [wildcardPattern, wildcardPattern, nilPattern],
          [wildcardPattern, wildcardPattern, onePattern],
          [wildcardPattern, wildcardPattern, wildcardPattern],
          [wildcardPattern, wildcardPattern, consPattern],
        ]
      )
    )
  );

  // Signature
  const signatureSuite = t.addSuite("Signature");
  signatureSuite.case("nil one cons", () =>
    expectEq(mylist.signature(), new TypeSet([nilType, oneType, consType]))
  );
  signatureSuite.case("one cons nil", () =>
    expectEq(mylist.signature(), new TypeSet([oneType, consType, nilType]))
  );
  signatureSuite.case("missing nil", () =>
    expectNotEq(mylist.signature(), new TypeSet([oneType, consType]))
  );
  signatureSuite.case("duplicate nil", () =>
    expectEq(
      mylist.signature(),
      new TypeSet([nilType, oneType, consType, nilType])
    )
  );
  signatureSuite.case("extra mylist", () =>
    expectNotEq(
      mylist.signature(),
      new TypeSet([nilType, oneType, consType, mylist])
    )
  );

  // Usefulness
  const usefulSuite = t.addSuite("Useful");
  usefulSuite.case("nil wildcard not useful to P", () =>
    expectFalse(useful(P, [nilPattern, wildcardPattern]))
  );
  usefulSuite.case("nil nil not useful to P", () =>
    expectFalse(useful(P, [nilPattern, nilPattern]))
  );
  usefulSuite.case("wildcard useful to P", () =>
    expectTrue(useful(P, [wildcardPattern, wildcardPattern]))
  );
  usefulSuite.case("one wildcard useful to P", () =>
    expectTrue(useful(P, [onePattern, wildcardPattern]))
  );
  usefulSuite.case("nil wildcard not useful to Q", () =>
    expectFalse(useful(Q, [nilPattern, wildcardPattern]))
  );
  usefulSuite.case("nil nil not useful to Q", () =>
    expectFalse(useful(Q, [nilPattern, nilPattern]))
  );
  usefulSuite.case("wildcard not useful to Q", () =>
    expectFalse(useful(Q, [wildcardPattern, wildcardPattern]))
  );
  usefulSuite.case("one wildcard not useful to Q", () =>
    expectFalse(useful(Q, [onePattern, wildcardPattern]))
  );

  // Exhaustiveness
  const exhaustiveSuite = t.addSuite("Exhaustive");
  exhaustiveSuite.case("P not exhaustive", () => expectFalse(exhaustive(P)));
  exhaustiveSuite.case("Q exhaustive", () => {
    expectTrue(exhaustive(Q));
  });
  exhaustiveSuite.case("Q prime exhaustive", () => {
    expectTrue(exhaustive(QPrime));
  });

  // Uselessness
  const uselessSuite = t.addSuite("Useless");
  uselessSuite.case("P has no useless clause", () =>
    expectSame(uselessClause(P), null)
  );
  uselessSuite.case("Q has useless clause at end", () =>
    expectSame(uselessClause(Q), 5)
  );

  // Useless patterns
  const uselessPatternSuite = t.addSuite("Useless Pattern");
  uselessPatternSuite.case("redundant one", () =>
    expectEq(
      uselessPatterns(new Matrix([mylist], [[OrPattern.init(onePattern)]]), [
        OrPattern.init(onePattern, nilPattern, consPattern),
      ]),
      new TypeSet([onePattern])
    )
  );
  uselessPatternSuite.case("redundant one and cons", () =>
    expectEq(
      uselessPatterns(
        new Matrix([mylist], [[OrPattern.init(onePattern, consPattern)]]),
        [OrPattern.init(onePattern, nilPattern, consPattern)]
      ),
      new TypeSet([onePattern, consPattern])
    )
  );
  uselessPatternSuite.case("all redundant (should be useless)", () =>
    expectSame(
      uselessPatterns(
        new Matrix(
          [mylist],
          [[OrPattern.init(onePattern, consPattern, nilPattern)]]
        ),
        [OrPattern.init(onePattern, nilPattern, consPattern)]
      ),
      null
    )
  );

  // Counter-examples
  const counterExampleSuite = t.addSuite("Counter-Example");
  counterExampleSuite.case("P has example", () =>
    expectTrue(counterExample(P) != null)
  );
  counterExampleSuite.case("Q has no example", () =>
    expectFalse(counterExample(Q) != null)
  );
  counterExampleSuite.case("Q[:-1] has no example", () =>
    expectFalse(counterExample(Q.sliceRows(0, -1)) != null)
  );
  counterExampleSuite.case("Q[:-2] has example", () =>
    expectTrue(counterExample(Q.sliceRows(0, -2)) != null)
  );

  t.run();
  t.report(container);
}
