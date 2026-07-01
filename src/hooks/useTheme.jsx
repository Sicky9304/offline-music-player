// Production Theme Hook Template
// This file extends the existing API while remaining compatible.

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { THEMES, ACCENT_COLORS, DEFAULT_THEME_ID, DEFAULT_ACCENT_ID } from "../data/themes.js";
import { ipc } from "../utils/ipc.js";

const ThemeContext = createContext(null);

const DEFAULT_ENGINE = {
  glassIntensity: 0.8,
  blurStrength: 24,
  borderRadius: 28,
  animations: true,
  dynamicAlbumTheme: true,
  typography: "Outfit",
};

export function ThemeProvider({ children }) {
  const [themeId,setThemeId]=useState(DEFAULT_THEME_ID);
  const [accentId,setAccentId]=useState(DEFAULT_ACCENT_ID);
  const [engine,setEngine]=useState(DEFAULT_ENGINE);
  const [customThemes, setCustomThemes] = useState([]);

  const allThemes = useMemo(() => [...THEMES, ...customThemes], [customThemes]);

  const applyTheme=useCallback((tId,aId,options=engine)=>{
    const root=document.documentElement;
    const theme=allThemes.find(t=>t.id===tId)||THEMES[0];
    const accent=ACCENT_COLORS.find(a=>a.id===aId)||ACCENT_COLORS[0];

    Object.entries(theme.vars).forEach(([k,v])=>{
      if(root.style.getPropertyValue(k)!==v){
        root.style.setProperty(k,v);
      }
    });

    root.style.setProperty("--accent",accent.hex);
    root.style.setProperty("--accent-hsl",accent.hsl);

    generateShades(accent.hex).forEach((c,i)=>{
      const keys=[50,100,200,300,400,500,600,700,800,900];
      root.style.setProperty(`--accent-${keys[i]}`,c);
    });

    root.style.setProperty("--glass-opacity",options.glassIntensity);
    root.style.setProperty("--glass-blur",`${options.blurStrength}px`);
    root.style.setProperty("--radius",`${options.borderRadius}px`);
    root.style.setProperty("--font-family", options.typography || "Outfit");

    root.classList.remove("light","dark");
    root.classList.add(tId.startsWith("light") || tId === "light" ? "light" : "dark");
  }, [engine, allThemes]);

  useEffect(() => {
    (async () => {
      try {
        const all = await ipc.settings.getAll();
        setThemeId(all.themeId || DEFAULT_THEME_ID);
        setAccentId(all.accentId || DEFAULT_ACCENT_ID);
        
        const savedCustom = all.customThemes ? JSON.parse(all.customThemes) : [];
        setCustomThemes(savedCustom);
        
        const savedEngine = {
          glassIntensity: all.glassIntensity !== undefined ? Number(all.glassIntensity) : DEFAULT_ENGINE.glassIntensity,
          blurStrength: all.blurStrength !== undefined ? Number(all.blurStrength) : DEFAULT_ENGINE.blurStrength,
          borderRadius: all.borderRadius !== undefined ? Number(all.borderRadius) : DEFAULT_ENGINE.borderRadius,
          animations: all.animations !== undefined ? (all.animations === 'true' || all.animations === true) : DEFAULT_ENGINE.animations,
          dynamicAlbumTheme: all.dynamicAlbumTheme !== undefined ? (all.dynamicAlbumTheme === 'true' || all.dynamicAlbumTheme === true) : DEFAULT_ENGINE.dynamicAlbumTheme,
          typography: all.typography !== undefined ? all.typography : DEFAULT_ENGINE.typography,
        };
        setEngine(savedEngine);

        const activeThemeList = [...THEMES, ...savedCustom];
        const tId = all.themeId || DEFAULT_THEME_ID;
        const aId = all.accentId || DEFAULT_ACCENT_ID;
        
        const root = document.documentElement;
        const theme = activeThemeList.find(t => t.id === tId) || THEMES[0];
        const accent = ACCENT_COLORS.find(a => a.id === aId) || ACCENT_COLORS[0];

        Object.entries(theme.vars).forEach(([k,v])=>{
          root.style.setProperty(k,v);
        });

        root.style.setProperty("--accent",accent.hex);
        root.style.setProperty("--accent-hsl",accent.hsl);

        generateShades(accent.hex).forEach((c,i)=>{
          const keys=[50,100,200,300,400,500,600,700,800,900];
          root.style.setProperty(`--accent-${keys[i]}`,c);
        });

        root.style.setProperty("--glass-opacity",savedEngine.glassIntensity);
        root.style.setProperty("--glass-blur",`${savedEngine.blurStrength}px`);
        root.style.setProperty("--radius",`${savedEngine.borderRadius}px`);
        root.style.setProperty("--font-family", savedEngine.typography || "Outfit");

        root.classList.remove("light","dark");
        root.classList.add(tId.startsWith("light") || tId === "light" ? "light" : "dark");
      } catch (e) {
        applyTheme(DEFAULT_THEME_ID, DEFAULT_ACCENT_ID);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTheme=useCallback(async(id)=>{
    setThemeId(id);
    applyTheme(id,accentId);
    await ipc.settings.set("themeId",id);
  },[accentId,applyTheme]);

  const changeAccent=useCallback(async(id)=>{
    setAccentId(id);
    applyTheme(themeId,id);
    await ipc.settings.set("accentId",id);
  },[themeId,applyTheme]);

  const updateEngine=useCallback(async(key,value)=>{
    const next={...engine,[key]:value};
    setEngine(next);
    applyTheme(themeId,accentId,next);
    await ipc.settings.set(key,value);
  },[engine,themeId,accentId,applyTheme]);

  const resetTheme=useCallback(async()=>{
    setEngine(DEFAULT_ENGINE);
    setThemeId(DEFAULT_THEME_ID);
    setAccentId(DEFAULT_ACCENT_ID);
    setCustomThemes([]);
    await ipc.settings.set("customThemes", JSON.stringify([]));
    applyTheme(DEFAULT_THEME_ID,DEFAULT_ACCENT_ID,DEFAULT_ENGINE);
  },[applyTheme]);

  const importCustomTheme=useCallback(async(themeData)=>{
    const themeToSave = {
      id: `custom-${Date.now()}`,
      name: themeData.name || "Custom Theme",
      description: themeData.description || "User imported theme",
      preview: themeData.preview || themeData.vars?.['--bg-primary'] || "#1e1e2f",
      vars: themeData.vars,
    };
    const nextCustom = [...customThemes, themeToSave];
    setCustomThemes(nextCustom);
    await ipc.settings.set("customThemes", JSON.stringify(nextCustom));
    
    setThemeId(themeToSave.id);
    await ipc.settings.set("themeId", themeToSave.id);

    const root=document.documentElement;
    Object.entries(themeToSave.vars).forEach(([k,v])=>{
      root.style.setProperty(k,v);
    });

    root.classList.remove("light","dark");
    root.classList.add("dark");
  }, [customThemes]);

  const value=useMemo(()=>({
    themeId,
    accentId,
    themes:allThemes,
    accents:ACCENT_COLORS,
    engine,
    changeTheme,
    changeAccent,
    updateEngine,
    resetTheme,
    applyTheme,
    importCustomTheme
  }),[themeId,accentId,allThemes,engine,changeTheme,changeAccent,updateEngine,resetTheme,applyTheme,importCustomTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(){
  const ctx=useContext(ThemeContext);
  if(!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// Helpers

function hexToHsl(hex){
  const r=parseInt(hex.slice(1,3),16)/255;
  const g=parseInt(hex.slice(3,5),16)/255;
  const b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}
  else{
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r:h=((g-b)/d+(g<b?6:0))/6;break;
      case g:h=((b-r)/d+2)/6;break;
      default:h=((r-g)/d+4)/6;
    }
  }
  return [h*360,s*100,l*100];
}

function hslToHex(h,s,l){
  s/=100;l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  const toHex=x=>Math.round(255*x).toString(16).padStart(2,"0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function generateShades(hex){
  const [h,s]=hexToHsl(hex);
  return [97,93,85,74,62,49,39,30,22,14].map(l=>hslToHex(h,s*0.9,l));
}
