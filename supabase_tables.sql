-- Supabase table definitions for Mzimba South EduData Hub

create table if not exists zones (
  id bigint primary key,
  name text not null
);

create table if not exists schools (
  id bigint primary key,
  emis text not null,
  name text not null,
  zone text not null,
  password text not null,
  districtNumber text,
  divisionNumber text,
  constituency text,
  ta text,
  postalAddress text,
  distanceFromNearestPrimary text,
  distanceToTDC text,
  distanceToDEM text,
  yearEstablished text
);

create table if not exists enrollment (
  id bigint primary key,
  emis text not null,
  year text not null,
  std1m text,
  std1f text,
  std2m text,
  std2f text,
  std3m text,
  std3f text,
  std4m text,
  std4f text,
  std5m text,
  std5f text,
  std6m text,
  std6f text,
  std7m text,
  std7f text,
  std8m text,
  std8f text,
  totalM integer,
  totalF integer,
  schoolName text,
  zone text,
  timestamp timestamptz
);

create table if not exists pslce_results (
  id bigint primary key,
  emis text not null,
  year text not null,
  enteredM text,
  enteredF text,
  satM text,
  satF text,
  passedM text,
  passedF text,
  failedM text,
  failedF text,
  nationalSecM text,
  nationalSecF text,
  districtSsM text,
  districtSsF text,
  daySecM text,
  daySecF text,
  cdssM text,
  cdssF text,
  totalSelectedM integer,
  totalSelectedF integer,
  schoolName text,
  zone text,
  timestamp timestamptz
);

create table if not exists school_particulars (
  id bigint primary key,
  emis text not null,
  headmaster text,
  phone text,
  email text,
  address text,
  timestamp timestamptz
);

create table if not exists upload_history (
  id bigint primary key,
  category text,
  emis text,
  timestamp timestamptz
);
