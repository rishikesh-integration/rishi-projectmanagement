import { useState, useMemo, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, writeBatch
} from "firebase/firestore";

const POSITION_TYPES = ["Onboarded", "Open", "On Hold", "Closed"];
const RESOURCE_TYPES = ["Internal", "External"];
const RESOURCE_CATEGORIES = ["Cat 2", "Cat 3", "Cat 4"];
const DEPARTMENTS = ["E3", "Data", "DMINT", "DXD-DevOps", "E-Retail"];
const COMPANIES = ["Michelin", "Capgemini", "Gateway", "CGI", "DataEase"];
const ROLES = [
  "Front End Developer","Manual QA","Backend Developer","Data Engineer",
  "Power BI Developer","Full Stack Developer","Architect","Business Analyst",
  "Product Owner","DMINT Factory Lead","DMINT Delivery Lead","Dev Ops Developer",
  "Delivery Manager","Support - Front end","QA Automation Developer","Dev Ops Lead",
  "Data Quality Analyst","Database Administrator","Scrum Master","Technical Lead",
  "Business Analytics and Consultancy","India Manager - UIP","SEO Manager",
  "Web Analyst","Data Analyst",
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = ["2022","2023","2024","2025","2026","2027","2028"];
const LOCATIONS = ["Pune, India","CFE, France","Paris, France"];
const TASKFORCES = [
  "Dacoval","Data Portal","DMINT Platform","Matching & Merging",
  "Dataset Library / Data Visualization","Pairing","Transversal Role","Devops",
  "Support","Vehicle Referential","Dealer Referential","Pricing Integration",
  "Data Quality","Ramu","Eretail","User Intelligence","Data Visualization",
  "Fabric","Catalyst","Tyre Dating","Analytics","Data Transformation","Customer Success",
];

type Resource = {
  id: string; name: string; positionType: string; resourceType: string;
  resourceCategory: string; department: string; manager: string;
  company: string; role: string; skills: string; taskforce: string;
  onLeave: boolean; startMonth: string; startYear: string;
  endMonth: string; endYear: string; location: string; program: string; resigned: boolean;
};

const EMPTY: Resource = {
  id:"", name:"", positionType:"Onboarded", resourceType:"Internal",
  resourceCategory:"", department:"", manager:"",
  company:"Michelin", role:"", skills:"", taskforce:"",
  onLeave:false, startMonth:"", startYear:"", endMonth:"", endYear:"",
  location:"", program:"", resigned:false,
};

const APP_FIELDS: { key: keyof Resource; label: string; required: boolean }[] = [
  { key:"name",             label:"Resource Name",     required:true  },
  { key:"positionType",     label:"Position Type",     required:false },
  { key:"resourceType",     label:"Type of Resource",  required:false },
  { key:"resourceCategory", label:"Resource Category", required:false },
  { key:"department",       label:"Department",        required:false },
  { key:"manager",          label:"Manager",           required:false },
  { key:"company",          label:"Company",           required:false },
  { key:"role",             label:"Role",              required:false },
  { key:"skills",           label:"Skills",            required:false },
  { key:"taskforce",        label:"Taskforce",         required:false },
  { key:"onLeave",          label:"On Leave",          required:false },
  { key:"startMonth",       label:"Start Month",       required:false },
  { key:"startYear",        label:"Start Year",        required:false },
  { key:"endMonth",         label:"End Month",         required:false },
  { key:"endYear",          label:"End Year",          required:false },
  { key:"location",         label:"Location",          required:false },
  { key:"program",          label:"Program",           required:false },
  { key:"resigned",         label:"Resigned",          required:false },
];

function parseBool(v: any): boolean {
  return ["yes","true","1","on leave","resigned"].includes(String(v).toLowerCase().trim());
}

const C = {
  bg:"#020617", surface:"#1e293b", surfaceDeep:"#0f172a", border:"#334155",
  text:"#f1f5f9", muted:"#94a3b8", faint:"#475569",
  blue:"#38bdf8", pink:"#f472b6", purple:"#a78bfa",
  green:"#22c55e", red:"#ef4444", orange:"#fb923c", teal:"#2dd4bf",
};

function Badge({ v, map }: { v: string; map: Record<string, [string,string]> }) {
  const [bg, color] = map[v] || ["#334155","#94a3b8"];
  return <span style={{ background:bg, color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{v}</span>;
}
const POS_COLORS: Record<string,[string,string]> = {
  "Onboarded":["#0c4a6e","#38bdf8"],"Open":["#1a3a1a","#22c55e"],"On Hold":["#3b2a00","#fb923c"],"Closed":["#2a0a2a","#a78bfa"],
};
const TYPE_COLORS: Record<string,[string,string]> = {
  "Internal":["#0c4a6e","#38bdf8"],"External":["#4a044e","#f472b6"],
};
const CAT_COLORS: Record<string,[string,string]> = {
  "Cat 2":["#0c4a6e","#38bdf8"],"Cat 3":["#1a3a1a","#22c55e"],"Cat 4":["#2a0a2a","#a78bfa"],
};

function ChartModal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300 }} onClick={onClose}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:680, maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{title}</div>
          <button onClick={onClose} style={{ background:"#3b0a0a", color:C.red, border:`1px solid ${C.red}`, borderRadius:7, padding:"5px 14px", cursor:"pointer", fontSize:12, fontWeight:700 }}>✕ Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type SubItem = { label:string; value:number; color:string; onClick?:()=>void };
function StatCard({ label, value, sub, color, onClick, subItems }: { label:string; value:string|number; sub?:string; color?:string; onClick?:()=>void; subItems?:SubItem[] }) {
  return (
    <div onClick={onClick} style={{ background:color?C.surfaceDeep:C.surface, border:`1px solid ${color||C.border}`, borderRadius:12, padding:"18px 22px", minWidth:0, cursor:onClick?"pointer":"default" }}
      onMouseOver={e=>{ if(onClick)(e.currentTarget as HTMLDivElement).style.opacity="0.8"; }}
      onMouseOut={e=>{ if(onClick)(e.currentTarget as HTMLDivElement).style.opacity="1"; }}>
      <div style={{ fontSize:26, fontWeight:800, color:color||C.text, fontFamily:"monospace", letterSpacing:-1 }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:4, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:color||C.faint, marginTop:4 }}>{sub}</div>}
      {subItems && subItems.length>0 && (
        <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:10, display:"flex", flexDirection:"column", gap:6 }}>
          {subItems.map((s,i) => (
            <div key={i} onClick={e=>{ e.stopPropagation(); s.onClick?.(); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:s.onClick?"pointer":"default", padding:"3px 6px", borderRadius:6 }}
              onMouseOver={e=>{ if(s.onClick)(e.currentTarget as HTMLDivElement).style.background=C.border; }}
              onMouseOut={e=>{ (e.currentTarget as HTMLDivElement).style.background="transparent"; }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:s.color }} />
                <span style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5 }}>{s.label}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:s.color, fontFamily:"monospace" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
      {onClick && <div style={{ fontSize:10, color:color||C.blue, marginTop:8 }}>Click to view records →</div>}
    </div>
  );
}

