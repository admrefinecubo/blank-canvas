-- Drop old signatures to allow adding p_tags param
DROP FUNCTION IF EXISTS public.fn_ecommerce_webhook_process(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_ecommerce_import_produto(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.fn_ecommerce_webhook_process(
  p_loja_id UUID,
  p_plataforma TEXT,
  p_event_id TEXT DEFAULT NULL,
  p_topico TEXT DEFAULT 'product/update',
  p_headers JSONB DEFAULT NULL,
  p_payload_original JSONB DEFAULT NULL,
  p_external_id TEXT DEFAULT NULL,
  p_nome TEXT DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL,
  p_preco_original NUMERIC DEFAULT 0,
  p_preco_promocional NUMERIC DEFAULT NULL,
  p_estoque INTEGER DEFAULT 0,
  p_foto_principal TEXT DEFAULT NULL,
  p_checkout_url TEXT DEFAULT NULL,
  p_sku TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_tags TEXT DEFAULT NULL,
  p_variacoes JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_event_id UUID;
  v_produto_id UUID;
  v_was_created BOOLEAN := false;
  v_estoque_anterior INTEGER;
  v_var JSONB;
  v_var_id UUID;
  v_var_estoque_anterior INTEGER;
  v_var_estoque_novo INTEGER;
BEGIN
  IF p_loja_id IS NULL THEN
    RAISE EXCEPTION 'loja_id e obrigatorio';
  END IF;

  IF p_event_id IS NOT NULL THEN
    INSERT INTO ecommerce_webhook_events (
      loja_id, plataforma, topico, event_id, headers, payload_original, processado
    ) VALUES (
      p_loja_id, p_plataforma, p_topico, p_event_id, p_headers, p_payload_original, false
    )
    ON CONFLICT (loja_id, event_id) WHERE event_id IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_webhook_event_id;

    IF v_webhook_event_id IS NULL THEN
      RETURN jsonb_build_object('success', true, 'dedup', true, 'message', 'Evento ja processado (event_id duplicado)');
    END IF;
  END IF;

  SELECT id, estoque INTO v_produto_id, v_estoque_anterior
  FROM produtos WHERE external_id = p_external_id AND loja_id = p_loja_id;

  IF v_produto_id IS NOT NULL THEN
    UPDATE produtos SET
      nome = COALESCE(p_nome, nome),
      descricao = COALESCE(p_descricao, descricao),
      preco_original = p_preco_original,
      preco_promocional = p_preco_promocional,
      estoque = p_estoque,
      estoque_disponivel = (p_estoque > 0),
      sku = COALESCE(p_sku, sku),
      foto_principal = COALESCE(p_foto_principal, foto_principal),
      checkout_url = COALESCE(p_checkout_url, checkout_url),
      categoria = COALESCE(p_categoria, categoria),
      tags = COALESCE(p_tags, tags),
      plataforma = p_plataforma,
      source_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_produto_id;
  ELSE
    INSERT INTO produtos (
      loja_id, external_id, plataforma, nome, descricao,
      preco_original, preco_promocional, estoque, estoque_disponivel,
      sku, foto_principal, checkout_url, categoria, tags, ativo, source_updated_at
    ) VALUES (
      p_loja_id, p_external_id, p_plataforma, p_nome, p_descricao,
      p_preco_original, p_preco_promocional, p_estoque, (p_estoque > 0),
      p_sku, p_foto_principal, p_checkout_url, p_categoria, p_tags, true, NOW()
    )
    RETURNING id INTO v_produto_id;
    v_was_created := true;
    v_estoque_anterior := 0;
  END IF;

  IF v_estoque_anterior IS DISTINCT FROM p_estoque THEN
    INSERT INTO estoque_movimentacoes (
      loja_id, produto_id, variacao_id, origem, referencia_id,
      quantidade_anterior, quantidade_nova, quantidade_movimentada, source_updated_at
    ) VALUES (
      p_loja_id, v_produto_id, NULL, 'webhook',
      COALESCE(p_event_id, p_external_id),
      COALESCE(v_estoque_anterior, 0), p_estoque,
      p_estoque - COALESCE(v_estoque_anterior, 0), NOW()
    );
  END IF;

  FOR v_var IN SELECT * FROM jsonb_array_elements(p_variacoes)
  LOOP
    v_var_id := NULL;
    v_var_estoque_anterior := NULL;
    v_var_estoque_novo := COALESCE((v_var->>'estoque')::integer, 0);

    SELECT id, estoque INTO v_var_id, v_var_estoque_anterior
    FROM produto_variacoes
    WHERE external_id = (v_var->>'external_id') AND produto_id = v_produto_id;

    IF v_var_id IS NOT NULL THEN
      UPDATE produto_variacoes SET
        nome = COALESCE(v_var->>'nome', nome),
        sku = COALESCE(v_var->>'sku', sku),
        preco = COALESCE((v_var->>'preco')::numeric, preco),
        preco_promocional = (v_var->>'preco_promocional')::numeric,
        estoque = v_var_estoque_novo,
        estoque_disponivel = (v_var_estoque_novo > 0),
        checkout_url = COALESCE(v_var->>'checkout_url', checkout_url),
        atributos = COALESCE(v_var->'atributos', atributos),
        source_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = v_var_id;
    ELSE
      INSERT INTO produto_variacoes (
        produto_id, loja_id, external_id, nome, sku, preco, preco_promocional,
        estoque, estoque_disponivel, checkout_url, atributos, ativo, source_updated_at
      ) VALUES (
        v_produto_id, p_loja_id, v_var->>'external_id', v_var->>'nome', v_var->>'sku',
        COALESCE((v_var->>'preco')::numeric, 0),
        (v_var->>'preco_promocional')::numeric,
        v_var_estoque_novo, (v_var_estoque_novo > 0),
        v_var->>'checkout_url',
        COALESCE(v_var->'atributos', '{}'::jsonb),
        true, NOW()
      )
      RETURNING id INTO v_var_id;
      v_var_estoque_anterior := 0;
    END IF;

    IF v_var_estoque_anterior IS DISTINCT FROM v_var_estoque_novo THEN
      INSERT INTO estoque_movimentacoes (
        loja_id, produto_id, variacao_id, origem, referencia_id,
        quantidade_anterior, quantidade_nova, quantidade_movimentada, source_updated_at
      ) VALUES (
        p_loja_id, v_produto_id, v_var_id, 'webhook',
        COALESCE(p_event_id, v_var->>'external_id'),
        COALESCE(v_var_estoque_anterior, 0), v_var_estoque_novo,
        v_var_estoque_novo - COALESCE(v_var_estoque_anterior, 0), NOW()
      );
    END IF;
  END LOOP;

  IF v_webhook_event_id IS NOT NULL THEN
    UPDATE ecommerce_webhook_events SET processado = true WHERE id = v_webhook_event_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'dedup', false, 'produto_id', v_produto_id,
    'was_created', v_was_created, 'plataforma', p_plataforma,
    'nome', p_nome, 'estoque', p_estoque
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_ecommerce_webhook_process FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_ecommerce_webhook_process TO service_role;


CREATE OR REPLACE FUNCTION public.fn_ecommerce_import_produto(
  p_loja_id UUID,
  p_plataforma TEXT,
  p_external_id TEXT,
  p_nome TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_preco_original NUMERIC DEFAULT 0,
  p_preco_promocional NUMERIC DEFAULT NULL,
  p_estoque INTEGER DEFAULT 0,
  p_foto_principal TEXT DEFAULT NULL,
  p_checkout_url TEXT DEFAULT NULL,
  p_sku TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_tags TEXT DEFAULT NULL,
  p_variacoes JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_produto_id UUID;
  v_was_created BOOLEAN := false;
  v_estoque_anterior INTEGER;
  v_var JSONB;
  v_var_id UUID;
  v_var_estoque_anterior INTEGER;
  v_var_estoque_novo INTEGER;
BEGIN
  IF p_loja_id IS NULL THEN
    RAISE EXCEPTION 'loja_id e obrigatorio';
  END IF;
  IF p_external_id IS NULL THEN
    RAISE EXCEPTION 'external_id e obrigatorio';
  END IF;

  SELECT id, estoque INTO v_produto_id, v_estoque_anterior
  FROM produtos WHERE external_id = p_external_id AND loja_id = p_loja_id;

  IF v_produto_id IS NOT NULL THEN
    UPDATE produtos SET
      nome = COALESCE(p_nome, nome),
      descricao = COALESCE(p_descricao, descricao),
      preco_original = p_preco_original,
      preco_promocional = p_preco_promocional,
      estoque = p_estoque,
      estoque_disponivel = (p_estoque > 0),
      sku = COALESCE(p_sku, sku),
      foto_principal = COALESCE(p_foto_principal, foto_principal),
      checkout_url = COALESCE(p_checkout_url, checkout_url),
      categoria = COALESCE(p_categoria, categoria),
      tags = COALESCE(p_tags, tags),
      plataforma = p_plataforma,
      source_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_produto_id;
  ELSE
    INSERT INTO produtos (
      loja_id, external_id, plataforma, nome, descricao,
      preco_original, preco_promocional, estoque, estoque_disponivel,
      sku, foto_principal, checkout_url, categoria, tags, ativo, source_updated_at
    ) VALUES (
      p_loja_id, p_external_id, p_plataforma, p_nome, p_descricao,
      p_preco_original, p_preco_promocional, p_estoque, (p_estoque > 0),
      p_sku, p_foto_principal, p_checkout_url, p_categoria, p_tags, true, NOW()
    )
    RETURNING id INTO v_produto_id;
    v_was_created := true;
    v_estoque_anterior := 0;
  END IF;

  IF v_estoque_anterior IS DISTINCT FROM p_estoque THEN
    INSERT INTO estoque_movimentacoes (
      loja_id, produto_id, variacao_id, origem, referencia_id,
      quantidade_anterior, quantidade_nova, quantidade_movimentada, source_updated_at
    ) VALUES (
      p_loja_id, v_produto_id, NULL, 'import', p_external_id,
      COALESCE(v_estoque_anterior, 0), p_estoque,
      p_estoque - COALESCE(v_estoque_anterior, 0), NOW()
    );
  END IF;

  FOR v_var IN SELECT * FROM jsonb_array_elements(p_variacoes)
  LOOP
    v_var_id := NULL;
    v_var_estoque_anterior := NULL;
    v_var_estoque_novo := COALESCE((v_var->>'estoque')::integer, 0);

    SELECT id, estoque INTO v_var_id, v_var_estoque_anterior
    FROM produto_variacoes
    WHERE external_id = (v_var->>'external_id') AND produto_id = v_produto_id;

    IF v_var_id IS NOT NULL THEN
      UPDATE produto_variacoes SET
        nome = COALESCE(v_var->>'nome', nome),
        sku = COALESCE(v_var->>'sku', sku),
        preco = COALESCE((v_var->>'preco')::numeric, preco),
        preco_promocional = (v_var->>'preco_promocional')::numeric,
        estoque = v_var_estoque_novo,
        estoque_disponivel = (v_var_estoque_novo > 0),
        checkout_url = COALESCE(v_var->>'checkout_url', checkout_url),
        atributos = COALESCE(v_var->'atributos', atributos),
        source_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = v_var_id;
    ELSE
      INSERT INTO produto_variacoes (
        produto_id, loja_id, external_id, nome, sku, preco, preco_promocional,
        estoque, estoque_disponivel, checkout_url, atributos, ativo, source_updated_at
      ) VALUES (
        v_produto_id, p_loja_id, v_var->>'external_id', v_var->>'nome', v_var->>'sku',
        COALESCE((v_var->>'preco')::numeric, 0),
        (v_var->>'preco_promocional')::numeric,
        v_var_estoque_novo, (v_var_estoque_novo > 0),
        v_var->>'checkout_url',
        COALESCE(v_var->'atributos', '{}'::jsonb),
        true, NOW()
      )
      RETURNING id INTO v_var_id;
      v_var_estoque_anterior := 0;
    END IF;

    IF v_var_estoque_anterior IS DISTINCT FROM v_var_estoque_novo THEN
      INSERT INTO estoque_movimentacoes (
        loja_id, produto_id, variacao_id, origem, referencia_id,
        quantidade_anterior, quantidade_nova, quantidade_movimentada, source_updated_at
      ) VALUES (
        p_loja_id, v_produto_id, v_var_id, 'import',
        v_var->>'external_id',
        COALESCE(v_var_estoque_anterior, 0), v_var_estoque_novo,
        v_var_estoque_novo - COALESCE(v_var_estoque_anterior, 0), NOW()
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 'produto_id', v_produto_id, 'was_created', v_was_created,
    'plataforma', p_plataforma, 'nome', p_nome, 'estoque', p_estoque
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_ecommerce_import_produto FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_ecommerce_import_produto TO service_role;