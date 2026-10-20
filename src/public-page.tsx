import {useEffect, useState} from 'react';
import {ArrowLeft, ArrowUpRight, BookOpen, Check, CircleAlert, Feather, LoaderCircle, LogIn, UserRound} from 'lucide-react';
import {Logo} from './brand';
import {contentLanguage, isRtl, languages, referenceFor, type Entry, type Lang} from './data';
import {fetchPublishedEntries, type AccessState} from './firebase';
import featuredReading from './featured-reading.json';
import riyadhPreview from './riyadh-reading-preview.json';
import {LanguageSelector} from './language-selector';
import './public-page.css';

type Reading = Pick<Entry, 'id'|'arabic'|'texts'|'explanations'|'source'|'url'|'references'|'provenance'>;

const copy = {
  en: {eyebrow:'A DAILY MOMENT OF REFLECTION', title:'A little goodness,', titleEnd:'every day.', subtitle:'One hadith to read, reflect on, and carry with you.', today:'TODAY’S HADITH', original:'THE ORIGINAL WORDS', translation:'Translation', explanation:'Understanding the hadith', sharh:'EXPLANATION · SHARH', source:'Read the source', credit:'Translation & explanation', footer:'Learn a hadith. Live a sunnah.', login:'Log in', studio:'Open content studio'},
  id: {eyebrow:'SEJENAK UNTUK MERENUNG', title:'Sedikit kebaikan,', titleEnd:'setiap hari.', subtitle:'Satu hadis untuk dibaca, direnungkan, dan diamalkan.', today:'HADIS HARI INI', original:'TEKS ASLI', translation:'Terjemahan', explanation:'Memahami makna hadis', sharh:'PENJELASAN · SYARAH', source:'Baca sumber', credit:'Terjemahan & penjelasan', footer:'Pelajari hadis. Hidupkan sunnah.', login:'Masuk', studio:'Buka studio konten'},
  ms: {eyebrow:'SEJENAK UNTUK MERENUNG', title:'Sedikit kebaikan,', titleEnd:'setiap hari.', subtitle:'Satu hadis untuk dibaca, direnungkan, dan diamalkan.', today:'HADIS HARI INI', original:'TEKS ASAL', translation:'Terjemahan', explanation:'Memahami makna hadis', sharh:'PENJELASAN · SYARAH', source:'Baca sumber', credit:'Terjemahan & penjelasan', footer:'Pelajari hadis. Hidupkan sunnah.', login:'Log masuk', studio:'Buka studio kandungan'},
  ar: {eyebrow:'لحظة للتأمل كل يوم', title:'قليل من الخير،', titleEnd:'كل يوم.', subtitle:'حديث تقرؤه وتتأمله وتعمل به.', today:'حديث اليوم', original:'نص الحديث', translation:'الترجمة', explanation:'فهم معنى الحديث', sharh:'شرح الحديث', source:'اقرأ المصدر', credit:'النص والشرح', footer:'تعلّم حديثًا. وأحيِ سُنّة.', login:'تسجيل الدخول', studio:'افتح استوديو المحتوى'},
  ur: {eyebrow:'ہر روز غور و فکر کا ایک لمحہ', title:'تھوڑی سی نیکی،', titleEnd:'ہر روز۔', subtitle:'ایک حدیث پڑھیں، سمجھیں اور اس پر عمل کریں۔', today:'آج کی حدیث', original:'اصل عربی متن', translation:'ترجمہ', explanation:'حدیث کا مفہوم سمجھیں', sharh:'حدیث کی تشریح', source:'ماخذ پڑھیں', credit:'ترجمہ اور تشریح', footer:'حدیث سیکھیں۔ سنت اپنائیں۔', login:'لاگ ان کریں', studio:'مواد کا اسٹوڈیو کھولیں'},
};

