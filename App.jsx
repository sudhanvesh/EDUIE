import { useState, useEffect, useRef, useCallback } from "react";

/* ── FONTS ───────────────────────────────────────────────────────────── */
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Share+Tech+Mono&display=swap";
document.head.appendChild(link);

/* ── GLOBAL CSS ──────────────────────────────────────────────────────── */
const css = `
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --void:    #01020a;
    --deep:    #050818;
    --panel:   rgba(5,15,40,0.88);
    --border:  rgba(0,200,255,0.15);
    --border2: rgba(0,200,255,0.4);
    --cyan:    #00c8ff;
    --magenta: #ff2d78;
    --green:   #00ffb3;
    --yellow:  #ffe500;
    --text:    #c8e8ff;
    --muted:   #3a5a7a;
    --hud:     'Orbitron', sans-serif;
    --body:    'Exo 2', sans-serif;
    --mono:    'Share Tech Mono', monospace;
  }
  html,body,#root { height:100%; overflow:hidden; }
  body { background:var(--void); color:var(--text); font-family:'Exo 2',sans-serif; cursor:crosshair; }
  #root { display:flex; flex-direction:column; }

  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:rgba(0,200,255,.3); border-radius:2px; }

  #starfield { position:fixed; inset:0; z-index:0; pointer-events:none; }

  body::after {
    content:''; position:fixed; inset:0; z-index:1; pointer-events:none;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px);
  }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes glow    { 0%,100%{text-shadow:0 0 8px var(--cyan),0 0 20px var(--cyan)} 50%{text-shadow:0 0 20px var(--cyan),0 0 50px rgba(0,200,255,.4)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes spin    { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes blink   { 0%,80%,100%{opacity:.3;transform:scale(1)} 40%{opacity:1;transform:scale(1.4)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes warpIn  { from{opacity:0;transform:scale(1.06)} to{opacity:1;transform:scale(1)} }
  @keyframes scanH   { from{top:0} to{top:100%} }

  .hud-box {
    position:relative;
    background:var(--panel);
    border:1px solid var(--border);
    backdrop-filter:blur(18px);
  }
  .hud-box::before,.hud-box::after {
    content:''; position:absolute; width:10px; height:10px;
    border-color:var(--cyan); border-style:solid;
  }
  .hud-box::before { top:-1px; left:-1px; border-width:2px 0 0 2px; }
  .hud-box::after  { bottom:-1px; right:-1px; border-width:0 2px 2px 0; }

  .neo-btn {
    font-family:'Orbitron',sans-serif; font-size:10px; letter-spacing:.1em;
    text-transform:uppercase; border:1px solid var(--cyan); color:var(--cyan);
    background:rgba(0,200,255,.06); border-radius:3px; cursor:pointer;
    padding:8px 18px; transition:all .2s;
  }
  .neo-btn:hover { background:rgba(0,200,255,.18); box-shadow:0 0 14px rgba(0,200,255,.4); }
  .neo-btn:active { transform:scale(.96); }
  .neo-btn:disabled { opacity:.35; cursor:not-allowed; }
  .neo-btn.mg { border-color:var(--magenta); color:var(--magenta); background:rgba(255,45,120,.06); }
  .neo-btn.mg:hover { background:rgba(255,45,120,.18); box-shadow:0 0 14px rgba(255,45,120,.4); }
  .neo-btn.gn { border-color:var(--green); color:var(--green); background:rgba(0,255,179,.06); }
  .neo-btn.gn:hover { background:rgba(0,255,179,.18); box-shadow:0 0 14px rgba(0,255,179,.4); }
  .neo-btn.full { width:100%; text-align:center; }

  .neo-input {
    width:100%; background:rgba(0,200,255,.04); border:1px solid var(--border);
    border-radius:3px; color:var(--text); font-family:'Exo 2',sans-serif;
    font-size:14px; padding:11px 16px; outline:none; transition:border-color .2s,box-shadow .2s;
  }
  .neo-input:focus { border-color:var(--cyan); box-shadow:0 0 0 2px rgba(0,200,255,.1),0 0 12px rgba(0,200,255,.2); }
  .neo-input::placeholder { color:var(--muted); }

  .tdot { width:5px;height:5px;border-radius:50%;background:var(--cyan);display:inline-block;animation:blink 1.3s infinite; }
  .tdot:nth-child(2){animation-delay:.2s} .tdot:nth-child(3){animation-delay:.4s}
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

/* ── STARFIELD ───────────────────────────────────────────────────────── */
function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let W, H, raf;
    const stars = Array.from({length:300},()=>({x:Math.random(),y:Math.random(),r:.2+Math.random()*1.3,s:.3+Math.random()*.7,f:Math.random()*Math.PI*2}));
    const nebulas = Array.from({length:6},()=>({x:Math.random(),y:Math.random(),r:180+Math.random()*280,h:Math.random()*260,a:.02+Math.random()*.035}));
    const resize = () => { W=c.width=innerWidth; H=c.height=innerHeight; };
    resize(); window.addEventListener("resize",resize);
    let t=0;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      nebulas.forEach(n=>{
        const g=ctx.createRadialGradient(n.x*W,n.y*H,0,n.x*W,n.y*H,n.r);
        g.addColorStop(0,`hsla(${n.h},85%,55%,${n.a})`); g.addColorStop(1,"transparent");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x*W,n.y*H,n.r,0,Math.PI*2); ctx.fill();
      });
      stars.forEach(s=>{
        ctx.globalAlpha=s.s*(0.5+0.5*Math.sin(t+s.f));
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1; t+=0.015;
      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas id="starfield" ref={ref}/>;
}

/* ── AI ──────────────────────────────────────────────────────────────── */
const SYS = `You are EDUIE, an advanced AI study intelligence aboard a space learning station. Help students master any subject with clear explanations, analogies, and structure. Use ## for section headers, ✦ for bullet points. Keep a slightly futuristic, encouraging tone. Be concise yet thorough.`;

