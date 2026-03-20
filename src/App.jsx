import { useState, useEffect, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ── Firebase ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAoe1TpiHG2nQhfTAXn5HrlUP_na-QmKWw",
  authDomain: "edutrack-559a7.firebaseapp.com",
  projectId: "edutrack-559a7",
  storageBucket: "edutrack-559a7.firebasestorage.app",
  messagingSenderId: "1067611331264",
  appId: "1:1067611331264:web:03574d376f1c08aca16b25",
};
const fbApp     = initializeApp(firebaseConfig);
const auth      = getAuth(fbApp);
const db        = getFirestore(fbApp);
const gProvider = new GoogleAuthProvider();

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid     = () => Math.random().toString(36).slice(2, 9);
const today   = () => new Date().toISOString().split("T")[0];
const fmtFull = (d) => new Date(d + "T00:00").toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" });

// FIX: día de semana correcto para Argentina (lunes=0)
const diaSemana = (fecha) => {
  const d = new Date(fecha + "T00:00");
  const dia = d.getDay(); // 0=dom,1=lun,...,6=sab
  return dia === 0 ? 6 : dia - 1; // lun=0 ... dom=6
};

const COLORES    = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1","#14B8A6","#E879F9","#FBBF24","#34D399","#60A5FA"];
const MOTIVATIONS= ["El esfuerzo de hoy es el éxito de mañana.","Cada página que estudiás te acerca a tu meta.","La constancia vence al talento cuando el talento no es constante.","No se trata de ser el mejor, sino de ser mejor que ayer.","Estudiar es invertir en la única cosa que nadie puede quitarte."];
const DIAS       = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
const HORAS      = ["7:15","8:00","8:45","9:30","10:15","11:00","11:30","12:15","13:00","13:45","14:30","15:15","16:00","16:45","17:30"];
const TIPOS_EVAL = ["Escrita","Oral","Práctica","Conceptual","Desempeño Global","Trabajo Práctico"];
const TRI_LBL    = ["1° Trimestre","2° Trimestre","3° Trimestre"];

const INIT = {
  materias:[
    {id:"m1",nombre:"Matemática",color:COLORES[0]},{id:"m2",nombre:"Lengua",color:COLORES[1]},
    {id:"m3",nombre:"Historia",color:COLORES[2]},{id:"m4",nombre:"Biología",color:COLORES[3]},
    {id:"m5",nombre:"Inglés",color:COLORES[4]},{id:"m6",nombre:"Física",color:COLORES[5]},
    {id:"m7",nombre:"Química",color:COLORES[6]},{id:"m8",nombre:"Ed. Física",color:COLORES[7]},
  ],
  calificaciones:[],agenda:[],asistencia:[],profesores:[],horario:[],
  trimestres:[
    {inicio:"",fin:"",cerrado:false,promedios:{}},
    {inicio:"",fin:"",cerrado:false,promedios:{}},
    {inicio:"",fin:"",cerrado:false,promedios:{}},
  ],
  diasEspeciales:[],
  config:{nombre:"Mi Escuela",alumno:"Estudiante",anio:"2026",motivacion:true,darkMode:false},
};

// ── Tema claro/oscuro ─────────────────────────────────────────────────────────
const LIGHT = {
  bg:"#F0F4F8", card:"#ffffff", sidebar:"#ffffff", topbar:"#ffffff",
  border:"#F1F5F9", border2:"#E2E8F0",
  text:"#0F172A", text2:"#334155", text3:"#64748B", text4:"#94A3B8",
  inp:"#F8FAFC", inpBorder:"#E2E8F0", inpText:"#0F172A",
  hover:"#F1F5F9", activeNav:"#EFF6FF", activeNavText:"#2563EB",
  rowHover:"#F8FAFC", tableHead:"#F8FAFC",
  btnGhostBg:"transparent", btnGhostText:"#64748B", btnGhostBorder:"#E2E8F0",
  shadow:"0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)",
};
const DARK = {
  bg:"#0F172A", card:"#1E293B", sidebar:"#1E293B", topbar:"#1E293B",
  border:"#334155", border2:"#334155",
  text:"#F1F5F9", text2:"#CBD5E1", text3:"#94A3B8", text4:"#64748B",
  inp:"#0F172A", inpBorder:"#334155", inpText:"#F1F5F9",
  hover:"#334155", activeNav:"#1D3461", activeNavText:"#60A5FA",
  rowHover:"#263148", tableHead:"#162032",
  btnGhostBg:"transparent", btnGhostText:"#94A3B8", btnGhostBorder:"#334155",
  shadow:"0 1px 3px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.2)",
};

