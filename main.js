import { matrixToHtml, toHtml } from './lib/display';
import { Type, OrType, ConstructorType } from './lib/types';
import { Wildcard, ConstructedPattern } from './lib/patterns';
import { Matrix } from './lib/matrix';
import runTests from './lib/tests';

const intType = new Type(Symbol('int'));
const mylist = new OrType(Symbol('mylist'), mylist => [
  new ConstructorType(Symbol('Nil')),
  new ConstructorType(Symbol('One'), () => [intType]),
  new ConstructorType(Symbol('Cons'), () => [intType, mylist])
]);
const nilType = mylist.terms[0];
const oneType = mylist.terms[1];
const consType = mylist.terms[2];
document.body.appendChild(toHtml(mylist));

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
)
document.body.appendChild(matrixToHtml(Q));

const testContainer = document.createElement('div');
document.body.appendChild(testContainer);
runTests(testContainer);
