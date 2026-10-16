import {useEffect, useState} from 'react';
import {Check, CheckCircle2, Clock3, LoaderCircle, RefreshCw, Search, ShieldCheck, UsersRound, X} from 'lucide-react';
import {reviewAccessRequest, watchAccessRequests, type AccessRequest} from './firebase';
import './workspace-access.css';

const dateLabel=(date:Date|null)=>date?new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric'}).format(date):'Just now';

export function OwnerAccessPage({currentUid}: {currentUid:string}) {
  const [requests,setRequests]=useState<AccessRequest[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [filter,setFilter]=useState<'pending'|'approved'|'rejected'>('pending');
  const [search,setSearch]=useState('');
  const [retry,setRetry]=useState(0);
  const [decision,setDecision]=useState<{request:AccessRequest;status:'approved'|'rejected'}|null>(null);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    setLoading(true);setError('');
    return watchAccessRequests(rows=>{setRequests(rows);setLoading(false);},()=>{setError('Access requests couldn’t be loaded. Check your connection and owner access, then try again.');setLoading(false);});
  },[retry]);
  const rows=requests.filter(row=>row.status===filter&&`${row.displayName} ${row.email}`.toLowerCase().includes(search.toLowerCase()));
  const decide=async()=>{
    if(!decision||saving)return;
    setSaving(true);setError('');
    try{
      await reviewAccessRequest(decision.request.uid,decision.status);
      setNotice(`${decision.request.email} ${decision.status==='approved'?'now has editor access.':'was declined.'}`);
      setDecision(null);
    }catch{setError('The request couldn’t be updated. It may have already been reviewed, or your owner access has changed. Refresh and try again.');}
    finally{setSaving(false);}
  };
  return <section className="owner-access">
    <div className="owner-access-summary"><div><ShieldCheck size={23}/><div><strong>A trusted space, thoughtfully shared.</strong><p>Review Google sign-ups and welcome editors into your workspace.</p></div></div><span className="owner-role"><ShieldCheck size={13}/>Owner only</span></div>
    <div className="panel owner-request-panel">
      <div className="owner-access-toolbar"><div className="tabs" aria-label="Request status">{(['pending','approved','rejected'] as const).map(status=><button key={status} className={filter===status?'selected':''} aria-pressed={filter===status} onClick={()=>setFilter(status)}>{status==='pending'?'Pending':status==='approved'?'Approved':'Declined'}<span>{requests.filter(row=>row.status===status).length}</span></button>)}</div><button className="owner-refresh" onClick={()=>setRetry(value=>value+1)} disabled={loading||saving} aria-label="Refresh access requests"><RefreshCw size={16}/></button></div>
      <div className="owner-search"><label className="search"><Search size={17}/><input placeholder="Search name or email…" aria-label="Search access requests" value={search} onChange={event=>setSearch(event.target.value)}/></label></div>
      {notice&&<p className="owner-notice" role="status"><CheckCircle2 size={16}/>{notice}</p>}
      {error&&<p className="owner-error" role="alert">{error}<button onClick={()=>setRetry(value=>value+1)}>Try again</button></p>}
      {loading?<div className="owner-empty" role="status"><LoaderCircle size={26} className="reading-spinner"/><h3>Loading access requests…</h3></div>:!error&&!rows.length?<div className="owner-empty"><UsersRound size={30}/><h3>{search?'No matching accounts':filter==='pending'?'You’re all caught up.':filter==='approved'?'No approved accounts yet.':'No declined requests.'}</h3><p>{search?'Try another name or email.':filter==='pending'?'New sign-up requests will appear here for your review.':'Accounts will appear here after a review.'}</p></div>:<div className="owner-request-list">{rows.map(row=><article className="owner-request-row" key={row.uid}>
        <div className="owner-person-avatar" aria-hidden="true">{(row.displayName||row.email||'?').slice(0,1).toUpperCase()}</div>
        <div className="owner-person"><strong>{row.displayName||'Google account'}{row.uid===currentUid&&<small>You</small>}</strong><span>{row.email}</span><p>{row.status==='pending'?<Clock3 size={12}/>:<CheckCircle2 size={12}/>}<span>{row.status==='pending'?`Requested ${dateLabel(row.requestedAt)}`:row.reviewedAt?`Reviewed ${dateLabel(row.reviewedAt)}`:`Joined ${dateLabel(row.requestedAt)}`}</span></p></div>
        {row.status==='pending'&&row.uid!==currentUid&&row.role!=='owner'?<div className="owner-decisions"><button className="owner-decline" disabled={saving} onClick={()=>{setError('');setDecision({request:row,status:'rejected'});}}><X size={15}/>Decline</button><button className="primary" disabled={saving} onClick={()=>{setError('');setDecision({request:row,status:'approved'});}}><Check size={15}/>Approve</button></div>:<span className={`owner-member-role ${row.role==='owner'?'is-owner':''}`}>{row.status==='rejected'?'Declined':row.role==='owner'?'Owner':'Editor'}</span>}
      </article>)}</div>}
    </div>
    <p className="owner-access-footnote"><ShieldCheck size={15}/>Approved members can manage content and translations. Only owners can review access requests.</p>
    {decision&&<div className="modal-backdrop" onClick={()=>!saving&&setDecision(null)}><section className="owner-confirm" role="dialog" aria-modal="true" aria-labelledby="review-heading" onClick={event=>event.stopPropagation()} onKeyDown={event=>{if(event.key==='Escape'&&!saving)setDecision(null);}}>
      <ShieldCheck size={27}/><h2 id="review-heading">{decision.status==='approved'?'Approve workspace access?':'Decline this request?'}</h2><p><strong>{decision.request.displayName||'This account'}</strong><span>{decision.request.email}</span></p><p>{decision.status==='approved'?'This person will be able to create, edit, and publish content as an editor.':'This person will be unable to enter the content studio. They can still read the public daily hadith.'}</p>{error&&<p className="login-error" role="alert">{error}</p>}<div><button className="secondary" disabled={saving} onClick={()=>setDecision(null)}>Cancel</button><button autoFocus className="primary" disabled={saving} onClick={()=>void decide()}>{saving?'Saving…':decision.status==='approved'?'Approve access':'Decline request'}</button></div>
    </section></div>}
  </section>;
}
