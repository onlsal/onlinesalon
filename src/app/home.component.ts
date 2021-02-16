import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap  } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Apollo } from 'apollo-angular';
import * as Query from './graph-ql/queries';
import * as moment from 'moment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GoogleDriveProvider } from './prvs/googledrive';
import { ResultService } from './srvs/result.service';
import { MemberService,Form } from './srvs/member.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ GoogleDriveProvider ]
})
export class HomeComponent implements OnInit {
  public form: FormGroup;
  public TabIndex:number=0;
  constructor(public gDrive: GoogleDriveProvider,
              public ressrv: ResultService,
              public memsrv: MemberService,
              private oauthService: OAuthService,
              private frmBlder: FormBuilder,         
              private route: ActivatedRoute,
              private apollo: Apollo) {
              }

  ngOnInit() {
    this.googolePageInit();
    this.form= this.frmBlder.group({});
    this.route.paramMap.subscribe((params: ParamMap)=>{
      var djtmp:string;
      djtmp = params.get('dojo');
      if (djtmp === null){
        this.memsrv.djid = +localStorage.getItem('olsalon_dojo');
      }else{
        this.memsrv.djid = +djtmp;
        this.get_tbldj(this.memsrv.djid);
        localStorage.setItem('olsalon_dojo', this.memsrv.djid.toString());
      }
      this.memsrv.type = params.get('type');
      if (this.memsrv.type === null){
        this.memsrv.type = localStorage.getItem('olsalon_type');
      }else{
        localStorage.setItem('olsalon_type', this.memsrv.type);
      } 
      this.memsrv.form = params.get('form');
      if (this.memsrv.form === null){
        this.memsrv.form = localStorage.getItem('olsalon_form');
      }else{
        localStorage.setItem('olsalon_form', this.memsrv.form);
      }            
    });

  }
  public login() {
    this.oauthService.revokeTokenAndLogout();
    this.oauthService.initLoginFlow();
    this.googolePageInit();
  }

  // Google ページ初期化
  private async googolePageInit() {

    this.oauthService.setStorage(localStorage);
    await this.oauthService.setupAutomaticSilentRefresh();


  // この非同期処理を行わないとユーザー情報が取得できない
    await this.oauthService.loadDiscoveryDocument()
    .then(() => this.oauthService.tryLogin());

    // すでに Google にログインしている場合ログイン後の画面を表示
    this.memsrv.claims =  this.oauthService.getIdentityClaims();
    if (this.memsrv.claims) {
      this.memsrv.member.googleid = this.memsrv.claims.sub;
      this.get_tblmem(this.memsrv.claims);
    }
    this.memsrv.djid = +localStorage.getItem('olsalon_dojo');
    this.get_tbldj(this.memsrv.djid);
    this.memsrv.form = localStorage.getItem('olsalon_form');
    this.memsrv.type = localStorage.getItem('olsalon_type');
  }

