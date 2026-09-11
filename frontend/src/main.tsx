import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './style.css';

const api = axios.create({ baseURL: 'http://localhost:3000' });

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minimumStock: number;
  costPrice?: number;
};

type Movement = {
  id: number;
  type: 'IN' | 'OUT';
  quantity: number;
  createdAt: string;
  note?: string;
  product?: Product;
};

type Tab = 'dashboard' | 'products' | 'new' | 'movement' | 'history';

type IconName =
  | 'grid'
  | 'box'
  | 'plus'
  | 'activity'
  | 'clock'
  | 'arrowUp'
  | 'arrowDown'
  | 'trend'
  | 'search'
  | 'spark'
  | 'database'
  | 'check'
  | 'alert'
  | 'menu';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.1 7.5-4.1M12 12v9"/></>,
    plus: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
    activity: <><path d="M3 12h4l2.2-6 4.1 12 2.2-6H21"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrowUp: <><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></>,
    arrowDown: <><path d="M12 5v14"/><path d="m18 13-6 6-6-6"/></>,
    trend: <><path d="m3 17 6-6 4 4 7-8"/><path d="M17 7h3v3"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    spark: <><path d="m12 3-1.2 5.1L6 9.5l4.8 1.4L12 16l1.2-5.1L18 9.5l-4.8-1.4L12 3Z"/><path d="m19 15-.6 2.4L16 18l2.4.6L19 21l.6-2.4L22 18l-2.4-.6L19 15Z"/></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16 9"/></>,
    alert: <><path d="M12 3 2.8 19a1.2 1.2 0 0 0 1 1.8h16.4a1.2 1.2 0 0 0 1-1.8L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const navItems: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'products', label: 'Produtos', icon: 'box' },
  { id: 'new', label: 'Novo produto', icon: 'plus' },
  { id: 'movement', label: 'Movimentação', icon: 'activity' },
  { id: 'history', label: 'Histórico', icon: 'clock' },
];