async function ai(messages) {
  const lastMessage = messages[messages.length - 1].content;

  const r = await fetch("http://localhost:5000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: lastMessage, subject: "General" }),
  });

  if (!r.ok) throw new Error(r.status);
  const data = await r.json();
  return data.reply;
}

function esc(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function md(raw){
  return esc(raw)
    .replace(/```([\s\S]+?)```/g,'<pre style="background:rgba(0,0,0,.6);border:1px solid rgba(0,200,255,.2);border-radius:4px;padding:12px;margin:8px 0;font-family:\'Share Tech Mono\',monospace;font-size:12px;line-height:1.7;color:#00ffb3;overflow-x:auto;">$1</pre>')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(0,200,255,.1);padding:1px 6px;border-radius:3px;font-family:\'Share Tech Mono\',monospace;font-size:12px;color:var(--cyan);">$1</code>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:#fff;">$1</strong>')
    .replace(/^## (.+)$/gm,'<div style="font-family:\'Orbitron\',sans-serif;font-size:12px;font-weight:700;color:var(--cyan);margin:14px 0 6px;letter-spacing:.08em;text-shadow:0 0 8px var(--cyan);">◈ $1</div>')
    .replace(/^✦ (.+)$/gm,'<div style="display:flex;gap:8px;margin:3px 0;"><span style="color:var(--cyan);flex-shrink:0;">✦</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm,'<div style="display:flex;gap:8px;margin:3px 0;"><span style="color:var(--cyan);flex-shrink:0;">›</span><span>$1</span></div>')
    .replace(/\n/g,"<br>");
}

/* ── TOAST ───────────────────────────────────────────────────────────── */
function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[onDone]);
  return <div className="hud-box" style={{position:"fixed",bottom:28,right:28,zIndex:9999,padding:"10px 20px",fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"var(--cyan)",animation:"slideIn .3s ease both",boxShadow:"0 0 20px rgba(0,200,255,.25)"}}>◈ {msg}</div>;
}

