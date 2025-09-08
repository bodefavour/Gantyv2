// Temporary replacement clean version to restore functionality
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Calendar, Users, TrendingUp, ChevronDown, Download, Expand, Minimize, ArrowUpDown, Circle, CheckCircle, BarChart3, Table, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import BoardView from './projects/BoardView';
import ListView from './projects/ListView';
import CalendarView from './projects/CalendarView';
import WorkloadView from './projects/WorkloadView';
import PeopleView from './projects/PeopleView';
import CreateProjectModal from '../modals/CreateProjectModal';
import TaskDetailsModal from '../modals/TaskDetailsModal';

interface Project { id: string; name: string; description: string | null; start_date: string; end_date: string | null; status: string; progress: number; created_at: string; }
interface Task { id: string; project_id: string; parent_id: string | null; name: string; description: string | null; start_date: string; end_date: string; duration: number; progress: number; status: string; priority: string; assigned_to: string | null; created_by?: string | null; estimated_hours?: number | null; actual_hours?: number | null; created_at: string; }
interface Dependency { id?: string; predecessor_id: string; successor_id: string; type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'; lag: number; }

const viewTabs = [ 'gantt','board','list','calendar','workload','people','dashboard'] as const;

export default function ProjectsView() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [projects,setProjects] = useState<Project[]>([]);
  const [tasks,setTasks] = useState<Task[]>([]);
  const [members,setMembers] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [activeView,setActiveView] = useState<string>(()=> localStorage.getItem('projectsActiveView')||'gantt');
  const [currentDate,setCurrentDate]=useState(new Date());
  const [newTaskName,setNewTaskName]=useState('');
  const [addingTask,setAddingTask]=useState(false);
  const [selectedProject,setSelectedProject]=useState<string|null>(null);
  const [showCreateProjectModal,setShowCreateProjectModal]=useState(false);
  const [expanded,setExpanded]=useState(true); const [sortAsc,setSortAsc]=useState(true);
  const [showOnlyMine,setShowOnlyMine]=useState(false); const [dayScaleIndex,setDayScaleIndex]=useState(1);
  const [detailTaskId,setDetailTaskId]=useState<string|null>(null);
  const [dragging,setDragging]=useState<{id:string;originX:number;start:Date;end:Date}|null>(null);
  const [resizing,setResizing]=useState<{id:string;originX:number;start:Date;end:Date;edge:'start'|'end'}|null>(null);
  const [multiSelect,setMultiSelect]=useState<string[]>([]);
  const [creatingDependency,setCreatingDependency]=useState<{fromTaskId:string}|null>(null);
  const [zoomLevel,setZoomLevel]=useState<'day'|'week'|'month'>('day');
  const [dependencies,setDependencies]=useState<Dependency[]>([]);
  const [criticalPath,setCriticalPath]=useState<Set<string>>(new Set());
  const [showCriticalPath,setShowCriticalPath]=useState(false);
  const [multiDragOriginals,setMultiDragOriginals]=useState<Record<string,{start:Date;end:Date}>|null>(null);
  const [feedback,setFeedback]=useState<{open:boolean;title:string;message:string;type:'success'|'error'|'info'}>({open:false,title:'',message:'',type:'info'});
  const [taskOptions,setTaskOptions]=useState<{open:boolean;task:Task|null}>({open:false,task:null});
  const showModalMsg=(title:string,message:string,type:'success'|'error'|'info'='info')=>setFeedback({open:true,title,message,type});
  const closeModalMsg=()=>setFeedback(p=>({...p,open:false}));
  const ganttScrollRef=useRef<HTMLDivElement|null>(null);

  useEffect(()=>{ if(currentWorkspace&&user) fetchData(); },[currentWorkspace,user]);
  useEffect(()=>{ localStorage.setItem('projectsActiveView',activeView); },[activeView]);