const emptyProduct = { name: '', sku: '', category: '', quantity: 0, minimumStock: 0 };
const emptyMovement = { productId: '', type: 'IN' as 'IN' | 'OUT', quantity: 1, note: '' };

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [moves, setMoves] = useState<Movement[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyProduct });
  const [movement, setMovement] = useState({ ...emptyMovement });
  const [summary, setSummary] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const load = async () => {
    try {
      const [p, m, s] = await Promise.all([
        api.get('/products', { params: { search } }),
        api.get('/stock-movements'),
        api.get('/dashboard/summary'),
      ]);
      setProducts(p.data);
      setMoves(m.data);
      setSummary(s.data);
    } catch {
      setNotice({ type: 'error', text: 'Não foi possível atualizar os dados. Verifique se o backend está ativo.' });
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const lowStockProducts = useMemo(() => products.filter((p) => p.quantity <= p.minimumStock), [products]);

  const openTab = (next: Tab) => {
    setTab(next);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/products', form);
      setForm({ ...emptyProduct });
      await load();
      setNotice({ type: 'ok', text: 'Produto cadastrado com sucesso.' });
      openTab('products');
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.response?.data?.message || 'Não foi possível cadastrar o produto.' });
    } finally {
      setBusy(false);
    }
  };

  const move = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/stock-movements', movement);
      setMovement({ ...emptyMovement });
      await load();
      setNotice({ type: 'ok', text: movement.type === 'IN' ? 'Entrada registrada com sucesso.' : 'Saída registrada com sucesso.' });
      openTab('history');
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.response?.data?.message || 'Não foi possível registrar a movimentação.' });
    } finally {
      setBusy(false);
    }
  };

  const pageTitle = {
    dashboard: 'Visão geral',
    products: 'Catálogo de produtos',
    new: 'Adicionar novo produto',
    movement: 'Movimentar estoque',
    history: 'Linha do tempo',
  }[tab];

  const pageSubtitle = {
    dashboard: 'Uma visão em tempo real do que está acontecendo no seu estoque.',
    products: 'Encontre, acompanhe e monitore seus itens com rapidez.',
    new: 'Cadastre itens e defina os limites que merecem atenção.',
    movement: 'Registre entradas e saídas sem perder o histórico.',
    history: 'Veja as movimentações mais recentes em um único lugar.',
  }[tab];

  return (
    <div className="shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark"><Icon name="spark" size={22} /></div>
          <div>
            <div className="brand-name">StockFlow</div>
            <div className="brand-tag">INVENTORY OS</div>
          </div>
        </div>

        <div className="nav-caption">NAVEGAÇÃO</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => openTab(item.id)}>
              <span className="nav-icon"><Icon name={item.icon} size={18} /></span>
              <span>{item.label}</span>
              {item.id === 'products' && lowStockProducts.length > 0 ? <span className="nav-badge">{lowStockProducts.length}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="system-card">
          <div className="system-icon"><Icon name="database" size={17} /></div>
          <div>
            <div className="system-title">Sistema online</div>
            <div className="system-meta"><span className="pulse" /> API + PostgreSQL</div>
          </div>
        </div>

        <div className="side-footer">STOCKFLOW <span>v1.0</span></div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav((v) => !v)} aria-label="Abrir menu"><Icon name="menu" size={20} /></button>
          <div className="topbar-context">
            <span className="eyebrow">CONTROL CENTER</span>
            <span className="slash">/</span>
            <span>{pageTitle}</span>
          </div>
          <div className="topbar-right">
            <div className="status-pill"><span className="pulse" /> Operacional</div>
            <button className="top-action" onClick={() => openTab('new')}><Icon name="plus" size={16} /> Novo item</button>
          </div>
        </header>

        <main className="main-content">
          {notice && (
            <div className={`toast ${notice.type}`}>
              <Icon name={notice.type === 'ok' ? 'check' : 'alert'} size={17} />
              <span>{notice.text}</span>
            </div>
          )}

          <section className="page-heading">
            <div>
              <div className="heading-kicker"><span className="kicker-dot" /> STOCK INTELLIGENCE</div>
              <h1>{pageTitle}</h1>
              <p>{pageSubtitle}</p>
            </div>
            <div className="heading-date">Atualização automática <span>•</span> agora</div>
          </section>

          {tab === 'dashboard' && (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <div className="hero-chip"><Icon name="spark" size={14} /> operação em foco</div>
                  <h2>Seu estoque, <span>mais inteligente.</span></h2>
                  <p>Monitore níveis, movimentações e pontos críticos em uma interface pensada para decisão rápida.</p>
                  <div className="hero-actions">
                    <button className="btn-primary" onClick={() => openTab('new')}><Icon name="plus" size={17} /> Cadastrar produto</button>
                    <button className="btn-ghost" onClick={() => openTab('movement')}><Icon name="activity" size={17} /> Registrar movimento</button>
                  </div>
                </div>
                <div className="hero-orbit">
                  <div className="orbit orbit-a" />
                  <div className="orbit orbit-b" />
                  <div className="orbit-core"><Icon name="box" size={30} /></div>
                  <div className="orbit-chip chip-top">LIVE</div>
                  <div className="orbit-chip chip-bottom">SYNCED</div>
                </div>
              </section>

              <section className="stat-grid">
                <StatCard label="Produtos ativos" value={summary.products || 0} detail="itens cadastrados" icon="box" accent="cyan" />
                <StatCard label="Itens em estoque" value={summary.totalItems || 0} detail="saldo disponível" icon="database" accent="blue" />
                <StatCard label="Estoque crítico" value={summary.lowStock || 0} detail="abaixo do mínimo" icon="alert" accent="rose" />
                <StatCard label="Movimentações" value={summary.movements || 0} detail="eventos registrados" icon="trend" accent="violet" />
              </section>

              <section className="dashboard-grid">
                <div className="panel panel-large">
                  <PanelHeader title="Atividade recente" subtitle="Últimas movimentações registradas" action={<button className="link-action" onClick={() => openTab('history')}>Ver histórico <span>→</span></button>} />
                  <MovementTable data={summary.recent || []} compact />
                </div>

                <div className="panel">
                  <PanelHeader title="Atenção necessária" subtitle="Itens próximos do limite" />
                  {lowStockProducts.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><Icon name="check" size={20} /></div><strong>Tudo sob controle</strong><span>Nenhum produto abaixo do estoque mínimo.</span></div>
                  ) : (
                    <div className="critical-list">
                      {lowStockProducts.slice(0, 5).map((p) => (
                        <div className="critical-row" key={p.id}>
                          <div className="critical-product"><span className="product-avatar">{p.name.slice(0, 1).toUpperCase()}</span><div><strong>{p.name}</strong><span>{p.sku}</span></div></div>
                          <div className="critical-qty"><strong>{p.quantity}</strong><span>mín. {p.minimumStock}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'products' && (
            <section className="panel panel-table">
              <div className="table-toolbar">
                <div className="toolbar-copy"><span className="toolbar-kicker">CATÁLOGO</span><strong>{products.length} produto(s)</strong></div>
                <div className="search-box"><Icon name="search" size={17} /><input placeholder="Buscar por nome ou SKU" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              </div>
              <ProductTable data={products} />
            </section>
          )}

          {tab === 'new' && (
            <section className="form-layout">
              <div className="panel form-panel">
                <PanelHeader title="Dados do produto" subtitle="Preencha os campos essenciais para começar." />
                <form onSubmit={save} className="form-grid">
                  <Field label="Nome do produto" placeholder="Ex.: Filtro de óleo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <Field label="SKU" placeholder="Ex.: FILTRO-001" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
                  <Field label="Categoria" placeholder="Ex.: Filtros" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
                  <Field label="Quantidade inicial" type="number" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} />
                  <Field label="Estoque mínimo" type="number" value={form.minimumStock} onChange={(v) => setForm({ ...form, minimumStock: v })} />
                  <div className="form-full action-row"><button className="btn-primary" disabled={busy}>{busy ? 'Salvando...' : 'Cadastrar produto'} <span>→</span></button></div>
                </form>
              </div>
              <div className="panel guide-panel">
                <div className="guide-icon"><Icon name="spark" size={21} /></div>
                <span className="toolbar-kicker">BOA PRÁTICA</span>
                <h3>Defina um mínimo que faça sentido.</h3>
                <p>Esse valor alimenta o monitoramento de estoque crítico e ajuda a identificar reposições antes que o saldo fique zerado.</p>
                <div className="guide-line"><span /> Estoque saudável <strong>acima do mínimo</strong></div>
                <div className="guide-line"><span className="danger-dot" /> Atenção <strong>no mínimo ou abaixo</strong></div>
              </div>
            </section>
          )}

          {tab === 'movement' && (
            <section className="form-layout">
              <div className="panel form-panel">
                <PanelHeader title="Nova movimentação" subtitle="Atualize o saldo e mantenha o histórico consistente." />
                <form onSubmit={move} className="form-grid">
                  <label className="field form-full">Produto
                    <select required value={movement.productId} onChange={(e) => setMovement({ ...movement, productId: e.target.value })}>
                      <option value="">Selecione um produto</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} — saldo {p.quantity}</option>)}
                    </select>
                  </label>
                  <label className="field">Tipo
                    <select value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value as 'IN' | 'OUT' })}>
                      <option value="IN">Entrada</option>
                      <option value="OUT">Saída</option>
                    </select>
                  </label>
                  <Field label="Quantidade" type="number" min={1} value={movement.quantity} onChange={(v) => setMovement({ ...movement, quantity: v })} />
                  <Field label="Observação" placeholder="Ex.: Compra com fornecedor" value={movement.note} required={false} onChange={(v) => setMovement({ ...movement, note: v })} />
                  <div className="movement-preview form-full">
                    <div className={`movement-icon ${movement.type === 'IN' ? 'in' : 'out'}`}><Icon name={movement.type === 'IN' ? 'arrowUp' : 'arrowDown'} size={18} /></div>
                    <div><span>Tipo selecionado</span><strong>{movement.type === 'IN' ? 'Entrada de estoque' : 'Saída de estoque'}</strong></div>
                    <em>{movement.quantity} un.</em>
                  </div>
                  <div className="form-full action-row"><button className="btn-primary" disabled={busy}>{busy ? 'Registrando...' : 'Registrar movimentação'} <span>→</span></button></div>
                </form>
              </div>
              <div className="panel guide-panel">
                <div className="guide-icon"><Icon name="activity" size={21} /></div>
                <span className="toolbar-kicker">FLUXO</span>
                <h3>Entrada aumenta. Saída reduz.</h3>
                <p>O StockFlow atualiza o saldo do produto e registra cada evento com data, tipo, quantidade e observação.</p>
                <div className="flow-card"><span>Saldo atual</span><strong>{summary.totalItems || 0}</strong></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-card muted"><span>Último evento</span><strong>{moves[0] ? (moves[0].type === 'IN' ? 'Entrada' : 'Saída') : 'Nenhum'}</strong></div>
              </div>
            </section>
          )}

          {tab === 'history' && (
            <section className="panel panel-table">
              <div className="table-toolbar"><div className="toolbar-copy"><span className="toolbar-kicker">AUDITORIA</span><strong>{moves.length} movimentação(ões)</strong></div><div className="history-live"><span className="pulse" /> histórico sincronizado</div></div>
              <MovementTable data={moves} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail, icon, accent }: { label: string; value: number; detail: string; icon: IconName; accent: string }) {
  return (
    <article className={`stat-card accent-${accent}`}>
      <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={18} /></span></div>
      <strong>{value}</strong>
      <div className="stat-bottom"><span>{detail}</span><Icon name="trend" size={14} /></div>
    </article>
  );
}

function PanelHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="panel-header"><div><h3>{title}</h3><p>{subtitle}</p></div>{action}</div>;
}

function Field({ label, value, onChange, type = 'text', placeholder, min, required = true }: { label: string; value: string | number; onChange: (value: any) => void; type?: string; placeholder?: string; min?: number; required?: boolean }) {
  return <label className="field">{label}<input required={required} min={min} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} /></label>;
}

function ProductTable({ data }: { data: Product[] }) {
  if (!data.length) {
    return <div className="empty-table"><div className="empty-icon"><Icon name="box" size={22} /></div><strong>Nenhum produto encontrado</strong><span>Tente outro termo de busca ou cadastre um novo produto.</span></div>;
  }
  return (
    <div className="table-wrap"><table><thead><tr><th>Produto</th><th>SKU</th><th>Categoria</th><th>Saldo</th><th>Mínimo</th><th>Status</th></tr></thead>
      <tbody>{data.map((p) => <tr key={p.id}><td><div className="product-cell"><span className="product-avatar">{p.name.slice(0, 1).toUpperCase()}</span><div><strong>{p.name}</strong><span>{p.category}</span></div></div></td><td><code>{p.sku}</code></td><td>{p.category}</td><td><strong>{p.quantity}</strong> un.</td><td>{p.minimumStock}</td><td><span className={`status-tag ${p.quantity <= p.minimumStock ? 'danger' : 'ok'}`}><span />{p.quantity <= p.minimumStock ? 'Estoque baixo' : 'Normal'}</span></td></tr>)}</tbody>
    </table></div>
  );
}

function MovementTable({ data, compact = false }: { data: Movement[]; compact?: boolean }) {
  const source = compact ? data.slice(0, 6) : data;
  if (!source.length) return <div className="empty-table"><div className="empty-icon"><Icon name="clock" size={22} /></div><strong>Nenhuma movimentação ainda</strong><span>Registre uma entrada ou saída para começar a construir seu histórico.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>Momento</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Observação</th></tr></thead><tbody>{source.map((m) => <tr key={m.id}><td>{new Date(m.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><strong>{m.product?.name || '—'}</strong></td><td><span className={`movement-tag ${m.type === 'IN' ? 'in' : 'out'}`}><Icon name={m.type === 'IN' ? 'arrowUp' : 'arrowDown'} size={12} />{m.type === 'IN' ? 'Entrada' : 'Saída'}</span></td><td><strong>{m.quantity}</strong> un.</td><td>{m.note || '—'}</td></tr>)}</tbody></table></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
