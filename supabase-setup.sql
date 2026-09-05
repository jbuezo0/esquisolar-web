create extension if not exists pgcrypto;

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  nombre_resumido text not null,
  categoria text not null,
  marca text not null default 'EsquiSolar',
  modelo text not null default '',
  descripcion text not null,
  especificaciones jsonb not null default '[]'::jsonb,
  precio numeric(12,2) not null check (precio >= 0),
  precio_anterior numeric(12,2),
  imagen text not null,
  imagen_ruta text not null,
  garantia text not null default 'Consultar',
  disponibilidad text not null default 'Consultar existencias',
  destacado boolean not null default false,
  etiqueta text not null default 'Nuevo',
  creado_en timestamptz not null default now()
);

alter table public.productos enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.productos to anon;
grant select, insert, update, delete on public.productos to authenticated;

drop policy if exists "Productos visibles para todos" on public.productos;
create policy "Productos visibles para todos"
on public.productos for select
to anon, authenticated
using (true);

drop policy if exists "Administradores agregan productos" on public.productos;
create policy "Administradores agregan productos"
on public.productos for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'esquisolar@gmail.com');

drop policy if exists "Administradores actualizan productos" on public.productos;
create policy "Administradores actualizan productos"
on public.productos for update
to authenticated
using ((auth.jwt() ->> 'email') = 'esquisolar@gmail.com')
with check ((auth.jwt() ->> 'email') = 'esquisolar@gmail.com');

drop policy if exists "Administradores eliminan productos" on public.productos;
create policy "Administradores eliminan productos"
on public.productos for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'esquisolar@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Imágenes públicas de productos" on storage.objects;
create policy "Imágenes públicas de productos"
on storage.objects for select
to public
using (bucket_id = 'productos');

drop policy if exists "Administradores suben imágenes" on storage.objects;
create policy "Administradores suben imágenes"
on storage.objects for insert
to authenticated
with check (bucket_id = 'productos' and (auth.jwt() ->> 'email') = 'esquisolar@gmail.com');

drop policy if exists "Administradores actualizan imágenes" on storage.objects;
create policy "Administradores actualizan imágenes"
on storage.objects for update
to authenticated
using (bucket_id = 'productos' and (auth.jwt() ->> 'email') = 'esquisolar@gmail.com')
with check (bucket_id = 'productos' and (auth.jwt() ->> 'email') = 'esquisolar@gmail.com');

drop policy if exists "Administradores eliminan imágenes" on storage.objects;
create policy "Administradores eliminan imágenes"
on storage.objects for delete
to authenticated
using (bucket_id = 'productos' and (auth.jwt() ->> 'email') = 'esquisolar@gmail.com');
