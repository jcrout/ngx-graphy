import { Injectable } from "@angular/core";

export type GraphFunctionOutput = (...args: number[]) => number;

export interface GraphFunction { 
    outputter: GraphFunctionOutput;
    args: number;
}

@Injectable()
export class EquationOutputFactory {
    getNext() { 

    }
}