import { Injectable } from '@angular/core';
import { EqMemberType, EqFunction, EqConstant, EqVariable, EqOperator, EqMember, EqParseResults, ParserPart, ParserError, EqNumber, EqContainer, EqFunctionArgument, ParserIdentifierError, ParserPotentialFunctionWarning, ParserFunctionArgumentError, EqArgSeparator, FunctionGenerationResults, ParserOperatorArgumentError, EqArg } from './equastion-parser-models';
import { Parser } from '@angular/compiler';

declare interface IEqMemberDictionary {
  [text: string]: EqMember;
}

declare interface IEqMemberListing {
  literal: string;
  member: EqMember;
}

declare interface IUsedMember {
  lookup: string;
  literal: string;
  member: EqMember;
}

declare interface IFunctionPiece {
  text: string;
  member: EqMember;
  parts: IFunctionPiece[];
}

@Injectable()
export class EquationParserService {
  public static SubtractionOperator = new EqOperator('-', (n1, n2) => n1 - n2, 10, EqFunctionArgument.defaultRightOperator());
  public static MultiplicationOperator = new EqOperator('*', (n1, n2) => n1 * n2, 20, EqFunctionArgument.defaultOperator());
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
    EquationParserService.SubtractionOperator,
    EquationParserService.MultiplicationOperator,
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
    this.functions.push(new EqFunction('asbo', 'ASBO', x => x, [EqFunctionArgument.default(), EqFunctionArgument.default(), EqFunctionArgument.default()]));
    this.functions.push(new EqFunction('asboo', 'ASBOO', (x: number, y: number) => x + y - 1, [EqFunctionArgument.default(), EqFunctionArgument.default()]));
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

    this._parse(results, lowerequationText, results.equationPart, false, 0, 0);
    this.validateOperatorArguments(results, results.equationPart, null, 0);
    results.errors = this.collapseIdentifierErrors(results.errors);

    const timestamp2 = Date.now();
    results.elapsedTime = timestamp2 - timestamp;

    //console.log(results.elapsedTime + 'ms');

