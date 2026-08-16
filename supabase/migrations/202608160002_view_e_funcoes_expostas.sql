-- =============================================================================
-- Fecha a view do painel e as funções auxiliares expostas ao anônimo
-- =============================================================================
--
-- Achado pelos advisors do Supabase e confirmado com uma chamada real: um
-- visitante anônimo, usando só a chave publicável (que está no JavaScript do
-- site), lia o faturamento da loja:
--
--   GET /rest/v1/admin_dashboard_summary  ->  200
--   [{"total_revenue":...,"total_orders":...,"average_ticket":...}]
--
-- A causa: no Postgres, uma view roda com os privilégios de quem a criou —
-- aqui, `postgres`. A RLS de `orders` simplesmente não é avaliada. A tabela
-- estava protegida; a view em cima dela, não. Foi por isso que passou
-- despercebido: RLS ligada em 33 tabelas dá uma falsa sensação de cobertura.
--
-- `security_invoker = on` faz a view rodar com os privilégios de quem consulta,
-- então a RLS volta a valer. O revoke é defesa em profundidade: mesmo que a
-- propriedade se perca num futuro `create or replace view`, o anônimo não
-- alcança.
-- =============================================================================

alter view public.admin_dashboard_summary set (security_invoker = on);
revoke all on public.admin_dashboard_summary from anon;

comment on view public.admin_dashboard_summary is
  'Resumo do painel. security_invoker = on: a RLS de orders vale para quem consulta. Sem isso a view rodava como postgres e vazava faturamento para o anônimo.';

-- -----------------------------------------------------------------------------
-- Funções auxiliares alcançáveis por /rest/v1/rpc/
-- -----------------------------------------------------------------------------
--
-- is_admin() e admin_has_permission() devolvem false para quem não está
-- autenticado, então não vazam nada — mas também não têm motivo para ficarem
-- expostas em /rest/v1/rpc/.
--
-- ATENÇÃO ao formato do revoke: no Postgres toda função nasce com EXECUTE
-- concedido a PUBLIC, e `anon` herda dessa concessão. `revoke ... from anon`
-- sozinho não faz nada — a função continua chamável. É preciso revogar de
-- PUBLIC e devolver o EXECUTE só a quem precisa.
--
-- E `authenticated` precisa: as políticas "admins manage ..." são
-- `to authenticated` e chamam essas funções na própria expressão da policy.
-- Sem EXECUTE, o painel inteiro quebraria com permission denied.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.admin_has_permission(text) from public, anon;
grant execute on function public.admin_has_permission(text) to authenticated;

-- rls_auto_enable() é gatilho de evento; chamada direta não faz sentido e
-- ninguém precisa dela pela API.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- search_path fixo no gatilho de updated_at
-- -----------------------------------------------------------------------------
-- Sem `set search_path`, a função resolve nomes pelo search_path de quem
-- dispara o gatilho. As outras funções do schema já fixavam; esta ficou de
-- fora.
alter function public.set_updated_at() set search_path = public, pg_temp;
