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

  constructor(literal: string, name?: string, expression?: EquationFunctionDeclaration) {
    super(literal);

    this.name = name;
    this.expression = expression;
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

export interface EquationMemberType {
  type: string;
  color?: string;
  size?: number;
}

export interface EquationParseResults {
  error?: string;
  errorIndex?: number;
  parts: any[];
}

declare interface IEquationMemberDictionary { 
  [text: string]: EquationMember;
}

@Injectable()
export class EquationParserService {
  private readonly NumberRegex = /^\d*\.?\d+$/;

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
    new EquationFunction('abs', 'Absolute Value', Math.abs),
    new EquationFunction('cos', 'Cos', Math.cos),
    new EquationFunction('sin', 'Sin', Math.sin),
    new EquationFunction('sqrt', 'Square Root', Math.sqrt)
  ];

  functions: EquationFunction[] = []; // abs(x), if(x > 5, x + 1, x-1), sqrt(x^2 + 2)
  constants: EquationConstant[] = []; // A = 5, B = x^2 + 3
  variables: EquationVariable[] = []; // x
  dictionary: IEquationMemberDictionary = {};

  constructor() {
    this.constants = this.definedConstants.map(x => x);
    this.functions = this.definedFunctions.map(x => x);
    this.variables.push(new EquationVariable('x'));

    this.functions.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1);
    this.constants.sort((f1, f2) => f1.literal > f2.literal ? -1 : f1.literal < f2.literal ? 1 : 1);

    // check for any duplicates
    this.functions.forEach(f => { 
      this.dictionary[f.literal.toLowerCase()] = f;
    });
    this.constants.forEach(f => { 
      this.dictionary[f.literal.toLowerCase()] = f;
    });
    this.variables.forEach(f => { 
      this.dictionary[f.literal.toLowerCase()] = f;
    });
  }

  parse(equationText: string): EquationParseResults {
    const results = <EquationParseResults>{};
    results.parts = [];

    const lowerEquationText = equationText.toLowerCase();
    this._parse(results, lowerEquationText);

    return results;
  }

  _parse(results: EquationParseResults, equationText: string) {
    let currentWord = '';
    for (let i = 0; i < equationText.length; i++) {
      let c = equationText[i];
      if (c === ' ') { // or any whitespace
        // process currentWord as-is
        if (currentWord != '') { 
          // error - nothing was ever matched.
        }
      } else if (c === '(') { 
        // process currentWord as-is

        // add to the stack

      } else { 
        currentWord += c;
        let member = this.dictionary[currentWord];
        if (member) { // function, constant, or variable
    
        } else if (this.NumberRegex.test(currentWord)) { 
    
        } else { // error
    
        }
      }
    }
  }

  getExpression(word: string) {
    let member = this.dictionary[word];
    if (member) { // function, constant, or variable

    } else if (this.NumberRegex.test(word)) { 

    } else { // error

    }
  }
}
