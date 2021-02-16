import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroupDirective, FormGroup, FormControl, Validators, ControlContainer } from '@angular/forms';
import { MemberService } from './srvs/member.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-memb',
  templateUrl: './memb.component.html',
  styleUrls: ['./memb.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class MembComponent implements OnInit {
  @Output() action = new EventEmitter();
  @Output() action2 = new EventEmitter();
  @Output() action3 = new EventEmitter();

  constructor(public memsrv: MemberService,
              public parent: FormGroupDirective) {

               }

  ngOnInit(): void {
    const form = this.parent.form;
    form.addControl('grp1', new FormGroup({
      eda: new FormControl('', Validators.required),
      sei: new FormControl('', Validators.required),
      mei: new FormControl('', Validators.required),
      class: new FormControl(''),
      birth: new FormControl('', Validators.required),
      tel: new FormControl(''),
      zip: new FormControl('', Validators.required),
      region: new FormControl('', Validators.required),
      local: new FormControl('', Validators.required),
      street: new FormControl('', Validators.required),
      extend: new FormControl('')
    })); 

  }
  goForm():void {
    this.action.emit();
  }
  insEda():void {
    this.action2.emit();
  }
  changeEda(eda:number):void {
    this.action3.emit(eda);
  }
  delEda():void {
    this.memsrv.flgEd=false;
    this.memsrv.membs.pop();
    this.changeEda(1);
    this.parent.form.get('grp1').get('eda').enable();
  }
  // test(thisForm:any){
  //   console.log(thisForm,this.parent.form);
  // }
}
