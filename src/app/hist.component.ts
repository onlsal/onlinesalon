import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { ResultService, List } from './srvs/result.service';

@Component({
  selector: 'app-hist',
  templateUrl: './hist.component.html',
  styleUrls: ['./hist.component.scss']
})
export class HistComponent implements OnInit {
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  dataSource:MatTableDataSource<List>;
  displayedColumns = ['date','title','stim','etim','eda','sei','mei','money','act1'];
  public djid:number;
  public memid:number;
  public mail:string;
  constructor(public ressrv: ResultService) {
    this.dataSource = new MatTableDataSource<List>(this.ressrv.lists);
  }

  ngOnInit(): void {
    // this.djid = +localStorage.getItem('olsalon_dojo');
    // this.memid = +localStorage.getItem('olsalon_memid');
    // this.mail = localStorage.getItem('olsalon_mail');
    // this.readGdrive();
    // console.log(this.mail,this.memid);
    this.dataSource.paginator = this.paginator;
    this.ressrv.observe.subscribe(() => this.refresh());
  }
  // readGdrive():void {
  //   this.lists=[];
  //   let fileId = '1oyfyrhxl4vLGG2TGS1Yai9ltfyd3Mwg-YxFe3DRns-U';
  //   this.gDrive.load( fileId ,'od6')
  //   .then( ( data :any) => {
  //     const idx:number= data.findIndex(e => e.dojoid == this.djid);
  //     const spread:string=data[idx].spread;
  //     this.gDrive.load( spread, data[idx].wid)
  //     .then( ( data :any) => {
  //       let forms:Form[]=[];
  //       for (let i=0;i<data.length;i++){
  //         forms.push({
  //           date :data[i]['開催日'],
  //           title:data[i]['予約フォームタイトル'],
  //           stim :data[i]['開始時間24時間表示で入力'],
  //           etim :data[i]['終了時間24時間表示で入力'],
  //           wid  :data[i].wid,
  //           money:+data[i]['金額'],   
  //         });
  //       }
  //       // console.log(forms,this.mail);
  //       for (let j=0;j<forms.length;j++){
  //         this.gDrive.load( spread, forms[j].wid)  
  //         .then( ( data :any) => {
  //           for (let k=0;k<data.length;k++){
  //             if (data[k]['メールアドレス']==this.mail){
  //               this.lists.push({
  //                 date :forms[j].date,
  //                 title:forms[j].title,
  //                 stim :forms[j].stim,
  //                 etim :forms[j].etim,
  //                 eda  :data[k]['会員番号'],
  //                 sei  :data[k]['参加者姓'],
  //                 mei  :data[k]['参加者名'],
  //                 money:forms[j].money
  //               });
  //             }
  //           }
  //         });
  //       }
  //       this.subject.next();
  //       console.log(this.lists);

  //     });
  //   }, (error) => {
  //     console.log( error );
  //   });
  
  // }
  deleteRow(i:number):void{
    

  }
  refresh(): void {
    // console.log(this.ressrv.lists);
    this.dataSource = new MatTableDataSource<List>(this.ressrv.lists);
    this.dataSource.paginator = this.paginator;
  }
}
