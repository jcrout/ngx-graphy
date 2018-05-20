import { Injectable } from '@angular/core';

export type EquationFunctionDeclaration = (...args: any[]) => number;

export abstract class EquationMember {
  literal: string;

  constructor(literal: string) {
    this.literal = literal;
  }
}

export class EquationFunction extends EquationMember {
  name?: string;
  expression: EquationFunctionDeclaration;
  args: number;

  constructor(literal: string, name?: string, expression?: EquationFunctionDeclaration, args?: number) {
    super(literal);

    this.name = name;
    this.expression = expression;
    this.args = args;
  }
}
export class EquationOperator extends EquationFunction {
  index: number;
  defaultLeft: number | null;

  constructor(literal: string, expression: EquationFunctionDeclaration, index: number, args?: number, defaultLeft?: number) {
    super(literal, '', expression, args);

    this.index = index;
    this.defaultLeft = defaultLeft;
  }
}

export class EquationConstant extends EquationMember {
  expression: string;

  constructor(literal: string, expression: string) {
    super(literal);

    this.expression = expression;
  }
}

export class EquationVariable extends EquationMember {
  constructor(literal: string) {
    super(literal);;
  }
}

export class EquationNumber extends EquationMember {
  constructor(literal: string) {
    super(literal);
  }
}

export class EquationContainer extends EquationMember {
  constructor(literal: string) {
    super(literal);
  }
}

export interface EquationMemberType {
  type: string;
  color?: string;
  size?: number;
}

export interface EquationParseResults {
  equation: string;
  error?: string;
  errorIndex?: number;
  parts: ParserPart[];
  errors: ParserError[];
}

declare interface ParserPart {
  startIndex: number;
  literal: string;
  member: EquationMember;
  args?: string[];
  parts?: ParserPart[];
}

export class ParserError {
  constructor(public message: string, public startIndex: number) { }
}

declare interface IEquationMemberDictionary {
  [text: string]: EquationMember;
}

declare interface IEquationMemberListing {
  literal: string;
  member: EquationMember;
}


@Injectable()
export class EquationParserService {
  private readonly NumberRegex = /^\d*\.?\d+$/;
  private readonly ParenRegex = /^\s*\(/;

  equationTypes = ['standard', 'polar'];
  equationMemberTypes: EquationMemberType[] = [
    {
      type: 'number',
      color: 'black'
    },
    {
      type: 'constant',
      color: 'green'
    },
    {
      type: 'variable',
      color: 'red'
    },
    {
      type: 'function',
      color: 'blue'
    }
  ];
  definedConstants: EquationConstant[] = [
    new EquationConstant('e', '2.71828')
  ];
  definedFunctions: EquationFunction[] = [
    new EquationFunction('abs', 'Absolute Value', Math.abs, 1),
    new EquationFunction('cos', 'Cos', Math.cos, 1),
    new EquationFunction('sin', 'Sin', Math.sin, 1),
    new EquationFunction('sqrt', 'Square Root', Math.sqrt, 1)
  ];
  definedOperators: EquationOperator[] = [
    new EquationOperator('+', (n1, n2) => n1 + n2, 10, 2, 0),
    new EquationOperator('-', (n1, n2) => n1 - n2, 10, 2, 0),
    new EquationOperator('*', (n1, n2) => n1 * n2, 20, 2, null),
    new EquationOperator('/', (n1, n2) => n1 / n2, 20, 2, null),
    new EquationOperator('^', (n1, n2) => Math.pow(n1, n2), 30, 2, null),
    new EquationOperator('%', (n1, n2) => n1 % n2, 30, 2, null)
  ];
  functions: EquationFunction[] = []; // abs(x), if(x > 5, x + 1, x-1), sqrt(x^2 + 2)
  operators: EquationOperator[] = []; // + - * / ^
  constants: EquationConstant[] = []; // A = 5, B = x^2 + 3
  variables: EquationVariable[] = []; // x
  dictionary: IEquationMemberDictionary = {};
  allMembers: IEquationMemberListing[] = [];

  constructor() {
    this.constants = this.definedConstants.map(x => x);
    this.functions = this.definedFunctions.map(x => x);
    this.operators = this.definedOperators.map(x => x);

    // temp
    this.variables.push(new EquationVariable('x'));
    this.constants.push(new EquationConstant('a', '1'));
    this.constants.push(new EquationConstant('b', '5'));
    this.constants.push(new EquationConstant('s', '-7'));
    //this.constants.push(new EquationConstant('ab', '1.05'));

    this.functions.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1);
    this.constants.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1);

    // check for any duplicates
    this.operators.forEach(f => {
      this.dictionary[f.literal.toLowerCase()] = f;
      this.allMembers.push({ literal: f.literal, member: f });
    });
    this.functions.forEach(f => {
      this.dictionary[f.literal.toLowerCase()] = f;
      this.allMembers.push({ literal: f.literal, member: f });
    });
    this.constants.forEach(f => {
      this.dictionary[f.literal.toLowerCase()] = f;
      this.allMembers.push({ literal: f.literal, member: f });
    });
    this.variables.forEach(f => {
      this.dictionary[f.literal.toLowerCase()] = f;
      this.allMembers.push({ literal: f.literal, member: f });
    });

