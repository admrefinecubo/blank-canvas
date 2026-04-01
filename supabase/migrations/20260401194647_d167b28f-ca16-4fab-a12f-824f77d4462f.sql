create schema if not exists extensions;

alter extension vector set schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.match_produtos(
  query_embedding extensions.vector(1536),
  loja_id_param uuid default null,
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  loja_id uuid,
  nome text,
  descricao text,
  categoria text,
  tags text,
  especificacoes text,
  preco_original numeric,
  preco_promocional numeric,
  variacoes text,
  estoque_disponivel boolean,
  foto_principal text,
  foto_detalhe text,
  video_url text,
  similarity float
)
language plpgsql
set search_path = public, extensions
as $$
begin
  return query
  select
    p.id,
    p.loja_id,
    p.nome,
    p.descricao,
    p.categoria,
    p.tags,
    p.especificacoes,
    p.preco_original,
    p.preco_promocional,
    p.variacoes,
    p.estoque_disponivel,
    p.foto_principal,
    p.foto_detalhe,
    p.video_url,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.produtos p
  where p.embedding is not null
    and (loja_id_param is null or p.loja_id = loja_id_param)
    and 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;