  public get_tblmem(loginfo):void {
    this.memsrv.membs=[];
    this.apollo.watchQuery<any>({
      query: Query.GetQuery1,
      variables: { 
          gid : loginfo.sub,
          did : this.memsrv.djid
        },
      })
      .valueChanges
      .subscribe(({ data }) => {
        if (data.tblmember.length==0){
          this.memsrv.flgEx=false;
          this.memsrv.flgEd=true;
          this.memsrv.member.googleid=loginfo.sub;
          this.memsrv.member.sei=loginfo.family_name;
          this.memsrv.member.mei=loginfo.given_name;
          this.memsrv.member.memid="新規登録";
          this.memsrv.member.eda=1;
          this.memsrv.member.class="";
          this.memsrv.member.birth=null;
          this.memsrv.member.mail=loginfo.email;
          let member1=Object.assign({},this.memsrv.member);//参照ではなく、値を配列に追加
          this.memsrv.membs.push(member1);
        } else { 
          this.memsrv.membs=[];
          this.memsrv.flgEx=true;
          for(let i=0;i<data.tblmember.length;i++){
            let member1=Object.assign({},data.tblmember[i]);//参照ではなく、値を配列に追加
            this.memsrv.membs.push(member1);
          }
          this.memsrv.member = Object.assign({},this.memsrv.membs[0]);
        }
        this.form.get('grp1').patchValue(this.memsrv.member);
        this.readGdrive();
      });
  }
  public upd_tblmem():void {
    if (this.memsrv.flgEx && !this.memsrv.flgEd){
      this.apollo.mutate<any>({
        mutation: Query.UpdateMember,
        variables: {
          "_set": {
            "mail" :  this.memsrv.member.mail,
            "sei" :   this.form.get('grp1').value.sei,
            "mei" :   this.form.get('grp1').value.mei,
            "class" : this.form.get('grp1').value.class,
            "birth" : moment(this.form.get('grp1').value.bir).format("YYYY-MM-DD"),
            "tel" : this.form.get('grp1').value.tel,
            "zip" : this.form.get('grp1').value.zip,
            "region" : this.form.get('grp1').value.region,
            "local" : this.form.get('grp1').value.local,
            "street" : this.form.get('grp1').value.street,
            "extend" : this.form.get('grp1').value.extend
          } , 
          memid: this.memsrv.member.memid,
          eda : this.form.get('grp1').value.eda,
        },
      }).subscribe(({ data }) => {
        console.log('UpdateMember', data);
      },(error) => {
        console.log('error UpdateMember', error);
      });
    }else{  
      this.memsrv.flgEx=true;
      this.apollo.watchQuery<any>({
        query: Query.GetQuery3,
        })
        .valueChanges
        .subscribe(({ data }) => {
          if (this.memsrv.member.memid=="新規登録"){
            if (data.tblmember_aggregate.aggregate.max.memid==null) {
              this.memsrv.member.memid = 1;
            } else {
              this.memsrv.member.memid = data.tblmember_aggregate.aggregate.max.memid + 1; 
            }
          }
          this.apollo.mutate<any>({
            mutation: Query.InsertMember,
            variables: {
              "object": {
                "googleid": this.memsrv.member.googleid,
                "dojoid" : this.memsrv.djid,
                "memid" : this.memsrv.member.memid,
                "eda" : this.memsrv.member.eda,
                "mail" :  this.memsrv.member.mail,
                "sei" :   this.form.get('grp1').value.sei,
                "mei" :   this.form.get('grp1').value.mei,
                "class" : this.form.get('grp1').value.class,
                "birth" : moment(this.form.get('grp1').value.birth).format("YYYY-MM-DD"),
                "tel" : this.form.get('grp1').value.tel,
                "zip" : this.form.get('grp1').value.zip,
                "region" : this.form.get('grp1').value.region,
                "local" : this.form.get('grp1').value.local,
                "street" : this.form.get('grp1').value.street,
                "extend" : this.form.get('grp1').value.extend
               }
            },
          }).subscribe(({ data }) => {
            console.log('InsertMember', data);
          },(error) => {
            console.log('error InsertMember', error);
          });
        });
    }  
  }
  readGdrive():void {
    this.ressrv.lists=[];
    let fileId = '1oyfyrhxl4vLGG2TGS1Yai9ltfyd3Mwg-YxFe3DRns-U';
    this.gDrive.load( fileId ,'od6')
    .then( ( data :any) => {
      const idx:number= data.findIndex(e => e.dojoid == this.memsrv.djid);
      const spread:string=data[idx].spread;
      this.gDrive.load( spread, data[idx].wid)
      .then( ( data :any) => {
        this.memsrv.flgLm=false; 
        let forms:Form[]=[];
        for (let i=0;i<data.length;i++){
          let lcby:Date;
          if (data[i]['申込期限未入力の場合、当日も可']==null){
            lcby=moment(data[i]['開催日'],'YYYY/MM/DD').toDate();
          } else { 
            lcby=moment(data[i]['申込期限未入力の場合、当日も可'],'YYYY/MM/DD').toDate(); 
          }
          forms.push({
            frmid:data[i]['formid'],        
            date :data[i]['開催日'],
            title:data[i]['予約フォームタイトル'],
            stim :data[i]['開始時間24時間表示で入力'],
            etim :data[i]['終了時間24時間表示で入力'],
            lim  :data[i]['定員数字のみ入力'],
            wid  :data[i].wid,
            money:+data[i]['金額'],
            by:lcby
          }); 
        }
        for (let j=0;j<forms.length;j++){
          this.gDrive.load( spread, forms[j].wid)  
          .then( ( resdata :any) => {
            for (let k=0;k<data.length;k++){
              if (data[k]['メールアドレス']==this.memsrv.member.mail){
                this.ressrv.lists.push({
                  frmid:forms[j].frmid, 
                  date :forms[j].date,
                  title:forms[j].title,
                  stim :forms[j].stim,
                  etim :forms[j].etim,
                  memid:resdata[k]['予約者番号'],
                  eda  :resdata[k]['予約者枝番'],
                  sei  :resdata[k]['参加者姓'],
                  mei  :resdata[k]['参加者名'],
                  money:forms[j].money
                });
              }
            }
            if(forms[j].frmid==this.memsrv.form){
              this.memsrv.frmInfo=forms[j];
              if(resdata.length >= forms[j].lim){
                this.memsrv.flgLm=true; 
                this.form.disable();
              }
              const now:Date=new Date();
              console.log(forms[j].by,forms[j].by.getTime());
              console.log(now,now.getTime());
              if(forms[j].by.getTime() < now.getTime()){
                this.memsrv.flgBy=true; 
                this.form.disable();
              }
            }
            
            this.ressrv.subject.next();
          });
        }
      });
      this.apollo.watchQuery<any>({
        query: Query.GetQuery5,
        variables: { 
            type : this.memsrv.type
          },
        })
        .valueChanges
        .subscribe(({ data }) => {
          this.memsrv.frmFlds=data.tblfrmfld_by_pk; 
        },(error) => {
          console.log('error get_frmfld', error);
        });
    }, (error) => {
      console.log( error );
    });
  
  }

