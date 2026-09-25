-- ============================================================
-- CRM COMERCIAL - SCRIPT UNICO DE BASE DE DATOS
-- Copiar y pegar completo en: Supabase -> SQL Editor -> Run
-- Seguro de re-ejecutar (usa IF NOT EXISTS / DROP POLICY IF EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONES
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABLA: sucursales
-- ------------------------------------------------------------
create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: profiles (vinculada a auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'consulta' check (role in ('admin','vendedor','consulta')),
  sucursal_id uuid references public.sucursales(id),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Acceso de administradores a multiples sucursales
create table if not exists public.usuario_sucursales (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sucursal_id uuid not null references public.sucursales(id) on delete cascade,
  unique(profile_id, sucursal_id)
);

-- ------------------------------------------------------------
-- TRIGGER: crear profile automaticamente al registrar un usuario
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'consulta')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- CATALOGOS DE CONFIGURACION
-- ------------------------------------------------------------
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tipos_cita (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true
);

create table if not exists public.motivos_rechazo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true
);

-- ------------------------------------------------------------
-- TABLA: prospectos
-- ------------------------------------------------------------
create sequence if not exists public.prospecto_codigo_seq;

create table if not exists public.prospectos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('PROS-' || lpad(nextval('public.prospecto_codigo_seq')::text, 5, '0')),
  sucursal_id uuid not null references public.sucursales(id),
  tipo text not null check (tipo in ('persona','empresa')),
  nombre_contacto text not null,
  empresa text,
  telefono text,
  whatsapp text,
  email text,
  direccion text,
  persona_contacto text,
  cargo_contacto text,
  observaciones text,
  estado_comercial text not null default 'activo',
  vendedor_id uuid not null references public.profiles(id),
  eliminado boolean not null default false,
  eliminado_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: prospecto_servicios (servicio negociado)
