import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export class Member {
  googleid:string;
  memid:number|string;
  eda:number;
  dojoid:number;
  mail:string;
  sei:string;
  mei:string;
  birth:Date | null;
  class:string;
  tel:string;
  zip:string;
  region:string;
  local:string;
  street:string;
  extend:string;
  constructor(init?:Partial<Member>) {
      this.birth = null;
      Object.assign(this, init);
  }
}
@Injectable({
  providedIn: 'root'
})
export class MemberService {
  public claims:any;
  public member:Member=new Member();
  public membs :Member[]=[];
  public flgEx:boolean=false;  //メンバー登録済
  public flgEd:boolean=false;  //枝番新規登録あり
  public flgSm:boolean=false;  //申込済
  public flgLm:boolean=false;  //定員到達
  public flgBy:boolean=false;  //期限到達
  public frmFlds:any;
  public djid:number;
  public type:string;
  public dojo:string;
  public form:string;

  //コンポーネント間通信用
  public subject = new Subject<string>();
  public observe = this.subject.asObservable();

  constructor() { }
}