/* ── LOGIN ───────────────────────────────────────────────────────────── */
function Login({onLogin}){
  const [name,setName]=useState("");
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:400,textAlign:"center",animation:"warpIn .6s cubic-bezier(.22,1,.36,1) both"}}>
        {/* Orbital rig */}
        <div style={{position:"relative",width:170,height:170,margin:"0 auto 28px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(0,200,255,.18)"}}/>
          <div style={{position:"absolute",inset:16,borderRadius:"50%",border:"1px dashed rgba(0,200,255,.1)"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:64,height:64,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,200,255,.25),rgba(0,200,255,.04))",boxShadow:"0 0 32px rgba(0,200,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🎓</div>
          {/* Orbiting dot */}
          <div style={{position:"absolute",top:"50%",left:"50%",width:130,height:130,marginLeft:-65,marginTop:-65,borderRadius:"50%",animation:"spin 6s linear infinite"}}>
            <div style={{position:"absolute",top:-4,left:"50%",marginLeft:-4,width:8,height:8,borderRadius:"50%",background:"var(--cyan)",boxShadow:"0 0 10px var(--cyan)"}}/>
          </div>
          <div style={{position:"absolute",top:"50%",left:"50%",width:100,height:100,marginLeft:-50,marginTop:-50,borderRadius:"50%",animation:"spin 10s linear infinite reverse"}}>
            <div style={{position:"absolute",top:-3,left:"50%",marginLeft:-3,width:6,height:6,borderRadius:"50%",background:"var(--magenta)",boxShadow:"0 0 8px var(--magenta)"}}/>
          </div>
        </div>

        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:38,fontWeight:900,letterSpacing:".18em",color:"var(--cyan)",animation:"glow 3s ease-in-out infinite",marginBottom:4}}>EDUIE</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--muted)",letterSpacing:".22em",marginBottom:38}}>// STELLAR LEARNING INTELLIGENCE //</div>

        <div className="hud-box" style={{borderRadius:8,padding:32,textAlign:"left"}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--cyan)",letterSpacing:".15em",marginBottom:14}}>► INITIALIZE PILOT PROFILE</div>
          <input className="neo-input" placeholder="Enter your callsign…" value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&name.trim()&&onLogin(name.trim())}
            style={{marginBottom:12}}
          />
          <button className="neo-btn full" onClick={()=>name.trim()&&onLogin(name.trim())} style={{marginBottom:10}}>LAUNCH MISSION →</button>
          <button className="neo-btn full mg" onClick={()=>onLogin("PILOT")}>GUEST ACCESS</button>
        </div>
        <div style={{marginTop:14,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)"}}>[ EDUIE STATION v3.0 — SECTOR 7 ONLINE ]</div>
      </div>
    </div>
  );
}

/* ── CHAT ────────────────────────────────────────────────────────────── */
const PROMPTS=[
  {icon:"🌌",label:"Dark matter explained",p:"Explain dark matter and dark energy in a clear, beginner-friendly way"},
  {icon:"🧬",label:"How DNA replicates",p:"Explain DNA replication step by step with a simple analogy"},
  {icon:"⚛️",label:"Quantum physics intro",p:"Give me a structured introduction to quantum physics for beginners"},
  {icon:"🚀",label:"30-day Python plan",p:"Create a structured 30-day study plan to learn Python programming from scratch"},
];

