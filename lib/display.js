import './display.css';

import { Type, ConstructorType, OrType } from './types';

export function tag(className, children, tagName = 'span') {
  const container = document.createElement(tagName);
  container.className = `tag${className != null ? ` ${className}` : ''}`;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child == null) continue;
    if (child instanceof HTMLElement) {
      container.appendChild(child);
    } else {
      const textNode = document.createTextNode(child);
      container.appendChild(textNode);
    }
  }
  return container;
}

export function oldConstructorHtml(type, subvalues) {
  return tag(null, [
    tag('type', type),
    ...(subvalues.length > 0
      ? ['(', joinHtml(subvalues.map(v => v.toHtml()), ', '), ')']
      : [])
  ]);
}

export function elementize(elemOrString) {
  if (typeof elemOrString == 'function') {
    return elementize(elemOrString());
  }
  if (elemOrString instanceof HTMLElement) {
    return elemOrString;
  }
  return document.createTextNode(`${elemOrString}`);
}

export function joinHtml(elements, join) {
  const joinElem = () => elementize(join);
  const span = document.createElement('span');
  for (let i = 0; i < elements.length; i++) {
    span.appendChild(elements[i]);
    if (i != elements.length - 1) {
      span.appendChild(joinElem());
    }
  }
  return span;
}

export function textTag(className, text) {
  return tag(className, [`${text}`]);
}

export const pipe = () => textTag('pipe', '|');

export function vectorToHtml(l) {
  const tr = document.createElement('tr');
  l.forEach(x => {
    const td = document.createElement('td');
    td.appendChild(x.toHtml());
    tr.appendChild(td);
  });
  return tr;
}

export function matrixToHtml(m) {
  const table = document.createElement('table');
  table.className = 'matrix';
  m.rows.forEach(row => table.appendChild(vectorToHtml(row)));
  return table;
}

export function toHtml(type, seenTypes = []) {
  const constructorHtml = (type, subvalues, seenTypes = []) => {
    return tag(null, [
      tag('type', type),
      ...(subvalues.length > 0
        ? ['(', joinHtml(subvalues.map(v => toHtml(v, seenTypes)), ', '), ')']
        : [])
    ]);
  };

  if (type instanceof Type || seenTypes.includes(type)) {
    return textTag('value', type.toString());
  }
  if (type instanceof ConstructorType) {
    return constructorHtml(
      type.type.toString(),
      type.terms,
      seenTypes.concat([type])
    );
  }
  if (type instanceof OrType) {
    return joinHtml(
      type.terms.map(t => toHtml(t, seenTypes.concat([type]))),
      pipe
    );
  }
}

export function clear(elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}
