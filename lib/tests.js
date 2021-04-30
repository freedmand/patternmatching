import { expectMatrixEq, expectEq, expectNotEq, expectFalse, expectTrue, Tester } from "./tester";
import { Type, OrType, ConstructorType, TypeSet, rootConstructors } from './types';
import { Wildcard, ConstructedPattern } from './patterns';
import { Matrix } from './matrix';
import { exhaustive, specialized, useful } from './useful';
import { matrixToHtml, tag } from "./display";

// Define types
const intType = new Type(Symbol('int'));
const mylist = new OrType(Symbol('mylist'), mylist => [
  new ConstructorType(Symbol('Nil')),
  new ConstructorType(Symbol('One'), () => [intType]),
  new ConstructorType(Symbol('Cons'), () => [intType, mylist])
]);
const nilType = mylist.terms[0];
const oneType = mylist.terms[1];
const consType = mylist.terms[2];

// Define matrices
const P = new Matrix(
  [mylist, mylist],
  [
    [new ConstructedPattern(nilType), new Wildcard()],
    [new Wildcard(), new ConstructedPattern(nilType)]
  ]
);
const Q = new Matrix(
  [mylist, mylist],
  [
    [new ConstructedPattern(nilType), new Wildcard()],
    [new Wildcard(), new ConstructedPattern(nilType)],
    [new ConstructedPattern(oneType, new Wildcard()), new Wildcard()],
    [new Wildcard(), new ConstructedPattern(oneType, new Wildcard())],
    [
      new ConstructedPattern(consType, new Wildcard(), new Wildcard()),
      new Wildcard()
    ],
    [
      new Wildcard(),
      new ConstructedPattern(consType, new Wildcard(), new Wildcard())
    ]
  ]
);

// Scratchpad
document.body.appendChild(tag('', 'Q:', 'h3'));
document.body.appendChild(matrixToHtml(Q));
document.body.appendChild(document.createElement('hr'));

export default function runTests(container) {
  const t = new Tester();

  // Type equality
  const typeEqualitySuite = t.addSuite('Type Equality');
  typeEqualitySuite.case('nil == nil', () => expectTrue(nilType.eq(nilType)));
  typeEqualitySuite.case('nil.type == nil.type', () => expectTrue(nilType.type.eq(nilType.type)));
  typeEqualitySuite.case('nil == nil.type', () => expectTrue(nilType.eq(nilType.type)));
  typeEqualitySuite.case('nil.type == nil', () => expectTrue(nilType.type.eq(nilType)));

  // Specialized
  const specializedSuite = t.addSuite('Specialized');
  specializedSuite.case('Q with Nil', () => expectMatrixEq(
    specialized(nilType, Q),
    new Matrix(
      [mylist],
      [
        [new Wildcard()],
        [new ConstructedPattern(nilType)],
        [new ConstructedPattern(oneType, new Wildcard())],
        [new ConstructedPattern(consType, new Wildcard(), new Wildcard())]
      ]
    )
  ));
  specializedSuite.case('Q with One', () => expectMatrixEq(
    specialized(oneType, Q),
    new Matrix(
      [intType, mylist],
      [
        [new Wildcard(), new ConstructedPattern(nilType)],
        [new Wildcard(), new Wildcard()],
        [new Wildcard(), new ConstructedPattern(oneType, new Wildcard())],
        [
          new Wildcard(),
          new ConstructedPattern(consType, new Wildcard(), new Wildcard())
        ]
      ]
    )
  ));
  specializedSuite.case('Q with Cons', () => expectMatrixEq(
    specialized(consType, Q),
    new Matrix(
      [intType, mylist, mylist],
      [
        [new Wildcard(), new Wildcard(), new ConstructedPattern(nilType)],
        [
          new Wildcard(),
          new Wildcard(),
          new ConstructedPattern(oneType, new Wildcard())
        ],
        [new Wildcard(), new Wildcard(), new Wildcard()],
        [
          new Wildcard(),
          new Wildcard(),
          new ConstructedPattern(consType, new Wildcard(), new Wildcard())
        ]
      ]
    )
  ));

  // Signature
  const signatureSuite = t.addSuite('Signature');
  signatureSuite.case('nil one cons', () => expectEq(mylist.signature(), new TypeSet([nilType, oneType, consType])));
  signatureSuite.case('one cons nil', () => expectEq(mylist.signature(), new TypeSet([oneType, consType, nilType])));
  signatureSuite.case('missing nil', () => expectNotEq(mylist.signature(), new TypeSet([oneType, consType])));
  signatureSuite.case('duplicate nil', () => expectEq(mylist.signature(), new TypeSet([nilType, oneType, consType, nilType])));
  signatureSuite.case('extra mylist', () => expectNotEq(
    mylist.signature(),
    new TypeSet([nilType, oneType, consType, mylist])
  ));

  // Usefulness
  const usefulSuite = t.addSuite('Useful');
  usefulSuite.case('nil wildcard not useful to P', () => expectFalse(useful(P, [new ConstructedPattern(nilType), new Wildcard()])));
  usefulSuite.case('nil nil not useful to P', () => expectFalse(
    useful(P, [new ConstructedPattern(nilType), new ConstructedPattern(nilType)])
  ));
  usefulSuite.case('wildcard useful to P', () => expectTrue(useful(P, [new Wildcard(), new Wildcard()])));
  usefulSuite.case('one wildcard useful to P', () => expectTrue(
    useful(P, [new ConstructedPattern(oneType, new Wildcard()), new Wildcard()])
  ));
  usefulSuite.case('nil wildcard not useful to Q', () => expectFalse(useful(Q, [new ConstructedPattern(nilType), new Wildcard()])));
  usefulSuite.case('nil nil not useful to Q', () => expectFalse(
    useful(Q, [new ConstructedPattern(nilType), new ConstructedPattern(nilType)])
  ));
  usefulSuite.case('wildcard not useful to Q', () => expectFalse(useful(Q, [new Wildcard(), new Wildcard()])));
  usefulSuite.case('one wildcard not useful to Q', () => expectFalse(
    useful(Q, [new ConstructedPattern(oneType, new Wildcard()), new Wildcard()])
  ));

  // Exhaustiveness
  const exhaustiveSuite = t.addSuite('Exhaustive');
  exhaustiveSuite.case('P not exhaustive', () => expectFalse(exhaustive(P)));
  exhaustiveSuite.case('Q exhaustive', () => {
    expectTrue(exhaustive(Q));
  });

  t.run();
  t.report(container);
};
