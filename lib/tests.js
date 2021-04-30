import { expectMatrixEq, expectEq, expectNotEq, expectFalse, expectTrue, Tester } from "./tester";
import { Type, OrType, ConstructorType, TypeSet } from './types';
import { Wildcard, ConstructedPattern } from './patterns';
import { Matrix } from './matrix';
import { specialized, useful } from './useful';

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

export default function runTests(container) {
  const t = new Tester();

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
  usefulSuite.case('', () => expectFalse(useful(P, [new ConstructedPattern(nilType), new Wildcard()])));
  usefulSuite.case('', () => expectFalse(
    useful(P, [new ConstructedPattern(nilType), new ConstructedPattern(nilType)])
  ));
  usefulSuite.case('', () => expectTrue(useful(P, [new Wildcard(), new Wildcard()])));
  usefulSuite.case('', () => expectTrue(
    useful(P, [new ConstructedPattern(oneType, new Wildcard()), new Wildcard()])
  ));

  t.run();
  t.report(container);
};
