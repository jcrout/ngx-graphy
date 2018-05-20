import { Injectable } from '@angular/core';
import { EqMemberType, EqFunction, EqConstant, EqVariable, EqOperator, EqMember, EqParseResults, ParserPart, ParserError, EqNumber, EqContainer, EqFunctionArgument, ParserIdentifierError, ParserPotentialFunctionWarning } from './equastion-parser-models';

declare interface IEqMemberDictionary {
  [text: string]: EqMember;
}

declare interface IEqMemberListing {
  literal: string;
  member: EqMember;
}

@Injectable()
export class EquationParserService {
  private readonly IdentifierMessage = 'Identifier \'{0}\' not found';
  private readonly DigitRegex = /^\d$/;
  private readonly NumberRegex = /^\d*\.?\d+$/;
  private readonly ParenRegex = /^\s*\(/;

  EqTypes = ['standard', 'polar'];
  EqMemberTypes: EqMemberType[] = [
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
  definedConstants: EqConstant[] = [
    new EqConstant('e', '2.71828')
  ];
  definedFunctions: EqFunction[] = [
    new EqFunction('abs', 'Absolute Value', Math.abs, EqFunctionArgument.defaultSingle()),
    new EqFunction('cos', 'Cos', Math.cos, EqFunctionArgument.defaultSingle()),
    new EqFunction('min', 'Min', Math.min, EqFunctionArgument.defaultSingleInfinite()),
    new EqFunction('max', 'Max', Math.max, EqFunctionArgument.defaultSingleInfinite()),
    new EqFunction('sin', 'Sin', Math.sin, EqFunctionArgument.defaultSingle()),
    new EqFunction('sqrt', 'Square Root', Math.sqrt, EqFunctionArgument.defaultSingle())
  ];
  definedOperators: EqOperator[] = [
    new EqOperator('+', (n1, n2) => n1 + n2, 10, EqFunctionArgument.defaultRightOperator()),
    new EqOperator('-', (n1, n2) => n1 - n2, 10, EqFunctionArgument.defaultRightOperator()),
    new EqOperator('*', (n1, n2) => n1 * n2, 20, EqFunctionArgument.defaultOperator()),
    new EqOperator('/', (n1, n2) => n1 / n2, 20, EqFunctionArgument.defaultOperator()),
    new EqOperator('^', (n1, n2) => Math.pow(n1, n2), 30, EqFunctionArgument.defaultOperator()),
    new EqOperator('%', (n1, n2) => n1 % n2, 20, EqFunctionArgument.defaultOperator())
  ];
  functions: EqFunction[] = []; // abs(x), if(x > 5, x + 1, x-1), sqrt(x^2 + 2)
  operators: EqOperator[] = []; // + - * / ^
  constants: EqConstant[] = []; // A = 5, B = x^2 + 3
  variables: EqVariable[] = []; // x
  dictionary: IEqMemberDictionary = {};
  allMembers: IEqMemberListing[] = [];

  constructor() {
    this.constants = this.definedConstants.map(x => x);
    this.functions = this.definedFunctions.map(x => x);
    this.operators = this.definedOperators.map(x => x);

    // temp
    this.functions.push(new EqFunction('asbo', 'aaaa', x => x, EqFunctionArgument.defaultSingle()));
    this.functions.push(new EqFunction('absoo', 'aaaa', x => x, EqFunctionArgument.defaultSingle()));
    this.variables.push(new EqVariable('x'));
    this.constants.push(new EqConstant('a', '1'));
    this.constants.push(new EqConstant('b', '5'));
    this.constants.push(new EqConstant('s', '-7'));
    //this.constants.push(new EqConstant('ab', '1.05'));

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

  parse(equationText: string): EqParseResults {
    const results = <EqParseResults>{};
    const lowerequationText = equationText.toLowerCase();

    results.equation = equationText;
    results.equationPart = <ParserPart>{
      startIndex: 0,
      literal: equationText,
      parts: []
    };
    results.errors = [];
    results.warnings = [];
    
    const timestamp = Date.now();

    this._parse(results, lowerequationText, results.equationPart, 0, 0);
    results.errors = this.collapseIdentifierErrors(results.errors);

    const timestamp2 = Date.now();
    results.elapsedTime = timestamp2 - timestamp;

    console.log(results.elapsedTime + 'ms');
    console.log(results);

    return results;
  }

  collapseIdentifierErrors(errors: ParserError[]): ParserError[] {
    if (errors.length === 0) {
      return errors;
    }
    
    let collapsedErrors: ParserError[] = []; // x + ab)c
    let originalWord = '';
    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];
      collapsedErrors.push(error);
      if (error instanceof ParserIdentifierError) { 
        originalWord = error.identifier;
        let counter = 0;
        for (let j = i + 1; j < errors.length; j++) { 
          const nextError = errors[j];
          counter++;
          if (nextError.startIndex === error.startIndex + counter && nextError instanceof ParserIdentifierError) {
            i += 1;
            error.identifier += nextError.identifier;
          } else { 
            break;
          }
        }
        if (error.identifier !== originalWord) { 
          error.message = this.IdentifierMessage.replace('{0}', error.identifier);
        }
      }
    }

    return collapsedErrors;
  }

  _parse(results: EqParseResults, equationText: string, part: ParserPart, startIndex: number, depth: number): number { // x^2 + A -2(absabs(x) + 1)^1.1
    function getWord(si: number, length: number) {
      return results.equation.substr(si, length);
    }
    function clearWord() {
      isInNumber = false;
      periodUsed = false;
      currentWord = '';
    }
    function addParserError(message: string, index: number, skipClear: boolean = false) {
      results.errors.push(new ParserError(message, index));
      if (!skipClear) {
        clearWord();
      }
    }
    function addParserIdentifierError(word: string, index: number, skipClear: boolean = false) { 
      results.errors.push(new ParserIdentifierError(that.IdentifierMessage.replace('{0}', word), index, word));
      if (!skipClear) {
        clearWord();
      }
    }
    function checkSubparts(word: string, i: number) {
      let maxFirstLength = word.length - 1;
      for (let j = 0; j < word.length; j++) {

        let potentialStarters = that.allMembers.filter(a => a.literal.length <= maxFirstLength && a.literal.startsWith(word[j]));
        potentialStarters = potentialStarters.filter(a => !(a.member instanceof EqFunction) || that.ParenRegex.test(equationText.substr(i + 1 + a.literal.length)));
        if (potentialStarters.length == 0) {
          addParserIdentifierError(getWord(startIndex + i + j - word.length + 1, 1), startIndex + i);
          maxFirstLength -= 1;
        } else {
          potentialStarters.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1)
          let startingMember = potentialStarters[0];
          addPart(i - word.length + 1 + j, startingMember.literal, startingMember.member);

          j += startingMember.literal.length - 1;
          maxFirstLength = word.length - 1 - j;
        }
      }
    }
    function processWordAsIs(word: string, i: number) {
      if (word != '') {
        if (that.NumberRegex.test(word)) {
          addPart(i - word.length, word, new EqNumber(word));
          clearWord();
        } else {
          let exactMatch = that.allMembers.find(m => m.literal === word);
          if (exactMatch) {
            validateParen(exactMatch, i);
          } else {
            checkSubparts(word, i - 1);
          }
        }
      }
    }
    function validateParen(exactMatch: IEqMemberListing, i: number) {
      if (!(exactMatch.member instanceof EqOperator) && exactMatch.member instanceof EqFunction && !that.ParenRegex.test(equationText.substr(i + 1))) {
        results.warnings.push(new ParserPotentialFunctionWarning('Did you mean to call function \'' + exactMatch.literal + '\'?', startIndex + i - exactMatch.literal.length, exactMatch.literal));
        checkSubparts(exactMatch.literal, i - 1);
      } else {
        addPart(i - exactMatch.literal.length + 1, exactMatch.literal, exactMatch.member);
      }

      clearWord();
    }
    function addPart(index: number, literal: string, member: EqMember) {
      let newPart = <ParserPart>{
        startIndex: startIndex + index,
        literal: literal,
        type: Object.getPrototypeOf(member).constructor.name,
        member: member,
        parts: [],        
      };
      part.parts.push(newPart);
      return newPart;
    }

    const that = this;
    let currentWord = '';
    let lastPart: ParserPart = null;
    let isInNumber = false;
    let periodUsed = false;

    for (let i = 0; i < equationText.length; i++) {
      let c = equationText[i];
      if (c === ')') {
        let skipReturn = depth === 0;
        if (skipReturn) {
          // no matching left-paren
          addParserError('No matching left-parentheses', startIndex + i, true);
        }

        processWordAsIs(currentWord, i);

        if (!skipReturn) {
          return i + 1;
        }
      } else if (c === ' ') { // or any whitespace
        // process currentWord as-is
        processWordAsIs(currentWord, i);
      } else if (c === '(') {
        processWordAsIs(currentWord, i);

        let containerPart = addPart(i, '()', new EqContainer('()'));
        let endIndex = this._parse(results, equationText.substr(i + 1), containerPart, startIndex + i + 1, depth + 1);
        let newIndex = i + endIndex;
        i = newIndex;
        clearWord()
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
        } else if (!this.DigitRegex.test(c)) {
          addPart(i - currentWord.length, currentWord, new EqNumber(currentWord));
          clearWord();
          i--;
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
            validateParen(exactMatch, i);
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
            validateParen(exactMatch, i - 1);
            i--;
          } else if (this.NumberRegex.test(subword)) {
            addPart(i - subword.length + 1, subword, new EqNumber(subword));
            clearWord();
            i--;
          } else {
            // error
            if (!subword) {
              addParserIdentifierError(getWord(startIndex + i, currentWord.length), startIndex + i);
            } else {
              checkSubparts(subword, i - 1);
              clearWord();
              i--;
            }
          }
        }
      }
    }

    if (currentWord != '') {
      processWordAsIs(currentWord, equationText.length);
    }

    return equationText.length;
  }
}