  async function fetchData(){
    if(!currentWorkspace||!user){ setLoading(false); return; }
    setLoading(true);
    const client = supabaseAdmin || supabase;
    try {
      const { data: proj, error: pe }:any = await client.from('projects').select('*').eq('workspace_id', currentWorkspace.id).order('created_at',{ascending:false});
      if(pe) throw pe; setProjects(proj||[]);
      if((proj||[]).length && !selectedProject) setSelectedProject(proj[0].id);
      if((proj||[]).length){
        const ids = proj.map((p:any)=>p.id);
        const { data: tks, error: te }:any = await client.from('tasks').select('*').in('project_id', ids).order('start_date');
        if(te) throw te; setTasks(tks||[]);
        if((tks||[]).length){
          const { data: deps, error: de }:any = await client.from('task_dependencies').select('*').in('predecessor_id', tks.map((t:any)=>t.id));
          if(!de) setDependencies(deps||[]);
        }
      }
    } catch(e:any){ console.error(e); showModalMsg('Load error', e.message||'Failed load','error'); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ if(!showCriticalPath){ setCriticalPath(new Set()); return; } const rel=dependencies.filter(d=>d.type==='finish_to_start'); const preds:Record<string,string[]>={}; tasks.forEach(t=>preds[t.id]=[]); rel.forEach(d=>preds[d.successor_id].push(d.predecessor_id)); const memo:Record<string,{len:number;prev:string|null}>={}; const dur=(t:Task)=> Math.max(1, differenceInDays(new Date(t.end_date),new Date(t.start_date))+1); const dfs=(id:string)=>{ if(memo[id]) return memo[id]; const p=preds[id]; if(!p.length){ return memo[id]={len:dur(tasks.find(t=>t.id===id)!),prev:null}; } let bestPrev:string|null=null; let best=0; p.forEach(pid=>{ const r=dfs(pid); if(r.len>best){ best=r.len; bestPrev=pid; } }); return memo[id]={len:best+dur(tasks.find(t=>t.id===id)!), prev:bestPrev}; }; tasks.forEach(t=>dfs(t.id)); let end: string|undefined; let mx=0; Object.entries(memo).forEach(([id,v])=>{ if(v.len>mx){ mx=v.len; end=id; } }); const path=new Set<string>(); while(end){ path.add(end); end=memo[end].prev||undefined; } setCriticalPath(path); },[showCriticalPath,tasks,dependencies]);

  const dateRange = React.useMemo(()=>{ const baseStart=startOfWeek(startOfMonth(addDays(currentDate,-7))); const baseEnd=endOfWeek(endOfMonth(addDays(currentDate,60))); if(zoomLevel==='day') return eachDayOfInterval({start:baseStart,end:baseEnd}); if(zoomLevel==='week'){ const ds=eachDayOfInterval({start:baseStart,end:baseEnd}); return ds.filter(d=>d.getDay()===1);} const ds=eachDayOfInterval({start:baseStart,end:baseEnd}); return ds.filter(d=>d.getDate()===1); },[currentDate,zoomLevel]);
  const dayWidth = React.useMemo(()=> zoomLevel==='day' ? ([24,32,48][dayScaleIndex]||32) : zoomLevel==='week' ? 80 : 120,[zoomLevel,dayScaleIndex]);
  const visibleDays = React.useMemo(()=> dateRange.slice(0, zoomLevel==='day'?62:(zoomLevel==='week'?26:14)),[dateRange,zoomLevel]);

  const tasksForRender = React.useMemo(()=>{ let arr=[...tasks]; if(showOnlyMine&&user?.id) arr=arr.filter(t=>t.assigned_to===user.id); arr.sort((a,b)=> new Date(a.start_date).getTime()-new Date(b.start_date).getTime()); return arr; },[tasks,showOnlyMine,user?.id]);

  function getTaskPosition(task:Task){ const s=new Date(task.start_date); const e=new Date(task.end_date); if(zoomLevel==='day'){ const idx=dateRange.findIndex(d=>format(d,'yyyy-MM-dd')===format(s,'yyyy-MM-dd')); const dur=differenceInDays(e,s)+1; return { left: Math.max(0, idx*dayWidth), width: Math.max(dayWidth, dur*dayWidth)}; } if(zoomLevel==='week'){ const monday=(d:Date)=>{ const nd=new Date(d); const day=nd.getDay(); const diff=(day===0?-6:1)-day; nd.setDate(nd.getDate()+diff); return new Date(nd.getFullYear(),nd.getMonth(),nd.getDate()); }; const sw=monday(s); const ew=monday(e); const weeks=dateRange; const si=weeks.findIndex(d=>format(d,'yyyy-MM-dd')===format(sw,'yyyy-MM-dd')); const ei=weeks.findIndex(d=>format(d,'yyyy-MM-dd')===format(ew,'yyyy-MM-dd')); const span=(ei-si)+1; return { left: Math.max(0, si*dayWidth), width: Math.max(dayWidth, span*dayWidth)};} const sm=format(s,'yyyy-MM'); const em=format(e,'yyyy-MM'); const months=dateRange.map(d=>format(d,'yyyy-MM')); const si=months.findIndex(m=>m===sm); const ei=months.findIndex(m=>m===em); const span=(ei-si)+1; return { left: Math.max(0, si*dayWidth), width: Math.max(dayWidth, span*dayWidth)}; }