function Chat({user,toast}){
  const [msgs,setMsgs]=useState([]);
  const [inp,setInp]=useState("");
  const [busy,setBusy]=useState(false);
  const boxRef=useRef(null); const taRef=useRef(null);
  useEffect(()=>{if(boxRef.current)boxRef.current.scrollTop=boxRef.current.scrollHeight;},[msgs,busy]);
  const resize=()=>{const t=taRef.current;if(!t)return;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,160)+"px";};
  const send=useCallback(async(txt)=>{
    if(!txt.trim()||busy)return;
    const m={role:"user",content:txt.trim()};
    setMsgs(p=>[...p,m]); setInp(""); if(taRef.current)taRef.current.style.height="auto"; setBusy(true);
    try{ const r=await ai([...msgs,m]); setMsgs(p=>[...p,{role:"assistant",content:r}]); }
    catch{ setMsgs(p=>[...p,{role:"assistant",content:"⚠ SIGNAL LOST — check your API key and retry."}]); }
    setBusy(false);
  },[busy,msgs]);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,position:"relative",zIndex:2}}>
      <div ref={boxRef} style={{flex:1,overflowY:"auto",padding:"28px 36px",display:"flex",flexDirection:"column",gap:20,position:"relative"}}>
        {msgs.length===0&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"40px 80px",animation:"fadeUp .5s ease both"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,color:"var(--cyan)",letterSpacing:".28em",marginBottom:14,animation:"pulse 2s infinite"}}>◈ AWAITING TRANSMISSION ◈</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:30,fontWeight:700,color:"#fff",marginBottom:6}}>What shall we explore,</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:34,fontWeight:900,color:"var(--cyan)",textShadow:"0 0 28px var(--cyan),0 0 60px rgba(0,200,255,.3)",marginBottom:56}}>{user.toUpperCase()}?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,maxWidth:960,width:"100%"}}>
              {PROMPTS.map(p=>(
                <div key={p.label} onClick={()=>send(p.p)} className="hud-box" style={{padding:26,borderRadius:8,cursor:"pointer",transition:"all .25s",textAlign:"left"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--cyan)";e.currentTarget.style.boxShadow="0 0 24px rgba(0,200,255,.3)";e.currentTarget.style.transform="translateY(-4px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}
                >
                  <div style={{fontSize:30,marginBottom:14}}>{p.icon}</div>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,color:"var(--cyan)",letterSpacing:".06em",lineHeight:1.6}}>{p.label}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:44,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--muted)",letterSpacing:".1em"}}>── select a mission above or transmit your own query ──</div>
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:6,animation:"slideIn .3s ease both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:22,height:22,borderRadius:3,background:m.role==="user"?"rgba(255,45,120,.15)":"rgba(0,200,255,.12)",border:`1px solid ${m.role==="user"?"var(--magenta)":"var(--cyan)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"'Orbitron',sans-serif",color:m.role==="user"?"var(--magenta)":"var(--cyan)"}}>
                {m.role==="user"?"▲":"◈"}
              </div>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)"}}>{m.role==="user"?user.toUpperCase():"EDUIE.AI"}</span>
            </div>
            <div className="hud-box" style={{
              maxWidth:"72%",padding:"13px 18px",borderRadius:8,fontSize:14,lineHeight:1.75,
              ...(m.role==="user"
                ?{borderColor:"rgba(255,45,120,.3)",background:"rgba(255,45,120,.06)",borderBottomRightRadius:2}
                :{borderColor:"rgba(0,200,255,.2)",background:"rgba(0,200,255,.04)",borderBottomLeftRadius:2}),
            }} {...(m.role==="assistant"?{dangerouslySetInnerHTML:{__html:md(m.content)}}:{})}>
              {m.role==="user"?m.content:null}
            </div>
          </div>
        ))}
        {busy&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,animation:"fadeIn .3s ease both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:22,height:22,borderRadius:3,background:"rgba(0,200,255,.12)",border:"1px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"'Orbitron',sans-serif",color:"var(--cyan)"}}>◈</div>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)"}}>EDUIE.AI</span>
            </div>
            <div className="hud-box" style={{padding:"14px 20px",borderRadius:8,borderColor:"rgba(0,200,255,.2)",display:"flex",gap:5,alignItems:"center"}}>
              <div className="tdot"/><div className="tdot"/><div className="tdot"/>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{padding:"14px 36px 24px",borderTop:"1px solid var(--border)",background:"rgba(1,2,10,.96)",flexShrink:0,zIndex:2}}>
        <div className="hud-box" style={{borderRadius:8,padding:"6px 6px 6px 16px",display:"flex",alignItems:"flex-end",gap:8}}
          onFocusCapture={e=>{e.currentTarget.style.borderColor="var(--cyan)";e.currentTarget.style.boxShadow="0 0 14px rgba(0,200,255,.15)";}}
          onBlurCapture={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none";}}
        >
          <textarea ref={taRef} value={inp} onChange={e=>{setInp(e.target.value);resize();}}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(inp);}}}
            placeholder="Transmit your query… (Shift+Enter for new line)"
            rows={1} style={{flex:1,background:"transparent",border:"none",outline:"none",color:"var(--text)",fontFamily:"'Exo 2',sans-serif",fontSize:14,lineHeight:1.6,resize:"none",minHeight:24,maxHeight:160,overflowY:"auto",padding:"8px 0"}}
          />
          <div style={{display:"flex",gap:6,paddingBottom:2}}>
            {msgs.length>0&&<button className="neo-btn" style={{padding:"6px 10px",fontSize:9}} onClick={()=>setMsgs([])}>CLR</button>}
            <button className="neo-btn" style={{padding:"8px 16px",opacity: busy || !inp.trim() ? 0.4 : 1}} onClick={()=>send(inp)} disabled={busy||!inp.trim()}>TX →</button>
          </div>
        </div>
        <div style={{display:"flex",marginTop:8,alignItems:"center",gap:8}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"var(--green)",animation:"pulse 1.5s infinite",boxShadow:"0 0 6px var(--green)"}}/>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)"}}>EDUIE SIGNAL ACTIVE</span>
          <span style={{marginLeft:"auto",fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)"}}>{inp.length}/2000</span>
        </div>
      </div>
    </div>
  );
}

