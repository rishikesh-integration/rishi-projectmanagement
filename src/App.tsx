import { useState, useMemo, useEffect } from 'react';

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Operations',
  'Finance',
  'HR',
  'Marketing',
  'Legal',
  'Other',
];
const TASKFORCES = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Omega',
  'Core',
  'Support',
  'Growth',
  'Infrastructure',
  'Other',
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const INITIAL_DATA = [
  {
    id: 1,
    name: 'Alice Johnson',
    role: 'Senior Engineer',
    department: 'Engineering',
    taskforce: 'Alpha',
    company: 'TechCorp',
    vendor: '',
    isInhouse: true,
    startDate: '2024-01-15',
    endDate: '',
  },
  {
    id: 2,
    name: 'Bob Smith',
    role: 'Product Manager',
    department: 'Product',
    taskforce: 'Beta',
    company: 'TechCorp',
    vendor: '',
    isInhouse: true,
    startDate: '2024-02-01',
    endDate: '',
  },
  {
    id: 3,
    name: 'Carol White',
    role: 'UX Designer',
    department: 'Design',
    taskforce: 'Alpha',
    company: 'DesignCo',
    vendor: 'DesignCo Partners',
    isInhouse: false,
    startDate: '2024-03-10',
    endDate: '',
  },
  {
    id: 4,
    name: 'David Lee',
    role: 'Data Analyst',
    department: 'Operations',
    taskforce: 'Core',
    company: 'Analytics Inc',
    vendor: 'Analytics Inc',
    isInhouse: false,
    startDate: '2024-01-20',
    endDate: '2024-11-30',
  },
  {
    id: 5,
    name: 'Eva Martinez',
    role: 'DevOps Engineer',
    department: 'Engineering',
    taskforce: 'Infrastructure',
    company: 'TechCorp',
    vendor: '',
    isInhouse: true,
    startDate: '2024-04-01',
    endDate: '',
  },
  {
    id: 6,
    name: 'Frank Chen',
    role: 'Marketing Lead',
    department: 'Marketing',
    taskforce: 'Growth',
    company: 'MarketForce',
    vendor: 'MarketForce Ltd',
    isInhouse: false,
    startDate: '2025-01-01',
    endDate: '',
  },
];

const STORAGE_KEY = 'resourcer_data_v1';

type Resource = {
  id: number;
  name: string;
  role: string;
  department: string;
  taskforce: string;
  company: string;
  vendor: string;
  isInhouse: boolean;
  startDate: string;
  endDate: string;
};

const emptyForm: Resource = {
  id: 0,
  name: '',
  role: '',
  department: '',
  taskforce: '',
  company: '',
  vendor: '',
  isInhouse: true,
  startDate: '',
  endDate: '',
};