  const projectColorMap = React.useMemo(()=>{ const palette=['bg-blue-500','bg-indigo-500','bg-teal-500','bg-rose-500','bg-amber-500','bg-emerald-500','bg-fuchsia-500']; const map:Record<string,string>={}; projects.forEach((p,i)=>{ map[p.id]=palette[i%palette.length]; }); return map; },[projects]);

  const updateTaskDates = async (id:string, start:Date, end:Date) => { try { await (supabase as any).from('tasks').update({ start_date:format(start,'yyyy-MM-dd'), end_date:format(end,'yyyy-MM-dd'), duration: differenceInDays(end,start)+1 }).eq('id',id); setTasks(prev=>prev.map(t=>t.id===id?{...t,start_date:format(start,'yyyy-MM-dd'), end_date:format(end,'yyyy-MM-dd'), duration:differenceInDays(end,start)+1}:t)); } catch(e:any){ console.error(e); showModalMsg('Update error', e.message||'Failed update','error'); } };
  const deleteTask = async (id:string)=>{ try { await (supabase as any).from('tasks').delete().eq('id',id); setTasks(prev=>prev.filter(t=>t.id!==id)); showModalMsg('Deleted','Task deleted','success'); } catch(e:any){ showModalMsg('Delete error', e.message||'Failed delete','error'); } };

  useEffect(()=>{ const up=(e:MouseEvent)=>{ if(dragging){ const delta=Math.round((e.clientX-dragging.originX)/dayWidth); if(delta!==0){ if(multiDragOriginals && multiSelect.length>1){ multiSelect.forEach(id=>{ const orig=multiDragOriginals[id]; if(orig) updateTaskDates(id, addDays(orig.start,delta), addDays(orig.end,delta)); }); } else { updateTaskDates(dragging.id, addDays(dragging.start,delta), addDays(dragging.end,delta)); } } setDragging(null); setMultiDragOriginals(null);} if(resizing){ const delta=Math.round((e.clientX-resizing.originX)/dayWidth); const start = resizing.edge==='start'? addDays(resizing.start,delta):resizing.start; const end = resizing.edge==='end'? addDays(resizing.end,delta):resizing.end; updateTaskDates(resizing.id,start,end); setResizing(null);} }; window.addEventListener('mouseup',up); return ()=>window.removeEventListener('mouseup',up); },[dragging,resizing,dayWidth,multiDragOriginals,multiSelect]);

  const addTask = async ()=>{ if(!newTaskName.trim()) return; const project = selectedProject? projects.find(p=>p.id===selectedProject): projects[0]; if(!project||!user||!currentWorkspace) return; setAddingTask(true); try { const start=new Date(); const end=addDays(start,7); const client=supabaseAdmin||supabase; const { data, error }:any = await client.from('tasks').insert({ workspace_id: currentWorkspace.id, project_id: project.id, name:newTaskName.trim(), description:null, start_date:format(start,'yyyy-MM-dd'), end_date:format(end,'yyyy-MM-dd'), duration:7, progress:0, status:'not_started', priority:'medium', assigned_to:null, created_by:user.id }).select().single(); if(error) throw error; setTasks(prev=>[...prev,data]); setNewTaskName(''); } catch(e:any){ showModalMsg('Add error', e.message||'Failed add','error'); } finally { setAddingTask(false);} };

  if(loading) return <div className='h-full flex items-center justify-center text-gray-500'>Loading...</div>;
  if(!currentWorkspace) return <div className='h-full flex items-center justify-center text-gray-500'>No workspace</div>;

