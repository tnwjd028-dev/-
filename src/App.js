import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_TEMPLATE = [
  { id:"cat_1", category:"입사 당일", dueDays:0, color:"#E84545",
    items:[{id:"c01",label:"근로계약서 서명 및 제출"},{id:"c02",label:"개인정보 수집·이용 동의서 제출"},
           {id:"c03",label:"보안서약서 서명 및 제출"},{id:"c04",label:"신분증 사본 제출"},
           {id:"c05",label:"통장 사본 제출 (급여 계좌)"}]},
  { id:"cat_2", category:"입사 1주일 이내", dueDays:7, color:"#F5A623",
    items:[{id:"w01",label:"4대보험 가입신청서 제출"},{id:"w02",label:"주민등록등본 제출 (3개월 이내 발급)"},
           {id:"w03",label:"가족관계증명서 제출 (해당자)"},{id:"w04",label:"최종학력증명서 제출"},
           {id:"w05",label:"경력증명서 제출 (경력자 해당)"},{id:"w06",label:"자격증 사본 제출 (해당자)"}]},
  { id:"cat_3", category:"입사 1개월 이내", dueDays:30, color:"#2E86DE",
    items:[{id:"m01",label:"건강검진 결과서 제출"},{id:"m02",label:"사내 IT 시스템 교육 이수"},
           {id:"m03",label:"정보보안 교육 이수"},{id:"m04",label:"팀 OT(오리엔테이션) 완료"},
           {id:"m05",label:"멘토 1:1 미팅 완료"},{id:"m06",label:"사내 복지제도 안내 확인"}]},
];
const CAT_COLORS = ["#E84545","#F5A623","#2E86DE","#27AE60","#9B59B6","#16A085","#E67E22","#34495E"];

// ── utils ──
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const daysBetween = d => { const a=new Date(d),b=new Date(); a.setHours(0,0,0,0); b.setHours(0,0,0,0); return Math.floor((b-a)/86400000); };
const calcProgress = (checks,tpl) => { const all=(tpl||[]).flatMap(c=>c.items); const done=all.filter(i=>checks?.[i.id]).length; return {done,total:all.length,pct:all.length?Math.round((done/all.length)*100):0}; };
const getEffDue = (itemId,catDueDays,ov) => ov?.[itemId]??catDueDays;
const isOverdue = (joinDate,dueDays,checked) => !checked && daysBetween(joinDate)>dueDays;
const fmtDT = iso => { if(!iso)return""; const d=new Date(iso); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const deepEqual = (a,b) => JSON.stringify(a)===JSON.stringify(b);

function toast(msg,type="info"){
  const C={info:"#2E86DE",success:"#27AE60",warning:"#F5A623",error:"#E84545"};
  const el=document.createElement("div");
  el.style.cssText=`position:fixed;bottom:26px;right:26px;background:${C[type]};color:#fff;padding:12px 20px;border-radius:10px;font-family:'Pretendard',sans-serif;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,.2);animation:_t .3s ease`;
  el.textContent=msg;
  const s=document.createElement("style"); s.textContent=`@keyframes _t{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`; document.head.appendChild(s); document.body.appendChild(el); setTimeout(()=>el.remove(),3200);
}

const load = async (k, _sh = false) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
};
const save = async (k, v, _sh = false) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

