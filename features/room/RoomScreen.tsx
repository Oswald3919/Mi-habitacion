'use client';

import Link from 'next/link';
import {
  formatRoomUpdate,
  getLastRoomUpdate,
  ROOM_CHILDREN,
  isRoomItemId,
  ROOM_STATUS_LABEL,
  type RoomEntityId,
  type RoomStatus,
  type RoomZoneId,
} from './domain';
import { useRoom } from './use-room';
import { useRoomRelatedTasks } from './use-room-related-tasks';
import { requestTaskCreationForRoom, requestTaskEdit } from '../tasks/events';

function Dot({ status }: { status: RoomStatus }) {
  return <span className={`dot ${status}`} aria-hidden="true" />;
}

export default function Home() {
  const {
    state, updated, notifications, selected, filter, confirmReset, view, counts,
    overall, currentSelected, visible, setSelected, setFilter, setConfirmReset,
    setStatus, resetDay, toggleNotifications,
  } = useRoom();
  const relatedTasks = useRoomRelatedTasks(selected && isRoomItemId(selected.id) ? selected.id : null);

  return <main className="shell">
    <header className="top"><div><p className="eyebrow">Mi espacio</p><h1>Mi habitación</h1></div><div className="top-actions"><Link className="history-link" href="/metricas" aria-label="Abrir historial" title="Historial"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 2 4-5"/></svg></Link><button className={`notify-button ${notifications?'enabled':''}`} onClick={toggleNotifications} aria-pressed={notifications} aria-label={notifications?'Desactivar avisos':'Activar avisos'} title={notifications?'Avisos activados':'Activar avisos'}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg></button><button className="reset-button" onClick={()=>setConfirmReset(true)}>↻ <span>Reiniciar día</span></button></div></header>
    <section className="daily-summary" aria-label="Resumen de estados"><Summary status="ok" count={counts.ok} text="En orden" active={filter==='ok'} onClick={()=>setFilter('ok')}/><Summary status="review" count={counts.review} text="Revisar" active={false} onClick={()=>setFilter('all')}/><Summary status="attention" count={counts.attention} text="Atención" active={filter==='attention'} onClick={()=>setFilter('attention')}/><div className="overall"><Dot status={overall}/><span>Estado general<br/><b>{ROOM_STATUS_LABEL[overall]}</b></span></div></section>
    <section className="intro"><div><p className="date">HOY · {new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase()}</p><h2>¿Cómo está tu espacio?</h2><p>Toca una zona para actualizarla.</p></div><div className="view-tools"><div className="filters" role="group" aria-label="Filtrar plano">{([['all','Todo'],['attention','Requiere atención'],['ok','En orden']] as const).map(([id,text])=><button key={id} aria-pressed={filter===id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{text}</button>)}</div><div className="status-key" aria-label="Leyenda de estados"><span><Dot status="ok"/>✓ En orden</span><span><Dot status="review"/>— Revisar</span><span><Dot status="attention"/>! Atención</span></div></div></section>
    <section className="room" aria-label="Plano de la habitación"><div className="window" aria-hidden="true"><i/><i/><i/></div>
      <ZoneButton id="bed" name="Cama" status={view.bed} visible={visible(view.bed)} className="bed" onOpen={setSelected}><span className="furniture bed-shape"><i/><i/></span></ZoneButton>
      <ZoneButton id="desk" name="Escritorio" status={view.desk} visible={visible(view.desk)} className="desk" onOpen={setSelected}><span className="furniture desk-shape"><i/><i/><i/></span></ZoneButton>
      <Group id="tv" title="Zona de TV" status={view.tv} visible={visible(view.tv)} className="tv" onOpen={setSelected}><Sub id="tvUnit" name="Mueble de TV" status={state.tvUnit} onOpen={setSelected}/><Sub id="shoeShelf" name="Estantería / mueble de zapatos" status={state.shoeShelf} onOpen={setSelected}/></Group>
      <Group id="closet" title="Clóset" status={view.closet} visible={visible(view.closet)} className="closet" onOpen={setSelected}><div className="closet-grid"><Sub id="dresser" name="Cómoda" status={state.dresser} onOpen={setSelected}/><Sub id="hanging" name="Ropa colgada" status={state.hanging} onOpen={setSelected}/><Sub id="laundry" name="Ropa sucia" status={state.laundry} onOpen={setSelected}/><Sub id="cubbies" name="Cubículos" status={state.cubbies} onOpen={setSelected}/></div></Group><div className="door" aria-hidden="true"><span/></div>
    </section>{filter!=='all'&&counts[filter]===0&&<p className="empty-filter" role="status"><span>✓</span>No hay zonas en “{ROOM_STATUS_LABEL[filter]}”. <button onClick={()=>setFilter('all')}>Ver todo el plano</button></p>}<p className="privacy"><span>✓</span> Todo se guarda únicamente en este dispositivo</p>
    {selected&&<div className="overlay" onMouseDown={()=>setSelected(null)}><section className="sheet" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={event=>event.stopPropagation()}><div className="grabber"/><p className="eyebrow">Cambiar estado</p><h2 id="dialog-title">{selected.name}</h2><p className="last-updated">Última actualización: <b>{formatRoomUpdate(getLastRoomUpdate(selected.id,updated))}</b></p>{ROOM_CHILDREN[selected.id as RoomZoneId]&&<p className="parent-note">Al cambiar esta zona, se actualizarán todas sus subzonas.</p>}<div className="options">{(['ok','review','attention'] as RoomStatus[]).map(status=><button key={status} className={currentSelected===status?'active':''} onClick={()=>setStatus(status)}><Dot status={status}/><span><b>{ROOM_STATUS_LABEL[status]}</b><small>{status==='ok'?'Todo está en su lugar':status==='review'?'Conviene darle un vistazo':'Necesita ordenarse'}</small></span><i>{currentSelected===status?'✓':''}</i></button>)}</div>{isRoomItemId(selected.id)&&<div className="room-related-tasks"><div className="room-related-tasks__heading"><b>Tareas pendientes</b><button onClick={()=>{setSelected(null);requestTaskCreationForRoom(selected.id)}}>+ Agregar tarea</button></div>{relatedTasks.length===0?<p className="room-related-tasks__empty">No hay tareas pendientes para este elemento.</p>:<div className="room-related-tasks__list">{relatedTasks.map(task=><button key={task.id} className="room-related-task" onClick={()=>{setSelected(null);requestTaskEdit(task.id)}}><span>{task.title}</span><b aria-hidden="true">›</b></button>)}</div>}</div>}<button className="cancel" onClick={()=>setSelected(null)}>Cancelar</button></section></div>}
    {confirmReset&&<div className="overlay confirm-overlay" onMouseDown={()=>setConfirmReset(false)}><section className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={event=>event.stopPropagation()}><span className="reset-icon">↻</span><h2 id="confirm-title">¿Reiniciar el día?</h2><p>Solo la cama volverá a “Requiere atención”. El resto de la habitación no cambiará.</p><button className="confirm-action" onClick={resetDay}>Sí, reiniciar la cama</button><button className="cancel" onClick={()=>setConfirmReset(false)}>Cancelar</button></section></div>}
  </main>;
}

function Summary({status,count,text,active,onClick}:{status:RoomStatus;count:number;text:string;active:boolean;onClick:()=>void}){return <button aria-label={`${count} zonas: ${text}`} aria-pressed={active} onClick={onClick} className={active?'active':''}><Dot status={status}/><strong>{count}</strong><span>{text}</span></button>}
function ZoneButton({id,name,status,visible,className,onOpen,children}:{id:RoomEntityId;name:string;status:RoomStatus;visible:boolean;className:string;onOpen:(value:{id:RoomEntityId;name:string})=>void;children:React.ReactNode}){return <button aria-label={`${name}: ${ROOM_STATUS_LABEL[status]}. Abrir detalle`} className={`zone ${className} ${status} ${visible?'':'filtered-out'}`} onClick={()=>onOpen({id,name})}>{children}<span className="zone-label"><Dot status={status}/><b>{name}</b><small><i aria-hidden="true">{status==='ok'?'✓':status==='review'?'—':'!'}</i>{ROOM_STATUS_LABEL[status]}</small></span></button>}
function Group({id,title,status,visible,className,onOpen,children}:{id:RoomZoneId;title:string;status:RoomStatus;visible:boolean;className:string;onOpen:(value:{id:RoomEntityId;name:string})=>void;children:React.ReactNode}){return <section aria-label={`${title}: ${ROOM_STATUS_LABEL[status]}`} className={`zone group ${className} ${status} ${visible?'':'filtered-out'}`}><button aria-label={`${title}: ${ROOM_STATUS_LABEL[status]}. Cambiar toda la zona`} className="group-title" onClick={()=>onOpen({id,name:title})}><Dot status={status}/><div><h3>{title}</h3><p><i aria-hidden="true">{status==='ok'?'✓':status==='review'?'—':'!'}</i>{ROOM_STATUS_LABEL[status]}</p></div><b aria-hidden="true">›</b></button><div className="subzones">{children}</div></section>}
function Sub({id,name,status,onOpen}:{id:RoomEntityId;name:string;status:RoomStatus;onOpen:(value:{id:RoomEntityId;name:string})=>void}){return <button aria-label={`${name}: ${ROOM_STATUS_LABEL[status]}. Abrir detalle`} onClick={()=>onOpen({id,name})}><Dot status={status}/><span><b>{name}</b><small><i aria-hidden="true">{status==='ok'?'✓':status==='review'?'—':'!'}</i>{ROOM_STATUS_LABEL[status]}</small></span><b aria-hidden="true">›</b></button>}
