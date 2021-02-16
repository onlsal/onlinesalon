import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export class List {
  frmid:string;
  date:string;
  title:string;
  stim:string;
  etim:string;
  memid:number;
  eda:number;
  sei:string;
  mei:string;
  money:number;
  constructor(init?:Partial<List>) {
      Object.assign(this, init);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  public subject = new Subject<string>();
  public observe = this.subject.asObservable();

  public lists:List[]=[];
  
  constructor() { }
}
