import {createContext, useContext, useState, type ReactNode} from 'react';
import type {Lang} from './data';
import {workspaceLanguage, workspaceLanguageKey, workspaceText} from './workspace-copy';

const WorkspaceLanguageContext = createContext({
  language: 'en' as Lang,
  setLanguage: (_language:Lang)=>{},
});

export function WorkspaceLanguageProvider({children}:{children:ReactNode}) {
  const [language,setCurrentLanguage] = useState<Lang>(()=>{
    try {return workspaceLanguage(localStorage.getItem(workspaceLanguageKey));} catch {return 'en';}
  });
  const setLanguage=(value:Lang)=>{
    setCurrentLanguage(value);
    try {localStorage.setItem(workspaceLanguageKey,value);} catch {/* The interface still changes when storage is unavailable. */}
  };
  return <WorkspaceLanguageContext.Provider value={{language,setLanguage}}>{children}</WorkspaceLanguageContext.Provider>;
}

export function useWorkspaceLanguage() {
  const {language,setLanguage}=useContext(WorkspaceLanguageContext);
  return {language,setLanguage,t:(message:string,values?:Record<string,string|number>)=>workspaceText(language,message,values)};
}
