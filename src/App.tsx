import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  FinancialProfile,
  Transaction,
  currency,
  getHomeEquity,
  getMonthlyMargin,
  getNetWorth,
  initialState,
  projectYearsToGoal,
} from "./model";
import {
  clearState,
  downloadBackup,
  loadState,
  parseBackup,
  saveState,
} from "./storage";

type Tab = "dashboard" | "transactions" | "assets" | "plan";

const navItems: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "dashboard", label: "Visão geral", icon: "⌂" },
  { id: "transactions", label: "Lançamentos", icon: "↕" },
  { id: "assets", label: "Patrimônio", icon: "◇" },
  { id: "plan", label: "Plano do milhão", icon: "◎" },
];

function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type="number"
          min="0"
          step="0.01"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
        />
        {suffix && <small>{suffix}</small>}
      </div>
      {hint && <em>{hint}</em>}
    </label>
  );
}

function Setup({
  onSave,
}: {
  onSave: (profile: FinancialProfile) => void;
}) {
  const [profile, setProfile] = useState<FinancialProfile>({
    ...initialState.profile,
    millionGoal: 1_000_000,
    annualRealReturn: 4,
  });

  const update = (key: keyof FinancialProfile, value: number) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="setup-shell">
      <section className="setup-card">
        <div className="brand brand-large">
          <div className="brand-mark">FT</div>
          <div>
            <strong>Financial Tracker</strong>
            <span>Seu patrimônio, com direção.</span>
          </div>
        </div>

        <div className="setup-heading">
          <p className="eyebrow">CONFIGURAÇÃO INICIAL</p>
          <h1>Comece pelo seu ponto de partida.</h1>
          <p>
            Os dados abaixo ficam somente neste navegador. Nenhum valor financeiro
            é salvo no repositório público.
          </p>
        </div>

        <div className="form-grid">
          <NumberField
            label="Renda líquida mensal"
            value={profile.income}
            onChange={(value) => update("income", value)}
          />
          <NumberField
            label="Gastos fixos mensais"
            value={profile.fixedExpenses}
            onChange={(value) => update("fixedExpenses", value)}
          />
          <NumberField
            label="Ativos financeiros"
            value={profile.financialAssets}
            onChange={(value) => update("financialAssets", value)}
            hint="Conta, reserva e investimentos."
          />
          <NumberField
            label="Meta da reserva"
            value={profile.emergencyFundTarget}
            onChange={(value) => update("emergencyFundTarget", value)}
          />
          <NumberField
            label="Valor atual do imóvel"
            value={profile.apartmentValue}
            onChange={(value) => update("apartmentValue", value)}
          />
          <NumberField
            label="Saldo do financiamento"
            value={profile.mortgageBalance}
            onChange={(value) => update("mortgageBalance", value)}
          />
          <NumberField
            label="Prestação do financiamento"
            value={profile.mortgagePayment}
            onChange={(value) => update("mortgagePayment", value)}
          />
          <NumberField
            label="Parcelas restantes"
            value={profile.mortgageRemainingMonths}
            onChange={(value) => update("mortgageRemainingMonths", value)}
            suffix="meses"
          />
          <NumberField
            label="Taxa do financiamento"
            value={profile.mortgageAnnualRate}
            onChange={(value) => update("mortgageAnnualRate", value)}
            suffix="% a.a."
          />
          <NumberField
            label="Valor do veículo"
            value={profile.vehicleValue}
            onChange={(value) => update("vehicleValue", value)}
          />
          <NumberField
            label="Outros ativos"
            value={profile.otherAssets}
            onChange={(value) => update("otherAssets", value)}
          />
          <NumberField
            label="Outras dívidas"
            value={profile.otherDebt}
            onChange={(value) => update("otherDebt", value)}
          />
        </div>

        <button className="primary-button setup-button" onClick={() => onSave(profile)}>
          Criar meu dashboard
        </button>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <article className={`metric-card ${accent ? "metric-accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Dashboard({
  state,
}: {
  state: AppState;
}) {
  const { profile, transactions } = state;
  const netWorth = getNetWorth(profile);
  const homeEquity = getHomeEquity(profile);
  const margin = getMonthlyMargin(profile);
  const goal = Math.max(profile.millionGoal, 1);
  const progress = Math.min(Math.max((netWorth / goal) * 100, 0), 100);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthly = transactions.filter((item) => item.date.startsWith(currentMonth));
  const extraIncome = monthly
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const extraExpenses = monthly
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthBalance = margin + extraIncome - extraExpenses;

  const projection = projectYearsToGoal(
    netWorth,
    profile.millionGoal,
    profile.plannedMonthlyInvestment,
    profile.annualRealReturn,
  );

  const fundProgress =
    profile.emergencyFundTarget > 0
      ? Math.min((profile.financialAssets / profile.emergencyFundTarget) * 100, 100)
      : 0;

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">PATRIMÔNIO LÍQUIDO</p>
          <h1>{currency.format(netWorth)}</h1>
          <p>
            Você percorreu <strong>{progress.toFixed(1)}%</strong> da meta de{" "}
            {currency.format(profile.millionGoal)}.
          </p>
        </div>
        <div className="goal-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>{progress.toFixed(0)}%</strong>
            <span>da meta</span>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard
          label="Patrimônio no imóvel"
          value={currency.format(homeEquity)}
          detail={`Imóvel ${currency.format(profile.apartmentValue)} · dívida ${currency.format(profile.mortgageBalance)}`}
        />
        <MetricCard
          label="Ativos financeiros"
          value={currency.format(profile.financialAssets)}
          detail={profile.emergencyFundTarget > 0 ? `${fundProgress.toFixed(0)}% da reserva planejada` : "Defina uma meta de reserva"}
        />
        <MetricCard
          label="Margem mensal base"
          value={currency.format(margin)}
          detail="Renda menos gastos fixos"
          accent={margin > 0}
        />
        <MetricCard
          label="Saldo estimado do mês"
          value={currency.format(monthBalance)}
          detail={`Extras: +${currency.format(extraIncome)} / -${currency.format(extraExpenses)}`}
          accent={monthBalance > 0}
        />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PRÓXIMOS MARCOS</p>
              <h2>Rota do primeiro milhão</h2>
            </div>
          </div>
          <div className="milestones">
            {[300_000, 350_000, 500_000, 750_000, profile.millionGoal].map((milestone) => {
              const done = netWorth >= milestone;
              return (
                <div className={`milestone ${done ? "done" : ""}`} key={milestone}>
                  <span>{done ? "✓" : ""}</span>
                  <div>
                    <strong>{currency.format(milestone)}</strong>
                    <small>
                      {done
                        ? "Marco alcançado"
                        : `Faltam ${currency.format(Math.max(milestone - netWorth, 0))}`}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PROJEÇÃO</p>
              <h2>Ritmo atual planejado</h2>
            </div>
          </div>
          <div className="projection-number">
            <strong>
              {projection === null
                ? "—"
                : projection === 0
                  ? "Meta alcançada"
                  : `${projection.toFixed(1)} anos`}
            </strong>
            <span>
              com {currency.format(profile.plannedMonthlyInvestment)}/mês e{" "}
              {profile.annualRealReturn.toFixed(1)}% a.a. real
            </span>
          </div>
          <div className="notice">
            Simulação matemática, não previsão de retorno. Ajuste as premissas em
            “Plano do milhão”.
          </div>
        </article>
      </section>
    </div>
  );
}

function Transactions({
  transactions,
  onChange,
}: {
  transactions: Transaction[];
  onChange: (transactions: Transaction[]) => void;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Apartamento");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      description: description.trim(),
      category,
      date,
    };

    onChange([transaction, ...transactions]);
    setAmount(0);
    setDescription("");
  };

  return (
    <div className="page-stack">
      <section className="page-title">
        <p className="eyebrow">LANÇAMENTOS EXTRAS</p>
        <h1>Onde a margem mensal está indo?</h1>
        <p>
          Use esta área para compras do apartamento, gastos não planejados,
          receitas extras e outros valores fora dos gastos fixos.
        </p>
      </section>

      <section className="two-column transaction-layout">
        <form className="panel transaction-form" onSubmit={submit}>
          <h2>Novo lançamento</h2>

          <div className="segmented">
            <button
              type="button"
              className={type === "expense" ? "active" : ""}
              onClick={() => setType("expense")}
            >
              Despesa
            </button>
            <button
              type="button"
              className={type === "income" ? "active" : ""}
              onClick={() => setType("income")}
            >
              Receita
            </button>
          </div>

          <label className="field">
            <span>Descrição</span>
            <input
              type="text"
              value={description}
              placeholder="Ex.: Cortina da sala"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <NumberField label="Valor" value={amount} onChange={setAmount} />

          <label className="field">
            <span>Categoria</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>Apartamento</option>
              <option>Alimentação</option>
              <option>Transporte</option>
              <option>Lazer</option>
              <option>Saúde</option>
              <option>Renda extra</option>
              <option>Outros</option>
            </select>
          </label>

          <label className="field">
            <span>Data</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>

          <button className="primary-button" type="submit">
            Adicionar lançamento
          </button>
        </form>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">HISTÓRICO</p>
              <h2>Lançamentos recentes</h2>
            </div>
          </div>

          <div className="transaction-list">
            {transactions.length === 0 && (
              <div className="empty-state">
                <strong>Nenhum lançamento ainda.</strong>
                <span>Seu histórico começará aqui.</span>
              </div>
            )}

            {transactions.map((item) => (
              <div className="transaction-row" key={item.id}>
                <div className={`transaction-icon ${item.type}`}>
                  {item.type === "income" ? "+" : "−"}
                </div>
                <div className="transaction-copy">
                  <strong>{item.description}</strong>
                  <span>
                    {item.category} · {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <strong className={item.type}>
                  {item.type === "income" ? "+" : "−"}
                  {currency.format(item.amount)}
                </strong>
                <button
                  className="icon-button danger"
                  title="Excluir lançamento"
                  onClick={() => onChange(transactions.filter((current) => current.id !== item.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function Assets({
  profile,
  onChange,
}: {
  profile: FinancialProfile;
  onChange: (profile: FinancialProfile) => void;
}) {
  const update = (key: keyof FinancialProfile, value: number) =>
    onChange({ ...profile, [key]: value });

  const homeEquity = getHomeEquity(profile);
  const netWorth = getNetWorth(profile);

  return (
    <div className="page-stack">
      <section className="page-title">
        <p className="eyebrow">PATRIMÔNIO</p>
        <h1>Atualize sua fotografia financeira.</h1>
        <p>Revise estes valores periodicamente para acompanhar a evolução real.</p>
      </section>

      <section className="metric-grid compact">
        <MetricCard label="Patrimônio líquido" value={currency.format(netWorth)} detail="Ativos menos dívidas" accent />
        <MetricCard label="Equity no imóvel" value={currency.format(homeEquity)} detail="Valor do imóvel menos financiamento" />
        <MetricCard label="Dívida imobiliária" value={currency.format(profile.mortgageBalance)} detail={`${profile.mortgageRemainingMonths} parcelas restantes`} />
        <MetricCard label="Ativos financeiros" value={currency.format(profile.financialAssets)} detail="Liquidez e investimentos" />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">BALANÇO</p>
            <h2>Ativos e dívidas</h2>
          </div>
        </div>

        <div className="form-grid">
          <NumberField label="Ativos financeiros" value={profile.financialAssets} onChange={(value) => update("financialAssets", value)} />
          <NumberField label="Valor atual do imóvel" value={profile.apartmentValue} onChange={(value) => update("apartmentValue", value)} />
          <NumberField label="Saldo do financiamento" value={profile.mortgageBalance} onChange={(value) => update("mortgageBalance", value)} />
          <NumberField label="Valor do veículo" value={profile.vehicleValue} onChange={(value) => update("vehicleValue", value)} />
          <NumberField label="Outros ativos" value={profile.otherAssets} onChange={(value) => update("otherAssets", value)} />
          <NumberField label="Outras dívidas" value={profile.otherDebt} onChange={(value) => update("otherDebt", value)} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">FINANCIAMENTO</p>
            <h2>Dados do imóvel</h2>
          </div>
        </div>
        <div className="form-grid">
          <NumberField label="Prestação mensal" value={profile.mortgagePayment} onChange={(value) => update("mortgagePayment", value)} />
          <NumberField label="Parcelas restantes" value={profile.mortgageRemainingMonths} onChange={(value) => update("mortgageRemainingMonths", value)} suffix="meses" />
          <NumberField label="Taxa anual" value={profile.mortgageAnnualRate} onChange={(value) => update("mortgageAnnualRate", value)} suffix="% a.a." />
        </div>
      </section>
    </div>
  );
}

function Plan({
  profile,
  onChange,
}: {
  profile: FinancialProfile;
  onChange: (profile: FinancialProfile) => void;
}) {
  const update = (key: keyof FinancialProfile, value: number) =>
    onChange({ ...profile, [key]: value });

  const netWorth = getNetWorth(profile);
  const margin = getMonthlyMargin(profile);
  const projection = projectYearsToGoal(
    netWorth,
    profile.millionGoal,
    profile.plannedMonthlyInvestment,
    profile.annualRealReturn,
  );

  const scenarios = [1550, 2500, 3500, 5000, 7000].map((monthly) => ({
    monthly,
    years: projectYearsToGoal(netWorth, profile.millionGoal, monthly, profile.annualRealReturn),
  }));

  return (
    <div className="page-stack">
      <section className="page-title">
        <p className="eyebrow">PLANO DO MILHÃO</p>
        <h1>Transforme aumento de renda em patrimônio.</h1>
        <p>
          Ajuste as premissas e compare cenários. Os resultados abaixo são apenas
          simulações matemáticas.
        </p>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PREMISSAS</p>
              <h2>Seu plano atual</h2>
            </div>
          </div>
          <div className="form-grid single">
            <NumberField label="Renda líquida mensal" value={profile.income} onChange={(value) => update("income", value)} />
            <NumberField label="Gastos fixos mensais" value={profile.fixedExpenses} onChange={(value) => update("fixedExpenses", value)} />
            <NumberField
              label="Aporte mensal planejado"
              value={profile.plannedMonthlyInvestment}
              onChange={(value) => update("plannedMonthlyInvestment", value)}
              hint={`Margem base atual: ${currency.format(margin)}`}
            />
            <NumberField label="Meta de patrimônio" value={profile.millionGoal} onChange={(value) => update("millionGoal", value)} />
            <NumberField
              label="Retorno real anual da simulação"
              value={profile.annualRealReturn}
              onChange={(value) => update("annualRealReturn", value)}
              suffix="% a.a."
              hint="Premissa para cálculo, não promessa de rendimento."
            />
            <NumberField label="Meta da reserva de emergência" value={profile.emergencyFundTarget} onChange={(value) => update("emergencyFundTarget", value)} />
          </div>
        </article>

        <article className="panel plan-result">
          <p className="eyebrow">RESULTADO</p>
          <span>Tempo matemático estimado</span>
          <strong>
            {projection === null
              ? "Defina um aporte"
              : projection === 0
                ? "Meta alcançada"
                : `${projection.toFixed(1)} anos`}
          </strong>
          <small>
            Partindo de {currency.format(netWorth)} e aportando{" "}
            {currency.format(profile.plannedMonthlyInvestment)} por mês.
          </small>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CENÁRIOS</p>
            <h2>O efeito do aporte mensal</h2>
          </div>
        </div>
        <div className="scenario-table">
          <div className="scenario-row header">
            <span>Aporte mensal</span>
            <span>Tempo até a meta</span>
          </div>
          {scenarios.map((scenario) => (
            <div className="scenario-row" key={scenario.monthly}>
              <strong>{currency.format(scenario.monthly)}</strong>
              <span>{scenario.years === null ? "—" : `${scenario.years.toFixed(1)} anos`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="strategy-strip">
        <div>
          <span>01</span>
          <strong>Finalizar o apartamento</strong>
          <small>Sem transformar gastos temporários em padrão permanente.</small>
        </div>
        <div>
          <span>02</span>
          <strong>Construir liquidez</strong>
          <small>Acompanhar reserva e patrimônio financeiro separadamente.</small>
        </div>
        <div>
          <span>03</span>
          <strong>Capturar aumentos de renda</strong>
          <small>Converter parte relevante do crescimento salarial em patrimônio.</small>
        </div>
        <div>
          <span>04</span>
          <strong>Atualizar o financiamento</strong>
          <small>Registrar amortizações e redução do saldo devedor.</small>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<Tab>("dashboard");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const netWorth = useMemo(() => getNetWorth(state.profile), [state.profile]);

  const updateProfile = (profile: FinancialProfile) => {
    setState((current) => ({ ...current, profile }));
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const imported = await parseBackup(file);
      setState(imported);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível importar o backup.");
    }
  };

  const handleReset = () => {
    const first = window.confirm("Deseja apagar os dados locais deste navegador?");
    if (!first) return;
    const second = window.confirm("Esta é a confirmação final. O histórico local será apagado. Continuar?");
    if (!second) return;
    clearState();
    setState(initialState);
  };

  if (!state.configured) {
    return (
      <Setup
        onSave={(profile) =>
          setState({ ...state, configured: true, profile })
        }
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FT</div>
          <div>
            <strong>Financial Tracker</strong>
            <span>Plano do primeiro milhão</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-summary">
          <span>Patrimônio atual</span>
          <strong>{currency.format(netWorth)}</strong>
          <small>Dados salvos somente neste dispositivo.</small>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <span className="mobile-brand">FT</span>
            <strong>{navItems.find((item) => item.id === tab)?.label}</strong>
          </div>
          <div className="top-actions">
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => handleImport(event.target.files?.[0])}
            />
            <button className="secondary-button" onClick={() => importRef.current?.click()}>
              Importar
            </button>
            <button className="secondary-button" onClick={() => downloadBackup(state)}>
              Backup
            </button>
            <button className="icon-button danger" title="Limpar dados" onClick={handleReset}>
              ⋯
            </button>
          </div>
        </header>

        <div className="page-content">
          {tab === "dashboard" && <Dashboard state={state} />}
          {tab === "transactions" && (
            <Transactions
              transactions={state.transactions}
              onChange={(transactions) => setState((current) => ({ ...current, transactions }))}
            />
          )}
          {tab === "assets" && <Assets profile={state.profile} onChange={updateProfile} />}
          {tab === "plan" && <Plan profile={state.profile} onChange={updateProfile} />}
        </div>

        <nav className="mobile-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              <span>{item.icon}</span>
              <small>{item.label.split(" ")[0]}</small>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