-- ------------------------------------------------------------
create table if not exists public.prospecto_servicios (
  id uuid primary key default gen_random_uuid(),
  prospecto_id uuid not null references public.prospectos(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id),
  vendedor_id uuid not null references public.profiles(id),
  precio_inicial numeric(12,2) not null,
  precio_actual numeric(12,2) not null,
  fecha_propuesta date not null default current_date,
  estado text not null default 'nuevo' check (estado in
    ('nuevo','en_seguimiento','en_negociacion','interesado','pendiente_decision','aceptado','rechazado')),
  observaciones text,
  eliminado boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: historial_precios
-- ------------------------------------------------------------
create table if not exists public.historial_precios (
  id uuid primary key default gen_random_uuid(),
  prospecto_servicio_id uuid not null references public.prospecto_servicios(id) on delete cascade,
  precio_anterior numeric(12,2) not null,
  precio_nuevo numeric(12,2) not null,
  fecha_cambio timestamptz not null default now(),
  usuario_id uuid not null references public.profiles(id),
  motivo text not null,
  observaciones text
);

-- ------------------------------------------------------------
-- TABLA: citas
-- ------------------------------------------------------------
create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  prospecto_id uuid not null references public.prospectos(id) on delete cascade,
  prospecto_servicio_id uuid references public.prospecto_servicios(id) on delete set null,
  sucursal_id uuid not null references public.sucursales(id),
  vendedor_id uuid not null references public.profiles(id),
  fecha date not null,
  hora time not null,
  tipo_cita_id uuid references public.tipos_cita(id),
  modalidad text not null default 'presencial' check (modalidad in ('presencial','virtual','telefonica')),
  lugar text,
  motivo text,
  observaciones text,
  estado text not null default 'pendiente' check (estado in
    ('pendiente','confirmada','realizada','cancelada','reprogramada','no_asistio')),
  eliminado boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: resultados_cita
-- ------------------------------------------------------------
create table if not exists public.resultados_cita (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null unique references public.citas(id) on delete cascade,
  resultado text not null check (resultado in
    ('interesado','solicita_nueva_propuesta','solicita_cambio_precio','necesita_consultar',
     'requiere_nueva_reunion','acepta','rechaza','no_asistio','otro')),
  observaciones text not null,
  proximo_seguimiento date,
  registrado_por uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: rechazos
-- ------------------------------------------------------------
create table if not exists public.rechazos (
  id uuid primary key default gen_random_uuid(),
  prospecto_servicio_id uuid not null unique references public.prospecto_servicios(id) on delete cascade,
  motivo_rechazo_id uuid not null references public.motivos_rechazo(id),
  fecha_rechazo date not null default current_date,
  observaciones text,
  usuario_id uuid not null references public.profiles(id)
);

-- ------------------------------------------------------------
-- TABLA: clientes (cliente final)
-- ------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  prospecto_id uuid not null unique references public.prospectos(id),
  sucursal_id uuid not null references public.sucursales(id),
  razon_social text not null,
  nit text not null,
  telefono_empresa text,
  email_empresa text,
  direccion_empresa text,
  contacto_nombre text not null,
  contacto_cargo text,
  contacto_telefono text,
  contacto_whatsapp text,
  contacto_email text,
  fecha_conversion timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: documentos
-- ------------------------------------------------------------
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  prospecto_id uuid references public.prospectos(id) on delete cascade,
  prospecto_servicio_id uuid references public.prospecto_servicios(id) on delete cascade,
  cita_id uuid references public.citas(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  storage_path text not null,
  nombre_archivo text not null,
  tamano_bytes integer,
  subido_por uuid not null references public.profiles(id),
  eliminado boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FUNCIONES AUXILIARES PARA RLS
-- ============================================================
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_sucursal_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select sucursal_id from public.profiles where id = auth.uid()
  union
  select sucursal_id from public.usuario_sucursales where profile_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.sucursales enable row level security;
alter table public.profiles enable row level security;
alter table public.usuario_sucursales enable row level security;
alter table public.servicios enable row level security;
alter table public.tipos_cita enable row level security;
alter table public.motivos_rechazo enable row level security;
alter table public.prospectos enable row level security;
alter table public.prospecto_servicios enable row level security;
alter table public.historial_precios enable row level security;
alter table public.citas enable row level security;
alter table public.resultados_cita enable row level security;
alter table public.rechazos enable row level security;
alter table public.clientes enable row level security;
alter table public.documentos enable row level security;

-- sucursales: todos los autenticados pueden leer; solo admin escribe
drop policy if exists "sucursales_select" on public.sucursales;
create policy "sucursales_select" on public.sucursales for select using (auth.uid() is not null);
drop policy if exists "sucursales_admin_write" on public.sucursales;
create policy "sucursales_admin_write" on public.sucursales for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: cada usuario ve su propio perfil; admin ve y administra todos
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles for insert
  with check (id = auth.uid() or public.is_admin());

-- usuario_sucursales: solo admin administra
drop policy if exists "usuario_sucursales_admin" on public.usuario_sucursales;
create policy "usuario_sucursales_admin" on public.usuario_sucursales for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "usuario_sucursales_select_own" on public.usuario_sucursales;
create policy "usuario_sucursales_select_own" on public.usuario_sucursales for select
  using (profile_id = auth.uid() or public.is_admin());

-- catalogos: lectura para todos los autenticados, escritura solo admin
drop policy if exists "servicios_select" on public.servicios;
create policy "servicios_select" on public.servicios for select using (auth.uid() is not null);
drop policy if exists "servicios_admin_write" on public.servicios;
create policy "servicios_admin_write" on public.servicios for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tipos_cita_select" on public.tipos_cita;
create policy "tipos_cita_select" on public.tipos_cita for select using (auth.uid() is not null);
drop policy if exists "tipos_cita_admin_write" on public.tipos_cita;
create policy "tipos_cita_admin_write" on public.tipos_cita for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "motivos_rechazo_select" on public.motivos_rechazo;
create policy "motivos_rechazo_select" on public.motivos_rechazo for select using (auth.uid() is not null);
drop policy if exists "motivos_rechazo_admin_write" on public.motivos_rechazo;
create policy "motivos_rechazo_admin_write" on public.motivos_rechazo for all
  using (public.is_admin()) with check (public.is_admin());

-- prospectos: admin ve/edita todo dentro de sus sucursales; vendedor solo lo propio; consulta solo lectura de su sucursal
drop policy if exists "prospectos_select" on public.prospectos;
create policy "prospectos_select" on public.prospectos for select using (
  public.is_admin() and sucursal_id in (select public.current_sucursal_ids())
  or vendedor_id = auth.uid()
  or (public.current_role_name() = 'consulta' and sucursal_id in (select public.current_sucursal_ids()))
);
drop policy if exists "prospectos_insert" on public.prospectos;
create policy "prospectos_insert" on public.prospectos for insert with check (
  public.current_role_name() in ('admin','vendedor')
);
drop policy if exists "prospectos_update" on public.prospectos;
create policy "prospectos_update" on public.prospectos for update using (
  public.is_admin() or vendedor_id = auth.uid()
);

-- prospecto_servicios
drop policy if exists "psrv_select" on public.prospecto_servicios;
create policy "psrv_select" on public.prospecto_servicios for select using (
  public.is_admin() or vendedor_id = auth.uid() or public.current_role_name() = 'consulta'
);
drop policy if exists "psrv_insert" on public.prospecto_servicios;
create policy "psrv_insert" on public.prospecto_servicios for insert with check (
  public.current_role_name() in ('admin','vendedor')
);
drop policy if exists "psrv_update" on public.prospecto_servicios;
create policy "psrv_update" on public.prospecto_servicios for update using (
  public.is_admin() or vendedor_id = auth.uid()
);

-- historial_precios
drop policy if exists "hp_select" on public.historial_precios;
create policy "hp_select" on public.historial_precios for select using (
  public.is_admin() or usuario_id = auth.uid()
  or exists (select 1 from public.prospecto_servicios ps where ps.id = prospecto_servicio_id and ps.vendedor_id = auth.uid())
  or public.current_role_name() = 'consulta'
);
drop policy if exists "hp_insert" on public.historial_precios;
create policy "hp_insert" on public.historial_precios for insert with check (
  public.current_role_name() in ('admin','vendedor')
);

-- citas
drop policy if exists "citas_select" on public.citas;
create policy "citas_select" on public.citas for select using (
  public.is_admin() or vendedor_id = auth.uid() or public.current_role_name() = 'consulta'
);
drop policy if exists "citas_insert" on public.citas;
create policy "citas_insert" on public.citas for insert with check (
  public.current_role_name() in ('admin','vendedor')
);
drop policy if exists "citas_update" on public.citas;
create policy "citas_update" on public.citas for update using (
  public.is_admin() or vendedor_id = auth.uid()
);

-- resultados_cita
drop policy if exists "rc_select" on public.resultados_cita;
create policy "rc_select" on public.resultados_cita for select using (
  public.is_admin() or registrado_por = auth.uid()
  or exists (select 1 from public.citas c where c.id = cita_id and c.vendedor_id = auth.uid())
  or public.current_role_name() = 'consulta'
);
drop policy if exists "rc_insert" on public.resultados_cita;
create policy "rc_insert" on public.resultados_cita for insert with check (
  public.current_role_name() in ('admin','vendedor')
);

-- rechazos
drop policy if exists "rz_select" on public.rechazos;
create policy "rz_select" on public.rechazos for select using (
  public.is_admin() or usuario_id = auth.uid()
  or exists (select 1 from public.prospecto_servicios ps where ps.id = prospecto_servicio_id and ps.vendedor_id = auth.uid())
  or public.current_role_name() = 'consulta'
);
drop policy if exists "rz_insert" on public.rechazos;
create policy "rz_insert" on public.rechazos for insert with check (
  public.current_role_name() in ('admin','vendedor')
);

-- clientes
drop policy if exists "clientes_select" on public.clientes;
create policy "clientes_select" on public.clientes for select using (
  public.is_admin()
  or exists (select 1 from public.prospectos p where p.id = prospecto_id and p.vendedor_id = auth.uid())
  or public.current_role_name() = 'consulta'
);
drop policy if exists "clientes_insert" on public.clientes;
create policy "clientes_insert" on public.clientes for insert with check (
  public.current_role_name() in ('admin','vendedor')
);
drop policy if exists "clientes_update" on public.clientes;
create policy "clientes_update" on public.clientes for update using (
  public.is_admin()
  or exists (select 1 from public.prospectos p where p.id = prospecto_id and p.vendedor_id = auth.uid())
);

-- documentos
drop policy if exists "docs_select" on public.documentos;
create policy "docs_select" on public.documentos for select using (
  public.is_admin() or subido_por = auth.uid() or public.current_role_name() = 'consulta'
);
drop policy if exists "docs_insert" on public.documentos;
create policy "docs_insert" on public.documentos for insert with check (
  public.current_role_name() in ('admin','vendedor')
);
drop policy if exists "docs_update" on public.documentos;
create policy "docs_update" on public.documentos for update using (
  public.is_admin() or subido_por = auth.uid()
);

-- ============================================================
-- STORAGE: bucket de documentos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documentos-crm', 'documentos-crm', false)
on conflict (id) do nothing;

drop policy if exists "documentos_crm_read" on storage.objects;
create policy "documentos_crm_read" on storage.objects for select
  using (bucket_id = 'documentos-crm' and auth.uid() is not null);

drop policy if exists "documentos_crm_insert" on storage.objects;
create policy "documentos_crm_insert" on storage.objects for insert
  with check (bucket_id = 'documentos-crm' and auth.uid() is not null);

drop policy if exists "documentos_crm_delete" on storage.objects;
create policy "documentos_crm_delete" on storage.objects for delete
  using (bucket_id = 'documentos-crm' and auth.uid() is not null);

-- ============================================================
-- DATOS INICIALES (opcional pero recomendado)
-- ============================================================
insert into public.tipos_cita (nombre) values
  ('Primera reunión'), ('Presentación de propuesta'), ('Negociación'),
  ('Seguimiento'), ('Revisión de precio'), ('Reunión de cierre'), ('Otro')
on conflict do nothing;

insert into public.motivos_rechazo (nombre) values
  ('Precio elevado'), ('Eligió otro proveedor'), ('Ya no necesita el servicio'),
  ('Falta de presupuesto'), ('Condiciones comerciales'), ('Postergó la compra'),
  ('No responde'), ('Otro')
on conflict do nothing;

-- ============================================================
-- FIN DEL SCRIPT
-- Siguiente paso: crear tu usuario administrador en
-- Authentication -> Add user, luego ejecuta el bloque de abajo
-- reemplazando el correo por el que usaste, para volverlo admin.
-- ============================================================
-- update public.profiles set role = 'admin' where id =
--   (select id from auth.users where email = 'tu-correo@ejemplo.com');
-- Tambien asignale una sucursal:
-- update public.profiles set sucursal_id =
--   (select id from public.sucursales limit 1)
--   where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
