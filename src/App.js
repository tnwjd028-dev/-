import { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";

// ── EmailJS 설정 ──────────────────────────────────────────
// EmailJS 가입 후 아래 값을 본인 계정 정보로 교체하세요
const EJS_SERVICE  = "service_5b1skl5";
const EJS_TEMPLATE = "template_1cw68sm";
const EJS_PUBLIC   = "GtagXiJ0WuIWlvJue";
const NOTIFY_TO    = "insa@bimatrix.co.kr";

async function sendEmail(subject, body, toName=""){
  try{
    await emailjs.send(EJS_SERVICE, EJS_TEMPLATE,
      {to_email:NOTIFY_TO, to_name:"인사기획팀", subject, body, email:NOTIFY_TO},
      {publicKey: EJS_PUBLIC}
    );
    return true;
  } catch(e){
    console.error("EmailJS error:",e);
    return false;
  }
}
// ──────────────────────────────────────────────────────────

const DEFAULT_TEMPLATE = [
  { id:"cat_1", category:"입사 2주 전", dueDays:-14, color:"#9B59B6",
    items:[{id:"c01",label:"근로계약서 서명 및 제출"},{id:"c02",label:"개인정보 수집·이용 동의서 제출"},
           {id:"c03",label:"보안서약서 서명 및 제출"}]},
  { id:"cat_2", category:"입사 1주 전", dueDays:-7, color:"#2E86DE",
    items:[{id:"c04",label:"신분증 사본 제출"},{id:"c05",label:"통장 사본 제출 (급여 계좌)"},
           {id:"w01",label:"4대보험 가입신청서 제출"},{id:"w02",label:"주민등록등본 제출 (3개월 이내 발급)"},
           {id:"w03",label:"가족관계증명서 제출 (해당자)"}]},
  { id:"cat_3", category:"입사 당일", dueDays:0, color:"#E84545",
    items:[{id:"w04",label:"최종학력증명서 제출"},{id:"w05",label:"경력증명서 제출 (경력자 해당)"},
           {id:"w06",label:"자격증 사본 제출 (해당자)"},{id:"m01",label:"건강검진 결과서 제출"}]},
  { id:"cat_4", category:"입사 후", dueDays:30, color:"#27AE60",
    items:[{id:"m02",label:"사내 IT 시스템 교육 이수"},{id:"m03",label:"정보보안 교육 이수"},
           {id:"m04",label:"팀 OT(오리엔테이션) 완료"},{id:"m05",label:"멘토 1:1 미팅 완료"},
           {id:"m06",label:"사내 복지제도 안내 확인"}]},
];
const CAT_COLORS = ["#E84545","#F5A623","#2E86DE","#27AE60","#9B59B6","#16A085","#E67E22","#34495E"];

const DEFAULT_OFFBOARDING_TEMPLATE = [
  { id:"ocat_1", category:"퇴사 당일", dueDays:0, color:"#E84545",
    items:[{id:"o01",label:"보안유지서약서 작성 및 제출"},{id:"o02",label:"사원증 반납"}]},
  { id:"ocat_2", category:"퇴사 1주일 전", dueDays:-7, color:"#F5A623",
    items:[{id:"o03",label:"노트북 반납"},{id:"o04",label:"모니터 및 기타 장비 반납"},{id:"o05",label:"계정/시스템 접근 권한 회수"}]},
  { id:"ocat_3", category:"퇴사 1개월 전", dueDays:-30, color:"#2E86DE",
    items:[{id:"o06",label:"인수인계 문서 작성 완료"},{id:"o07",label:"퇴직연금 정산 확인"},{id:"o08",label:"연차 발생일 계산 및 정산 확인"}]},
];

// ── utils ──
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const daysBetween = d => { const a=new Date(d),b=new Date(); a.setHours(0,0,0,0); b.setHours(0,0,0,0); return Math.floor((b-a)/86400000); };
const calcProgress = (checks,tpl) => { const all=(tpl||[]).flatMap(c=>c.items); const done=all.filter(i=>checks?.[i.id]).length; return {done,total:all.length,pct:all.length?Math.round((done/all.length)*100):0}; };
const getEffDue = (itemId,catDueDays,ov) => ov?.[itemId]??catDueDays;
const isOverdue = (joinDate,dueDays,checked) => !checked && daysBetween(joinDate)>dueDays;
const fmtD = v => v < 0 ? `D${v}` : `D+${v}`;
const fmtDeadline = (baseDate, dueDays) => { const d=new Date(baseDate); d.setDate(d.getDate()+dueDays); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; };
const fmtDT = iso => { if(!iso)return""; const d=new Date(iso); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };


function toast(msg,type="info"){
  const C={info:"#2E86DE",success:"#27AE60",warning:"#F5A623",error:"#E84545"};
  const el=document.createElement("div");
  el.style.cssText=`position:fixed;bottom:26px;right:26px;background:${C[type]};color:#fff;padding:12px 20px;border-radius:10px;font-family:'Pretendard',sans-serif;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,.2);animation:_t .3s ease`;
  el.textContent=msg;
  const s=document.createElement("style"); s.textContent=`@keyframes _t{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`; document.head.appendChild(s); document.body.appendChild(el); setTimeout(()=>el.remove(),3200);
}

const SUPABASE_URL  = 'https://hontxxomiezpikjgwayv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbnR4eG9taWV6cGlramd3YXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODkzODgsImV4cCI6MjA5MzY2NTM4OH0.l6oiw0zbWvpQ7DeJZLAm1gjNWaojfhPYQKuc1sdo5Rg';

const load = async (k) => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(k)}&select=value`,
      { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
    );
    const data = await res.json();
    return data?.[0]?.value ?? null;
  } catch { return null; }
};

const save = async (k, v) => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/kv_store`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key: encodeURIComponent(k), value: v })
    });
  } catch {}
};
// ── UI primitives ──
function ProgressRing({pct,size=64,stroke=6,color="#2E86DE",textColor="#1a2233",trackColor="#e8ecf0"}){
  const r=(size-stroke)/2,circ=2*Math.PI*r,off=circ-(pct/100)*circ;
  return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} style={{transition:"stroke-dashoffset .6s ease"}} strokeLinecap="round"/>
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" style={{fontSize:size*.24,fontWeight:700,fill:textColor,fontFamily:"'Pretendard',sans-serif",transform:"rotate(90deg)",transformOrigin:"center"}}>{pct}%</text>
  </svg>);
}
function Badge({text,color}){
  return <span style={{background:color+"18",color,border:`1px solid ${color}40`,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:".3px",whiteSpace:"nowrap"}}>{text}</span>;
}
function FI({value,onChange,placeholder="",type="text",style={},onKeyDown,autoFocus}){
  const [f,setF]=useState(false);
  return <input autoFocus={autoFocus} type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{width:"100%",padding:"10px 13px",borderRadius:9,border:`1.5px solid ${f?"#2E86DE":"#e2e8f0"}`,fontSize:14,outline:"none",boxSizing:"border-box",transition:"border .2s",fontFamily:"inherit",...style}}
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
function SBtn({children,onClick,bg="#f0f4fa",color="#5B6EEA",hoverBg,style={},title=""}){
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} title={title}
    onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{background:hov&&hoverBg?hoverBg:bg,color,border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background .15s,opacity .15s",opacity:hov?0.85:1,...style}}>{children}</button>;
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
  const [type,setType]=useState(null); // null | "onboarding" | "offboarding"
  const [name,setName]=useState("");
  const [empId,setEmpId]=useState("");
  const [date,setDate]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [blockedEmp,setBlockedEmp]=useState(null);
  const [reloginReason,setReloginReason]=useState("");
  const [reloginSent,setReloginSent]=useState(false);

  async function submit(){
    if(!name.trim()||!empId.trim()||!date){setErr("모든 항목을 입력해주세요.");return;}
    setLoading(true); setErr("");
    if(type==="onboarding"){
      const emps=(await load("employees",true))||[];
      const emp=emps.find(e=>e.name.trim()===name.trim()&&e.empId===empId.trim()&&e.joinDate===date);
      if(!emp){setErr("등록된 입사자 정보를 찾을 수 없습니다. 인사팀에 문의해주세요.");setLoading(false);return;}
      const survey=await load(`survey_on_${emp.id}`,true);
      if(survey&&!survey.reloginApproved){
        // check if already has a pending request
        const allReqs=(await load("relogin_requests",true))||[];
        const hasPending=allReqs.some(r=>r.empId===emp.id&&r.status==="pending");
        setBlockedEmp({...emp,surveyKey:`survey_on_${emp.id}`});
        setReloginSent(hasPending);
        setLoading(false);return;
      }
      onLogin(emp);
    } else {
      const emps=(await load("offboarding_employees",true))||[];
      const emp=emps.find(e=>e.name.trim()===name.trim()&&e.empId===empId.trim()&&e.leaveDate===date);
      if(!emp){setErr("등록된 퇴사자 정보를 찾을 수 없습니다. 인사팀에 문의해주세요.");setLoading(false);return;}
      const survey=await load(`survey_off_${emp.id}`,true);
      if(survey&&!survey.reloginApproved){
        const allReqs=(await load("relogin_requests",true))||[];
        const hasPending=allReqs.some(r=>r.empId===emp.id&&r.status==="pending");
        setBlockedEmp({...emp,offboarding:true,surveyKey:`survey_off_${emp.id}`});
        setReloginSent(hasPending);
        setLoading(false);return;
      }
      onLogin({...emp,offboarding:true});
    }
    setLoading(false);
  }

  async function submitReloginRequest(){
    if(!reloginReason.trim()){toast("재로그인 사유를 입력해주세요.","warning");return;}
    const req={id:uid(),empId:blockedEmp.id,empName:blockedEmp.name,department:blockedEmp.department,
      position:blockedEmp.position,type:blockedEmp.offboarding?"off":"on",
      surveyKey:blockedEmp.surveyKey,reason:reloginReason.trim(),
      status:"pending",createdAt:new Date().toISOString()};
    const all=(await load("relogin_requests",true))||[];
    await save("relogin_requests",[...all,req],true);
    setReloginSent(true); setReloginReason("");
    toast("재로그인 요청이 인사기획팀에 전달되었습니다.","success");
  }

  if(blockedEmp) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif",position:"relative",padding:"16px",background:"linear-gradient(135deg,#e8e4ff 0%,#f5f3ff 50%,#e4f0ff 100%)"}}>
      <div style={{background:"#fff",borderRadius:28,boxShadow:"0 8px 48px rgba(100,80,200,.13)",padding:"40px 32px",width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28}}>✅</div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"3px",color:"#a084ee",marginBottom:8}}>BI MATRIX</div>
          <h2 style={{fontSize:18,fontWeight:800,color:"#1a1a2e",margin:"0 0 10px",lineHeight:1.5}}>모든 온보딩 체크리스트가<br/>완료되었습니다.</h2>
          <p style={{fontSize:13,color:"#8899bb",lineHeight:1.7,margin:0}}>접속이 필요한 경우,<br/>인사기획팀에 문의주세요.</p>
        </div>
        <div style={{borderTop:"1px solid #f0f0f8",paddingTop:20}}>
          {reloginSent?(
            <div style={{background:"#f0f8ff",border:"1px solid #2E86DE30",borderRadius:12,padding:"16px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:8}}>📬</div>
              <div style={{fontWeight:700,fontSize:14,color:"#2E86DE",marginBottom:4}}>재로그인 요청이 접수되었습니다</div>
              <div style={{fontSize:12,color:"#8899bb",lineHeight:1.6}}>인사기획팀 승인 후 접속 가능합니다.</div>
            </div>
          ):(
            <>
              <div style={{fontSize:13,fontWeight:700,color:"#1a2233",marginBottom:8}}>🔓 재로그인 요청</div>
              <textarea value={reloginReason} onChange={e=>setReloginReason(e.target.value)}
                placeholder="재접속이 필요한 사유를 입력해주세요." rows={3}
                style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6,marginBottom:10}}/>
              <button onClick={submitReloginRequest}
                style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
                재로그인 요청 보내기
              </button>
            </>
          )}
          <button onClick={()=>{setBlockedEmp(null);setType(null);setName("");setEmpId("");setDate("");setErr("");setReloginReason("");setReloginSent(false);}}
            style={{width:"100%",padding:"12px",borderRadius:14,border:"1.5px solid #e2e4f0",background:"#fff",color:"#6b6b8a",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f5f5fa"}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>← 처음으로</button>
        </div>
      </div>
    </div>
  );

  const BG = (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#e8e4ff 0%,#f5f3ff 50%,#e4f0ff 100%)",zIndex:0}}>
      <div style={{position:"absolute",top:32,left:32,width:72,height:72,borderRadius:18,background:"rgba(130,100,255,.18)"}}/>
      <div style={{position:"absolute",top:28,right:36,width:60,height:60,borderRadius:16,background:"rgba(100,200,190,.18)"}}/>
      <div style={{position:"absolute",bottom:36,left:40,width:52,height:52,borderRadius:14,background:"rgba(255,120,120,.18)"}}/>
      <div style={{position:"absolute",bottom:30,right:32,width:64,height:64,borderRadius:18,background:"rgba(140,100,255,.18)"}}/>
    </div>
  );

  const wrap = children => (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif",position:"relative",padding:"16px"}}>
      {BG}
      <div style={{background:"#fff",borderRadius:28,boxShadow:"0 8px 48px rgba(100,80,200,.13)",padding:"clamp(28px,5vw,44px) clamp(20px,5vw,40px) 32px",width:"100%",maxWidth:400,position:"relative",zIndex:1,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:56,height:56,background:"linear-gradient(135deg,#7c5ce8,#a084ee)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26}}>📋</div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"3px",color:"#a084ee",marginBottom:6}}>BI MATRIX</div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#1a1a2e",margin:"0 0 6px",letterSpacing:"-.3px"}}>입/퇴사 체크리스트</h1>
          <p style={{color:"#9090aa",fontSize:13,margin:0}}>아래 유형을 선택하세요</p>
        </div>
        {children}
      </div>
    </div>
  );

  if(!type) return wrap(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
        {[{key:"onboarding",label:"입사자",sub:"온보딩 체크리스트",grad:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",
            icon:<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>},
          {key:"offboarding",label:"퇴사자",sub:"오프보딩 체크리스트",grad:"linear-gradient(135deg,#e84c8b,#E84545)",
            icon:<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          ].map(t=>(
          <button key={t.key} onClick={()=>setType(t.key)}
            style={{flex:"1 1 120px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
              padding:"24px 12px",borderRadius:20,border:"none",background:t.grad,
              cursor:"pointer",fontFamily:"inherit",transition:"transform .18s, box-shadow .18s",
              boxShadow:"0 4px 18px rgba(100,80,200,.22)"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(100,80,200,.32)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 18px rgba(100,80,200,.22)";}}>
            {t.icon}
            <span style={{fontWeight:800,fontSize:17,color:"#fff"}}>{t.label}</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,.8)",fontWeight:500}}>{t.sub}</span>
          </button>
        ))}
      </div>
      <button onClick={()=>onLogin({adminMode:true})}
        style={{width:"100%",padding:"13px",borderRadius:14,border:"1.5px solid #e2e4f0",background:"#fff",
          color:"#6b6b8a",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
          transition:"background .15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="#f5f5fa"}
        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
        🔐 관리자 로그인
      </button>
    </div>
  );

  const isOn=type==="onboarding";
  const accentGrad=isOn?"linear-gradient(135deg,#5B6EEA,#7c5ce8)":"linear-gradient(135deg,#e84c8b,#E84545)";
  const accentColor=isOn?"#5B6EEA":"#E84545";
  return wrap(
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <button onClick={()=>{setType(null);setErr("");}} style={{background:"none",border:"none",color:"#9090aa",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textAlign:"left",marginBottom:2,padding:0}}>← 유형 선택으로</button>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
        <span style={{fontSize:18}}>{isOn?"🧑‍💼":"👋"}</span>
        <span style={{fontWeight:800,fontSize:15,color:accentColor}}>{isOn?"입사자":"퇴사자"} 체크리스트</span>
      </div>
      <Field label="성명"><FI value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" onKeyDown={e=>e.key==="Enter"&&submit()}/></Field>
      <Field label="사번"><FI value={empId} onChange={e=>setEmpId(e.target.value)} placeholder="예: EMP001" onKeyDown={e=>e.key==="Enter"&&submit()}/></Field>
      <Field label={isOn?"입사일":"퇴사일"}><FI type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
      {err&&<p style={{color:"#E84545",fontSize:13,margin:0,background:"#fff0f0",padding:"8px 12px",borderRadius:8}}>{err}</p>}
      <button onClick={submit} disabled={loading}
        style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:accentGrad,
          color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",
          fontFamily:"inherit",opacity:loading?.6:1,boxShadow:"0 4px 14px rgba(100,80,200,.25)"}}>
        {loading?"확인 중...":"체크리스트 열기 →"}
      </button>
    </div>
  );
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
  const [showSurvey,setShowSurvey]=useState(false);
  const [surveyDone,setSurveyDone]=useState(false);
  const [prevSurvey,setPrevSurvey]=useState(null);
  useEffect(()=>{
    Promise.all([
      load(`checks_${employee.id}`,true), load("checklist_template",true),
      load(`item_overrides_${employee.id}`,true), load(`item_notes_${employee.id}`,true),
      load(`ext_requests_${employee.id}`,true), load(`survey_on_${employee.id}`,true),
    ]).then(([c,t,ov,n,er,sv])=>{
      setChecks(c||{}); setTpl(t||DEFAULT_TEMPLATE); setItemOverrides(ov||{}); setNotes(n||{}); setExtReqs(er||[]);
      if(sv&&!sv.reloginApproved)setSurveyDone(true);
      if(sv)setPrevSurvey(sv);
      setLoading(false);
    });
  }, [employee.id]);

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

 const cntRejected=extReqs.filter(r=>r.status==="rejected").length;
  const EXT_TABS=[
    {key:"all",    icon:"📬", label:"전체",  count:cntAll,    color:"#fff", activeBg:"rgba(255,255,255,.25)"},
    {key:"pending",icon:"⏳", label:"검토중", count:cntPending,color:"#F5A623", activeBg:"rgba(245,166,35,.22)"},
    {key:"approved",icon:"✅",label:"승인됨", count:cntApproved,color:"#27AE60",activeBg:"rgba(39,174,96,.22)"},
    {key:"rejected",icon:"❌",label:"반려됨", count:cntRejected,color:"#E84545",activeBg:"rgba(232,69,69,.22)"},
  ];

  const filteredReqs = extReqs.slice().reverse().filter(r=>{
    if(extPanel==="all")return true;
    if(extPanel==="pending")return r.status==="pending";
    if(extPanel==="approved")return r.status==="approved";
    if(extPanel==="rejected")return r.status==="rejected";
    return false;
  });

  return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8e4ff,#f5f3ff,#e4f0ff)",fontFamily:"'Pretendard',sans-serif"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",padding:"24px 28px",color:"#fff"}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <button onClick={onBack}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.25)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.12)"}
          style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",marginBottom:16,transition:"background .15s"}}>← 돌아가기</button>
        <div style={{display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap"}}>
          <ProgressRing pct={pct} size={78} stroke={7} color="#fff" textColor="#fff" trackColor="rgba(255,255,255,.3)"/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".8px",color:"rgba(255,255,255,.65)",marginBottom:4}}>온보딩 진행률</div>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>{employee.name}님 체크리스트</h2>
            <div style={{fontSize:13,color:"rgba(255,255,255,.75)"}}>{employee.department} · {employee.position} · 입사 {elapsed}일차 · {done}/{total} 완료</div>
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
                      onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,.18)";}}
                      onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,.08)";}}
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
      <div style={{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1.5px solid rgba(91,110,234,.15)"}}>
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
                {r.status==="approved"&&<Badge text={`${fmtD(r.currentDue+r.requestDays)} (연장 확정)`} color="#27AE60"/>}
                {r.status==="rejected"&&r.rejectReason&&(
  <div style={{fontSize:12,color:"#E84545",marginTop:4,background:"#fff0f0",borderRadius:7,padding:"6px 10px"}}>
    💬 반려 사유: {r.rejectReason}
  </div>
)}
              </div>
              <div style={{fontSize:12,color:"#8899bb",marginTop:6}}>요청: {fmtD(r.currentDue)} → {fmtD(r.currentDue+r.requestDays)} ({r.requestDays}일 연장)</div>
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
        return(<div key={cat.id} style={{background:"#fff",borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(91,110,234,.1)"}}>
          <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#f5f3ff,#eef0ff)",borderBottom:"1px solid rgba(91,110,234,.12)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:4,height:20,background:cat.color,borderRadius:2}}/>
              <span style={{fontWeight:700,fontSize:15,color:"#1a2233"}}>{cat.category}</span>
              <Badge text={cat.dueDays < 0 ? `D${cat.dueDays}` : `D+${cat.dueDays}`} color={cat.color}/>
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
                {approvedReq&&hasOverride&&<Badge text={`✅ 연장: ${fmtD(effDue)}`} color="#27AE60"/>}
                {!approvedReq&&hasOverride&&<Badge text={`${fmtD(effDue)} (연장)`} color="#27AE60"/>}
                {over&&!done&&<Badge text="기한초과" color="#E84545"/>}
                {pendingReq&&<Badge text="연장요청중" color="#F5A623"/>}
                {!done&&!pendingReq&&(
                  <SBtn onClick={e=>{e.stopPropagation();setExtModal({item,catDueDays:cat.dueDays});}}
                    bg={over?"#FFF3CD":"#f0f4fa"} hoverBg={over?"#ffe8a0":"#e4eaf8"} color={over?"#9a7020":"#8899bb"} style={{fontSize:11}}>⏰ 기한연장요청</SBtn>
                )}
                <AttachBtn itemId={item.id} empId={employee.id} prefix="on"/>
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
      {pct===100&&(<div style={{background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",borderRadius:16,padding:"24px",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>🎉</div>
        <div style={{fontWeight:800,fontSize:18}}>모든 온보딩 항목을 완료했습니다!</div>
        <div style={{marginTop:10}}>
          {surveyDone
            ?<span style={{fontSize:14,color:"rgba(255,255,255,.85)"}}>✅ 만족도 설문 완료 — 소중한 의견 감사합니다!</span>
            :<button onClick={()=>setShowSurvey(true)} style={{marginTop:4,padding:"10px 24px",borderRadius:10,border:"2px solid rgba(255,255,255,.8)",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.28)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}>📋 만족도 설문 참여하기</button>
          }
        </div>
      </div>)}
    </div>

    {showSurvey&&<SurveyModal type="on" initialData={prevSurvey} onClose={()=>setShowSurvey(false)} onSubmit={async(data)=>{
      await save(`survey_on_${employee.id}`,data,true);
      toast("설문 응답이 저장되었습니다. 감사합니다!","success");
      setTimeout(()=>onBack(),800);
    }}/>}

    {extModal&&(
      <Modal title="⏰ 기한 연장 요청" onClose={()=>{setExtModal(null);setExtDays("");setExtReason("");}} width={460}>
        <div style={{background:"#f8faff",borderRadius:10,padding:"12px 15px",marginBottom:16}}>
          <div style={{fontSize:12,color:"#8899bb",marginBottom:4}}>대상 항목</div>
          <div style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{extModal.item.label}</div>
          <div style={{fontSize:12,color:"#8899bb",marginTop:4}}>현재 기한: {fmtD(getEffDue(extModal.item.id,extModal.catDueDays,itemOverrides))}</div>
        </div>
        <Field label="연장 요청 일수">
          <FI type="number" value={extDays} onChange={e=>setExtDays(e.target.value)} placeholder="예: 3"/>
          {extDays&&!isNaN(parseInt(extDays))&&parseInt(extDays)>0&&(
            <div style={{fontSize:12,color:"#27AE60",marginTop:4}}>→ {fmtD(getEffDue(extModal.item.id,extModal.catDueDays,itemOverrides)+parseInt(extDays))} 로 연장 요청</div>
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
  return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif",position:"relative",padding:"16px"}}>
    {/* 홈화면과 동일한 배경 */}
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#e8e4ff 0%,#f5f3ff 50%,#e4f0ff 100%)",zIndex:0}}>
      <div style={{position:"absolute",top:32,left:32,width:72,height:72,borderRadius:18,background:"rgba(130,100,255,.18)"}}/>
      <div style={{position:"absolute",top:28,right:36,width:60,height:60,borderRadius:16,background:"rgba(100,200,190,.18)"}}/>
      <div style={{position:"absolute",bottom:36,left:40,width:52,height:52,borderRadius:14,background:"rgba(255,120,120,.18)"}}/>
      <div style={{position:"absolute",bottom:30,right:32,width:64,height:64,borderRadius:18,background:"rgba(140,100,255,.18)"}}/>
    </div>
    <div style={{background:"#fff",borderRadius:28,boxShadow:"0 8px 48px rgba(100,80,200,.13)",padding:"44px 40px 36px",width:"100%",maxWidth:380,position:"relative",zIndex:1,boxSizing:"border-box"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{width:56,height:56,background:"linear-gradient(135deg,#7c5ce8,#a084ee)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:24}}>🔐</div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"3px",color:"#a084ee",marginBottom:6}}>BI MATRIX</div>
        <h2 style={{fontWeight:800,fontSize:20,color:"#1a1a2e",margin:0}}>관리자 로그인</h2>
      </div>
      <FI type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호 입력" style={{marginBottom:10}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      {err&&<p style={{color:"#E84545",fontSize:13,margin:"0 0 10px",background:"#fff0f0",padding:"8px 12px",borderRadius:8}}>{err}</p>}
      <button onClick={submit} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(100,80,200,.25)",marginBottom:10}}>로그인</button>
      <button onClick={onBack} style={{width:"100%",padding:"13px",borderRadius:14,border:"1.5px solid #e2e4f0",background:"#fff",color:"#6b6b8a",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← 돌아가기</button>
    </div>
  </div>);
}

// ─────────────────────────────────────────────────────────
// SURVEY MODAL
// ─────────────────────────────────────────────────────────
function SurveyModal({onClose,onSubmit,type="on",initialData=null}){
  const [rating,setRating]=useState(initialData?.rating||0);
  const [hov,setHov]=useState(0);
  const [helpful,setHelpful]=useState(initialData?.helpful||"");
  const [improve,setImprove]=useState(initialData?.improve||"");
  const [other,setOther]=useState(initialData?.other||"");
  const labels=["","매우 불만족","불만족","보통","만족","매우 만족"];
  function submit(){
    if(!rating){toast("만족도 별점을 선택해주세요.","warning");return;}
    onSubmit({rating,helpful:helpful.trim(),improve:improve.trim(),other:other.trim(),submittedAt:new Date().toISOString()});
  }
  return(
    <Modal title={type==="on"?"📋 입사 온보딩 완료 설문":"📋 퇴사 체크리스트 완료 설문"} onClose={onClose} width={520}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:8}}>{type==="on"?"🎉":"✅"}</div>
        <div style={{fontSize:15,fontWeight:700,color:"#1a2233",marginBottom:4}}>모든 항목을 완료하셨습니다!</div>
        <div style={{fontSize:13,color:"#8899bb",lineHeight:1.6}}>짧은 설문에 응해주시면 더 나은 {type==="on"?"온보딩":"퇴사 처리"} 경험을 만드는 데 도움이 됩니다.</div>
      </div>
      <Field label="전반적인 만족도 ★">
        <div style={{display:"flex",justifyContent:"center",gap:2,marginBottom:4}}>
          {[1,2,3,4,5].map(i=>(
            <span key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(0)} onClick={()=>setRating(i)}
              style={{fontSize:38,cursor:"pointer",color:i<=(hov||rating)?"#F5A623":"#ddd",transition:"color .1s",userSelect:"none",lineHeight:1}}>★</span>
          ))}
        </div>
        {(hov||rating)>0&&<div style={{textAlign:"center",fontSize:13,color:"#F5A623",fontWeight:700,marginTop:2}}>{labels[hov||rating]}</div>}
      </Field>
      <Field label="도움이 된 부분">
        <textarea value={helpful} onChange={e=>setHelpful(e.target.value)} placeholder="어떤 부분이 특히 도움이 되었나요?" rows={3}
          style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
      </Field>
      <Field label="개선이 필요한 부분">
        <textarea value={improve} onChange={e=>setImprove(e.target.value)} placeholder="불편하거나 개선이 필요한 점을 알려주세요." rows={3}
          style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
      </Field>
      <Field label="기타 의견">
        <textarea value={other} onChange={e=>setOther(e.target.value)} placeholder="자유롭게 의견을 남겨주세요." rows={2}
          style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
      </Field>
      <div style={{marginTop:8}}>
        <button onClick={submit} style={{width:"100%",background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",color:"#fff",border:"none",borderRadius:10,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>설문 제출</button>
      </div>
    </Modal>
  );
}
function SurveyResult({data}){
  const stars=n=>[1,2,3,4,5].map(i=><span key={i} style={{color:i<=n?"#F5A623":"#ddd",fontSize:18}}>★</span>);
  return(
    <div style={{background:"#fffbf0",border:"1px solid #F5A62330",borderRadius:12,padding:"16px 18px",marginTop:20}}>
      <div style={{fontWeight:800,fontSize:14,color:"#c07800",marginBottom:12}}>📊 만족도 설문 결과</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:12,color:"#8899bb",fontWeight:600}}>전반적 만족도</span>
        <span>{stars(data.rating)}</span>
        <span style={{fontSize:12,fontWeight:700,color:"#F5A623"}}>{["","매우 불만족","불만족","보통","만족","매우 만족"][data.rating]}</span>
      </div>
      {data.helpful&&<div style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:"#27AE60",marginBottom:2}}>도움이 된 부분</div><div style={{fontSize:13,color:"#1a2233",lineHeight:1.6,background:"#f6fff9",borderRadius:8,padding:"8px 12px",whiteSpace:"pre-wrap"}}>{data.helpful}</div></div>}
      {data.improve&&<div style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:"#E84545",marginBottom:2}}>개선 필요 부분</div><div style={{fontSize:13,color:"#1a2233",lineHeight:1.6,background:"#fff0f0",borderRadius:8,padding:"8px 12px",whiteSpace:"pre-wrap"}}>{data.improve}</div></div>}
      {data.other&&<div><div style={{fontSize:11,fontWeight:700,color:"#8899bb",marginBottom:2}}>기타 의견</div><div style={{fontSize:13,color:"#1a2233",lineHeight:1.6,background:"#f8f9fb",borderRadius:8,padding:"8px 12px",whiteSpace:"pre-wrap"}}>{data.other}</div></div>}
      <div style={{fontSize:11,color:"#bbb",marginTop:8}}>제출일: {fmtDT(data.submittedAt)}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FILE ATTACH BUTTON
// ─────────────────────────────────────────────────────────
const ADMIN_PW = "admin1234";
function AttachBtn({itemId, empId, prefix}){
  const [att,setAtt]=useState(null);
  const [dlModal,setDlModal]=useState(false);
  const [dlPw,setDlPw]=useState("");
  const [dlErr,setDlErr]=useState("");
  const KEY=`file_${prefix}_${empId}_${itemId}`;

  useEffect(()=>{ load(KEY,true).then(v=>setAtt(v||null)); },[KEY]);

  function handleFile(e){
    const file=e.target.files[0]; if(!file)return;
    if(file.size>5*1024*1024){toast("5MB 이하 파일만 첨부 가능합니다.","warning");return;}
    const reader=new FileReader();
    reader.onload=async()=>{
      const data={name:file.name,type:file.type,size:file.size,data:reader.result,uploadedAt:new Date().toISOString()};
      await save(KEY,data,true); setAtt(data); toast("파일이 첨부되었습니다.","success");
    };
    reader.readAsDataURL(file);
    e.target.value="";
  }

  function download(){
    if(dlPw!==ADMIN_PW){setDlErr("비밀번호가 올바르지 않습니다.");return;}
    const a=document.createElement("a"); a.href=att.data; a.download=att.name; a.click();
    setDlModal(false); setDlPw(""); setDlErr(""); toast("다운로드가 시작되었습니다.","success");
  }

  async function delFile(e){
    e.stopPropagation();
    if(!window.confirm("첨부 파일을 삭제하시겠습니까?"))return;
    await save(KEY,null,true); setAtt(null); toast("파일이 삭제되었습니다.","info");
  }

  return(<div style={{display:"flex",gap:3,alignItems:"center",flexShrink:0}} onClick={e=>e.stopPropagation()}>
    {att?(
      <>
        <SBtn onClick={()=>setDlModal(true)} bg="#e8f5e9" color="#27AE60" style={{fontSize:11,padding:"3px 8px"}} title={`${att.name} (${(att.size/1024).toFixed(0)}KB)`}>📎</SBtn>
        <SBtn onClick={delFile} bg="#fff0f0" color="#E84545" style={{fontSize:10,padding:"3px 5px"}}>✕</SBtn>
      </>
    ):(
      <label style={{cursor:"pointer",display:"inline-block"}}>
        <span style={{background:"#f0f4fa",color:"#aab4cc",borderRadius:7,padding:"3px 8px",fontSize:11,fontWeight:700,cursor:"pointer",display:"inline-block"}}>📎</span>
        <input type="file" onChange={handleFile} style={{display:"none"}}/>
      </label>
    )}
    {dlModal&&(
      <Modal title="🔒 파일 다운로드" onClose={()=>{setDlModal(false);setDlPw("");setDlErr("");}}>
        <div style={{background:"#f8faff",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
          <div style={{fontSize:11,color:"#8899bb",marginBottom:2}}>첨부 파일</div>
          <div style={{fontWeight:700,color:"#1a2233",fontSize:13}}>{att.name}</div>
          <div style={{fontSize:11,color:"#8899bb",marginTop:2}}>{(att.size/1024).toFixed(0)} KB · {fmtDT(att.uploadedAt)}</div>
        </div>
        <Field label="관리자 비밀번호">
          <FI type="password" value={dlPw} onChange={e=>{setDlPw(e.target.value);setDlErr("");}} placeholder="비밀번호를 입력하세요" onKeyDown={e=>e.key==="Enter"&&download()}/>
        </Field>
        {dlErr&&<div style={{color:"#E84545",fontSize:12,marginTop:4}}>{dlErr}</div>}
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <PBtn onClick={download} style={{flex:1}}>⬇ 다운로드</PBtn>
          <OBtn onClick={()=>{setDlModal(false);setDlPw("");setDlErr("");}} style={{flex:1}}>취소</OBtn>
        </div>
      </Modal>
    )}
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
const [rejectModal,setRejectModal]=useState(null);
const [rejectReason,setRejectReason]=useState("");
  const [survey,setSurvey]=useState(null);
  useEffect(()=>{
    Promise.all([load(`item_overrides_${emp.id}`,true),load(`item_notes_${emp.id}`,true),load(`ext_requests_${emp.id}`,true),load(`survey_on_${emp.id}`,true)])
      .then(([empTpl,ov,n,er,sv])=>{
        if(empTpl) setTpl(empTpl);
        setItemOverrides(ov||{});setNotes(n||{});setExtReqs(er||[]);
        setSurvey(sv||null);});
  }, [emp.id]);

  // Auto-save helpers — persist immediately on every change
  async function updTpl(next){setTpl(next);await save(`emp_tpl_${emp.id}`,next,true);toast("자동 저장되었습니다.","success");}
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
    const v=parseInt(catDueEdit.val); if(isNaN(v)){toast("숫자를 입력하세요.","warning");return;}
    updTpl(tpl.map(c=>c.id===catDueEdit.catId?{...c,dueDays:v}:c)); setCatDueEdit(null);
  }

  function openItemDueModal(){
    if(!selectedItem){toast("항목을 먼저 선택해주세요.","warning");return;}
    setItemDueVal(String(getEffDue(selectedItem.itemId,selectedItem.catDueDays,itemOverrides))); setItemDueModal(true);
  }
  function applyItemDue(){
    const v=parseInt(itemDueVal); if(isNaN(v)){toast("숫자를 입력하세요.","warning");return;}
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
    setMailBody(`안녕하세요, ${emp.name}님.\n\n다음 온보딩 항목이 아직 완료되지 않았습니다.\n\n▶ ${item.label}\n   (제출 기한: ${fmtDeadline(emp.joinDate, effDue)}까지)\n\n기한 내에 완료해주시기 바랍니다.\n\n인사팀 드림`);
    setMailModal({item,cat});
  }
  async function sendItemMail(){
    const ok=await sendEmail(mailSubject,mailBody);
    toast(ok?"✉️ 알림 메일이 발송되었습니다.":"메일 발송 실패. EmailJS 설정을 확인하세요.",ok?"success":"error");
    setMailModal(null);
  }
  async function sendAllMail(){
    const over=[];
    tpl.forEach(cat=>cat.items.forEach(item=>{
      const effDue=getEffDue(item.id,cat.dueDays,itemOverrides);
      if(!checks[item.id]&&isOverdue(emp.joinDate,effDue,false))over.push({label:item.label,deadline:fmtDeadline(emp.joinDate,effDue)});
    }));
    if(!over.length){toast("기한 초과된 미완료 항목이 없습니다.","info");return;}
    const body=`안녕하세요.\n\n${emp.name}님(${emp.department} / ${emp.position})의 다음 항목들이 기한 내에 완료되지 않았습니다:\n\n${over.map(o=>`• ${o.label}\n  → 제출 기한: ${o.deadline}까지`).join("\n\n")}\n\n기한 내에 완료해주시기 바랍니다.\n\n인사팀 드림`;
    const ok=await sendEmail(`[온보딩 알림] ${emp.name}님 미완료 항목 안내`,body);
    toast(ok?`${over.length}개 미완료 항목 알림 발송 완료`:"메일 발송 실패. EmailJS 설정을 확인하세요.",ok?"success":"error");
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
  if(action==="rejected"){
    setRejectModal({reqId}); return;
  }
  const up=extReqs.map(r=>r.id===reqId?{...r,status:action,reviewedAt:new Date().toISOString()}:r);
  setExtReqs(up); await save(`ext_requests_${emp.id}`,up,true);
  const gl=(await load("ext_requests_all",true))||[];
  await save("ext_requests_all",gl.map(r=>r.id===reqId?{...r,status:action}:r),true);
  if(action==="approved"){
    const req=extReqs.find(r=>r.id===reqId);
    if(req)updOv({...itemOverrides,[req.itemId]:req.currentDue+req.requestDays});
    toast("기한 연장이 승인되었습니다.","success");
  }
}

async function submitReject(){
  if(!rejectReason.trim()){toast("반려 사유를 입력해주세요.","warning");return;}
  const reqId=rejectModal.reqId;
  const up=extReqs.map(r=>r.id===reqId?{...r,status:"rejected",rejectReason:rejectReason.trim(),reviewedAt:new Date().toISOString()}:r);
  setExtReqs(up); await save(`ext_requests_${emp.id}`,up,true);
  const gl=(await load("ext_requests_all",true))||[];
  await save("ext_requests_all",gl.map(r=>r.id===reqId?{...r,status:"rejected",rejectReason:rejectReason.trim(),reviewedAt:new Date().toISOString()}:r),true);
  toast("기한 연장이 반려되었습니다.","warning");
  setRejectModal(null); setRejectReason("");
}

  const {done,total,pct}=calcProgress(checks,tpl);
  const elapsed=daysBetween(emp.joinDate);
  const toolbarActive=!!selectedItem;

  const cntAllExt=extReqs.length, cntPendingExt=extReqs.filter(r=>r.status==="pending").length, cntApprovedExt=extReqs.filter(r=>r.status==="approved").length;

 const cntRejectedExt=extReqs.filter(r=>r.status==="rejected").length;
  const EXT_TABS_ADMIN=[
    {key:"all",    icon:"📬", label:"전체",  count:cntAllExt,      color:"#5B6EEA", activeBg:"rgba(91,110,234,.15)"},
    {key:"pending",icon:"⏳", label:"검토중", count:cntPendingExt,  color:"#F5A623", activeBg:"rgba(245,166,35,.15)"},
    {key:"approved",icon:"✅",label:"승인됨", count:cntApprovedExt, color:"#27AE60", activeBg:"rgba(39,174,96,.15)"},
    {key:"rejected",icon:"❌",label:"반려됨", count:cntRejectedExt, color:"#E84545", activeBg:"rgba(232,69,69,.15)"},
  ];
const filteredExtReqs=extReqs.slice().reverse().filter(r=>{
    if(extPanel==="all")return true;
    if(extPanel==="pending")return r.status==="pending";
    if(extPanel==="approved")return r.status==="approved";
    if(extPanel==="rejected")return r.status==="rejected";
    return false;
  });

  return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8e4ff,#f5f3ff,#e4f0ff)",fontFamily:"'Pretendard',sans-serif"}}>

    {/* ── HEADER ── */}
    <div style={{background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",padding:"16px 22px",color:"#fff"}}>
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
            <SBtn onClick={openBulkDue}     bg="rgba(255,255,255,.18)" hoverBg="rgba(255,255,255,.35)" color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7,border:"1px solid rgba(255,255,255,.3)"}}>📅 기한일괄</SBtn>
            <SBtn onClick={()=>setAddCatModal(true)} bg="rgba(255,255,255,.18)" hoverBg="rgba(255,255,255,.35)" color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7,border:"1px solid rgba(255,255,255,.3)"}}>＋ 카테고리</SBtn>
            <SBtn onClick={()=>{if(window.confirm("템플릿을 기본값으로 초기화하시겠습니까?\n현재 카테고리와 항목이 초기화됩니다."))updTpl(DEFAULT_TEMPLATE);}} bg="rgba(255,255,255,.18)" hoverBg="rgba(255,255,255,.35)" color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7,border:"1px solid rgba(255,255,255,.3)"}}>↩️ 템플릿초기화</SBtn>
            <SBtn onClick={sendAllMail}     bg="rgba(255,255,255,.18)" hoverBg="rgba(255,255,255,.35)" color="#fff" style={{padding:"5px 9px",fontSize:11,borderRadius:7,border:"1px solid rgba(255,255,255,.3)"}}>📧 일괄알림</SBtn>
          </div>
        </div>

        {/* Employee info row */}
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <ProgressRing pct={pct} size={66} stroke={6} color="#fff" textColor="#fff" trackColor="rgba(255,255,255,.3)"/>
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
      <div style={{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1.5px solid rgba(91,110,234,.15)"}}>
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
                <div style={{fontSize:12,color:"#6b7a99"}}>{fmtD(r.currentDue)} → {fmtD(r.currentDue+r.requestDays)} ({r.requestDays}일 연장 요청)</div>
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
    <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,.92)",backdropFilter:"blur(8px)",borderBottom:"1.5px solid rgba(91,110,234,.15)",boxShadow:"0 2px 12px rgba(91,110,234,.1)"}}>
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
        return(<div key={cat.id} style={{background:"#fff",borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(91,110,234,.1)"}}>
          <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#f5f3ff,#eef0ff)",borderBottom:"1px solid rgba(91,110,234,.12)"}}>
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
                    <span style={{fontSize:12,color:"#8899bb"}}>{parseInt(catDueEdit.val)<0?"D":"D+"}</span>
                    <input type="number" value={catDueEdit.val} onChange={e=>setCatDueEdit(p=>({...p,val:e.target.value}))}
                      style={{width:68,padding:"3px 7px",borderRadius:6,border:"1.5px solid #F5A623",fontSize:12,outline:"none"}}/>
                    <SBtn onClick={applyCatDue} bg="#F5A623" color="#fff">저장</SBtn>
                    <SBtn onClick={()=>setCatDueEdit(null)} bg="#f0f4fa" color="#8899bb">취소</SBtn>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <Badge text={cat.dueDays < 0 ? `D${cat.dueDays}` : `D+${cat.dueDays}`} color={cat.color}/>
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
                {hasOv&&<Badge text={`${fmtD(effDue)} (개별)`} color="#9B59B6"/>}
                {over&&!done&&<Badge text="기한초과" color="#E84545"/>}
                {pendingExt&&<Badge text="연장요청" color="#F5A623"/>}
                {note&&<span title="메모 있음" style={{fontSize:14}}>💬</span>}
                {isSelected&&<span style={{fontSize:10,color:"#2E86DE",fontWeight:700}}>선택됨</span>}
                <AttachBtn itemId={item.id} empId={emp.id} prefix="on"/>
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
    {survey&&<SurveyResult data={survey}/>}

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
                    <Badge text={fmtD(c.dueDays)} color={c.color}/>
                    {!isNaN(preview)&&preview!==0&&<span style={{fontSize:11,color:"#8899bb"}}>→ {fmtD(c.dueDays+preview)}</span>}
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
          카테고리 기본: <strong>{fmtD(selectedItem.catDueDays)}</strong> · 현재 기한: <strong>{fmtD(getEffDue(selectedItem.itemId,selectedItem.catDueDays,itemOverrides))}</strong>
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
    {rejectModal&&(
  <Modal title="❌ 반려 사유 입력" onClose={()=>{setRejectModal(null);setRejectReason("");}} titleColor="#E84545">
    <div style={{background:"#fff0f0",border:"1px solid #E8454530",borderRadius:8,padding:"9px 13px",fontSize:12,color:"#E84545",marginBottom:14}}>
      ⚠️ 반려 사유는 입사자 화면에 즉시 표시됩니다.
    </div>
    <Field label="반려 사유 (필수)">
      <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="반려 사유를 상세히 입력해주세요." autoFocus
        style={{width:"100%",height:110,padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}/>
    </Field>
    <div style={{display:"flex",gap:10,marginTop:4}}>
      <PBtn onClick={submitReject} color="#E84545" style={{flex:1}}>❌ 반려 확정</PBtn>
      <OBtn onClick={()=>{setRejectModal(null);setRejectReason("");}} style={{flex:1}}>취소</OBtn>
    </div>
  </Modal>
)}
  </div>);
}

// ─────────────────────────────────────────────────────────
// OFFBOARDING DETAIL
// ─────────────────────────────────────────────────────────
function OffboardingDetail({employee, checks:initChecks, tpl:initTpl, onBack, isAdmin=false}){
  const [checks,setChecks]=useState(initChecks);
  const [tpl,setTpl]=useState(initTpl);
  const [itemOverrides,setItemOverrides]=useState({});
  const [notes,setNotes]=useState({});
  const [extReqs,setExtReqs]=useState([]);
  const [extPanel,setExtPanel]=useState(null);
  const [extModal,setExtModal]=useState(null);
  const [extDays,setExtDays]=useState("");
  const [extReason,setExtReason]=useState("");
  const [editDueId,setEditDueId]=useState(null);
  const [editDueVal,setEditDueVal]=useState("");
  const [addItemModal,setAddItemModal]=useState(false);
  const [newItemLabel,setNewItemLabel]=useState("");
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [noteModal,setNoteModal]=useState(null);
  const [noteText,setNoteText]=useState("");
  const [mailModal,setMailModal]=useState(null);
  const [mailSubject,setMailSubject]=useState("");
  const [mailBody,setMailBody]=useState("");
  const [showSurvey,setShowSurvey]=useState(false);
  const [surveyDone,setSurveyDone]=useState(false);
  const [survey,setSurvey]=useState(null);

  useEffect(()=>{
    Promise.all([
      load(`off_item_overrides_${employee.id}`,true),
      load(`off_notes_${employee.id}`,true),
      load(`off_ext_requests_${employee.id}`,true),
      load(`survey_off_${employee.id}`,true),
      isAdmin ? load(`off_emp_tpl_${employee.id}`,true) : Promise.resolve(null),
    ]).then(([ov,n,er,sv,empTpl])=>{
      setItemOverrides(ov||{}); setNotes(n||{}); setExtReqs(er||[]);
      if(sv){if(!sv.reloginApproved)setSurveyDone(true);setSurvey(sv);}
      if(empTpl) setTpl(empTpl);
    });
  },[employee.id]);

  async function toggle(id){
    const next={...checks,[id]:!checks[id]};
    setChecks(next); await save(`off_checks_${employee.id}`,next,true);
    if(next[id])toast("✅ 항목 완료!","success");
  }
  async function updOv(next){setItemOverrides(next); await save(`off_item_overrides_${employee.id}`,next,true);}
  async function updTpl(next){setTpl(next); await save(isAdmin?`off_emp_tpl_${employee.id}`:"offboarding_template",next,true);}
  async function updNotes(next){setNotes(next); await save(`off_notes_${employee.id}`,next,true);}

  async function submitExt(){
    const d=parseInt(extDays);
    if(!d||d<=0){toast("연장 일수를 올바르게 입력하세요.","warning");return;}
    if(!extReason.trim()){toast("사유를 입력해주세요.","warning");return;}
    const effDue=itemOverrides[extModal.item.id]??extModal.catDueDays;
    const req={id:uid(),itemId:extModal.item.id,itemLabel:extModal.item.label,empId:employee.id,
      empName:employee.name,department:employee.department,currentDue:effDue,requestDays:d,
      reason:extReason.trim(),status:"pending",createdAt:new Date().toISOString()};
    const next=[...extReqs,req]; setExtReqs(next);
    await save(`off_ext_requests_${employee.id}`,next,true);
    const gl=(await load("off_ext_requests_all",true))||[];
    await save("off_ext_requests_all",[...gl,req],true);
    toast("기한 연장 요청이 인사팀에 전달되었습니다.","success");
    setExtModal(null); setExtDays(""); setExtReason("");
  }

  function applyDue(){
    const v=parseInt(editDueVal); if(isNaN(v)||v<0){toast("0 이상의 숫자를 입력하세요.","warning");return;}
    updOv({...itemOverrides,[editDueId]:v===0?0:-v}); setEditDueId(null); toast("기한이 저장되었습니다.","success");
  }

  function addItem(){
    if(!newItemLabel.trim()){toast("항목명을 입력하세요.","warning");return;}
    const firstCat=tpl[0]; if(!firstCat){toast("카테고리가 없습니다.","warning");return;}
    updTpl(tpl.map((c,i)=>i===0?{...c,items:[...c.items,{id:uid(),label:newItemLabel.trim()}]}:c));
    setNewItemLabel(""); setAddItemModal(false); toast("항목이 추가되었습니다.","success");
  }

  function deleteItem(catId,itemId){
    updTpl(tpl.map(c=>c.id===catId?{...c,items:c.items.filter(i=>i.id!==itemId)}:c));
    const nextOv={...itemOverrides}; delete nextOv[itemId]; updOv(nextOv);
    const nextN={...notes}; delete nextN[itemId]; updNotes(nextN);
    setDeleteConfirm(null); toast("항목이 삭제되었습니다.","info");
  }

  function openMail(item){
    const effDue=itemOverrides[item.id]??item.catDueDays;
    setMailSubject(`[퇴사 처리 알림] ${employee.name}님 - "${item.label}" 미완료 안내`);
    setMailBody(`안녕하세요, ${employee.name}님.\n\n다음 퇴사 처리 항목이 아직 완료되지 않았습니다.\n\n▶ ${item.label}\n   (처리 기한: ${fmtDeadline(employee.leaveDate, effDue)}까지)\n\n기한 내에 완료해주시기 바랍니다.\n\n인사팀 드림`);
    setMailModal(item);
  }

  async function sendMail(){
    const ok=await sendEmail(mailSubject,mailBody);
    toast(ok?"✉️ 알림 메일이 발송되었습니다.":"메일 발송 실패. EmailJS 설정을 확인하세요.",ok?"success":"error");
    setMailModal(null);
  }

  async function saveNote(){
    if(!noteText.trim()){toast("메모 내용을 입력하세요.","warning");return;}
    await updNotes({...notes,[noteModal.id]:{text:noteText.trim(),updatedAt:new Date().toISOString()}});
    setNoteModal(null); setNoteText(""); toast("메모가 저장되었습니다.","success");
  }

  async function deleteNote(itemId){
    const next={...notes}; delete next[itemId]; await updNotes(next); toast("메모가 삭제되었습니다.","info");
  }

  const allItems=tpl.flatMap(cat=>cat.items.map(item=>({...item,catDueDays:cat.dueDays,catColor:cat.color,catId:cat.id})));
  const elapsed=daysBetween(employee.leaveDate);
  const {done,total,pct}=calcProgress(checks,tpl);
  const cntAll=extReqs.length, cntPending=extReqs.filter(r=>r.status==="pending").length;
  const cntApproved=extReqs.filter(r=>r.status==="approved").length, cntRejected=extReqs.filter(r=>r.status==="rejected").length;
  const EXT_TABS=[
    {key:"all",    icon:"📬",label:"전체",  count:cntAll,      color:"#fff",activeBg:"rgba(255,255,255,.25)"},
    {key:"pending",icon:"⏳",label:"검토중", count:cntPending,  color:"#F5A623",activeBg:"rgba(245,166,35,.22)"},
    {key:"approved",icon:"✅",label:"승인됨",count:cntApproved, color:"#27AE60",activeBg:"rgba(39,174,96,.22)"},
    {key:"rejected",icon:"❌",label:"반려됨",count:cntRejected, color:"#E84545",activeBg:"rgba(232,69,69,.22)"},
  ];
  const filteredReqs=extReqs.slice().reverse().filter(r=>extPanel==="all"||r.status===extPanel);

  return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8e4ff,#f5f3ff,#e4f0ff)",fontFamily:"'Pretendard',sans-serif"}}>
    {/* HEADER */}
    <div style={{background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",padding:"24px 28px",color:"#fff"}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <button onClick={onBack}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.25)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.12)"}
            style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",transition:"background .15s"}}>← 돌아가기</button>
          <SBtn onClick={()=>setAddItemModal(true)} bg="rgba(255,255,255,.18)" hoverBg="rgba(255,255,255,.35)" color="#fff" style={{padding:"5px 12px",fontSize:12,borderRadius:7,border:"1px solid rgba(255,255,255,.3)"}}>＋ 항목추가</SBtn>
        </div>
        <div style={{display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap"}}>
          <ProgressRing pct={pct} size={78} stroke={7} color="#fff" textColor="#fff" trackColor="rgba(255,255,255,.3)"/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".8px",color:"rgba(255,255,255,.65)",marginBottom:4}}>퇴사 처리 진행률</div>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>{employee.name}님 퇴사 체크리스트</h2>
            <div style={{fontSize:13,color:"rgba(255,255,255,.75)"}}>{employee.department} · {employee.position} · 퇴사일 {employee.leaveDate} · {fmtD(elapsed)} · {done}/{total} 완료</div>
          </div>
          {!isAdmin&&cntAll>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,.45)",letterSpacing:".5px",fontWeight:600}}>기한 연장 요청 현황</div>
              <div style={{display:"flex",gap:6}}>
                {EXT_TABS.map(tab=>{
                  const isActive=extPanel===tab.key;
                  return(<button key={tab.key} onClick={()=>setExtPanel(p=>p===tab.key?null:tab.key)}
                    title={`${tab.label} (${tab.count}건)`}
                    onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,.18)";}}
                    onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,.08)";}}
                    style={{background:isActive?tab.activeBg:"rgba(255,255,255,.08)",border:`1.5px solid ${isActive?tab.color:"rgba(255,255,255,.18)"}`,
                      borderRadius:12,padding:"8px 12px",cursor:"pointer",textAlign:"center",minWidth:60,transition:"all .18s",fontFamily:"inherit"}}>
                    <div style={{fontSize:20}}>{tab.icon}</div>
                    <div style={{fontSize:10,fontWeight:700,color:isActive?tab.color:"rgba(255,255,255,.65)",marginTop:2}}>{tab.label}</div>
                    <div style={{fontSize:15,fontWeight:800,color:isActive?tab.color:"#fff",marginTop:1}}>{tab.count}</div>
                  </button>);
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* EXTENSION PANEL */}
    {!isAdmin&&extPanel!==null&&cntAll>0&&(
      <div style={{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1.5px solid rgba(91,110,234,.15)"}}>
        <div style={{maxWidth:780,margin:"0 auto",padding:"14px 22px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13,color:"#9a7020"}}>📬 기한 연장 요청</span>
              {EXT_TABS.map(tab=>(
                <button key={tab.key} onClick={()=>setExtPanel(p=>p===tab.key?null:tab.key)}
                  style={{background:extPanel===tab.key?tab.color+"22":"#f4f7fb",color:extPanel===tab.key?tab.color:"#8899bb",
                    border:`1.5px solid ${extPanel===tab.key?tab.color+"60":"#e2e8f0"}`,borderRadius:99,
                    padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {tab.icon} {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <button onClick={()=>setExtPanel(null)} style={{background:"transparent",border:"none",color:"#8899bb",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ 닫기</button>
          </div>
          {filteredReqs.length===0&&<div style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"10px 0"}}>해당 항목이 없습니다.</div>}
          {filteredReqs.map(r=>{
            const si={pending:["⏳ 검토중","#F5A623"],approved:["✅ 승인됨","#27AE60"],rejected:["❌ 반려됨","#E84545"]}[r.status];
            return(<div key={r.id} style={{background:"#fff",borderRadius:10,padding:"11px 14px",marginBottom:7,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <Badge text={si[0]} color={si[1]}/>
                <span style={{fontWeight:700,fontSize:13,color:"#1a2233",flex:1}}>{r.itemLabel}</span>
                {r.status==="approved"&&<Badge text={`${fmtD(r.currentDue+r.requestDays)} (연장 확정)`} color="#27AE60"/>}
              </div>
              <div style={{fontSize:12,color:"#8899bb",marginTop:5}}>{fmtD(r.currentDue)} → {fmtD(r.currentDue+r.requestDays)} ({r.requestDays}일 연장)</div>
              <div style={{fontSize:12,color:"#6b7a99",marginTop:2,fontStyle:"italic"}}>사유: {r.reason}</div>
              {r.status==="rejected"&&r.rejectReason&&<div style={{fontSize:12,color:"#E84545",marginTop:4,background:"#fff0f0",borderRadius:6,padding:"5px 9px"}}>💬 반려 사유: {r.rejectReason}</div>}
              <div style={{fontSize:11,color:"#bbb",marginTop:3}}>{fmtDT(r.createdAt)}</div>
            </div>);
          })}
        </div>
      </div>
    )}

    {/* BODY */}
    <div style={{maxWidth:780,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 20px rgba(91,110,234,.1)"}}>
        {allItems.length===0&&<div style={{padding:"28px",textAlign:"center",color:"#c0cce0",fontSize:14}}>항목이 없습니다.</div>}
        {allItems.map((item,idx)=>{
          const isDone=!!checks[item.id];
          const effDue=itemOverrides[item.id]??item.catDueDays;
          const over=isOverdue(employee.leaveDate,effDue,isDone);
          const isEditing=editDueId===item.id;
          const note=notes[item.id];
          return(<div key={item.id}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",
              background:isDone?"#f6fff9":over?"#fff8f8":"#fff",
              borderBottom:note?"none":idx<allItems.length-1?"1px solid #f4f7fa":"none",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=isDone?"#edfbf3":over?"#fff0f0":"#f8faff"}
              onMouseLeave={e=>e.currentTarget.style.background=isDone?"#f6fff9":over?"#fff8f8":"#fff"}>
              <div onClick={()=>toggle(item.id)}
                style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",
                  border:`2px solid ${isDone?"#27AE60":over?"#E84545":"#cdd8e8"}`,
                  background:isDone?"#27AE60":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                {isDone&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
              </div>
              <span onClick={()=>toggle(item.id)} style={{fontSize:14,color:isDone?"#6b8c7a":"#1a2233",textDecoration:isDone?"line-through":"none",flex:1,cursor:"pointer"}}>{item.label}</span>
              {over&&!isDone&&<Badge text="기한초과" color="#E84545"/>}
              {note&&<span title="메모 있음" style={{fontSize:13}}>💬</span>}
              {!isAdmin&&(()=>{
                const pendingReq=extReqs.find(r=>r.itemId===item.id&&r.status==="pending");
                const approvedReq=extReqs.find(r=>r.itemId===item.id&&r.status==="approved");
                return(<>
                  {approvedReq&&<Badge text={`✅ 연장: ${fmtD(approvedReq.currentDue+approvedReq.requestDays)}`} color="#27AE60"/>}
                  {pendingReq&&<Badge text="연장요청중" color="#F5A623"/>}
                  {!isDone&&!pendingReq&&(
                    <SBtn onClick={e=>{e.stopPropagation();setExtModal({item,catDueDays:item.catDueDays});}}
                      bg={over?"#FFF3CD":"#f0f4fa"} hoverBg={over?"#ffe8a0":"#e4eaf8"} color={over?"#9a7020":"#8899bb"} style={{fontSize:11}}>⏰ 기한연장요청</SBtn>
                  )}
                </>);
              })()}
              {isAdmin&&(isEditing?(
                <div style={{display:"flex",gap:5,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                  <span style={{fontSize:11,color:"#8899bb"}}>D-</span>
                  <input type="number" min={0} value={editDueVal} autoFocus onChange={e=>setEditDueVal(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&applyDue()}
                    style={{width:56,padding:"3px 6px",borderRadius:6,border:"1.5px solid #5B6EEA",fontSize:12,outline:"none"}}/>
                  <SBtn onClick={applyDue} bg="#5B6EEA" color="#fff" style={{fontSize:10}}>저장</SBtn>
                  <SBtn onClick={()=>setEditDueId(null)} bg="#f0f4fa" color="#8899bb" style={{fontSize:10}}>취소</SBtn>
                </div>
              ):(
                <div onClick={e=>{e.stopPropagation();setEditDueId(item.id);setEditDueVal(String(Math.abs(effDue)));}}
                  style={{cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                  <Badge text={effDue===0?"D+0":`D-${Math.abs(effDue)}`} color={itemOverrides[item.id]!==undefined?"#9B59B6":item.catColor}/>
                  <span style={{fontSize:10,color:"#b0c0d8"}}>✏️</span>
                </div>
              ))}
              {!isAdmin&&<Badge text={effDue===0?"D+0":`D-${Math.abs(effDue)}`} color={itemOverrides[item.id]!==undefined?"#9B59B6":item.catColor}/>}
              {isAdmin&&(
                <div style={{display:"flex",gap:4,marginLeft:4}} onClick={e=>e.stopPropagation()}>
                  <SBtn onClick={()=>{setNoteModal(item);setNoteText(note?.text||"");}} bg="#fffbf0" color="#c07800" style={{fontSize:11,padding:"3px 7px"}}>💬</SBtn>
                  <SBtn onClick={()=>openMail(item)} bg="#fff0f0" color="#E84545" style={{fontSize:11,padding:"3px 7px"}} disabled={isDone}>📧</SBtn>
                  <SBtn onClick={()=>setDeleteConfirm({catId:item.catId,itemId:item.id,label:item.label})} bg="#fff0f0" color="#E84545" style={{fontSize:11,padding:"3px 7px"}}>🗑</SBtn>
                </div>
              )}
              <AttachBtn itemId={item.id} empId={employee.id} prefix="off"/>
            </div>
            {note&&(
              <div style={{padding:"6px 16px 9px 50px",background:isDone?"#f6fff9":over?"#fff8f8":"#fff",borderBottom:idx<allItems.length-1?"1px solid #f4f7fa":"none"}}>
                <div style={{background:"#fffbf0",border:"1px solid #F5A62330",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#F5A623"}}>💬 인사팀 메모</span>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <span style={{fontSize:10,color:"#bbb"}}>{fmtDT(note.updatedAt)}</span>
                      <SBtn onClick={()=>{setNoteModal(item);setNoteText(note.text);}} bg="#fff3cc" color="#c07800" style={{fontSize:10,padding:"2px 6px"}}>수정</SBtn>
                      <SBtn onClick={()=>deleteNote(item.id)} bg="#fff0f0" color="#cc8888" style={{fontSize:10,padding:"2px 6px"}}>삭제</SBtn>
                    </div>
                  </div>
                  <div style={{fontSize:13,color:"#5a4a20",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{note.text}</div>
                </div>
              </div>
            )}
          </div>);
        })}
      </div>
      {pct===100&&(<div style={{background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",borderRadius:16,padding:"24px",marginTop:20,color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>✅</div>
        <div style={{fontWeight:800,fontSize:18}}>모든 퇴사 처리 항목이 완료되었습니다!</div>
        {!isAdmin&&<div style={{marginTop:10}}>
          {surveyDone
            ?<span style={{fontSize:14,color:"rgba(255,255,255,.85)"}}>✅ 만족도 설문 완료 — 소중한 의견 감사합니다!</span>
            :<button onClick={()=>setShowSurvey(true)} style={{marginTop:4,padding:"10px 24px",borderRadius:10,border:"2px solid rgba(255,255,255,.8)",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.28)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}>📋 만족도 설문 참여하기</button>
          }
        </div>}
      </div>)}
      {isAdmin&&survey&&<SurveyResult data={survey}/>}
    </div>

    {/* MODALS */}
    {showSurvey&&<SurveyModal type="off" initialData={survey} onClose={()=>setShowSurvey(false)} onSubmit={async(data)=>{
      await save(`survey_off_${employee.id}`,data,true);
      toast("설문 응답이 저장되었습니다. 감사합니다!","success");
      setTimeout(()=>onBack(),800);
    }}/>}
    {extModal&&(
      <Modal title="⏰ 기한 연장 요청" onClose={()=>{setExtModal(null);setExtDays("");setExtReason("");}} width={460}>
        <div style={{background:"#f8faff",borderRadius:10,padding:"12px 15px",marginBottom:16}}>
          <div style={{fontSize:12,color:"#8899bb",marginBottom:4}}>대상 항목</div>
          <div style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{extModal.item.label}</div>
          <div style={{fontSize:12,color:"#8899bb",marginTop:4}}>현재 기한: {fmtD(itemOverrides[extModal.item.id]??extModal.catDueDays)}</div>
        </div>
        <Field label="연장 요청 일수">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <FI type="number" value={extDays} onChange={e=>setExtDays(e.target.value)} placeholder="예: 3" style={{flex:1}}/>
            <span style={{fontSize:13,color:"#8899bb",whiteSpace:"nowrap"}}>일 연장</span>
          </div>
        </Field>
        <Field label="연장 사유"><textarea value={extReason} onChange={e=>setExtReason(e.target.value)} placeholder="연장이 필요한 사유를 입력해주세요." rows={3}
          style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",boxSizing:"border-box"}}/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <PBtn onClick={submitExt} style={{flex:1}}>요청 제출</PBtn>
          <OBtn onClick={()=>{setExtModal(null);setExtDays("");setExtReason("");}} style={{flex:1}}>취소</OBtn>
        </div>
      </Modal>
    )}
    {deleteConfirm&&<ConfirmDialog message={`"${deleteConfirm.label}" 항목을 삭제하시겠습니까?`} onYes={()=>deleteItem(deleteConfirm.catId,deleteConfirm.itemId)} onNo={()=>setDeleteConfirm(null)} yesLabel="삭제" noLabel="취소"/>}

    {addItemModal&&(
      <Modal title="항목 추가" onClose={()=>{setAddItemModal(false);setNewItemLabel("");}}>
        <Field label="항목명"><FI value={newItemLabel} onChange={e=>setNewItemLabel(e.target.value)} placeholder="예: 사내 메신저 계정 반납" onKeyDown={e=>e.key==="Enter"&&addItem()}/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}><PBtn onClick={addItem} style={{flex:1}}>추가</PBtn><OBtn onClick={()=>{setAddItemModal(false);setNewItemLabel("");}} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {noteModal&&(
      <Modal title="💬 인사팀 메모" onClose={()=>{setNoteModal(null);setNoteText("");}} titleColor="#c07800">
        <div style={{background:"#fffbf0",border:"1px solid #F5A62330",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#9a7020",marginBottom:12}}>
          ℹ️ 이 메모는 직원 체크리스트 화면에도 즉시 표시됩니다.
        </div>
        <Field label="대상 항목"><div style={{fontSize:13,fontWeight:700,color:"#1a2233",padding:"4px 0"}}>{noteModal.label}</div></Field>
        <Field label="메모 내용"><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={4}
          style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}><PBtn onClick={saveNote} style={{flex:1}}>저장</PBtn><OBtn onClick={()=>{setNoteModal(null);setNoteText("");}} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {mailModal&&(
      <Modal title="📧 알림 메일 발송" onClose={()=>setMailModal(null)} width={500}>
        <Field label="수신자"><div style={{fontSize:13,color:"#1a2233",padding:"4px 0"}}>{employee.email||"(이메일 미등록)"}</div></Field>
        <Field label="제목"><FI value={mailSubject} onChange={e=>setMailSubject(e.target.value)}/></Field>
        <Field label="내용"><textarea value={mailBody} onChange={e=>setMailBody(e.target.value)} rows={6}
          style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}><PBtn onClick={sendMail} style={{flex:1}}>메일 앱으로 열기</PBtn><OBtn onClick={()=>setMailModal(null)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}
  </div>);
}

// ─────────────────────────────────────────────────────────
// SURVEY STAT CARD (double-click to open dashboard)
// ─────────────────────────────────────────────────────────
function SurveyStatCard({employees,offEmps,onDoubleClick}){
  const [count,setCount]=useState(0);
  const [hov,setHov]=useState(false);
  useEffect(()=>{
    let cancelled=false;
    async function calc(){
      const onRes=await Promise.all(employees.map(e=>load(`survey_on_${e.id}`,true)));
      const offRes=await Promise.all(offEmps.map(e=>load(`survey_off_${e.id}`,true)));
      if(!cancelled)setCount([...onRes,...offRes].filter(Boolean).length);
    }
    calc();
    return()=>{cancelled=true;};
  },[employees,offEmps]);
  return(
    <div onDoubleClick={onDoubleClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?"linear-gradient(135deg,#f0edff,#e8e4ff)":"#fff",borderRadius:14,padding:"18px 20px",
        boxShadow:hov?"0 4px 20px rgba(91,110,234,.18)":"0 2px 12px rgba(30,50,120,.07)",
        cursor:"pointer",transition:"all .18s",border:hov?"1.5px solid #a084ee40":"1.5px solid transparent",
        userSelect:"none"}}>
      <div style={{fontSize:20,marginBottom:6}}>📊</div>
      <div style={{fontSize:26,fontWeight:800,color:"#7c5ce8"}}>{count}</div>
      <div style={{fontSize:13,color:"#b0b8c8",fontWeight:500,marginTop:2}}>만족도 조사</div>
      <div style={{fontSize:10,color:"#c0b0e8",marginTop:4,fontWeight:600}}>더블클릭으로 열기</div>
    </div>
  );
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
  const [form,setForm]=useState({name:"",empId:"",department:"",position:"",joinDate:"",email:""});
  const [loading,setLoading]=useState(true);
  const [lastClick,setLastClick]=useState({id:null,t:0});
  const [filterDept,setFilterDept]=useState("전체");
  const [filterStatus,setFilterStatus]=useState("전체");

  // 입사자 정보 수정 modal
  const [joinModal,setJoinModal]=useState(false);
  const [editTarget,setEditTarget]=useState(null);
  const [editEmpForm,setEditEmpForm]=useState({});

  // Global ext requests panel — null | "all" | "pending" | "approved"
  const [extPanel,setExtPanel]=useState(null);
  const [allExtReqs,setAllExtReqs]=useState([]);

  // Relogin requests
  const [reloginReqs,setReloginReqs]=useState([]);
  const [reloginPanel,setReloginPanel]=useState(false);

  // Survey dashboard
  const [surveyDash,setSurveyDash]=useState(false);
  const [surveyAllData,setSurveyAllData]=useState([]);
  const [surveyTab,setSurveyTab]=useState("on");

  async function loadSurveys(){
    const onData=await Promise.all(employees.map(async e=>{
      const sv=await load(`survey_on_${e.id}`,true);
      return sv?{...sv,empName:e.name,department:e.department,position:e.position,type:"on"}:null;
    }));
    const offData=await Promise.all(offEmps.map(async e=>{
      const sv=await load(`survey_off_${e.id}`,true);
      return sv?{...sv,empName:e.name,department:e.department,position:e.position,type:"off"}:null;
    }));
    setSurveyAllData([...onData,...offData].filter(Boolean));
    setSurveyDash(true);
  }

  // 퇴사자 탭
  const [activeTab,setActiveTab]=useState("onboarding");
  const [offEmps,setOffEmps]=useState([]);
  const [offChecksMap,setOffChecksMap]=useState({});
  const [offTpl,setOffTpl]=useState([]);
  const [selectedOff,setSelectedOff]=useState(null);
  const [showAddOff,setShowAddOff]=useState(false);
  const [offForm,setOffForm]=useState({name:"",empId:"",department:"",position:"",leaveDate:"",email:""});
  const [offLastClick,setOffLastClick]=useState({id:null,t:0});
  const [filterOffDept,setFilterOffDept]=useState("전체");
  const [filterOffStatus,setFilterOffStatus]=useState("전체");

  const reload=useCallback(async()=>{
    const [emps,t,er,offEmpsRaw,offTplRaw,rlReqs]=await Promise.all([
      load("employees",true),load("checklist_template",true),load("ext_requests_all",true),
      load("offboarding_employees",true),load("offboarding_template",true),
      load("relogin_requests",true),
    ]);
    const empList=emps||[]; setEmployees(empList); setTpl(t||DEFAULT_TEMPLATE); setAllExtReqs(er||[]); setReloginReqs(rlReqs||[]);
    const map={}; await Promise.all(empList.map(async e=>{map[e.id]=(await load(`checks_${e.id}`,true))||{};}));
    setChecksMap(map);
    const offList=offEmpsRaw||[]; setOffEmps(offList); setOffTpl(offTplRaw||DEFAULT_OFFBOARDING_TEMPLATE);
    const offMap={}; await Promise.all(offList.map(async e=>{offMap[e.id]=(await load(`off_checks_${e.id}`,true))||{};}));
    setOffChecksMap(offMap);
    setLoading(false);
  },[]);

  useEffect(()=>{reload();}, [reload]);

  async function addEmployee(){
    if(!form.name||!form.empId||!form.department||!form.position||!form.joinDate){toast("모든 필수 항목을 입력해주세요.","warning");return;}
    const emp={...form,id:uid(),createdAt:new Date().toISOString()};
    await save("employees",[...employees,emp],true);
    setForm({name:"",empId:"",department:"",position:"",joinDate:"",email:""}); setShowAdd(false);
    toast(`${emp.name}님이 등록되었습니다.`,"success"); reload();
  }

  async function deleteEmployee(id){
    if(!window.confirm("삭제하시겠습니까?"))return;
    await save("employees",employees.filter(e=>e.id!==id),true); toast("삭제되었습니다.","info"); reload();
  }

  function openJoinModal(){setEditTarget(null);setEditEmpForm({});setJoinModal(true);}
  function selectEditTarget(emp){setEditTarget(emp);setEditEmpForm({name:emp.name,empId:emp.empId||"",department:emp.department,position:emp.position,joinDate:emp.joinDate,email:emp.email||""});}
  async function saveEditEmp(){
    if(!editEmpForm.name||!editEmpForm.empId||!editEmpForm.department||!editEmpForm.position||!editEmpForm.joinDate){toast("필수 항목을 모두 입력해주세요.","warning");return;}
    const next=employees.map(e=>e.id===editTarget.id?{...e,...editEmpForm}:e);
    await save("employees",next,true); setJoinModal(false); setEditTarget(null);
    toast(`${editEmpForm.name}님 정보가 수정되었습니다.`,"success"); reload();
  }

  async function sendReminder(emp){
    const ch=checksMap[emp.id]||[]; const over=[];
    tpl.forEach(cat=>cat.items.forEach(item=>{if(!ch[item.id]&&isOverdue(emp.joinDate,cat.dueDays,false))over.push({label:item.label,deadline:fmtDeadline(emp.joinDate,cat.dueDays)});}));
    if(!over.length){toast("미수행 기한 초과 항목이 없습니다.","info");return;}
    const body=`안녕하세요.\n\n${emp.name}님(${emp.department} / ${emp.position})의 다음 항목들이 기한 내에 완료되지 않았습니다:\n\n${over.map(o=>`• ${o.label}\n  → 제출 기한: ${o.deadline}까지`).join("\n\n")}\n\n기한 내에 완료해주시기 바랍니다.\n\n인사팀 드림`;
    const ok=await sendEmail(`[온보딩 알림] ${emp.name}님 미완료 항목 안내`,body);
    toast(ok?`${emp.name}님 알림 발송 완료 (${over.length}개)`:"메일 발송 실패. EmailJS 설정을 확인하세요.",ok?"success":"error");
  }

  function handleRowClick(emp){
    const now=Date.now();
    if(lastClick.id===emp.id&&now-lastClick.t<450)setSelected(emp);
    setLastClick({id:emp.id,t:now});
  }

  async function addOffboardingEmployee(){
    if(!offForm.name||!offForm.empId||!offForm.department||!offForm.position||!offForm.leaveDate){toast("모든 필수 항목을 입력해주세요.","warning");return;}
    const emp={...offForm,id:uid(),createdAt:new Date().toISOString()};
    await save("offboarding_employees",[...offEmps,emp],true);
    setOffForm({name:"",empId:"",department:"",position:"",leaveDate:"",email:""});
    setShowAddOff(false); toast(`${emp.name}님이 등록되었습니다.`,"success"); reload();
  }

  async function deleteOffboardingEmployee(id){
    if(!window.confirm("삭제하시겠습니까?"))return;
    await save("offboarding_employees",offEmps.filter(e=>e.id!==id),true);
    toast("삭제되었습니다.","info"); reload();
  }

  function handleOffRowClick(emp){
    const now=Date.now();
    if(offLastClick.id===emp.id&&now-offLastClick.t<450)setSelectedOff(emp);
    setOffLastClick({id:emp.id,t:now});
  }

  function handleExtTabClick(key){setExtPanel(p=>p===key?null:key);}

  async function approveRelogin(req){
    // mark survey as reloginApproved so user can log in again but previous answers are preserved
    const prev=await load(req.surveyKey,true);
    await save(req.surveyKey,prev?{...prev,reloginApproved:true}:{reloginApproved:true},true);
    const next=reloginReqs.map(r=>r.id===req.id?{...r,status:"approved",resolvedAt:new Date().toISOString()}:r);
    await save("relogin_requests",next,true); setReloginReqs(next);
    toast(`${req.empName}님 재로그인 승인 완료`,"success");
  }

  async function rejectRelogin(req){
    const next=reloginReqs.map(r=>r.id===req.id?{...r,status:"rejected",resolvedAt:new Date().toISOString()}:r);
    await save("relogin_requests",next,true); setReloginReqs(next);
    toast(`${req.empName}님 재로그인 요청 반려`,"info");
  }

  if(selectedOff)return <OffboardingDetail employee={selectedOff} checks={offChecksMap[selectedOff.id]||{}} tpl={offTpl} onBack={()=>{setSelectedOff(null);reload();}} isAdmin={true}/>;
  if(selected)return <AdminDetail employee={selected} checks={checksMap[selected.id]||{}} tpl={tpl} onBack={()=>{setSelected(null);reload();}}/>;

  const depts=["전체",...new Set(employees.map(e=>e.department))];
  const filtered=employees.filter(e=>{
    const p=calcProgress(checksMap[e.id]||{},tpl);
    const ok=filterStatus==="전체"||(filterStatus==="완료"&&p.pct===100)||(filterStatus==="진행중"&&p.pct>0&&p.pct<100)||(filterStatus==="미시작"&&p.pct===0);
    return(filterDept==="전체"||e.department===filterDept)&&ok;
  });

  // ext req stats
  const extAll=allExtReqs.length, extPending=allExtReqs.filter(r=>r.status==="pending").length, extApproved=allExtReqs.filter(r=>r.status==="approved").length;

  // ext panel filtered list — group by employee
const filteredExt=allExtReqs.filter(r=>{
    if(extPanel==="all")return true;
    if(extPanel==="pending")return r.status==="pending";
    if(extPanel==="approved")return r.status==="approved";
    if(extPanel==="rejected")return r.status==="rejected";
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

  return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8e4ff 0%,#f5f3ff 50%,#e4f0ff 100%)",fontFamily:"'Pretendard',sans-serif"}}>
    <div style={{background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",padding:"20px 24px",color:"#fff",boxShadow:"0 4px 24px rgba(100,80,200,.2)"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",padding:"5px 12px",borderRadius:7,fontSize:12,cursor:"pointer",marginBottom:12,fontFamily:"inherit"}}>← 로그아웃</button>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"3px",color:"rgba(255,255,255,.7)",marginBottom:4}}>BI MATRIX</div>
            <h1 style={{fontSize:21,fontWeight:800,margin:"0 0 10px",letterSpacing:"-.4px"}}>입퇴사 관리 인사이트</h1>
            {/* 탭 switcher */}
            <div style={{display:"flex",gap:6}}>
              {[{key:"onboarding",label:"입사자",count:employees.length},{key:"offboarding",label:"퇴사자",count:offEmps.length}].map(tab=>(
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                  style={{background:activeTab===tab.key?"rgba(255,255,255,.25)":"rgba(255,255,255,.1)",
                    border:`1.5px solid ${activeTab===tab.key?"rgba(255,255,255,.7)":"rgba(255,255,255,.25)"}`,
                    color:"#fff",padding:"5px 16px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}
                  onMouseEnter={e=>{if(activeTab!==tab.key){e.currentTarget.style.background="rgba(255,255,255,.2)";e.currentTarget.style.borderColor="rgba(255,255,255,.5)";e.currentTarget.style.transform="translateY(-2px)";}}}
                  onMouseLeave={e=>{if(activeTab!==tab.key){e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.borderColor="rgba(255,255,255,.25)";e.currentTarget.style.transform="translateY(0)";}}}>
                  {tab.label}{tab.count>0&&<span style={{fontSize:11,opacity:.8}}> ({tab.count})</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {extAll>0&&(
              <div style={{display:"flex",gap:5,alignItems:"center",background:"rgba(255,255,255,.1)",borderRadius:12,padding:"6px 10px",border:"1px solid rgba(255,255,255,.2)"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,.6)",marginRight:4,fontWeight:600}}>요청함</span>
                {DASH_EXT_TABS.map(tab=>{
                  const isActive=extPanel===tab.key;
                  return(<button key={tab.key} onClick={()=>handleExtTabClick(tab.key)} title={`${tab.label} (${tab.count}건)`}
                    style={{background:isActive?"rgba(255,255,255,.3)":"rgba(255,255,255,.1)",border:`1.5px solid ${isActive?"rgba(255,255,255,.8)":"rgba(255,255,255,.2)"}`,
                      borderRadius:9,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",transition:"all .18s",minWidth:48}}
                    onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background="rgba(255,255,255,.22)";e.currentTarget.style.borderColor="rgba(255,255,255,.5)";e.currentTarget.style.transform="translateY(-2px)";}}}
                    onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.borderColor="rgba(255,255,255,.2)";e.currentTarget.style.transform="translateY(0)";}}}>
                    <span style={{fontSize:16}}>{tab.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.8)",marginTop:1}}>{tab.label}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{tab.count}</span>
                  </button>);
                })}
              </div>
            )}
            {reloginReqs.some(r=>r.status==="pending")&&(
              <button onClick={()=>setReloginPanel(p=>!p)} title="재로그인 요청"
                style={{background:reloginPanel?"rgba(255,255,255,.3)":"rgba(255,255,255,.1)",border:`1.5px solid ${reloginPanel?"rgba(255,255,255,.8)":"rgba(255,255,255,.2)"}`,
                  borderRadius:9,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",transition:"all .18s",minWidth:48,position:"relative"}}
                onMouseEnter={e=>{if(!reloginPanel){e.currentTarget.style.background="rgba(255,255,255,.22)";e.currentTarget.style.borderColor="rgba(255,255,255,.5)";}}}
                onMouseLeave={e=>{if(!reloginPanel){e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.borderColor="rgba(255,255,255,.2)";}}}>
                <span style={{fontSize:16}}>🔓</span>
                <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.8)",marginTop:1}}>재로그인</span>
                <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{reloginReqs.filter(r=>r.status==="pending").length}</span>
              </button>
            )}
            {activeTab==="onboarding"&&<>
              <SBtn onClick={openJoinModal}              bg="rgba(255,255,255,.18)" color="#fff" style={{padding:"7px 12px",fontSize:12,borderRadius:9,border:"1px solid rgba(255,255,255,.3)"}}>✏️ 정보 변경</SBtn>
              <SBtn onClick={()=>employees.forEach(sendReminder)} bg="rgba(255,255,255,.18)" color="#fff" style={{padding:"7px 12px",fontSize:12,borderRadius:9,border:"1px solid rgba(255,255,255,.3)"}}>📧 전체 알림</SBtn>
              <SBtn onClick={()=>setShowAdd(true)} bg="#fff" color="#5B6EEA" style={{padding:"7px 12px",fontSize:12,borderRadius:9,fontWeight:700}}>＋ 입사자</SBtn>
            </>}
            {activeTab==="offboarding"&&(
              <SBtn onClick={()=>setShowAddOff(true)} bg="#fff" color="#e84c8b" style={{padding:"7px 12px",fontSize:12,borderRadius:9,fontWeight:700}}>＋ 퇴사자 등록</SBtn>
            )}
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
                    <div style={{fontSize:12,color:"#6b7a99"}}>{fmtD(r.currentDue)} → {fmtD(r.currentDue+r.requestDays)} ({r.requestDays}일 연장)</div>
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

    {/* ── Relogin requests panel ── */}
    {reloginPanel&&(
      <div style={{background:"#f0f4ff",borderBottom:"2px solid #5B6EEA30"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"14px 22px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:13,color:"#5B6EEA"}}>🔓 재로그인 승인 요청</span>
            <button onClick={()=>setReloginPanel(false)} style={{background:"transparent",border:"none",color:"#8899bb",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ 닫기</button>
          </div>
          {reloginReqs.length===0&&<div style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"12px 0"}}>요청이 없습니다.</div>}
          {reloginReqs.map(r=>{
            const si={pending:["⏳ 검토중","#F5A623"],approved:["✅ 승인됨","#27AE60"],rejected:["❌ 반려됨","#E84545"]}[r.status];
            return(
              <div key={r.id} style={{background:"#fff",borderRadius:12,marginBottom:10,padding:"12px 16px",boxShadow:"0 2px 8px rgba(30,50,120,.06)",display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                <Badge text={si[0]} color={si[1]}/>
                <div style={{flex:1,minWidth:160}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{r.empName} <span style={{fontWeight:400,fontSize:12,color:"#8899bb"}}>{r.department} · {r.position}</span></div>
                  <div style={{fontSize:12,color:"#5B6EEA",marginTop:2}}>{r.type==="on"?"입사자 온보딩":"퇴사자 오프보딩"}</div>
                  <div style={{fontSize:13,color:"#4a5568",marginTop:4,fontStyle:"italic"}}>"{r.reason}"</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:3}}>{fmtDT(r.createdAt)}</div>
                </div>
                {r.status==="pending"&&(
                  <div style={{display:"flex",gap:6,alignSelf:"center"}}>
                    <SBtn onClick={()=>approveRelogin(r)} bg="#27AE60" color="#fff" hoverBg="#1e9655" style={{fontSize:12,padding:"5px 12px"}}>승인</SBtn>
                    <SBtn onClick={()=>rejectRelogin(r)} bg="#f4f7fb" color="#E84545" hoverBg="#fff0f0" style={{fontSize:12,padding:"5px 12px"}}>반려</SBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    <div style={{maxWidth:1100,margin:"0 auto",padding:"22px 14px"}}>
      {activeTab==="onboarding"&&employees.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:12,marginBottom:20}}>
          {[{label:"전체 입사자",value:employees.length,red:false,icon:"👥"},
            {label:"완료",value:employees.filter(e=>calcProgress(checksMap[e.id]||{},tpl).pct===100).length,red:false,icon:"✅"},
            {label:"진행 중",value:employees.filter(e=>{const p=calcProgress(checksMap[e.id]||{},tpl).pct;return p>0&&p<100;}).length,red:false,icon:"🔄"},
            {label:"미시작",value:employees.filter(e=>calcProgress(checksMap[e.id]||{},tpl).pct===0).length,red:true,icon:"⚠️"},
          ].map(c=>(
            <div key={c.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 12px rgba(30,50,120,.07)"}}>
              <div style={{fontSize:20,marginBottom:6}}>{c.icon}</div>
              <div style={{fontSize:26,fontWeight:800,color:c.red?"#E84545":"#3a3a4a"}}>{c.value}</div>
              <div style={{fontSize:13,color:"#b0b8c8",fontWeight:500,marginTop:2}}>{c.label}</div>
            </div>
          ))}
          <SurveyStatCard employees={employees} offEmps={[]} checksMap={checksMap} tpl={tpl} onDoubleClick={loadSurveys}/>
        </div>
      )}
      {activeTab==="offboarding"&&offEmps.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:12,marginBottom:20}}>
          {[{label:"전체 퇴사자",value:offEmps.length,red:false,icon:"🚪"},
            {label:"처리 완료",value:offEmps.filter(e=>calcProgress(offChecksMap[e.id]||{},offTpl).pct===100).length,red:false,icon:"✅"},
            {label:"진행 중",value:offEmps.filter(e=>{const p=calcProgress(offChecksMap[e.id]||{},offTpl).pct;return p>0&&p<100;}).length,red:false,icon:"🔄"},
            {label:"미시작",value:offEmps.filter(e=>calcProgress(offChecksMap[e.id]||{},offTpl).pct===0).length,red:true,icon:"⏳"},
          ].map(c=>(
            <div key={c.label} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 12px rgba(30,50,120,.07)"}}>
              <div style={{fontSize:20,marginBottom:6}}>{c.icon}</div>
              <div style={{fontSize:26,fontWeight:800,color:c.red?"#E84545":"#3a3a4a"}}>{c.value}</div>
              <div style={{fontSize:13,color:"#b0b8c8",fontWeight:500,marginTop:2}}>{c.label}</div>
            </div>
          ))}
          <SurveyStatCard employees={[]} offEmps={offEmps} checksMap={{}} tpl={offTpl} onDoubleClick={loadSurveys}/>
        </div>
      )}

      {activeTab==="onboarding"&&<div style={{background:"#fff",borderRadius:16,boxShadow:"0 2px 14px rgba(30,50,120,.07)",overflow:"hidden"}}>
        <div style={{padding:"13px 18px",borderBottom:"1px solid #f0f4fa",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <span style={{fontWeight:700,fontSize:15,color:"#1a2233"}}>입사자 현황</span>
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
            <div style={{fontWeight:700,fontSize:15,marginBottom:5}}>등록된 입사자가 없습니다</div>
            <div style={{fontSize:13}}>상단 [＋ 입사자] 버튼을 눌러 추가하세요</div>
          </div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
              <thead>
                <tr style={{background:"#f8faff"}}>
                  {["사번","성명","부서","직급","입사일","경과일","완료율","상태","액션"].map(h=>(
                    <th key={h} style={{padding:"10px 13px",textAlign:"center",fontSize:11,fontWeight:700,color:"#8899bb",letterSpacing:".4px",whiteSpace:"nowrap"}}>{h}</th>
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
                    <td style={{padding:"12px 13px",color:"#8899bb",textAlign:"center",fontSize:12}}>{emp.empId||"-"}</td>
                    <td style={{padding:"12px 13px",fontWeight:700,color:"#1a2233",textAlign:"center"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        {emp.name}
                        {empExtPending>0&&<Badge text={`연장요청 ${empExtPending}`} color="#F5A623"/>}
                      </div>
                    </td>
                    <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{emp.department}</td>
                    <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{emp.position}</td>
                    <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{emp.joinDate}</td>
                    <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{elapsed}일</td>
                    <td style={{padding:"12px 13px",textAlign:"center"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <div style={{flex:1,height:6,background:"#e8ecf0",borderRadius:3,minWidth:64}}>
                          <div style={{height:"100%",width:`${pct}%`,background:sc,borderRadius:3,transition:"width .4s"}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:sc,minWidth:30}}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 13px",textAlign:"center"}}><Badge text={st} color={sc}/></td>
                    <td style={{padding:"12px 13px",textAlign:"center"}}>
                      <div style={{display:"flex",justifyContent:"center",gap:5}}>
                        <SBtn onClick={e=>{e.stopPropagation();sendReminder(emp);}} bg="#fff4f4" color="#E84545" style={{border:"1px solid #ffcccc"}}>📧 알림</SBtn>
                        <SBtn onClick={e=>{e.stopPropagation();deleteEmployee(emp.id);}} bg="#f4f7fb" color="#8899bb" style={{border:"1px solid #e2e8f0"}}>삭제</SBtn>
                      </div>
                    </td>
                  </tr>);
                })}
                {filtered.length===0&&<tr><td colSpan={9} style={{padding:28,textAlign:"center",color:"#8899bb",fontSize:13}}>필터 조건에 맞는 사원이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* ── 퇴사자 테이블 ── */}
      {activeTab==="offboarding"&&(()=>{
        const offDepts=["전체",...new Set(offEmps.map(e=>e.department))];
        const offFiltered=offEmps.filter(e=>{
          const p=calcProgress(offChecksMap[e.id]||{},offTpl);
          const ok=filterOffStatus==="전체"||(filterOffStatus==="완료"&&p.pct===100)||(filterOffStatus==="진행중"&&p.pct>0&&p.pct<100)||(filterOffStatus==="미시작"&&p.pct===0);
          return(filterOffDept==="전체"||e.department===filterOffDept)&&ok;
        });
        return(<div style={{background:"#fff",borderRadius:16,boxShadow:"0 2px 14px rgba(30,50,120,.07)",overflow:"hidden"}}>
          <div style={{padding:"13px 18px",borderBottom:"1px solid #f0f4fa",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <span style={{fontWeight:700,fontSize:15,color:"#1a2233"}}>퇴사자 현황</span>
            <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:"#8899bb"}}>행 더블클릭 → 상세보기</span>
              <select value={filterOffDept} onChange={e=>setFilterOffDept(e.target.value)} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,color:"#1a2233",outline:"none",fontFamily:"inherit"}}>
                {offDepts.map(d=><option key={d}>{d}</option>)}
              </select>
              <select value={filterOffStatus} onChange={e=>setFilterOffStatus(e.target.value)} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,color:"#1a2233",outline:"none",fontFamily:"inherit"}}>
                {["전체","완료","진행중","미시작"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {loading?(
            <div style={{padding:44,textAlign:"center",color:"#8899bb"}}>불러오는 중...</div>
          ):offEmps.length===0?(
            <div style={{padding:60,textAlign:"center",color:"#8899bb"}}>
              <div style={{fontSize:38,marginBottom:10}}>🚪</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:5}}>등록된 퇴사자가 없습니다</div>
              <div style={{fontSize:13}}>상단 [＋ 퇴사자 등록] 버튼을 눌러 추가하세요</div>
            </div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead>
                  <tr style={{background:"#f8faff"}}>
                    {["사번","성명","부서","직급","퇴사일","경과일","완료율","상태","액션"].map(h=>(
                      <th key={h} style={{padding:"10px 13px",textAlign:"center",fontSize:11,fontWeight:700,color:"#8899bb",letterSpacing:".4px",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offFiltered.map(emp=>{
                    const {pct}=calcProgress(offChecksMap[emp.id]||{},offTpl);
                    const elapsed=daysBetween(emp.leaveDate);
                    const sc=pct===100?"#27AE60":pct===0?"#8899bb":"#F5A623";
                    const st=pct===100?"완료":pct===0?"미시작":"진행중";
                    return(<tr key={emp.id} onClick={()=>handleOffRowClick(emp)}
                      style={{borderBottom:"1px solid #f0f4fa",cursor:"pointer",transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"12px 13px",color:"#8899bb",textAlign:"center",fontSize:12}}>{emp.empId||"-"}</td>
                      <td style={{padding:"12px 13px",fontWeight:700,color:"#1a2233",textAlign:"center"}}>{emp.name}</td>
                      <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{emp.department}</td>
                      <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{emp.position}</td>
                      <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{emp.leaveDate}</td>
                      <td style={{padding:"12px 13px",color:"#4a5568",textAlign:"center"}}>{elapsed}일</td>
                      <td style={{padding:"12px 13px",textAlign:"center"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          <div style={{flex:1,height:6,background:"#e8ecf0",borderRadius:3,minWidth:64}}>
                            <div style={{height:"100%",width:`${pct}%`,background:sc,borderRadius:3,transition:"width .4s"}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color:sc,minWidth:30}}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{padding:"12px 13px",textAlign:"center"}}><Badge text={st} color={sc}/></td>
                      <td style={{padding:"12px 13px",textAlign:"center"}}>
                        <div style={{display:"flex",justifyContent:"center",gap:5}}>
                          <SBtn onClick={e=>{e.stopPropagation();deleteOffboardingEmployee(emp.id);}} bg="#f4f7fb" color="#8899bb" style={{border:"1px solid #e2e8f0"}}>삭제</SBtn>
                        </div>
                      </td>
                    </tr>);
                  })}
                  {offFiltered.length===0&&<tr><td colSpan={9} style={{padding:28,textAlign:"center",color:"#8899bb",fontSize:13}}>필터 조건에 맞는 사원이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>);
      })()}
    </div>

    {showAddOff&&(
      <Modal title="퇴사자 등록" onClose={()=>setShowAddOff(false)} titleColor="#E84545">
        {[{k:"name",l:"성명 *",p:"홍길동",t:"text"},{k:"empId",l:"사번 *",p:"EMP001",t:"text"},
          {k:"department",l:"부서 *",p:"개발팀",t:"text"},{k:"position",l:"직급 *",p:"사원",t:"text"},
          {k:"leaveDate",l:"퇴사일 *",p:"",t:"date"},{k:"email",l:"이메일",p:"hong@company.com",t:"email"}].map(f=>(
          <Field key={f.k} label={f.l}><FI type={f.t} value={offForm[f.k]} onChange={e=>setOffForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}/></Field>
        ))}
        <div style={{display:"flex",gap:10,marginTop:14}}><PBtn onClick={addOffboardingEmployee} color="#E84545" style={{flex:1}}>등록</PBtn><OBtn onClick={()=>setShowAddOff(false)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {showAdd&&(
      <Modal title="입사자 등록" onClose={()=>setShowAdd(false)}>
        {[{k:"name",l:"성명 *",p:"홍길동",t:"text"},{k:"empId",l:"사번 *",p:"EMP001",t:"text"},
          {k:"department",l:"부서 *",p:"개발팀",t:"text"},{k:"position",l:"직급 *",p:"사원",t:"text"},
          {k:"joinDate",l:"입사일 *",p:"",t:"date"},{k:"email",l:"이메일",p:"hong@company.com",t:"email"}].map(f=>(
          <Field key={f.k} label={f.l}><FI type={f.t} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}/></Field>
        ))}
        <div style={{display:"flex",gap:10,marginTop:14}}><PBtn onClick={addEmployee} style={{flex:1}}>등록</PBtn><OBtn onClick={()=>setShowAdd(false)} style={{flex:1}}>취소</OBtn></div>
      </Modal>
    )}

    {joinModal&&(
      <Modal title="✏️ 입사자 정보 변경" onClose={()=>{setJoinModal(false);setEditTarget(null);}} width={500}>
        {!editTarget?(
          <>
            <p style={{fontSize:13,color:"#8899bb",margin:"0 0 12px"}}>수정할 입사자를 선택하세요</p>
            <div style={{maxHeight:320,overflowY:"auto",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"4px 0"}}>
              {employees.map(e=>(
                <div key={e.id} onClick={()=>selectEditTarget(e)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f4f7fa",transition:"background .15s"}}
                  onMouseEnter={ev=>ev.currentTarget.style.background="#f0f5ff"}
                  onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                  <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{color:"#fff",fontWeight:800,fontSize:13}}>{e.name[0]}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{e.name}</div>
                    <div style={{fontSize:12,color:"#8899bb"}}>{e.empId||"-"} · {e.department} · {e.position}</div>
                  </div>
                  <span style={{fontSize:12,color:"#b0b8c8"}}>{e.joinDate}</span>
                  <span style={{color:"#5B6EEA",fontSize:13}}>→</span>
                </div>
              ))}
              {employees.length===0&&<div style={{padding:"24px",textAlign:"center",color:"#b0b8c8",fontSize:13}}>등록된 입사자가 없습니다.</div>}
            </div>
          </>
        ):(
          <>
            <button onClick={()=>setEditTarget(null)} style={{background:"none",border:"none",color:"#8899bb",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600,padding:0,marginBottom:14}}>← 목록으로</button>
            <div style={{background:"#f0f4ff",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#5B6EEA,#7c5ce8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontWeight:800,fontSize:12}}>{editTarget.name[0]}</span>
              </div>
              <span style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{editTarget.name} 정보 수정</span>
            </div>
            {[{k:"name",l:"성명 *",t:"text",p:"홍길동"},{k:"empId",l:"사번 *",t:"text",p:"EMP001"},
              {k:"department",l:"부서 *",t:"text",p:"개발팀"},{k:"position",l:"직급 *",t:"text",p:"사원"},
              {k:"joinDate",l:"입사일 *",t:"date",p:""},{k:"email",l:"이메일",t:"email",p:"hong@company.com"}
            ].map(f=>(
              <Field key={f.k} label={f.l}>
                <FI type={f.t} value={editEmpForm[f.k]||""} onChange={e=>setEditEmpForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}/>
              </Field>
            ))}
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <PBtn onClick={saveEditEmp} color="#5B6EEA" style={{flex:1}}>저장</PBtn>
              <OBtn onClick={()=>{setJoinModal(false);setEditTarget(null);}} style={{flex:1}}>취소</OBtn>
            </div>
          </>
        )}
      </Modal>
    )}

    {surveyDash&&(()=>{
      const onData=surveyAllData.filter(d=>d.type==="on");
      const offData=surveyAllData.filter(d=>d.type==="off");
      const tabData=surveyTab==="on"?onData:offData;
      const tabColor=surveyTab==="on"?"#5B6EEA":"#e84c8b";
      const avg=tabData.length?(tabData.reduce((s,d)=>s+d.rating,0)/tabData.length).toFixed(1):"—";
      const dist=[1,2,3,4,5].map(i=>({star:i,count:tabData.filter(d=>d.rating===i).length}));
      const maxDist=Math.max(...dist.map(d=>d.count),1);
      return(
        <div style={{position:"fixed",inset:0,background:"rgba(10,18,40,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:16}} onClick={()=>setSurveyDash(false)}>
          <div style={{background:"#fff",borderRadius:24,padding:"32px 28px",width:"100%",maxWidth:700,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 20px 80px rgba(0,0,0,.24)"}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"2px",color:"#a084ee",marginBottom:4}}>SURVEY RESULTS</div>
                <h2 style={{fontWeight:800,fontSize:20,color:"#1a2233",margin:0}}>📊 만족도 조사 대시보드</h2>
              </div>
              <button onClick={()=>setSurveyDash(false)} style={{background:"#f4f7fb",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:16,color:"#8899bb"}}>✕</button>
            </div>
            {/* Tabs */}
            <div style={{display:"flex",gap:8,marginBottom:24,background:"#f4f7fb",borderRadius:12,padding:4}}>
              {[{key:"on",label:"입사자 온보딩",count:onData.length,color:"#5B6EEA"},
                {key:"off",label:"퇴사자 오프보딩",count:offData.length,color:"#e84c8b"}].map(t=>(
                <button key={t.key} onClick={()=>setSurveyTab(t.key)}
                  style={{flex:1,padding:"9px 12px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,
                    background:surveyTab===t.key?"#fff":"transparent",
                    color:surveyTab===t.key?t.color:"#8899bb",
                    boxShadow:surveyTab===t.key?"0 2px 8px rgba(30,50,120,.1)":"none",
                    transition:"all .15s"}}>
                  {t.label} <span style={{fontWeight:800}}>({t.count})</span>
                </button>
              ))}
            </div>
            {/* Content */}
            {tabData.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:"#8899bb"}}>
                <div style={{fontSize:36,marginBottom:10}}>📭</div>
                <div style={{fontWeight:700,fontSize:15}}>아직 제출된 설문이 없습니다</div>
              </div>
            ):(
              <>
                {/* Summary cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
                  {[{label:"응답 건수",value:tabData.length+"건",icon:"📋",color:tabColor},
                    {label:"평균 만족도",value:`${avg}★`,icon:"⭐",color:"#F5A623"},
                    {label:"5점 응답",value:tabData.filter(d=>d.rating===5).length+"건",icon:"🏆",color:"#27AE60"},
                  ].map(c=>(
                    <div key={c.label} style={{background:`${c.color}10`,border:`1.5px solid ${c.color}30`,borderRadius:14,padding:"16px",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{c.icon}</div>
                      <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.value}</div>
                      <div style={{fontSize:12,color:"#8899bb",marginTop:2}}>{c.label}</div>
                    </div>
                  ))}
                </div>
                {/* Rating distribution */}
                <div style={{background:"#f8faff",borderRadius:14,padding:"18px 20px",marginBottom:20}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a2233",marginBottom:14}}>별점 분포</div>
                  {dist.slice().reverse().map(d=>(
                    <div key={d.star} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#F5A623",minWidth:24}}>{d.star}★</span>
                      <div style={{flex:1,height:16,background:"#eee",borderRadius:8,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(d.count/maxDist)*100}%`,background:"linear-gradient(90deg,#F5A623,#f7c35f)",borderRadius:8,transition:"width .4s"}}/>
                      </div>
                      <span style={{fontSize:12,color:"#8899bb",minWidth:24,textAlign:"right"}}>{d.count}</span>
                    </div>
                  ))}
                </div>
                {/* Individual responses */}
                <div style={{fontWeight:700,fontSize:13,color:"#1a2233",marginBottom:12}}>개별 응답 ({tabData.length}건)</div>
                {tabData.slice().sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)).map((d,i)=>(
                  <div key={i} style={{background:"#fff",border:"1.5px solid #f0f0f8",borderRadius:14,padding:"16px 18px",marginBottom:10,boxShadow:"0 2px 8px rgba(30,50,120,.05)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                      <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${tabColor},${surveyTab==="on"?"#7c5ce8":"#f07ab0"})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,flexShrink:0}}>{d.empName[0]}</div>
                      <div style={{flex:1}}>
                        <span style={{fontWeight:700,fontSize:14,color:"#1a2233"}}>{d.empName}</span>
                        <span style={{fontSize:12,color:"#8899bb",marginLeft:6}}>{d.department} · {d.position}</span>
                      </div>
                      <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(j=><span key={j} style={{color:j<=d.rating?"#F5A623":"#ddd",fontSize:18}}>★</span>)}</div>
                      <span style={{fontSize:11,color:"#bbb"}}>{fmtDT(d.submittedAt)}</span>
                    </div>
                    {d.helpful&&<div style={{marginBottom:6}}><span style={{fontSize:11,fontWeight:700,color:"#27AE60"}}>✅ 도움된 부분 </span><span style={{fontSize:13,color:"#1a2233"}}>{d.helpful}</span></div>}
                    {d.improve&&<div style={{marginBottom:6}}><span style={{fontSize:11,fontWeight:700,color:"#E84545"}}>🔧 개선 필요 </span><span style={{fontSize:13,color:"#1a2233"}}>{d.improve}</span></div>}
                    {d.other&&<div><span style={{fontSize:11,fontWeight:700,color:"#8899bb"}}>💬 기타 </span><span style={{fontSize:13,color:"#1a2233"}}>{d.other}</span></div>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    })()}
  </div>);
}

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────
function UserOffboardingChecklist({employee,onBack}){
  const [checks,setChecks]=useState({});
  const [tpl,setTpl]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([load(`off_checks_${employee.id}`,true),load("offboarding_template",true)])
      .then(([c,t])=>{setChecks(c||{});setTpl(t||DEFAULT_OFFBOARDING_TEMPLATE);setLoading(false);});
  },[employee.id]);
  if(loading)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',sans-serif"}}>불러오는 중...</div>;
  return <OffboardingDetail employee={employee} checks={checks} tpl={tpl} onBack={onBack}/>;
}

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
    setCurrentUser(emp);
    setView(emp.offboarding?"userOffboarding":"userChecklist");
  }
  if(view==="home")return <UserHome onLogin={handleLogin}/>;
  if(view==="userChecklist")return <UserChecklist employee={currentUser} onBack={()=>setView("home")}/>;
  if(view==="userOffboarding")return <UserOffboardingChecklist employee={currentUser} onBack={()=>setView("home")}/>;
  if(view==="adminLogin")return <AdminLogin onLogin={()=>setView("adminDash")} onBack={()=>setView("home")}/>;
  if(view==="adminDash")return <AdminDashboard onBack={()=>setView("home")}/>;
  return null;
}