const fallbackNotice:Record<Lang,string>={en:'English shown: translation unavailable.',id:'Bahasa Inggris ditampilkan: terjemahan belum tersedia.',ms:'Bahasa Inggeris dipaparkan: terjemahan belum tersedia.',ar:'يظهر النص الإنجليزي لأن الترجمة غير متوفرة.',ur:'ترجمہ دستیاب نہیں؛ انگریزی متن دکھایا جا رہا ہے۔'};
const previewCopy:Record<Lang,{label:string;back:string}>={en:{label:'SOURCE PREVIEW',back:'Back to today’s hadith'},id:{label:'CONTOH RUJUKAN',back:'Kembali ke hadis hari ini'},ms:{label:'CONTOH RUJUKAN',back:'Kembali ke hadis hari ini'},ar:{label:'معاينة المصدر',back:'العودة إلى حديث اليوم'},ur:{label:'ماخذ کا پیش نظارہ',back:'آج کی حدیث پر واپس جائیں'}};

function Ornament() {
  return <svg className="reading-rosette" viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="m28 3 7 13 14-3-3 15 7 0-13 7 3 14-15-3v7l-7-13-14 3 3-15H3l13-7-3-14 15 3Z"/><path d="m28 13 15 15-15 15-15-15Z"/><circle cx="28" cy="28" r="5"/></svg>;
}

export function Decorations() {
  return <div className="reading-decoration" aria-hidden="true"><div className="reading-pattern pattern-left"/><div className="reading-pattern pattern-right"/><div className="reading-arch"/></div>;
}

