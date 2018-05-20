export type EqFunctionDeclaration = (...args: any[]) => number;

export abstract class EqMember {
  literal: string;

  constructor(literal: string) {
    this.literal = literal;
  }
}

export enum EqFunctionArgumentType {
  Numeric = 1,
  Boolean = 2
}

export interface EqFunctionArgumentParams {
  type?: EqFunctionArgumentType
  position?: number;
  defaultValue?: string;
  infiniteArgs?: boolean;
}

export class EqFunctionArgument {
  public type: EqFunctionArgumentType;
  constructor(type?: EqFunctionArgumentType | EqFunctionArgumentParams, public position: number = -1, public defaultValue: string = null, public infiniteArgs: boolean = false) {
    if (type && typeof type === 'object') {
      this.type = type.type;
      this.position = type.position;
      this.defaultValue = type.defaultValue;
      this.infiniteArgs = type.infiniteArgs;
    }
  }
  static default() {
    return new EqFunctionArgument(EqFunctionArgumentType.Numeric, -1, null, false);
  }
  static defaultSingle() {
    return [new EqFunctionArgument(EqFunctionArgumentType.Numeric, 0, null, false)];
  }
  static defaultDouble() {
    return [
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 0, null, false),
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 1, null, false)
    ];
  }
  static defaultOperator() {
    return [
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 0, null, false),
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 1, null, false)
    ];
  }
  static defaultRightOperator() {
    return [
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 0, '0', false),
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 1, null, false)
    ];
  }
  static defaultSingleInfinite() {
    return [
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 0, null, false),
      new EqFunctionArgument(EqFunctionArgumentType.Numeric, 1, null, true)
    ];
  }
}

export class EqFunction extends EqMember {
  constructor(literal: string, public name?: string, public expression?: EqFunctionDeclaration, public args?: EqFunctionArgument[]) {
    super(literal);
    if (args) {
      args.forEach((a, i) => {
        if (!a.type) {
          a.type = EqFunctionArgumentType.Numeric;
        }

        a.position = a.position >= 0 ? a.position : i;
      });
      args.sort((a1, a2) => a1.position > a2.position ? 1 : -1);
    }
  }
}

export class EqOperator extends EqFunction {
  constructor(literal: string, expression: EqFunctionDeclaration, public index: number, args?: EqFunctionArgument[]) {
    super(literal, '', expression, args);
  }
}

export class EqConstant extends EqMember {
  expression: string;

  constructor(literal: string, expression: string) {
    super(literal);

    this.expression = expression;
  }
}

export class EqVariable extends EqMember {
  constructor(literal: string) {
    super(literal);;
  }
}

export class EqNumber extends EqMember {
  constructor(literal: string) {
    super(literal);
  }
}

export class EqContainer extends EqMember {
  constructor(literal: string) {
    super(literal);
  }
}

export class EqArgSeparator extends EqMember {
  constructor(literal: string) {
    super(literal);
  }
}

export interface EqMemberType {
  type: string;
  color?: string;
  size?: number;
}

export interface EqParseResults {
  equation: string;
  equationPart: ParserPart;
  errors: ParserError[];
  warnings: ParserWarning[];
  elapsedTime: number;
}

export interface ParserPart {
  startIndex: number;
  literal: string;
  member: EqMember;
  type: string;
  args?: string[];
  parts?: ParserPart[];
}

export class ParserError {
  constructor(public message: string, public startIndex: number) { }
}

export class ParserIdentifierError extends ParserError {
  constructor(message: string, startIndex: number, public identifier: string) {
    super(message, startIndex);
  }
}

export class ParserFunctionArgumentError extends ParserError {
  constructor(message: string, startIndex: number, public fn: EqFunction, public arg: EqFunctionArgument) {
    super(message, startIndex);
  }
}

export class ParserWarning {
  constructor(public message: string, public startIndex: number) { }
}

export class ParserPotentialFunctionWarning extends ParserWarning {
  constructor(message: string, startIndex: number, public identifier: string) {
    super(message, startIndex);
  }
}