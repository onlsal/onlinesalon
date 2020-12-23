import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap  } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Apollo } from 'apollo-angular';
import * as Query from './graph-ql/queries';
import * as moment from 'moment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GoogleDriveProvider } from './prvs/googledrive';
import { ResultService } from './srvs/result.service';
import { MemberService } from './srvs/member.service';

class Form {
  frmid:string;
  date:string;
  title:string;
  stim:string;
  etim:string;
  wid:string;
  money:number;
  constructor(init?:Partial<Form>) {
      Object.assign(this, init);
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ GoogleDriveProvider ]
})
export class HomeComponent implements OnInit {
  form: FormGroup;
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
      // console.log('ngOnInit',this.djid);
      if (djtmp === null){
        this.memsrv.djid = +localStorage.getItem('olsalon_dojo');
      }else{
        this.memsrv.djid = +djtmp;
        this.get_tbldj(this.memsrv.djid);
        // console.log('ngOnInit set前',this.djid);
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
    // console.log('googleInit',this.djid);
    this.memsrv.djid = +localStorage.getItem('olsalon_dojo');
    // console.log("login",this.djid);
    this.get_tbldj(this.memsrv.djid);
    this.memsrv.form = localStorage.getItem('olsalon_form');
    this.memsrv.type = localStorage.getItem('olsalon_type');
    // console.log("login",this.dojo);
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
          this.memsrv.member.googleid=loginfo.sub;
          this.memsrv.member.sei=loginfo.family_name;
          this.memsrv.member.mei=loginfo.given_name;
          // console.log('getmemid前', this.djid);
          this.get_memid(this.memsrv.djid);
          this.memsrv.member.eda=1;
          this.memsrv.member.class="未登録";
          // this.member.birth="未登録";
          this.memsrv.member.mail=loginfo.email;
          this.memsrv.membs.push(this.memsrv.member);
        } else { 
          this.memsrv.flgEx=true; 
          this.memsrv.membs = data.tblmember;
          this.memsrv.member = this.memsrv.membs[0];
        }
        // localStorage.setItem('olsalon_mail', this.member.mail); 
        // localStorage.setItem('olsalon_memid', this.member.memid.toString());
        this.form.get('grp1').patchValue(this.memsrv.member);
        this.form.get('grp2').patchValue(this.memsrv.member);
        this.readGdrive();
      });
  }
  public upd_tblmem():void {
    // localStorage.setItem('olsalon_mail', this.member.mail); 
    // localStorage.setItem('olsalon_memid', this.member.memid.toString());
    if (this.memsrv.flgEx){
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
            "zip" : this.form.get('grp2').value.zip,
            "region" : this.form.get('grp2').value.region,
            "local" : this.form.get('grp2').value.local,
            "street" : this.form.get('grp2').value.street,
            "extend" : this.form.get('grp2').value.extend
          } , 
          id: this.memsrv.member.dojoid,
          gid: this.memsrv.member.googleid,
          eda : this.form.get('grp1').value.eda,
        },
      }).subscribe(({ data }) => {
        console.log('UpdateMember', data);
      },(error) => {
        console.log('error UpdateMember', error);
      });
    }else{  
      this.memsrv.flgEx=true;
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
            "zip" : this.form.get('grp2').value.zip,
            "region" : this.form.get('grp2').value.region,
            "local" : this.form.get('grp2').value.local,
            "street" : this.form.get('grp2').value.street,
            "extend" : this.form.get('grp2').value.extend
           }
        },
      }).subscribe(({ data }) => {
        console.log('InsertMember', data);
      },(error) => {
        console.log('error InsertMember', error);
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
        let forms:Form[]=[];
        // console.log(data);
        for (let i=0;i<data.length;i++){
          forms.push({
            frmid:data[i]['formid'],        
            date :data[i]['開催日'],
            title:data[i]['予約フォームタイトル'],
            stim :data[i]['開始時間24時間表示で入力'],
            etim :data[i]['終了時間24時間表示で入力'],
            wid  :data[i].wid,
            money:+data[i]['金額'],   
          });
        }
        // console.log(forms,this.mail);
        for (let j=0;j<forms.length;j++){
          this.gDrive.load( spread, forms[j].wid)  
          .then( ( data :any) => {
            for (let k=0;k<data.length;k++){
              if (data[k]['メールアドレス']==this.memsrv.member.mail){
                this.ressrv.lists.push({
                  frmid:forms[j].frmid, 
                  date :forms[j].date,
                  title:forms[j].title,
                  stim :forms[j].stim,
                  etim :forms[j].etim,
                  eda  :data[k]['会員枝番'],
                  sei  :data[k]['参加者姓'],
                  mei  :data[k]['参加者名'],
                  money:forms[j].money
                });
              }
            }
            this.ressrv.subject.next();
          });
        }
      });
    }, (error) => {
      console.log( error );
    });
  
  }

  goForm(){
    console.log(this.memsrv.member);
    this.upd_tblmem();
    localStorage.setItem('olsalon_pay', this.memsrv.dojo);
    this.apollo.watchQuery<any>({
      query: Query.GetQuery5,
      variables: { 
          type : this.memsrv.type
        },
      })
      .valueChanges
      .subscribe(({ data }) => {
        console.log(data,data.tblfrmfld_by_pk); 
        const site = "https://docs.google.com/forms/d/" + this.memsrv.form + "/viewform?usp=pp_url" 
        + "&entry." + data.tblfrmfld_by_pk.mail + "=" + this.memsrv.member.mail 
        + "&entry." + data.tblfrmfld_by_pk.memid + "=" + this.memsrv.member.memid
        + "&entry." + data.tblfrmfld_by_pk.eda + "=" + this.memsrv.member.eda
        + "&entry." + data.tblfrmfld_by_pk.sei + "=" + this.form.get('grp1').value.sei
        + "&entry." + data.tblfrmfld_by_pk.mei  + "=" + this.form.get('grp1').value.mei
        + "&entry." + data.tblfrmfld_by_pk.birth + "=" + moment(this.form.get('grp1').value.birth).format("YYYY-MM-DD") 
        + "&entry." + data.tblfrmfld_by_pk.class + "=" + this.form.get('grp1').value.class;
        window.location.href=site;
      },(error) => {
        console.log('error get_frmfld', error);
      });
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
        // console.log(data,data.tblowner.dojoname);
      },(error) => {
        console.log('error get_tbldj', error);
      });
  }

  public get_memid(dojoid:number):void{
    // console.log(dojoid);
    this.apollo.watchQuery<any>({
      query: Query.GetQuery3,
      variables: { 
          did : dojoid
        },
      })
      .valueChanges
      .subscribe(({ data }) => {
        // console.log(data.tblmember_aggregate.aggregate.max.memid==null);
        if (data.tblmember_aggregate.aggregate.max.memid==null) {
          this.memsrv.member.memid = 1;
        } else {
          this.memsrv.member.memid = data.tblmember_aggregate.aggregate.max.memid + 1; 
        }
      });
  }

  insEda():void {
    console.log(this.memsrv.member);
    this.upd_tblmem();
    let eda:number[] = this.memsrv.membs.map(function (p) {
      return p.eda;
    });
    this.memsrv.member.mei="";
    this.memsrv.member.eda=Math.max.apply(null, eda)+1;
    this.memsrv.member.class="";
    this.memsrv.member.birth=new Date();
    this.memsrv.membs.push(this.memsrv.member);
    this.changeEda(this.memsrv.member.eda);
    this.memsrv.flgEx=false;
    this.upd_tblmem();
  }
  changeEda(eda:number):void {
    this.memsrv.member = this.memsrv.membs.find(e => e.eda === eda);
    this.form.get('grp1').patchValue(this.memsrv.member);
    this.form.get('grp2').patchValue(this.memsrv.member);
    for (let i=0;i<this.ressrv.lists.length;i++){
      this.memsrv.flgSm=false;
      if (this.ressrv.lists[i].eda==eda && this.ressrv.lists[i].frmid==this.memsrv.form ){
        this.memsrv.flgSm=true;
        break;
      }
      // console.log(eda,this.memsrv.flgSm);
    }      
  }
  test() {
    console.log(this.ressrv.lists);
  }
}