    return results;
  }

  private collapseIdentifierErrors(errors: ParserError[]): ParserError[] {
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

  private validateOperatorArguments(results: EqParseResults, part: ParserPart, parent: ParserPart, index: number) {
    part.parts.forEach((p, i) => {
      this.validateOperatorArguments(results, p, part, i);
    });

    if (!(part.member instanceof EqOperator)) {
      return;
    }

    const leftPart = index > 0 ? parent.parts[index - 1] : null;
    const rightPart = index < parent.parts.length - 1 ? parent.parts[index + 1] : null;
    const args = part.member.args;
    part.argCount = (leftPart ? 1 : 0) + (rightPart ? 1 : 0);

    const OperatorArgumentErrorMessage = args[0].defaultValue ? 'Operator \'{0}\' requires a value to the right' : 'Operator \'{0}\' requires a value to the left and right';
    const msg = OperatorArgumentErrorMessage.replace("{0}", part.member.literal);

    if ((!args[1].defaultValue && !rightPart) || (!args[0].defaultValue && !leftPart)) {
      results.errors.push(new ParserOperatorArgumentError(msg, part.startIndex, part.member));
    }
  }

  private _parse(results: EqParseResults, equationText: string, part: ParserPart, insideFunction: boolean, startIndex: number, depth: number): number { // x^2 + A -2(absabs(x) + 1)^1.1
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
          addParserIdentifierError(getWord(startIndex + i + j - word.length + 1, 1), startIndex + i + j);
          maxFirstLength -= 1;
        } else {
          potentialStarters.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1)
          let startingMember = potentialStarters[0];
          addPart(i - word.length + 1 + j, startingMember.literal, startingMember.member);

          j += startingMember.literal.length - 1;
          maxFirstLength = word.length - 1 - j;
        }
      }

      clearWord();
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
        results.warnings.push(new ParserPotentialFunctionWarning('Did you mean to call function \'' + exactMatch.literal + '\'?', startIndex + i - exactMatch.literal.length + 1, exactMatch.literal));
        checkSubparts(exactMatch.literal, i);
      } else {
        addPart(i - exactMatch.literal.length + 1, exactMatch.literal, exactMatch.member);
      }

      clearWord();
    }
    function validateFnArgs(fnPart: ParserPart, idx: number) {
      let fnMember = fnPart.member as EqFunction;
      let reqCount = fnMember.args.filter(a => !a.defaultValue && !a.infiniteArgs).length;
      let maxCount = fnMember.args.filter(a => a.infiniteArgs).length > 0 ? 100000 : fnMember.args.length;
      let suppliedArgs = fnPart.parts.filter(p => !(p.member instanceof EqArgSeparator));
      let suppliedArgCount = suppliedArgs.length;
      if (suppliedArgCount < reqCount) {
        let msg = 'Function \'{0}\' requires {1} argument(s)';
        let msg2 = 'Function \'{0}\' requires at least {1} argument(s)';
        let output = (maxCount > reqCount ? msg2 : msg).replace("{0}", fnMember.name).replace("{1}", reqCount.toString());
        results.errors.push(new ParserFunctionArgumentError(output, startIndex + idx + 1, fnMember, null));
      } else if (suppliedArgCount > maxCount) {
        let msg = 'Function \'{0}\' only takes {1} argument(s)';
        let output = msg.replace("{0}", fnMember.name).replace("{1}", maxCount.toString());
        results.errors.push(new ParserFunctionArgumentError(output, startIndex + idx + 1, fnMember, null));
      }
    }
    function validateOperators() {

    }
    function addPart(index: number, literal: string, member: EqMember) {
      let newPart = <ParserPart>{
        startIndex: startIndex + index,
        literal: literal,
        type: Object.getPrototypeOf(member).constructor.name,
        member: member,
        parts: [],
      };
      let parentPart = part;
      if (insideFunction && !(member instanceof EqArgSeparator)) {
        if (!currentFnArg) {
          currentFnArg = <ParserPart>{
            startIndex: startIndex + index,
            literal: '',
            type: 'EqArg',
            member: new EqArg(''),
            parts: []
          };
          part.parts.push(currentFnArg);
        }
        parentPart = currentFnArg;
      }

      parentPart.parts.push(newPart);
      if (lastPart) {
        // check if a subtraction sign and a number should be combined into one part
        if (lastPart.member === EquationParserService.SubtractionOperator && newPart.member instanceof EqNumber) {
          // check to see if the minus symbol is right next to the new part
          let subtractionEndIndex = lastPart.startIndex + lastPart.literal.length;
          if (subtractionEndIndex === newPart.startIndex) {
            let idx = parentPart.parts.indexOf(lastPart);
            let leftPart = idx > 0 ? parentPart.parts[idx - 1] : null;
            // if there is nothing to the left, then this is surely a negative number
            if (idx === 0 || (leftPart && leftPart.member instanceof EqArgSeparator)) {
              parentPart.parts.splice(idx, 1);
              newPart.literal = lastPart.literal + newPart.literal;
              newPart.startIndex = lastPart.startIndex;
              lastPart = leftPart;
            }
          }
        }
      }

      lastPart = newPart;
      return newPart;
    }

    const that = this;
    let currentWord = '';
    let currentFnArg: ParserPart = null;
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
      } else if (c === ',') { // argument separator
        // process currentWord as-is
        if (!insideFunction) {
          addParserError('\',\' is only allowed in function calls', i)
        }
        processWordAsIs(currentWord, i);
        addPart(i, ',', new EqArgSeparator(','));
        const endIndex = this._parse(results, equationText.substr(i + 1), part, true, startIndex + i + 1, depth);
        i += endIndex;
        clearWord();
      } else if (c === '(') {
        processWordAsIs(currentWord, i - 1);

        const lastPartIsFunction = lastPart && !(lastPart.member instanceof EqOperator) && lastPart.member instanceof EqFunction
        const endIndex = this._parse(results, equationText.substr(i + 1), lastPartIsFunction ? lastPart : part, lastPartIsFunction, startIndex + i + 1, depth + 1);
        if (lastPartIsFunction) {
          validateFnArgs(lastPart, i);
        }

        const newIndex = i + endIndex;
        i = newIndex;
        clearWord();
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
        } else if (isInNumber || currentWord === '.' || this.NumberRegex.test(currentWord)) {
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

    validateOperators();
    return equationText.length;
  }

  generateFunction(results: EqParseResults): FunctionGenerationResults {
    const functionResults = <FunctionGenerationResults>{};
    const allParts = this.getAllIdentifiers(results.equationPart);
    const usedVariables = <EqVariable[]>[];
    const usedFunctions = <IUsedMember[]>[];
    const tempFnBase = 'tempx';
    let tempFnNumber = 0;

    const textParts = <string[]>[]; // main function body

    var functionsObject = {};

    allParts.forEach(p => {
      if (p.member instanceof EqVariable) {
        if (!usedVariables.some(uv => uv.literal === p.literal)) {
          usedVariables.push(p.member);
        }
      } else if (p.member instanceof EqFunction) {
        if (!usedFunctions.some(uv => uv.literal === p.literal)) {
          const lookup = tempFnNumber;
          const functionBody = p.member.expression.toString();
          const maxArgCount = allParts.filter(ap => ap.member === p.member).map(ap => ap.argCount).reduce((n1, n2) => Math.max(n1, n2));
          const isNative = functionBody.includes('[native code]');
          functionsObject[lookup] = p.member.expression;

          usedFunctions.push({ lookup: tempFnBase + '[' + lookup + ']', literal: p.literal, member: p.member });
          tempFnNumber++;
        }
      }
    });
    if (!usedFunctions.some(uv => uv.literal === EquationParserService.MultiplicationOperator.literal)) {
      usedFunctions.push({
        lookup: tempFnBase + '[' + tempFnNumber + ']',
        literal: EquationParserService.MultiplicationOperator.literal,
        member: EquationParserService.MultiplicationOperator
      });

      functionsObject[tempFnNumber] = EquationParserService.MultiplicationOperator.expression;
      tempFnNumber++;
    }

    textParts.push('var tempx = arguments[0];\n'); //console.log(arguments)\n');
    usedVariables.forEach((uv, i) => {
      textParts.push(`var x = arguments[1][${i.toString()}];\n`);
    });

    const pieces = this.convertPartToFunctionPiece(results.equationPart);
    const finalPiece = this._generateFunction(pieces, usedFunctions);

    textParts.push('return ');
    textParts.push(finalPiece.text);
    textParts.push(';');
    const finalFunctionText = textParts.join('');


    try {
      functionResults.output = this._getFn(functionsObject, finalFunctionText);
      functionResults.error = null;
    } catch (ex) {
      functionResults.error = ex;
    }

    return functionResults;
  }

  private convertPartToFunctionPiece(part: ParserPart): IFunctionPiece {
    var parts = part.parts.map(p => this.convertPartToFunctionPiece(p));
    // add the implicit multiplication parts
    for (let i = 1; i < parts.length; i++) {
      let leftPart = parts[i - 1].member;
      let rightPart = parts[i].member;
      if (!(leftPart instanceof EqOperator && !(leftPart instanceof EqArgSeparator) && !(leftPart instanceof EqArg)) &&
        (!(rightPart instanceof EqOperator) && !(rightPart instanceof EqArgSeparator) && !(rightPart instanceof EqArg))) {
        parts.splice(i, 0, <IFunctionPiece>{
          text: EquationParserService.MultiplicationOperator.literal,
          member: EquationParserService.MultiplicationOperator,
          parts: []
        });
        i++;
      }
    }
    return <IFunctionPiece>{
      text: part.literal,
      member: part.member,
      parts: parts
    };
  }

  private _getFn(functionsObject: any, functionBody: string) {
    var fn = Function(functionBody) as Function;
    return function () {
      return fn(functionsObject, arguments);
    };
  }

  private _generateFunction(piece: IFunctionPiece, usedFunctions: IUsedMember[]): IFunctionPiece {
    const that = this;
    if (piece.member instanceof EqFunction) {
      let subPieces = [];
      for (let i = 0; i < piece.parts.length; i += 2) {
        let argPiece = piece.parts[i];
        let updatedArgPiece = that._generateFunction(argPiece, usedFunctions);
        subPieces.push(updatedArgPiece.text);
      }
      var fn = usedFunctions.find(uf => uf.literal === piece.member.literal);
      var newPiece = <IFunctionPiece>{
        text: fn.lookup + '(' + subPieces.join(',') + ')',
        member: null,
        parts: []
      };
      return newPiece;
    } else if (piece.parts.length === 1) { 
      return that._generateFunction(piece.parts[0], usedFunctions);
    } else if (piece.parts.length === 0) { 
      if (piece.member instanceof EqConstant) { 
        piece.text = piece.member.expression;
      }

      return piece;
    } else {
      const operators = piece.parts.filter(p => p.member instanceof EqOperator);      
      operators.sort((o1, o2) => (<EqOperator>o1.member).index > (<EqOperator>o2.member).index ? -1 : (<EqOperator>o1.member).index < (<EqOperator>o2.member).index ? 1 : 0);
      operators.forEach(o => {
        var idx = piece.parts.indexOf(o);
        var leftPiece = piece.parts[idx - 1];
        var rightPiece = piece.parts[idx + 1];
        if (leftPiece.member instanceof EqConstant) { 
          leftPiece.text = leftPiece.member.expression;
        } else if (leftPiece.parts.length > 0) {
          leftPiece = that._generateFunction(leftPiece, usedFunctions)
        }
        if (rightPiece.member instanceof EqConstant) { 
          rightPiece.text = rightPiece.member.expression;
        } else if (rightPiece.parts.length > 0) {
          rightPiece = that._generateFunction(rightPiece, usedFunctions)
        }
        var fn = usedFunctions.find(uf => uf.literal === o.text);
        var str = fn.lookup + '(' + leftPiece.text + ',' + rightPiece.text + ')';
        var newPiece = <IFunctionPiece>{
          text: str,
          member: o.member,
          parts: []
        };
        piece.parts.splice(idx - 1, 1);
        piece.parts.splice(idx - 1, 1);
        piece.parts.splice(idx - 1, 1, newPiece);
      });

      return piece.parts[0];
    }
  }

  private getAllIdentifiers(part: ParserPart): ParserPart[] {
    function flatten(part: ParserPart) {
      parts.push(part);
      part.parts.forEach(p => flatten(p));
    }

    const parts = <ParserPart[]>[];
    flatten(part);


    return parts;
  }
}
