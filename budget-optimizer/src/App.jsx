import { useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  CircleHelp,
  CirclePlus,
  FlaskConical,
  Gauge,
  Layers3,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { MAX_BUDGET, optimizeKnapsack } from "./knapsack.ts";
import "./App.css";

const DEMO_ITEMS = [
  { id: "laptop-accessory", name: "Laptop accessory", cost: 4000, value: 9 },
  { id: "office-chair", name: "Office chair", cost: 5000, value: 10 },
  { id: "software-license", name: "Software license", cost: 3000, value: 6 },
  { id: "storage-device", name: "Storage device", cost: 2000, value: 4 },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
const formatNumber = (amount) => new Intl.NumberFormat("en-IN").format(amount);

function csvCell(value) {
  const safeValue = /^[-=+@]/.test(String(value)) ? `'${value}` : String(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function App() {
  const [budget, setBudget] = useState("10000");
  const [items, setItems] = useState(DEMO_ITEMS);
  const [result, setResult] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [draft, setDraft] = useState({ name: "", cost: "", value: "" });
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const budgetNumber = Number(budget);
  const budgetValid =
    budget.trim() !== "" &&
    Number.isInteger(budgetNumber) &&
    budgetNumber >= 0 &&
    budgetNumber <= MAX_BUDGET;
  const selectedIds = result?.selectedIds ?? [];
  const budgetSliderValue = budgetValid ? budgetNumber : 0;
  const maximumItemValue = Math.max(1, ...items.map((item) => item.value));

  function invalidateResults() {
    setResult(null);
    setNotice("");
  }

  function openAddForm() {
    setEditingItem("new");
    setDraft({ name: "", cost: "", value: "" });
    setFormError("");
  }

  function openEditForm(item) {
    setEditingItem(item.id);
    setDraft({
      name: item.name,
      cost: String(item.cost),
      value: String(item.value),
    });
    setFormError("");
  }

  function closeForm() {
    setEditingItem(null);
    setFormError("");
  }

  function saveItem(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const cost = Number(draft.cost);
    const value = Number(draft.value);
    if (!name) return setFormError("Enter a name for this item.");
    if (!Number.isInteger(cost) || cost <= 0)
      return setFormError("Cost must be a positive whole number of rupees.");
    if (!Number.isInteger(value) || value < 0)
      return setFormError("Utility must be a non-negative whole number.");
    if (
      items.some(
        (item) =>
          item.name.toLocaleLowerCase() === name.toLocaleLowerCase() &&
          item.id !== editingItem,
      )
    ) {
      return setFormError("An item with this name already exists.");
    }
    if (editingItem === "new") {
      setItems((current) => [
        ...current,
        { id: crypto.randomUUID(), name, cost, value },
      ]);
      setNotice(`${name} added to the candidate list.`);
    } else {
      setItems((current) =>
        current.map((item) =>
          item.id === editingItem ? { ...item, name, cost, value } : item,
        ),
      );
      setNotice(`${name} updated.`);
    }
    invalidateResults();
    closeForm();
  }

  function deleteItem(item) {
    setItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );
    invalidateResults();
    setNotice(`${item.name} removed from the candidate list.`);
  }

  function restoreDemo() {
    setBudget("10000");
    setItems(DEMO_ITEMS);
    setResult(null);
    setNotice(
      "Demo dataset restored. Calculate the selection to see the result.",
    );
    closeForm();
  }

  function calculateSelection() {
    if (!budgetValid) return setNotice("");
    try {
      setResult(optimizeKnapsack(items, budgetNumber));
      setNotice("Optimal selection calculated from the current items.");
    } catch (error) {
      setResult(null);
      setNotice(
        error instanceof Error
          ? error.message
          : "The optimization could not be completed.",
      );
    }
  }

  function exportReport() {
    if (!result) return;
    const rows = [
      ["Report metric", "Value"],
      ["Total budget", budgetNumber],
      ["Total selected cost", result.totalCost],
      ["Maximum utility", result.totalValue],
      ["Remaining budget", result.remainingBudget],
      [],
      [
        "Item name",
        "Cost (INR)",
        "Utility value",
        "Selected status",
        "Total budget",
        "Total selected cost",
        "Maximum utility",
        "Remaining budget",
      ],
      ...items.map((item) => [
        item.name,
        item.cost,
        item.value,
        selectedIds.includes(item.id) ? "Selected" : "Not selected",
        budgetNumber,
        result.totalCost,
        result.totalValue,
        result.remainingBudget,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-optimization-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const capacityColumns = budgetValid
    ? [
        ...new Set(
          Array.from({ length: 11 }, (_, index) =>
            Math.round((budgetNumber / 10) * index),
          ),
        ),
      ]
    : [];
  const tableRows = result
    ? [
        { label: "0 items", row: 0 },
        ...items
          .slice(0, 8)
          .map((item, index) => ({ label: item.name, row: index + 1 })),
        ...(items.length > 8
          ? [{ label: items.at(-1).name, row: items.length }]
          : []),
      ]
    : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          aria-label="Budget Optimizer home"
        >
          <span className="brand-mark">
            <Activity size={18} strokeWidth={2.4} />
          </span>
          <span>
            <strong>ledgerly</strong>
            <small>PLANNING STUDIO</small>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#overview">
            <Gauge size={17} /> Overview
          </a>
          <a className="nav-link" href="#candidate-items">
            <Layers3 size={17} /> Candidate items
          </a>
          <a className="nav-link" href="#algorithm">
            <FlaskConical size={17} /> Algorithm lab
          </a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <span className="side-note-icon">
            <ShieldCheck size={16} />
          </span>
          <div>
            <strong>Runs locally</strong>
            <span>No account or data sync</span>
          </div>
        </div>
        <div className="sidebar-foot">
          <span className="status-dot" /> DP ENGINE READY{" "}
          <span className="version-tag">v1.0</span>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ArrowRight size={13} />
            <strong>Budget planner</strong>
          </div>
          <div className="top-actions">
            <span className="engine-pill">
              <span className="status-dot" /> Algorithm ready
            </span>
            <button
              type="button"
              className="button button-quiet reset-button"
              onClick={restoreDemo}
            >
              <RotateCcw size={15} /> Restore demo
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> DECISION SUPPORT
              </div>
              <h1>Budget optimizer</h1>
              <p>
                Build a better portfolio of purchases, one constraint at a time.
              </p>
            </div>
            <div className="heading-meta">
              <span className="meta-icon">
                <FlaskConical size={16} />
              </span>
              <span>
                <strong>0/1 Knapsack</strong>
                <small>Dynamic programming</small>
              </span>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Budget summary">
            <article className="metric-card">
              <div className="metric-top">
                <span>Available budget</span>
                <span className="metric-icon blue">
                  <Wallet size={17} />
                </span>
              </div>
              <strong className="metric-value">
                {budgetValid ? formatINR(budgetNumber) : "—"}
              </strong>
              <span className="metric-caption">Spending limit</span>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>Selected cost</span>
                <span className="metric-icon teal">
                  <BadgeCheck size={17} />
                </span>
              </div>
              <strong className="metric-value">
                {result ? formatINR(result.totalCost) : "—"}
              </strong>
              <span className="metric-caption">
                {result
                  ? `${result.selectedIds.length} items in selection`
                  : "Calculate to see allocation"}
              </span>
            </article>
            <article className="metric-card metric-highlight">
              <div className="metric-top">
                <span>Maximum utility</span>
                <span className="metric-icon mint">
                  <Sparkles size={17} />
                </span>
              </div>
              <strong className="metric-value">
                {result ? formatNumber(result.totalValue) : "—"}
              </strong>
              <span className="metric-caption">Illustrative utility score</span>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>Remaining budget</span>
                <span className="metric-icon amber">
                  <CircleHelp size={17} />
                </span>
              </div>
              <strong className="metric-value">
                {result ? formatINR(result.remainingBudget) : "—"}
              </strong>
              <span className="metric-caption">
                {result
                  ? `${result.utilizationPercent.toFixed(1)}% utilized`
                  : "Awaiting optimization"}
              </span>
            </article>
          </section>

          <section className="planning-grid">
            <article className="panel budget-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">01 / CONSTRAINT</span>
                  <h2>Set your budget</h2>
                </div>
                <span className="panel-heading-icon">
                  <Wallet size={17} />
                </span>
              </div>
              <p className="panel-subtitle">
                Choose the maximum amount available for this plan.
              </p>
              <label className="field-label" htmlFor="budget-input">
                Budget amount <span>INR</span>
              </label>
              <div
                className={`budget-input-wrap ${!budgetValid ? "has-error" : ""}`}
              >
                <span className="currency-symbol">₹</span>
                <input
                  id="budget-input"
                  type="number"
                  min="0"
                  max={MAX_BUDGET}
                  step="1"
                  value={budget}
                  onChange={(event) => {
                    setBudget(event.target.value);
                    invalidateResults();
                  }}
                  aria-describedby="budget-hint budget-error"
                />
                <span className="input-suffix">INR</span>
              </div>
              {!budgetValid && (
                <p className="field-error" id="budget-error">
                  <CircleAlert size={14} /> Enter a whole number from ₹0 to{" "}
                  {formatINR(MAX_BUDGET)}.
                </p>
              )}
              <div className="range-labels">
                <span>₹0</span>
                <span>CAPACITY {formatINR(MAX_BUDGET)}</span>
              </div>
              <input
                className="budget-range"
                type="range"
                min="0"
                max={MAX_BUDGET}
                step="100"
                value={budgetSliderValue}
                onChange={(event) => {
                  setBudget(event.target.value);
                  invalidateResults();
                }}
                aria-label="Budget slider"
              />
              <div className="budget-footnote" id="budget-hint">
                <CircleHelp size={14} /> Integer rupees only. Capacity is capped
                at ₹25,000 to keep the DP table responsive.
              </div>
              <div className="budget-capacity">
                <div>
                  <span>DP capacity</span>
                  <strong>
                    {budgetValid ? formatNumber(budgetNumber + 1) : "—"} states
                  </strong>
                </div>
                <span className="capacity-track">
                  <span
                    style={{
                      width: `${budgetValid ? Math.max(1, (budgetNumber / MAX_BUDGET) * 100) : 0}%`,
                    }}
                  />
                </span>
              </div>
            </article>

            <article className="panel action-panel">
              <div className="action-icon">
                <Sparkles size={20} />
              </div>
              <div className="action-copy">
                <span className="section-kicker">READY WHEN YOU ARE</span>
                <h2>Find the strongest mix.</h2>
                <p>
                  Compare every feasible combination and maximize utility within
                  your budget.
                </p>
              </div>
              <button
                type="button"
                className="button button-primary calculate-button"
                disabled={!budgetValid}
                onClick={calculateSelection}
              >
                Calculate optimal selection <ArrowRight size={16} />
              </button>
              <div
                className={`action-status ${result ? "status-success" : ""}`}
                aria-live="polite"
              >
                {result ? (
                  <>
                    <BadgeCheck size={14} /> Optimal selection calculated
                  </>
                ) : (
                  <>
                    <span className="status-dot" /> Inputs ready for calculation
                  </>
                )}
              </div>
            </article>
          </section>

          <section className="results-grid" aria-label="Optimization results">
            <article className="panel chart-panel">
              <div className="panel-heading chart-heading">
                <div>
                  <span className="section-kicker">02 / OUTCOME</span>
                  <h2>Utility by candidate</h2>
                </div>
                <span className="chart-legend">
                  <i className="legend-selected" /> Selected{" "}
                  <i className="legend-other" /> Not selected
                </span>
              </div>
              <p className="panel-subtitle">
                Item utility scores compared against the optimal set.
              </p>
              {items.length === 0 ? (
                <div className="empty-chart">
                  <Layers3 size={22} />
                  <strong>No candidate items</strong>
                  <span>Add an item to populate the comparison.</span>
                </div>
              ) : (
                <div
                  className="bar-chart"
                  role="img"
                  aria-label="Horizontal bars compare item utility values and indicate optimal selection"
                >
                  <div className="axis-labels">
                    <span>Candidate</span>
                    <span>Utility score</span>
                  </div>
                  {items.map((item) => {
                    const selected = selectedIds.includes(item.id);
                    return (
                      <div
                        className={`bar-row ${result ? (selected ? "is-selected" : "is-unselected") : ""}`}
                        key={item.id}
                      >
                        <span className="bar-name" title={item.name}>
                          {item.name}
                        </span>
                        <span className="bar-track">
                          <span
                            className="bar-fill"
                            style={{
                              width: `${(item.value / maximumItemValue) * 100}%`,
                            }}
                          />
                        </span>
                        <strong className="bar-value">{item.value}</strong>
                        {result && (
                          <span
                            className={`bar-status ${selected ? "selected" : ""}`}
                          >
                            {selected ? "Selected" : "Not selected"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="chart-scale">
                    <span>0</span>
                    <span>{Math.ceil(maximumItemValue / 2)}</span>
                    <span>{maximumItemValue}</span>
                  </div>
                </div>
              )}
              <div className="chart-footnote">
                Utility values are illustrative scores, not financial returns.
              </div>
            </article>

            <article className="panel utilization-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">BUDGET HEALTH</span>
                  <h2>Utilization</h2>
                </div>
                <span className="panel-heading-icon">
                  <Gauge size={17} />
                </span>
              </div>
              <div className="utilization-number">
                {result ? `${result.utilizationPercent.toFixed(1)}%` : "—"}
              </div>
              <p className="panel-subtitle">of available budget allocated</p>
              <div
                className="util-track"
                aria-label={
                  result
                    ? `${result.utilizationPercent.toFixed(1)} percent budget utilized`
                    : "No utilization calculated"
                }
              >
                <span
                  style={{
                    width: `${result ? result.utilizationPercent : 0}%`,
                  }}
                />
              </div>
              <div className="util-details">
                <span>
                  Allocated{" "}
                  <strong>{result ? formatINR(result.totalCost) : "—"}</strong>
                </span>
                <span>
                  Available{" "}
                  <strong>{budgetValid ? formatINR(budgetNumber) : "—"}</strong>
                </span>
              </div>
              {result && (
                <div className="remaining-callout">
                  <span>Unallocated</span>
                  <strong>{formatINR(result.remainingBudget)}</strong>
                </div>
              )}
            </article>
          </section>

          <section className="panel items-panel" id="candidate-items">
            <div className="panel-heading items-heading">
              <div>
                <span className="section-kicker">03 / CANDIDATES</span>
                <h2>
                  Candidate items{" "}
                  <span className="count-badge">{items.length}</span>
                </h2>
              </div>
              <div className="item-toolbar">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={exportReport}
                  disabled={!result}
                  title={
                    !result
                      ? "Calculate a selection before exporting"
                      : "Download optimization report as CSV"
                  }
                >
                  <ArrowDownToLine size={15} /> Export CSV
                </button>
                <button
                  type="button"
                  className="button button-primary add-button"
                  onClick={openAddForm}
                >
                  <CirclePlus size={16} /> Add item
                </button>
              </div>
            </div>
            <p className="panel-subtitle">
              Each candidate can be chosen once. Adjust the list to model your
              options.
            </p>
            {notice && (
              <div
                className={`notice ${result ? "notice-success" : ""}`}
                role="status"
              >
                {result ? <BadgeCheck size={15} /> : <CircleAlert size={15} />}
                {notice}
              </div>
            )}
            <div className="table-scroll">
              <table className="candidate-table">
                <thead>
                  <tr>
                    <th scope="col">ITEM</th>
                    <th scope="col">COST</th>
                    <th scope="col">UTILITY</th>
                    <th scope="col">OPTIMAL STATUS</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const selected = selectedIds.includes(item.id);
                    const overBudget = budgetValid && item.cost > budgetNumber;
                    return (
                      <tr
                        key={item.id}
                        className={selected ? "row-selected" : ""}
                      >
                        <td>
                          <div className="item-name-cell">
                            <span
                              className={`item-dot ${selected ? "selected" : ""}`}
                            />
                            <strong>{item.name}</strong>
                          </div>
                        </td>
                        <td className="tabular">{formatINR(item.cost)}</td>
                        <td>
                          <span className="utility-value">
                            {item.value}
                            <small> pts</small>
                          </span>
                        </td>
                        <td>
                          {result ? (
                            <span
                              className={`outcome-tag ${selected ? "outcome-selected" : overBudget ? "outcome-over" : "outcome-idle"}`}
                            >
                              {selected
                                ? "Selected"
                                : overBudget
                                  ? "Over budget"
                                  : "Not selected"}
                            </span>
                          ) : (
                            <span
                              className={`outcome-tag ${overBudget ? "outcome-over" : "outcome-pending"}`}
                            >
                              {overBudget
                                ? "Cost exceeds budget"
                                : "Run optimization"}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Edit ${item.name}`}
                              title="Edit item"
                              onClick={() => openEditForm(item)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-button danger-hover"
                              aria-label={`Delete ${item.name}`}
                              title="Delete item"
                              onClick={() => deleteItem(item)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        <div className="table-empty">
                          <Layers3 size={20} />
                          <strong>Your candidate list is empty</strong>
                          <span>Add an item to start optimizing.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {result && (
              <div className="selection-summary">
                <span className="summary-check">
                  <BadgeCheck size={16} />
                </span>
                <span>
                  <strong>Optimal combination</strong>
                  <small>
                    The selected combination achieves the maximum utility under
                    the given budget constraint.
                  </small>
                </span>
                <div className="summary-total">
                  <small>MAXIMUM UTILITY</small>
                  <strong>
                    {result.totalValue} <i>pts</i>
                  </strong>
                </div>
              </div>
            )}
            <div className="table-foot">
              <span>
                <ShieldCheck size={14} /> One-time selection per candidate
              </span>
              <span>Utility is an illustrative score</span>
            </div>
          </section>

          {result && (
            <section className="panel selected-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">OPTIMAL PORTFOLIO</span>
                  <h2>
                    Selected items{" "}
                    <span className="count-badge">
                      {result.selectedIds.length}
                    </span>
                  </h2>
                </div>
                <div className="selected-totals">
                  <span>
                    Total cost <strong>{formatINR(result.totalCost)}</strong>
                  </span>
                  <span>
                    Utility <strong>{result.totalValue} pts</strong>
                  </span>
                </div>
              </div>
              {result.selectedIds.length === 0 ? (
                <p className="no-selection">
                  No items fit within the current budget with a positive
                  utility.
                </p>
              ) : (
                <div className="selected-list">
                  {items
                    .filter((item) => selectedIds.includes(item.id))
                    .map((item) => (
                      <div className="selected-item" key={item.id}>
                        <span className="selected-check">
                          <BadgeCheck size={16} />
                        </span>
                        <span className="selected-item-name">
                          <strong>{item.name}</strong>
                          <small>Utility {item.value}</small>
                        </span>
                        <strong className="selected-cost">
                          {formatINR(item.cost)}
                        </strong>
                      </div>
                    ))}
                </div>
              )}
              <div className="remaining-line">
                <span>Remaining budget</span>
                <strong>{formatINR(result.remainingBudget)}</strong>
              </div>
            </section>
          )}

          <section className="panel algorithm-panel" id="algorithm">
            <div className="panel-heading algorithm-heading">
              <div>
                <span className="section-kicker">04 / UNDER THE HOOD</span>
                <h2>Algorithm explorer</h2>
              </div>
              <span className="complexity-badge">
                <Activity size={14} /> O(nW)
              </span>
            </div>
            <div className="algorithm-layout">
              <div className="algorithm-copy">
                <div className="algo-title">
                  <span className="algo-symbol">01</span>
                  <div>
                    <strong>0/1 Knapsack</strong>
                    <span>Dynamic programming · Full table</span>
                  </div>
                </div>
                <p>
                  For each item and each capacity, compare leaving the item out
                  with including it once, if it fits. A deterministic tie keeps
                  the previous solution and excludes the current item.
                </p>
                <div
                  className="recurrence"
                  aria-label="Knapsack recurrence relation"
                >
                  <code>DP[i][c] = DP[i−1][c]</code>
                  <span>when cost[i] &gt; c</span>
                  <code>
                    DP[i][c] = max(DP[i−1][c], value[i] + DP[i−1][c−cost[i]])
                  </code>
                  <span>otherwise</span>
                </div>
                <div className="complexity-row">
                  <span>
                    <small>TIME</small>
                    <strong>O(nW)</strong>
                  </span>
                  <span>
                    <small>SPACE</small>
                    <strong>O(nW)</strong>
                  </span>
                  <span>
                    <small>OPTIMIZED SPACE</small>
                    <strong>O(W)</strong>
                  </span>
                </div>
                <div className="pseudo-note">
                  <CircleHelp size={15} />
                  <span>
                    <strong>Pseudo-polynomial time.</strong> W is the numeric
                    budget capacity, not its input length.
                  </span>
                </div>
              </div>
              <div className="dp-view">
                <div className="dp-header">
                  <div>
                    <strong>DP table</strong>
                    <span>Maximum utility at each capacity</span>
                  </div>
                  {result && (
                    <span className="dp-optimum">
                      OPTIMUM <strong>{result.totalValue}</strong>
                    </span>
                  )}
                </div>
                {!result ? (
                  <div className="dp-empty">
                    <Layers3 size={21} />
                    <span>Run the optimizer to generate the DP table.</span>
                  </div>
                ) : (
                  <>
                    <div className="dp-table-wrap">
                      <table className="dp-table">
                        <thead>
                          <tr>
                            <th scope="col">ITEMS \ CAP.</th>
                            {capacityColumns.map((capacity) => (
                              <th scope="col" key={capacity}>
                                {formatNumber(capacity)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map(({ label, row }) => (
                            <tr
                              key={`${row}-${label}`}
                              className={
                                row === items.length ? "final-dp-row" : ""
                              }
                            >
                              <th scope="row" title={label}>
                                {label}
                              </th>
                              {capacityColumns.map((capacity) => (
                                <td key={capacity}>
                                  {result.table[row][capacity]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(items.length > 8 || budgetNumber > 10000) && (
                      <div className="dp-limit-note">
                        Showing {tableRows.length} of {items.length + 1} rows
                        and {capacityColumns.length} representative capacities.
                        Optimization uses the complete table.
                      </div>
                    )}
                  </>
                )}
                <div className="dp-legend">
                  <span>
                    <i className="dp-zero" /> Base case: zero items
                  </span>
                  <span>
                    <i className="dp-final" /> Final item row
                  </span>
                </div>
              </div>
            </div>
          </section>
          <footer className="page-footer">
            <span>
              <span className="status-dot" /> All calculations run in this
              browser
            </span>
            <span>
              Budget Optimizer <b>·</b> 0/1 Knapsack using Dynamic Programming
            </span>
          </footer>
        </div>
      </main>

      {editingItem && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="item-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="section-kicker">CANDIDATE DETAILS</span>
                <h2 id="modal-title">
                  {editingItem === "new" ? "Add an item" : "Edit item"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button modal-close"
                aria-label="Close dialog"
                onClick={closeForm}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveItem} noValidate>
              <label className="modal-field">
                Item name
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Monitor stand"
                  maxLength="80"
                />
              </label>
              <div className="modal-fields-row">
                <label className="modal-field">
                  Cost in rupees
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.cost}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        cost: event.target.value,
                      }))
                    }
                    placeholder="4000"
                  />
                </label>
                <label className="modal-field">
                  Utility value
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.value}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                    placeholder="8"
                  />
                </label>
              </div>
              <p className="modal-helper">
                Utility is a relative, illustrative score. It is not a financial
                return.
              </p>
              {formError && (
                <p className="field-error modal-error" role="alert">
                  <CircleAlert size={14} />
                  {formError}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <CirclePlus size={15} />
                  {editingItem === "new" ? "Add candidate" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
