import gql from 'graphql-tag';

export const GetQuery1 = gql`
query get_member($gid: String!,$did: Int!) {
  tblmember(where: {googleid: {_eq: $gid}, dojoid: {_eq: $did}}) {
    googleid
    dojoid
    memid
    eda
    mail
    sei
    mei
    birth
    class
    zip
    region
    local
    street
    extend
    tel
  }
}`;

export const GetQuery2 = gql`
query get_dojo($did: Int!) {
  tblowner(where: {dojoid: {_eq: $did}}) {
    dojoname
  }
}`;

export const GetQuery3 = gql`
query calc_memid {
  tblmember_aggregate {
    aggregate {
      max {
        memid
      }
    }
  }
}`;

export const UpdateMember = gql`
mutation upd_member($_set: tblmember_set_input!, $memid: Int!,$eda: Int!) {
  update_tblmember_by_pk(pk_columns: {eda: $eda,memid: $memid}, _set: $_set) {
    memid
    googleid
  }
}`;

export const InsertMember = gql`
mutation ins_member($object: tblmember_insert_input!) {
  insert_tblmember_one(object: $object) {
    memid
    googleid
  }
}`;

export const GetQuery5 = gql`
query get_frmfld($type: String!) {
  tblfrmfld_by_pk(type: $type) {
    mail
    memid
    eda
    sei
    mei
    birth
    class
  }
}`;