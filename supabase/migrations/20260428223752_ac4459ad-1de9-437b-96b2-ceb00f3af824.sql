CREATE OR REPLACE FUNCTION public.recompor_estoque(
  p_produto_id UUID,
  p_quantidade INTEGER DEFAULT 1,
  p_variacao_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estoque_anterior INTEGER;
  v_estoque_novo INTEGER;
  v_loja_id UUID;
BEGIN
  SELECT loja_id INTO v_loja_id FROM produtos WHERE id = p_produto_id;
  IF v_loja_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado');
  END IF;

  IF p_variacao_id IS NOT NULL THEN
    SELECT estoque INTO v_estoque_anterior
    FROM produto_variacoes
    WHERE id = p_variacao_id AND produto_id = p_produto_id
    FOR UPDATE;

    IF v_estoque_anterior IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Variação não encontrada');
    END IF;

    v_estoque_novo := v_estoque_anterior + p_quantidade;

    UPDATE produto_variacoes
    SET estoque = v_estoque_novo,
        estoque_disponivel = v_estoque_novo > 0,
        updated_at = NOW()
    WHERE id = p_variacao_id;
  ELSE
    SELECT estoque INTO v_estoque_anterior
    FROM produtos
    WHERE id = p_produto_id
    FOR UPDATE;

    IF v_estoque_anterior IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado para estoque');
    END IF;

    v_estoque_novo := v_estoque_anterior + p_quantidade;

    UPDATE produtos
    SET estoque = v_estoque_novo,
        estoque_disponivel = v_estoque_novo > 0,
        updated_at = NOW()
    WHERE id = p_produto_id;
  END IF;

  INSERT INTO estoque_movimentacoes (
    loja_id, produto_id, variacao_id, origem, referencia_id,
    quantidade_anterior, quantidade_nova, quantidade_movimentada,
    source_updated_at
  ) VALUES (
    v_loja_id, p_produto_id, p_variacao_id, 'ajuste', p_produto_id::text,
    v_estoque_anterior, v_estoque_novo, p_quantidade,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'produto_id', p_produto_id,
    'variacao_id', p_variacao_id,
    'estoque_anterior', v_estoque_anterior,
    'estoque_novo', v_estoque_novo,
    'quantidade_recomposta', p_quantidade
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_ecommerce_order_process(
  p_loja_id UUID,
  p_plataforma TEXT,
  p_event_id TEXT,
  p_topico TEXT,
  p_headers JSONB DEFAULT NULL,
  p_payload_original JSONB DEFAULT NULL,
  p_external_id TEXT DEFAULT NULL,
  p_numero_pedido TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pendente',
  p_canal TEXT DEFAULT 'ecommerce',
  p_customer_nome TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_telefone TEXT DEFAULT NULL,
  p_subtotal NUMERIC DEFAULT 0,
  p_desconto NUMERIC DEFAULT 0,
  p_frete NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0,
  p_moeda TEXT DEFAULT 'BRL',
  p_notas TEXT DEFAULT NULL,
  p_source_created_at TIMESTAMPTZ DEFAULT NULL,
  p_source_updated_at TIMESTAMPTZ DEFAULT NULL,
  p_itens JSONB DEFAULT '[]'::jsonb,
  p_acao_estoque TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_event_id UUID;
  v_pedido_id UUID;
  v_was_created BOOLEAN := false;
  v_item JSONB;
  v_produto_id UUID;
  v_variacao_id UUID;
  v_stock_result JSONB;
  v_itens_processados INTEGER := 0;
  v_itens_estoque_ok INTEGER := 0;
BEGIN
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
      RETURN jsonb_build_object(
        'success', true,
        'duplicado', true,
        'message', 'Evento já processado (event_id duplicado)'
      );
    END IF;
  END IF;

  IF p_external_id IS NOT NULL THEN
    SELECT id INTO v_pedido_id
    FROM pedidos
    WHERE external_id = p_external_id AND loja_id = p_loja_id;
  END IF;

  IF v_pedido_id IS NOT NULL THEN
    UPDATE pedidos SET
      plataforma = COALESCE(p_plataforma, plataforma),
      canal = COALESCE(p_canal, canal),
      status = COALESCE(p_status, status),
      customer_nome = COALESCE(p_customer_nome, customer_nome),
      customer_email = COALESCE(p_customer_email, customer_email),
      customer_telefone = COALESCE(p_customer_telefone, customer_telefone),
      subtotal = p_subtotal,
      desconto = p_desconto,
      frete = p_frete,
      total = p_total,
      moeda = COALESCE(p_moeda, moeda),
      notas = COALESCE(p_notas, notas),
      source_updated_at = COALESCE(p_source_updated_at, source_updated_at),
      payload_original = COALESCE(p_payload_original, payload_original),
      updated_at = NOW()
    WHERE id = v_pedido_id;
  ELSE
    INSERT INTO pedidos (
      loja_id, external_id, plataforma, canal, status,
      customer_nome, customer_email, customer_telefone,
      subtotal, desconto, frete, total, moeda, notas,
      source_updated_at, payload_original
    ) VALUES (
      p_loja_id, p_external_id, p_plataforma, p_canal, p_status,
      p_customer_nome, p_customer_email, p_customer_telefone,
      p_subtotal, p_desconto, p_frete, p_total, p_moeda, p_notas,
      p_source_updated_at, p_payload_original
    )
    RETURNING id INTO v_pedido_id;

    v_was_created := true;
  END IF;

  DELETE FROM pedido_itens WHERE pedido_id = v_pedido_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := NULL;
    v_variacao_id := NULL;

    IF v_item->>'produto_external_id' IS NOT NULL THEN
      SELECT id INTO v_produto_id
      FROM produtos
      WHERE external_id = (v_item->>'produto_external_id') AND loja_id = p_loja_id;
    END IF;

    IF v_item->>'variacao_external_id' IS NOT NULL AND v_produto_id IS NOT NULL THEN
      SELECT id INTO v_variacao_id
      FROM produto_variacoes
      WHERE external_id = (v_item->>'variacao_external_id') AND produto_id = v_produto_id;
    ELSIF v_item->>'variacao_external_id' IS NOT NULL THEN
      SELECT pv.id, pv.produto_id INTO v_variacao_id, v_produto_id
      FROM produto_variacoes pv
      JOIN produtos p ON p.id = pv.produto_id
      WHERE pv.external_id = (v_item->>'variacao_external_id') AND p.loja_id = p_loja_id
      LIMIT 1;
    END IF;

    INSERT INTO pedido_itens (
      pedido_id, produto_id, variacao_id,
      produto_external_id, variacao_external_id,
      sku, nome, quantidade, preco_unitario, subtotal
    ) VALUES (
      v_pedido_id, v_produto_id, v_variacao_id,
      v_item->>'produto_external_id',
      v_item->>'variacao_external_id',
      v_item->>'sku',
      COALESCE(v_item->>'nome', 'Item sem nome'),
      COALESCE((v_item->>'quantidade')::integer, 1),
      COALESCE((v_item->>'preco_unitario')::numeric, 0),
      COALESCE((v_item->>'subtotal')::numeric, 0)
    );

    v_itens_processados := v_itens_processados + 1;

    IF p_acao_estoque IS NOT NULL AND v_produto_id IS NOT NULL THEN
      IF p_acao_estoque = 'baixar' THEN
        SELECT decrementar_estoque(
          v_produto_id,
          COALESCE((v_item->>'quantidade')::integer, 1),
          v_variacao_id
        ) INTO v_stock_result;
      ELSIF p_acao_estoque = 'recompor' THEN
        SELECT recompor_estoque(
          v_produto_id,
          COALESCE((v_item->>'quantidade')::integer, 1),
          v_variacao_id
        ) INTO v_stock_result;
      END IF;

      IF (v_stock_result->>'success')::boolean THEN
        v_itens_estoque_ok := v_itens_estoque_ok + 1;
      END IF;
    END IF;
  END LOOP;

  IF v_webhook_event_id IS NOT NULL THEN
    UPDATE ecommerce_webhook_events
    SET processado = true
    WHERE id = v_webhook_event_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'duplicado', false,
    'pedido_id', v_pedido_id,
    'was_created', v_was_created,
    'status', p_status,
    'plataforma', p_plataforma,
    'itens_processados', v_itens_processados,
    'itens_estoque_ok', v_itens_estoque_ok,
    'acao_estoque', p_acao_estoque
  );
END;
$$;

REVOKE ALL ON FUNCTION public.recompor_estoque(UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompor_estoque(UUID, INTEGER, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.fn_ecommerce_order_process(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_ecommerce_order_process(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB, TEXT) TO service_role;