  return (
    <div className='h-full flex flex-col'>
      <div className='bg-white border-b px-6 py-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900'>All Projects</h1>
          <div className='flex gap-2'>
            <button onClick={()=>setShowCreateProjectModal(true)} className='bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1 text-sm'><Plus className='w-4 h-4'/>New</button>
            <button onClick={()=>{ const term=prompt('Search task'); if(!term) return; const found=tasks.filter(t=>t.name.toLowerCase().includes(term.toLowerCase())); showModalMsg('Search', `${found.length} task(s) found`,'info'); }} className='p-2 text-gray-500 hover:text-gray-700'><Search className='w-4 h-4'/></button>
          </div>
        </div>
        <div className='flex gap-1 mt-4'>
          {viewTabs.map(id=> <button key={id} onClick={()=>setActiveView(id)} className={`px-3 py-1.5 text-sm border-b-2 ${activeView===id?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{id}</button> )}
        </div>
      </div>
      {activeView==='gantt' && (
        <div className='flex-1 flex overflow-hidden'>
          <div className='w-96 border-r bg-white flex flex-col'>
            <div className='border-b px-4 py-2 text-sm font-medium flex justify-between'><span>Task name</span><span className='text-gray-500'>Status</span></div>
            <div className='flex-1 overflow-auto divide-y'>
              {projects.map((p,i)=>{
                const pTasks = tasksForRender.filter(t=>t.project_id===p.id);
                return <div key={p.id}>
                  <div className='px-4 py-2 bg-gray-50 text-sm font-semibold flex items-center gap-2'><Calendar className='w-4 h-4 text-gray-400'/><Link to={'#'} className='truncate'>{p.name}</Link></div>
                  {expanded && pTasks.map(t=> <div key={t.id} className='px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50'>
                    <button onClick={()=>setDetailTaskId(t.id)} className='truncate text-left flex-1'>{t.name}</button>
                    <button onClick={()=>setTaskOptions({open:true,task:t})} className='text-gray-400 hover:text-gray-600'><MoreHorizontal className='w-4 h-4'/></button>
                  </div>)}
                </div>;
              })}
            </div>
            <div className='px-4 py-2 space-y-2'>
              <div className='flex items-center gap-2 text-blue-600'>
                <Plus className='w-4 h-4'/>
                <input value={newTaskName} onChange={e=>setNewTaskName(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addTask(); }} placeholder='Add task' className='flex-1 text-sm outline-none'/>
                {newTaskName && <button onClick={addTask} disabled={addingTask} className='text-xs'>{addingTask?'...':'Add'}</button>}
              </div>
            </div>
          </div>
          <div ref={ganttScrollRef} className='flex-1 overflow-auto bg-gray-50'>
            <div className='bg-white border-b sticky top-0 z-10'>
              <div className='flex items-center justify-between px-4 py-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <button onClick={()=>setCurrentDate(addDays(currentDate,-31))} className='p-1 hover:bg-gray-100 rounded'><ChevronLeft className='w-4 h-4'/></button>
                  <span>{format(currentDate,'MMMM yyyy')}</span>
                  <button onClick={()=>setCurrentDate(addDays(currentDate,30))} className='p-1 hover:bg-gray-100 rounded'><ChevronRight className='w-4 h-4'/></button>
                </div>
                <span>{format(addDays(currentDate,30),'MMMM yyyy')}</span>
              </div>
              <div className='h-10 flex border-t border-gray-100'>
                {visibleDays.map((d,i)=>{ const isToday=format(d,'yyyy-MM-dd')===format(new Date(),'yyyy-MM-dd'); return <div key={i} style={{width:dayWidth}} className={`flex-shrink-0 text-center text-[10px] border-r ${isToday?'bg-blue-50 font-semibold':'bg-white'}`}>{format(d,'dd')}</div>; })}
              </div>
            </div>
            <div className='relative' style={{minWidth:visibleDays.length*dayWidth}}>
              <div className='absolute inset-0 pointer-events-none flex' style={{width:visibleDays.length*dayWidth}}>
                {visibleDays.map((d,i)=>{ const isToday=format(d,'yyyy-MM-dd')===format(new Date(),'yyyy-MM-dd'); const isWeekend=[0,6].includes(d.getDay()); return <div key={i} style={{width:dayWidth}} className={`flex-shrink-0 h-full border-r ${isWeekend?'bg-gray-50':'bg-white'} ${isToday?'bg-blue-50/60':''}`}/>; })}
              </div>
              <div className='space-y-1 p-2 relative z-10'>
                {projects.map(p=>{ const pTasks=tasksForRender.filter(t=>t.project_id===p.id); return <div key={p.id}> <div className='h-8'/> {pTasks.map(task=>{ const pos=getTaskPosition(task); const onMouseDown=(e:React.MouseEvent)=>{ if(multiSelect.length>1 && multiSelect.includes(task.id)){ const originals:Record<string,{start:Date;end:Date}>={}; multiSelect.forEach(id=>{ const tt=tasks.find(t=>t.id===id); if(tt) originals[id]={start:new Date(tt.start_date),end:new Date(tt.end_date)};}); setMultiDragOriginals(originals);} else setMultiDragOriginals(null); setDragging({id:task.id,originX:e.clientX,start:new Date(task.start_date),end:new Date(task.end_date)}); }; return <div key={task.id} className='relative h-8 flex items-center'>
                  <div onMouseDown={onMouseDown} onDoubleClick={()=>setDetailTaskId(task.id)} onClick={(e)=>{ if(e.shiftKey){ setMultiSelect(prev=> prev.includes(task.id)? prev.filter(i=>i!==task.id): [...prev,task.id]); return;} setMultiSelect([task.id]); }} onMouseMove={(e)=>{ if(!dragging||dragging.id!==task.id) return; const delta=Math.round((e.clientX-dragging.originX)/dayWidth); if(delta===0) return; if(multiDragOriginals){ setTasks(prev=>prev.map(t=> multiSelect.includes(t.id)?{...t,start_date:format(addDays(multiDragOriginals[t.id].start,delta),'yyyy-MM-dd'), end_date:format(addDays(multiDragOriginals[t.id].end,delta),'yyyy-MM-dd')}:t)); } else { const ns=addDays(dragging.start,delta); const ne=addDays(dragging.end,delta); setTasks(prev=>prev.map(t=> t.id===task.id?{...t,start_date:format(ns,'yyyy-MM-dd'), end_date:format(ne,'yyyy-MM-dd')}:t)); } }} className={`absolute h-5 rounded-sm px-2 flex items-center text-white text-[10px] cursor-pointer ${projectColorMap[task.project_id]} ${dragging?.id===task.id?'opacity-80 ring-2 ring-blue-400':''}`} style={{left:pos.left,width:pos.width}}>{task.name}</div>
                </div>; })}</div>; })}
              </div>
              <svg className='absolute inset-0 pointer-events-none' style={{width:visibleDays.length*dayWidth,height:'100%'}}>
                <defs><marker id='arrow' markerWidth='6' markerHeight='6' refX='5' refY='3' orient='auto'><path d='M0,0 L6,3 L0,6 Z' fill='#64748b'/></marker><marker id='arrow-red' markerWidth='6' markerHeight='6' refX='5' refY='3' orient='auto'><path d='M0,0 L6,3 L0,6 Z' fill='#dc2626'/></marker></defs>
                {dependencies.map((d,i)=>{ const pred=tasks.find(t=>t.id===d.predecessor_id); const succ=tasks.find(t=>t.id===d.successor_id); if(!pred||!succ) return null; const pPos=getTaskPosition(pred); const sPos=getTaskPosition(succ); const ordered=tasksForRender.map(t=>t.id); const pIndex=ordered.indexOf(pred.id); const sIndex=ordered.indexOf(succ.id); const rowHeight=32; const y1=(pIndex+1)*rowHeight+8; const y2=(sIndex+1)*rowHeight+8; const x1=pPos.left+pPos.width; const x2=sPos.left; const mid=x1+(x2-x1)/2; const isCP=showCriticalPath && criticalPath.has(pred.id)&&criticalPath.has(succ.id); return <path key={i} d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`} stroke={isCP?'#dc2626':'#64748b'} strokeWidth={isCP?3:2} fill='none' markerEnd={`url(#${isCP?'arrow-red':'arrow'})`}/>; })}
              </svg>
            </div>
          </div>
        </div>
      )}
      {activeView==='board' && <BoardView tasks={tasks} onUpdateTaskStatus={()=>{}} onAddTask={addTask} />}
      {activeView==='list' && <ListView tasks={tasks} onAddTask={addTask} onAddMilestone={()=>{}} />}
      {activeView==='calendar' && <CalendarView tasks={tasks} currentDate={currentDate} onDateChange={setCurrentDate} />}
      {activeView==='workload' && <WorkloadView members={members} />}
      {activeView==='people' && <PeopleView members={members} onInviteUser={()=>{}} />}

      <CreateProjectModal open={showCreateProjectModal} onClose={()=>setShowCreateProjectModal(false)} onSuccess={(p)=>{ setProjects(prev=>[p,...prev]); fetchData(); }} />
      <TaskDetailsModal open={!!detailTaskId} task={detailTaskId? (tasks.find(t=>t.id===detailTaskId) as any):null} onClose={()=>setDetailTaskId(null)} />
      {taskOptions.open && taskOptions.task && <div className='fixed inset-0 bg-black/40 flex items-center justify-center'>Options</div>}
      {feedback.open && <div className='fixed inset-0 flex items-center justify-center bg-black/40'><div className='bg-white p-4 rounded shadow w-64 text-xs'><div className='font-semibold mb-2'>{feedback.title}</div><div className='mb-4 whitespace-pre-wrap'>{feedback.message}</div><button onClick={closeModalMsg} className='px-2 py-1 bg-blue-600 text-white rounded text-xs'>Close</button></div></div>}
    </div>
  );
}