/* ── QUIZ ────────────────────────────────────────────────────────────── */
const FQ=[
  {q:"What force keeps planets in orbit?",opts:["Magnetism","Gravity","Dark Energy","Nuclear Force"],ans:1},
  {q:"Speed of light in a vacuum?",opts:["300,000 km/s","150,000 km/s","450,000 km/s","1,000,000 km/s"],ans:0},
  {q:"What is the powerhouse of the cell?",opts:["Nucleus","Ribosome","Mitochondria","Golgi Body"],ans:2},
  {q:"How many bits in one byte?",opts:["4","16","2","8"],ans:3},
  {q:"Who formulated general relativity?",opts:["Newton","Hawking","Einstein","Tesla"],ans:2},
];

function Quiz({toast}){
  const [quiz,setQuiz]=useState(FQ);
  const [idx,setIdx]=useState(0);
  const [chosen,setChosen]=useState(null);
  const [score,setScore]=useState(0);
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);

  const gen=async()=>{
    setLoading(true); toast("◈ GENERATING QUIZ TRANSMISSION…");
    try{
      const t=await ai([{role:"user",content:`Generate 5 multiple-choice quiz questions covering mixed topics (science, space, history, math, tech). Return ONLY a JSON array, no markdown:\n[{"q":"...","opts":["A","B","C","D"],"ans":0}]`}]);
      const p=JSON.parse(t.replace(/```json|```/g,"").trim());
      if(Array.isArray(p)&&p.length){setQuiz(p);toast("◈ NEW INTEL LOADED");}
    }catch{toast("⚠ SIGNAL ERROR — using default quiz");}
    setIdx(0);setChosen(null);setScore(0);setDone(false);setLoading(false);
  };

  const pick=(i)=>{if(chosen!==null)return;setChosen(i);if(i===quiz[idx].ans)setScore(s=>s+1);};
  const next=()=>{if(idx<quiz.length-1){setIdx(i=>i+1);setChosen(null);}else setDone(true);};
  const pct=Math.round((idx+(chosen!==null?1:0))/quiz.length*100);
  const KEYS=["A","B","C","D"];
  const q=quiz[idx];

  return (
    <div style={{flex:1,overflowY:"auto",padding:"32px 36px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:2}}>
      <div style={{maxWidth:580,width:"100%",animation:"warpIn .5s ease both"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".25em",color:"var(--cyan)",marginBottom:6,animation:"pulse 2s infinite"}}>◈ KNOWLEDGE ASSESSMENT MODULE ◈</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:24,fontWeight:900,color:"#fff",marginBottom:20}}>MISSION QUIZ</div>
          <div style={{height:3,background:"rgba(0,200,255,.1)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,var(--cyan),var(--magenta))",transition:"width .4s ease",boxShadow:"0 0 8px var(--cyan)"}}/>
          </div>
        </div>

        {done?(
          <div className="hud-box" style={{borderRadius:12,padding:40,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16}}>🏆</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:"var(--cyan)",letterSpacing:".1em",marginBottom:8}}>MISSION COMPLETE</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,marginBottom:6}}>
              Score: <span style={{color:"var(--cyan)",fontWeight:700}}>{score}</span> / {quiz.length}
            </div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:score>=quiz.length*.7?"var(--green)":"var(--yellow)",marginBottom:28}}>
              {score===quiz.length?"► PERFECT SCORE — LEGENDARY":score>=quiz.length*.7?"► MISSION SUCCESS":"► RECALIBRATE AND RETRY"}
            </div>
            <button className="neo-btn" onClick={gen} disabled={loading}>{loading?"LOADING…":"LAUNCH NEW MISSION →"}</button>
          </div>
        ):(
          <div className="hud-box" style={{borderRadius:12,padding:32,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,var(--cyan),transparent)",opacity:.5}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--cyan)"}}>[Q.{String(idx+1).padStart(2,"0")} / {quiz.length}]</span>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--muted)"}}>SCORE: {score}</span>
            </div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:600,lineHeight:1.6,marginBottom:28,color:"#fff"}}>{q.q}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {q.opts.map((opt,i)=>{
                let bc="var(--border)",bg="rgba(0,200,255,.02)",col="var(--text)";
                if(chosen!==null){
                  if(i===q.ans){bc="var(--green)";bg="rgba(0,255,179,.08)";col="var(--green)";}
                  else if(i===chosen&&chosen!==q.ans){bc="var(--magenta)";bg="rgba(255,45,120,.08)";col="var(--magenta)";}
                }
                return(
                  <div key={i} onClick={()=>pick(i)} style={{
                    padding:"12px 18px",border:`1px solid ${bc}`,borderRadius:5,background:bg,
                    color:col,fontSize:14,cursor:chosen===null?"pointer":"default",
                    display:"flex",alignItems:"center",gap:14,transition:"all .18s",
                  }}
                  onMouseEnter={e=>chosen===null&&(e.currentTarget.style.borderColor="var(--cyan)")}
                  onMouseLeave={e=>chosen===null&&(e.currentTarget.style.borderColor="var(--border)")}
                  >
                    <div style={{width:26,height:26,borderRadius:3,border:`1px solid ${bc}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Orbitron',sans-serif",fontSize:9,fontWeight:700,flexShrink:0}}>{KEYS[i]}</div>
                    {opt}
                  </div>
                );
              })}
            </div>
            {chosen!==null&&(
              <div style={{marginTop:14,fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:chosen===q.ans?"var(--green)":"var(--magenta)"}}>
                {chosen===q.ans?"✓ CORRECT — INTEL CONFIRMED":"✗ INCORRECT — RECALIBRATE"}
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:22,gap:10}}>
              <button className="neo-btn" style={{fontSize:9}} onClick={gen} disabled={loading}>{loading?"…":"↺ NEW QUIZ"}</button>
              <button className="neo-btn" onClick={next} disabled={chosen===null} style={{opacity: chosen === null ? 0.4 : 1}}>
                {idx===quiz.length-1?"COMPLETE MISSION ✓":"NEXT TARGET →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FLASHCARDS ──────────────────────────────────────────────────────── */
const FC=[
  {q:"What is Newton's Second Law?",a:"Force = mass × acceleration (F = ma). The greater the mass or acceleration, the greater the force required."},
  {q:"What is the Drake Equation?",a:"A probabilistic formula estimating the number of active communicative extraterrestrial civilizations in the Milky Way."},
  {q:"Define Quantum Entanglement",a:"Two particles become linked so measuring one instantly affects the other, regardless of the distance separating them."},
  {q:"What is Moore's Law?",a:"The observation that transistor count on microchips doubles roughly every two years, driving exponential growth in computing power."},
];

function Flash({toast}){
  const [cards,setCards]=useState(FC);
  const [idx,setIdx]=useState(0);
  const [flip,setFlip]=useState(false);
  const [gen,setGen]=useState(false);
  const go=(d)=>{setFlip(false);setTimeout(()=>setIdx(i=>(i+d+cards.length)%cards.length),flip?200:0);};

  const generate=async()=>{
    setGen(true); toast("◈ SCANNING KNOWLEDGE BASE…");
    try{
      const t=await ai([{role:"user",content:'Create one interesting educational flashcard. Return ONLY JSON, no markdown: {"q":"question","a":"clear detailed answer"}'}]);
      const c=JSON.parse(t.replace(/```json|```/g,"").trim());
      setCards(p=>[...p,c]); setIdx(cards.length); setFlip(false); toast("◈ NEW CARD ACQUIRED");
    }catch{toast("⚠ GENERATION FAILED");}
    setGen(false);
  };

  const card=cards[idx];
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,overflowY:"auto",position:"relative",zIndex:2}}>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".25em",color:"var(--cyan)",marginBottom:8,animation:"pulse 2s infinite"}}>◈ KNOWLEDGE CARD ARRAY ◈</div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:24,fontWeight:900,color:"#fff",marginBottom:8}}>FLASHCARDS</div>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--muted)",marginBottom:36}}>// tap to decode //</div>

      <div onClick={()=>setFlip(f=>!f)} style={{width:"100%",maxWidth:560,height:230,perspective:1100,cursor:"pointer",marginBottom:14}}>
        <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transform:flip?"rotateY(180deg)":"rotateY(0deg)",transition:"transform .55s cubic-bezier(.4,0,.2,1)"}}>
          <div className="hud-box" style={{position:"absolute",inset:0,borderRadius:10,backfaceVisibility:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",borderColor:"rgba(0,200,255,.25)"}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--cyan)",letterSpacing:".18em",marginBottom:14}}>[ QUERY ]</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:700,lineHeight:1.6,color:"#fff"}}>{card.q}</div>
          </div>
          <div style={{position:"absolute",inset:0,borderRadius:10,backfaceVisibility:"hidden",transform:"rotateY(180deg)",background:"rgba(0,255,179,.04)",border:"1px solid rgba(0,255,179,.25)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--green)",letterSpacing:".18em",marginBottom:14}}>[ ANSWER DECODED ]</div>
            <div style={{fontSize:14,lineHeight:1.75,color:"var(--text)"}}>{card.a}</div>
          </div>
        </div>
      </div>

      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--muted)",marginBottom:24}}>
        {flip?"▲ ANSWER REVEALED — tap to reset":"▼ tap card to reveal answer"}
      </div>
      <div style={{display:"flex",gap:12}}>
        <button className="neo-btn" onClick={()=>go(-1)}>◄ PREV</button>
        <button className="neo-btn" onClick={generate} disabled={gen}>{gen?"SCANNING…":"✦ AI GENERATE"}</button>
        <button className="neo-btn" onClick={()=>go(1)}>NEXT ►</button>
      </div>
      <div style={{marginTop:14,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--muted)"}}>
        CARD {idx+1} / {cards.length}
      </div>
    </div>
  );
}

/* ── NOTES ───────────────────────────────────────────────────────────── */
function Notes({user,toast}){
  const [text,setText]=useState(()=>localStorage.getItem(`eduie_${user}_notes`)||"");
  const [exp,setExp]=useState(false);
  const taRef=useRef(null);
  const save=()=>{localStorage.setItem(`eduie_${user}_notes`,text);toast("◈ NOTES ARCHIVED");};
  const insert=(s)=>{const ta=taRef.current;if(!ta)return;const p=ta.selectionStart;setText(text.slice(0,p)+s+text.slice(p));setTimeout(()=>{ta.selectionStart=ta.selectionEnd=p+s.length;ta.focus();},0);};
  const expand=async()=>{
    if(!text.trim()){toast("⚠ NO DATA TO PROCESS");return;}
    setExp(true);toast("✦ AI EXPANDING NOTES…");
    try{
      const r=await ai([{role:"user",content:`Expand and enrich these study notes. Use ## for section headers and ✦ for bullet points. Add detail, examples, and structure:\n\n${text}`}]);
      setText(r);localStorage.setItem(`eduie_${user}_notes`,r);toast("◈ NOTES UPGRADED");
    }catch{toast("⚠ EXPANSION FAILED");}
    setExp(false);
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:32,gap:14,minHeight:0,overflow:"hidden",position:"relative",zIndex:2}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:".12em",color:"var(--cyan)",marginRight:8}}>◈ MISSION LOG</div>
        {[["**bold**","BOLD"],["*italic*","ITALIC"],["\n## ","HEADER"],["\n✦ ","POINT"],["\n```\n","CODE"]].map(([s,l])=>(
          <button key={l} className="neo-btn" style={{padding:"4px 10px",fontSize:9}} onClick={()=>insert(s)}>{l}</button>
        ))}
        <button className="neo-btn gn" style={{padding:"4px 12px",fontSize:9,marginLeft:"auto"}} onClick={save}>ARCHIVE</button>
        <button className="neo-btn" style={{padding:"4px 12px",fontSize:9}} onClick={expand} disabled={exp}>{exp?"PROCESSING…":"✦ AI EXPAND"}</button>
      </div>
      <div style={{position:"relative",flex:1,minHeight:0}}>
        <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)}
          placeholder={"// Begin mission log...\n// Document your discoveries and theories here.\n// Hit AI EXPAND to enrich your notes automatically."}
          style={{width:"100%",height:"100%",background:"rgba(0,200,255,.03)",border:"1px solid var(--border)",borderRadius:8,padding:"20px 24px",color:"var(--text)",fontFamily:"'Share Tech Mono',monospace",fontSize:13,lineHeight:1.9,resize:"none",outline:"none",transition:"border-color .2s"}}
          onFocus={e=>e.target.style.borderColor="var(--cyan)"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}
        />
        <div style={{position:"absolute",bottom:10,right:14,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)",pointerEvents:"none"}}>[{text.length} CHARS]</div>
      </div>
    </div>
  );
}

