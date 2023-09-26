export interface InputFromStarfacePbx {
    DTMF: string;
    CallerName: string;
    CallerID: string;
    action: 'start' | 'stop' | 'input';
}
