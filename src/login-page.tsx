import {ArrowLeft, ArrowRight, Feather, LoaderCircle, ShieldCheck} from 'lucide-react';
import {GoogleMark, Logo} from './brand';
import {Decorations} from './public-page';
import type {AccessState} from './firebase';
import './workspace-access.css';

export function LoginPage({mode, access, error, busy, onMode, onSubmit, onBack, onSwitchAccount}: {
  mode: 'login' | 'signup';
  access: AccessState;
  error: string;
  busy: boolean;
  onMode: (mode: 'login' | 'signup') => void;
  onSubmit: () => void;
  onBack: () => void;
  onSwitchAccount: () => void;
}) {
  const signup = mode === 'signup';
  const approved = access.status === 'approved';
  return <div className="reading-shell login-shell">
    <Decorations/>
    <header className="reading-header"><Logo/><button className="login-back" aria-label="Back to today’s hadith" onClick={onBack} disabled={busy}><ArrowLeft size={16}/><span>Today’s hadith</span></button></header>
    <main className="login-main">
      <div className="login-flourish"><span/><Feather size={25}/><span/></div>
      <span className="reading-eyebrow">ONE SUNNAH · CONTENT STUDIO</span>
      <h1>{signup?<>A little contribution.<br/><em>A lasting impact.</em></>:<>Welcome back.<br/><em>Let goodness grow.</em></>}</h1>
      <p className="login-intro">{signup?'Join a thoughtful space to curate, translate, and share the Sunnah.':'Log in to your workspace and help bring meaningful reminders to more people.'}</p>
      <section className="login-form" aria-labelledby="login-heading" aria-busy={busy}>
        <h2 id="login-heading">{signup?'Request your workspace access':approved?'Your workspace is ready':'Log in to One Sunnah'}</h2>
        <p>{signup?'Sign up with your Google account. The workspace owner will review your request before you can enter the studio.':'Continue with your approved Google account.'}</p>
        {access.email&&<div className="login-identity"><span>{access.displayName||'Google account'}</span><strong>{access.email}</strong><button onClick={onSwitchAccount} disabled={busy}>Use another account</button></div>}
        {access.status==='not_requested'&&!signup&&<p className="login-hint" role="status">This account hasn’t requested access yet. Choose Sign up to send a request.</p>}
        {error&&<p className="login-error" role="alert">{error}</p>}
        <button className="login-google-button" disabled={busy} onClick={onSubmit}>
          {busy?<LoaderCircle size={20} className="reading-spinner"/>:approved?<ArrowRight size={20}/>:<GoogleMark/>}
          {busy?'Please wait…':approved?'Open workspace':signup?'Sign up with Google':access.email?'Check workspace access':'Log in with Google'}
        </button>
        {!approved&&<div className="login-switch"><span>{signup?'Already have access?':'New to the studio?'}</span><button onClick={()=>onMode(signup?'login':'signup')} disabled={busy}>{signup?'Log in':'Sign up'}<ArrowRight size={14}/></button></div>}
        <div className="login-trust"><ShieldCheck size={16}/><p>{signup?'Your Google name and email are shared with the owner for approval.':'Workspace access is granted by the owner.'}</p></div>
      </section>
    </main>
    <footer className="reading-footer"><span>One Sunnah</span><span>Learn a hadith. Live a sunnah.</span></footer>
  </div>;
}