  goForm(){
    this.upd_tblmem();
    localStorage.setItem('olsalon_pay', this.memsrv.dojo);
    window.location.href = "https://docs.google.com/forms/d/" + this.memsrv.form + "/viewform?usp=pp_url" 
    + "&entry." + this.memsrv.frmFlds.mail + "=" + this.memsrv.member.mail 
    + "&entry." + this.memsrv.frmFlds.memid + "=" + this.memsrv.member.memid
    + "&entry." + this.memsrv.frmFlds.eda + "=" + this.memsrv.member.eda
    + "&entry." + this.memsrv.frmFlds.sei + "=" + this.form.get('grp1').value.sei
    + "&entry." + this.memsrv.frmFlds.mei  + "=" + this.form.get('grp1').value.mei
    + "&entry." + this.memsrv.frmFlds.birth + "=" + moment(this.form.get('grp1').value.birth).format("YYYY-MM-DD") 
    + "&entry." + this.memsrv.frmFlds.class + "=" + this.form.get('grp1').value.class;
  }

  public get_tbldj(dojoid:number):void {
    this.apollo.watchQuery<any>({
      query: Query.GetQuery2,
      variables: { 
          did : dojoid
        },
      })
      .valueChanges
      .subscribe(({ data }) => {
        this.memsrv.dojo = data.tblowner[0].dojoname;
      },(error) => {
        console.log('error get_tbldj', error);
      });
  }
  insEda():void {
    this.upd_tblmem();
    let eda:number[] = this.memsrv.membs.map(function (p) {
      return p.eda;
    });
    this.memsrv.member.mei="";
    this.memsrv.member.eda=Math.max.apply(null, eda)+1;
    this.memsrv.member.class="";
    this.memsrv.member.birth=null;
    let member1=Object.assign({},this.memsrv.member);//参照ではなく、値を配列に追加
    this.memsrv.membs.push(member1);
    this.changeEda(this.memsrv.member.eda);
    this.memsrv.flgEd=true;
    this.form.get('grp1').get('eda').disable();
  }
  changeEda(eda:number):void {
    this.memsrv.member = Object.assign({},this.memsrv.membs.find(e => e.eda === eda));
    this.form.get('grp1').patchValue(this.memsrv.member);
    for (let i=0;i<this.ressrv.lists.length;i++){
      this.memsrv.flgSm=false;
      if (this.ressrv.lists[i].memid==this.memsrv.member.memid && this.ressrv.lists[i].eda==eda && this.ressrv.lists[i].frmid==this.memsrv.form ){
        this.memsrv.flgSm=true;
        break;
      }
    }      
  }
  // test() {
  //   // this.upd_tblmem();
  //   console.log(this.memsrv.membs,this.memsrv.member);
  // }
}