export function ReadingPage({onLogin, busy, checking, approved}: {onLogin:()=>void;busy:boolean;checking:boolean;approved:boolean}) {
  const preview=new URLSearchParams(window.location.search).get('preview')==='riyadh-134';
  const [language,setLanguage]=useState<Lang>(()=>{
    const requested=new URLSearchParams(window.location.search).get('lang');
    if(languages.some(l=>l.code===requested))return requested as Lang;
    try {const saved=localStorage.getItem('one-sunnah-reading-language');return languages.some(l=>l.code===saved)?saved as Lang:'en';} catch {return 'en';}
  });
  const [published,setPublished]=useState<Entry[]>([]);
  useEffect(()=>{if(preview)return;let active=true;void fetchPublishedEntries().then(rows=>{if(active)setPublished(rows);}).catch(()=>{/* The attributed bundled reading remains available offline. */});return()=>{active=false;};},[preview]);
  const available=published.filter(entry=>entry.status==='Published'&&entry.reviewed===true&&entry.source?.trim()&&entry.url?.startsWith('https://')&&entry.texts?.en?.trim()&&entry.explanations?.en?.trim()).sort((a,b)=>a.id.localeCompare(b.id));
  const date=new Date();
  const day=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
  const reading:Reading=preview?riyadhPreview:available.length?available[day%available.length]:featuredReading;
  const text=copy[language];
  const displayedLanguage=contentLanguage(reading,language);
  const reference=referenceFor(reading,language);
  const dateLabel=new Intl.DateTimeFormat(language==='ms'?'ms-MY':language,{day:'numeric',month:'long',year:'numeric'}).format(date);
  const selectLanguage=(value:Lang)=>{setLanguage(value);if(preview){const url=new URL(window.location.href);url.searchParams.set('lang',value);window.history.replaceState(null,'',url);}try{localStorage.setItem('one-sunnah-reading-language',value);}catch{/* Preference is optional. */}};
  const explanation=reading.explanations?.[displayedLanguage]||'';

  return <div className="reading-shell" dir={isRtl(language)?'rtl':'ltr'} lang={language}>
    <Decorations/>
    <header className="reading-header">
      <Logo/>
      <div className="reading-header-actions">
        <LanguageSelector language={language} onChange={selectLanguage}/>
        <button className="reading-google" aria-label={approved?text.studio:text.login} title={approved?text.studio:text.login} disabled={busy||checking} onClick={onLogin}>{busy||checking?<LoaderCircle size={19} className="reading-spinner"/>:approved?<UserRound size={19}/>:<LogIn size={19}/>}</button>
      </div>
    </header>
    <main className="reading-main">
      {preview&&<aside className="reading-preview-note"><span>{previewCopy[language].label} · Riyadh IslamEnc</span><a href={import.meta.env.BASE_URL}>{previewCopy[language].back} <ArrowUpRight size={12}/></a></aside>}
      <div className="reading-intro"><span className="reading-eyebrow">{text.eyebrow}</span><h1>{text.title}<br/><em>{text.titleEnd}</em></h1><p>{text.subtitle}</p></div>
      <article className="daily-reading" aria-label={preview?previewCopy[language].label:text.today}>
        <div className="reading-date"><span>{preview?previewCopy[language].label:text.today}</span><i/><time dateTime={date.toISOString().slice(0,10)}>{dateLabel}</time></div>
        <div className="reading-divider"><span/><Ornament/><span/></div>
        {reading.arabic&&<div className="reading-arabic" lang="ar" dir="rtl"><span className="reading-sr-only">{text.original}</span><p>{reading.arabic}</p></div>}
        {displayedLanguage!=='ar'&&<section className="reading-translation" aria-label={text.translation}><span className="reading-section-label">{text.translation}</span><p lang={displayedLanguage} dir={isRtl(displayedLanguage)?'rtl':'ltr'}>{reading.texts[displayedLanguage]}</p></section>}
        {displayedLanguage!==language&&<p className="reading-attribution" role="status">{fallbackNotice[language]}</p>}
        <a className="reading-reference" href={reference.url} target="_blank" rel="noreferrer"><BookOpen size={14}/><span>{reference.label}</span><ArrowUpRight size={13}/></a>
        {explanation&&<section className="reading-explanation" aria-labelledby="explanation-heading"><div className="reading-explanation-heading"><Feather size={22}/><span className="reading-eyebrow">{text.sharh}</span><h2 id="explanation-heading">{text.explanation}</h2></div><div className="reading-explanation-text" lang={displayedLanguage} dir={isRtl(displayedLanguage)?'rtl':'ltr'}>{explanation.split(/\n+/).filter(Boolean).map((paragraph,i)=><p key={i}>{paragraph}</p>)}<a href={reference.url} target="_blank" rel="noreferrer">{text.source} <ArrowUpRight size={14}/></a></div></section>}
        <p className="reading-attribution">{explanation?text.credit:text.translation} · <a href={reference.url} target="_blank" rel="noreferrer">{reference.publisher||reading.provenance?.publisher||'One Sunnah'}</a>{reference.version&&<> · {reference.version}</>}</p>
      </article>
    </main>
    <footer className="reading-footer"><span>One Sunnah</span><span>{text.footer}</span><span>EN · ID · MS · AR · UR</span></footer>
  </div>;
}

export function AccessResultPage({access,error,onBack}: {access:AccessState;error:string;onBack:()=>void}) {
  const sent=access.status==='pending'&&!error;
  const rejected=access.status==='rejected'&&!error;
  return <div className="reading-shell request-shell"><Decorations/><header className="reading-header"><Logo/></header><main className="request-main"><div className={`request-symbol ${sent?'request-sent':''}`}>{sent?<Check size={30}/>:<CircleAlert size={30}/>}</div><span className="reading-eyebrow">{sent?'REQUEST RECEIVED':rejected?'WORKSPACE ACCESS':'SIGN-IN UPDATE'}</span><h1>{sent?'Your request has been sent.':rejected?'Access has not been approved.':'We couldn’t complete your request.'}</h1><p>{sent?'Your Google account is awaiting approval from the workspace owner. You can return to today’s hadith while your request is reviewed.':rejected?'This Google account does not currently have permission to open the content studio. You can still enjoy today’s hadith.':error||'Please return to the reading page and try signing in again.'}</p>{sent&&access.email&&<span className="request-email">{access.email}</span>}<button className="request-back" onClick={onBack}><ArrowLeft size={17}/>Back to today’s hadith</button></main><footer className="reading-footer"><span>One Sunnah</span><span>Learn a hadith. Live a sunnah.</span></footer></div>;
}
