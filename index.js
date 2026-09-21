// 剪报拼贴诗 - SillyTavern Extension
jQuery(async () => {

    if (!window.html2canvas) {
        await new Promise(function(resolve, reject) {
            var s = document.createElement('script');
            try { s.src = new URL('./lib/html2canvas.min.js', import.meta.url).href; }
            catch(e) { s.src = '/scripts/extensions/third-party/st-blackout-poetry/lib/html2canvas.min.js'; }
            s.onload = resolve;
            s.onerror = function() {
                var s2 = document.createElement('script');
                s2.src = 'https://cdn.staticfile.org/html2canvas/1.4.1/html2canvas.min.js';
                s2.onload = resolve; s2.onerror = reject; document.head.appendChild(s2);
            };
            document.head.appendChild(s);
        });
    }

    var FONT_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600&display=swap';
    var fl = document.createElement('link'); fl.href = FONT_HREF; fl.rel = 'stylesheet'; document.head.appendChild(fl);

    var customFonts = [];
    var BP_DB_NAME = 'bp-blackout-poetry', BP_DB_STORE = 'appdata', BP_DB_VERSION = 1;
    function openBpDB(){ return new Promise(function(res,rej){ var r=indexedDB.open(BP_DB_NAME,BP_DB_VERSION); r.onupgradeneeded=function(e){var db=e.target.result;if(!db.objectStoreNames.contains(BP_DB_STORE))db.createObjectStore(BP_DB_STORE);}; r.onsuccess=function(e){res(e.target.result);}; r.onerror=function(e){rej(e.target.error);}; }); }
    function saveCustomFontsToStorage(){ openBpDB().then(function(db){db.transaction(BP_DB_STORE,'readwrite').objectStore(BP_DB_STORE).put(customFonts,'customFonts');}).catch(function(){}); }
    function loadCustomFontsFromStorage(){ return openBpDB().then(function(db){ return new Promise(function(res){var r=db.transaction(BP_DB_STORE,'readonly').objectStore(BP_DB_STORE).get('customFonts');r.onsuccess=function(e){if(Array.isArray(e.target.result))customFonts=e.target.result;res();};r.onerror=function(){res();};}); }).catch(function(){}); }
    await loadCustomFontsFromStorage();
    function injectCustomFonts(){ var el=document.getElementById('bp-custom-fonts');if(!el){el=document.createElement('style');el.id='bp-custom-fonts';document.head.appendChild(el);}el.textContent=customFonts.map(function(f){return f.rule;}).join('\n'); }
    injectCustomFonts();

    var BP_BUBBLE_KEY='bp-show-bubble',BP_BUBBLE_POS_KEY='bp-bubble-pos',BP_BUBBLE_IMG_KEY='bp-bubble-img';
    var showBubble=localStorage.getItem(BP_BUBBLE_KEY)!=='false';
    var bubblePos=null;try{bubblePos=JSON.parse(localStorage.getItem(BP_BUBBLE_POS_KEY));}catch(e){}
    var bubbleCustomImg=localStorage.getItem(BP_BUBBLE_IMG_KEY)||'';

    var currentCutShape='default',syncShapeToScrap=false,customSymbol='',customShapeDataUrl=null;
    var SHAPE_CLIPS={'default':'','square':'','circle':'circle(48% at 50% 50%)','star5':'polygon(50% 5%,61% 35%,95% 35%,68% 55%,78% 88%,50% 68%,22% 88%,32% 55%,5% 35%,39% 35%)','star4':'polygon(50% 5%,60% 40%,95% 50%,60% 60%,50% 95%,40% 60%,5% 50%,40% 40%)','star8':'polygon(50% 5%,56% 30%,76% 12%,70% 38%,95% 38%,76% 50%,95% 62%,70% 62%,76% 88%,56% 70%,50% 95%,44% 70%,24% 88%,30% 62%,5% 62%,24% 50%,5% 38%,30% 38%,24% 12%,44% 30%)','raindrop':'polygon(50% 5%,56% 15%,68% 35%,78% 52%,80% 62%,78% 72%,72% 82%,62% 90%,50% 95%,38% 90%,28% 82%,22% 72%,20% 62%,22% 52%,32% 35%,44% 15%)','puzzle':''};
    var PUZZLE_VARIANTS=['polygon(0% 0%,38% 0%,38% 8%,44% 14%,56% 14%,62% 8%,62% 0%,100% 0%,100% 38%,92% 38%,86% 44%,86% 56%,92% 62%,100% 62%,100% 100%,0% 100%)','polygon(0% 0%,100% 0%,100% 38%,92% 38%,86% 44%,86% 56%,92% 62%,100% 62%,100% 100%,62% 100%,62% 92%,56% 86%,44% 86%,38% 92%,38% 100%,0% 100%)','polygon(0% 0%,100% 0%,100% 100%,62% 100%,62% 92%,56% 86%,44% 86%,38% 92%,38% 100%,0% 100%,0% 62%,8% 62%,14% 56%,14% 44%,8% 38%,0% 38%)','polygon(0% 0%,38% 0%,38% 8%,44% 14%,56% 14%,62% 8%,62% 0%,100% 0%,100% 100%,0% 100%,0% 62%,8% 62%,14% 56%,14% 44%,8% 38%,0% 38%)'];
    function getRandomPuzzleClip(){return PUZZLE_VARIANTS[Math.floor(Math.random()*PUZZLE_VARIANTS.length)];}
    function getClipForShape(s){if(s==='puzzle')return getRandomPuzzleClip();return SHAPE_CLIPS[s]||'';}

    var SHAPE_SVGS={'default':'<svg viewBox="0 0 16 16"><rect x="3" y="2" width="10" height="12" rx="1" fill="#333"/></svg>','square':'<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#333"/></svg>','circle':'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#333"/></svg>','star5':'<svg viewBox="0 0 16 16"><polygon points="8,1 10,6 15.5,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 0.5,6 6,6" fill="#333"/></svg>','star4':'<svg viewBox="0 0 16 16"><polygon points="8,0 10,6 16,8 10,10 8,16 6,10 0,8 6,6" fill="#333"/></svg>','star8':'<svg viewBox="0 0 16 16"><polygon points="8,0 9.2,4.5 12.6,1.6 11.5,6.2 16,6 12.4,8 16,10 11.5,9.8 12.6,14.4 9.2,11.5 8,16 6.8,11.5 3.4,14.4 4.5,9.8 0,10 3.6,8 0,6 4.5,6.2 3.4,1.6 6.8,4.5" fill="#333"/></svg>','raindrop':'<svg viewBox="0 0 16 16"><path d="M8,1C8,1 13,7 13,10.5C13,13.5 10.8,16 8,16C5.2,16 3,13.5 3,10.5C3,7 8,1 8,1Z" fill="#333"/></svg>','puzzle':'<svg viewBox="0 0 16 16"><path d="M1,1H6V3.5Q5,3.5 5,5Q5,6.5 6,6.5V10H1ZM7,1H11V3Q12,3 12,4.5Q12,6 11,6V10H7V6.5Q8,6.5 8,5Q8,3.5 7,3.5Z" fill="#333"/></svg>','symbol':'<svg viewBox="0 0 16 16"><text x="8" y="12" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">A</text></svg>','image':'<svg viewBox="0 0 16 16"><rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="#333" stroke-width="1.2"/><circle cx="5" cy="7" r="1.5" fill="#333"/><polyline points="1,13 6,8 9,11 11,9 15,13" fill="none" stroke="#333" stroke-width="1"/></svg>'};

    var defaultText="我们讨论爱就像讨论牡蛎：盲目，伪装，愚钝，嫉羡，隐于黑暗、不为人道的部分，才是让爱成为爱本身的东西。爱之于你我，就像泥沙之于牡蛎，痛苦忍耐，最后流出几滴眼泪。有人说，咦，原来你有这么多珍珠呀。";
    var topBgDataUrl='';

    var CSS_TEXT=`
#bp-app-container{
    --page-bg:#F5F5F7;--top-bg:#FFFFFF;--top-bg-img:none;--top-cut-color:rgba(0,0,0,0.06);
    --top-font-size:13px;--top-grain-opacity:0;--top-font-family:'Noto Serif SC',serif;
    --bottom-bg:#111111;--bottom-bg-img:none;--scrap-bg:#FFFFFF;
    --scrap-font-size:13px;--bottom-grain-opacity:0;--scrap-font-family:'Noto Serif SC',serif;
    --shared-text-color:#1A1A1A;--scrap-text-color:#1A1A1A;--wm-color:#999999;
    position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:var(--page-bg);
    z-index:999999;display:none;flex-direction:column;align-items:center;justify-content:center;overflow-y:auto;
    padding:20px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
#bp-app-container,#bp-app-container *,#bp-app-container *::before,#bp-app-container *::after{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none;}
#bp-app-container input[type="file"],#bp-app-container input[type="color"],#bp-app-container input[type="text"],#bp-app-container input[type="checkbox"],#bp-app-container input[type="range"],#bp-app-container select,#bp-app-container textarea{user-select:auto!important;-webkit-user-select:auto!important;pointer-events:auto!important;-webkit-tap-highlight-color:transparent;}
#bp-app-container #bp-toolbar{display:flex;justify-content:space-between;padding:0 14px;margin-bottom:14px;width:100%;max-width:440px;flex-shrink:0;}
#bp-app-container #bp-toolbar>div{display:flex;align-items:center;gap:6px;}
#bp-app-container .icon-btn{width:34px;height:34px;display:flex;justify-content:center;align-items:center;cursor:pointer;background:rgba(255,255,255,0.92);border:1px solid rgba(0,0,0,0.08);border-radius:4px;backdrop-filter:blur(8px);box-shadow:0 4px 15px rgba(0,0,0,0.04);transition:all 0.2s ease;}
#bp-app-container .icon-btn:hover{background:#FFF;border-color:#000;}
#bp-app-container .icon-btn svg{width:16px;height:16px;stroke:#1C1C1C;stroke-width:1.6;fill:none;}
#bp-app-container .bp-bar{width:14px;height:1.5px;background-color:#1C1C1C;}
#bp-app-container #common-mask{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:1998;display:none;opacity:0;transition:opacity 0.25s ease;}
#bp-app-container #common-mask.visible{display:block;opacity:1;}
#bp-app-container #drawer{position:fixed;top:0;left:-370px;width:350px;height:100vh;background:rgba(255,255,255,0.98);border-right:1px solid rgba(0,0,0,0.08);backdrop-filter:blur(20px);box-shadow:10px 0 35px rgba(0,0,0,0.04);z-index:1999;display:flex;flex-direction:column;padding:75px 20px 30px 20px;overflow-y:auto;transition:left 0.3s cubic-bezier(0.22,1,0.36,1);color:#222;font-size:11.5px;}
#bp-app-container #drawer.open{left:0;}
#bp-app-container #settings-drawer{position:fixed;top:0;right:-370px;width:340px;height:100vh;background:rgba(255,255,255,0.98);border-left:1px solid rgba(0,0,0,0.08);backdrop-filter:blur(20px);box-shadow:-10px 0 35px rgba(0,0,0,0.04);z-index:1999;display:flex;flex-direction:column;padding:75px 20px 30px 20px;overflow-y:auto;transition:right 0.3s cubic-bezier(0.22,1,0.36,1);color:#222;font-size:11.5px;}
#bp-app-container #settings-drawer.open{right:0;}
#bp-app-container .drawer-section{margin-bottom:18px;border-bottom:1px solid rgba(0,0,0,0.06);padding-bottom:14px;}
#bp-app-container .drawer-section:last-child{border-bottom:none;}
#bp-app-container .section-title{font-size:9.5px;letter-spacing:0.1em;color:#888;margin-bottom:8px;font-weight:600;text-transform:uppercase;}
#bp-app-container .color-group-label{font-size:9px;color:#999;margin:4px 0 2px 0;}
#bp-app-container .color-palette-row{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:5px;}
#bp-app-container .color-dot{height:20px;border-radius:2px;border:1px solid rgba(0,0,0,0.1);cursor:pointer;transition:transform 0.15s;}
#bp-app-container .color-dot:hover{transform:scale(1.1);z-index:2;}
#bp-app-container .color-picker-wrapper{display:flex;align-items:center;gap:6px;margin:4px 0 8px 0;background:#F4F4F4;padding:4px 8px;border-radius:2px;}
#bp-app-container .color-picker-input{width:22px;height:22px;border:none;padding:0;cursor:pointer;background:none;}
#bp-app-container .grid-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:6px;}
#bp-app-container .action-chip{background:#F4F4F4;border:1px solid rgba(0,0,0,0.05);color:#333;padding:6px 0;text-align:center;border-radius:2px;cursor:pointer;font-size:10px;transition:all 0.15s;}
#bp-app-container .action-chip:hover,#bp-app-container .action-chip.active{background:#1C1C1C;color:#FFF;}
#bp-app-container label.file-label{display:block;cursor:pointer;-webkit-tap-highlight-color:transparent;}
#bp-app-container label.file-label input[type="file"]{display:none;}
#bp-app-container .slider-row{display:flex;align-items:center;justify-content:space-between;margin-top:6px;}
#bp-app-container .slider-row span{color:#777;font-size:9.5px;}
#bp-app-container .slider-row input[type="range"]{width:130px;accent-color:#000;}
#bp-app-container .slider-val{min-width:30px;text-align:right;font-size:9px;color:#999;}
#bp-app-container .sub-panel-box{background:#FBFBFB;border:1px solid #EBEBEB;border-radius:4px;padding:10px;margin-top:8px;}
#bp-app-container .sub-panel-title{font-size:10px;font-weight:600;color:#1C1C1C;margin-bottom:6px;display:flex;justify-content:space-between;}
#bp-app-container .font-compact-list{display:flex;flex-direction:column;gap:4px;margin-bottom:8px;max-height:110px;overflow-y:auto;}
#bp-app-container .font-compact-item{display:flex;align-items:center;justify-content:space-between;background:#FFF;border:1px solid #E5E5E5;border-radius:2px;padding:4px 8px;cursor:pointer;transition:all 0.15s ease;}
#bp-app-container .font-compact-item:hover{border-color:#1C1C1C;}
#bp-app-container .font-compact-item.selected{border-color:#1C1C1C;background:#F0F0F0;font-weight:600;}
#bp-app-container .font-name-col{font-size:10px;color:#444;}
#bp-app-container .setting-field{margin-bottom:12px;}
#bp-app-container .setting-input{width:100%;background:#F7F7F7;border:1px solid #E5E5E5;padding:6px 8px;font-size:11px;border-radius:2px;outline:none;color:#111;}
#bp-app-container .setting-toggle-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
#bp-app-container #poster-canvas{box-shadow:0 12px 45px rgba(0,0,0,0.08);position:relative;display:flex;flex-direction:column;border:1px solid rgba(0,0,0,0.06);touch-action:none;width:440px;flex-shrink:0;}
#bp-app-container #poster-canvas.layout-horizontal{flex-direction:row!important;width:auto!important;}
#bp-app-container #source-area{background-color:var(--top-bg);background-image:var(--top-bg-img);background-size:cover;background-position:center;padding:40px 36px 30px 36px;position:relative;flex-shrink:0;height:auto;font-family:var(--top-font-family);}
#bp-app-container #poster-canvas.layout-horizontal #source-area{width:360px;}
#bp-app-container .text-flow{color:var(--shared-text-color);font-size:var(--top-font-size);line-height:2.2;letter-spacing:0.06em;text-align:justify;word-break:break-all;}
#bp-app-container .char-node{cursor:pointer;position:relative;display:inline-block;transition:transform 0.1s ease;}
#bp-app-container .char-node:hover:not(.is-cut){opacity:0.5;}
#bp-app-container .char-node.is-cut{color:transparent!important;}
#bp-app-container .char-node.is-cut::after{content:"";position:absolute;top:50%;left:50%;width:1em;height:1.2em;transform:translate(-50%,-50%);background-color:var(--top-cut-color);border-radius:1px;}
#bp-app-container .char-node.is-cut.shape-square::after{width:1.1em;height:1.1em;}
#bp-app-container .char-node.is-cut.shape-clip::after{width:1.3em;height:1.3em;clip-path:var(--cut-clip);-webkit-clip-path:var(--cut-clip);border-radius:0;}
#bp-app-container .char-node.is-cut.shape-symbol::after{content:attr(data-symbol);width:auto;height:auto;background:transparent;display:flex;align-items:center;justify-content:center;color:var(--top-cut-color);font-size:0.85em;opacity:0.7;border-radius:0;transform:translate(-50%,-50%);}
#bp-app-container #collage-area{position:relative;background-color:var(--bottom-bg);background-image:var(--bottom-bg-img);background-size:cover;background-position:center;border-top:1px solid rgba(0,0,0,0.04);flex-shrink:0;min-height:120px;min-width:180px;overflow:hidden;font-family:var(--scrap-font-family);padding-bottom:35px;}
#bp-app-container #poster-canvas.layout-horizontal #collage-area{border-top:none;border-left:1px solid rgba(0,0,0,0.04);}
#bp-app-container #poster-canvas.swapped #source-area{order:2;}
#bp-app-container #poster-canvas.swapped #collage-area{order:1;}
#bp-app-container #collage-resizer{position:absolute;z-index:1000;display:flex;align-items:center;justify-content:center;}
#bp-app-container #poster-canvas:not(.layout-horizontal) #collage-resizer{bottom:0;left:0;width:100%;height:12px;cursor:ns-resize;}
#bp-app-container #poster-canvas:not(.layout-horizontal) #collage-resizer::after{content:"";width:32px;height:3px;background:rgba(255,255,255,0.3);border-radius:2px;}
#bp-app-container #poster-canvas.layout-horizontal #collage-resizer{right:0;top:0;width:12px;height:100%;cursor:ew-resize;}
#bp-app-container #poster-canvas.layout-horizontal #collage-resizer::after{content:"";width:3px;height:32px;background:rgba(255,255,255,0.3);border-radius:2px;}
#bp-app-container .scrap-word{position:absolute;color:var(--scrap-text-color);padding:5px 6px;font-size:var(--scrap-font-size);line-height:1.2;cursor:grab;font-family:inherit;touch-action:none;z-index:10;display:inline-flex;justify-content:center;align-items:center;text-align:center;white-space:nowrap;background:transparent;}
#bp-app-container .scrap-word::before{content:"";position:absolute;inset:-1px;background-color:var(--scrap-bg);background-image:var(--scrap-bg-img,none);background-size:var(--scrap-bg-size,auto);background-position:var(--scrap-bg-pos,center);border-radius:1px;box-shadow:1px 2px 5px rgba(0,0,0,0.2);z-index:-1;}
#bp-app-container .scrap-word.shape-square::before{border-radius:0;}
#bp-app-container .scrap-word.shape-clip::before{clip-path:var(--scrap-clip);-webkit-clip-path:var(--scrap-clip);inset:-4px;border-radius:0;}
#bp-app-container .scrap-word:active{cursor:grabbing;}
#bp-app-container .scrap-word:active::before{box-shadow:2px 6px 14px rgba(0,0,0,0.3);}
#bp-app-container .texture-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:overlay;z-index:800;}
#bp-app-container #top-texture{opacity:var(--top-grain-opacity);}
#bp-app-container #bottom-texture{opacity:var(--bottom-grain-opacity);}
#bp-app-container #poster-bottom-meta{position:absolute;bottom:12px;left:0;width:100%;display:flex;justify-content:center;align-items:center;gap:8px;font-size:8.5px;letter-spacing:0.1em;color:var(--wm-color);opacity:0.45;pointer-events:none;}
#bp-app-container .bp-float-panel{position:fixed;top:calc(env(safe-area-inset-top,0px)+50px);left:14px;width:220px;background:rgba(255,255,255,0.98);border:1px solid rgba(0,0,0,0.08);border-radius:6px;backdrop-filter:blur(20px);box-shadow:0 8px 30px rgba(0,0,0,0.08);z-index:2006;padding:10px;display:none;color:#222;font-size:11px;}
#bp-app-container .bp-float-panel.open{display:block;}
#bp-app-container .shape-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px;}
#bp-app-container .shape-item{width:100%;aspect-ratio:1;background:#F4F4F4;border:1.5px solid transparent;border-radius:4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all 0.15s;}
#bp-app-container .shape-item:hover{border-color:#999;}
#bp-app-container .shape-item.active{border-color:#1C1C1C;background:#E8E8E8;}
#bp-app-container .shape-item svg{width:16px;height:16px;fill:#333;stroke:none;}
#bp-app-container .shape-item .shape-label{font-size:7px;color:#888;line-height:1;}
#bp-app-container .shape-extra{border-top:1px solid rgba(0,0,0,0.06);padding-top:8px;margin-top:4px;}
#bp-app-container .shape-extra .setting-toggle-row{font-size:10px;}
#bp-app-container .layout-grid{display:flex;gap:6px;}
#bp-app-container .layout-grid .action-chip{flex:1;padding:8px 4px;font-size:10px;}
#bp-bubble-btn{position:fixed;background:transparent;border:none;box-shadow:none;z-index:9990;display:flex;justify-content:center;align-items:center;cursor:pointer;font-size:26px;line-height:1;padding:0;opacity:0.85;-webkit-tap-highlight-color:transparent;touch-action:none;}
#bp-bubble-btn .bp-bubble-img{width:32px;height:32px;border-radius:50%;object-fit:cover;}
#bp-bubble-btn:active{opacity:1;}
#bp-sel-popup{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(28,28,28,0.92);color:#fff;padding:8px 16px;border-radius:20px;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:12px;display:none;align-items:center;gap:6px;cursor:pointer;backdrop-filter:blur(6px);}
#bp-cssfont-mask{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:2147483000;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;}
#bp-cssfont-box{background:#fff;border-radius:10px;padding:18px;max-width:480px;width:100%;box-sizing:border-box;}
#bp-cssfont-box textarea{-webkit-user-select:auto;user-select:auto;}
    `;
    var css=document.createElement('style');css.textContent=CSS_TEXT;document.head.appendChild(css);
    var container=document.createElement('div');container.id='bp-app-container';
    container.innerHTML='<svg style="display:none;"><defs><filter id="tex-frosted-filter"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" stitchTiles="stitch"/></filter><filter id="tex-noise-filter"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch"/></filter><filter id="tex-paper-filter"><feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="5" result="noise"/><feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter><filter id="tex-fabric-filter"><feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves="3" stitchTiles="stitch"/></filter><filter id="tex-scratch-filter"><feTurbulence type="turbulence" baseFrequency="0.01 0.4" numOctaves="2" stitchTiles="stitch"/></filter></defs></svg>'
    +'<div id="bp-toolbar"><div><div class="icon-btn" onclick="closeBpApp()"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></div><div class="icon-btn" onclick="toggleDrawer()"><div style="display:flex;flex-direction:column;gap:3px;align-items:center;"><div class="bp-bar"></div><div class="bp-bar"></div><div class="bp-bar"></div></div></div><div class="icon-btn" onclick="toggleLayoutPanel()"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="7.5" rx="1.5" stroke="#1C1C1C" stroke-width="1.6"/><rect x="3" y="13.5" width="18" height="7.5" rx="1.5" stroke="#1C1C1C" stroke-width="1.6"/></svg></div><div class="icon-btn" onclick="toggleShapePanel()"><svg viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" stroke-width="1.6"><polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,16.5 5.5,21 7.5,13.5 2,9 9,9" fill="none"/></svg></div></div><div><div class="icon-btn" onclick="toggleSettingsDrawer()"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><div class="icon-btn" onclick="exportPosterImage()"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div></div></div>'
    +'<div id="layout-panel" class="bp-float-panel"></div><div id="shape-panel" class="bp-float-panel"></div>'
    +'<div id="common-mask" onclick="closeAllDrawers()"></div><div id="drawer"></div><div id="settings-drawer"></div>'
    +'<div id="poster-canvas"><div id="source-area"><div class="text-flow" id="textFlow"></div><div class="texture-layer" id="top-texture" style="background:none;"></div></div><div id="collage-area"><div class="texture-layer" id="bottom-texture" style="background:none;"></div><div id="poster-bottom-meta"><span id="bottom-time-span"></span><span id="bottom-wm-span">SillyTavern</span></div><div id="collage-resizer"></div></div></div>';

    container.querySelector('#drawer').innerHTML='<div class="drawer-section"><div class="section-title">1. 壁纸 (原文区)</div><div id="topPaletteContainer"></div><div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="topColorPicker" value="#FFFFFF" onchange="setTopCustomBg(this.value)"><span style="font-size:10px;color:#555;">自定义取色</span></div><label class="action-chip file-label">上传壁纸图片<input type="file" accept="image/*" onchange="uploadTopBg(event)"></label><div style="font-size:9px;color:#888;margin-top:8px;margin-bottom:3px;">纹理质感：</div><div class="grid-buttons"><button class="action-chip active" id="top-tex-none" onclick="setTopTexture(\'none\')">无</button><button class="action-chip" id="top-tex-frosted" onclick="setTopTexture(\'frosted\')">细磨砂</button><button class="action-chip" id="top-tex-noise" onclick="setTopTexture(\'noise\')">胶片噪点</button><button class="action-chip" id="top-tex-paper" onclick="setTopTexture(\'paper\')">粗糙纸纹</button><button class="action-chip" id="top-tex-fabric" onclick="setTopTexture(\'fabric\')">复古布纹</button><button class="action-chip" id="top-tex-scratch" onclick="setTopTexture(\'scratch\')">素描排线</button></div><div class="slider-row"><span>纹理浓度</span><input type="range" min="0" max="70" value="0" id="top-grain-slider" oninput="setTopGrainOpacity(this.value)"></div></div><div class="drawer-section"><div class="section-title">2. 底图 (拼贴区)</div><div id="bottomPaletteContainer"></div><div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="botColorPicker" value="#111111" onchange="setBottomCustomBg(this.value)"><span style="font-size:10px;color:#555;">自定义取色</span></div><label class="action-chip file-label">上传底图图片<input type="file" accept="image/*" onchange="uploadBottomBg(event)"></label><button class="action-chip" style="width:100%;margin-top:6px;" onclick="syncCollageSize()">使拼贴区与原文区等大</button><div style="font-size:9px;color:#888;margin-top:8px;margin-bottom:3px;">纹理质感：</div><div class="grid-buttons"><button class="action-chip active" id="bot-tex-none" onclick="setBottomTexture(\'none\')">无</button><button class="action-chip" id="bot-tex-frosted" onclick="setBottomTexture(\'frosted\')">细磨砂</button><button class="action-chip" id="bot-tex-noise" onclick="setBottomTexture(\'noise\')">胶片噪点</button><button class="action-chip" id="bot-tex-paper" onclick="setBottomTexture(\'paper\')">粗糙纸纹</button><button class="action-chip" id="bot-tex-fabric" onclick="setBottomTexture(\'fabric\')">复古布纹</button><button class="action-chip" id="bot-tex-scratch" onclick="setBottomTexture(\'scratch\')">素描排线</button></div><div class="slider-row"><span>纹理浓度</span><input type="range" min="0" max="70" value="0" id="bot-grain-slider" oninput="setBottomGrainOpacity(this.value)"></div></div><div class="drawer-section"><div class="section-title">3. 字体与颜色</div><div style="font-size:10px;font-weight:600;color:#333;margin-bottom:4px;">文字颜色：</div><div id="textColorPaletteContainer"></div><div class="color-picker-wrapper" style="margin-bottom:10px;"><input type="color" class="color-picker-input" id="textColorPicker" value="#1A1A1A" onchange="setTextColor(this.value)"><span style="font-size:10px;color:#555;">自定义调色</span></div><label class="action-chip file-label" style="background:#EBEBEB;font-weight:600;margin-bottom:6px;">导入本地字体<input type="file" accept=".ttf,.otf,.woff,.woff2" onchange="loadCustomFont(event)"></label><button class="action-chip" style="width:100%;background:#EBEBEB;font-weight:600;margin-bottom:8px;" onclick="openCssFontDialog()">粘贴CSS导入在线字体</button><div class="sub-panel-box"><div class="sub-panel-title"><span>原文区字体</span><span id="top-font-name-label" style="font-size:9px;color:#999;font-weight:normal;">跟随酒馆</span></div><div class="font-compact-list" id="topFontList"></div><div class="slider-row"><span>原文字号</span><input type="range" min="11" max="24" value="13" oninput="setTopFontSize(this.value)"><span class="slider-val" id="top-font-val">13px</span></div></div><div class="sub-panel-box" style="margin-top:8px;"><div class="sub-panel-title"><span>拼贴区字体</span><span id="bottom-font-name-label" style="font-size:9px;color:#999;font-weight:normal;">跟随酒馆</span></div><div class="font-compact-list" id="bottomFontList"></div><div class="slider-row"><span>拼贴字号</span><input type="range" min="11" max="24" value="13" oninput="setScrapFontSize(this.value)"><span class="slider-val" id="bot-font-val">13px</span></div></div></div><div class="drawer-section"><div class="section-title">4. 抠字排版</div><div class="grid-buttons"><button class="action-chip" onclick="arrangeStrictGrid(1)">整齐排1行</button><button class="action-chip" onclick="arrangeStrictGrid(2)">整齐排2行</button><button class="action-chip" style="font-weight:600;border-color:#000;" onclick="arrangeStrictGrid(3)">整齐排3行</button></div><div style="font-size:9px;color:#888;margin-top:4px;">按你放的位置排序</div><button class="action-chip" style="width:100%;margin-top:6px;" onclick="resetCuts()">复原全部字</button></div>';

    container.querySelector('#settings-drawer').innerHTML='<div class="drawer-section"><div class="section-title">悬浮入口</div><div class="setting-toggle-row"><span>显示悬浮按钮（可拖动）</span><input type="checkbox" id="toggle-bubble-cb" onchange="toggleBubbleBtn(this.checked)" style="accent-color:#000;"></div><div style="font-size:9.5px;color:#777;margin-bottom:4px;">自定义悬浮按钮图标：</div><label class="action-chip file-label">上传图标<input type="file" accept="image/*" onchange="uploadBubbleIcon(event)"></label><div id="bubble-icon-preview" style="display:none;margin-top:6px;"><button class="action-chip" style="width:100%;font-size:9px;" onclick="clearBubbleIcon()">恢复默认图标</button></div></div><div class="drawer-section"><div class="section-title">时间与水印</div><div class="setting-toggle-row"><span>显示时间</span><input type="checkbox" id="toggle-time-cb" checked onchange="updateBottomMeta()" style="accent-color:#000;"></div><div style="display:flex;gap:4px;margin-bottom:8px;"><button class="action-chip active" id="btn-time-solar" onclick="setTimeFormat(\'solar\')">公历</button><button class="action-chip" id="btn-time-lunar" onclick="setTimeFormat(\'lunar\')">干支历</button></div><div class="setting-toggle-row" style="margin-top:14px;"><span>显示水印</span><input type="checkbox" id="toggle-watermark-cb" checked onchange="updateBottomMeta()" style="accent-color:#000;"></div><div class="setting-field"><input type="text" class="setting-input" id="watermark-text-input" value="SillyTavern" oninput="updateBottomMeta()"></div><div style="font-size:9.5px;color:#777;margin-bottom:4px;">水印颜色：</div><div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="wm-color-picker" value="#999999" onchange="setWmColor(this.value)"><span style="font-size:10px;color:#555;">自定义水印颜色</span></div></div>';
    document.body.appendChild(container);

    var cssFontMask=document.createElement('div');cssFontMask.id='bp-cssfont-mask';cssFontMask.innerHTML='<div id="bp-cssfont-box"><div style="font-size:14px;font-weight:600;margin-bottom:10px;color:#222;">粘贴字体CSS</div><div style="font-size:11px;color:#888;margin-bottom:8px;">从字体网站复制@import和font-family</div><input type="text" id="bp-cssfont-name" placeholder="字体名称" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;font-size:13px;"><textarea id="bp-cssfont-css" placeholder="@import url(...);\nfont-family:...;" style="width:100%;box-sizing:border-box;height:120px;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:12px;font-family:monospace;"></textarea><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;"><button class="action-chip" id="bp-cssfont-cancel" style="padding:8px 16px;">取消</button><button class="action-chip" id="bp-cssfont-save" style="padding:8px 16px;background:#1C1C1C;color:#fff;">导入</button></div></div>';document.body.appendChild(cssFontMask);cssFontMask.addEventListener('click',function(e){if(e.target===cssFontMask)cssFontMask.style.display='none';});

    var bubbleBtn=document.createElement('div');bubbleBtn.id='bp-bubble-btn';
    function renderBubbleContent(){if(bubbleCustomImg)bubbleBtn.innerHTML='<img class="bp-bubble-img" src="'+bubbleCustomImg+'">';else bubbleBtn.innerHTML='&#x1FAE7;';}
    renderBubbleContent();bubbleBtn.style.display=showBubble?'flex':'none';
    if(bubblePos){bubbleBtn.style.right='auto';bubbleBtn.style.left=bubblePos.x+'px';bubbleBtn.style.top=bubblePos.y+'px';bubbleBtn.style.transform='none';}else{bubbleBtn.style.right='12px';bubbleBtn.style.top='50%';bubbleBtn.style.transform='translateY(-50%)';}
    (function(){var bd=false,bsx,bsy,box,boy,bm=false;bubbleBtn.addEventListener('touchstart',function(e){bd=true;bm=false;var p=e.touches[0];bsx=p.clientX;bsy=p.clientY;var r=bubbleBtn.getBoundingClientRect();box=r.left;boy=r.top;},{passive:true});window.addEventListener('touchmove',function(e){if(!bd)return;bm=true;var p=e.touches[0];bubbleBtn.style.right='auto';bubbleBtn.style.transform='none';bubbleBtn.style.left=Math.max(0,Math.min(window.innerWidth-40,box+(p.clientX-bsx)))+'px';bubbleBtn.style.top=Math.max(0,Math.min(window.innerHeight-40,boy+(p.clientY-bsy)))+'px';},{passive:true});window.addEventListener('touchend',function(){if(bd){bd=false;if(bm){var r=bubbleBtn.getBoundingClientRect();bubblePos={x:r.left,y:r.top};localStorage.setItem(BP_BUBBLE_POS_KEY,JSON.stringify(bubblePos));}else window.openBpApp(null);}});bubbleBtn.addEventListener('mousedown',function(e){bd=true;bm=false;bsx=e.clientX;bsy=e.clientY;var r=bubbleBtn.getBoundingClientRect();box=r.left;boy=r.top;});window.addEventListener('mousemove',function(e){if(!bd)return;bm=true;bubbleBtn.style.right='auto';bubbleBtn.style.transform='none';bubbleBtn.style.left=Math.max(0,Math.min(window.innerWidth-40,box+(e.clientX-bsx)))+'px';bubbleBtn.style.top=Math.max(0,Math.min(window.innerHeight-40,boy+(e.clientY-bsy)))+'px';});window.addEventListener('mouseup',function(){if(bd){bd=false;if(bm){var r=bubbleBtn.getBoundingClientRect();bubblePos={x:r.left,y:r.top};localStorage.setItem(BP_BUBBLE_POS_KEY,JSON.stringify(bubblePos));}else window.openBpApp(null);}});})();
    document.body.appendChild(bubbleBtn);
    var selPopup=document.createElement('div');selPopup.id='bp-sel-popup';selPopup.innerHTML='<span style="font-size:14px;line-height:1;">&#x1FAE7;</span><span>生成拼贴诗</span>';document.body.appendChild(selPopup);

    var root=container,colorCategories={light:[{name:'复古奶白',bg:'#F7F5F0'},{name:'冷纯白',bg:'#FFFFFF'},{name:'冷灰',bg:'#F2F2F2'},{name:'燕麦',bg:'#F0ECE1'},{name:'灰粉',bg:'#EFE5E3'},{name:'鼠尾草绿',bg:'#E5EADF'}],vintage:[{name:'复古砖红',bg:'#6B2D2B'},{name:'中古墨绿',bg:'#334839'},{name:'油画深蓝',bg:'#203A4C'},{name:'羊皮纸',bg:'#D9CBB7'},{name:'焦糖棕',bg:'#6B442A'},{name:'姜黄',bg:'#C99E5C'}],dark:[{name:'纯黑',bg:'#111111'},{name:'碳墨黑',bg:'#1C1E21'},{name:'沥青灰',bg:'#2B2B2B'},{name:'深黛蓝',bg:'#0F1A24'},{name:'极夜紫',bg:'#1E1524'},{name:'浓缩咖啡',bg:'#241B18'}]};
    var textFlow=document.getElementById('textFlow'),collageArea=document.getElementById('collage-area'),sourceArea=document.getElementById('source-area'),posterCanvas=document.getElementById('poster-canvas'),resizer=document.getElementById('collage-resizer'),drawer=document.getElementById('drawer'),settingsDrawer=document.getElementById('settings-drawer'),commonMask=document.getElementById('common-mask');
    var currentLayout='vertical',currentTimeMode='solar';
    document.getElementById('toggle-bubble-cb').checked=showBubble;
    if(bubbleCustomImg)document.getElementById('bubble-icon-preview').style.display='block';

    window.openBpApp=function(text){
        container.style.display='flex';renderArticle(text||defaultText);
        setTimeout(function(){
            syncCollageSize();updateBottomMeta();
            if(!text){
                collageArea.style.height='120px';
                setTimeout(function(){
                    var allNodes=Array.from(textFlow.querySelectorAll('.char-node'));
                    var cutTargets=['我','爱','你'];var cutNodes=[];
                    cutTargets.forEach(function(ch){for(var i=allNodes.length-1;i>=0;i--){var already=false;for(var j=0;j<cutNodes.length;j++){if(cutNodes[j]===allNodes[i]){already=true;break;}}if(allNodes[i].textContent===ch&&!allNodes[i].classList.contains('is-cut')&&!already){cutNodes.push(allNodes[i]);allNodes[i].click();break;}}});
                    setTimeout(function(){
                        var scraps=Array.from(collageArea.querySelectorAll('.scrap-word:not(.bp-welcome-scrap)'));var ordered=[];
                        cutTargets.forEach(function(ch){for(var i=0;i<scraps.length;i++){var used=false;for(var j=0;j<ordered.length;j++){if(ordered[j]===scraps[i]){used=true;break;}}if(scraps[i].textContent===ch&&!used){ordered.push(scraps[i]);break;}}});
                        if(ordered.length){var rect=collageArea.getBoundingClientRect();var w=ordered[0].offsetWidth||28;var totalW=ordered.length*w+(ordered.length-1)*8;var startX=(rect.width-totalW)/2;var centerY=Math.max(10,(rect.height-35)/2-w/2);ordered.forEach(function(s,i){s.style.transition='all 0.3s ease';s.style.left=(startX+i*(w+8))+'px';s.style.top=centerY+'px';});setTimeout(function(){ordered.forEach(function(s){s.style.transition='';});},350);}
                    },80);
                },120);
            }
        },100);
    };
    window.closeBpApp=function(){container.style.display='none';closeAllDrawers();};

    function toggleBubbleBtn(s){showBubble=s;bubbleBtn.style.display=s?'flex':'none';localStorage.setItem(BP_BUBBLE_KEY,s?'true':'false');}
    function uploadBubbleIcon(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){bubbleCustomImg=ev.target.result;localStorage.setItem(BP_BUBBLE_IMG_KEY,bubbleCustomImg);renderBubbleContent();document.getElementById('bubble-icon-preview').style.display='block';toastr.success('悬浮按钮图标已更新');};r.readAsDataURL(f);}
    function clearBubbleIcon(){bubbleCustomImg='';localStorage.removeItem(BP_BUBBLE_IMG_KEY);renderBubbleContent();document.getElementById('bubble-icon-preview').style.display='none';}
    function swapAreas(){posterCanvas.classList.toggle('swapped');}
    function setWmColor(c){root.style.setProperty('--wm-color',c);}
    function renderLayoutPanel(){document.getElementById('layout-panel').innerHTML='<div style="font-size:9px;color:#888;margin-bottom:6px;font-weight:600;">布局</div><div class="layout-grid"><button class="action-chip '+(currentLayout==='vertical'?'active':'')+'" onclick="switchLayout(\'vertical\')">上下</button><button class="action-chip '+(currentLayout==='horizontal'?'active':'')+'" onclick="switchLayout(\'horizontal\')">左右</button><button class="action-chip" onclick="swapAreas();toggleLayoutPanel();">交换</button></div>';}
    function toggleLayoutPanel(){var p=document.getElementById('layout-panel'),s=document.getElementById('shape-panel');if(p.classList.contains('open'))p.classList.remove('open');else{s.classList.remove('open');renderLayoutPanel();p.classList.add('open');}}
    function renderShapePanel(){var panel=document.getElementById('shape-panel'),shapes=['default','square','circle','star5','star4','star8','raindrop','puzzle','symbol','image'],labels=['默认','方形','圆形','五角星','四芒星','八芒星','雨滴','拼图','符号','导入'],html='<div class="shape-grid">';shapes.forEach(function(s,i){html+='<div class="shape-item '+(currentCutShape===s?'active':'')+'" data-shape="'+s+'">'+SHAPE_SVGS[s]+'<div class="shape-label">'+labels[i]+'</div></div>';});html+='</div><div class="shape-extra"><div class="setting-toggle-row"><span>字块同步形状</span><input type="checkbox" id="sync-shape-cb" '+(syncShapeToScrap?'checked':'')+' style="accent-color:#000;"></div>';html+='<div id="symbol-input-row" style="'+(currentCutShape==='symbol'?'':'display:none;')+'margin-top:6px;"><input type="text" class="setting-input" id="shape-symbol-input" placeholder="输入符号" value="'+(customSymbol||'')+'" maxlength="2" style="text-align:center;font-size:14px;"></div>';html+='<div id="image-input-row" style="'+(currentCutShape==='image'?'':'display:none;')+'margin-top:6px;"><label class="action-chip file-label" style="font-size:9px;">上传图案<input type="file" accept="image/*" onchange="uploadShapeImage(event)"></label></div></div>';panel.innerHTML=html;panel.querySelectorAll('.shape-item').forEach(function(el){el.addEventListener('click',function(){currentCutShape=el.getAttribute('data-shape');applyShapeToAll();renderShapePanel();});});var sc=panel.querySelector('#sync-shape-cb');if(sc)sc.addEventListener('change',function(){syncShapeToScrap=this.checked;applyShapeToAll();});var si=panel.querySelector('#shape-symbol-input');if(si)si.addEventListener('input',function(){customSymbol=this.value;applyShapeToAll();});}
    function toggleShapePanel(){var p=document.getElementById('shape-panel'),l=document.getElementById('layout-panel');if(p.classList.contains('open'))p.classList.remove('open');else{l.classList.remove('open');renderShapePanel();p.classList.add('open');}}
    function getShapeType(s){if(s==='default'||s==='square')return s;if(s==='symbol')return'symbol';if(s==='image')return'image';return'clip';}
    function applyShapeToCut(el){el.classList.remove('shape-square','shape-clip','shape-symbol','shape-image');el.removeAttribute('data-symbol');el.style.removeProperty('--cut-clip');el.style.removeProperty('--cut-mask');var t=getShapeType(currentCutShape);if(t==='square')el.classList.add('shape-square');else if(t==='clip'){el.classList.add('shape-clip');el.style.setProperty('--cut-clip',getClipForShape(currentCutShape));}else if(t==='symbol'){el.classList.add('shape-symbol');el.setAttribute('data-symbol',customSymbol||'x');}else if(t==='image'&&customShapeDataUrl){el.classList.add('shape-image');el.style.setProperty('--cut-mask','url('+customShapeDataUrl+')');}}
    function applyShapeToScrap(el){el.classList.remove('shape-square','shape-clip');el.style.removeProperty('--scrap-clip');if(!syncShapeToScrap)return;var t=getShapeType(currentCutShape);if(t==='square')el.classList.add('shape-square');else if(t==='clip'){el.classList.add('shape-clip');el.style.setProperty('--scrap-clip',getClipForShape(currentCutShape));}}
    function applyShapeToAll(){document.querySelectorAll('#bp-app-container .char-node.is-cut').forEach(applyShapeToCut);document.querySelectorAll('#bp-app-container .scrap-word:not(.bp-welcome-scrap)').forEach(applyShapeToScrap);}
    function uploadShapeImage(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){customShapeDataUrl=ev.target.result;applyShapeToAll();toastr.success('图案已加载');};r.readAsDataURL(f);}
    function getFollowFont(){var m=document.querySelector('.mes_text')||document.querySelector('#chat')||document.body;try{return getComputedStyle(m).fontFamily||'serif';}catch(e){return'serif';}}
    function renderFontLists(){['top','bottom'].forEach(function(z){var c=document.getElementById(z==='top'?'topFontList':'bottomFontList');if(!c)return;c.innerHTML='';var f0=document.createElement('div');f0.className='font-compact-item selected';f0.innerHTML='<div class="font-name-col">跟随酒馆</div>';f0.onclick=function(){setZoneFont(z,'FOLLOW',this,'跟随酒馆');};c.appendChild(f0);customFonts.forEach(function(f){var it=document.createElement('div');it.className='font-compact-item';it.innerHTML='<div class="font-name-col" style="font-family:'+f.family+';">'+f.name+'</div>';it.onclick=function(){setZoneFont(z,f.family,this,f.name);};c.appendChild(it);});});}
    function loadCustomFont(e){var f=e.target.files[0];if(!f)return;var cn=f.name.replace(/\.[^/.]+$/,"").substring(0,10);var r=new FileReader();r.onload=function(ev){var id='BPFont'+Date.now(),du=ev.target.result,rule="@font-face{font-family:'"+id+"';src:url("+du+");}";customFonts.push({id:id,name:cn,family:"'"+id+"'",rule:rule});saveCustomFontsToStorage();injectCustomFonts();renderFontLists();toastr.success('字体['+cn+']已导入');};r.readAsDataURL(f);}
    function openCssFontDialog(){cssFontMask.querySelector('#bp-cssfont-name').value='';cssFontMask.querySelector('#bp-cssfont-css').value='';cssFontMask.style.display='flex';}
    cssFontMask.querySelector('#bp-cssfont-cancel').onclick=function(){cssFontMask.style.display='none';};
    cssFontMask.querySelector('#bp-cssfont-save').onclick=function(){var n=cssFontMask.querySelector('#bp-cssfont-name').value.trim()||'自定义字体',ci=cssFontMask.querySelector('#bp-cssfont-css').value.trim();if(!ci){toastr.error('CSS不能为空');return;}var il='',im=ci.match(/@import[^;]+;/g);if(im)il=im.join('\n');var m=ci.match(/font-family\s*:\s*([^;}\n]+)/),fm=m?m[1].trim():'sans-serif';if(!il){toastr.error('没找到@import');return;}var id='BPFontCss'+Date.now();customFonts.push({id:id,name:n,family:fm,rule:il});saveCustomFontsToStorage();injectCustomFonts();renderFontLists();cssFontMask.style.display='none';toastr.success('字体['+n+']已导入');};
    function getGanZhiDate(d){var tG=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"],dZ=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"],y=d.getFullYear(),o=(y-4)%60;return tG[o%10]+dZ[o%12]+'年 '+tG[d.getMonth()%10]+dZ[(d.getMonth()+2)%12]+'月 '+tG[d.getDate()%10]+dZ[(d.getDate()+4)%12]+'日';}
    function setTimeFormat(m){currentTimeMode=m;document.getElementById('btn-time-solar').classList.toggle('active',m==='solar');document.getElementById('btn-time-lunar').classList.toggle('active',m==='lunar');updateBottomMeta();}
    function updateBottomMeta(){var st=document.getElementById('toggle-time-cb').checked,ts=document.getElementById('bottom-time-span');if(st){ts.style.display='inline';var now=new Date();ts.innerText=currentTimeMode==='solar'?now.getFullYear()+'.'+(now.getMonth()+1)+'.'+now.getDate():getGanZhiDate(now);}else ts.style.display='none';var sw=document.getElementById('toggle-watermark-cb').checked,ws=document.getElementById('bottom-wm-span');ws.style.display=sw?'inline':'none';ws.innerText=document.getElementById('watermark-text-input').value.trim();}
    function toggleDrawer(){if(drawer.classList.contains('open'))closeAllDrawers();else{closeAllDrawers();drawer.classList.add('open');commonMask.classList.add('visible');}}
    function toggleSettingsDrawer(){if(settingsDrawer.classList.contains('open'))closeAllDrawers();else{closeAllDrawers();settingsDrawer.classList.add('open');commonMask.classList.add('visible');}}
    function closeAllDrawers(){drawer.classList.remove('open');settingsDrawer.classList.remove('open');commonMask.classList.remove('visible');document.getElementById('shape-panel').classList.remove('open');document.getElementById('layout-panel').classList.remove('open');}
    function initColorPaletteUI(id,cb){var c=document.getElementById(id);c.innerHTML='';[{label:'浅色系',list:colorCategories.light},{label:'复古色系',list:colorCategories.vintage},{label:'深色系',list:colorCategories.dark}].forEach(function(sec){var lbl=document.createElement('div');lbl.className='color-group-label';lbl.innerText=sec.label;c.appendChild(lbl);var row=document.createElement('div');row.className='color-palette-row';sec.list.forEach(function(cl){var btn=document.createElement('button');btn.className='color-dot';btn.style.backgroundColor=cl.bg;btn.title=cl.name;btn.onclick=function(){cb(cl.bg);};row.appendChild(btn);});c.appendChild(row);});}
    function initTextColorPaletteUI(){var c=document.getElementById('textColorPaletteContainer');var row=document.createElement('div');row.className='color-palette-row';['#1A1A1A','#FFFFFF','#666666','#A0A0A0','#6B2D2B','#334839','#203A4C','#6B442A','#C99E5C','#D9CBB7','#E5EADF','#EFE5E3'].forEach(function(col){var btn=document.createElement('button');btn.className='color-dot';btn.style.backgroundColor=col;btn.onclick=function(){setTextColor(col);};row.appendChild(btn);});c.appendChild(row);}
    function arrangeStrictGrid(tL){var sc=Array.from(collageArea.querySelectorAll('.scrap-word:not(.bp-welcome-scrap)')),ct=sc.length;if(!ct)return;var rect=collageArea.getBoundingClientRect();sc.sort(function(a,b){var ay=parseFloat(a.style.top)||0,by=parseFloat(b.style.top)||0,ax=parseFloat(a.style.left)||0,bx=parseFloat(b.style.left)||0;if(Math.abs(ay-by)<30)return ax-bx;return ay-by;});var first=sc[0],cW=first.offsetWidth||28,cH=first.offsetHeight||28,gX=8,gY=10;var sX=0,sY=0;sc.forEach(function(s){sX+=parseFloat(s.style.left)||0;sY+=parseFloat(s.style.top)||0;});var cX=sX/ct+cW/2,cY=sY/ct+cH/2,aL=Math.min(tL,ct),bs=Math.floor(ct/aL),rm=ct%aL,mC=bs+(rm>0?1:0),mW=mC*cW+(mC-1)*gX,mH=aL*cH+(aL-1)*gY,oX=Math.max(10,Math.min(rect.width-mW-10,cX-mW/2)),oY=Math.max(10,Math.min(rect.height-mH-35,cY-mH/2)),ci=0;for(var l=0;l<aL;l++){var it=bs+(l<rm?1:0),lW=it*cW+(it-1)*gX,lX=oX+(mW-lW)/2,lY=oY+l*(cH+gY);for(var c=0;c<it;c++){var s=sc[ci];if(!s)break;s.style.transition='all 0.32s cubic-bezier(0.2,0.9,0.3,1)';s.style.transform='rotate(0deg)';s.style.opacity='1';s.style.left=(lX+c*(cW+gX))+'px';s.style.top=lY+'px';ci++;}}setTimeout(function(){sc.forEach(function(s){s.style.transition='';});},350);}

    // ===== 改动1: 背景函数补上CSS变量 =====
    function calculateCutColor(hex){var rgb=parseInt(hex.replace('#',''),16);var r=(rgb>>16)&0xff,g=(rgb>>8)&0xff,b=rgb&0xff;return(0.2126*r+0.7152*g+0.0722*b)>140?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.15)';}
    // 把rgba转成不透明hex（导出用）
    function cutColorToOpaque(hex){var rgb=parseInt(hex.replace('#',''),16);var r=(rgb>>16)&0xff,g=(rgb>>8)&0xff,b=rgb&0xff;if((0.2126*r+0.7152*g+0.0722*b)>140)return'#E8E8E8';return'#3A3A3A';}

    function setTopBg(c){
        sourceArea.style.backgroundImage='none';
        root.style.setProperty('--top-bg',c);
        root.style.setProperty('--scrap-bg',c);
        root.style.setProperty('--top-cut-color',calculateCutColor(c));
        root.style.setProperty('--top-bg-img','none');
        topBgDataUrl='';
    }
    function setTopCustomBg(v){setTopBg(v);}
    function setBottomBg(c){
        collageArea.style.backgroundImage='none';
        root.style.setProperty('--bottom-bg',c);
        root.style.setProperty('--bottom-bg-img','none');
    }
    function setBottomCustomBg(v){setBottomBg(v);}
    function setTextColor(c){root.style.setProperty('--shared-text-color',c);root.style.setProperty('--scrap-text-color',c);document.getElementById('textColorPicker').value=c.startsWith('#')?c:'#1a1a1a';}

    // ===== 改动2: 上传壁纸时同步设CSS变量 =====
    function uploadTopBg(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){
        topBgDataUrl=ev.target.result;
        sourceArea.style.backgroundImage='url('+topBgDataUrl+')';
        root.style.setProperty('--top-bg-img','url('+topBgDataUrl+')');
        root.style.setProperty('--top-cut-color',calculateCutColor('#888888'));
    };r.readAsDataURL(f);}
    function uploadBottomBg(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){
        collageArea.style.backgroundImage='url('+ev.target.result+')';
        root.style.setProperty('--bottom-bg-img','url('+ev.target.result+')');
    };r.readAsDataURL(f);}

    function applyTextureEffect(lid,type){var layer=document.getElementById(lid);var map={none:['none','none'],frosted:['url(#tex-frosted-filter)','#888'],noise:['url(#tex-noise-filter)','#888'],paper:['url(#tex-paper-filter)','#DDD'],fabric:['url(#tex-fabric-filter)','#888'],scratch:['url(#tex-scratch-filter)','#888']};var p=map[type]||map.none;layer.style.filter=p[0];layer.style.background=p[1];}
    function setTopTexture(t){document.querySelectorAll('[id^="top-tex-"]').forEach(function(b){b.classList.remove('active');});document.getElementById('top-tex-'+t).classList.add('active');applyTextureEffect('top-texture',t);if(t!=='none'&&document.getElementById('top-grain-slider').value==0){document.getElementById('top-grain-slider').value=30;setTopGrainOpacity(30);}}
    function setTopGrainOpacity(v){root.style.setProperty('--top-grain-opacity',v/100);}
    function setBottomTexture(t){document.querySelectorAll('[id^="bot-tex-"]').forEach(function(b){b.classList.remove('active');});document.getElementById('bot-tex-'+t).classList.add('active');applyTextureEffect('bottom-texture',t);if(t!=='none'&&document.getElementById('bot-grain-slider').value==0){document.getElementById('bot-grain-slider').value=30;setBottomGrainOpacity(30);}}
    function setBottomGrainOpacity(v){root.style.setProperty('--bottom-grain-opacity',v/100);}
    function setZoneFont(z,ff,el,fn){var li=z==='top'?'topFontList':'bottomFontList',la=z==='top'?'top-font-name-label':'bottom-font-name-label';document.querySelectorAll('#'+li+' .font-compact-item').forEach(function(i){i.classList.remove('selected');});if(el)el.classList.add('selected');document.getElementById(la).innerText=fn;var ac=ff;if(ff==='FOLLOW')ac=getFollowFont();root.style.setProperty(z==='top'?'--top-font-family':'--scrap-font-family',ac);setTimeout(function(){if(currentLayout==='horizontal')collageArea.style.height=sourceArea.offsetHeight+'px';},30);}
    function setTopFontSize(v){root.style.setProperty('--top-font-size',v+'px');document.getElementById('top-font-val').textContent=v+'px';setTimeout(function(){if(currentLayout==='horizontal')collageArea.style.height=sourceArea.offsetHeight+'px';},30);}
    function setScrapFontSize(v){root.style.setProperty('--scrap-font-size',v+'px');document.getElementById('bot-font-val').textContent=v+'px';}
    function syncCollageSize(){if(currentLayout==='vertical'){collageArea.style.width='100%';collageArea.style.height=sourceArea.offsetHeight+'px';}else{collageArea.style.height=sourceArea.offsetHeight+'px';collageArea.style.width=sourceArea.offsetWidth+'px';}}
    function switchLayout(t){currentLayout=t;if(t==='horizontal'){posterCanvas.classList.add('layout-horizontal');collageArea.style.height=sourceArea.offsetHeight+'px';collageArea.style.width='340px';}else{posterCanvas.classList.remove('layout-horizontal');collageArea.style.width='100%';collageArea.style.height=sourceArea.offsetHeight+'px';}renderLayoutPanel();}
    function initCollageResizer(){var isR=false,sX,sY,sW,sH;var onS=function(e){isR=true;var p=e.type.includes('touch')?e.touches[0]:e;sX=p.clientX;sY=p.clientY;sW=collageArea.offsetWidth;sH=collageArea.offsetHeight;e.stopPropagation();};var onM=function(e){if(!isR)return;var p=e.type.includes('touch')?e.touches[0]:e;if(currentLayout==='vertical')collageArea.style.height=Math.max(80,sH+(p.clientY-sY))+'px';else{collageArea.style.width=Math.max(140,sW+(p.clientX-sX))+'px';collageArea.style.height=sourceArea.offsetHeight+'px';}};var onE=function(){isR=false;};resizer.addEventListener('mousedown',onS);window.addEventListener('mousemove',onM);window.addEventListener('mouseup',onE);resizer.addEventListener('touchstart',onS,{passive:true});window.addEventListener('touchmove',onM,{passive:true});window.addEventListener('touchend',onE);}
    function renderArticle(text){textFlow.innerHTML='';collageArea.querySelectorAll('.scrap-word').forEach(function(e){e.remove();});text.split('').forEach(function(char,idx){var span=document.createElement('span');span.className='char-node';span.textContent=char;span.dataset.char=char;span.dataset.idx=idx;span.onclick=function(){handleCharClick(span);};textFlow.appendChild(span);});setTimeout(function(){if(currentLayout==='horizontal')collageArea.style.height=sourceArea.offsetHeight+'px';},30);}
    function handleCharClick(span){var idx=span.dataset.idx;if(span.classList.contains('is-cut')){span.classList.remove('is-cut','shape-square','shape-clip','shape-symbol','shape-image');span.style.removeProperty('--cut-clip');span.style.removeProperty('--cut-mask');var sc=collageArea.querySelector('.scrap-word[data-idx="'+idx+'"]');if(sc)sc.remove();return;}collageArea.querySelectorAll('.bp-welcome-scrap').forEach(function(e){e.remove();});span.classList.add('is-cut');applyShapeToCut(span);spawnScrap(span,idx);}
    function spawnScrap(charNode,idx){var char=charNode.textContent;var scrap=document.createElement('div');scrap.className='scrap-word';scrap.textContent=char;scrap.dataset.idx=idx;if(topBgDataUrl){var saRect=sourceArea.getBoundingClientRect();var chRect=charNode.getBoundingClientRect();scrap.style.setProperty('--scrap-bg-img','url('+topBgDataUrl+')');scrap.style.setProperty('--scrap-bg-size',saRect.width+'px '+saRect.height+'px');scrap.style.setProperty('--scrap-bg-pos','-'+(chRect.left-saRect.left)+'px -'+(chRect.top-saRect.top)+'px');}var rect=collageArea.getBoundingClientRect();scrap.style.left=(Math.random()*(Math.max(rect.width-50,20))+10)+'px';scrap.style.top=(Math.random()*(Math.max(rect.height-60,20))+10)+'px';applyShapeToScrap(scrap);bindDrag(scrap);scrap.ondblclick=function(){var t=textFlow.querySelector('.char-node[data-idx="'+idx+'"]');if(t){t.classList.remove('is-cut','shape-square','shape-clip','shape-symbol','shape-image');t.style.removeProperty('--cut-clip');t.style.removeProperty('--cut-mask');}scrap.remove();};collageArea.appendChild(scrap);}
    function bindDrag(el){var sX,sY,oX,oY,isDragging=false;var onS=function(e){isDragging=true;var p=e.type.includes('touch')?e.touches[0]:e;sX=p.clientX;sY=p.clientY;oX=parseFloat(el.style.left)||0;oY=parseFloat(el.style.top)||0;el.style.zIndex=1000;};var onM=function(e){if(!isDragging)return;var p=e.type.includes('touch')?e.touches[0]:e;el.style.left=(oX+(p.clientX-sX))+'px';el.style.top=(oY+(p.clientY-sY))+'px';};var onE=function(){isDragging=false;el.style.zIndex=10;};el.addEventListener('mousedown',onS);window.addEventListener('mousemove',onM);window.addEventListener('mouseup',onE);el.addEventListener('touchstart',onS,{passive:true});window.addEventListener('touchmove',onM,{passive:true});window.addEventListener('touchend',onE);}
    function resetCuts(){textFlow.querySelectorAll('.char-node.is-cut').forEach(function(n){n.classList.remove('is-cut','shape-square','shape-clip','shape-symbol','shape-image');n.style.removeProperty('--cut-clip');n.style.removeProperty('--cut-mask');});collageArea.querySelectorAll('.scrap-word').forEach(function(n){n.remove();});}

    // ===== 改动3: 导出函数（DS的6点修复） =====
    var _exportBlobUrls=[];function cleanupExportBlobs(){_exportBlobUrls.forEach(function(u){try{URL.revokeObjectURL(u);}catch(e){}});_exportBlobUrls=[];}
    function injectFontsIntoIframe(idoc){var topF=(root.style.getPropertyValue('--top-font-family')||'').replace(/'/g,''),botF=(root.style.getPropertyValue('--scrap-font-family')||'').replace(/'/g,'');customFonts.forEach(function(f){var fam=f.family.replace(/'/g,'');if(topF.indexOf(fam)===-1&&botF.indexOf(fam)===-1)return;var rule=f.rule,m=rule.match(/url\((data:[^)]+)\)/);if(m){try{var parts=m[1].split(','),mime=(parts[0].match(/:(.*?);/)||[,'application/octet-stream'])[1],bin=atob(parts[1]),arr=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);var blob=new Blob([arr],{type:mime}),blobUrl=URL.createObjectURL(blob);_exportBlobUrls.push(blobUrl);rule=rule.replace(m[0],'url('+blobUrl+')');}catch(e){}}var s=idoc.createElement('style');s.textContent=rule;idoc.head.appendChild(s);});}

    function exportPosterImage(){
        if(typeof html2canvas==='undefined'){toastr.warning('截图组件加载中');return;}
        closeAllDrawers();resizer.style.display='none';toastr.info('正在生成高清图片…');

        // 导出前：临时把纹理层blend-mode改normal，抠字坑色换不透明
        var topTex=document.getElementById('top-texture');
        var botTex=document.getElementById('bottom-texture');
        var oldTopBlend=topTex.style.mixBlendMode;
        var oldBotBlend=botTex.style.mixBlendMode;
        topTex.style.mixBlendMode='normal';
        botTex.style.mixBlendMode='normal';

        // 把--top-cut-color临时换成不透明色
        var oldCutColor=root.style.getPropertyValue('--top-cut-color');
        var topBgVal=root.style.getPropertyValue('--top-bg')||'#FFFFFF';
        root.style.setProperty('--top-cut-color',cutColorToOpaque(topBgVal));

        var safetyTimer=setTimeout(function(){
            resizer.style.display='flex';cleanupExportBlobs();
            topTex.style.mixBlendMode=oldTopBlend;botTex.style.mixBlendMode=oldBotBlend;
            root.style.setProperty('--top-cut-color',oldCutColor);
            toastr.error('生成超时');
        },30000);

        setTimeout(function(){
            var iframe=document.createElement('iframe');iframe.setAttribute('aria-hidden','true');
            var cardW=Math.max(posterCanvas.offsetWidth||440,280),cardH=Math.max(posterCanvas.offsetHeight||600,300);
            iframe.style.cssText='position:fixed;left:-99999px;top:0;width:'+(cardW+8)+'px;height:'+(cardH+8)+'px;border:0;visibility:hidden;';
            document.body.appendChild(iframe);

            var cleanup=function(){
                clearTimeout(safetyTimer);try{iframe.remove();}catch(e){}
                resizer.style.display='flex';cleanupExportBlobs();
                // 恢复原来的blend-mode和颜色
                topTex.style.mixBlendMode=oldTopBlend;botTex.style.mixBlendMode=oldBotBlend;
                root.style.setProperty('--top-cut-color',oldCutColor);
            };

            try{
                var idoc=iframe.contentDocument;
                // DS修复点1: 用setProperty逐个注入，不用cssText拼接
                var varNames=['--top-bg','--bottom-bg','--scrap-bg','--top-cut-color','--top-font-size','--top-font-family','--scrap-font-size','--scrap-font-family','--shared-text-color','--scrap-text-color','--top-grain-opacity','--bottom-grain-opacity','--page-bg','--top-bg-img','--bottom-bg-img','--wm-color'];

                idoc.open();
                idoc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="'+FONT_HREF+'"><style>html,body{margin:0;padding:0;}'+CSS_TEXT+'</style></head><body></body></html>');
                idoc.close();
                injectFontsIntoIframe(idoc);

                var wrap=idoc.createElement('div');wrap.id='bp-app-container';
                wrap.style.cssText='position:static;display:block;width:auto;height:auto;padding:0;background:transparent;overflow:visible;';

                // 逐个setProperty注入CSS变量（不会因为引号/特殊字符导致整条cssText解析失败）
                var cs=getComputedStyle(container);
                varNames.forEach(function(v){
                    var val=cs.getPropertyValue(v);
                    if(val){try{wrap.style.setProperty(v,val);}catch(e){}}
                });

                var clone=posterCanvas.cloneNode(true);
                var rs=clone.querySelector('#collage-resizer');if(rs)rs.remove();
                // 克隆里的纹理层也改成normal
                var cloneTopTex=clone.querySelector('#top-texture');
                var cloneBotTex=clone.querySelector('#bottom-texture');
                if(cloneTopTex)cloneTopTex.style.mixBlendMode='normal';
                if(cloneBotTex)cloneBotTex.style.mixBlendMode='normal';

                wrap.appendChild(clone);idoc.body.appendChild(wrap);

                // DS修复点5: 字体等待加长到8s
                var fontReady=(idoc.fonts&&idoc.fonts.ready)?idoc.fonts.ready:Promise.resolve();
                Promise.race([fontReady,new Promise(function(r){setTimeout(r,8000);})]).then(function(){
                    setTimeout(function(){
                        try{
                            // DS修复点4: backgroundColor用实际page-bg色
                            var pageBg=cs.getPropertyValue('--page-bg')||'#F5F5F7';
                            html2canvas(clone,{scale:3,useCORS:true,allowTaint:true,backgroundColor:pageBg,logging:false,windowWidth:clone.scrollWidth,windowHeight:clone.scrollHeight}).then(function(canvas){
                                cleanup();
                                try{var du=canvas.toDataURL('image/png'),lk=document.createElement('a');lk.download='BlackoutPoetry_'+Date.now()+'.png';lk.href=du;document.body.appendChild(lk);lk.click();lk.remove();toastr.success('已保存高清图片');}
                                catch(e){canvas.toBlob(function(blob){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='BlackoutPoetry_'+Date.now()+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},3000);toastr.success('已保存高清图片');},'image/png');}
                            }).catch(function(err){cleanup();toastr.error('保存失败:'+(err&&err.message||err));});
                        }catch(e){cleanup();toastr.error('截图出错:'+(e&&e.message||e));}
                    },200);
                });
            }catch(e){cleanup();toastr.error('截图出错:'+(e&&e.message||e));}
        },100);
    }

    Object.assign(window,{toggleDrawer,toggleSettingsDrawer,closeAllDrawers,toggleBubbleBtn,uploadBubbleIcon,clearBubbleIcon,toggleShapePanel,toggleLayoutPanel,uploadShapeImage,setTopBg,setTopCustomBg,setBottomBg,setBottomCustomBg,setTextColor,setWmColor,applyTextureEffect,setTopTexture,setTopGrainOpacity,setBottomTexture,setBottomGrainOpacity,setZoneFont,loadCustomFont,openCssFontDialog,setTopFontSize,setScrapFontSize,syncCollageSize,switchLayout,swapAreas,renderArticle,handleCharClick,spawnScrap,bindDrag,uploadTopBg,uploadBottomBg,resetCuts,exportPosterImage,arrangeStrictGrid,getGanZhiDate,setTimeFormat,updateBottomMeta});
    initColorPaletteUI('topPaletteContainer',setTopBg);initColorPaletteUI('bottomPaletteContainer',setBottomBg);initTextColorPaletteUI();renderFontLists();initCollageResizer();
    var mountExt=function(){var p=document.getElementById('extensions_settings');if(p&&!document.getElementById('bp-ext-item')){var d=document.createElement('div');d.className='list-group-item flex-container flexGap smolWidth';d.id='bp-ext-item';d.innerHTML='<div class="m-b-0 m-t-0 extensionsMenu--title"><span style="font-size:14px;margin-right:5px;">&#x1FAE7;</span><span>剪报拼贴诗</span></div><div style="cursor:pointer;margin-left:auto;background:var(--SmartThemeBotttomColor);padding:4px 10px;border-radius:4px;font-size:12px;" onclick="openBpApp(null)">打开工坊</div>';p.insertAdjacentElement('beforeend',d);}};setTimeout(mountExt,1500);setInterval(mountExt,5000);

    // ===== 改动4: 三事件选区监听（安卓兼容） =====
    var selectedText='';
    function checkBpSelection(){
        var sel=window.getSelection();
        var text=sel?sel.toString().trim():'';
        if(text.length>0&&sel.anchorNode&&sel.anchorNode.parentElement&&sel.anchorNode.parentElement.closest&&sel.anchorNode.parentElement.closest('#chat')){
            selectedText=text;selPopup.style.display='flex';
        }else{selPopup.style.display='none';}
    }
    var bpSelTimer=null;
    function scheduleBpCheck(delay){if(bpSelTimer)clearTimeout(bpSelTimer);bpSelTimer=setTimeout(checkBpSelection,delay);}
    document.addEventListener('selectionchange',function(){scheduleBpCheck(120);});
    document.addEventListener('mouseup',function(){scheduleBpCheck(30);});
    document.addEventListener('touchend',function(){scheduleBpCheck(120);});

    selPopup.onclick=function(){try{window.getSelection().removeAllRanges();}catch(e){}selPopup.style.display='none';window.openBpApp(selectedText);};
    $(document).on('click','#bp_open_studio_btn',function(){window.openBpApp(null);});
});
