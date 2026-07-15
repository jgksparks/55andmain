"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Nav from "@/components/Nav";
import { getPins, togglePin } from "@/lib/pins";
import {
  getSchedules, getScheduledDates, addScheduleDate,
  removeScheduleDate, clearSchedule, isScheduled,
} from "@/lib/schedules";
import {
  getMyTimes, setMyTime, clearMyTime,
  parseHHMM, toHHMM, formatHHMM, type MyTime,
} from "@/lib/mytimes";
import { getListing, type Listing } from "@/lib/data";

// ── constants ────────────────────────────────────────────────────────────────
const DAYS      = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_START = 6;
const DAY_END   = 22;
const HOUR_PX   = 80;
const MIN_DUR   = 0.25; // 15-minute minimum for usability only

const CAT: Record<string,{bar:string;light:string;border:string}> = {
  Events:      { bar:"#3b82f6", light:"bg-blue-50",   border:"border-blue-300"   },
  Experiences: { bar:"#f59e0b", light:"bg-amber-50",  border:"border-amber-300"  },
  Services:    { bar:"#a855f7", light:"bg-purple-50", border:"border-purple-300" },
  Groups:      { bar:"#16a34a", light:"bg-green-50",  border:"border-green-300"  },
  Fundraisers: { bar:"#e11d48", light:"bg-rose-50",   border:"border-rose-300"   },
  Volunteers:  { bar:"#0891b2", light:"bg-teal-50",   border:"border-teal-300"   },
};

// ── helpers ──────────────────────────────────────────────────────────────────
const snapH  = (h:number) => Math.round(h / 0.25) * 0.25;
const clampH = (v:number,lo:number,hi:number) => Math.max(lo, Math.min(hi, v));

