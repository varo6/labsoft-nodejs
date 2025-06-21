create table users (
  id integer not null primary key autoincrement unique,
  login text not null, 
  name text not null,
  email text not null,
  passwd text not null
);

insert into users values (1, 'admin', 'Administrador', 'root@mywebmail.com', 'admin');
insert into users values (2, 'pepelu', 'Jose Luis', 'pepelu@mywebmail.com', 'abracadabra');
insert into users values (3, 'tonio', 'Antonio Sanchez', 'a.sanchez@mywebmail.com', 'patata-1234');
insert into users values (4, 'lamari', 'Mari Carmen Martínez', 'mc.martinez@mywebmail.com', 'veteasaber');
insert into users values (5, 'donjl', 'Juan lopez', 'juan.lopez@mywebmail.com', 'G7x[-%az/');

create table emails (
  id integer not null primary key autoincrement unique,
  user integer not null,
  subject text not null,
  sender text not null,
  date text not null
);

insert into emails values (1, 2, 'Revision contrato', 'jp.garcia@terra.com', '2022-01-13 12:50:10');
insert into emails values (2, 1, 'fwd: apuntes informatica', 'miguelsanchez98@alumno.upct.es', '2022-01-13 12:50:10');
insert into emails values (3, 3, 'Inscripción jornadas tecnicas', 'marisa77@gmail.com', '2022-01-13 12:50:10');
insert into emails values (4, 2, 'confirmacion compra', 'compras@amazon.es', '2022-01-13 12:50:10');
insert into emails values (5, 5, 'Calificaciones examen', 'profesor@lis.upct.es', '2022-01-13 12:50:10');
insert into emails values (6, 4, 'Bizcocho casero', 'abuela.angela@gmail.com', '2022-01-13 12:50:10');
insert into emails values (7, 3, 'Fotos viaje', 'mar.sanchez@hotmail.com', '2022-01-13 12:50:10');

create table contents (
  id integer not null primary key unique,
  content text not null
);

insert into contents values (1, 'Hola jose, envía el documento del contrato que lo revise, gracias.');
insert into contents values (2, 'te adjunto los apuntes de clase y el temario');
insert into contents values (3, 'Esimado Antonio, le informo que el plazo para la inscripcion finaliza el 30 de mayo.');
insert into contents values (4, 'Su compra se ha realizado correctamente. Gracias');
insert into contents values (5, 'Estimados alumnos, en el aula virtual pueden en contrar las calificaiones del examen');
insert into contents values (6, 'Hola mari, aqui te paso la receta del bizcocho ese que tanto te gusta');
insert into contents values (7, 'Antonio, en mi google-drive tienes las fotos del ultimo viaje.');