// ── UI primitives ──
function ProgressRing({pct,size=64,stroke=6,color="#2E86DE"}){
  const r=(size-stroke)/2,circ=2*Math.PI*r,off=circ-(pct/100)*circ;
  return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8ecf0" strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} style={{transition:"stroke-dashoffset .6s ease"}} strokeLinecap="round"/>
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" style={{fontSize:size*.24,fontWeight:700,fill:"#1a2233",fontFamily:"'Pretendard',sans-serif",transform:"rotate(90deg)",transformOrigin:"center"}}>{pct}%</text>
  </svg>);
}
function Badge({text,color}){
  return <span style={{background:color+"18",color,border:`1px solid ${color}40`,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:".3px",whiteSpace:"nowrap"}}>{text}</span>;
}
function FI({value,onChange,placeholder="",type="text",style={},onKeyDown,autoFocus}){
  const [f,setF]=useState(false);
  return <input autoFocus={autoFocus} type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{width:"100%",padding:"10px 13px",borderRadius:9,border:`1.5px solid ${f?"#2E86DE":"#e2e8f0"}`,fontSize:14,outline:"none",boxSizing:"border-box",transition:"border .2s",...style}}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
}
function Field({label,children}){return <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:700,color:"#8899bb",display:"block",marginBottom:5,letterSpacing:".4px"}}>{label}</label>{children}</div>;}
function Modal({title,onClose,children,width=480,titleColor="#1a2233"}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(10,18,40,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:16}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:20,padding:"32px 28px",width,maxWidth:"94vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 80px rgba(0,0,0,.24)"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h3 style={{fontWeight:800,fontSize:17,color:titleColor,margin:0}}>{title}</h3>
        <button onClick={onClose} style={{background:"#f4f7fb",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:15,color:"#8899bb"}}>✕</button>
      </div>
      {children}
    </div>
  </div>);
}
function ConfirmDialog({message,onYes,onNo,yesColor="#E84545",yesLabel="Yes, 삭제",noLabel="No"}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(10,18,40,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
    <div style={{background:"#fff",borderRadius:18,padding:"32px 28px",width:380,maxWidth:"92vw",boxShadow:"0 20px 80px rgba(0,0,0,.24)"}}>
      <div style={{fontSize:22,textAlign:"center",marginBottom:14}}>⚠️</div>
      <p style={{fontSize:15,fontWeight:600,color:"#1a2233",textAlign:"center",lineHeight:1.6,margin:"0 0 24px"}}>{message}</p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onYes} style={{flex:1,background:yesColor,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{yesLabel}</button>
        <button onClick={onNo} style={{flex:1,background:"transparent",color:"#8899bb",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{noLabel}</button>
      </div>
    </div>
  </div>);
}
function SBtn({children,onClick,bg="#f0f4fa",color="#5B6EEA",style={},title=""}){
  return <button onClick={onClick} title={title} style={{background:bg,color,border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",...style}}>{children}</button>;
}
function PBtn({children,onClick,color="#2E86DE",disabled=false,style={}}){
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{background:color,color:"#fff",border:"none",borderRadius:10,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,fontFamily:"inherit",...style}}>{children}</button>;
}
function OBtn({children,onClick,color="#8899bb",style={}}){
  return <button onClick={onClick} style={{background:"transparent",color,border:`1.5px solid ${color}`,borderRadius:10,padding:"11px 18px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",...style}}>{children}</button>;
}
function IBtn({icon,label,onClick,active=false,disabled=false,color="#5B6EEA"}){
  const [h,setH]=useState(false);
  return(<button onClick={disabled?undefined:onClick} title={label} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:active?"#e8f0ff":h&&!disabled?"#f0f4fa":"transparent",
      border:`1.5px solid ${active?color:"transparent"}`,borderRadius:8,padding:"5px 8px",cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?.35:1,transition:"all .15s",minWidth:46,fontFamily:"inherit"}}>
    <span style={{fontSize:16,lineHeight:1}}>{icon}</span>
    <span style={{fontSize:9,fontWeight:700,color:active?color:"#8899bb",letterSpacing:".2px",whiteSpace:"nowrap"}}>{label}</span>
  </button>);
}

// ─────────────────────────────────────────────────────────
// USER HOME
// ─────────────────────────────────────────────────────────
function UserHome({onLogin}){
  const [name,setName]=useState(""); const [joinDate,setJoinDate]=useState(""); const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  async function submit(){
    if(!name.trim()||!joinDate){setErr("이름과 입사일을 모두 입력해주세요.");return;}
    setLoading(true); setErr("");
    const emps=(await load("employees",true))||[];
    const emp=emps.find(e=>e.name.trim()===name.trim()&&e.joinDate===joinDate);
    if(!emp){setErr("등록된 신규입사자 정보를 찾을 수 없습니다. 인사팀에 문의해주세요.");setLoading(false);return;}
    onLogin(emp); setLoading(false);
  }
  return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f4ff 0%,#fafbff 60%,#f7f0ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif"}}>
    <div style={{background:"#fff",borderRadius:22,boxShadow:"0 10px 56px rgba(30,50,120,.12)",padding:"52px 44px",width:400,maxWidth:"90vw"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:58,height:58,background:"linear-gradient(135deg,#2E86DE,#5B6EEA)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:26}}>📋</div>
        <h1 style={{fontSize:23,fontWeight:800,color:"#1a2233",margin:0,letterSpacing:"-.5px"}}>신규입사자 온보딩</h1>
        <p style={{color:"#6b7a99",fontSize:14,marginTop:7}}>이름과 입사일을 입력하여 체크리스트를 확인하세요</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <Field label="성명"><FI value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" onKeyDown={e=>e.key==="Enter"&&submit()}/></Field>
        <Field label="입사일"><FI type="date" value={joinDate} onChange={e=>setJoinDate(e.target.value)}/></Field>
        {err&&<p style={{color:"#E84545",fontSize:13,margin:0,background:"#fff0f0",padding:"8px 12px",borderRadius:8}}>{err}</p>}
        <PBtn onClick={submit} disabled={loading} style={{borderRadius:12,padding:"14px",width:"100%"}}>{loading?"확인 중...":"체크리스트 열기 →"}</PBtn>
        <OBtn onClick={()=>onLogin({adminMode:true})} style={{borderRadius:12}}>🔐 관리자 로그인</OBtn>
      </div>
    </div>
  </div>);
}

// ─────────────────────────────────────────────────────────
// USER CHECKLIST
// ─────────────────────────────────────────────────────────
function UserChecklist({employee,onBack}){
  const [checks,setChecks]=useState({});
  const [tpl,setTpl]=useState([]);
  const [itemOverrides,setItemOverrides]=useState({});
  const [notes,setNotes]=useState({});
  const [extReqs,setExtReqs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [extModal,setExtModal]=useState(null);
  const [extDays,setExtDays]=useState("");
  const [extReason,setExtReason]=useState("");
  // Panel state: null = closed, "all" | "pending" | "approved" = open with filter
  const [extPanel,setExtPanel]=useState(null);

  useEffect(()=>{
    Promise.all([
      load(`checks_${employee.id}`,true), load("checklist_template",true),
      load(`item_overrides_${employee.id}`,true), load(`item_notes_${employee.id}`,true),
      load(`ext_requests_${employee.id}`,true),
    ]).then(([c,t,ov,n,er])=>{
      setChecks(c||{}); setTpl(t||DEFAULT_TEMPLATE); setItemOverrides(ov||{}); setNotes(n||{}); setExtReqs(er||[]); setLoading(false);
    });
  },[]);

  async function toggle(id){
    const next={...checks,[id]:!checks[id]};
    setChecks(next); await save(`checks_${employee.id}`,next,true);
    if(next[id])toast("✅ 항목 완료!","success");
  }

  async function submitExt(){
    const d=parseInt(extDays);
    if(!d||d<=0){toast("연장 일수를 올바르게 입력하세요.","warning");return;}
    if(!extReason.trim()){toast("사유를 입력해주세요.","warning");return;}
    const effDue=getEffDue(extModal.item.id,extModal.catDueDays,itemOverrides);
    const req={id:uid(),itemId:extModal.item.id,itemLabel:extModal.item.label,empId:employee.id,
      empName:employee.name,department:employee.department,currentDue:effDue,requestDays:d,
      reason:extReason.trim(),status:"pending",createdAt:new Date().toISOString()};
    const all=[...extReqs,req]; setExtReqs(all);
    await save(`ext_requests_${employee.id}`,all,true);
    const gl=(await load("ext_requests_all",true))||[];
    await save("ext_requests_all",[...gl,req],true);
    toast("기한 연장 요청이 인사팀에 전달되었습니다.","success");
    setExtModal(null); setExtDays(""); setExtReason("");
  }

  function handleTabClick(key){
    // toggle: same tab closes, different tab switches
    setExtPanel(p=>p===key?null:key);
  }

  const elapsed=daysBetween(employee.joinDate);
  const {done,total,pct}=calcProgress(checks,tpl);
  const cntAll=extReqs.length, cntPending=extReqs.filter(r=>r.status==="pending").length, cntApproved=extReqs.filter(r=>r.status==="approved").length;

  if(loading)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif"}}>불러오는 중...</div>;

  const EXT_TABS=[
    {key:"all",    icon:"📬", label:"전체",  count:cntAll,    color:"#5B6EEA", activeBg:"rgba(91,110,234,.22)"},
    {key:"pending",icon:"⏳", label:"검토중", count:cntPending,color:"#F5A623", activeBg:"rgba(245,166,35,.22)"},
    {key:"approved",icon:"✅",label:"승인됨", count:cntApproved,color:"#27AE60",activeBg:"rgba(39,174,96,.22)"},
  ];

  const filteredReqs = extReqs.slice().reverse().filter(r=>{
    if(extPanel==="all")return true;
    if(extPanel==="pending")return r.status==="pending";
    if(extPanel==="approved")return r.status==="approved";
    return false;
  });

  return(<div style={{minHeight:"100vh",background:"#f4f7fb",fontFamily:"'Pretendard',sans-serif"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1a2233,#2E3A55)",padding:"24px 28px",color:"#fff"}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",marginBottom:16}}>← 돌아가기</button>
        <div style={{display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap"}}>
          <ProgressRing pct={pct} size={78} stroke={7} color="#5B6EEA"/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".8px",color:"#8daee8",marginBottom:4}}>온보딩 진행률</div>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>{employee.name}님 체크리스트</h2>
            <div style={{fontSize:13,color:"#a0b4d0"}}>{employee.department} · {employee.position} · 입사 {elapsed}일차 · {done}/{total} 완료</div>
          </div>
          {/* ── Extension request status icons ── */}
          {cntAll>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,.45)",letterSpacing:".5px",fontWeight:600}}>기한 연장 요청 현황</div>
              <div style={{display:"flex",gap:6}}>
                {EXT_TABS.map(tab=>{
                  const isActive=extPanel===tab.key;
                  return(
                    <button key={tab.key} onClick={()=>handleTabClick(tab.key)}
                      title={`${tab.label} (${tab.count}건) 클릭하여 내용 보기`}
                      style={{background:isActive?tab.activeBg:"rgba(255,255,255,.08)",
                        border:`1.5px solid ${isActive?tab.color:"rgba(255,255,255,.18)"}`,
                        borderRadius:12,padding:"8px 12px",cursor:"pointer",textAlign:"center",
                        minWidth:60,transition:"all .18s",fontFamily:"inherit"}}>
                      <div style={{fontSize:20}}>{tab.icon}</div>
                      <div style={{fontSize:10,fontWeight:700,color:isActive?tab.color:"rgba(255,255,255,.65)",marginTop:2}}>{tab.label}</div>
                      <div style={{fontSize:15,fontWeight:800,color:isActive?tab.color:"#fff",marginTop:1}}>{tab.count}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Extension panel — appears below header when a tab is active */}
    {extPanel!==null&&cntAll>0&&(
      <div style={{background:"#fffbf0",borderBottom:"2px solid #F5A62330"}}>
        <div style={{maxWidth:780,margin:"0 auto",padding:"16px 24px"}}>
          {/* Tab row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#9a7020",marginRight:4}}>📬 기한 연장 요청</span>
              {EXT_TABS.map(tab=>(
                <button key={tab.key} onClick={()=>handleTabClick(tab.key)}
                  style={{background:extPanel===tab.key?tab.color+"22":"#f4f7fb",
                    color:extPanel===tab.key?tab.color:"#8899bb",
                    border:`1.5px solid ${extPanel===tab.key?tab.color+"60":"#e2e8f0"}`,
                    borderRadius:99,padding:"3px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {tab.icon} {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <button onClick={()=>setExtPanel(null)} style={{background:"transparent",border:"none",color:"#8899bb",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ 닫기</button>
          </div>
          {/* Content */}
          {filteredReqs.length===0?(
            <div style={{textAlign:"center",color:"#bbb",fontSize:13,padding:"14px 0"}}>해당 항목이 없습니다.</div>
          ):filteredReqs.map(r=>{
            const si={pending:["⏳ 검토중","#F5A623"],approved:["✅ 승인됨","#27AE60"],rejected:["❌ 반려됨","#E84545"]}[r.status];
            return(<div key={r.id} style={{background:"#fff",borderRadius:12,padding:"13px 16px",marginBottom:8,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <Badge text={si[0]} color={si[1]}/>
                <span style={{fontWeight:700,fontSize:13,color:"#1a2233",flex:1}}>{r.itemLabel}</span>
                {r.status==="approved"&&<Badge text={`D+${r.currentDue+r.requestDays} (연장 확정)`} color="#27AE60"/>}
              </div>
              <div style={{fontSize:12,color:"#8899bb",marginTop:6}}>요청: D+{r.currentDue} → D+{r.currentDue+r.requestDays} ({r.requestDays}일 연장)</div>
              <div style={{fontSize:12,color:"#6b7a99",marginTop:3,fontStyle:"italic"}}>사유: {r.reason}</div>
              <div style={{fontSize:11,color:"#bbb",marginTop:3}}>{fmtDT(r.createdAt)}</div>
            </div>);
          })}
        </div>
      </div>
    )}

    <div style={{maxWidth:780,margin:"0 auto",padding:"24px 16px"}}>
      {tpl.map(cat=>{
        const catDone=cat.items.filter(i=>checks[i.id]).length;
        return(<div key={cat.id} style={{background:"#fff",borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 2px 16px rgba(30,50,120,.07)"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #f0f4fa",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:4,height:20,background:cat.color,borderRadius:2}}/>
              <span style={{fontWeight:700,fontSize:15,color:"#1a2233"}}>{cat.category}</span>
              <Badge text={`D+${cat.dueDays}`} color={cat.color}/>
            </div>
            <span style={{fontSize:13,color:"#6b7a99",fontWeight:600}}>{catDone}/{cat.items.length}</span>
          </div>
          {cat.items.map(item=>{
            const done=!!checks[item.id];
            const effDue=getEffDue(item.id,cat.dueDays,itemOverrides);
            const over=isOverdue(employee.joinDate,effDue,done);
            const note=notes[item.id];
            const pendingReq=extReqs.find(r=>r.itemId===item.id&&r.status==="pending");
            const approvedReq=extReqs.find(r=>r.itemId===item.id&&r.status==="approved");
            const hasOverride=itemOverrides[item.id]!==undefined;
            return(<div key={item.id}>
              <div onClick={()=>toggle(item.id)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",cursor:"pointer",
                  background:done?"#f6fff9":over?"#fff8f8":"#fff",borderBottom:note?"none":"1px solid #f4f7fa",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=done?"#edfbf3":over?"#fff0f0":"#f8faff"}
                onMouseLeave={e=>e.currentTarget.style.background=done?"#f6fff9":over?"#fff8f8":"#fff"}>
                <div style={{width:22,height:22,borderRadius:6,flexShrink:0,border:`2px solid ${done?"#27AE60":over?"#E84545":"#cdd8e8"}`,background:done?"#27AE60":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                  {done&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontSize:14,color:done?"#6b8c7a":"#1a2233",textDecoration:done?"line-through":"none",flex:1}}>{item.label}</span>
                {approvedReq&&hasOverride&&<Badge text={`✅ 연장: D+${effDue}`} color="#27AE60"/>}
                {!approvedReq&&hasOverride&&<Badge text={`D+${effDue} (연장)`} color="#27AE60"/>}
                {over&&!done&&<Badge text="기한초과" color="#E84545"/>}
                {pendingReq&&<Badge text="연장요청중" color="#F5A623"/>}
                {!done&&!pendingReq&&(
                  <SBtn onClick={e=>{e.stopPropagation();setExtModal({item,catDueDays:cat.dueDays});}}
                    bg={over?"#FFF3CD":"#f0f4fa"} color={over?"#9a7020":"#8899bb"} style={{fontSize:11}}>⏰ 기한연장요청</SBtn>
                )}
              </div>
              {note&&(
                <div style={{padding:"8px 18px 10px 52px",background:done?"#f6fff9":over?"#fff8f8":"#fff",borderBottom:"1px solid #f4f7fa"}}>
                  <div style={{background:"#fffbf0",border:"1px solid #F5A62330",borderRadius:8,padding:"8px 12px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#F5A623",marginBottom:3}}>💬 인사팀 메모</div>
                    <div style={{fontSize:13,color:"#5a4a20",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{note.text}</div>
                    <div style={{fontSize:11,color:"#bbb",marginTop:3}}>{fmtDT(note.updatedAt)}</div>
                  </div>
                </div>
              )}
            </div>);
          })}
        </div>);
      })}
      {pct===100&&(<div style={{background:"linear-gradient(135deg,#27AE60,#2ECC71)",borderRadius:16,padding:"24px",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>🎉</div>
        <div style={{fontWeight:800,fontSize:18}}>모든 온보딩 항목을 완료했습니다!</div>
      </div>)}
    </div>

    {extModal&&(
      <Modal title="⏰ 기한 연장 요청" onClose={()=>{setExtModal(null);setExtDays("");setExtReason("");}} width={460}>
        <div style={{background:"#f8faff",borderRadius:10,padding:"12px 15px",marginBottom:16}}>
          <div style={{fontSize:12,color:"#8899bb",marginBottom:4}}>대상 항목</div>
          <div style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{extModal.item.label}</div>
          <div style={{fontSize:12,color:"#8899bb",marginTop:4}}>현재 기한: D+{getEffDue(extModal.item.id,extModal.catDueDays,itemOverrides)}</div>
        </div>
        <Field label="연장 요청 일수">
          <FI type="number" value={extDays} onChange={e=>setExtDays(e.target.value)} placeholder="예: 3"/>
          {extDays&&!isNaN(parseInt(extDays))&&parseInt(extDays)>0&&(
            <div style={{fontSize:12,color:"#27AE60",marginTop:4}}>→ D+{getEffDue(extModal.item.id,extModal.catDueDays,itemOverrides)+parseInt(extDays)} 로 연장 요청</div>
          )}
        </Field>
        <Field label="연장 사유 (필수)">
          <textarea value={extReason} onChange={e=>setExtReason(e.target.value)} placeholder="연장이 필요한 사유를 상세히 입력해주세요."
            style={{width:"100%",height:100,padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}/>
        </Field>
        <div style={{background:"#f0f8ff",border:"1px solid #2E86DE30",borderRadius:8,padding:"9px 13px",fontSize:12,color:"#2E86DE",marginBottom:16}}>
          ℹ️ 요청 후 인사팀 검토를 거쳐 승인/반려 처리됩니다.
        </div>
        <div style={{display:"flex",gap:10}}>
          <PBtn onClick={submitExt} color="#2E86DE" style={{flex:1}}>요청 보내기</PBtn>
          <OBtn onClick={()=>{setExtModal(null);setExtDays("");setExtReason("");}} style={{flex:1}}>취소</OBtn>
        </div>
      </Modal>
    )}
  </div>);
}

// ─────────────────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────────────────
function AdminLogin({onLogin,onBack}){
  const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  function submit(){if(pw==="admin1234")onLogin();else setErr("비밀번호가 올바르지 않습니다. (힌트: admin1234)");}
  return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a2233,#2E3A55)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif"}}>
    <div style={{background:"#fff",borderRadius:20,padding:"48px 40px",width:360,maxWidth:"90vw"}}>
      <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:36,marginBottom:12}}>🔐</div>
        <h2 style={{fontWeight:800,fontSize:20,color:"#1a2233",margin:0}}>관리자 로그인</h2></div>
      <FI type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호 입력" style={{marginBottom:10}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      {err&&<p style={{color:"#E84545",fontSize:13,margin:"0 0 10px",background:"#fff0f0",padding:"8px 12px",borderRadius:8}}>{err}</p>}
      <PBtn onClick={submit} style={{width:"100%",borderRadius:12,padding:"14px",marginBottom:10}}>로그인</PBtn>
      <OBtn onClick={onBack} style={{width:"100%",borderRadius:12}}>← 돌아가기</OBtn>
    </div>
  </div>);
}

// ─────────────────────────────────────────────────────────
// ADMIN DETAIL
// ─────────────────────────────────────────────────────────
function AdminDetail({employee:initEmp,checks:initChecks,tpl:initTpl,onBack}){
  const [emp,setEmp]=useState(initEmp);
  const [checks,setChecks]=useState(initChecks);
  const [tpl,setTpl]=useState(initTpl);
  const [itemOverrides,setItemOverrides]=useState({});
  const [notes,setNotes]=useState({});
  const [extReqs,setExtReqs]=useState([]);

  const [selectedItem,setSelectedItem]=useState(null);

  // modals / inline-edits
  const [editJoinDate,setEditJoinDate]=useState(false);
  const [newJoinDate,setNewJoinDate]=useState(initEmp.joinDate);
  const [catDueEdit,setCatDueEdit]=useState(null);
  const [itemDueModal,setItemDueModal]=useState(false);
  const [itemDueVal,setItemDueVal]=useState("");
  const [addItemCatId,setAddItemCatId]=useState(null);
  const [newItemLabel,setNewItemLabel]=useState("");
  const [addCatModal,setAddCatModal]=useState(false);
  const [newCat,setNewCat]=useState({category:"",dueDays:0,color:"#2E86DE"});
  const [editCatId,setEditCatId]=useState(null);
  const [editCatVal,setEditCatVal]=useState("");
  const [editItemId,setEditItemId]=useState(null);
  const [editItemVal,setEditItemVal]=useState("");
  const [bulkDueModal,setBulkDueModal]=useState(false);
  const [bulkDueMode,setBulkDueMode]=useState("delta");
  const [bulkDueDelta,setBulkDueDelta]=useState("");
  const [bulkDueValues,setBulkDueValues]=useState({});
  const [mailModal,setMailModal]=useState(null);
  const [mailSubject,setMailSubject]=useState("");
  const [mailBody,setMailBody]=useState("");
  const [noteModal,setNoteModal]=useState(null);
  const [noteText,setNoteText]=useState("");
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  // ext panel: null | "all" | "pending" | "approved"
  const [extPanel,setExtPanel]=useState(null);

  useEffect(()=>{
    Promise.all([load(`item_overrides_${emp.id}`,true),load(`item_notes_${emp.id}`,true),load(`ext_requests_${emp.id}`,true)])
      .then(([ov,n,er])=>{setItemOverrides(ov||{});setNotes(n||{});setExtReqs(er||[]);});
  },[]);

  // Auto-save helpers — persist immediately on every change
  async function updTpl(next){setTpl(next);await save("checklist_template",next,true);toast("자동 저장되었습니다.","success");}
  async function updOv(next){setItemOverrides(next);await save(`item_overrides_${emp.id}`,next,true);toast("자동 저장되었습니다.","success");}
  async function updNotes(next){setNotes(next);await save(`item_notes_${emp.id}`,next,true);}

  async function adminToggle(itemId){
    const next={...checks,[itemId]:!checks[itemId]};
    setChecks(next); await save(`checks_${emp.id}`,next,true);
    toast(next[itemId]?"✅ 완료 처리했습니다.":"↩️ 완료를 취소했습니다.",next[itemId]?"success":"info");
  }

  async function applyJoinDate(){
    const emps=(await load("employees",true))||[];
    await save("employees",emps.map(e=>e.id===emp.id?{...e,joinDate:newJoinDate}:e),true);
    setEmp(p=>({...p,joinDate:newJoinDate})); setEditJoinDate(false); toast("입사일이 변경되었습니다.","success");
  }

  function applyCatDue(){
    const v=parseInt(catDueEdit.val); if(isNaN(v)||v<0){toast("0 이상의 숫자를 입력하세요.","warning");return;}
    updTpl(tpl.map(c=>c.id===catDueEdit.catId?{...c,dueDays:v}:c)); setCatDueEdit(null);
  }

  function openItemDueModal(){
    if(!selectedItem){toast("항목을 먼저 선택해주세요.","warning");return;}
    setItemDueVal(String(getEffDue(selectedItem.itemId,selectedItem.catDueDays,itemOverrides))); setItemDueModal(true);
  }
  function applyItemDue(){
    const v=parseInt(itemDueVal); if(isNaN(v)||v<0){toast("0 이상의 숫자를 입력하세요.","warning");return;}
    updOv({...itemOverrides,[selectedItem.itemId]:v}); setItemDueModal(false); toast("개별 기한이 변경되었습니다.","success");
  }
  function clearItemDue(itemId){const next={...itemOverrides};delete next[itemId];updOv(next);toast("개별 기한이 초기화되었습니다.","info");}

  // ── Bulk due (applies only to THIS employee's overrides) ──
  function openBulkDue(){
    const init={}; tpl.forEach(c=>{init[c.id]=String(c.dueDays);}); setBulkDueValues(init); setBulkDueDelta(""); setBulkDueModal(true);
  }
  function applyBulkDueDelta(){
    const d=parseInt(bulkDueDelta); if(isNaN(d)){toast("숫자를 입력하세요.","warning");return;}
    // Build per-item overrides for all items of this employee
    const allItems=tpl.flatMap(c=>c.items.map(i=>({id:i.id,catDueDays:c.dueDays})));
    const next={...itemOverrides};
    allItems.forEach(({id,catDueDays})=>{
      const base=next[id]??catDueDays;
      next[id]=Math.max(0,base+d);
    });
    updOv(next); setBulkDueModal(false);
  }
  function applyBulkDueAbsolute(){
    // Set per-category overrides for all items of this employee
    const next={...itemOverrides};
    tpl.forEach(c=>{
      const v=parseInt(bulkDueValues[c.id]); if(isNaN(v))return;
      c.items.forEach(i=>{ next[i.id]=Math.max(0,v); });
    });
    updOv(next); setBulkDueModal(false);
  }

  function applyAddItem(){
    if(!newItemLabel.trim()){toast("항목명을 입력하세요.","warning");return;}
    updTpl(tpl.map(c=>c.id===addItemCatId?{...c,items:[...c.items,{id:uid(),label:newItemLabel.trim()}]}:c));
    setAddItemCatId(null); setNewItemLabel("");
  }
  function confirmDeleteItem(catId,itemId){setDeleteConfirm({type:"item",catId,itemId});}
  function confirmDeleteCat(catId){setDeleteConfirm({type:"cat",catId});}
  function executeDelete(){
    if(deleteConfirm.type==="item"){
      updTpl(tpl.map(c=>c.id===deleteConfirm.catId?{...c,items:c.items.filter(i=>i.id!==deleteConfirm.itemId)}:c));
      if(selectedItem?.itemId===deleteConfirm.itemId)setSelectedItem(null);
    } else {
      updTpl(tpl.filter(c=>c.id!==deleteConfirm.catId));
    }
    setDeleteConfirm(null);
  }
  function applyAddCat(){
    if(!newCat.category.trim()){toast("카테고리명을 입력하세요.","warning");return;}
    updTpl([...tpl,{id:uid(),category:newCat.category.trim(),dueDays:parseInt(newCat.dueDays)||0,color:newCat.color,items:[]}]);
    setAddCatModal(false); setNewCat({category:"",dueDays:0,color:"#2E86DE"});
  }
  function applyRenameCat(){updTpl(tpl.map(c=>c.id===editCatId?{...c,category:editCatVal}:c));setEditCatId(null);}
  function applyEditItemLabel(catId){
    if(!editItemVal.trim()){toast("항목명을 입력하세요.","warning");return;}
    updTpl(tpl.map(c=>c.id===catId?{...c,items:c.items.map(i=>i.id===editItemId?{...i,label:editItemVal.trim()}:i)}:c));
    setEditItemId(null); setEditItemVal("");
  }

  function openMailFromToolbar(){
    if(!selectedItem){toast("항목을 먼저 선택해주세요.","warning");return;}
    const cat=tpl.find(c=>c.items.find(i=>i.id===selectedItem.itemId));
    const item=cat?.items.find(i=>i.id===selectedItem.itemId); if(!item||!cat)return;
    const effDue=getEffDue(item.id,cat.dueDays,itemOverrides);
    setMailSubject(`[온보딩 알림] ${emp.name}님 - "${item.label}" 미완료 안내`);
    setMailBody(`안녕하세요, ${emp.name}님.\n\n다음 온보딩 항목이 아직 완료되지 않았습니다.\n\n▶ ${item.label}\n   (제출기한: 입사 후 ${effDue}일 이내)\n\n빠른 시일 내에 완료해주시기 바랍니다.\n\n인사팀 드림`);
    setMailModal({item,cat});
  }
  function sendItemMail(){window.open(`mailto:${emp.email||""}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`);toast("메일 클라이언트가 열렸습니다.","success");setMailModal(null);}
  function sendAllMail(){
    const over=[];
    tpl.forEach(cat=>cat.items.forEach(item=>{
      const effDue=getEffDue(item.id,cat.dueDays,itemOverrides);
      if(!checks[item.id]&&isOverdue(emp.joinDate,effDue,false))over.push(item.label);
    }));
    if(!over.length){toast("기한 초과된 미완료 항목이 없습니다.","info");return;}
    const body=`안녕하세요, ${emp.name}님.\n\n다음 항목들이 기한 내에 완료되지 않았습니다:\n\n${over.map(l=>`• ${l}`).join("\n")}\n\n인사팀 드림`;
    window.open(`mailto:${emp.email||""}?subject=${encodeURIComponent(`[온보딩 알림] ${emp.name}님 미완료 항목 안내`)}&body=${encodeURIComponent(body)}`);
    toast(`${over.length}개 미완료 항목 알림 발송`,"success");
  }

  function openNoteFromToolbar(){
    if(!selectedItem){toast("항목을 먼저 선택해주세요.","warning");return;}
    setNoteModal({itemId:selectedItem.itemId,label:selectedItem.label});
    setNoteText(notes[selectedItem.itemId]?.text||"");
  }
  function saveNote(){
    const next={...notes};
    if(!noteText.trim()){delete next[noteModal.itemId];}
    else{next[noteModal.itemId]={text:noteText.trim(),updatedAt:new Date().toISOString()};}
    updNotes(next); setNoteModal(null); setNoteText(""); toast("메모가 저장되었습니다.","success");
  }
  function deleteNote(itemId){const next={...notes};delete next[itemId];updNotes(next);}

  function deleteFromToolbar(){if(!selectedItem){toast("항목을 먼저 선택해주세요.","warning");return;}confirmDeleteItem(selectedItem.catId,selectedItem.itemId);}

  function handleExtTabClick(key){setExtPanel(p=>p===key?null:key);}

  async function handleExtReq(reqId,action){
    const up=extReqs.map(r=>r.id===reqId?{...r,status:action,reviewedAt:new Date().toISOString()}:r);
    setExtReqs(up); await save(`ext_requests_${emp.id}`,up,true);
    const gl=(await load("ext_requests_all",true))||[];
    await save("ext_requests_all",gl.map(r=>r.id===reqId?{...r,status:action}:r),true);
    if(action==="approved"){
      const req=extReqs.find(r=>r.id===reqId);
      if(req)updOv({...itemOverrides,[req.itemId]:req.currentDue+req.requestDays});
      toast("기한 연장이 승인되었습니다.","success");
    } else {toast("기한 연장이 반려되었습니다.","warning");}
  }

  const {done,total,pct}=calcProgress(checks,tpl);
  const elapsed=daysBetween(emp.joinDate);
  const toolbarActive=!!selectedItem;

  const cntAllExt=extReqs.length, cntPendingExt=extReqs.filter(r=>r.status==="pending").length, cntApprovedExt=extReqs.filter(r=>r.status==="approved").length;

  const EXT_TABS_ADMIN=[
    {key:"all",    icon:"📬", label:"전체",  count:cntAllExt,     color:"#5B6EEA", activeBg:"rgba(91,110,234,.15)"},
    {key:"pending",icon:"⏳", label:"검토중", count:cntPendingExt, color:"#F5A623", activeBg:"rgba(245,166,35,.15)"},
    {key:"approved",icon:"✅",label:"승인됨", count:cntApprovedExt,color:"#27AE60", activeBg:"rgba(39,174,96,.15)"},
  ];
  const filteredExtReqs=extReqs.slice().reverse().filter(r=>{
    if(extPanel==="all")return true;
    if(extPanel==="pending")return r.status==="pending";
    if(extPanel==="approved")return r.status==="approved";
    return false;
  });

  return(<div style={{minHeight:"100vh",background:"#f0f4fb",fontFamily:"'Pretendard',sans-serif"}}>

    {/* ── HEADER ── */}
    <div style={{background:"linear-gradient(135deg,#1a2233,#2E3A55)",padding:"16px 22px",color:"#fff"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>

        {/* Top bar: back | action icons */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:6}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",padding:"5px 12px",borderRadius:7,fontSize:12,cursor:"pointer"}}>← 대시보드</button>

          {/* Action icons (compact) */}
          <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
            {/* Ext req icons */}
            {cntAllExt>0&&EXT_TABS_ADMIN.map(tab=>{
              const isActive=extPanel===tab.key;
              return(<button key={tab.key} onClick={()=>handleExtTabClick(tab.key)} title={`연장요청 ${tab.label}`}
                style={{background:isActive?tab.activeBg:"rgba(255,255,255,.08)",border:`1.5px solid ${isActive?tab.color:"rgba(255,255,255,.15)"}`,
                  borderRadius:8,padding:"4px 8px",cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",minWidth:44}}>
                <span style={{fontSize:14}}>{tab.icon}</span>
                <span style={{fontSize:9,fontWeight:700,color:isActive?tab.color:"rgba(255,255,255,.6)"}}>{tab.label}</span>
                <span style={{fontSize:12,fontWeight:800,color:isActive?tab.color:"#fff"}}>{tab.count}</span>
              </button>);
            })}
            <div style={{width:1,height:28,background:"rgba(255,255,255,.2)",margin:"0 2px"}}/>
            <SBtn onClick={openBulkDue}     bg="rgba(155,89,182,.35)" color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7}}>📅 기한일괄</SBtn>
            <SBtn onClick={()=>setAddCatModal(true)} bg="rgba(39,174,96,.3)" color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7}}>＋ 카테고리</SBtn>
            <SBtn onClick={sendAllMail}     bg="rgba(232,69,69,.35)"  color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7}}>📧 일괄알림</SBtn>
          </div>
        </div>

        {/* Employee info row */}
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <ProgressRing pct={pct} size={66} stroke={6} color="#5B6EEA"/>
          <div>
            <h2 style={{fontSize:19,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>{emp.name} 상세 체크리스트</h2>
            <div style={{color:"#a0b4d0",fontSize:12,marginBottom:7}}>{emp.department} · {emp.position} · 입사 {elapsed}일차 · {done}/{total} 완료</div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              {editJoinDate?(
                <>
                  <input type="date" value={newJoinDate} onChange={e=>setNewJoinDate(e.target.value)}
                    style={{padding:"4px 9px",borderRadius:7,border:"1.5px solid #5B6EEA",fontSize:12,outline:"none",background:"#fff",color:"#1a2233"}}/>
                  <SBtn onClick={applyJoinDate} bg="#5B6EEA" color="#fff" style={{fontSize:11}}>저장</SBtn>
                  <SBtn onClick={()=>{setEditJoinDate(false);setNewJoinDate(emp.joinDate);}} bg="rgba(255,255,255,.15)" color="#fff" style={{fontSize:11}}>취소</SBtn>
                </>
              ):(
                <>
                  <span style={{fontSize:12,color:"#c0d0e8"}}>입사일: {emp.joinDate}</span>
                  <SBtn onClick={()=>setEditJoinDate(true)} bg="rgba(255,255,255,.15)" color="#fff" style={{fontSize:11}}>✏️ 입사일 변경</SBtn>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Extension Requests Panel ── */}
    {extPanel!==null&&(
      <div style={{background:"#fffbf0",borderBottom:"2px solid #F5A62330"}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"14px 22px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#9a7020"}}>📬 기한 연장 요청 현황</span>
              {EXT_TABS_ADMIN.map(tab=>(
                <button key={tab.key} onClick={()=>handleExtTabClick(tab.key)}
                  style={{background:extPanel===tab.key?tab.color+"22":"#f4f7fb",color:extPanel===tab.key?tab.color:"#8899bb",
                    border:`1.5px solid ${extPanel===tab.key?tab.color+"60":"#e2e8f0"}`,borderRadius:99,
                    padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {tab.icon} {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <button onClick={()=>setExtPanel(null)} style={{background:"transparent",border:"none",color:"#8899bb",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ 닫기</button>
          </div>
          {filteredExtReqs.length===0&&<div style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"12px 0"}}>해당 항목이 없습니다.</div>}
          {filteredExtReqs.map(r=>{
            const si={pending:["⏳ 검토중","#F5A623"],approved:["✅ 승인됨","#27AE60"],rejected:["❌ 반려됨","#E84545"]}[r.status];
            return(<div key={r.id} style={{background:"#fff",borderRadius:12,padding:"13px 16px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
              <Badge text={si[0]} color={si[1]}/>
              <div style={{flex:1,minWidth:180}}>
                <div style={{fontWeight:700,fontSize:13,color:"#1a2233",marginBottom:2}}>{r.itemLabel}</div>
                <div style={{fontSize:12,color:"#6b7a99"}}>D+{r.currentDue} → D+{r.currentDue+r.requestDays} ({r.requestDays}일 연장 요청)</div>
                <div style={{fontSize:12,color:"#8899bb",marginTop:2,fontStyle:"italic"}}>사유: {r.reason}</div>
                <div style={{fontSize:11,color:"#bbb",marginTop:2}}>{fmtDT(r.createdAt)}{r.reviewedAt&&` · 검토: ${fmtDT(r.reviewedAt)}`}</div>
              </div>
              {r.status==="pending"&&(
                <div style={{display:"flex",gap:7}}>
                  <SBtn onClick={()=>handleExtReq(r.id,"approved")} bg="#e8f5e9" color="#27AE60" style={{padding:"5px 12px",fontSize:12}}>✅ 승인</SBtn>
                  <SBtn onClick={()=>handleExtReq(r.id,"rejected")} bg="#fff0f0" color="#E84545" style={{padding:"5px 12px",fontSize:12}}>❌ 반려</SBtn>
                </div>
              )}
            </div>);
          })}
        </div>
      </div>
    )}

    {/* ── STICKY TOOLBAR ── */}
    <div style={{position:"sticky",top:0,zIndex:100,background:"#fff",borderBottom:"2px solid #e8ecf0",boxShadow:"0 2px 10px rgba(30,50,120,.07)"}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"6px 14px",display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
        <div style={{fontSize:11,color:"#8899bb",fontWeight:600,marginRight:6,borderRight:"1.5px solid #e8ecf0",paddingRight:10,flex:1,minWidth:120}}>
          {selectedItem?<span style={{color:"#2E86DE"}}>✅ <strong>{selectedItem.label.slice(0,26)}{selectedItem.label.length>26?"…":""}</strong> 선택됨</span>
            :<span>항목을 클릭하여 선택 후 아이콘을 눌러 기능을 수행하세요</span>}
        </div>
        <IBtn icon="📅" label="기한" onClick={openItemDueModal} active={toolbarActive&&itemDueModal} disabled={!toolbarActive} color="#9B59B6"/>
        <IBtn icon="💬" label="메모" onClick={openNoteFromToolbar} disabled={!toolbarActive} color="#F5A623"/>
        <IBtn icon="✏️" label="이름수정" onClick={()=>{if(!selectedItem){toast("항목을 먼저 선택해주세요.","warning");return;} setEditItemId(selectedItem.itemId); setEditItemVal(selectedItem.label);}} disabled={!toolbarActive} color="#2E86DE"/>
        <IBtn icon="📧" label="알림" onClick={openMailFromToolbar} disabled={!toolbarActive||!!checks[selectedItem?.itemId]} color="#E84545"/>
        <IBtn icon="🗑" label="삭제" onClick={deleteFromToolbar} disabled={!toolbarActive} color="#E84545"/>
        {selectedItem&&itemOverrides[selectedItem.itemId]!==undefined&&(
          <SBtn onClick={()=>clearItemDue(selectedItem.itemId)} bg="#f3eeff" color="#9B59B6" style={{fontSize:10,marginLeft:4}}>↩️ 기한초기화</SBtn>
        )}
        {selectedItem&&(<SBtn onClick={()=>setSelectedItem(null)} bg="#f0f4fa" color="#8899bb" style={{fontSize:10,marginLeft:"auto"}}>✕ 선택해제</SBtn>)}
      </div>
    </div>

    {/* ── BODY ── */}
    <div style={{maxWidth:960,margin:"0 auto",padding:"22px 14px"}}>
      {tpl.map(cat=>{
        const catDone=cat.items.filter(i=>checks[i.id]).length;
        const overCount=cat.items.filter(i=>!checks[i.id]&&isOverdue(emp.joinDate,getEffDue(i.id,cat.dueDays,itemOverrides),false)).length;
        return(<div key={cat.id} style={{background:"#fff",borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 2px 16px rgba(30,50,120,.08)"}}>
          <div style={{padding:"12px 16px",background:"#fafbff",borderBottom:"1px solid #f0f4fa"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:9,flex:1,minWidth:200,flexWrap:"wrap"}}>
                <div style={{width:4,height:20,background:cat.color,borderRadius:2,flexShrink:0}}/>
                {editCatId===cat.id?(
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <input value={editCatVal} onChange={e=>setEditCatVal(e.target.value)}
                      style={{padding:"3px 9px",borderRadius:7,border:"1.5px solid #2E86DE",fontSize:14,fontWeight:700,outline:"none",width:170}}/>
                    <SBtn onClick={applyRenameCat} bg="#2E86DE" color="#fff">저장</SBtn>
                    <SBtn onClick={()=>setEditCatId(null)} bg="#f0f4fa" color="#8899bb">취소</SBtn>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontWeight:700,fontSize:15,color:"#1a2233"}}>{cat.category}</span>
                    <SBtn onClick={()=>{setEditCatId(cat.id);setEditCatVal(cat.category);}} bg="#f0f4fa" color="#8899bb" style={{fontSize:10}}>✏️</SBtn>
                  </div>
                )}
                {catDueEdit?.catId===cat.id?(
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#8899bb"}}>D+</span>
                    <input type="number" min={0} value={catDueEdit.val} onChange={e=>setCatDueEdit(p=>({...p,val:e.target.value}))}
                      style={{width:58,padding:"3px 7px",borderRadius:6,border:"1.5px solid #F5A623",fontSize:12,outline:"none"}}/>
                    <SBtn onClick={applyCatDue} bg="#F5A623" color="#fff">저장</SBtn>
                    <SBtn onClick={()=>setCatDueEdit(null)} bg="#f0f4fa" color="#8899bb">취소</SBtn>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <Badge text={`D+${cat.dueDays}`} color={cat.color}/>
                    <SBtn onClick={()=>setCatDueEdit({catId:cat.id,val:String(cat.dueDays)})} bg="#f0f4fa" color="#8899bb" style={{fontSize:10}}>✏️ 기한</SBtn>
                  </div>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {overCount>0&&<Badge text={`기한초과 ${overCount}개`} color="#E84545"/>}
                <span style={{fontSize:13,color:"#6b7a99",fontWeight:600}}>{catDone}/{cat.items.length}</span>
                <SBtn onClick={()=>setAddItemCatId(cat.id)} bg="#e8f5e9" color="#27AE60">＋ 항목추가</SBtn>
                <SBtn onClick={()=>confirmDeleteCat(cat.id)} bg="#fff0f0" color="#E84545">🗑 카테고리삭제</SBtn>
              </div>
            </div>
          </div>

          {cat.items.length===0&&<div style={{padding:"18px",textAlign:"center",color:"#c0cce0",fontSize:13}}>항목이 없습니다.</div>}
          {cat.items.map(item=>{
            const done=!!checks[item.id];
            const effDue=getEffDue(item.id,cat.dueDays,itemOverrides);
            const over=isOverdue(emp.joinDate,effDue,done);
            const hasOv=itemOverrides[item.id]!==undefined;
            const note=notes[item.id];
            const isSelected=selectedItem?.itemId===item.id;
            const pendingExt=extReqs.find(r=>r.itemId===item.id&&r.status==="pending");
            return(<div key={item.id}>
              <div onClick={()=>setSelectedItem(isSelected?null:{itemId:item.id,catId:cat.id,label:item.label,catDueDays:cat.dueDays})}
                style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",
                  background:isSelected?"#f0f5ff":done?"#f6fff9":over?"#fff8f8":"#fff",
                  borderBottom:note?"none":"1px solid #f4f7fa",
                  outline:isSelected?"2px solid #2E86DE":"none",outlineOffset:"-2px",
                  cursor:"pointer",transition:"background .15s"}}>
                <div onClick={e=>{e.stopPropagation();adminToggle(item.id);}} title="관리자 체크/해제"
                  style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",
                    border:`2px solid ${done?"#27AE60":over?"#E84545":"#cdd8e8"}`,
                    background:done?"#27AE60":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
                    boxShadow:done?"0 0 0 3px rgba(39,174,96,.15)":"none"}}>
                  {done&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                </div>
                {editItemId===item.id?(
                  <div style={{flex:1,display:"flex",gap:5,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                    <input value={editItemVal} onChange={e=>setEditItemVal(e.target.value)} autoFocus
                      onKeyDown={e=>e.key==="Enter"&&applyEditItemLabel(cat.id)}
                      style={{flex:1,padding:"3px 9px",borderRadius:6,border:"1.5px solid #2E86DE",fontSize:13,outline:"none"}}/>
                    <SBtn onClick={()=>applyEditItemLabel(cat.id)} bg="#2E86DE" color="#fff" style={{fontSize:11}}>저장</SBtn>
                    <SBtn onClick={()=>setEditItemId(null)} bg="#f0f4fa" color="#8899bb" style={{fontSize:11}}>취소</SBtn>
                  </div>
                ):(
                  <span style={{fontSize:14,color:done?"#6b8c7a":"#1a2233",textDecoration:done?"line-through":"none",flex:1}}>{item.label}</span>
                )}
                {hasOv&&<Badge text={`D+${effDue} (개별)`} color="#9B59B6"/>}
                {over&&!done&&<Badge text="기한초과" color="#E84545"/>}
                {pendingExt&&<Badge text="연장요청" color="#F5A623"/>}
                {note&&<span title="메모 있음" style={{fontSize:14}}>💬</span>}
                {isSelected&&<span style={{fontSize:10,color:"#2E86DE",fontWeight:700}}>선택됨</span>}
              </div>
              {note&&(
                <div style={{padding:"6px 16px 9px 47px",background:done?"#f6fff9":over?"#fff8f8":"#fff",borderBottom:"1px solid #f4f7fa"}}>
                  <div style={{background:"#fffbf0",border:"1px solid #F5A62330",borderRadius:8,padding:"8px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#F5A623"}}>💬 인사팀 메모</span>
                      <div style={{display:"flex",gap:5,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#bbb"}}>{fmtDT(note.updatedAt)}</span>
                        <SBtn onClick={()=>{setNoteModal({itemId:item.id,label:item.label});setNoteText(note.text);}} bg="#fff3cc" color="#c07800" style={{fontSize:10,padding:"2px 6px"}}>수정</SBtn>
                        <SBtn onClick={()=>deleteNote(item.id)} bg="#fff0f0" color="#cc8888" style={{fontSize:10,padding:"2px 6px"}}>삭제</SBtn>
                      </div>
                    </div>
                    <div style={{fontSize:13,color:"#5a4a20",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{note.text}</div>
                  </div>
                </div>
              )}
            </div>);
          })}
        </div>);
      })}
    </div>

    {/* ── MODALS ── */}
    {deleteConfirm&&<ConfirmDialog message={deleteConfirm.type==="item"?"이 항목을 삭제하시겠습니까?":"이 카테고리와 모든 항목을 삭제하시겠습니까?"} onYes={executeDelete} onNo={()=>setDeleteConfirm(null)} yesLabel="Yes" noLabel="No"/>}

    {addItemCatId&&(
      <Modal title="항목 추가" onClose={()=>{setAddItemCatId(null);setNewItemLabel("");}}>
        <Field label="항목명"><FI value={newItemLabel} onChange={e=>setNewItemLabel(e.target.value)} placeholder="예: 사원증 수령 확인" onKeyDown={e=>e.key==="Enter"&&applyAddItem()}/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}><PBtn onClick={applyAddItem} style={{flex:1}}>추가</PBtn><OBtn onClick={()=>{setAddItemCatId(null);setNewItemLabel("");}} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}
    {addCatModal&&(
      <Modal title="카테고리 추가" onClose={()=>setAddCatModal(false)}>
        <Field label="카테고리명"><FI value={newCat.category} onChange={e=>setNewCat(p=>({...p,category:e.target.value}))} placeholder="예: 수습 3개월 이내"/></Field>
        <Field label="제출기한 (입사 후 일수)"><FI type="number" value={newCat.dueDays} onChange={e=>setNewCat(p=>({...p,dueDays:e.target.value}))} placeholder="예: 90"/></Field>
        <Field label="색상"><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>{CAT_COLORS.map(c=><button key={c} onClick={()=>setNewCat(p=>({...p,color:c}))} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:newCat.color===c?"3px solid #1a2233":"2px solid transparent"}}/>)}</div></Field>
        <div style={{display:"flex",gap:10,marginTop:16}}><PBtn onClick={applyAddCat} style={{flex:1}}>추가</PBtn><OBtn onClick={()=>setAddCatModal(false)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {/* Bulk Due — applies ONLY to this employee via item-level overrides */}
    {bulkDueModal&&(
      <Modal title={`📅 제출기한 일괄 변경 — ${emp.name}`} onClose={()=>setBulkDueModal(false)} width={500}>
        <div style={{background:"#f0f8ff",border:"1px solid #2E86DE20",borderRadius:8,padding:"9px 13px",fontSize:12,color:"#2E86DE",marginBottom:14}}>
          ℹ️ 이 변경은 <strong>{emp.name}</strong> 에게만 적용됩니다. (항목별 개별 기한으로 저장)
        </div>
        <div style={{display:"flex",gap:0,marginBottom:18,borderRadius:10,overflow:"hidden",border:"1.5px solid #e2e8f0"}}>
          {[{l:"일수 증감",v:"delta"},{l:"직접 입력",v:"absolute"}].map(t=>(
            <button key={t.v} onClick={()=>setBulkDueMode(t.v)} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",background:bulkDueMode===t.v?"#9B59B6":"#f8faff",color:bulkDueMode===t.v?"#fff":"#8899bb"}}>{t.l}</button>
          ))}
        </div>
        {bulkDueMode==="delta"?(
          <>
            <div style={{background:"#f4f7fb",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              {tpl.map(c=>{
                const preview=parseInt(bulkDueDelta);
                return(<div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:"1px solid #e8ecf0"}}>
                  <span style={{color:"#1a2233",fontWeight:600}}>{c.category}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Badge text={`D+${c.dueDays}`} color={c.color}/>
                    {!isNaN(preview)&&preview!==0&&<span style={{fontSize:11,color:"#8899bb"}}>→ D+{Math.max(0,c.dueDays+preview)}</span>}
                  </div>
                </div>);
              })}
            </div>
            <Field label="증감 일수 (양수: 늘리기, 음수: 줄이기)"><FI type="number" value={bulkDueDelta} onChange={e=>setBulkDueDelta(e.target.value)} placeholder="예: +7 또는 -3"/></Field>
            <div style={{display:"flex",gap:10,marginTop:4}}><PBtn onClick={applyBulkDueDelta} color="#9B59B6" style={{flex:1}}>적용</PBtn><OBtn onClick={()=>setBulkDueModal(false)} style={{flex:1}}>취소</OBtn></div>
          </>
        ):(
          <>
            {tpl.map(c=><Field key={c.id} label={c.category}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,color:"#8899bb",minWidth:24}}>D+</span><FI type="number" value={bulkDueValues[c.id]||""} onChange={e=>setBulkDueValues(p=>({...p,[c.id]:e.target.value}))}/></div></Field>)}
            <div style={{display:"flex",gap:10,marginTop:4}}><PBtn onClick={applyBulkDueAbsolute} color="#9B59B6" style={{flex:1}}>적용</PBtn><OBtn onClick={()=>setBulkDueModal(false)} style={{flex:1}}>취소</OBtn></div>
          </>
        )}
      </Modal>
    )}

    {itemDueModal&&selectedItem&&(
      <Modal title={`📅 개별 기한 변경`} onClose={()=>setItemDueModal(false)} width={400}>
        <div style={{background:"#f8faff",borderRadius:10,padding:"11px 14px",marginBottom:14,fontSize:13}}>
          <div style={{fontWeight:700,color:"#1a2233",marginBottom:4}}>{selectedItem.label}</div>
          카테고리 기본: <strong>D+{selectedItem.catDueDays}</strong> · 현재 기한: <strong>D+{getEffDue(selectedItem.itemId,selectedItem.catDueDays,itemOverrides)}</strong>
        </div>
        <Field label="변경할 기한 (입사 후 일수)">
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,color:"#8899bb",fontWeight:600}}>D+</span><FI type="number" value={itemDueVal} onChange={e=>setItemDueVal(e.target.value)}/></div>
        </Field>
        <div style={{display:"flex",gap:10,marginTop:4}}><PBtn onClick={applyItemDue} color="#9B59B6" style={{flex:1}}>적용</PBtn><OBtn onClick={()=>setItemDueModal(false)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {mailModal&&(
      <Modal title={`📧 개별 메일 발송`} onClose={()=>setMailModal(null)} width={520}>
        <div style={{background:"#f8faff",borderRadius:10,padding:"11px 14px",marginBottom:14,fontSize:13}}>
          <span style={{color:"#6b7a99"}}>수신: </span><span style={{fontWeight:700,color:"#1a2233"}}>{emp.name} {emp.email?`(${emp.email})`:""}</span>
        </div>
        <Field label="제목"><FI value={mailSubject} onChange={e=>setMailSubject(e.target.value)}/></Field>
        <Field label="내용"><textarea value={mailBody} onChange={e=>setMailBody(e.target.value)} style={{width:"100%",height:150,padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}/></Field>
        <div style={{display:"flex",gap:10,marginTop:4}}><PBtn onClick={sendItemMail} color="#E84545" style={{flex:1}}>📧 발송</PBtn><OBtn onClick={()=>setMailModal(null)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {noteModal&&(
      <Modal title={`💬 인사팀 메모`} onClose={()=>{setNoteModal(null);setNoteText("");}} titleColor="#c07800">
        <div style={{background:"#fffbf0",border:"1px solid #F5A62330",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#9a7020",marginBottom:12}}>
          ℹ️ 이 메모는 직원 체크리스트 화면에도 즉시 표시됩니다.
        </div>
        <div style={{fontSize:13,fontWeight:600,color:"#1a2233",marginBottom:10}}>{noteModal.label}</div>
        <Field label="메모 내용"><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="안내사항, 주의사항 등을 입력하세요." style={{width:"100%",height:120,padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}/></Field>
        <div style={{display:"flex",gap:10,marginTop:4}}><PBtn onClick={saveNote} color="#F5A623" style={{flex:1}}>💬 저장</PBtn><OBtn onClick={()=>{setNoteModal(null);setNoteText("");}} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}
  </div>);
}

// ─────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────
function AdminDashboard({onBack}){
  const [employees,setEmployees]=useState([]);
  const [checksMap,setChecksMap]=useState({});
  const [tpl,setTpl]=useState([]);
  const [selected,setSelected]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",department:"",position:"",joinDate:"",email:""});
  const [loading,setLoading]=useState(true);
  const [lastClick,setLastClick]=useState({id:null,t:0});
  const [filterDept,setFilterDept]=useState("전체");
  const [filterStatus,setFilterStatus]=useState("전체");

  // Join date modal
  const [joinModal,setJoinModal]=useState(false);
  const [selectedEmpIds,setSelectedEmpIds]=useState(new Set());
  const [targetDate,setTargetDate]=useState("");

  // Global ext requests panel — null | "all" | "pending" | "approved"
  const [extPanel,setExtPanel]=useState(null);
  const [allExtReqs,setAllExtReqs]=useState([]);

  const reload=useCallback(async()=>{
    const [emps,t,er]=await Promise.all([load("employees",true),load("checklist_template",true),load("ext_requests_all",true)]);
    const empList=emps||[]; setEmployees(empList); setTpl(t||DEFAULT_TEMPLATE); setAllExtReqs(er||[]);
    const map={}; await Promise.all(empList.map(async e=>{map[e.id]=(await load(`checks_${e.id}`,true))||{};}));
    setChecksMap(map); setLoading(false);
  },[]);

  useEffect(()=>{reload();},[]);

  async function addEmployee(){
    if(!form.name||!form.department||!form.position||!form.joinDate){toast("모든 필수 항목을 입력해주세요.","warning");return;}
    const emp={...form,id:uid(),createdAt:new Date().toISOString()};
    await save("employees",[...employees,emp],true);
    setForm({name:"",department:"",position:"",joinDate:"",email:""}); setShowAdd(false);
    toast(`${emp.name}님이 등록되었습니다.`,"success"); reload();
  }

  async function deleteEmployee(id){
    if(!window.confirm("삭제하시겠습니까?"))return;
    await save("employees",employees.filter(e=>e.id!==id),true); toast("삭제되었습니다.","info"); reload();
  }

  function openJoinModal(){setSelectedEmpIds(new Set());setTargetDate("");setJoinModal(true);}
  function toggleEmpSel(id){setSelectedEmpIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});}
  function toggleAll(){
    if(selectedEmpIds.size===employees.length)setSelectedEmpIds(new Set());
    else setSelectedEmpIds(new Set(employees.map(e=>e.id)));
  }
  async function applyJoinDate(){
    if(!selectedEmpIds.size){toast("대상 입사자를 선택해주세요.","warning");return;}
    if(!targetDate){toast("변경할 일자를 선택해주세요.","warning");return;}
    const next=employees.map(e=>selectedEmpIds.has(e.id)?{...e,joinDate:targetDate}:e);
    await save("employees",next,true); setJoinModal(false);
    toast(`${selectedEmpIds.size}명의 입사일이 ${targetDate}(으)로 변경되었습니다.`,"success"); reload();
  }

  function sendReminder(emp){
    const ch=checksMap[emp.id]||[]; const over=[];
    tpl.forEach(cat=>cat.items.forEach(item=>{if(!ch[item.id]&&isOverdue(emp.joinDate,cat.dueDays,false))over.push(item.label);}));
    if(!over.length){toast("미수행 기한 초과 항목이 없습니다.","info");return;}
    const body=`안녕하세요, ${emp.name}님.\n\n다음 항목들이 기한 내에 완료되지 않았습니다:\n\n${over.map(l=>`• ${l}`).join("\n")}\n\n인사팀 드림`;
    window.open(`mailto:${emp.email||""}?subject=${encodeURIComponent(`[온보딩 알림] ${emp.name}님 미완료 항목 안내`)}&body=${encodeURIComponent(body)}`);
    toast(`${emp.name}님 알림 발송 (${over.length}개)`,"success");
  }

  function handleRowClick(emp){
    const now=Date.now();
    if(lastClick.id===emp.id&&now-lastClick.t<450)setSelected(emp);
    setLastClick({id:emp.id,t:now});
  }

  function handleExtTabClick(key){setExtPanel(p=>p===key?null:key);}

  if(selected)return <AdminDetail employee={selected} checks={checksMap[selected.id]||{}} tpl={tpl} onBack={()=>{setSelected(null);reload();}}/>;

  const depts=["전체",...new Set(employees.map(e=>e.department))];
  const filtered=employees.filter(e=>{
    const p=calcProgress(checksMap[e.id]||{},tpl);
    const ok=filterStatus==="전체"||(filterStatus==="완료"&&p.pct===100)||(filterStatus==="진행중"&&p.pct>0&&p.pct<100)||(filterStatus==="미시작"&&p.pct===0);
    return(filterDept==="전체"||e.department===filterDept)&&ok;
  });
  const allSelected=employees.length>0&&selectedEmpIds.size===employees.length;

  // ext req stats
  const extAll=allExtReqs.length, extPending=allExtReqs.filter(r=>r.status==="pending").length, extApproved=allExtReqs.filter(r=>r.status==="approved").length;

  // ext panel filtered list — group by employee
  const filteredExt=allExtReqs.filter(r=>{
    if(extPanel==="all")return true;
    if(extPanel==="pending")return r.status==="pending";
    if(extPanel==="approved")return r.status==="approved";
    return false;
  });
  // group by empName for display
  const extByEmp={};
  filteredExt.forEach(r=>{
    if(!extByEmp[r.empId])extByEmp[r.empId]={empName:r.empName,department:r.department,reqs:[]};
    extByEmp[r.empId].reqs.push(r);
  });
  const extGroups=Object.values(extByEmp);

  const DASH_EXT_TABS=[
    {key:"all",    icon:"📬", label:"전체",  count:extAll,     color:"#5B6EEA"},
    {key:"pending",icon:"⏳", label:"검토중", count:extPending, color:"#F5A623"},
    {key:"approved",icon:"✅",label:"승인됨", count:extApproved,color:"#27AE60"},
  ];

  return(<div style={{minHeight:"100vh",background:"#f0f4fb",fontFamily:"'Pretendard',sans-serif"}}>
    <div style={{background:"linear-gradient(135deg,#1a2233,#2E3A55)",padding:"20px 24px",color:"#fff"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",padding:"5px 12px",borderRadius:7,fontSize:12,cursor:"pointer",marginBottom:12}}>← 로그아웃</button>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:21,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>📊 온보딩 관리 대시보드</h1>
            <p style={{color:"#8daee8",fontSize:13,margin:0}}>총 {employees.length}명 신규입사자 관리 중</p>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {/* ── 기한 연장 요청 현황 아이콘들 ── */}
            {extAll>0&&(
              <div style={{display:"flex",gap:5,alignItems:"center",background:"rgba(255,255,255,.06)",borderRadius:12,padding:"6px 10px",border:"1px solid rgba(255,255,255,.12)"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,.5)",marginRight:4,fontWeight:600}}>기한연장요청</span>
                {DASH_EXT_TABS.map(tab=>{
                  const isActive=extPanel===tab.key;
                  return(<button key={tab.key} onClick={()=>handleExtTabClick(tab.key)} title={`${tab.label} (${tab.count}건)`}
                    style={{background:isActive?tab.color+"30":"rgba(255,255,255,.08)",border:`1.5px solid ${isActive?tab.color:"rgba(255,255,255,.15)"}`,
                      borderRadius:9,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",transition:"all .15s",minWidth:48}}>
                    <span style={{fontSize:16}}>{tab.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:isActive?tab.color:"rgba(255,255,255,.6)",marginTop:1}}>{tab.label}</span>
                    <span style={{fontSize:13,fontWeight:800,color:isActive?tab.color:"#fff"}}>{tab.count}</span>
                  </button>);
                })}
              </div>
            )}
            <SBtn onClick={openJoinModal}              bg="#F5A623" color="#fff" style={{padding:"7px 12px",fontSize:12,borderRadius:9}}>📅 입사일 변경</SBtn>
            <SBtn onClick={()=>employees.forEach(sendReminder)} bg="#E84545" color="#fff" style={{padding:"7px 12px",fontSize:12,borderRadius:9}}>📧 전체 알림</SBtn>
            <SBtn onClick={()=>setShowAdd(true)}       bg="#2E86DE" color="#fff" style={{padding:"7px 12px",fontSize:12,borderRadius:9}}>＋ 신규입사자</SBtn>
          </div>
        </div>
      </div>
    </div>

    {/* ── Extension requests panel ── */}
    {extPanel!==null&&(
      <div style={{background:"#fffbf0",borderBottom:"2px solid #F5A62330"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"14px 22px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#9a7020"}}>📬 기한 연장 요청 현황 — 전체 대상자</span>
              {DASH_EXT_TABS.map(tab=>(
                <button key={tab.key} onClick={()=>handleExtTabClick(tab.key)}
                  style={{background:extPanel===tab.key?tab.color+"22":"#f4f7fb",color:extPanel===tab.key?tab.color:"#8899bb",
                    border:`1.5px solid ${extPanel===tab.key?tab.color+"60":"#e2e8f0"}`,borderRadius:99,
                    padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {tab.icon} {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <button onClick={()=>setExtPanel(null)} style={{background:"transparent",border:"none",color:"#8899bb",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ 닫기</button>
          </div>
          {extGroups.length===0&&<div style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"12px 0"}}>해당 항목이 없습니다.</div>}
          {extGroups.map(g=>(
            <div key={g.empName+g.department} style={{background:"#fff",borderRadius:14,marginBottom:12,overflow:"hidden",boxShadow:"0 2px 10px rgba(30,50,120,.06)"}}>
              <div style={{padding:"10px 16px",background:"#f8faff",borderBottom:"1px solid #f0f4fa",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>👤</span>
                <span style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{g.empName}</span>
                <span style={{fontSize:12,color:"#6b7a99"}}>{g.department}</span>
                <Badge text={`${g.reqs.length}건`} color="#5B6EEA"/>
              </div>
              {g.reqs.map(r=>{
                const si={pending:["⏳ 검토중","#F5A623"],approved:["✅ 승인됨","#27AE60"],rejected:["❌ 반려됨","#E84545"]}[r.status];
                return(<div key={r.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 16px",borderBottom:"1px solid #f4f7fa",flexWrap:"wrap"}}>
                  <Badge text={si[0]} color={si[1]}/>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:600,fontSize:13,color:"#1a2233",marginBottom:2}}>{r.itemLabel}</div>
                    <div style={{fontSize:12,color:"#6b7a99"}}>D+{r.currentDue} → D+{r.currentDue+r.requestDays} ({r.requestDays}일 연장)</div>
                    <div style={{fontSize:12,color:"#8899bb",fontStyle:"italic",marginTop:2}}>사유: {r.reason}</div>
                    <div style={{fontSize:11,color:"#bbb",marginTop:1}}>{fmtDT(r.createdAt)}</div>
                  </div>
                </div>);
              })}
            </div>
          ))}
        </div>
      </div>
    )}

    <div style={{maxWidth:1100,margin:"0 auto",padding:"22px 14px"}}>
      {employees.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:12,marginBottom:20}}>
          {[{label:"전체 입사자",value:employees.length,color:"#2E86DE",icon:"👥"},
            {label:"100% 완료",value:employees.filter(e=>calcProgress(checksMap[e.id]||{},tpl).pct===100).length,color:"#27AE60",icon:"✅"},
            {label:"진행 중",value:employees.filter(e=>{const p=calcProgress(checksMap[e.id]||{},tpl).pct;return p>0&&p<100;}).length,color:"#F5A623",icon:"🔄"},
            {label:"미시작",value:employees.filter(e=>calcProgress(checksMap[e.id]||{},tpl).pct===0).length,color:"#E84545",icon:"⚠️"},
          ].map(c=>(
            <div key={c.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 12px rgba(30,50,120,.07)"}}>
              <div style={{fontSize:20,marginBottom:6}}>{c.icon}</div>
              <div style={{fontSize:26,fontWeight:800,color:c.color}}>{c.value}</div>
              <div style={{fontSize:13,color:"#6b7a99",fontWeight:500,marginTop:2}}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{background:"#fff",borderRadius:16,boxShadow:"0 2px 14px rgba(30,50,120,.07)",overflow:"hidden"}}>
        <div style={{padding:"13px 18px",borderBottom:"1px solid #f0f4fa",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <span style={{fontWeight:700,fontSize:15,color:"#1a2233"}}>신규입사자 현황</span>
          <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#8899bb"}}>행 더블클릭 → 상세보기</span>
            <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,color:"#1a2233",outline:"none"}}>
              {depts.map(d=><option key={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,color:"#1a2233",outline:"none"}}>
              {["전체","완료","진행중","미시작"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {loading?(
          <div style={{padding:44,textAlign:"center",color:"#8899bb"}}>불러오는 중...</div>
        ):employees.length===0?(
          <div style={{padding:60,textAlign:"center",color:"#8899bb"}}>
            <div style={{fontSize:38,marginBottom:10}}>📭</div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:5}}>등록된 신규입사자가 없습니다</div>
            <div style={{fontSize:13}}>상단 [＋ 신규입사자] 버튼을 눌러 추가하세요</div>
          </div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
              <thead>
                <tr style={{background:"#f8faff"}}>
                  {["성명","부서","직급","입사일","경과일","완료율","상태","액션"].map(h=>(
                    <th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:11,fontWeight:700,color:"#8899bb",letterSpacing:".4px",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp=>{
                  const {pct}=calcProgress(checksMap[emp.id]||{},tpl);
                  const elapsed=daysBetween(emp.joinDate);
                  const sc=pct===100?"#27AE60":pct===0?"#E84545":"#F5A623";
                  const st=pct===100?"완료":pct===0?"미시작":"진행중";
                  const empExtPending=allExtReqs.filter(r=>r.empId===emp.id&&r.status==="pending").length;
                  return(<tr key={emp.id} onClick={()=>handleRowClick(emp)}
                    style={{borderBottom:"1px solid #f0f4fa",cursor:"pointer",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 13px",fontWeight:700,color:"#1a2233"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {emp.name}
                        {empExtPending>0&&<Badge text={`연장요청 ${empExtPending}`} color="#F5A623"/>}
                      </div>
                    </td>
                    <td style={{padding:"12px 13px",color:"#4a5568"}}>{emp.department}</td>
                    <td style={{padding:"12px 13px",color:"#4a5568"}}>{emp.position}</td>
                    <td style={{padding:"12px 13px",color:"#4a5568"}}>{emp.joinDate}</td>
                    <td style={{padding:"12px 13px",color:"#4a5568"}}>{elapsed}일</td>
                    <td style={{padding:"12px 13px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{flex:1,height:6,background:"#e8ecf0",borderRadius:3,minWidth:64}}>
                          <div style={{height:"100%",width:`${pct}%`,background:sc,borderRadius:3,transition:"width .4s"}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:sc,minWidth:30}}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 13px"}}><Badge text={st} color={sc}/></td>
                    <td style={{padding:"12px 13px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <SBtn onClick={e=>{e.stopPropagation();sendReminder(emp);}} bg="#fff4f4" color="#E84545" style={{border:"1px solid #ffcccc"}}>📧 알림</SBtn>
                        <SBtn onClick={e=>{e.stopPropagation();deleteEmployee(emp.id);}} bg="#f4f7fb" color="#8899bb" style={{border:"1px solid #e2e8f0"}}>삭제</SBtn>
                      </div>
                    </td>
                  </tr>);
                })}
                {filtered.length===0&&<tr><td colSpan={8} style={{padding:28,textAlign:"center",color:"#8899bb",fontSize:13}}>필터 조건에 맞는 사원이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {showAdd&&(
      <Modal title="신규입사자 등록" onClose={()=>setShowAdd(false)}>
        {[{k:"name",l:"성명 *",p:"홍길동",t:"text"},{k:"department",l:"부서 *",p:"개발팀",t:"text"},
          {k:"position",l:"직급 *",p:"사원",t:"text"},{k:"joinDate",l:"입사일 *",p:"",t:"date"},
          {k:"email",l:"이메일",p:"hong@company.com",t:"email"}].map(f=>(
          <Field key={f.k} label={f.l}><FI type={f.t} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}/></Field>
        ))}
        <div style={{display:"flex",gap:10,marginTop:14}}><PBtn onClick={addEmployee} style={{flex:1}}>등록</PBtn><OBtn onClick={()=>setShowAdd(false)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {joinModal&&(
      <Modal title="📅 입사일 변경" onClose={()=>setJoinModal(false)} width={540}>
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
            <span style={{fontSize:13,fontWeight:700,color:"#1a2233"}}>대상 입사자 선택</span>
            <SBtn onClick={toggleAll} bg={allSelected?"#e8f5e9":"#f0f4fa"} color={allSelected?"#27AE60":"#5B6EEA"} style={{fontSize:12}}>
              {allSelected?"✅ 전체 선택됨":"□ 전체 선택"}
            </SBtn>
          </div>
          <div style={{maxHeight:210,overflowY:"auto",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"4px 0"}}>
            {employees.map(e=>(
              <div key={e.id} onClick={()=>toggleEmpSel(e.id)}
                style={{display:"flex",alignItems:"center",gap:9,padding:"8px 13px",cursor:"pointer",
                  background:selectedEmpIds.has(e.id)?"#f0f5ff":"transparent",borderBottom:"1px solid #f4f7fa",transition:"background .15s"}}
                onMouseEnter={ev=>ev.currentTarget.style.background=selectedEmpIds.has(e.id)?"#e8f0ff":"#f8faff"}
                onMouseLeave={ev=>ev.currentTarget.style.background=selectedEmpIds.has(e.id)?"#f0f5ff":"transparent"}>
                <div style={{width:17,height:17,borderRadius:4,border:`2px solid ${selectedEmpIds.has(e.id)?"#2E86DE":"#cdd8e8"}`,background:selectedEmpIds.has(e.id)?"#2E86DE":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {selectedEmpIds.has(e.id)&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontWeight:700,fontSize:13,color:"#1a2233",minWidth:55}}>{e.name}</span>
                <span style={{fontSize:12,color:"#6b7a99"}}>{e.department} · {e.position}</span>
                <span style={{fontSize:12,color:"#8899bb",marginLeft:"auto"}}>현재: {e.joinDate}</span>
              </div>
            ))}
          </div>
          {selectedEmpIds.size>0&&<div style={{marginTop:7,fontSize:12,color:"#2E86DE",fontWeight:600}}>✅ {selectedEmpIds.size}명 선택됨</div>}
        </div>
        <Field label="변경할 입사일">
          <FI type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)}/>
          {targetDate&&<div style={{fontSize:12,color:"#27AE60",marginTop:4,fontWeight:600}}>→ {targetDate} 로 변경됩니다.</div>}
        </Field>
        <div style={{background:"#fffbf0",border:"1px solid #F5A62340",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#9a7020",marginBottom:14}}>
          ⚠️ 선택된 {selectedEmpIds.size}명의 입사일이 일괄 변경됩니다. 적용 후 되돌릴 수 없습니다.
        </div>
        <div style={{display:"flex",gap:10}}>
          <PBtn onClick={applyJoinDate} color="#F5A623" disabled={!selectedEmpIds.size||!targetDate} style={{flex:1}}>
            {selectedEmpIds.size>0&&targetDate?`${selectedEmpIds.size}명 입사일 변경`:"선택 후 적용"}
          </PBtn>
          <OBtn onClick={()=>setJoinModal(false)} style={{flex:1}}>취소</OBtn>
        </div>
      </Modal>
    )}
  </div>);
}

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("home");
  const [currentUser,setCurrentUser]=useState(null);
  useEffect(()=>{
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
  },[]);
  function handleLogin(emp){
    if(emp.adminMode){setView("adminLogin");return;}
    setCurrentUser(emp); setView("userChecklist");
  }
  if(view==="home")return <UserHome onLogin={handleLogin}/>;
  if(view==="userChecklist")return <UserChecklist employee={currentUser} onBack={()=>setView("home")}/>;
  if(view==="adminLogin")return <AdminLogin onLogin={()=>setView("adminDash")} onBack={()=>setView("home")}/>;
  if(view==="adminDash")return <AdminDashboard onBack={()=>setView("home")}/>;
  return null;
}