function loadFromStorage(): Resource[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_DATA;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: accent ? '#0f172a' : '#1e293b',
        border: `1px solid ${accent || '#334155'}`,
        borderRadius: 12,
        padding: '20px 24px',
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: accent || '#f1f5f9',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: -1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: 4,
          fontFamily: "'DM Sans', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: accent || '#64748b', marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function DonutChart({
  inhouse,
  contractor,
}: {
  inhouse: number;
  contractor: number;
}) {
  const total = inhouse + contractor;
  if (total === 0) return null;
  const pct = Math.round((inhouse / total) * 100);
  const r = 54,
    cx = 70,
    cy = 70;
  const circ = 2 * Math.PI * r;
  const inhouseDash = (inhouse / total) * circ;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={140} height={140}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={18}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={18}
          strokeDasharray={`${inhouseDash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f472b6"
          strokeWidth={18}
          strokeDasharray={`${circ - inhouseDash} ${circ}`}
          strokeDashoffset={-inhouseDash}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#f1f5f9"
          fontSize={20}
          fontWeight={800}
          fontFamily="DM Mono, monospace"
        >
          {pct}%
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={10}
          fontFamily="DM Sans, sans-serif"
        >
          IN-HOUSE
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#38bdf8',
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>
            In-house: <b style={{ color: '#f1f5f9' }}>{inhouse}</b>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#f472b6',
            }}
          />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>
            Contractor: <b style={{ color: '#f1f5f9' }}>{contractor}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function BarChart({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 110,
              fontSize: 12,
              color: '#94a3b8',
              textAlign: 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {d.label}
          </div>
          <div
            style={{
              flex: 1,
              background: '#0f172a',
              borderRadius: 4,
              height: 20,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                background: color || '#38bdf8',
                height: '100%',
                borderRadius: 4,
                transition: 'width 0.4s ease',
                minWidth: d.value > 0 ? 8 : 0,
              }}
            />
          </div>
          <div
            style={{
              width: 24,
              fontSize: 12,
              color: '#f1f5f9',
              fontWeight: 700,
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [resources, setResources] = useState<Resource[]>(loadFromStorage);
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Resource>(emptyForm);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('2025');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(
    null
  );

  // ✅ Save to localStorage every time resources change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
    } catch {}
  }, [resources]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const activeResources = useMemo(() => {
    if (!filterMonth || !filterYear) return resources;
    const year = parseInt(filterYear);
    const month = parseInt(filterMonth);
    return resources.filter((r) => {
      const start = new Date(r.startDate);
      const end = r.endDate ? new Date(r.endDate) : null;
      const refDate = new Date(year, month - 1, 1);
      const refEnd = new Date(year, month, 0);
      return start <= refEnd && (!end || end >= refDate);
    });
  }, [resources, filterMonth, filterYear]);

  const stats = useMemo(() => {
    const inhouse = activeResources.filter((r) => r.isInhouse).length;
    const contractor = activeResources.filter((r) => !r.isInhouse).length;
    const total = activeResources.length;
    const byDept = DEPARTMENTS.map((d) => ({
      label: d,
      value: activeResources.filter((r) => r.department === d).length,
    })).filter((d) => d.value > 0);
    const byTaskforce = TASKFORCES.map((t) => ({
      label: t,
      value: activeResources.filter((r) => r.taskforce === t).length,
    })).filter((t) => t.value > 0);
    const byVendor = [
      ...new Set(activeResources.filter((r) => r.vendor).map((r) => r.vendor)),
    ].map((v) => ({
      label: v,
      value: activeResources.filter((r) => r.vendor === v).length,
    }));

    let additions = 0,
      exits = 0;
    if (filterMonth && filterYear) {
      const year = parseInt(filterYear);
      const month = parseInt(filterMonth);
      additions = resources.filter((r) => {
        const d = new Date(r.startDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).length;
      exits = resources.filter((r) => {
        if (!r.endDate) return false;
        const d = new Date(r.endDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).length;
    }

    return {
      inhouse,
      contractor,
      total,
      byDept,
      byTaskforce,
      byVendor,
      additions,
      exits,
    };
  }, [activeResources, resources, filterMonth, filterYear]);

  const filteredResources = useMemo(() => {
    let list = resources.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q);
      const matchDept = !filterDept || r.department === filterDept;
      const matchType =
        !filterType || (filterType === 'inhouse' ? r.isInhouse : !r.isInhouse);
      return matchSearch && matchDept && matchType;
    });
    list.sort((a: any, b: any) => {
      let av = a[sortCol] ?? '',
        bv = b[sortCol] ?? '';
      if (typeof av === 'boolean') {
        av = av ? 0 : 1;
        bv = bv ? 0 : 1;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [resources, search, filterDept, filterType, sortCol, sortDir]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (r: Resource) => {
    setForm({ ...r });
    setEditId(r.id);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.name || !form.role || !form.department || !form.startDate) {
      showToast('Please fill required fields', 'error');
      return;
    }
    if (editId) {
      setResources((prev) =>
        prev.map((r) => (r.id === editId ? { ...form, id: editId } : r))
      );
      showToast('Resource updated ✓');
    } else {
      setResources((prev) => [...prev, { ...form, id: Date.now() }]);
      showToast('Resource added ✓');
    }
    setShowForm(false);
  };

  const deleteRes = (id: number) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    showToast('Resource deleted', 'error');
  };
  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const headers = [
      'Name',
      'Role',
      'Department',
      'Taskforce',
      'Company',
      'Vendor',
      'Type',
      'Start Date',
      'End Date',
    ];
    const rows = resources.map((r) => [
      r.name,
      r.role,
      r.department,
      r.taskforce,
      r.company,
      r.vendor,
      r.isInhouse ? 'In-House' : 'Contractor',
      r.startDate,
      r.endDate || 'Active',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resources.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported as CSV ✓');
  };

  const inputStyle: React.CSSProperties = {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#f1f5f9',
    padding: '9px 12px',
    fontSize: 14,
    width: '100%',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    display: 'block',
  };
  const btnStyle = (color?: string): React.CSSProperties => ({
    background: color || '#38bdf8',
    color: color ? '#fff' : '#0f172a',
    border: 'none',
    borderRadius: 8,
    padding: '9px 20px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#f1f5f9',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #1e293b',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          height: 60,
        }}
      >
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontWeight: 700,
            fontSize: 18,
            color: '#38bdf8',
            letterSpacing: -1,
          }}
        >
          RESOURCER
        </div>
        {['dashboard', 'resources'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              color: tab === t ? '#f1f5f9' : '#475569',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t ? 700 : 400,
              padding: '0 4px',
              borderBottom:
                tab === t ? '2px solid #38bdf8' : '2px solid transparent',
              height: 60,
              fontFamily: 'DM Sans, sans-serif',
              textTransform: 'capitalize',
            }}
          >
            {t === 'dashboard' ? '📊 Dashboard' : '👥 Resources'}
          </button>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: '#334155',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          💾 Auto-saved · {resources.length} records
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: toast.type === 'error' ? '#ef4444' : '#22c55e',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 600,
            zIndex: 999,
            fontSize: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <div style={{ padding: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}
              >
                Monthly Report
              </div>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
                Filter by period to see headcount snapshot
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ ...inputStyle, width: 130 }}
              >
                <option value="">All Months</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{ ...inputStyle, width: 100 }}
              >
                {['2023', '2024', '2025', '2026'].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stat Cards */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 32,
            }}
          >
            <StatCard
              label="Total Positions"
              value={stats.total}
              accent="#38bdf8"
            />
            <StatCard
              label="In-House"
              value={stats.inhouse}
              sub={`${
                stats.total
                  ? Math.round((stats.inhouse / stats.total) * 100)
                  : 0
              }% of total`}
            />
            <StatCard
              label="Contractors"
              value={stats.contractor}
              sub={`${
                stats.total
                  ? Math.round((stats.contractor / stats.total) * 100)
                  : 0
              }% of total`}
            />
            {filterMonth && (
              <>
                <StatCard
                  label="New Additions"
                  value={`+${stats.additions}`}
                  accent="#22c55e"
                />
                <StatCard
                  label="Exits"
                  value={`-${stats.exits}`}
                  accent="#ef4444"
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 20,
                }}
              >
                In-house vs Contractor
              </div>
              <DonutChart
                inhouse={stats.inhouse}
                contractor={stats.contractor}
              />
            </div>
            <div
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 20,
                }}
              >
                By Department
              </div>
              <BarChart data={stats.byDept} color="#38bdf8" />
            </div>
            <div
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 20,
                }}
              >
                By Taskforce
              </div>
              <BarChart data={stats.byTaskforce} color="#a78bfa" />
            </div>
          </div>

          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 14,
              padding: 24,
              maxWidth: 500,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 20,
              }}
            >
              By Vendor / Partner
            </div>
            {stats.byVendor.length ? (
              <BarChart data={stats.byVendor} color="#f472b6" />
            ) : (
              <div style={{ color: '#475569', fontSize: 14 }}>
                No contractor vendors in this period
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {tab === 'resources' && (
        <div style={{ padding: 32 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              placeholder="🔍 Search name, role, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 240 }}
            />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              style={{ ...inputStyle, width: 160 }}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ ...inputStyle, width: 150 }}
            >
              <option value="">All Types</option>
              <option value="inhouse">In-House</option>
              <option value="contractor">Contractor</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button onClick={exportCSV} style={btnStyle('#334155')}>
                📤 Export CSV
              </button>
              <button onClick={openAdd} style={btnStyle()}>
                + Add Resource
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {[
                    ['name', 'Name'],
                    ['role', 'Role'],
                    ['department', 'Dept'],
                    ['taskforce', 'Taskforce'],
                    ['company', 'Company'],
                    ['vendor', 'Vendor'],
                    ['isInhouse', 'Type'],
                    ['startDate', 'Start'],
                    ['endDate', 'End'],
                  ].map(([col, label]) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        fontSize: 11,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                      }}
                    >
                      {label}{' '}
                      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th
                    style={{
                      padding: '12px 14px',
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderTop: '1px solid #1e293b',
                      background: i % 2 === 0 ? 'transparent' : '#162032',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {r.name}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: 13,
                        color: '#94a3b8',
                      }}
                    >
                      {r.role}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {r.department}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {r.taskforce}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {r.company}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: 13,
                        color: '#94a3b8',
                      }}
                    >
                      {r.vendor || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: r.isInhouse ? '#0c4a6e' : '#4a044e',
                          color: r.isInhouse ? '#38bdf8' : '#f472b6',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {r.isInhouse ? 'In-House' : 'Contractor'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: 13,
                        fontFamily: 'DM Mono, monospace',
                      }}
                    >
                      {r.startDate}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: 13,
                        fontFamily: 'DM Mono, monospace',
                        color: r.endDate ? '#ef4444' : '#64748b',
                      }}
                    >
                      {r.endDate || 'Active'}
                    </td>
                    <td
                      style={{ padding: '12px 14px', display: 'flex', gap: 8 }}
                    >
                      <button
                        onClick={() => openEdit(r)}
                        style={{
                          background: '#1e3a5f',
                          color: '#38bdf8',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 12px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRes(r.id)}
                        style={{
                          background: '#3b0a0a',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 12px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredResources.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: 40,
                        textAlign: 'center',
                        color: '#475569',
                      }}
                    >
                      No resources found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, color: '#475569', fontSize: 13 }}>
            {filteredResources.length} of {resources.length} resources
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 16,
              padding: 32,
              width: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
              {editId ? 'Edit Resource' : 'Add New Resource'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              {(
                [
                  ['name', 'Name *', 'text'],
                  ['role', 'Role / Title *', 'text'],
                  ['company', 'Company *', 'text'],
                  ['vendor', 'Vendor / Partner', 'text'],
                ] as [keyof Resource, string, string][]
              ).map(([field, label]) => (
                <div key={field as string}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    value={form[field] as string}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field]: e.target.value }))
                    }
                    style={inputStyle}
                    placeholder={label}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Department *</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Taskforce</label>
                <select
                  value={form.taskforce}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, taskforce: e.target.value }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  {TASKFORCES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Type</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {([true, false] as boolean[]).map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setForm((f) => ({ ...f, isInhouse: v }))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 8,
                        border: '2px solid',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 14,
                        borderColor:
                          form.isInhouse === v
                            ? v
                              ? '#38bdf8'
                              : '#f472b6'
                            : '#334155',
                        background:
                          form.isInhouse === v
                            ? v
                              ? '#0c4a6e'
                              : '#4a044e'
                            : '#0f172a',
                        color:
                          form.isInhouse === v
                            ? v
                              ? '#38bdf8'
                              : '#f472b6'
                            : '#64748b',
                      }}
                    >
                      {v ? '🏢 In-House' : '🤝 Contractor'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 24,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowForm(false)}
                style={btnStyle('#334155')}
              >
                Cancel
              </button>
              <button onClick={saveForm} style={btnStyle()}>
                {editId ? 'Save Changes' : 'Add Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