    this.allMembers.sort((f1, f2) => f1.literal.length > f2.literal.length ? 1 : f1.literal.length < f2.literal.length ? -1 : 1);
  }

  parse(equationText: string): EquationParseResults {
    const results = <EquationParseResults>{};
    results.parts = [];
    results.errors = [];
    results.equation = equationText;

    const lowerEquationText = equationText.toLowerCase();
    const equationPart = <ParserPart>{
      startIndex: 0,
      literal: equationText,
      parts: []
    };
    results.parts.push(equationPart);

    const timestamp = Date.now();

    this._parse(results, lowerEquationText, equationPart, 0);

    const timestamp2 = Date.now();
    const difference = timestamp2 - timestamp;
    console.log(difference + 'ms');
    console.log(results);

    return results;
  }

  _parse(results: EquationParseResults, equationText: string, part: ParserPart, startIndex: number): number { // x^2 + A -2(absabs(x) + 1)^1.1
    function getWord(si: number, length: number) {
      return results.equation.substr(si, length);
    }
    function clearWord() {
      isInNumber = false;
      periodUsed = false;
      currentWord = '';
    }
    function addParserError(message: string, index: number) {
      results.errors.push(new ParserError(message, index));
      clearWord();
    }
    function checkSubparts(word: string, i: number) {
      let maxFirstLength = word.length - 1;
      for (let j = 0; j < word.length; j++) {

        let potentialStarters = that.allMembers.filter(a => a.literal.length <= maxFirstLength && a.literal.startsWith(word[j]));
        if (potentialStarters.length == 0) {
          addParserError('', 0);
          return;
        }

        potentialStarters.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1)
        let startingMember = potentialStarters[0];
        part.parts.push(<ParserPart>{
          startIndex: startIndex + i - word.length + 1 + j,
          literal: startingMember.literal,
          parts: [],
          member: startingMember.member
        });

        j += startingMember.literal.length - 1;
        maxFirstLength = word.length - 1 - j;
      }
    }

    const that = this;
    let currentWord = '';
    let lastPart: ParserPart = null;
    let isInNumber = false;
    let periodUsed = false;
    let endPhraseIndex = equationText.length - 1;
    for (let i = 0; i < equationText.length; i++) {
      let c = equationText[i];
      if (c === ')') {
        // process currentWord as-is
        if (currentWord != '') {
          if (this.NumberRegex.test(currentWord)) {
            part.parts.push(<ParserPart>{
              startIndex: startIndex + i - currentWord.length,
              literal: currentWord,
              parts: [],
              member: new EquationNumber(currentWord)
            });
            isInNumber = false;
            periodUsed = false;
            currentWord = '';
          } else {
            let exactMatch = this.allMembers.find(m => m.literal === currentWord);
            if (exactMatch) {
              part.parts.push(<ParserPart>{
                startIndex: startIndex + i - currentWord.length,
                literal: currentWord,
                parts: [],
                member: exactMatch.member
              });
              isInNumber = false;
              periodUsed = false;
              currentWord = '';
            } else {
              // error - nothing was ever matched.
              addParserError('', 0);
            }
          }
        }

        // validate in paren?
        return i + 1;
      } else if (c === ' ') { // or any whitespace
        // process currentWord as-is
        if (currentWord != '') {
          if (this.NumberRegex.test(currentWord)) {
            part.parts.push(<ParserPart>{
              startIndex: startIndex + i - currentWord.length,
              literal: currentWord,
              parts: [],
              member: new EquationNumber(currentWord)
            });
            isInNumber = false;
            periodUsed = false;
            currentWord = '';
          } else {
            let exactMatch = this.allMembers.find(m => m.literal === currentWord);
            if (exactMatch) {
              part.parts.push(<ParserPart>{
                startIndex: startIndex + i - currentWord.length,
                literal: currentWord,
                parts: [],
                member: exactMatch.member
              });
              isInNumber = false;
              periodUsed = false;
              currentWord = '';
            } else {
              addParserError('', 0);
              // error - nothing was ever matched.
            }
          }
        }
      } else if (c === '(') {
        // process currentWord as-is


        if (currentWord != '') {
          if (this.NumberRegex.test(currentWord)) {
            part.parts.push(<ParserPart>{
              startIndex: startIndex + i - currentWord.length,
              literal: currentWord,
              parts: [],
              member: new EquationNumber(currentWord)
            });
            isInNumber = false;
            periodUsed = false;
            currentWord = '';
          } else {
            let exactMatch = this.allMembers.find(m => m.literal === currentWord);
            if (exactMatch) {
              part.parts.push(<ParserPart>{
                startIndex: startIndex + i - currentWord.length,
                literal: currentWord,
                parts: [],
                member: exactMatch.member
              });
              isInNumber = false;
              periodUsed = false;
              currentWord = '';
            } else {
              // error - nothing was ever matched.
              addParserError('', 0);
            }
          }
        }

        let containerPart = <ParserPart>{
          startIndex: startIndex + i,
          literal: '',
          parts: [],
          member: new EquationContainer('(')
        };
        part.parts.push(containerPart);
        let endIndex = this._parse(results, equationText.substr(i + 1), containerPart, startIndex + i + 1);
        let newIndex = i + endIndex;
        containerPart.literal = equationText.substr(i + 1, endIndex - 1);
        i = newIndex;
        isInNumber = false;
        periodUsed = false;
        currentWord = '';
        // add to the stack

      } else if (isInNumber) {
        if (c === '.') {
          currentWord += c;
          if (periodUsed) {
            // error
            addParserError('', 0);
          } else {
            periodUsed = true;
          }
        } else if (!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(c)) {
          part.parts.push(<ParserPart>{
            startIndex: startIndex + i - currentWord.length + 1,
            literal: currentWord,
            parts: [],
            member: new EquationNumber(currentWord)
          });
          i--;
          clearWord();
        } else {
          currentWord += c;
        }
      } else {
        currentWord += c;
        let matches = this.allMembers.filter(m => m.literal.startsWith(currentWord));

        // member found
        if (matches.length === 1 && matches[0].member.literal === currentWord) {
          let exactMatch = matches.find(m => m.literal === currentWord);
          if (exactMatch) {
            if (!(exactMatch.member instanceof EquationOperator) && exactMatch.member instanceof EquationFunction) {
              // check for left paren
              if (!this.ParenRegex.test(equationText.substr(i + 1))) {
                checkSubparts(currentWord, i);
              } else {
                part.parts.push(<ParserPart>{
                  startIndex: startIndex + i - currentWord.length + 1,
                  literal: currentWord,
                  parts: [],
                  member: exactMatch.member
                });
              }
            } else {
              part.parts.push(<ParserPart>{
                startIndex: startIndex + i - currentWord.length + 1,
                literal: currentWord,
                parts: [],
                member: exactMatch.member
              });
            }

            isInNumber = false;
            periodUsed = false;
            currentWord = '';
          } else {
            // keep going
          }
        } else if (matches.length >= 1) {
          // keep going
        } else if (isInNumber || this.NumberRegex.test(currentWord)) {
          // keep building number
          isInNumber = true;
          if (c === '.') {
            if (periodUsed) {
              // error
              addParserError('', 0);
            } else {
              periodUsed = true;
            }
          }
        } else {
          // nothing matches, need to check the subparts or see if at a boundary
          let subword = currentWord.substr(0, currentWord.length - 1);
          let exactMatch = this.allMembers.find(m => m.literal === subword);

          // word exactly equals one thing
          if (exactMatch) {
            if (!(exactMatch.member instanceof EquationOperator) && exactMatch.member instanceof EquationFunction) {
              // check for left paren
              if (!this.ParenRegex.test(equationText.substr(i + 1))) {
                checkSubparts(subword, i);
              } else {
                part.parts.push(<ParserPart>{
                  startIndex: startIndex + i - subword.length + 1,
                  literal: subword,
                  parts: [],
                  member: exactMatch.member
                });
              }
            } else {
              part.parts.push(<ParserPart>{
                startIndex: startIndex + i - subword.length + 1,
                literal: subword,
                parts: [],
                member: exactMatch.member
              });
            }

            isInNumber = false;
            periodUsed = false;
            currentWord = '';
            i--;
          } else if (this.NumberRegex.test(subword)) {
            part.parts.push(<ParserPart>{
              startIndex: startIndex + i - subword.length + 1,
              literal: subword,
              parts: [],
              member: new EquationNumber(subword)
            });
            isInNumber = false;
            periodUsed = false;
            currentWord = '';
            i--;
          } else {
            // error
            if (!subword) {
              addParserError(`Identifier '${getWord(startIndex + i, currentWord.length)}' not found`, startIndex + i);
            } else {
              checkSubparts(subword, i - 1);
              isInNumber = false;
              periodUsed = false;
              currentWord = '';
              i--;
            }
          }
        }
      }
    }

    if (currentWord != '') {
      if (this.NumberRegex.test(currentWord)) {
        part.parts.push(<ParserPart>{
          startIndex: startIndex + equationText.length - currentWord.length,
          literal: currentWord,
          parts: [],
          member: new EquationNumber(currentWord)
        });
      } else {
        let exactMatch = this.allMembers.find(m => m.literal === currentWord);
        if (exactMatch) {
          if (!(exactMatch.member instanceof EquationOperator) && exactMatch.member instanceof EquationFunction) {
            // check for left paren
            if (!this.ParenRegex.test(equationText.substr(equationText.length + 1))) {
              checkSubparts(currentWord, equationText.length);
            } else {
              part.parts.push(<ParserPart>{
                startIndex: startIndex + equationText.length - currentWord.length,
                literal: currentWord,
                parts: [],
                member: exactMatch.member
              });
            }
          } else {
            part.parts.push(<ParserPart>{
              startIndex: startIndex + equationText.length - currentWord.length,
              literal: currentWord,
              parts: [],
              member: exactMatch.member
            });
          }
        } else {
          checkSubparts(currentWord, equationText.length);
        }
      }
    }

    return equationText.length;
  }

}