function toTodayKey(){ const t=new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`; }
function toDayKey(y:number,m:number,d:number){ return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function formatMonthLabel(y:number,m:number){ return new Date(y,m,1).toLocaleDateString("en-US",{month:"long",year:"numeric"}); }
function formatDayFull(k:string){ return new Date(k+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); }
function formatDateShort(k:string){ return new Date(k+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function getDaysInMonth(y:number,m:number){ return new Date(y,m+1,0).getDate(); }
function getFirstDOW(y:number,m:number){ return new Date(y,m,1).getDay(); }
function fmtHour(h:number){ if(h===0)return"12 AM"; if(h<12)return`${h} AM`; if(h===12)return"12 PM"; return`${h-12} PM`; }

function parseListingTime(s?:string):number|null{
  if(!s)return null;
  const m=s.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i); if(!m)return null;
  let h=parseInt(m[1]); const min=parseInt(m[2]??"0"); const ap=m[3].toUpperCase();
  if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0;
  return h+min/60;
}

// Default block: use listing's own time if available (1h window), else null (all-day)
function resolveBlock(l:Listing,mt:MyTime|null):{start:number;end:number}|null{
  if(mt) return{start:parseHHMM(mt.start),end:parseHHMM(mt.end)};
  const t=parseListingTime(l.time); if(t!==null)return{start:t,end:t+1};
  return null;
}

// ── DetailPanel — shows listing info + My Plan time editor ───────────────────
function DetailPanel({listing,myTime,onSave,onClear,onClose,onRemoveFromDay,onUnpin}:{
  listing:Listing; myTime:MyTime|null;
  onSave:(t:MyTime)=>void; onClear:()=>void; onClose:()=>void;
  onRemoveFromDay:()=>void; onUnpin:()=>void;
}){
  const listed = parseListingTime(listing.time);
  const defStart = myTime?.start ?? toHHMM(listed ?? 9);
  const defEnd   = myTime?.end   ?? toHHMM((listed ?? 9)+1);
  const [start,setStart]=useState(defStart);
  const [end,setEnd]=useState(defEnd);
  const [expanded,setExpanded]=useState(false);
  const TRUNC=160;

  function onStartChange(v:string){
    setStart(v);
    if(parseHHMM(v)+MIN_DUR>parseHHMM(end)) setEnd(toHHMM(parseHHMM(v)+MIN_DUR));
  }
  function onEndChange(v:string){
    const e=parseHHMM(v);
    setEnd(e<parseHHMM(start)+MIN_DUR ? toHHMM(parseHHMM(start)+MIN_DUR) : v);
  }

  const col=CAT[listing.category]??CAT.Events;

  return(
    <div
      className="absolute z-50 left-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-2xl w-72 max-h-[80vh] overflow-y-auto"
      onClick={e=>e.stopPropagation()}
      onMouseDown={e=>e.stopPropagation()}
      onMouseLeave={onClose}
    >
      {/* header bar */}
      <div className="px-4 pt-3 pb-2 border-b border-stone-100 flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white mb-1 inline-block" style={{background:col.bar,fontFamily:"Arial,sans-serif"}}>{listing.subcategory}</span>
          <p className="font-bold text-stone-900 text-sm leading-snug">{listing.title}</p>
        </div>
        <button onClick={onClose} className="text-stone-300 hover:text-stone-600 text-lg leading-none shrink-0 mt-0.5">×</button>
      </div>

      {/* event details */}
      <div className="px-4 py-3 flex flex-col gap-1.5 border-b border-stone-100">
        {listing.time&&(
          <div className="flex items-center gap-2 text-xs text-stone-600" style={{fontFamily:"Arial,sans-serif"}}>
            <span>🕐</span>
            <span>Event time: <strong>{listing.time}</strong></span>
          </div>
        )}
        <div className="flex items-start gap-2 text-xs text-stone-600" style={{fontFamily:"Arial,sans-serif"}}>
          <span className="mt-0.5">📍</span>
          <span>{listing.location}</span>
        </div>
        {listing.cost&&(
          <div className="flex items-center gap-2 text-xs text-stone-600" style={{fontFamily:"Arial,sans-serif"}}>
            <span>💵</span><span>{listing.cost}</span>
          </div>
        )}
        <div className="mt-1">
          <p className="text-xs text-stone-500 leading-relaxed" style={{fontFamily:"Arial,sans-serif"}}>
            {expanded||listing.description.length<=TRUNC
              ? listing.description
              : listing.description.slice(0,TRUNC)+"…"}
          </p>
          {listing.description.length>TRUNC&&(
            <button onClick={()=>setExpanded(v=>!v)} className="text-xs text-[#556B3D] font-semibold hover:underline mt-0.5" style={{fontFamily:"Arial,sans-serif"}}>
              {expanded?"Show less":"Read more"}
            </button>
          )}
        </div>
      </div>

      {/* My Plan time */}
      <div className="px-4 py-3 border-b border-stone-100">
        <p className="text-xs font-bold text-stone-600 mb-2" style={{fontFamily:"Arial,sans-serif"}}>My Plan — set your time</p>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-xs text-stone-400 block mb-1" style={{fontFamily:"Arial,sans-serif"}}>Start</label>
            <input type="time" value={start} onChange={e=>onStartChange(e.target.value)} className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm"/>
          </div>
          <div className="flex-1">
            <label className="text-xs text-stone-400 block mb-1" style={{fontFamily:"Arial,sans-serif"}}>End</label>
            <input type="time" value={end} onChange={e=>onEndChange(e.target.value)} className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm"/>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>onSave({start,end})} className="flex-1 bg-[#556B3D] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#3d5229]" style={{fontFamily:"Arial,sans-serif"}}>Save time</button>
          {myTime&&<button onClick={onClear} className="text-xs text-stone-400 hover:text-stone-700 px-2" style={{fontFamily:"Arial,sans-serif"}}>Clear</button>}
        </div>
      </div>

      {/* actions */}
      <div className="px-4 py-2.5 flex gap-3 text-xs" style={{fontFamily:"Arial,sans-serif"}}>
        <button onClick={onRemoveFromDay} className="text-stone-400 hover:text-stone-700">Remove from this day</button>
        <button onClick={onUnpin} className="text-red-400 hover:text-red-600">Remove from saved</button>
      </div>
    </div>
  );
}

// ── DraggableBlock ────────────────────────────────────────────────────────────
// Fix: accepts ref object (not .current) so handlers always read the live DOM node
function DraggableBlock({listing,block,myTime,timelineRef,onUpdate,onRemoveFromDay,onUnpin}:{
  listing:Listing; block:{start:number;end:number}; myTime:MyTime|null;
  timelineRef:React.RefObject<HTMLDivElement|null>;
  onUpdate:(s:number,e:number)=>void;
  onRemoveFromDay:()=>void; // unschedule this day only → returns to sidebar
  onUnpin:()=>void;         // remove from saved entirely
}){
  const [local,setLocal]=useState(block);
  const [isDragging,setIsDragging]=useState(false);
  const [isResizing,setIsResizing]=useState(false);
  const [editing,setEditing]=useState(false);
  const live=useRef(block);
  const didMove=useRef(false); // distinguishes click from drag

  useEffect(()=>{ setLocal(block); live.current=block; },[block.start,block.end]);

  const col=CAT[listing.category]??CAT.Events;
  const totalPx=(DAY_END-DAY_START)*HOUR_PX;

  function yToHour(y:number):number{
    const el=timelineRef.current;
    if(!el)return DAY_START;
    const rect=el.getBoundingClientRect();
    return DAY_START+((y-rect.top)/totalPx)*(DAY_END-DAY_START);
  }

  function startMove(e:React.MouseEvent){
    e.preventDefault(); e.stopPropagation();
    didMove.current=false;
    const startY=e.clientY;
    const offsetH=yToHour(e.clientY)-live.current.start;
    function onMove(ev:MouseEvent){
      if(!didMove.current&&Math.abs(ev.clientY-startY)>4){
        didMove.current=true; setIsDragging(true);
      }
      if(!didMove.current)return;
      const dur=live.current.end-live.current.start;
      const s=snapH(clampH(yToHour(ev.clientY)-offsetH,DAY_START,DAY_END-dur));
      const nb={start:s,end:s+dur}; live.current=nb; setLocal({...nb});
    }
    function onUp(){
      if(didMove.current){ onUpdate(live.current.start,live.current.end); setIsDragging(false); }
      else { setEditing(v=>!v); } // pure click → toggle editor
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
    }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  function startResize(e:React.MouseEvent){
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    function onMove(ev:MouseEvent){
      const newEnd=snapH(clampH(yToHour(ev.clientY),live.current.start+MIN_DUR,DAY_END));
      const nb={start:live.current.start,end:newEnd}; live.current=nb; setLocal({...nb});
    }
    function onUp(){
      onUpdate(live.current.start,live.current.end);
      setIsResizing(false);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
    }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  const topPct   =((local.start-DAY_START)/(DAY_END-DAY_START))*100;
  const heightPct=((local.end-local.start)/(DAY_END-DAY_START))*100;
  const isShort  =(local.end-local.start)<0.6;

  return(
    <div
      className={`absolute left-1 right-2 rounded-lg border select-none overflow-visible group ${isDragging||isResizing?"shadow-xl z-30 opacity-90":"z-10 hover:z-20"}`}
      style={{
        top:`${topPct}%`, height:`${Math.max(heightPct,1.5)}%`,
        borderLeftWidth:4, borderLeftColor:col.bar,
        backgroundColor:col.bar+"22", borderColor:col.bar+"55",
        cursor:isDragging?"grabbing":"grab",
      }}
      onMouseDown={startMove}
    >
      {/* block label — pointer-events-none so mouse drag works on the whole block */}
      <div className="px-2 py-1 h-full flex flex-col justify-start overflow-hidden pointer-events-none">
        <p className="text-xs font-bold text-stone-800 leading-tight truncate">{listing.title}</p>
        {!isShort&&(
          <p className="text-xs text-stone-500 truncate mt-0.5" style={{fontFamily:"Arial,sans-serif"}}>
            {formatHHMM(toHHMM(local.start))} – {formatHHMM(toHHMM(local.end))}
            {myTime&&<span className="ml-1 text-[#556B3D] font-semibold"> ✓</span>}
          </p>
        )}
      </div>

      {/* resize handle */}
      <div className="absolute bottom-0 left-0 right-0 h-4 flex items-end justify-center pb-0.5 cursor-ns-resize z-20"
        onMouseDown={e=>{e.stopPropagation();startResize(e);}} onClick={e=>e.stopPropagation()}>
        <div className="w-8 h-1 rounded-full bg-stone-400 opacity-30 group-hover:opacity-70 transition-opacity"/>
      </div>

      {/* detail panel — click anywhere on block to open */}
      {editing&&(
        <DetailPanel listing={listing} myTime={myTime}
          onSave={t=>{setMyTime(listing.id,t);onUpdate(parseHHMM(t.start),parseHHMM(t.end));setEditing(false);}}
          onClear={()=>{clearMyTime(listing.id);setEditing(false);}}
          onClose={()=>setEditing(false)}
          onRemoveFromDay={()=>{onRemoveFromDay();setEditing(false);}}
          onUnpin={()=>{onUnpin();setEditing(false);}}/>
      )}
    </div>
  );
}

// ── AllDayRow ─────────────────────────────────────────────────────────────────
function AllDayRow({listing,myTime,onUpdate,onRemoveFromDay,onUnpin}:{
  listing:Listing; myTime:MyTime|null;
  onUpdate:(s:number,e:number)=>void;
  onRemoveFromDay:()=>void; onUnpin:()=>void;
}){
  const [open,setOpen]=useState(false);
  const col=CAT[listing.category]??CAT.Events;
  return(
    <div className={`relative border rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition-shadow ${col.light} ${col.border}`}
      onClick={()=>setOpen(v=>!v)}>
      <div className="min-w-0">
        <p className="font-bold text-stone-800 truncate">{listing.title}</p>
        <p className="opacity-60 mt-0.5 truncate" style={{fontFamily:"Arial,sans-serif"}}>
          {myTime?`My Plan: ${formatHHMM(myTime.start)} – ${formatHHMM(myTime.end)}`:listing.time?`Event: ${listing.time}`:"📍 "+listing.location}
        </p>
      </div>
      <span className="text-stone-400 shrink-0">{open?"▲":"▼"}</span>
      {open&&(
        <DetailPanel listing={listing} myTime={myTime}
          onSave={t=>{setMyTime(listing.id,t);onUpdate(parseHHMM(t.start),parseHHMM(t.end));setOpen(false);}}
          onClear={()=>{clearMyTime(listing.id);setOpen(false);}}
          onClose={()=>setOpen(false)}
          onRemoveFromDay={()=>{onRemoveFromDay();setOpen(false);}}
          onUnpin={()=>{onUnpin();setOpen(false);}}/>
      )}
    </div>
  );
}

// ── Add Date picker ───────────────────────────────────────────────────────────
function AddDatePicker({onAdd,onClose}:{onAdd:(date:string)=>void;onClose:()=>void}){
  const [date,setDate]=useState("");
  return(
    <div className="mt-1 bg-white border border-stone-200 rounded-xl shadow-xl p-3 text-xs" onClick={e=>e.stopPropagation()}>
      <p className="font-semibold text-stone-600 mb-2" style={{fontFamily:"Arial,sans-serif"}}>Add another date</p>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)}
        className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-sm mb-2"/>
      <div className="flex gap-2">
        <button onClick={()=>{if(date){onAdd(date);setDate("");}}}
          className="flex-1 bg-[#556B3D] text-white font-semibold py-1.5 rounded-lg hover:bg-[#3d5229]"
          style={{fontFamily:"Arial,sans-serif"}}>Add</button>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700 px-2" style={{fontFamily:"Arial,sans-serif"}}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
type ViewMode="month"|"day";

export default function CalendarPage(){
  const today=new Date();
  const [year,setYear]=useState(today.getFullYear());
  const [month,setMonth]=useState(today.getMonth());
  const [view,setView]=useState<ViewMode>("month");
  const [selectedDay,setSelectedDay]=useState(toTodayKey());
  const [pinnedIds,setPinnedIds]=useState<string[]>([]);
  const [schedules,setSchedulesState]=useState<Record<string,string[]>>({});
  const [myTimes,setMyTimesState]=useState<Record<string,MyTime>>({});
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [dragOverTimeline,setDragOverTimeline]=useState(false);
  const [addingDateFor,setAddingDateFor]=useState<string|null>(null);
  const draggingId=useRef<string|null>(null);
  const [tick,setTick]=useState(0);
  const timelineRef=useRef<HTMLDivElement>(null); // passed as ref object, not .current

  const refresh=useCallback(()=>setTick(t=>t+1),[]);

  useEffect(()=>{
    setPinnedIds(getPins());
    setSchedulesState(getSchedules());
    setMyTimesState(getMyTimes());
  },[tick]);

  const allPinned=useMemo(()=>pinnedIds.map(id=>getListing(id)).filter((l):l is Listing=>!!l),[pinnedIds]);
  const fixedDateItems=allPinned.filter(l=>!!l.date);
  const undated=allPinned.filter(l=>!l.date);
  const unscheduled=undated.filter(l=>!isScheduled(l.id));
  const scheduled  =undated.filter(l=>isScheduled(l.id));

  // Build byDate from multi-date schedules
  const byDate=useMemo(()=>{
    const map:Record<string,Listing[]>={};
    for(const l of fixedDateItems){
      if(!map[l.date!])map[l.date!]=[]; map[l.date!].push(l);
    }
    for(const l of undated){
      const dates=schedules[l.id]??[];
      for(const date of dates){
        if(!map[date])map[date]=[];
        if(!map[date].find(x=>x.id===l.id)) map[date].push(l);
      }
    }
    return map;
  },[fixedDateItems,undated,schedules]);

  const todayKey=toTodayKey();
  const daysInMonth=getDaysInMonth(year,month);
  const firstDay=getFirstDOW(year,month);
  const dayListings=byDate[selectedDay]??[];
  const timedBlocks=dayListings.map(l=>({l,block:resolveBlock(l,myTimes[l.id]??null)})).filter((x):x is{l:Listing;block:{start:number;end:number}}=>x.block!==null);
  const allDayItems=dayListings.filter(l=>resolveBlock(l,myTimes[l.id]??null)===null);

  function prevMonth(){ if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function nextMonth(){ if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }
  function prevDay(){ const d=new Date(selectedDay+"T00:00:00");d.setDate(d.getDate()-1);setSelectedDay(d.toISOString().slice(0,10)); }
  function nextDay(){ const d=new Date(selectedDay+"T00:00:00");d.setDate(d.getDate()+1);setSelectedDay(d.toISOString().slice(0,10)); }

  function dropOnDay(k:string, clientY?:number){
    const id=draggingId.current; if(!id)return;
    // If dropped onto the day timeline with a Y coordinate, place block at that time
    if(clientY!=null && timelineRef.current){
      const rect=timelineRef.current.getBoundingClientRect();
      const totalPx=(DAY_END-DAY_START)*HOUR_PX;
      const rawH=DAY_START+((clientY-rect.top)/totalPx)*(DAY_END-DAY_START);
      const snapped=snapH(clampH(rawH,DAY_START,DAY_END-1));
      setMyTime(id,{start:toHHMM(snapped),end:toHHMM(snapped+1)});
      setMyTimesState(getMyTimes());
    }
    addScheduleDate(id,k); setSchedulesState(getSchedules());
    setDragOver(null); setDragOverTimeline(false); draggingId.current=null; setSelectedDay(k);
    refresh();
  }
  function removeFromDay(id:string,date:string){ removeScheduleDate(id,date); refresh(); }
  function unpin(id:string){ clearSchedule(id); clearMyTime(id); togglePin(id); refresh(); }
  function blockUpdate(id:string,s:number,e:number){ setMyTime(id,{start:toHHMM(s),end:toHHMM(e)}); refresh(); }

  // ── sidebar ───────────────────────────────────────────────────────────────
  function renderSidebar(){
    return(
      <div className="w-52 shrink-0 flex flex-col gap-4">

        {/* Drag to Schedule */}
        <div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2" style={{fontFamily:"Arial,sans-serif"}}>Drag to Schedule</p>
          {unscheduled.length===0&&<p className="text-xs text-stone-400 italic" style={{fontFamily:"Arial,sans-serif"}}>{undated.length===0?"No open-ended items saved.":"All scheduled ✓"}</p>}
          <div className="flex flex-col gap-2">
            {unscheduled.map(l=>(
              <div key={l.id} draggable
                onDragStart={()=>{draggingId.current=l.id;}}
                onDragEnd={()=>{draggingId.current=null;setDragOver(null);}}
                className="bg-white border-2 border-dashed border-stone-300 rounded-lg p-2.5 cursor-grab hover:border-[#556B3D] hover:shadow-sm transition-all select-none">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{background:CAT[l.category]?.bar??"#888"}}/>
                  <span className="text-xs text-stone-400" style={{fontFamily:"Arial,sans-serif"}}>{l.subcategory}</span>
                </div>
                <p className="text-xs font-semibold text-stone-800 leading-snug">{l.title}</p>
                <button onClick={()=>unpin(l.id)} className="text-xs text-red-400 hover:text-red-600 mt-1" style={{fontFamily:"Arial,sans-serif"}}>Remove from saved</button>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled (multi-date) */}
        {scheduled.length>0&&(
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2" style={{fontFamily:"Arial,sans-serif"}}>Scheduled</p>
            <div className="flex flex-col gap-2">
              {scheduled.map(l=>{
                const mt=myTimes[l.id];
                const dates=schedules[l.id]??[];
                return(
                  <div key={l.id} draggable
                    onDragStart={()=>{draggingId.current=l.id;}}
                    onDragEnd={()=>{draggingId.current=null;setDragOver(null);}}
                    className="bg-green-50 border border-green-200 rounded-lg p-2.5 cursor-grab hover:shadow-sm transition-all select-none">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:CAT[l.category]?.bar??"#888"}}/>
                      <span className="text-xs text-stone-400" style={{fontFamily:"Arial,sans-serif"}}>{l.subcategory}</span>
                    </div>
                    <p className="text-xs font-semibold text-stone-800 leading-snug mb-1">{l.title}</p>
                    {/* date chips */}
                    <div className="flex flex-wrap gap-1 mb-1">
                      {dates.map(d=>(
                        <span key={d} className="inline-flex items-center gap-0.5 text-xs bg-white border border-green-300 text-green-800 rounded px-1.5 py-0.5" style={{fontFamily:"Arial,sans-serif"}}>
                          {formatDateShort(d)}
                          <button onClick={e=>{e.stopPropagation();removeFromDay(l.id,d);}} className="text-green-500 hover:text-red-500 ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                    {mt&&<p className="text-xs text-green-700 mb-1" style={{fontFamily:"Arial,sans-serif"}}>My Plan: {formatHHMM(mt.start)}–{formatHHMM(mt.end)}</p>}
                    <div className="flex gap-2 flex-wrap">
                      {/* + date */}
                      {addingDateFor===l.id ? (
                        <AddDatePicker
                          onAdd={date=>{addScheduleDate(l.id,date);setSchedulesState(getSchedules());setAddingDateFor(null);}}
                          onClose={()=>setAddingDateFor(null)}/>
                      ):(
                        <button onClick={e=>{e.stopPropagation();setAddingDateFor(l.id);}}
                          className="text-xs text-[#556B3D] font-semibold hover:underline" style={{fontFamily:"Arial,sans-serif"}}>+ date</button>
                      )}
                      <button onClick={()=>unpin(l.id)} className="text-xs text-red-400 hover:text-red-600" style={{fontFamily:"Arial,sans-serif"}}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fixed-date saved events */}
        {fixedDateItems.length>0&&(
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2" style={{fontFamily:"Arial,sans-serif"}}>Saved Events</p>
            <div className="flex flex-col gap-2">
              {fixedDateItems.map(l=>{
                const mt=myTimes[l.id];
                return(
                  <div key={l.id} className="bg-white border border-stone-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:CAT[l.category]?.bar??"#888"}}/>
                      <span className="text-xs text-stone-400" style={{fontFamily:"Arial,sans-serif"}}>{l.subcategory}</span>
                    </div>
                    <p className="text-xs font-semibold text-stone-800 leading-snug">{l.title}</p>
                    <p className="text-xs text-blue-600 mt-0.5" style={{fontFamily:"Arial,sans-serif"}}>
                      {formatDateShort(l.date!)}
                      {mt?` · My Plan: ${formatHHMM(mt.start)}–${formatHHMM(mt.end)}`:l.time?` · ${l.time}`:""}
                    </p>
                    <button onClick={()=>unpin(l.id)} className="text-xs text-red-400 hover:text-red-600 mt-1" style={{fontFamily:"Arial,sans-serif"}}>Remove</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allPinned.length===0&&(
          <p className="text-xs text-stone-400" style={{fontFamily:"Arial,sans-serif"}}>
            No saved items yet. Go to the <a href="/" className="text-[#556B3D] underline">home page</a> and hit Save.
          </p>
        )}
      </div>
    );
  }

  // ── month view ────────────────────────────────────────────────────────────
  function renderMonthView(){
    return(
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-stone-100"><svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg></button>
          <h2 className="text-lg font-bold">{formatMonthLabel(year,month)}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-stone-100"><svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></button>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-stone-200">
            {DAYS.map(d=><div key={d} className="text-center text-xs font-semibold text-stone-400 py-2" style={{fontFamily:"Arial,sans-serif"}}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} className="min-h-[90px] border-r border-b border-stone-100 bg-stone-50"/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1; const key=toDayKey(year,month,day);
              const events=byDate[key]??[]; const isToday=key===todayKey; const isSel=key===selectedDay; const isDT=key===dragOver;
              return(
                <div key={day}
                  onClick={()=>{setSelectedDay(key);if(events.length>0)setView("day");}}
                  onDragOver={e=>{e.preventDefault();setDragOver(key);}}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={e=>{e.preventDefault();dropOnDay(key);}}
                  className={`min-h-[90px] border-r border-b border-stone-100 p-1.5 cursor-pointer relative transition-colors ${isDT?"bg-green-100 ring-2 ring-inset ring-[#556B3D]":isSel?"bg-amber-50 ring-2 ring-inset ring-amber-400":"hover:bg-stone-50"}`}>
                  {isDT&&<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-[#556B3D] text-lg font-bold">+</span></div>}
                  <div className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday?"bg-[#556B3D] text-white":"text-stone-700"}`} style={{fontFamily:"Arial,sans-serif"}}>{day}</div>
                  {events.slice(0,3).map(e=>{
                    const mt=myTimes[e.id];
                    return(<div key={e.id} className="text-xs text-white rounded px-1 py-0.5 mb-0.5 truncate leading-tight" style={{background:CAT[e.category]?.bar??"#888",fontFamily:"Arial,sans-serif"}}>
                      {mt?`${formatHHMM(mt.start)} `:e.time?`${e.time} `:""}{e.title}
                    </div>);
                  })}
                  {events.length>3&&<div className="text-xs text-stone-400" style={{fontFamily:"Arial,sans-serif"}}>+{events.length-3} more</div>}
                </div>
              );
            })}
          </div>
        </div>
        {dayListings.length>0&&(
          <div className="mt-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-stone-700" style={{fontFamily:"Arial,sans-serif"}}>{formatDayFull(selectedDay)}</h3>
              <button onClick={()=>setView("day")} className="text-xs text-[#556B3D] font-semibold hover:underline" style={{fontFamily:"Arial,sans-serif"}}>Day view →</button>
            </div>
            <div className="flex flex-col gap-2">
              {dayListings.map(l=>{
                const mt=myTimes[l.id]??null;
                return(<div key={l.id} className="border rounded-lg px-3 py-2 text-xs flex items-start justify-between gap-3" style={{borderLeftWidth:3,borderLeftColor:CAT[l.category]?.bar??"#888",background:(CAT[l.category]?.bar??"#888")+"10"}}>
                  <div>
                    <p className="font-bold">{l.title}</p>
                    <p className="text-stone-500 mt-0.5" style={{fontFamily:"Arial,sans-serif"}}>
                      {mt?`My Plan: ${formatHHMM(mt.start)}–${formatHHMM(mt.end)}`:l.time?`🕐 ${l.time}`:"All day"}{" · "}📍 {l.location}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0" style={{fontFamily:"Arial,sans-serif"}}>
                    {!l.date&&<button onClick={()=>removeFromDay(l.id,selectedDay)} className="text-stone-400 hover:text-stone-700">Remove from day</button>}
                    <button onClick={()=>unpin(l.id)} className="text-red-500 hover:text-red-700">Remove all</button>
                  </div>
                </div>);
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── day view ──────────────────────────────────────────────────────────────
  function renderDayView(){
    const isToday=selectedDay===todayKey;
    const nowH=today.getHours()+today.getMinutes()/60;
    const hours=Array.from({length:DAY_END-DAY_START},(_,i)=>DAY_START+i);
    const totalPx=(DAY_END-DAY_START)*HOUR_PX;

    return(
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevDay} className="p-2 rounded-lg hover:bg-stone-100"><svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg></button>
          <div className="text-center">
            <h2 className="text-lg font-bold leading-tight">{formatDayFull(selectedDay)}</h2>
            {isToday&&<span className="text-xs text-[#556B3D] font-semibold" style={{fontFamily:"Arial,sans-serif"}}>Today</span>}
          </div>
          <button onClick={nextDay} className="p-2 rounded-lg hover:bg-stone-100"><svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></button>
        </div>

        {allDayItems.length>0&&(
          <div className="mb-3 bg-stone-50 rounded-xl border border-stone-200 px-4 py-3">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2" style={{fontFamily:"Arial,sans-serif"}}>All Day — click ✏️ to set My Plan time</p>
            <div className="flex flex-col gap-2">
              {allDayItems.map(l=>(
                <AllDayRow key={l.id} listing={l} myTime={myTimes[l.id]??null}
                  onUpdate={(s,e)=>blockUpdate(l.id,s,e)}
                  onRemoveFromDay={()=>removeFromDay(l.id,selectedDay)}
                  onUnpin={()=>unpin(l.id)}/>
              ))}
            </div>
          </div>
        )}

        {/* Timeline — ref attached here, passed as ref object to DraggableBlock */}
        <div
          className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${dragOverTimeline?"border-[#556B3D] ring-2 ring-[#556B3D] bg-green-50":"border-stone-200"}`}
          onDragOver={e=>{e.preventDefault();setDragOverTimeline(true);}}
          onDragLeave={()=>setDragOverTimeline(false)}
          onDrop={e=>{e.preventDefault();dropOnDay(selectedDay,e.clientY);}}>
          {dragOverTimeline&&<div className="text-center text-xs font-semibold text-[#556B3D] py-1" style={{fontFamily:"Arial,sans-serif"}}>Drop to schedule here</div>}
          <div className="relative" style={{height:totalPx}} ref={timelineRef}>
            {hours.map(h=>(
              <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none" style={{top:(h-DAY_START)*HOUR_PX}}>
                <div className="w-16 shrink-0 pr-2 text-right pt-1"><span className="text-xs text-stone-400" style={{fontFamily:"Arial,sans-serif"}}>{fmtHour(h)}</span></div>
                <div className="flex-1 border-t border-stone-100 mt-2"/>
              </div>
            ))}
            {hours.map(h=>(
              <div key={`hh${h}`} className="absolute left-16 right-0 border-t border-dashed border-stone-50 pointer-events-none" style={{top:(h-DAY_START)*HOUR_PX+HOUR_PX/2}}/>
            ))}
            {isToday&&nowH>=DAY_START&&nowH<=DAY_END&&(
              <div className="absolute left-0 right-0 flex items-center pointer-events-none z-20" style={{top:(nowH-DAY_START)*HOUR_PX}}>
                <div className="w-16 shrink-0 pr-2 text-right"><span className="text-xs text-[#556B3D] font-bold" style={{fontFamily:"Arial,sans-serif"}}>{today.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span></div>
                <div className="w-3 h-3 rounded-full bg-[#556B3D] shrink-0 -ml-1.5"/>
                <div className="flex-1 h-0.5 bg-[#556B3D] opacity-60"/>
              </div>
            )}
            {/* Event blocks — timelineRef passed as ref object (not .current) */}
            <div className="absolute" style={{left:64,right:0,top:0,height:totalPx}}>
              {timedBlocks.map(({l,block})=>(
                <DraggableBlock key={l.id} listing={l}
                  block={{start:Math.max(block.start,DAY_START),end:Math.min(block.end,DAY_END)}}
                  myTime={myTimes[l.id]??null}
                  timelineRef={timelineRef}
                  onUpdate={(s,e)=>blockUpdate(l.id,s,e)}
                  onRemoveFromDay={()=>removeFromDay(l.id,selectedDay)}
                  onUnpin={()=>unpin(l.id)}/>
              ))}
            </div>
          </div>
        </div>

        {dayListings.length===0&&(
          <p className="text-center text-stone-400 text-sm py-8" style={{fontFamily:"Arial,sans-serif"}}>
            Nothing saved for this day. Drag an item from the sidebar or <a href="/" className="text-[#556B3D] underline">browse listings</a>.
          </p>
        )}
      </div>
    );
  }

  return(
    <div className="min-h-screen flex flex-col">
      <Nav/>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Calendar</h1>
            <p className="text-sm text-stone-500" style={{fontFamily:"Arial,sans-serif"}}>
              {allPinned.length===0?"Save events from the home page to get started.":`${allPinned.length} saved item${allPinned.length!==1?"s":""}`}
            </p>
          </div>
          <div className="flex rounded-lg border border-stone-300 overflow-hidden text-sm" style={{fontFamily:"Arial,sans-serif"}}>
            <button onClick={()=>setView("month")} className={`px-4 py-2 font-semibold transition-colors ${view==="month"?"bg-[#556B3D] text-white":"bg-white text-stone-600 hover:bg-stone-50"}`}>Month</button>
            <button onClick={()=>setView("day")} className={`px-4 py-2 font-semibold transition-colors border-l border-stone-300 ${view==="day"?"bg-[#556B3D] text-white":"bg-white text-stone-600 hover:bg-stone-50"}`}>Day</button>
          </div>
        </div>
        <div className="flex gap-6 items-start">
          {renderSidebar()}
          {view==="month" ? renderMonthView() : renderDayView()}
        </div>
      </main>
    </div>
  );
}