// ── Global CSS ────────────────────────────────────────────────────────────────
const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:${t.border};}
::-webkit-scrollbar-thumb{background:${t.text4};border-radius:3px;}
input,select,textarea,button{font-family:inherit;color:${t.inpText};}
button{cursor:pointer;}
.card{background:${t.card};border-radius:16px;box-shadow:${t.shadow};padding:20px;}
.badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;}
.chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;}
.btn{padding:8px 16px;border-radius:10px;border:none;font-size:13px;font-weight:600;transition:all .15s;white-space:nowrap;}
.btn-primary{background:#3B82F6;color:#fff;} .btn-primary:hover{background:#2563EB;}
.btn-ghost{background:${t.btnGhostBg};color:${t.btnGhostText};border:1.5px solid ${t.btnGhostBorder};} .btn-ghost:hover{border-color:${t.text4};background:${t.hover};}
.btn-danger{background:#FEE2E2;color:#DC2626;border:none;} .btn-danger:hover{background:#FECACA;}
.inp{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid ${t.inpBorder};font-size:13px;outline:none;transition:border .15s;background:${t.inp};color:${t.inpText};}
.inp:focus{border-color:#3B82F6;background:${t.card};}
.inp option{background:${t.card};color:${t.inpText};}
.lbl{font-size:11px;font-weight:600;color:${t.text3};text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;}
.rw{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;}
.sec-title{font-size:20px;font-weight:700;color:${t.text};margin-bottom:4px;}
.sec-sub{font-size:13px;color:${t.text3};margin-bottom:18px;}
table{width:100%;border-collapse:collapse;}
th{text-align:left;font-size:11px;font-weight:700;color:${t.text4};text-transform:uppercase;letter-spacing:.06em;padding:8px 12px;border-bottom:1.5px solid ${t.border};background:${t.tableHead};}
td{padding:10px 12px;font-size:13px;color:${t.text2};border-bottom:1px solid ${t.border};}
tr:last-child td{border-bottom:none;} tr:hover td{background:${t.rowHover};}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;cursor:pointer;transition:all .15s;font-size:13px;font-weight:500;color:${t.text3};border:none;background:none;width:100%;text-align:left;}
.nav-item:hover{background:${t.hover};color:${t.text};} .nav-item.active{background:${t.activeNav};color:${t.activeNavText};font-weight:700;}
.sidebar{width:220px;background:${t.sidebar};display:flex;flex-direction:column;border-right:1.5px solid ${t.border};padding:20px 12px;gap:2px;position:fixed;top:0;left:0;height:100vh;z-index:200;overflow-y:auto;transition:transform .25s ease;}
.main-wrap{margin-left:220px;min-height:100vh;background:${t.bg};}
.topbar{display:none;position:fixed;top:0;left:0;right:0;height:56px;background:${t.topbar};border-bottom:1.5px solid ${t.border};z-index:199;align-items:center;padding:0 14px;gap:10px;}
.page-body{padding:28px 28px 60px;}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:198;}
.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:${t.topbar};border-top:1.5px solid ${t.border};z-index:200;padding:4px 0 env(safe-area-inset-bottom,4px);}
.bn-inner{display:flex;justify-content:space-around;}
.bn-item{display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 8px;border-radius:8px;cursor:pointer;border:none;background:none;flex:1;font-size:9px;font-weight:600;color:${t.text4};transition:color .15s;}
.bn-item.active{color:#3B82F6;}
.bn-icon{font-size:19px;line-height:1;}
.tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.gkpi{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}
.gcals{display:grid;grid-template-columns:1fr 260px;gap:16px;}
.gasist{display:grid;grid-template-columns:260px 1fr;gap:16px;}
.saving-dot{width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.25;}}
.info-box{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:10px 14px;font-size:12px;color:#1E40AF;}
@media(max-width:768px){
  .sidebar{transform:translateX(-100%);}
  .sidebar.open{transform:translateX(0);}
  .overlay.open{display:block;}
  .main-wrap{margin-left:0;}
  .topbar{display:flex;}
  .page-body{padding:64px 12px 76px;}
  .bottom-nav{display:block;}
  .g2{grid-template-columns:1fr;}
  .gkpi{grid-template-columns:repeat(2,1fr);}
  .gcals{grid-template-columns:1fr;}
  .gasist{grid-template-columns:1fr;}
  .sec-title{font-size:17px;}
  .card{padding:14px;}
  .btn{padding:7px 12px;font-size:12px;}
  th,td{padding:7px 8px;font-size:12px;}
  .hm{display:none!important;}
}
@media(max-width:480px){
  .gkpi{grid-template-columns:repeat(2,1fr);}
}
`;

// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, loading, tema }) {
  const t = tema;
  return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:t.card,borderRadius:20,boxShadow:t.shadow,maxWidth:380,width:"100%",textAlign:"center",padding:"44px 36px"}}>
        <div style={{fontSize:52,marginBottom:10}}>🎓</div>
        <div style={{fontSize:26,fontWeight:800,color:t.text,marginBottom:6,letterSpacing:"-.02em"}}>EduTrack</div>
        <div style={{fontSize:13,color:t.text3,marginBottom:32}}>Tu gestor escolar personal · sincronizado ☁️</div>
        {loading
          ? <div style={{color:t.text3,fontSize:13}}>Iniciando sesión...</div>
          : <button className="btn" style={{width:"100%",background:t.card,color:t.text2,border:`1.5px solid ${t.border2}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"12px 20px",fontSize:14}} onClick={onLogin}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.16C6.51 42.68 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.16C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.33 2.56 13.22l7.98 6.16C12.43 13.72 17.74 9.5 24 9.5z"/></svg>
              Ingresar con Google
            </button>
        }
        <div style={{marginTop:20,fontSize:11,color:t.text4}}>Tus datos se sincronizan entre todos tus dispositivos.</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,         setUser]         = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [data,         setData]         = useState(INIT);
  const [saving,       setSaving]       = useState(false);
  const [tab,          setTab]          = useState("dashboard");
  const [sideOpen,     setSideOpen]     = useState(false);
  const saveTimer = useMemo(() => ({t:null}), []);

  // ── Hooks SIEMPRE arriba, antes de cualquier return ──
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); }), []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "usuarios", user.uid);
    return onSnapshot(ref, snap => {
      if (snap.exists()) setData(prev => ({...INIT,...prev,...snap.data()}));
    });
  }, [user]);

  const save = useCallback((nd) => {
    if (!user) return;
    clearTimeout(saveTimer.t);
    setSaving(true);
    saveTimer.t = setTimeout(async () => {
      try { await setDoc(doc(db,"usuarios",user.uid), nd, {merge:true}); }
      catch(e) { console.error(e); }
      setSaving(false);
    }, 900);
  }, [user]);

  const upd = useCallback((key, val) => {
    setData(prev => { const next={...prev,[key]:val}; save(next); return next; });
  }, [save]);

  const {materias,calificaciones,agenda,asistencia,trimestres,diasEspeciales,config} = data;
  const darkMode = config?.darkMode || false;
  const tema = darkMode ? DARK : LIGHT;

  const promedioMat = useCallback((matId, tri=null) => {
    const ns = (calificaciones||[]).filter(c => c.materiaId===matId && c.valor!=="PENDIENTE" && (tri===null||c.trimestre===tri)).map(c=>Number(c.valor));
    return ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : null;
  }, [calificaciones]);

  const promedioGeneral = useMemo(() => {
    const ps = (materias||[]).map(m=>promedioMat(m.id)).filter(v=>v!==null);
    return ps.length ? (ps.reduce((a,b)=>a+b,0)/ps.length).toFixed(2) : "—";
  }, [calificaciones,materias,promedioMat]);

  const colMat = useCallback(id => (materias||[]).find(m=>m.id===id)?.color||"#94A3B8", [materias]);
  const nomMat = useCallback(id => (materias||[]).find(m=>m.id===id)?.nombre||"—", [materias]);

  const login  = async () => { setLoginLoading(true); try { await signInWithPopup(auth,gProvider); } catch(e){console.error(e);} setLoginLoading(false); };
  const logout = async () => { if(window.confirm("¿Cerrar sesión?")) await signOut(auth); };
  const toggleDark = () => upd("config", {...config, darkMode: !darkMode});

  // ── Returns condicionales DESPUÉS de todos los hooks ──
  if (authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:LIGHT.bg,flexDirection:"column",gap:12}}>
      <div style={{fontSize:40}}>🎓</div>
      <div style={{fontSize:13,color:"#64748B"}}>Cargando EduTrack...</div>
    </div>
  );

  if (!user) return (
    <>
      <style>{makeCSS(LIGHT)}</style>
      <LoginScreen onLogin={login} loading={loginLoading} tema={LIGHT}/>
    </>
  );

  const PAGES = [
    {id:"dashboard",icon:"⊞",label:"Dashboard"},
    {id:"materias",icon:"📚",label:"Materias"},
    {id:"calificaciones",icon:"📊",label:"Calificaciones"},
    {id:"agenda",icon:"🗓",label:"Agenda"},
    {id:"asistencia",icon:"🏫",label:"Asistencia"},
    {id:"profesores",icon:"👨‍🏫",label:"Profesores"},
    {id:"horario",icon:"📅",label:"Horario"},
    {id:"estadisticas",icon:"📈",label:"Estadísticas"},
    {id:"configuracion",icon:"⚙️",label:"Config."},
  ];
  const BOT = [
    {id:"dashboard",icon:"⊞",label:"Inicio"},
    {id:"calificaciones",icon:"📊",label:"Notas"},
    {id:"agenda",icon:"🗓",label:"Agenda"},
    {id:"asistencia",icon:"🏫",label:"Asistencia"},
    {id:"estadisticas",icon:"📈",label:"Stats"},
  ];
  const go = id => { setTab(id); setSideOpen(false); };
  const curPage = PAGES.find(p=>p.id===tab);
  const sp = {materias,calificaciones,agenda,asistencia,trimestres,diasEspeciales,config,upd,promedioMat,colMat,nomMat,tema};

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:tema.bg,minHeight:"100vh"}}>
      <style>{makeCSS(tema)}</style>
      <div className={`overlay${sideOpen?" open":""}`} onClick={()=>setSideOpen(false)}/>

      {/* Sidebar */}
      <nav className={`sidebar${sideOpen?" open":""}`}>
        <div style={{padding:"0 6px 14px",borderBottom:`1.5px solid ${tema.border}`,marginBottom:6}}>
          <div style={{fontSize:16,fontWeight:800,color:tema.text,letterSpacing:"-.02em"}}>🎓 EduTrack</div>
          <div style={{fontSize:11,color:tema.text4,marginTop:1}}>{config?.alumno} · {config?.anio}</div>
        </div>
        {PAGES.map(p=>(
          <button key={p.id} className={`nav-item${tab===p.id?" active":""}`} onClick={()=>go(p.id)}>
            <span style={{fontSize:15}}>{p.icon}</span>{p.label}
          </button>
        ))}
        <div style={{marginTop:"auto",paddingTop:14,borderTop:`1.5px solid ${tema.border}`}}>
          {saving&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#10B981",padding:"0 6px",marginBottom:8}}><span className="saving-dot"/>Guardando...</div>}
          {/* Dark mode toggle */}
          <button className="btn btn-ghost" style={{width:"100%",fontSize:12,padding:"6px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:8,justifyContent:"center"}} onClick={toggleDark}>
            {darkMode ? "☀️ Modo claro" : "🌙 Modo oscuro"}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 6px",marginBottom:10}}>
            <img src={user.photoURL} alt="" style={{width:26,height:26,borderRadius:"50%"}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:600,color:tema.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.displayName?.split(" ")[0]}</div>
              <div style={{fontSize:10,color:tema.text4}}>☁️ Sincronizado</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{width:"100%",fontSize:11,padding:"5px 8px"}} onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      {/* Topbar mobile */}
      <header className="topbar">
        <button className="btn btn-ghost" style={{padding:"5px 9px",fontSize:17}} onClick={()=>setSideOpen(s=>!s)}>☰</button>
        <span style={{fontWeight:700,fontSize:14,color:tema.text,flex:1}}>{curPage?.icon} {curPage?.label}</span>
        {saving&&<span className="saving-dot"/>}
        <button className="btn btn-ghost" style={{padding:"5px 8px",fontSize:15}} onClick={toggleDark}>{darkMode?"☀️":"🌙"}</button>
        <img src={user.photoURL} alt="" style={{width:28,height:28,borderRadius:"50%",cursor:"pointer"}} onClick={logout}/>
      </header>

      {/* Main */}
      <main className="main-wrap">
        <div className="page-body">
          {tab==="dashboard"      && <Dashboard      {...sp} promedioGeneral={promedioGeneral}/>}
          {tab==="materias"       && <Materias        materias={materias} upd={v=>upd("materias",v)} tema={tema}/>}
          {tab==="calificaciones" && <Calificaciones  {...sp}/>}
          {tab==="agenda"         && <Agenda          {...sp}/>}
          {tab==="asistencia"     && <Asistencia      asistencia={asistencia} upd={v=>upd("asistencia",v)} tema={tema}/>}
          {tab==="profesores"     && <Profesores      {...sp}/>}
          {tab==="horario"        && <Horario         {...sp}/>}
          {tab==="estadisticas"   && <Estadisticas    {...sp} promedioGeneral={promedioGeneral}/>}
          {tab==="configuracion"  && <Configuracion   {...sp} setData={setData} save={save} user={user}/>}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <div className="bn-inner">
          {BOT.map(p=>(
            <button key={p.id} className={`bn-item${tab===p.id?" active":""}`} onClick={()=>go(p.id)}>
              <span className="bn-icon">{p.icon}</span>{p.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function Dashboard({materias,calificaciones,agenda,asistencia,promedioGeneral,promedioMat,colMat,nomMat,config,tema:t}) {
  const mot    = MOTIVATIONS[new Date().getDay()%MOTIVATIONS.length];
  const inasT  = (asistencia||[]).filter(a=>a.tipo?.startsWith("inasistencia")).length;
  const tard   = (asistencia||[]).filter(a=>a.tipo==="tardanza").length;
  const pct    = Math.max(0,(180-inasT)/180*100).toFixed(1);
  const rendC  = promedioGeneral>=8?"#10B981":promedioGeneral>=6?"#F59E0B":"#EF4444";
  const proxEv = [...(agenda||[])].filter(a=>a.fecha>=today()&&a.estado!=="Evaluado").sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,3);

  return (
    <div>
      {config?.motivacion&&(
        <div style={{background:t.activeNav,border:`1.5px solid ${t.border2}`,borderRadius:12,padding:"11px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>✨</span>
          <span style={{fontSize:13,color:t.activeNavText,fontWeight:500,fontStyle:"italic"}}>{mot}</span>
        </div>
      )}
      <div className="gkpi" style={{marginBottom:16}}>
        <KPI label="Promedio General" value={promedioGeneral} color={rendC} sub="anual" big tema={t}/>
        <KPI label="Asistencia" value={`${pct}%`} color="#3B82F6" sub={`${inasT} inasist.`} tema={t}/>
        <KPI label="Tardanzas" value={tard} color="#F59E0B" sub="registradas" tema={t}/>
        <KPI label="Materias" value={(materias||[]).length} color="#8B5CF6" sub="activas" tema={t}/>
        <KPI label="Pendientes" value={(agenda||[]).filter(a=>a.estado==="Pendiente").length} color="#EF4444" sub="sin entregar" tema={t}/>
      </div>
      <div className="g2" style={{marginBottom:14}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:12}}>📊 Promedios por Materia</div>
          {(materias||[]).map(m=>{
            const v=promedioMat(m.id);
            return (
              <div key={m.id} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:12,fontWeight:500,color:t.text2}}>{m.nombre}</span>
                  <span style={{fontSize:12,fontWeight:700,color:v?m.color:t.text4,fontFamily:"'DM Mono',monospace"}}>{v?v.toFixed(1):"—"}</span>
                </div>
                <div style={{height:5,background:t.hover,borderRadius:99}}>
                  <div style={{width:`${v?v/10*100:0}%`,height:"100%",borderRadius:99,background:m.color,transition:"width .4s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:12}}>📅 Próximas Entregas</div>
          {proxEv.length===0&&<div style={{color:t.text4,fontSize:13}}>Sin entregas próximas 🎉</div>}
          {proxEv.map(ev=>{
            const diff=Math.ceil((new Date(ev.fecha+"T00:00")-new Date())/86400000);
            const urg=diff<=2;
            return (
              <div key={ev.id} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${t.border}`}}>
                <div style={{width:34,height:34,borderRadius:9,background:colMat(ev.materiaId)+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
                  {ev.tipo==="Evaluación"?"📝":ev.tipo==="TP"?"📋":"✏️"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.titulo||ev.tipo}</div>
                  <div style={{fontSize:11,color:t.text3}}>{nomMat(ev.materiaId)} · {fmtFull(ev.fecha)}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:urg?"#DC2626":t.text3,background:urg?"#FEE2E2":t.hover,padding:"3px 8px",borderRadius:99,whiteSpace:"nowrap"}}>
                  {diff===0?"Hoy":diff===1?"Mañana":`${diff}d`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:12}}>📈 Evolución Trimestral</div>
        <BarChart materias={(materias||[]).slice(0,6)} promedioMat={promedioMat} tema={t}/>
      </div>
    </div>
  );
}

function KPI({label,value,color,sub,big,tema:t}) {
  return (
    <div className="card" style={{textAlign:"center",padding:"13px 8px"}}>
      <div style={{fontSize:10,color:t.text4,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:big?30:22,fontWeight:800,color,lineHeight:1,fontFamily:"'DM Mono',monospace"}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:t.text4,marginTop:3}}>{sub}</div>}
    </div>
  );
}

function BarChart({materias,promedioMat,tema:t}) {
  return (
    <div style={{overflowX:"auto"}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-end",minWidth:280,paddingBottom:6}}>
        {materias.map(m=>(
          <div key={m.id} style={{flex:1,textAlign:"center"}}>
            <div style={{display:"flex",gap:3,alignItems:"flex-end",justifyContent:"center",height:80}}>
              {[1,2,3].map(t2=>{
                const v=promedioMat(m.id,t2);
                return <div key={t2} title={`${TRI_LBL[t2-1]}: ${v?v.toFixed(1):"—"}`}
                  style={{width:12,height:v?v/10*74:3,borderRadius:"3px 3px 0 0",background:v?m.color:t.hover,opacity:v?[1,.7,.45][t2-1]:1,transition:"height .4s"}}/>;
              })}
            </div>
            <div style={{fontSize:9,color:t.text3,marginTop:3,fontWeight:500}}>{m.nombre.substring(0,7)}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,fontSize:10,color:t.text4,marginTop:2}}>
        {[1,2,3].map((t2,i)=>(
          <div key={t2} style={{display:"flex",alignItems:"center",gap:3}}>
            <div style={{width:8,height:8,borderRadius:2,background:t.text4,opacity:[1,.7,.45][i]}}/>{TRI_LBL[i]}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MATERIAS
// ════════════════════════════════════════════════════════════════════════════
function Materias({materias,upd,tema:t}) {
  const [form,setForm]=useState({nombre:"",color:COLORES[0]});
  const [edit,setEdit]=useState(null);
  const save=()=>{
    if (!form.nombre.trim()) return;
    if (edit) upd(materias.map(m=>m.id===edit?{...m,...form}:m));
    else upd([...materias,{id:uid(),nombre:form.nombre.trim(),color:form.color}]);
    setForm({nombre:"",color:COLORES[0]}); setEdit(null);
  };
  return (
    <div>
      <div className="sec-title">📚 Materias</div>
      <div className="sec-sub">Administrá tus materias y colores.</div>
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:t.text}}>{edit?"Editar":"Nueva"} materia</div>
        <div className="rw">
          <div style={{flex:1,minWidth:150}}>
            <div className="lbl">Nombre</div>
            <input className="inp" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Matemática" onKeyDown={e=>e.key==="Enter"&&save()}/>
          </div>
          <div>
            <div className="lbl">Color</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",maxWidth:240}}>
              {COLORES.map(c=>(
                <div key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                  style={{width:20,height:20,borderRadius:5,background:c,cursor:"pointer",border:form.color===c?"3px solid #3B82F6":"3px solid transparent",transition:"border .1s"}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-primary" onClick={save}>{edit?"Guardar":"Agregar"}</button>
            {edit&&<button className="btn btn-ghost" onClick={()=>{setEdit(null);setForm({nombre:"",color:COLORES[0]});}}>✕</button>}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
        {(materias||[]).map(m=>(
          <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px"}}>
            <div style={{width:11,height:38,borderRadius:5,background:m.color,flexShrink:0}}/>
            <div style={{flex:1,fontWeight:600,fontSize:13,color:t.text}}>{m.nombre}</div>
            <button className="btn btn-ghost" style={{padding:"4px 7px",fontSize:11}} onClick={()=>{setEdit(m.id);setForm({nombre:m.nombre,color:m.color});}}>✏️</button>
            <button className="btn btn-danger" style={{padding:"4px 7px",fontSize:11}} onClick={()=>upd(materias.filter(x=>x.id!==m.id))}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CALIFICACIONES — con edición y fecha
// ════════════════════════════════════════════════════════════════════════════
function Calificaciones({materias,calificaciones:calsRaw,trimestres:triRaw,upd,promedioMat,colMat,nomMat,tema:t}) {
  const calificaciones = calsRaw || [];
  const trimestres     = triRaw  || INIT.trimestres;
  const [tri,     setTri]     = useState(1);
  const [ms,      setMs]      = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId,  setEditId]  = useState(null); // id de la cal que se está editando
  const [form,    setForm]    = useState({materiaId:"",valor:"",tipo:TIPOS_EVAL[0],desc:"",fecha:today()});

  const trI     = trimestres[tri-1];
  const cerrado = trI?.cerrado;
  const filt    = calificaciones.filter(c=>c.trimestre===tri&&(ms==="all"||c.materiaId===ms));

  const openAdd = () => {
    setEditId(null);
    setForm({materiaId:"",valor:"",tipo:TIPOS_EVAL[0],desc:"",fecha:today()});
    setShowAdd(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({materiaId:c.materiaId,valor:c.valor,tipo:c.tipo||TIPOS_EVAL[0],desc:c.desc||"",fecha:c.fecha||today()});
    setShowAdd(true);
  };

  const guardar = () => {
    if (!form.materiaId||!form.valor) return;
    if (editId) {
      upd("calificaciones", calificaciones.map(c => c.id===editId ? {...c,...form,trimestre:tri} : c));
    } else {
      upd("calificaciones",[...calificaciones,{id:uid(),...form,trimestre:tri}]);
    }
    setShowAdd(false); setEditId(null);
  };

  const cerrar=()=>{
    if (!window.confirm(`¿Cerrar ${TRI_LBL[tri-1]}?`)) return;
    const ps={}; (materias||[]).forEach(m=>{const v=promedioMat(m.id,tri);if(v)ps[m.id]=v.toFixed(2);});
    const nt=[...trimestres]; nt[tri-1]={...nt[tri-1],cerrado:true,promedios:ps}; upd("trimestres",nt);
  };
  const abrir=()=>{
    if (!window.confirm("¿Reabrir el trimestre?")) return;
    const nt=[...trimestres]; nt[tri-1]={...nt[tri-1],cerrado:false}; upd("trimestres",nt);
  };

  const dist={}; for(let i=1;i<=10;i++) dist[i]=0;
  calificaciones.filter(c=>c.trimestre===tri&&c.valor!=="PENDIENTE").forEach(c=>{const v=Math.round(Number(c.valor));if(v>=1&&v<=10)dist[v]++;});
  const maxD=Math.max(1,...Object.values(dist));

  const notaStyle = (valor) => ({
    display:"inline-block",padding:"2px 9px",borderRadius:99,fontWeight:700,fontSize:12,fontFamily:"'DM Mono',monospace",
    background:valor==="PENDIENTE"?"#FFF7ED":Number(valor)>=7?"#ECFDF5":Number(valor)>=6?"#FFFBEB":"#FEF2F2",
    color:valor==="PENDIENTE"?"#C2410C":Number(valor)>=7?"#065F46":Number(valor)>=6?"#92400E":"#991B1B",
  });

  return (
    <div>
      <div className="sec-title">📊 Calificaciones</div>
      <div className="sec-sub">Notas por trimestre · editables · con fecha.</div>

      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {[1,2,3].map(t2=><button key={t2} className={`btn ${tri===t2?"btn-primary":"btn-ghost"}`} onClick={()=>setTri(t2)}>{TRI_LBL[t2-1]}</button>)}
      </div>

      {cerrado&&(
        <div style={{background:"#FEF3C7",border:"1.5px solid #FDE68A",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#92400E"}}>
            🔒 TRIMESTRE CERRADO — PROMEDIO FINAL:&nbsp;
            {(materias||[]).map(m=>trI.promedios?.[m.id]&&<span key={m.id} style={{marginRight:8}}>{m.nombre.substring(0,7)}: <strong>{trI.promedios[m.id]}</strong></span>)}
          </div>
          <button className="btn btn-ghost" style={{fontSize:12}} onClick={abrir}>🔓 Reabrir</button>
        </div>
      )}

      <div className="gcals">
        <div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <select className="inp" style={{width:160}} value={ms} onChange={e=>setMs(e.target.value)}>
              <option value="all">Todas</option>
              {(materias||[]).map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            {!cerrado&&<button className="btn btn-primary" onClick={openAdd}>+ Nota</button>}
            {!cerrado&&<button className="btn" style={{background:"#F0FDF4",color:"#166534",border:"1.5px solid #BBF7D0"}} onClick={cerrar}>🔒 Cerrar</button>}
          </div>

          {showAdd&&!cerrado&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:t.text}}>{editId?"Editar":"Nueva"} calificación</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><div className="lbl">Materia</div>
                  <select className="inp" value={form.materiaId} onChange={e=>setForm(f=>({...f,materiaId:e.target.value}))}>
                    <option value="">Seleccioná...</option>
                    {(materias||[]).map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <div className="lbl">Nota</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input
                      className="inp"
                      type="number"
                      min="1" max="10" step="0.01"
                      placeholder="Ej: 8.5"
                      value={form.valor==="PENDIENTE"?"":form.valor}
                      disabled={form.valor==="PENDIENTE"}
                      onChange={e=>setForm(f=>({...f,valor:e.target.value}))}
                      style={{flex:1,opacity:form.valor==="PENDIENTE"?0.4:1}}
                    />
                    <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:t.text2,whiteSpace:"nowrap",cursor:"pointer"}}>
                      <input
                        type="checkbox"
                        checked={form.valor==="PENDIENTE"}
                        onChange={e=>setForm(f=>({...f,valor:e.target.checked?"PENDIENTE":""}))}
                        style={{width:14,height:14}}
                      />
                      Pendiente
                    </label>
                  </div>
                </div>
                <div><div className="lbl">Tipo de evaluación</div>
                  <select className="inp" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                    {TIPOS_EVAL.map(t2=><option key={t2} value={t2}>{t2}</option>)}
                  </select>
                </div>
                <div><div className="lbl">Fecha</div>
                  <input type="date" className="inp" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1/-1"}}><div className="lbl">Descripción</div>
                  <input className="inp" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Ej: Parcial unidad 3"/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button className="btn btn-primary" onClick={guardar}>{editId?"Guardar cambios":"Agregar"}</button>
                <button className="btn btn-ghost" onClick={()=>{setShowAdd(false);setEditId(null);}}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="tscroll">
              <table>
                <thead><tr>
                  <th>Materia</th><th className="hm">Fecha</th>
                  <th className="hm">Tipo</th><th className="hm">Desc.</th>
                  <th>Nota</th>
                  {!cerrado&&<th></th>}
                </tr></thead>
                <tbody>
                  {filt.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:t.text4,padding:"18px 0"}}>Sin calificaciones.</td></tr>}
                  {filt.map(c=>(
                    <tr key={c.id}>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:colMat(c.materiaId),flexShrink:0}}/>
                          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:110,color:t.text2}}>{nomMat(c.materiaId)}</span>
                        </div>
                      </td>
                      <td className="hm" style={{color:t.text3,fontFamily:"'DM Mono',monospace",fontSize:11}}>{c.fecha?fmtFull(c.fecha):"—"}</td>
                      <td className="hm"><span className="chip" style={{background:t.hover,color:t.text2}}>{c.tipo}</span></td>
                      <td className="hm" style={{color:t.text3}}>{c.desc||"—"}</td>
                      <td><span style={notaStyle(c.valor)}>{c.valor}</span></td>
                      {!cerrado&&(
                        <td>
                          <div style={{display:"flex",gap:4}}>
                            <button className="btn btn-ghost" style={{padding:"3px 6px",fontSize:11}} onClick={()=>openEdit(c)}>✏️</button>
                            <button className="btn btn-danger" style={{padding:"3px 6px",fontSize:11}} onClick={()=>upd("calificaciones",calificaciones.filter(x=>x.id!==c.id))}>🗑</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{marginTop:10}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:t.text}}>Promedios — {TRI_LBL[tri-1]}</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {(materias||[]).map(m=>{const v=promedioMat(m.id,tri);return(
                <div key={m.id} style={{background:m.color+"18",border:`1.5px solid ${m.color}44`,borderRadius:9,padding:"6px 10px",textAlign:"center",minWidth:72}}>
                  <div style={{fontSize:9,color:t.text3,marginBottom:1}}>{m.nombre.substring(0,9)}</div>
                  <div style={{fontSize:16,fontWeight:800,color:m.color,fontFamily:"'DM Mono',monospace"}}>{v?v.toFixed(1):"—"}</div>
                </div>
              );})}
            </div>
          </div>
        </div>

        {/* Distribución */}
        <div className="card" style={{height:"fit-content"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:t.text}}>Distribución</div>
          {[10,9,8,7,6,5,4,3,2,1].map(n=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{width:14,textAlign:"right",fontSize:11,fontWeight:700,color:t.text2,fontFamily:"'DM Mono',monospace"}}>{n}</span>
              <div style={{flex:1,height:16,background:t.hover,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${dist[n]/maxD*100}%`,borderRadius:4,background:n>=7?"#10B981":n===6?"#F59E0B":"#EF4444",transition:"width .4s"}}/>
              </div>
              <span style={{width:12,fontSize:10,color:t.text4}}>{dist[n]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AGENDA — con días correctos
// ════════════════════════════════════════════════════════════════════════════
function Agenda({materias,agenda:agendaRaw,calificaciones:calsRaw,diasEspeciales:diasRaw,upd,colMat,nomMat,tema:t}) {
  const agenda         = agendaRaw || [];
  const calificaciones = calsRaw   || [];
  const diasEspeciales = diasRaw   || [];

  const [vista,   setVista]   = useState("lista");
  const [showAdd, setShowAdd] = useState(false);
  const [form,    setForm]    = useState({materiaId:"",fecha:today(),tipo:"Tarea",titulo:"",tipoEval:TIPOS_EVAL[0],estado:"Pendiente"});
  const [mes,     setMes]     = useState(()=>today().substring(0,7));

  const getTri = f => { const m=new Date(f+"T00:00").getMonth()+1; return m<=4?1:m<=8?2:3; };

  const addItem = () => {
    if (!form.materiaId||!form.titulo.trim()||!form.fecha) return;
    const id=uid();
    upd("agenda",[...agenda,{id,...form}]);
    if (form.tipo==="Evaluación"||form.tipo==="TP") {
      upd("calificaciones",[...calificaciones,{id:uid(),materiaId:form.materiaId,trimestre:getTri(form.fecha),valor:"PENDIENTE",tipo:form.tipoEval,desc:form.titulo,fecha:form.fecha,agendaId:id}]);
    }
    setForm({materiaId:"",fecha:today(),tipo:"Tarea",titulo:"",tipoEval:TIPOS_EVAL[0],estado:"Pendiente"});
    setShowAdd(false);
  };

  const updE = (id,estado) => upd("agenda",agenda.map(a=>a.id===id?{...a,estado}:a));
  const del  = id => upd("agenda",agenda.filter(a=>a.id!==id));

  // Calendario
  const mesDate  = new Date(mes+"-01");
  const diasMes  = new Date(mesDate.getFullYear(),mesDate.getMonth()+1,0).getDate();
  // FIX: primer día correcto para Argentina
  const primerDia = diaSemana(mes+"-01");
  const navMes = n => { const d=new Date(mes+"-01"); d.setMonth(d.getMonth()+n); setMes(d.toISOString().substring(0,7)); };

  return (
    <div>
      <div className="sec-title">🗓 Agenda</div>
      <div className="sec-sub">Evaluaciones y tareas. Las evaluaciones se sincronizan con Calificaciones.</div>

      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <button className={`btn ${vista==="lista"?"btn-primary":"btn-ghost"}`} onClick={()=>setVista("lista")}>Lista</button>
        <button className={`btn ${vista==="calendario"?"btn-primary":"btn-ghost"}`} onClick={()=>setVista("calendario")}>Calendario</button>
        <button className="btn btn-primary" style={{marginLeft:"auto"}} onClick={()=>setShowAdd(s=>!s)}>+ Agregar</button>
      </div>

      {showAdd&&(
        <div className="card" style={{marginBottom:12}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:t.text}}>Nueva tarea / evaluación</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div className="lbl">Materia</div>
              <select className="inp" value={form.materiaId} onChange={e=>setForm(f=>({...f,materiaId:e.target.value}))}>
                <option value="">Seleccioná...</option>
                {(materias||[]).map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div><div className="lbl">Fecha</div>
              <input type="date" className="inp" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/>
            </div>
            <div><div className="lbl">Tipo</div>
              <select className="inp" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                <option>Tarea</option><option>TP</option><option>Evaluación</option>
              </select>
            </div>
            {(form.tipo==="Evaluación"||form.tipo==="TP")&&(
              <div><div className="lbl">Tipo de evaluación</div>
                <select className="inp" value={form.tipoEval} onChange={e=>setForm(f=>({...f,tipoEval:e.target.value}))}>
                  {TIPOS_EVAL.map(t2=><option key={t2} value={t2}>{t2}</option>)}
                </select>
              </div>
            )}
            <div style={{gridColumn:"1/-1"}}><div className="lbl">Título</div>
              <input className="inp" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Ej: Parcial cap. 4-6"/>
            </div>
          </div>
          {(form.tipo==="Evaluación"||form.tipo==="TP")&&(
            <div className="info-box" style={{marginTop:8}}>ℹ️ Se creará automáticamente como <strong>PENDIENTE</strong> en Calificaciones.</div>
          )}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button className="btn btn-primary" onClick={addItem}>Guardar</button>
            <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {vista==="lista"&&(
        <div className="card">
          <div className="tscroll">
            <table>
              <thead><tr>
                <th>Fecha</th><th>Materia</th><th>Tipo</th>
                <th className="hm">Descripción</th><th>Estado</th><th/>
              </tr></thead>
              <tbody>
                {agenda.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:t.text4,padding:18}}>Sin items.</td></tr>}
                {[...agenda].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(a=>{
                  const tc=a.tipo==="Evaluación"?{bg:"#FEF2F2",c:"#DC2626"}:a.tipo==="TP"?{bg:"#FFF7ED",c:"#C2410C"}:{bg:"#F0FDF4",c:"#166534"};
                  return (
                    <tr key={a.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,whiteSpace:"nowrap",color:t.text2}}>{fmtFull(a.fecha)}</td>
                      <td>
                        <span style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:colMat(a.materiaId),flexShrink:0}}/>
                          <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:75,color:t.text2}}>{nomMat(a.materiaId)}</span>
                        </span>
                      </td>
                      <td><span className="badge" style={{background:tc.bg,color:tc.c}}>{a.tipo}</span></td>
                      <td className="hm" style={{color:t.text2}}>{a.titulo}</td>
                      <td>
                        <select className="inp" style={{padding:"3px 5px",fontSize:11,width:100}} value={a.estado} onChange={e=>updE(a.id,e.target.value)}>
                          <option>Pendiente</option><option>Entregado</option><option>Evaluado</option>
                        </select>
                      </td>
                      <td><button className="btn btn-danger" style={{padding:"3px 6px",fontSize:11}} onClick={()=>del(a.id)}>🗑</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista==="calendario"&&(
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <button className="btn btn-ghost" style={{padding:"4px 9px"}} onClick={()=>navMes(-1)}>←</button>
            <span style={{flex:1,textAlign:"center",fontWeight:700,fontSize:13,textTransform:"capitalize",color:t.text}}>
              {mesDate.toLocaleDateString("es-AR",{month:"long",year:"numeric"})}
            </span>
            <button className="btn btn-ghost" style={{padding:"4px 9px"}} onClick={()=>navMes(1)}>→</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:t.text4,padding:"3px 0"}}>{d}</div>
            ))}
            {Array(primerDia).fill(null).map((_,i)=><div key={"e"+i}/>)}
            {Array(diasMes).fill(null).map((_,i)=>{
              const dia=i+1;
              const fs=`${mes}-${String(dia).padStart(2,"0")}`;
              const evs=agenda.filter(a=>a.fecha===fs);
              const esp=diasEspeciales.find(d=>d.fecha===fs);
              const isT=fs===today();
              // FIX: detectar fin de semana correctamente
              const dow=diaSemana(fs); // 0=lun,...,5=sab,6=dom
              const esFinDeSemana = dow>=5;
              return (
                <div key={dia} style={{
                  minHeight:44,borderRadius:7,
                  background:esp?"#FEF3C7":isT?t.activeNav:esFinDeSemana?t.hover:t.card,
                  border:isT?`1.5px solid #3B82F6`:`1.5px solid ${t.border}`,
                  padding:2,opacity:esFinDeSemana?0.6:1,
                }}>
                  <div style={{fontSize:10,fontWeight:isT?700:400,color:isT?"#3B82F6":esFinDeSemana?t.text4:t.text,marginBottom:1}}>{dia}</div>
                  {esp&&<div style={{fontSize:8,color:"#92400E",background:"#FDE68A",borderRadius:2,padding:"1px 2px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{esp.desc||esp.tipo}</div>}
                  {evs.slice(0,2).map(ev=>(
                    <div key={ev.id} style={{fontSize:8,color:"#fff",background:colMat(ev.materiaId),borderRadius:2,padding:"1px 2px",marginBottom:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{ev.titulo.substring(0,9)}</div>
                  ))}
                  {evs.length>2&&<div style={{fontSize:8,color:t.text4}}>+{evs.length-2}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ASISTENCIA
// ════════════════════════════════════════════════════════════════════════════
function Asistencia({asistencia:asistenciaRaw,upd,tema:t}) {
  const asistencia = asistenciaRaw || [];
  const [form,setForm]=useState({fecha:today(),tipo:"inasistencia_i",obs:""});
  const inasJ=asistencia.filter(a=>a.tipo==="inasistencia_j").length;
  const inasI=asistencia.filter(a=>a.tipo==="inasistencia_i").length;
  const tard =asistencia.filter(a=>a.tipo==="tardanza").length;
  const total=inasJ+inasI; const pct=((180-total)/180*100).toFixed(1); const alerta=total>=20;
  return (
    <div>
      <div className="sec-title">🏫 Asistencia</div>
      <div className="sec-sub">Inasistencias y tardanzas.</div>
      <div className="gkpi" style={{marginBottom:14}}>
        <KPI label="Asistencia" value={`${pct}%`} color={alerta?"#EF4444":"#10B981"} sub={`${total} inasist.`} big tema={t}/>
        <KPI label="Justificadas" value={inasJ} color="#3B82F6" tema={t}/>
        <KPI label="Injustificadas" value={inasI} color="#EF4444" tema={t}/>
        <KPI label="Tardanzas" value={tard} color="#F59E0B" tema={t}/>
      </div>
      {alerta&&<div style={{background:"#FEE2E2",border:"1.5px solid #FECACA",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#DC2626",fontWeight:600}}>⚠️ ¡Atención! Tenés {total} inasistencias. Te acercás al límite.</div>}
      <div className="gasist">
        <div className="card" style={{height:"fit-content"}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:t.text}}>Registrar</div>
          <div style={{marginBottom:8}}><div className="lbl">Fecha</div><input type="date" className="inp" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/></div>
          <div style={{marginBottom:8}}><div className="lbl">Tipo</div>
            <select className="inp" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              <option value="inasistencia_j">Inasistencia Justificada</option>
              <option value="inasistencia_i">Inasistencia Injustificada</option>
              <option value="tardanza">Tardanza</option>
            </select>
          </div>
          <div style={{marginBottom:12}}><div className="lbl">Observaciones</div><input className="inp" value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Opcional..."/></div>
          <button className="btn btn-primary" style={{width:"100%"}} onClick={()=>{upd([...asistencia,{id:uid(),...form}]);setForm(f=>({...f,obs:""}));}}>Registrar</button>
        </div>
        <div className="card">
          <div className="tscroll">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th className="hm">Obs.</th><th/></tr></thead>
              <tbody>
                {asistencia.length===0&&<tr><td colSpan={4} style={{textAlign:"center",color:t.text4,padding:18}}>Sin registros.</td></tr>}
                {[...asistencia].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(a=>{
                  const cfg=a.tipo==="inasistencia_j"?{l:"Just.",bg:"#EFF6FF",c:"#2563EB"}:a.tipo==="inasistencia_i"?{l:"Injust.",bg:"#FEF2F2",c:"#DC2626"}:{l:"Tardanza",bg:"#FFFBEB",c:"#D97706"};
                  return (
                    <tr key={a.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,whiteSpace:"nowrap",color:t.text2}}>{fmtFull(a.fecha)}</td>
                      <td><span className="badge" style={{background:cfg.bg,color:cfg.c}}>{cfg.l}</span></td>
                      <td className="hm" style={{color:t.text3}}>{a.obs||"—"}</td>
                      <td><button className="btn btn-danger" style={{padding:"3px 6px",fontSize:11}} onClick={()=>upd(asistencia.filter(x=>x.id!==a.id))}>🗑</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROFESORES
// ════════════════════════════════════════════════════════════════════════════
function Profesores({materias,profesores:profesoresRaw,upd,colMat,nomMat,tema:t}) {
  const profesores = profesoresRaw || [];
  const [form,setForm]=useState({materiaId:"",nombre:"",email:"",obs:"",estilo:""});
  const [edit,setEdit]=useState(null);
  const save=()=>{
    if (!form.materiaId||!form.nombre.trim()) return;
    if (edit) upd("profesores",profesores.map(p=>p.id===edit?{...p,...form}:p));
    else upd("profesores",[...profesores,{id:uid(),...form}]);
    setForm({materiaId:"",nombre:"",email:"",obs:"",estilo:""}); setEdit(null);
  };
  return (
    <div>
      <div className="sec-title">👨‍🏫 Profesores</div>
      <div className="sec-sub">Información de tus docentes.</div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:t.text}}>{edit?"Editar":"Agregar"} profesor</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div className="lbl">Materia</div>
            <select className="inp" value={form.materiaId} onChange={e=>setForm(f=>({...f,materiaId:e.target.value}))}>
              <option value="">Seleccioná...</option>
              {(materias||[]).map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div><div className="lbl">Nombre</div><input className="inp" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Prof. García"/></div>
          <div><div className="lbl">Email (opt.)</div><input className="inp" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
          <div><div className="lbl">Estilo de evaluación</div><input className="inp" value={form.estilo} onChange={e=>setForm(f=>({...f,estilo:e.target.value}))} placeholder="Oral, múltiple choice..."/></div>
          <div style={{gridColumn:"1/-1"}}><div className="lbl">Observaciones</div><textarea className="inp" rows={2} value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={{resize:"vertical"}}/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button className="btn btn-primary" onClick={save}>{edit?"Guardar":"Agregar"}</button>
          {edit&&<button className="btn btn-ghost" onClick={()=>{setEdit(null);setForm({materiaId:"",nombre:"",email:"",obs:"",estilo:""});}}>✕</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
        {profesores.map(p=>(
          <div key={p.id} className="card">
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
              <div style={{width:36,height:36,borderRadius:9,background:colMat(p.materiaId)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>👨‍🏫</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:t.text}}>{p.nombre}</div><div style={{fontSize:11,color:t.text3}}>{nomMat(p.materiaId)}</div></div>
              <button className="btn btn-ghost" style={{padding:"3px 6px",fontSize:11}} onClick={()=>{setEdit(p.id);setForm({materiaId:p.materiaId,nombre:p.nombre,email:p.email,obs:p.obs,estilo:p.estilo});}}>✏️</button>
              <button className="btn btn-danger" style={{padding:"3px 6px",fontSize:11}} onClick={()=>upd("profesores",profesores.filter(x=>x.id!==p.id))}>🗑</button>
            </div>
            {p.email&&<div style={{fontSize:11,color:"#3B82F6",marginBottom:3}}>📧 {p.email}</div>}
            {p.estilo&&<div style={{fontSize:11,color:t.text3,marginBottom:3}}>📋 {p.estilo}</div>}
            {p.obs&&<div style={{fontSize:11,color:t.text3,background:t.hover,borderRadius:7,padding:"5px 9px"}}>{p.obs}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HORARIO
// ════════════════════════════════════════════════════════════════════════════
function Horario({materias,horario:horarioRaw,upd,colMat,nomMat,tema:t}) {
  const horario = horarioRaw || [];
  const [form,setForm]=useState({dia:"Lunes",horaInicio:"07:15",horaFin:"07:55",materiaId:"",aula:""});
  const [showAdd,setShowAdd]=useState(false);

  const add=()=>{
    if (!form.materiaId||!form.horaInicio||!form.horaFin) return;
    upd("horario",[...horario,{id:uid(),...form}]);
    setShowAdd(false);
  };

  const todayN = DIAS[new Date().getDay()-1]||null;

  // Agrupar bloques por día, ordenados por hora inicio
  const bloquesPorDia = (dia) =>
    [...horario.filter(h=>h.dia===dia)].sort((a,b)=>a.horaInicio?.localeCompare(b.horaInicio));

  return (
    <div>
      <div className="sec-title">📅 Horario Semanal</div>
      <div className="sec-sub">Agregá bloques con hora de inicio y fin personalizados.</div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button className="btn btn-primary" onClick={()=>setShowAdd(s=>!s)}>+ Bloque</button>
        <button className="btn btn-ghost" onClick={()=>window.print()}>🖨️ Imprimir</button>
      </div>

      {showAdd&&(
        <div className="card" style={{marginBottom:12}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:t.text}}>Nuevo bloque</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div className="lbl">Día</div>
              <select className="inp" value={form.dia} onChange={e=>setForm(f=>({...f,dia:e.target.value}))}>
                {DIAS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><div className="lbl">Materia</div>
              <select className="inp" value={form.materiaId} onChange={e=>setForm(f=>({...f,materiaId:e.target.value}))}>
                <option value="">Seleccioná...</option>
                {(materias||[]).map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div><div className="lbl">Hora inicio</div>
              <input type="time" className="inp" value={form.horaInicio} onChange={e=>setForm(f=>({...f,horaInicio:e.target.value}))}/>
            </div>
            <div><div className="lbl">Hora fin</div>
              <input type="time" className="inp" value={form.horaFin} onChange={e=>setForm(f=>({...f,horaFin:e.target.value}))}/>
            </div>
            <div><div className="lbl">Aula (opt.)</div>
              <input className="inp" value={form.aula} onChange={e=>setForm(f=>({...f,aula:e.target.value}))} placeholder="Ej: A1"/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button className="btn btn-primary" onClick={add}>Agregar</button>
            <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Vista por día */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
        {DIAS.map(dia=>{
          const bloques=bloquesPorDia(dia);
          const esHoy=dia===todayN;
          return (
            <div key={dia} className="card" style={{
              border:esHoy?`2px solid #3B82F6`:`1.5px solid ${t.border}`,
              padding:12,
            }}>
              <div style={{fontWeight:700,fontSize:12,color:esHoy?"#3B82F6":t.text,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {dia}
                {esHoy&&<span style={{fontSize:9,background:"#3B82F6",color:"#fff",padding:"1px 6px",borderRadius:99}}>HOY</span>}
              </div>
              {bloques.length===0&&(
                <div style={{fontSize:11,color:t.text4,textAlign:"center",padding:"10px 0"}}>Sin clases</div>
              )}
              {bloques.map(b=>(
                <div key={b.id} style={{
                  background:colMat(b.materiaId)+"22",
                  border:`1.5px solid ${colMat(b.materiaId)}55`,
                  borderRadius:8,padding:"6px 8px",marginBottom:6,position:"relative",
                }}>
                  <div style={{fontSize:10,fontWeight:700,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nomMat(b.materiaId)}</div>
                  <div style={{fontSize:9,color:t.text3,fontFamily:"'DM Mono',monospace",marginTop:2}}>
                    {b.horaInicio} – {b.horaFin}
                  </div>
                  {b.aula&&<div style={{fontSize:9,color:t.text4}}>Aula {b.aula}</div>}
                  <button onClick={()=>upd("horario",horario.filter(h=>h.id!==b.id))}
                    style={{position:"absolute",top:3,right:4,background:"none",border:"none",fontSize:11,color:t.text4,cursor:"pointer",padding:"1px 3px"}}>×</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      {horario.length>0&&(
        <div className="card" style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:8}}>
          {(materias||[]).filter(m=>horario.some(h=>h.materiaId===m.id)).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:t.text2}}>
              <div style={{width:9,height:9,borderRadius:2,background:m.color}}/>{m.nombre}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ════════════════════════════════════════════════════════════════════════════
function Estadisticas({materias,promedioMat,tema:t}) {
  const allP=( materias||[]).map(m=>({m,v:promedioMat(m.id)})).filter(x=>x.v!==null).sort((a,b)=>b.v-a.v);
  const pred=matId=>{
    const vs=[1,2,3].map(t2=>promedioMat(matId,t2)).filter(v=>v!==null);
    if (vs.length<2) return null;
    const tr=vs[vs.length-1]-vs[0];
    return Math.min(10,Math.max(1,vs[vs.length-1]+tr*0.5)).toFixed(1);
  };
  return (
    <div>
      <div className="sec-title">📈 Estadísticas</div>
      <div className="sec-sub">Rendimiento, comparaciones y predicciones.</div>
      <div className="g2" style={{marginBottom:14}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:t.text}}>🏆 Ranking de Materias</div>
          {allP.length===0&&<div style={{color:t.text4,fontSize:13}}>Sin datos.</div>}
          {allP.map((x,i)=>(
            <div key={x.m.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
              <span style={{width:19,height:19,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,
                background:i===0?"#FEF3C7":i===1?"#F1F5F9":i===2?"#FEF2F2":t.hover,
                color:i===0?"#D97706":t.text3}}>{i+1}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:12,fontWeight:500,color:t.text2}}>{x.m.nombre}</span>
                  <span style={{fontSize:12,fontWeight:800,fontFamily:"'DM Mono',monospace",color:x.m.color}}>{x.v.toFixed(2)}</span>
                </div>
                <div style={{height:4,background:t.hover,borderRadius:99}}><div style={{width:`${x.v/10*100}%`,height:"100%",borderRadius:99,background:x.m.color}}/></div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:t.text}}>📊 Comparación Trimestral</div>
          <div className="tscroll">
            <table>
              <thead><tr>
                <th>Materia</th><th style={{textAlign:"center"}}>1°T</th>
                <th style={{textAlign:"center"}}>2°T</th><th style={{textAlign:"center"}}>3°T</th>
                <th style={{textAlign:"center"}}>Pred.</th>
              </tr></thead>
              <tbody>
                {(materias||[]).map(m=>{
                  const vs=[1,2,3].map(t2=>promedioMat(m.id,t2)); const p=pred(m.id);
                  return (
                    <tr key={m.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:m.color,flexShrink:0}}/>
                        <span style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80,color:t.text2}}>{m.nombre}</span>
                      </div></td>
                      {vs.map((v,i)=>(
                        <td key={i} style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,
                          color:v?(v>=7?"#059669":v>=6?"#D97706":"#DC2626"):t.text4}}>
                          {v?v.toFixed(1):"—"}
                        </td>
                      ))}
                      <td style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:12,color:p?"#8B5CF6":t.text4,fontWeight:700}}>
                        {p?`~${p}`:"—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:6,fontSize:10,color:t.text4}}>* (~) Predicción basada en tendencia trimestral.</div>
        </div>
      </div>
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:t.text}}>📈 Evolución por Materia</div>
        <div style={{overflowX:"auto"}}>
          <svg width="100%" height="190" viewBox="0 0 540 175" preserveAspectRatio="xMidYMid meet" style={{minWidth:280}}>
            {[2,4,6,8,10].map(v=>(
              <g key={v}>
                <line x1={34} y1={175-v*15} x2={520} y2={175-v*15} stroke={t.border} strokeWidth={1}/>
                <text x={26} y={175-v*15+4} textAnchor="end" fontSize={8} fill={t.text4}>{v}</text>
              </g>
            ))}
            {[1,2,3].map(t2=>(
              <text key={t2} x={34+(t2-1)*243} y={188} fontSize={8} fill={t.text4} textAnchor="middle">{TRI_LBL[t2-1]}</text>
            ))}
            {(materias||[]).slice(0,6).map(m=>{
              const pts=[1,2,3].map((t2,i)=>{const v=promedioMat(m.id,t2);return v?{x:34+i*243,y:175-v*15}:null;}).filter(Boolean);
              if (pts.length<2) return null;
              const d=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
              return (
                <g key={m.id}>
                  <path d={d} fill="none" stroke={m.color} strokeWidth={2} strokeLinecap="round"/>
                  {pts.map((p,i)=>(
                    <circle key={i} cx={p.x} cy={p.y} r={4} fill={m.color} stroke={t.card} strokeWidth={1.5}>
                      <title>{m.nombre}: {promedioMat(m.id,i+1)?.toFixed(1)}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
            {(materias||[]).slice(0,6).map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:t.text3}}>
                <div style={{width:12,height:2,background:m.color,borderRadius:99}}/>{m.nombre}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════
function Configuracion({config:configRaw,trimestres:triRaw,diasEspeciales:diasRaw,upd,setData,save,user,tema:t}) {
  const config         = configRaw || INIT.config;
  const trimestres     = triRaw    || INIT.trimestres;
  const diasEspeciales = diasRaw   || [];

  const [formC,setFormC]=useState(config);
  const [formT,setFormT]=useState(trimestres);
  const [formD,setFormD]=useState({fecha:today(),tipo:"feriado",desc:""});

  const saveC=()=>upd("config",{...formC,darkMode:config.darkMode});
  const saveT=()=>upd("trimestres",formT);
  const addD=()=>{
    if (!formD.fecha) return;
    upd("diasEspeciales",[...diasEspeciales,{id:uid(),...formD}]);
    setFormD(f=>({...f,desc:""}));
  };
  const reset=()=>{
    if (!window.confirm("¿Resetear TODOS los datos?")) return;
    const nd={...INIT,config:{...INIT.config,alumno:user.displayName||"Estudiante"}};
    setData(nd); save(nd);
  };

  return (
    <div>
      <div className="sec-title">⚙️ Configuración</div>
      <div className="sec-sub">Datos personales y calendario escolar.</div>
      <div className="g2" style={{marginBottom:14}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:t.text}}>👤 Datos Personales</div>
          <div style={{marginBottom:8}}><div className="lbl">Nombre</div><input className="inp" value={formC.alumno} onChange={e=>setFormC(f=>({...f,alumno:e.target.value}))}/></div>
          <div style={{marginBottom:8}}><div className="lbl">Institución</div><input className="inp" value={formC.nombre} onChange={e=>setFormC(f=>({...f,nombre:e.target.value}))}/></div>
          <div style={{marginBottom:8}}><div className="lbl">Año lectivo</div><input className="inp" value={formC.anio} onChange={e=>setFormC(f=>({...f,anio:e.target.value}))}/></div>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12,cursor:"pointer"}} onClick={()=>setFormC(f=>({...f,motivacion:!f.motivacion}))}>
            <input type="checkbox" checked={formC.motivacion} readOnly style={{width:14,height:14}}/>
            <span style={{fontSize:13,color:t.text2}}>Mostrar frase motivacional</span>
          </div>
          <button className="btn btn-primary" onClick={saveC}>Guardar</button>
          <div style={{marginTop:14,paddingTop:12,borderTop:`1.5px solid ${t.border}`,display:"flex",alignItems:"center",gap:9}}>
            <img src={user.photoURL} alt="" style={{width:30,height:30,borderRadius:"50%"}}/>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:t.text}}>{user.displayName}</div>
              <div style={{fontSize:10,color:t.text4}}>{user.email}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:t.text}}>📆 Fechas de Trimestres</div>
          {[0,1,2].map(i=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{fontWeight:600,fontSize:12,color:t.text2,marginBottom:4}}>{TRI_LBL[i]}</div>
              <div className="rw">
                <div style={{flex:1}}><div className="lbl">Inicio</div>
                  <input type="date" className="inp" value={formT[i].inicio} onChange={e=>setFormT(t2=>t2.map((x,j)=>j===i?{...x,inicio:e.target.value}:x))}/>
                </div>
                <div style={{flex:1}}><div className="lbl">Fin</div>
                  <input type="date" className="inp" value={formT[i].fin} onChange={e=>setFormT(t2=>t2.map((x,j)=>j===i?{...x,fin:e.target.value}:x))}/>
                </div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" onClick={saveT}>Guardar fechas</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:t.text}}>🗓 Feriados, Vacaciones y Festivos</div>
        <div className="rw" style={{marginBottom:10}}>
          <div><div className="lbl">Fecha</div><input type="date" className="inp" value={formD.fecha} onChange={e=>setFormD(f=>({...f,fecha:e.target.value}))}/></div>
          <div><div className="lbl">Tipo</div>
            <select className="inp" value={formD.tipo} onChange={e=>setFormD(f=>({...f,tipo:e.target.value}))}>
              <option value="feriado">Feriado Nacional</option>
              <option value="festivo">Día Festivo</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
          <div style={{flex:1}}><div className="lbl">Descripción</div>
            <input className="inp" value={formD.desc} onChange={e=>setFormD(f=>({...f,desc:e.target.value}))} placeholder="Ej: Día del Maestro"/>
          </div>
          <button className="btn btn-primary" onClick={addD}>Agregar</button>
        </div>
        {diasEspeciales.length>0&&(
          <div className="tscroll">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th/></tr></thead>
              <tbody>
                {[...diasEspeciales].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(d=>{
                  const cfg=d.tipo==="feriado"?{bg:"#FEF3C7",c:"#92400E",l:"Feriado"}
                    :d.tipo==="vacaciones"?{bg:"#EFF6FF",c:"#1D4ED8",l:"Vacaciones"}
                    :{bg:"#F0FDF4",c:"#166534",l:"Festivo"};
                  return (
                    <tr key={d.id}>
                      <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,whiteSpace:"nowrap",color:t.text2}}>{fmtFull(d.fecha)}</td>
                      <td><span className="badge" style={{background:cfg.bg,color:cfg.c}}>{cfg.l}</span></td>
                      <td style={{color:t.text2}}>{d.desc||"—"}</td>
                      <td><button className="btn btn-danger" style={{padding:"3px 6px",fontSize:11}} onClick={()=>upd("diasEspeciales",diasEspeciales.filter(x=>x.id!==d.id))}>🗑</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{border:"1.5px solid #FEE2E2"}}>
        <div style={{fontWeight:700,fontSize:14,color:"#DC2626",marginBottom:5}}>⚠️ Zona de Peligro</div>
        <div style={{fontSize:13,color:t.text3,marginBottom:10}}>Elimina todos tus datos permanentemente.</div>
        <button className="btn btn-danger" onClick={reset}>🗑 Resetear todos los datos</button>
      </div>
    </div>
  );
}
