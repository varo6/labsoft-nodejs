create table users (
  id integer not null primary key autoincrement unique,
  login text not null, 
  name text not null,
  passwd text not null,
  token text not null default ''
);

insert into users values (1, 'admin', 'Administrador', 'admin', '');
insert into users values (2, 'pepelu', 'Jose Luis', 'abracadabra', '');
insert into users values (3, 'tonio', 'Antonio Sanchez', 'patata-1234', '');
insert into users values (4, 'lamari', 'Mari Carmen Martínez', 'veteasaber', '');
insert into users values (5, 'donjl', 'Juan lopez', 'G7x[-%az/', '');