/* ── ROOT ────────────────────────────────────────────────────────────── */
const TABS=[
  {id:"chat", icon:"◈", label:"AI TUTOR"},
  {id:"quiz", icon:"◎", label:"QUIZ"},
  {id:"flash",icon:"◇", label:"FLASHCARDS"},
  {id:"notes",icon:"◰", label:"NOTES"},
];

export default function App(){
  const [user,setUser]=useState(null);
  const [mode,setMode]=useState("chat");
  const [toast,setToast]=useState(null);
  const show=useCallback(m=>setToast(m),[]);

  if(!user) return <><Starfield/><Login onLogin={setUser}/></>;

  return (
    <>
      <Starfield/>
      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",height:"100vh"}}>
        {/* TOPNAV */}
        <nav style={{height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",borderBottom:"1px solid var(--border)",background:"rgba(1,2,10,.92)",backdropFilter:"blur(20px)",flexShrink:0}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:3,background:"rgba(0,200,255,.1)",border:"1px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🎓</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:900,letterSpacing:".15em",color:"var(--cyan)",textShadow:"0 0 10px var(--cyan)"}}>EDUIE</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"var(--muted)",marginLeft:2}}>v3.0</div>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:2}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setMode(t.id)} style={{
                fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:".1em",
                padding:"7px 16px",borderRadius:3,border:"1px solid",cursor:"pointer",transition:"all .2s",
                borderColor:mode===t.id?"var(--cyan)":"transparent",
                color:mode===t.id?"var(--cyan)":"var(--muted)",
                background:mode===t.id?"rgba(0,200,255,.1)":"transparent",
                boxShadow:mode===t.id?"0 0 10px rgba(0,200,255,.2)":"none",
              }}
              onMouseEnter={e=>mode!==t.id&&(e.currentTarget.style.color="var(--text)")}
              onMouseLeave={e=>mode!==t.id&&(e.currentTarget.style.color="var(--muted)")}
              ><span style={{marginRight:5}}>{t.icon}</span>{t.label}</button>
            ))}
          </div>
          {/* Pilot */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"var(--muted)"}}>PILOT: <span style={{color:"var(--cyan)"}}>{user.toUpperCase()}</span></div>
            <div style={{width:5,height:5,borderRadius:"50%",background:"var(--green)",animation:"pulse 1.5s infinite",boxShadow:"0 0 6px var(--green)"}}/>
            <button className="neo-btn mg" style={{padding:"4px 10px",fontSize:8}} onClick={()=>window.location.reload()}>EXIT</button>
          </div>
        </nav>

        {/* CONTENT */}
        <div style={{flex:1,display:"flex",minHeight:0,overflow:"hidden"}}>
          {mode==="chat"  && <Chat  user={user} toast={show} key="chat"/>}
          {mode==="quiz"  && <Quiz  toast={show}              key="quiz"/>}
          {mode==="flash" && <Flash toast={show}              key="flash"/>}
          {mode==="notes" && <Notes user={user} toast={show}  key="notes"/>}
        </div>
      </div>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  );
}