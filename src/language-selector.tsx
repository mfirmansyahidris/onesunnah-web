import {useEffect, useId, useRef, useState, type KeyboardEvent} from 'react';
import {Check, ChevronDown, Globe2} from 'lucide-react';
import {isRtl, languages, type Lang} from './data';

const labels: Record<Lang,string> = {en:'Reading language',id:'Bahasa bacaan',ms:'Bahasa bacaan',ar:'لغة القراءة',ur:'مطالعے کی زبان'};
const interfaceLabels: Record<Lang,string> = {en:'Interface language',id:'Bahasa antarmuka',ms:'Bahasa antara muka',ar:'لغة الواجهة',ur:'انٹرفیس کی زبان'};
const shortNames: Record<Lang,string> = {en:'English',id:'Indonesia',ms:'Melayu',ar:'العربية',ur:'اردو'};

export function LanguageSelector({language,onChange,purpose='reading'}: {language:Lang;onChange:(language:Lang)=>void;purpose?:'reading'|'interface'}) {
  const label=(purpose==='interface'?interfaceLabels:labels)[language];
  const [open,setOpen]=useState(false);
  const selectedIndex=languages.findIndex(item=>item.code===language);
  const [activeIndex,setActiveIndex]=useState(selectedIndex);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const options=useRef<(HTMLButtonElement|null)[]>([]);
  const menuId=useId();

  useEffect(()=>{
    if(!open)return;
    const dismiss=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    document.addEventListener('pointerdown',dismiss);
    return()=>document.removeEventListener('pointerdown',dismiss);
  },[open]);
  useEffect(()=>{if(open)options.current[activeIndex]?.focus();},[open,activeIndex]);

  const show=()=>{setActiveIndex(selectedIndex);setOpen(true);};
  const close=()=>{setOpen(false);trigger.current?.focus();};
  const select=(code:Lang)=>{onChange(code);close();};
  const navigate=(event:KeyboardEvent<HTMLDivElement>)=>{
    if(!open)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
    else if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();setActiveIndex(index=>(index+(event.key==='ArrowDown'?1:-1)+languages.length)%languages.length);
    }else if(event.key==='Home'||event.key==='End'){
      event.preventDefault();setActiveIndex(event.key==='Home'?0:languages.length-1);
    }else if(event.key.length===1&&/[a-z]/i.test(event.key)){
      const index=languages.findIndex(item=>item.name.toLowerCase().startsWith(event.key.toLowerCase()));
      if(index>=0){event.preventDefault();setActiveIndex(index);}
    }
  };

  return <div className="reading-language" ref={root} onKeyDown={navigate} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
    <button className="language-trigger" type="button" ref={trigger} aria-label={`${label}: ${languages[selectedIndex].native}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>open?close():show()} onKeyDown={event=>{if(!open&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();show();}}}>
      <Globe2 size={15}/><span className="language-trigger-label" lang={language} dir="auto">{shortNames[language]}</span><span className="language-trigger-code">{language.toUpperCase()}</span><ChevronDown size={12} className={open?'language-chevron is-open':'language-chevron'}/>
    </button>
    {open&&<div className="language-popover">
      <div className="language-popover-heading" lang={language} dir="auto">{label}</div>
      <div id={menuId} role="listbox" aria-label={label} className="language-options">
        {languages.map((item,index)=><button key={item.code} type="button" role="option" aria-selected={item.code===language} tabIndex={index===activeIndex?0:-1} ref={element=>{options.current[index]=element;}} className={`language-option ${item.code===language?'is-selected':''}`} onFocus={()=>setActiveIndex(index)} onClick={()=>select(item.code)}>
          <span className="language-code" aria-hidden="true">{item.code.toUpperCase()}</span>
          <span className="language-option-name"><span lang={item.code} dir={isRtl(item.code)?'rtl':'ltr'}>{item.native}</span>{item.native!==item.name&&<small>{item.name}</small>}</span>
          {item.code===language&&<Check size={15} className="language-check" aria-hidden="true"/>}
        </button>)}
      </div>
    </div>}
  </div>;
}