function HBar({ data, color, max:maxOverride, onClickRow, previewCount=5, title }: {
  data:{label:string;value:number}[]; color?:string; max?:number;
  onClickRow?:(l:string)=>void; previewCount?:number; title?:string;
}) {
  const [expanded, setExpanded] = useState(false);
  const max = maxOverride||Math.max(...data.map(d=>d.value),1);
  const preview = data.slice(0,previewCount);
  const hasMore = data.length>previewCount;
  const renderBars = (rows:{label:string;value:number}[]) => (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {rows.map((d,i) => (
        <div key={i} onClick={()=>d.value>0&&onClickRow?.(d.label)}
          style={{ display:"flex", alignItems:"center", gap:8, cursor:d.value>0&&onClickRow?"pointer":"default", borderRadius:4, padding:"2px 0" }}
          onMouseOver={e=>{ if(d.value>0&&onClickRow)(e.currentTarget as HTMLDivElement).style.background=C.surfaceDeep; }}
          onMouseOut={e=>{ (e.currentTarget as HTMLDivElement).style.background="transparent"; }}>
          <div style={{ width:120, fontSize:11, color:C.muted, textAlign:"right", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.label}</div>
          <div style={{ flex:1, background:C.surfaceDeep, borderRadius:3, height:18 }}>
            <div style={{ width:`${(d.value/max)*100}%`, background:color||C.blue, height:"100%", borderRadius:3, minWidth:d.value>0?6:0, transition:"width 0.4s" }} />
          </div>
          <div style={{ width:24, fontSize:11, color:C.text, fontWeight:700, fontFamily:"monospace" }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
  if (!data.length) return <div style={{ color:C.faint, fontSize:13 }}>No data</div>;
  return (
    <div>
      {renderBars(preview)}
      {hasMore && <button onClick={()=>setExpanded(true)} style={{ marginTop:10, background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, padding:"5px 12px", cursor:"pointer", fontSize:11, width:"100%" }}>+ {data.length-previewCount} more — click to expand</button>}
      {expanded && <ChartModal title={title||"Full Chart"} onClose={()=>setExpanded(false)}>{renderBars(data)}</ChartModal>}
    </div>
  );
}

function DonutChart({ slices, onClickSlice, title }: { slices:{label:string;value:number;color:string}[]; onClickSlice?:(l:string)=>void; title?:string }) {
  const [expanded, setExpanded] = useState(false);
  const total = slices.reduce((s,x)=>s+x.value,0);
  if (!total) return <div style={{ color:C.faint, fontSize:13 }}>No data</div>;
  const renderDonut = (sz:number=136) => {
    const rr=sz*0.38,ccx=sz/2,ccy=sz/2,cc=2*Math.PI*rr; let off=0;
    return (
      <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
        <svg width={sz} height={sz}>
          <circle cx={ccx} cy={ccy} r={rr} fill="none" stroke={C.surfaceDeep} strokeWidth={18} />
          {slices.map((s,i)=>{ const dash=(s.value/total)*cc; const el=<circle key={i} cx={ccx} cy={ccy} r={rr} fill="none" stroke={s.color} strokeWidth={18} strokeDasharray={`${dash} ${cc}`} strokeDashoffset={-off} strokeLinecap="butt" transform={`rotate(-90 ${ccx} ${ccy})`} style={{ cursor:s.value>0&&onClickSlice?"pointer":"default" }} onMouseOver={e=>{if(s.value>0&&onClickSlice)(e.target as SVGCircleElement).style.opacity="0.7";}} onMouseOut={e=>{(e.target as SVGCircleElement).style.opacity="1";}} onClick={()=>{s.value>0&&onClickSlice?.(s.label);setExpanded(false);}}/>; off+=dash; return el; })}
          <text x={ccx} y={ccy-5} textAnchor="middle" fill={C.text} fontSize={18} fontWeight={800} fontFamily="monospace">{total}</text>
          <text x={ccx} y={ccy+13} textAnchor="middle" fill={C.muted} fontSize={9}>TOTAL</text>
        </svg>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {slices.map((s,i)=>(
            <div key={i} onClick={()=>{s.value>0&&onClickSlice?.(s.label);setExpanded(false);}} style={{ display:"flex", alignItems:"center", gap:7, cursor:s.value>0&&onClickSlice?"pointer":"default", padding:"2px 4px", borderRadius:4 }} onMouseOver={e=>{if(s.value>0&&onClickSlice)(e.currentTarget as HTMLDivElement).style.background=C.surfaceDeep;}} onMouseOut={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
              <div style={{ width:9, height:9, borderRadius:"50%", background:s.color }} />
              <span style={{ color:C.muted, fontSize:12 }}>{s.label}: <b style={{ color:C.text }}>{s.value}</b> <span style={{ color:C.faint }}>({total?Math.round(s.value/total*100):0}%)</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div>
      {renderDonut(136)}
      <button onClick={()=>setExpanded(true)} style={{ marginTop:10, background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, padding:"5px 12px", cursor:"pointer", fontSize:11, width:"100%" }}>⛶ Expand chart</button>
      {expanded && <ChartModal title={title||"Chart"} onClose={()=>setExpanded(false)}>{renderDonut(220)}</ChartModal>}
    </div>
  );
}

function TrendChart({ data }: { data:{month:string;internal:number;external:number;delta:number}[] }) {
  if (!data.length) return <div style={{ color:C.faint, fontSize:13 }}>No trend data yet</div>;
  const maxVal=Math.max(...data.flatMap(d=>[d.internal,d.external]),1);
  const W=520,H=130,pad={l:30,r:10,t:10,b:24};
  const gW=W-pad.l-pad.r,gH=H-pad.t-pad.b;
  const xs=data.map((_,i)=>pad.l+(i/Math.max(data.length-1,1))*gW);
  const yFor=(v:number)=>pad.t+gH-(v/maxVal)*gH;
  const path=(vals:number[])=>vals.map((v,i)=>`${i===0?"M":"L"}${xs[i]},${yFor(v)}`).join(" ");
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
        {[0,0.5,1].map((t,i)=><line key={i} x1={pad.l} x2={W-pad.r} y1={pad.t+gH*(1-t)} y2={pad.t+gH*(1-t)} stroke={C.border} strokeWidth={0.5}/>)}
        <path d={path(data.map(d=>d.internal))} fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <path d={path(data.map(d=>d.external))} fill="none" stroke={C.pink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((d,i)=><text key={i} x={xs[i]} y={H-4} textAnchor="middle" fill={C.faint} fontSize={9}>{d.month}</text>)}
        {data.map((d,i)=><circle key={`i${i}`} cx={xs[i]} cy={yFor(d.internal)} r={3} fill={C.blue}/>)}
        {data.map((d,i)=><circle key={`e${i}`} cx={xs[i]} cy={yFor(d.external)} r={3} fill={C.pink}/>)}
      </svg>
      <div style={{ display:"flex", gap:4, marginTop:8, overflowX:"auto" }}>
        {data.map((d,i)=>(
          <div key={i} style={{ flex:1, textAlign:"center", minWidth:52 }}>
            <div style={{ fontSize:9, color:C.faint, marginBottom:2 }}>{d.month}</div>
            <div style={{ fontSize:11, fontWeight:700, fontFamily:"monospace", color:d.delta>0?C.green:d.delta<0?C.red:C.faint }}>{d.delta>0?`+${d.delta}`:d.delta===0?"—":d.delta}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:C.faint, marginTop:2 }}>↕ Net headcount change per month</div>
    </div>
  );
}

function MonthlyDeltaCard({ resources, dMonth, dYear }: { resources:Resource[]; dMonth:string; dYear:string }) {
  const data = useMemo(()=>{
    const anchor = dYear&&dMonth?new Date(parseInt(dYear),MONTHS.indexOf(dMonth),1):dYear?new Date(parseInt(dYear),11,1):new Date();
    return Array.from({length:12},(_,idx)=>{
      const d=new Date(anchor.getFullYear(),anchor.getMonth()-(11-idx),1);
      const mn=MONTHS[d.getMonth()],yr=String(d.getFullYear());
      const added=resources.filter(r=>r.startMonth===mn&&r.startYear===yr&&r.positionType!=="Closed"&&r.positionType!=="On Hold").length;
      const removed=resources.filter(r=>r.endMonth===mn&&r.endYear===yr).length;
      return { label:`${mn} '${yr.slice(2)}`, added, removed, net:added-removed };
    });
  },[resources,dMonth,dYear]);
  const maxVal=Math.max(...data.flatMap(d=>[d.added,d.removed]),1);
  return (
    <div>
      <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:80, marginBottom:4, overflowX:"auto" }}>
        {data.map((d,i)=>(
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", alignItems:"center", gap:1, height:"100%", minWidth:36 }}>
            {d.added>0&&<div title={`Added: ${d.added}`} style={{ width:"60%", height:`${(d.added/maxVal)*100}%`, background:C.green, borderRadius:"2px 2px 0 0", minHeight:3 }}/>}
            {d.removed>0&&<div title={`Removed: ${d.removed}`} style={{ width:"60%", height:`${(d.removed/maxVal)*70}%`, background:C.red, borderRadius:"2px 2px 0 0", minHeight:3, opacity:0.8 }}/>}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:3, overflowX:"auto" }}>
        {data.map((d,i)=>(
          <div key={i} style={{ flex:1, textAlign:"center", minWidth:36 }}>
            <div style={{ fontSize:8, color:C.faint, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.label}</div>
            <div style={{ fontSize:10, fontWeight:700, fontFamily:"monospace", color:d.net>0?C.green:d.net<0?C.red:C.faint }}>{d.net>0?`+${d.net}`:d.net===0?"0":d.net}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:16, marginTop:10 }}>
        {[[C.green,"Added"],[C.red,"Removed"]].map(([c,l])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, background:c, borderRadius:2 }}/><span style={{ color:C.faint, fontSize:11 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type IStep="upload"|"sheet"|"mapping"|"done";
function ImportWizard({ onClose, onImport }: { onClose:()=>void; onImport:(rows:Resource[],mode:"replace"|"append")=>void }) {
  const [step,setStep]=useState<IStep>("upload");
  const [wb,setWb]=useState<any>(null);
  const [sheets,setSheets]=useState<string[]>([]);
  const [sheet,setSheet]=useState("");
  const [headers,setHeaders]=useState<string[]>([]);
  const [preview,setPreview]=useState<any[][]>([]);
  const [mapping,setMapping]=useState<Record<string,string>>({});
  const [mode,setMode]=useState<"replace"|"append">("append");
  const [count,setCount]=useState(0);
  const fileRef=useRef<HTMLInputElement>(null);
  const si: React.CSSProperties={ background:C.surfaceDeep, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:13, fontFamily:"sans-serif", outline:"none", width:"100%", boxSizing:"border-box" };
  const B=(c?:string):React.CSSProperties=>({ background:c||C.blue, color:c?"#fff":C.surfaceDeep, border:"none", borderRadius:8, padding:"9px 22px", fontWeight:700, cursor:"pointer", fontSize:13 });
  const handleFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file)return;
    const buf=await file.arrayBuffer();
    const workbook=XLSX.read(buf,{type:"array"});
    setWb(workbook);setSheets(workbook.SheetNames);setSheet(workbook.SheetNames[0]);setStep("sheet");
  };
  const confirmSheet=()=>{
    const ws=wb.Sheets[sheet];
    const data:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
    const hdrs=(data[0]||[]).map(String);
    setHeaders(hdrs);setPreview(data.slice(1,4));
    const auto:Record<string,string>={};
    hdrs.forEach(h=>{
      const hl=h.toLowerCase().replace(/[\s_\-()/]/g,"");
      const match=APP_FIELDS.find(f=>{ const fk=f.key.toLowerCase();const fl=f.label.toLowerCase().replace(/[\s_\-()/]/g,""); return hl===fk||hl.includes(fk)||fk.includes(hl)||hl===fl||hl.includes(fl)||fl.includes(hl); });
      auto[h]=match?match.key:"__skip__";
    });
    setMapping(auto);setStep("mapping");
  };
  const mapped=Object.values(mapping).filter(v=>v!=="__skip__");
  const missing=APP_FIELDS.filter(f=>f.required&&!mapped.includes(f.key));
  const doImport=()=>{
    const ws=wb.Sheets[sheet];
    const data:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
    const hdrs=(data[0]||[]).map(String);
    const get=(row:any[],field:string)=>{ const col=hdrs.find(h=>mapping[h]===field); return col?row[hdrs.indexOf(col)]:undefined; };
    const rows:Resource[]=data.slice(1).filter((r:any[])=>r.some((c:any)=>c!=="")).map((row,idx)=>({
      id:String(Date.now()+idx), name:String(get(row,"name")||""), positionType:String(get(row,"positionType")||"Onboarded"),
      resourceType:String(get(row,"resourceType")||"Internal"), resourceCategory:String(get(row,"resourceCategory")||""),
      department:String(get(row,"department")||""), manager:String(get(row,"manager")||""),
      company:String(get(row,"company")||""), role:String(get(row,"role")||""), skills:String(get(row,"skills")||""),
      taskforce:String(get(row,"taskforce")||""), onLeave:parseBool(get(row,"onLeave")),
      startMonth:String(get(row,"startMonth")||""), startYear:String(get(row,"startYear")||""),
      endMonth:String(get(row,"endMonth")||""), endYear:String(get(row,"endYear")||""),
      location:String(get(row,"location")||""), program:String(get(row,"program")||""), resigned:parseBool(get(row,"resigned")),
    })).filter(r=>r.name);
    setCount(rows.length);onImport(rows,mode);setStep("done");
  };
  const STEP_LABELS=["1. Upload","2. Select Sheet","3. Map Columns","4. Done"];
  const STEPS:IStep[]=["upload","sheet","mapping","done"];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:28, width:700, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", marginBottom:24, borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
          {STEPS.map((s,i)=><div key={s} style={{ flex:1, padding:"9px 0", textAlign:"center", fontSize:11, fontWeight:700, background:step===s?C.blue:STEPS.indexOf(step)>i?"#0c4a6e":C.surfaceDeep, color:step===s?C.surfaceDeep:STEPS.indexOf(step)>i?C.blue:C.faint, borderRight:i<3?`1px solid ${C.border}`:"none", textTransform:"uppercase" }}>{STEPS.indexOf(step)>i?"✓ ":""}{STEP_LABELS[i]}</div>)}
        </div>
        {step==="upload"&&(<div><div style={{ fontSize:17,fontWeight:800,marginBottom:6 }}>Upload your Excel or CSV file</div><div style={{ color:C.faint,fontSize:13,marginBottom:22 }}>Column names don't need to match — you'll map them in Step 3.</div><div onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${C.border}`,borderRadius:14,padding:"48px 24px",textAlign:"center",cursor:"pointer" }} onMouseOver={e=>(e.currentTarget.style.borderColor=C.blue)} onMouseOut={e=>(e.currentTarget.style.borderColor=C.border)}><div style={{ fontSize:40,marginBottom:10 }}>📂</div><div style={{ fontWeight:700,color:C.text }}>Click to choose a file</div><div style={{ color:C.faint,fontSize:12,marginTop:6 }}>.xlsx · .xls · .csv</div><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display:"none" }}/></div><div style={{ display:"flex",justifyContent:"flex-end",marginTop:16 }}><button onClick={onClose} style={B(C.border)}>Cancel</button></div></div>)}
        {step==="sheet"&&(<div><div style={{ fontSize:17,fontWeight:800,marginBottom:6 }}>Select the sheet to import</div><div style={{ color:C.faint,fontSize:13,marginBottom:20 }}>Choose which tab contains your resource data.</div><div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>{sheets.map(s=><div key={s} onClick={()=>setSheet(s)} style={{ padding:"13px 16px",borderRadius:10,border:`2px solid ${sheet===s?C.blue:C.border}`,background:sheet===s?"#0c4a6e":C.surfaceDeep,cursor:"pointer",color:sheet===s?C.blue:C.muted,fontWeight:sheet===s?700:400 }}>📋 {s}</div>)}</div><div style={{ display:"flex",justifyContent:"space-between" }}><button onClick={()=>setStep("upload")} style={B(C.border)}>← Back</button><button onClick={confirmSheet} style={B()}>Next →</button></div></div>)}
        {step==="mapping"&&(<div><div style={{ fontSize:17,fontWeight:800,marginBottom:4 }}>Map your columns to app fields</div><div style={{ color:C.faint,fontSize:13,marginBottom:18 }}>Auto-matched where possible. * = required.</div><div style={{ background:C.surfaceDeep,borderRadius:10,padding:14,marginBottom:18,overflowX:"auto" }}><div style={{ fontSize:11,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>📄 Preview — first 3 rows</div><table style={{ borderCollapse:"collapse",fontSize:12,minWidth:"100%" }}><thead><tr>{headers.map(h=><th key={h} style={{ padding:"6px 10px",color:C.blue,textAlign:"left",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead><tbody>{preview.map((row,i)=><tr key={i}>{headers.map((_,j)=><td key={j} style={{ padding:"5px 10px",color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis" }}>{String(row[j]??"")}</td>)}</tr>)}</tbody></table></div><div style={{ background:C.surfaceDeep,borderRadius:10,padding:16,marginBottom:16 }}><div style={{ display:"grid",gridTemplateColumns:"1fr 24px 1fr",gap:"9px 10px",alignItems:"center" }}><div style={{ fontSize:11,color:C.faint,textTransform:"uppercase",fontWeight:700 }}>Excel Column</div><div/><div style={{ fontSize:11,color:C.faint,textTransform:"uppercase",fontWeight:700 }}>App Field</div>{headers.map(h=>(<><div key={h+"l"} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 11px",fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h}</div><div style={{ color:mapping[h]&&mapping[h]!=="__skip__"?C.blue:C.border,fontSize:16,textAlign:"center",fontWeight:700 }}>→</div><select key={h+"r"} value={mapping[h]||"__skip__"} onChange={e=>setMapping(m=>({...m,[h]:e.target.value}))} style={{ ...si,borderColor:mapping[h]&&mapping[h]!=="__skip__"?C.blue:C.border }}><option value="__skip__">— Skip —</option>{APP_FIELDS.map(f=><option key={f.key} value={f.key}>{f.label}{f.required?" *":""}</option>)}</select></>))}</div></div>{missing.length>0&&<div style={{ background:"#3b0a0a",border:`1px solid ${C.red}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:"#fca5a5",marginBottom:14 }}>⚠️ Required not mapped: <b>{missing.map(f=>f.label).join(", ")}</b></div>}<div style={{ marginBottom:20 }}><div style={{ fontSize:11,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:700 }}>Import Mode</div><div style={{ display:"flex",gap:10 }}>{([["append","➕ Add to existing","Keep current records"],["replace","🔄 Replace all","Wipe current, import fresh"]] as const).map(([v,label,desc])=>(<div key={v} onClick={()=>setMode(v)} style={{ flex:1,padding:"12px 14px",borderRadius:10,cursor:"pointer",border:`2px solid ${mode===v?(v==="replace"?C.red:C.blue):C.border}`,background:mode===v?(v==="replace"?"#3b0a0a":"#0c4a6e"):C.surfaceDeep }}><div style={{ fontWeight:700,fontSize:13,color:mode===v?(v==="replace"?"#fca5a5":C.blue):C.muted }}>{label}</div><div style={{ fontSize:11,color:C.faint,marginTop:4 }}>{desc}</div></div>))}</div></div><div style={{ display:"flex",justifyContent:"space-between" }}><button onClick={()=>setStep("sheet")} style={B(C.border)}>← Back</button><button onClick={doImport} disabled={missing.length>0} style={{ ...B(missing.length>0?"#1e293b":undefined),opacity:missing.length>0?0.4:1 }}>Import →</button></div></div>)}
        {step==="done"&&(<div style={{ textAlign:"center",padding:"28px 0" }}><div style={{ fontSize:52,marginBottom:14 }}>✅</div><div style={{ fontSize:20,fontWeight:800,marginBottom:10 }}>Import Successful!</div><div style={{ color:C.muted,fontSize:15,marginBottom:28 }}><b style={{ color:C.blue }}>{count} records</b> {mode==="replace"?"imported (replaced all previous data)":"added to existing data"}.</div><button onClick={onClose} style={B()}>Done — View Resources</button></div>)}
      </div>
    </div>
  );
}

export default function App() {
  const [resources,setResources]=useState<Resource[]>([]);
  const [tab,setTab]=useState<"dashboard"|"resources">("dashboard");
  const [showForm,setShowForm]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState<Resource>(EMPTY);
  const [search,setSearch]=useState("");
  const [fPos,setFPos]=useState("");
  const [fType,setFType]=useState("");
  const [fCo,setFCo]=useState("");
  const [dMonth,setDMonth]=useState("");
  const [dYear,setDYear]=useState("");
  const [sortCol,setSortCol]=useState("name");
  const [sortDir,setSortDir]=useState<"asc"|"desc">("asc");
  const [toast,setToast]=useState<{msg:string;type:string}|null>(null);
  const [loading,setLoading]=useState(true);
  const [drillLabel,setDrillLabel]=useState("");
  const [drillFilter,setDrillFilter]=useState<((r:Resource)=>boolean)|null>(null);

  const drilldown=(label:string,filterFn:(r:Resource)=>boolean)=>{ setDrillLabel(label);setDrillFilter(()=>filterFn);setSearch("");setFPos("");setFType("");setFCo("");setTab("resources"); };
  const clearDrilldown=()=>{ setDrillLabel("");setDrillFilter(null); };

  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"resources"),snap=>{
      setResources(snap.docs.map(d=>({...d.data(),id:d.id} as Resource)));
      setLoading(false);
    },err=>{ console.error(err);setLoading(false); });
    return ()=>unsub();
  },[]);

  const showToast=(msg:string,type="success")=>{ setToast({msg,type});setTimeout(()=>setToast(null),3000); };

  const handleImport=async(rows:Resource[],mode:"replace"|"append")=>{
    try {
      const batch=writeBatch(db);
      if(mode==="replace"){ const snap=await getDocs(collection(db,"resources")); snap.docs.forEach(d=>batch.delete(d.ref)); }
      rows.forEach(r=>{ const{id,...data}=r; batch.set(doc(collection(db,"resources")),data); });
      await batch.commit();
      showToast(`${rows.length} records imported ✓`);setShowImport(false);setTab("resources");
    } catch{ showToast("Import failed — check Firestore rules","error"); }
  };

  const stats=useMemo(()=>{
    const inPeriod=(r:Resource)=>{
      if(!dMonth&&!dYear)return true;
      const sy=parseInt(r.startYear||"0"),sm=MONTHS.indexOf(r.startMonth);
      const ey=r.endYear?parseInt(r.endYear):9999,em=r.endMonth?MONTHS.indexOf(r.endMonth):11;
      const fy=dYear?parseInt(dYear):null,fm=dMonth?MONTHS.indexOf(dMonth):null;
      if(fy!==null&&fm!==null)return(sy<fy||(sy===fy&&(sm===-1||sm<=fm)))&&(ey>fy||(ey===fy&&em>=fm));
      if(fy!==null)return sy<=fy&&ey>=fy;
      if(fm!==null)return(sm===-1||sm<=fm)&&em>=fm;
      return true;
    };
    const base=resources.filter(inPeriod);
    // On Hold removed from total — only Onboarded + Open count
    const activeBase=base.filter(r=>r.positionType!=="Closed"&&r.positionType!=="On Hold");
    const closed=base.filter(r=>r.positionType==="Closed").length;
    const onHold=base.filter(r=>r.positionType==="On Hold").length;
    const total=activeBase.length;
    const internal=activeBase.filter(r=>r.resourceType==="Internal").length;
    const external=activeBase.filter(r=>r.resourceType==="External").length;
    const onboarded=activeBase.filter(r=>r.positionType==="Onboarded").length;
    const open=activeBase.filter(r=>r.positionType==="Open").length;
    const resigned=activeBase.filter(r=>r.resigned).length;
    const onLeave=activeBase.filter(r=>r.onLeave).length;
    const byRole=ROLES.map(r=>({label:r,value:activeBase.filter(x=>x.role===r).length})).filter(r=>r.value>0).sort((a,b)=>b.value-a.value);
    const byCompany=COMPANIES.map(c=>({label:c,value:activeBase.filter(x=>x.company===c).length}));
    const byLocation=LOCATIONS.map(l=>({label:l,value:activeBase.filter(x=>x.location===l).length})).filter(l=>l.value>0);
    const byCategory=RESOURCE_CATEGORIES.map(c=>({label:c,value:activeBase.filter(x=>x.resourceCategory===c).length}));
    const byDept=DEPARTMENTS.map(d=>({label:d,value:activeBase.filter(x=>x.department===d).length}));
    const anchor=dYear&&dMonth?new Date(parseInt(dYear),MONTHS.indexOf(dMonth),1):dYear?new Date(parseInt(dYear),11,1):new Date();
    let prevCount=0;
    const trend=Array.from({length:6},(_,idx)=>{
      const d=new Date(anchor.getFullYear(),anchor.getMonth()-(5-idx),1);
      const mn=MONTHS[d.getMonth()],yr=String(d.getFullYear());
      const active=resources.filter(r=>{
        const sy=parseInt(r.startYear||"0"),sm=MONTHS.indexOf(r.startMonth);
        const ey=r.endYear?parseInt(r.endYear):9999,em=r.endMonth?MONTHS.indexOf(r.endMonth):11;
        return(sy<d.getFullYear()||(sy===d.getFullYear()&&(sm===-1||sm<=d.getMonth())))&&(ey>d.getFullYear()||(ey===d.getFullYear()&&em>=d.getMonth()))&&r.positionType!=="Closed"&&r.positionType!=="On Hold";
      });
      const count=active.length;
      const delta=idx===0?0:count-prevCount; prevCount=count;
      return{month:`${mn} ${yr.slice(2)}`,internal:active.filter(r=>r.resourceType==="Internal").length,external:active.filter(r=>r.resourceType==="External").length,delta};
    });
    return{total,internal,external,onboarded,open,onHold,closed,resigned,onLeave,byRole,byCompany,byLocation,byCategory,byDept,trend,base,activeBase};
  },[resources,dMonth,dYear]);

  const filtered=useMemo(()=>{
    let l=resources.filter(r=>{
      const q=search.toLowerCase();
      return(!q||r.name.toLowerCase().includes(q)||r.role.toLowerCase().includes(q)||r.company.toLowerCase().includes(q)||r.skills.toLowerCase().includes(q)||(r.manager||"").toLowerCase().includes(q))
        &&(!fPos||r.positionType===fPos)&&(!fType||r.resourceType===fType)&&(!fCo||r.company===fCo)&&(drillFilter?drillFilter(r):true);
    });
    l.sort((a:any,b:any)=>{ let av=a[sortCol]??"",bv=b[sortCol]??""; if(typeof av==="boolean"){av=av?1:0;bv=bv?1:0;} return av<bv?(sortDir==="asc"?-1:1):av>bv?(sortDir==="asc"?1:-1):0; });
    return l;
  },[resources,search,fPos,fType,fCo,sortCol,sortDir,drillFilter]);

  const hs=(col:string)=>{ if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");} };
  const openAdd=()=>{ setForm({...EMPTY});setEditId(null);setShowForm(true); };
  const openEdit=(r:Resource)=>{ setForm({...r});setEditId(r.id);setShowForm(true); };
  const saveForm=async()=>{
    if(!form.name){showToast("Resource Name is required","error");return;}
    try{
      const{id,...data}=form;
      if(editId&&editId.length>0){await updateDoc(doc(db,"resources",String(editId)),data);showToast("Updated ✓");}
      else{await addDoc(collection(db,"resources"),data);showToast("Added ✓");}
      setShowForm(false);
    }catch(e:any){showToast(`Save failed: ${e?.message||"check Firestore rules"}`,"error");}
  };
  const delRes=async(id:string)=>{
    if(!confirm("Delete this resource?"))return;
    try{await deleteDoc(doc(db,"resources",id));showToast("Deleted","error");}
    catch(e:any){showToast(`Delete failed: ${e?.message}`,"error");}
  };
  const exportCSV=()=>{
    const h=["Name","Position Type","Resource Type","Resource Category","Department","Manager","Company","Role","Skills","Taskforce","On Leave","Start Month","Start Year","End Month","End Year","Location","Program","Resigned"];
    const rows=resources.map(r=>[r.name,r.positionType,r.resourceType,r.resourceCategory,r.department,r.manager,r.company,r.role,r.skills,r.taskforce,r.onLeave?"Yes":"No",r.startMonth,r.startYear,r.endMonth,r.endYear,r.location,r.program,r.resigned?"Yes":"No"]);
    const csv=[h,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="resources.csv";a.click();
    showToast("Exported ✓");
  };

  const inp:React.CSSProperties={background:C.surfaceDeep,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 11px",fontSize:13,fontFamily:"sans-serif",outline:"none",width:"100%",boxSizing:"border-box"};
  const lbl:React.CSSProperties={fontSize:11,color:C.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:3,display:"block"};
  const btn=(c?:string):React.CSSProperties=>({background:c||C.blue,color:c?"#fff":C.surfaceDeep,border:"none",borderRadius:8,padding:"8px 18px",fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:"sans-serif"});
  const Card=({title,children}:{title:string;children:React.ReactNode})=>(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:13,padding:20}}>
      <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"0 28px",display:"flex",alignItems:"center",gap:28,height:58}}>
        <div style={{fontFamily:"DM Mono,monospace",fontWeight:700,fontSize:17,color:C.blue,letterSpacing:-1}}>RESOURCER</div>
        {(["dashboard","resources"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?C.text:C.faint,cursor:"pointer",fontSize:13,fontWeight:tab===t?700:400,padding:"0 4px",borderBottom:tab===t?`2px solid ${C.blue}`:"2px solid transparent",height:58,fontFamily:"sans-serif",textTransform:"capitalize"}}>
            {t==="dashboard"?"📊 Dashboard":"👥 Resources"}
          </button>
        ))}
        <div style={{marginLeft:"auto",fontSize:11,color:C.border,fontFamily:"monospace"}}>
          {loading?"⏳ Connecting to Firestore…":`☁️ Firebase · ${resources.length} records`}
        </div>
      </div>

      {toast&&<div style={{position:"fixed",top:18,right:18,background:toast.type==="error"?C.red:C.green,color:"#fff",padding:"10px 20px",borderRadius:10,fontWeight:600,zIndex:999,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>{toast.msg}</div>}
      {showImport&&<ImportWizard onClose={()=>setShowImport(false)} onImport={handleImport}/>}

      {tab==="dashboard"&&(
        <div style={{padding:28}}>
          {loading&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 0",color:C.muted,fontSize:14}}><div style={{width:18,height:18,border:`2px solid ${C.border}`,borderTopColor:C.blue,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Loading from Firestore…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{fontSize:21,fontWeight:800,marginBottom:4}}>Program Dashboard</div>
              <div style={{color:C.faint,fontSize:13}}>{dMonth||dYear?`Showing: ${dMonth||"All months"} ${dYear||"All years"}`:"Real-time overview · all time"}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px"}}>
              <span style={{fontSize:12,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>📅 Period</span>
              <select value={dMonth} onChange={e=>setDMonth(e.target.value)} style={{background:C.surfaceDeep,border:`1px solid ${C.border}`,borderRadius:7,color:dMonth?C.blue:C.faint,padding:"7px 10px",fontSize:13,outline:"none",fontWeight:dMonth?700:400}}><option value="">All Months</option>{MONTHS.map(m=><option key={m}>{m}</option>)}</select>
              <select value={dYear} onChange={e=>setDYear(e.target.value)} style={{background:C.surfaceDeep,border:`1px solid ${C.border}`,borderRadius:7,color:dYear?C.blue:C.faint,padding:"7px 10px",fontSize:13,outline:"none",fontWeight:dYear?700:400}}><option value="">All Years</option>{YEARS.map(y=><option key={y}>{y}</option>)}</select>
              {(dMonth||dYear)&&<button onClick={()=>{setDMonth("");setDYear("");}} style={{background:"#3b0a0a",color:C.red,border:`1px solid ${C.red}`,borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕ Clear</button>}
            </div>
          </div>

          {/* Stat cards — On Hold excluded from total */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:14,marginBottom:28}}>
            <StatCard label="Total Resources" value={stats.total} sub="Onboarded + Open" color={C.blue} onClick={()=>drilldown("Active resources",r=>r.positionType!=="Closed"&&r.positionType!=="On Hold")}/>
            <StatCard label="Onboarded" value={stats.onboarded} sub={`${stats.total?Math.round(stats.onboarded/stats.total*100):0}% of total`} onClick={()=>drilldown("Onboarded",r=>r.positionType==="Onboarded")} subItems={[{label:"On Leave",value:stats.onLeave,color:C.orange,onClick:()=>drilldown("On Leave",r=>r.onLeave)},{label:"Resigned",value:stats.resigned,color:C.red,onClick:()=>drilldown("Resigned",r=>r.resigned)}]}/>
            <StatCard label="Open Positions" value={stats.open} color={C.green} sub="Hiring pipeline" onClick={()=>drilldown("Open positions",r=>r.positionType==="Open")}/>
            <StatCard label="On Hold" value={stats.onHold} color={C.orange} sub="Not in total" onClick={()=>drilldown("On Hold",r=>r.positionType==="On Hold")}/>
            <StatCard label="Closed (ref)" value={stats.closed} color={C.purple} sub="Not in total" onClick={()=>drilldown("Closed",r=>r.positionType==="Closed")}/>
          </div>

          {/* Row 1 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.5fr",gap:18,marginBottom:18}}>
            <Card title="Internal vs External"><DonutChart title="Internal vs External" slices={[{label:"Internal",value:stats.internal,color:C.blue},{label:"External",value:stats.external,color:C.pink}]} onClickSlice={label=>drilldown(`Type: ${label}`,r=>r.resourceType===label)}/></Card>
            <Card title="Position Breakdown"><DonutChart title="Position Breakdown" slices={[{label:"Onboarded",value:stats.onboarded,color:C.blue},{label:"Open",value:stats.open,color:C.green},{label:"On Hold",value:stats.onHold,color:C.orange},{label:"Closed",value:stats.closed,color:C.purple}]} onClickSlice={label=>drilldown(`Position: ${label}`,r=>r.positionType===label)}/></Card>
            <Card title="Top 5 Roles (expand for all)"><HBar data={stats.byRole} color={C.purple} previewCount={5} title="All Roles in Team" onClickRow={label=>drilldown(`Role: ${label}`,r=>r.role===label)}/></Card>
          </div>

          {/* Row 2 */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:18,marginBottom:18}}>
            <Card title="Headcount Trend — last 6 months (↕ monthly delta below)"><TrendChart data={stats.trend}/><div style={{display:"flex",gap:16,marginTop:10}}>{[[C.blue,"Internal"],[C.pink,"External"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:3,background:c,borderRadius:2}}/><span style={{color:C.faint,fontSize:12}}>{l}</span></div>)}</div></Card>
            <Card title="By Company"><HBar data={stats.byCompany} color={C.blue} previewCount={5} title="By Company" onClickRow={label=>drilldown(`Company: ${label}`,r=>r.company===label)}/></Card>
            <Card title="By Location"><HBar data={stats.byLocation} color={C.orange} previewCount={5} title="By Location" onClickRow={label=>drilldown(`Location: ${label}`,r=>r.location===label)}/></Card>
          </div>

          {/* Row 3 — NEW: Category + Department */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:18}}>
            <Card title="By Resource Category">
              <DonutChart title="By Resource Category" slices={RESOURCE_CATEGORIES.map((c,i)=>({label:c,value:stats.byCategory[i]?.value||0,color:[C.blue,C.green,C.purple][i]}))} onClickSlice={label=>drilldown(`Category: ${label}`,r=>r.resourceCategory===label)}/>
            </Card>
            <Card title="By Department">
              <HBar data={stats.byDept} color={C.teal} previewCount={5} title="By Department" onClickRow={label=>drilldown(`Department: ${label}`,r=>r.department===label)}/>
            </Card>
            <Card title="Category × Resource Type">
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {RESOURCE_CATEGORIES.map((cat,ci)=>{
                  const cr=stats.activeBase.filter(r=>r.resourceCategory===cat);
                  const int=cr.filter(r=>r.resourceType==="Internal").length,ext=cr.filter(r=>r.resourceType==="External").length,tot=int+ext;
                  if(!tot)return null;
                  return(<div key={cat} style={{background:C.surfaceDeep,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:700,color:C.text}}>{cat}</span><span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{tot}</span></div>
                    <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden"}}>
                      {int>0&&<div style={{flex:int,background:C.blue}} title={`Internal: ${int}`}/>}
                      {ext>0&&<div style={{flex:ext,background:C.pink}} title={`External: ${ext}`}/>}
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:5}}>
                      <span style={{fontSize:10,color:C.blue}}>Int: {int}</span><span style={{fontSize:10,color:C.pink}}>Ext: {ext}</span>
                    </div>
                  </div>);
                  void ci;
                })}
                {stats.activeBase.filter(r=>r.resourceCategory).length===0&&<div style={{color:C.faint,fontSize:13}}>No category data yet</div>}
              </div>
            </Card>
          </div>

          {/* Row 4 — Monthly delta + Dept breakdown */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18,marginBottom:18}}>
            <Card title="📅 Monthly Positions Added vs Removed (last 12 months)">
              <MonthlyDeltaCard resources={resources} dMonth={dMonth} dYear={dYear}/>
            </Card>
            <Card title="Department × Position Type">
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {DEPARTMENTS.map(dept=>{
                  const dr=stats.activeBase.filter(r=>r.department===dept);
                  if(!dr.length)return null;
                  const onb=dr.filter(r=>r.positionType==="Onboarded").length,opn=dr.filter(r=>r.positionType==="Open").length;
                  return(<div key={dept} onClick={()=>drilldown(`Department: ${dept}`,r=>r.department===dept)} style={{background:C.surfaceDeep,borderRadius:8,padding:"8px 12px",cursor:"pointer"}} onMouseOver={e=>(e.currentTarget as HTMLDivElement).style.opacity="0.75"} onMouseOut={e=>(e.currentTarget as HTMLDivElement).style.opacity="1"}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:700,color:C.text}}>{dept}</span><span style={{fontSize:11,color:C.muted}}>{dr.length}</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{fontSize:10,color:C.blue}}>● {onb} Onboarded</span><span style={{fontSize:10,color:C.green}}>● {opn} Open</span></div>
                  </div>);
                })}
                {stats.activeBase.filter(r=>r.department).length===0&&<div style={{color:C.faint,fontSize:13}}>No department data yet</div>}
              </div>
            </Card>
          </div>

          {/* Row 5 — Open + Resigned */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            <Card title="🟢 Open Positions — Hiring Pipeline">
              {stats.activeBase.filter(r=>r.positionType==="Open").length===0?<div style={{color:C.faint,fontSize:13}}>No open positions{(dMonth||dYear)?" in this period":""}</div>
                :<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Role","Company","Dept","Taskforce"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:C.faint,borderBottom:`1px solid ${C.border}`,fontWeight:600}}>{h}</th>)}</tr></thead><tbody>{stats.activeBase.filter(r=>r.positionType==="Open").map((r,i)=><tr key={i} onClick={()=>drilldown(`Open: ${r.role||"?"}`,x=>x.id===r.id)} style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onMouseOver={e=>(e.currentTarget as HTMLTableRowElement).style.background=C.surfaceDeep} onMouseOut={e=>(e.currentTarget as HTMLTableRowElement).style.background="transparent"}><td style={{padding:"7px 10px",color:C.text}}>{r.role||"—"}</td><td style={{padding:"7px 10px",color:C.muted}}>{r.company}</td><td style={{padding:"7px 10px",color:C.muted}}>{r.department||"—"}</td><td style={{padding:"7px 10px",color:C.muted}}>{r.taskforce}</td></tr>)}</tbody></table>}
            </Card>
            <Card title="🔴 Recent Resignations">
              {stats.activeBase.filter(r=>r.resigned).length===0?<div style={{color:C.faint,fontSize:13}}>No resignations{(dMonth||dYear)?" in this period":""}</div>
                :<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Name","Role","Company","Type"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:C.faint,borderBottom:`1px solid ${C.border}`,fontWeight:600}}>{h}</th>)}</tr></thead><tbody>{stats.activeBase.filter(r=>r.resigned).map((r,i)=><tr key={i} onClick={()=>drilldown(`Resigned: ${r.name}`,x=>x.id===r.id)} style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onMouseOver={e=>(e.currentTarget as HTMLTableRowElement).style.background=C.surfaceDeep} onMouseOut={e=>(e.currentTarget as HTMLTableRowElement).style.background="transparent"}><td style={{padding:"7px 10px",color:C.text,fontWeight:600}}>{r.name}</td><td style={{padding:"7px 10px",color:C.muted}}>{r.role}</td><td style={{padding:"7px 10px",color:C.muted}}>{r.company}</td><td style={{padding:"7px 10px"}}><Badge v={r.resourceType} map={TYPE_COLORS}/></td></tr>)}</tbody></table>}
            </Card>
          </div>
        </div>
      )}

      {tab==="resources"&&(
        <div style={{padding:28}}>
          {drillFilter&&(<div style={{display:"flex",alignItems:"center",gap:12,background:"#0c4a6e",border:`1px solid ${C.blue}`,borderRadius:10,padding:"10px 16px",marginBottom:14}}><span style={{fontSize:13,color:C.blue,fontWeight:700}}>🔍 Drilldown:</span><span style={{fontSize:13,color:C.text}}>{drillLabel}</span><span style={{fontSize:12,color:C.muted}}>— {filtered.length} record{filtered.length!==1?"s":""}</span><button onClick={clearDrilldown} style={{marginLeft:"auto",background:"#3b0a0a",color:C.red,border:`1px solid ${C.red}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕ Clear filter</button></div>)}
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
            <input placeholder="🔍 Search name, role, company, manager…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,width:290}}/>
            <select value={fPos} onChange={e=>setFPos(e.target.value)} style={{...inp,width:150}}><option value="">All Positions</option>{POSITION_TYPES.map(p=><option key={p}>{p}</option>)}</select>
            <select value={fType} onChange={e=>setFType(e.target.value)} style={{...inp,width:140}}><option value="">All Types</option>{RESOURCE_TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select value={fCo} onChange={e=>setFCo(e.target.value)} style={{...inp,width:140}}><option value="">All Companies</option>{COMPANIES.map(c=><option key={c}>{c}</option>)}</select>
            <div style={{marginLeft:"auto",display:"flex",gap:8}}>
              <button onClick={()=>setShowImport(true)} style={btn("#0f4c75")}>📥 Import Excel</button>
              <button onClick={exportCSV} style={btn(C.border)}>📤 Export CSV</button>
              <button onClick={openAdd} style={btn()}>+ Add Resource</button>
            </div>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:13,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:1400}}>
              <thead>
                <tr style={{background:C.surfaceDeep}}>
                  {[["name","Name"],["positionType","Position"],["resourceType","Type"],["resourceCategory","Category"],["department","Dept"],["manager","Manager"],["company","Company"],["role","Role"],["taskforce","TF"],["location","Location"],["startMonth","Start"],["endMonth","End"],["onLeave","Leave"],["resigned","Resigned"]].map(([c,l])=>(
                    <th key={c} onClick={()=>hs(c)} style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:C.faint,textTransform:"uppercase",letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",userSelect:"none"}}>
                      {l}{sortCol===c?(sortDir==="asc"?" ↑":" ↓"):""}
                    </th>
                  ))}
                  <th style={{padding:"10px 12px",fontSize:10,color:C.faint,textTransform:"uppercase"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,i)=>(
                  <tr key={r.id} style={{borderTop:`1px solid ${C.border}`,background:i%2===0?"transparent":"#162032"}}>
                    <td style={{padding:"10px 12px",fontSize:13,fontWeight:600}}>{r.name}</td>
                    <td style={{padding:"10px 12px"}}><Badge v={r.positionType} map={POS_COLORS}/></td>
                    <td style={{padding:"10px 12px"}}><Badge v={r.resourceType} map={TYPE_COLORS}/></td>
                    <td style={{padding:"10px 12px"}}>{r.resourceCategory?<Badge v={r.resourceCategory} map={CAT_COLORS}/>:<span style={{color:C.faint,fontSize:12}}>—</span>}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:C.muted}}>{r.department||"—"}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:C.muted}}>{r.manager||"—"}</td>
                    <td style={{padding:"10px 12px",fontSize:12}}>{r.company}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:C.muted}}>{r.role}</td>
                    <td style={{padding:"10px 12px",fontSize:12}}>{r.taskforce}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:C.muted}}>{r.location}</td>
                    <td style={{padding:"10px 12px",fontSize:12,fontFamily:"monospace"}}>{r.startMonth&&r.startYear?`${r.startMonth} ${r.startYear}`:"—"}</td>
                    <td style={{padding:"10px 12px",fontSize:12,fontFamily:"monospace",color:r.endMonth?C.red:C.faint}}>{r.endMonth&&r.endYear?`${r.endMonth} ${r.endYear}`:"—"}</td>
                    <td style={{padding:"10px 12px"}}>{r.onLeave?<span style={{color:C.orange,fontSize:12,fontWeight:700}}>On Leave</span>:<span style={{color:C.faint,fontSize:12}}>—</span>}</td>
                    <td style={{padding:"10px 12px"}}>{r.resigned?<span style={{color:C.red,fontSize:12,fontWeight:700}}>Yes</span>:<span style={{color:C.faint,fontSize:12}}>—</span>}</td>
                    <td style={{padding:"10px 12px",display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(r)} style={{background:"#1e3a5f",color:C.blue,border:"none",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>Edit</button>
                      <button onClick={()=>delRes(r.id)} style={{background:"#3b0a0a",color:C.red,border:"none",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>Del</button>
                    </td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={15} style={{padding:36,textAlign:"center",color:C.faint}}>No records found</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:8,color:C.faint,fontSize:12}}>{filtered.length} of {resources.length} resources</div>
        </div>
      )}

      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28,width:680,maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:22}}>{editId?"Edit Resource":"Add New Resource"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>Resource Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp} placeholder="Full name"/></div>
              <div><label style={lbl}>Position Type</label><select value={form.positionType} onChange={e=>setForm(f=>({...f,positionType:e.target.value}))} style={inp}>{POSITION_TYPES.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label style={lbl}>Type of Resource</label><select value={form.resourceType} onChange={e=>setForm(f=>({...f,resourceType:e.target.value}))} style={inp}>{RESOURCE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Resource Category</label><select value={form.resourceCategory} onChange={e=>setForm(f=>({...f,resourceCategory:e.target.value}))} style={inp}><option value="">Select…</option>{RESOURCE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>Department</label><select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={inp}><option value="">Select…</option>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>Manager</label><input value={form.manager} onChange={e=>setForm(f=>({...f,manager:e.target.value}))} style={inp} placeholder="Manager name"/></div>
              <div><label style={lbl}>Company</label><select value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} style={inp}>{COMPANIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>Role</label><select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={inp}><option value="">Select…</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>Skills</label><input value={form.skills} onChange={e=>setForm(f=>({...f,skills:e.target.value}))} style={inp} placeholder="e.g. React, Azure, Python"/></div>
              <div><label style={lbl}>Taskforce</label><select value={form.taskforce} onChange={e=>setForm(f=>({...f,taskforce:e.target.value}))} style={inp}><option value="">Select…</option>{TASKFORCES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Location</label><select value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} style={inp}><option value="">Select…</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div>
              <div><label style={lbl}>Start Month</label><select value={form.startMonth} onChange={e=>setForm(f=>({...f,startMonth:e.target.value}))} style={inp}><option value="">—</option>{MONTHS.map(m=><option key={m}>{m}</option>)}</select></div>
              <div><label style={lbl}>Start Year</label><select value={form.startYear} onChange={e=>setForm(f=>({...f,startYear:e.target.value}))} style={inp}><option value="">—</option>{YEARS.map(y=><option key={y}>{y}</option>)}</select></div>
              <div><label style={lbl}>End Month</label><select value={form.endMonth} onChange={e=>setForm(f=>({...f,endMonth:e.target.value}))} style={inp}><option value="">—</option>{MONTHS.map(m=><option key={m}>{m}</option>)}</select></div>
              <div><label style={lbl}>End Year</label><select value={form.endYear} onChange={e=>setForm(f=>({...f,endYear:e.target.value}))} style={inp}><option value="">—</option>{YEARS.map(y=><option key={y}>{y}</option>)}</select></div>
              <div><label style={lbl}>Program</label><input value={form.program} onChange={e=>setForm(f=>({...f,program:e.target.value}))} style={inp} placeholder="e.g. DMINT"/></div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <label style={lbl}>Flags</label>
                <div style={{display:"flex",gap:14}}>
                  {([["onLeave","On Leave",C.orange],["resigned","Resigned",C.red]] as const).map(([field,label,color])=>(
                    <div key={field} onClick={()=>setForm(f=>({...f,[field]:!f[field]}))} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 14px",borderRadius:8,border:`2px solid ${form[field]?color:C.border}`,background:form[field]?`${color}22`:C.surfaceDeep}}>
                      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${form[field]?color:C.faint}`,background:form[field]?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {form[field]&&<span style={{color:"#fff",fontSize:11,fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color:form[field]?color:C.muted}}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowForm(false)} style={btn(C.border)}>Cancel</button>
              <button onClick={saveForm} style={btn()}>{editId?"Save Changes":"Add Resource"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
