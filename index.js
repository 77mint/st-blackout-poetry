// 剪报拼贴诗 - SillyTavern Extension

jQuery(async () => {

    // 1. 加载依赖
    if (!window.html2canvas) {
        await new Promise(function(resolve, reject) {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }
    var fl = document.createElement('link');
    fl.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;600&family=ZCOOL+XiaoWei&display=swap';
    fl.rel = 'stylesheet';
    document.head.appendChild(fl);

    // 2. CSS
    var css = document.createElement('style');
    css.textContent = `
#bp-app-container {
    --page-bg:#F5F5F7; --top-bg:#F7F5F0; --top-bg-img:none; --top-cut-color:rgba(0,0,0,0.06);
    --top-font-size:14.5px; --top-grain-opacity:0; --top-font-family:'Noto Serif SC',serif;
    --bottom-bg:#F7F5F0; --bottom-bg-img:none; --scrap-bg:var(--top-bg);
    --scrap-font-size:14.5px; --bottom-grain-opacity:0; --scrap-font-family:'Noto Serif SC',serif;
    --shared-text-color:#1A1A1A;
    position:fixed; top:0; left:0; width:100vw; height:100vh; background-color:var(--page-bg);
    z-index:999999; display:none; justify-content:center; align-items:center; overflow:auto; padding:60px 20px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
#bp-app-container, #bp-app-container *, #bp-app-container *::before, #bp-app-container *::after { box-sizing:border-box; margin:0; padding:0; user-select:none; -webkit-user-select:none; }
#bp-app-container input[type="file"] { user-select:auto !important; -webkit-user-select:auto !important; pointer-events:auto !important; }
#bp-app-container input[type="color"] { user-select:auto !important; -webkit-user-select:auto !important; }
#bp-app-container input[type="text"] { user-select:auto !important; -webkit-user-select:auto !important; }
#bp-app-container input[type="checkbox"] { user-select:auto !important; -webkit-user-select:auto !important; }
#bp-app-container input[type="range"] { user-select:auto !important; -webkit-user-select:auto !important; }
#bp-app-container #top-left-bar { position:fixed; top:20px; left:20px; display:flex; align-items:center; gap:8px; z-index:2005; }
#bp-app-container #top-right-bar { position:fixed; top:20px; right:20px; display:flex; align-items:center; gap:8px; z-index:2005; }
#bp-app-container .icon-btn { width:36px; height:36px; display:flex; justify-content:center; align-items:center; cursor:pointer; background:rgba(255,255,255,0.92); border:1px solid rgba(0,0,0,0.08); border-radius:4px; backdrop-filter:blur(8px); box-shadow:0 4px 15px rgba(0,0,0,0.04); transition:all 0.2s ease; }
#bp-app-container .icon-btn:hover { background:#FFF; border-color:#000; }
#bp-app-container .icon-btn svg { width:18px; height:18px; stroke:#1C1C1C; stroke-width:1.6; fill:none; }
#bp-app-container #menu-trigger .bar { width:16px; height:1.5px; background-color:#1C1C1C; }
#bp-app-container .layout-toggle-group { display:flex; background:rgba(255,255,255,0.92); border:1px solid rgba(0,0,0,0.08); border-radius:4px; backdrop-filter:blur(8px); padding:2px; box-shadow:0 4px 15px rgba(0,0,0,0.04); }
#bp-app-container .layout-btn { background:transparent; border:none; color:#666; font-size:11px; padding:6px 12px; border-radius:2px; cursor:pointer; transition:all 0.15s; }
#bp-app-container .layout-btn:hover { color:#000; }
#bp-app-container .layout-btn.active { background:#1C1C1C; color:#FFF; font-weight:500; }
#bp-app-container #common-mask { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.18); z-index:1998; display:none; opacity:0; transition:opacity 0.25s ease; }
#bp-app-container #common-mask.visible { display:block; opacity:1; }
#bp-app-container #drawer { position:fixed; top:0; left:-370px; width:350px; height:100vh; background:rgba(255,255,255,0.98); border-right:1px solid rgba(0,0,0,0.08); backdrop-filter:blur(20px); box-shadow:10px 0 35px rgba(0,0,0,0.04); z-index:1999; display:flex; flex-direction:column; padding:75px 20px 30px 20px; overflow-y:auto; transition:left 0.3s cubic-bezier(0.22,1,0.36,1); color:#222; font-size:11.5px; }
#bp-app-container #drawer.open { left:0; }
#bp-app-container #settings-drawer { position:fixed; top:0; right:-370px; width:340px; height:100vh; background:rgba(255,255,255,0.98); border-left:1px solid rgba(0,0,0,0.08); backdrop-filter:blur(20px); box-shadow:-10px 0 35px rgba(0,0,0,0.04); z-index:1999; display:flex; flex-direction:column; padding:75px 20px 30px 20px; overflow-y:auto; transition:right 0.3s cubic-bezier(0.22,1,0.36,1); color:#222; font-size:11.5px; }
#bp-app-container #settings-drawer.open { right:0; }
#bp-app-container .drawer-section { margin-bottom:18px; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:14px; }
#bp-app-container .drawer-section:last-child { border-bottom:none; }
#bp-app-container .section-title { font-size:9.5px; letter-spacing:0.1em; color:#888; margin-bottom:8px; font-weight:600; text-transform:uppercase; }
#bp-app-container .color-group-label { font-size:9px; color:#999; margin:4px 0 2px 0; }
#bp-app-container .color-palette-row { display:grid; grid-template-columns:repeat(6,1fr); gap:4px; margin-bottom:5px; }
#bp-app-container .color-dot { height:20px; border-radius:2px; border:1px solid rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.15s; }
#bp-app-container .color-dot:hover { transform:scale(1.1); z-index:2; }
#bp-app-container .color-picker-wrapper { display:flex; align-items:center; gap:6px; margin:4px 0 8px 0; background:#F4F4F4; padding:4px 8px; border-radius:2px; }
#bp-app-container .color-picker-input { width:22px; height:22px; border:none; padding:0; cursor:pointer; background:none; }
#bp-app-container .grid-buttons { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin-bottom:6px; }
#bp-app-container .action-chip { background:#F4F4F4; border:1px solid rgba(0,0,0,0.05); color:#333; padding:6px 0; text-align:center; border-radius:2px; cursor:pointer; font-size:10px; transition:all 0.15s; }
#bp-app-container .action-chip:hover, #bp-app-container .action-chip.active { background:#1C1C1C; color:#FFF; }
#bp-app-container .file-wrapper { position:relative; overflow:visible; display:block; margin-top:4px; }
#bp-app-container .file-wrapper input[type="file"] { position:absolute; left:0; top:0; opacity:0; cursor:pointer; width:100%; height:100%; z-index:10; }
#bp-app-container .slider-row { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
#bp-app-container .slider-row span { color:#777; font-size:9.5px; }
#bp-app-container .slider-row input[type="range"] { width:150px; accent-color:#000; }
#bp-app-container .sub-panel-box { background:#FBFBFB; border:1px solid #EBEBEB; border-radius:4px; padding:10px; margin-top:8px; }
#bp-app-container .sub-panel-title { font-size:10px; font-weight:600; color:#1C1C1C; margin-bottom:6px; display:flex; justify-content:space-between; }
#bp-app-container .font-compact-list { display:flex; flex-direction:column; gap:4px; margin-bottom:8px; max-height:110px; overflow-y:auto; }
#bp-app-container .font-compact-item { display:flex; align-items:center; justify-content:space-between; background:#FFF; border:1px solid #E5E5E5; border-radius:2px; padding:4px 8px; cursor:pointer; transition:all 0.15s ease; }
#bp-app-container .font-compact-item:hover { border-color:#1C1C1C; }
#bp-app-container .font-compact-item.selected { border-color:#1C1C1C; background:#F0F0F0; font-weight:600; }
#bp-app-container .font-name-col { font-size:10px; color:#444; }
#bp-app-container .font-preview-col { font-size:13px; color:#111; letter-spacing:0.05em; }
#bp-app-container .setting-field { margin-bottom:12px; }
#bp-app-container .setting-input { width:100%; background:#F7F7F7; border:1px solid #E5E5E5; padding:6px 8px; font-size:11px; border-radius:2px; outline:none; color:#111; }
#bp-app-container .setting-toggle-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
#bp-app-container .icon-preview-row { display:flex; align-items:center; justify-content:space-between; background:#F7F7F7; border:1px solid #E5E5E5; padding:6px 10px; border-radius:2px; margin-top:6px; }
#bp-app-container .icon-preview-box { width:22px; height:22px; display:flex; align-items:center; justify-content:center; background:#FFF; border:1px solid #DDD; border-radius:50%; overflow:hidden; }
#bp-app-container .icon-preview-box img { width:18px; height:18px; object-fit:cover; border-radius:50%; }
#bp-app-container #poster-canvas { box-shadow:0 12px 45px rgba(0,0,0,0.08); position:relative; display:flex; flex-direction:column; border:1px solid rgba(0,0,0,0.06); touch-action:none; width:440px; }
#bp-app-container #poster-canvas.layout-horizontal { flex-direction:row !important; width:auto !important; }
#bp-app-container #source-area { background-color:var(--top-bg); background-image:var(--top-bg-img); background-size:cover; background-position:center; padding:40px 36px 30px 36px; position:relative; flex-shrink:0; height:auto; font-family:var(--top-font-family); }
#bp-app-container #poster-canvas.layout-horizontal #source-area { width:360px; }
#bp-app-container .text-flow { color:var(--shared-text-color); font-size:var(--top-font-size); line-height:2.2; letter-spacing:0.06em; text-align:justify; word-break:break-all; }
#bp-app-container .char-node { cursor:pointer; position:relative; display:inline-block; transition:transform 0.1s ease; }
#bp-app-container .char-node:hover:not(.is-cut) { opacity:0.5; }
#bp-app-container .char-node.is-cut { color:transparent !important; }
#bp-app-container .char-node.is-cut::after { content:""; position:absolute; top:2px; bottom:2px; left:0; right:0; background-color:var(--top-cut-color); border-radius:1px; box-shadow:inset 0 0 1px rgba(0,0,0,0.15); }
#bp-app-container #collage-area { position:relative; background-color:var(--bottom-bg); background-image:var(--bottom-bg-img); background-size:cover; background-position:center; border-top:1px solid rgba(0,0,0,0.04); flex-shrink:0; min-height:180px; min-width:180px; overflow:hidden; font-family:var(--scrap-font-family); padding-bottom:35px; }
#bp-app-container #poster-canvas.layout-horizontal #collage-area { border-top:none; border-left:1px solid rgba(0,0,0,0.04); }
#bp-app-container #collage-resizer { position:absolute; z-index:1000; display:flex; align-items:center; justify-content:center; }
#bp-app-container #poster-canvas:not(.layout-horizontal) #collage-resizer { bottom:0; left:0; width:100%; height:12px; cursor:ns-resize; }
#bp-app-container #poster-canvas:not(.layout-horizontal) #collage-resizer::after { content:""; width:32px; height:3px; background:rgba(0,0,0,0.2); border-radius:2px; }
#bp-app-container #poster-canvas.layout-horizontal #collage-resizer { right:0; top:0; width:12px; height:100%; cursor:ew-resize; }
#bp-app-container #poster-canvas.layout-horizontal #collage-resizer::after { content:""; width:3px; height:32px; background:rgba(0,0,0,0.2); border-radius:2px; }
#bp-app-container .scrap-word { position:absolute; background-color:var(--scrap-bg); color:var(--shared-text-color); padding:3px 6px; font-size:var(--scrap-font-size); line-height:1; border-radius:1px; cursor:grab; box-shadow:1px 2px 5px rgba(0,0,0,0.15); font-family:inherit; touch-action:none; z-index:10; display:inline-flex; justify-content:center; align-items:center; width:26px; height:30px; }
#bp-app-container .scrap-word:active { cursor:grabbing; box-shadow:2px 6px 14px rgba(0,0,0,0.25); z-index:100; }
#bp-app-container .texture-layer { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; mix-blend-mode:overlay; z-index:800; }
#bp-app-container #top-texture { opacity:var(--top-grain-opacity); }
#bp-app-container #bottom-texture { opacity:var(--bottom-grain-opacity); }
#bp-app-container #poster-bottom-meta { position:absolute; bottom:12px; left:0; width:100%; display:flex; justify-content:center; align-items:center; gap:8px; font-size:8.5px; letter-spacing:0.1em; color:var(--shared-text-color); opacity:0.45; pointer-events:none; }
#bp-app-container #bottom-icon-slot { display:inline-flex; align-items:center; justify-content:center; }
#bp-app-container #bottom-icon-slot img { width:11px; height:11px; object-fit:cover; vertical-align:middle; border-radius:50%; }
#bp-bubble-btn { position:fixed; right:12px; top:50%; transform:translateY(-50%); background:transparent; border:none; box-shadow:none; z-index:9990; display:flex; justify-content:center; align-items:center; cursor:pointer; font-size:26px; line-height:1; padding:0; transition:transform 0.15s ease, opacity 0.15s ease; opacity:0.85; -webkit-tap-highlight-color:transparent; }
#bp-bubble-btn:active { transform:translateY(-50%) scale(0.9); opacity:1; }
#bp-sel-popup { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); z-index:99999; background:rgba(28,28,28,0.92); color:#fff; padding:8px 16px; border-radius:20px; box-shadow:0 4px 12px rgba(0,0,0,0.2); font-size:12px; display:none; align-items:center; gap:6px; cursor:pointer; backdrop-filter:blur(6px); }
    `;
    document.head.appendChild(css);

    // 3. HTML (打码功能已移除)
    var container = document.createElement('div');
    container.id = 'bp-app-container';
    container.innerHTML = `
    <svg style="display:none;"><defs>
        <filter id="tex-frosted-filter"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" stitchTiles="stitch"/></filter>
        <filter id="tex-noise-filter"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch"/></filter>
        <filter id="tex-paper-filter"><feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="5" result="noise"/><feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter>
        <filter id="tex-fabric-filter"><feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves="3" stitchTiles="stitch"/></filter>
        <filter id="tex-scratch-filter"><feTurbulence type="turbulence" baseFrequency="0.01 0.4" numOctaves="2" stitchTiles="stitch"/></filter>
    </defs></svg>
    <div id="top-left-bar">
        <div class="icon-btn" onclick="closeBpApp()" title="退出"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
        <div class="icon-btn" id="menu-trigger" onclick="toggleDrawer()" title="工具栏"><div style="display:flex;flex-direction:column;gap:4px;align-items:center;"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div></div>
        <div class="layout-toggle-group">
            <button class="layout-btn active" id="btn-layout-vertical" onclick="switchLayout('vertical')">上下</button>
            <button class="layout-btn" id="btn-layout-horizontal" onclick="switchLayout('horizontal')">左右</button>
        </div>
    </div>
    <div id="top-right-bar">
        <div class="icon-btn" onclick="toggleSettingsDrawer()" title="设置"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
        <div class="icon-btn" onclick="exportPosterImage()" title="保存"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
    </div>
    <div id="common-mask" onclick="closeAllDrawers()"></div>
    <div id="drawer">
        <div class="drawer-section">
            <div class="section-title">1. 壁纸 (原文区)</div>
            <div id="topPaletteContainer"></div>
            <div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="topColorPicker" value="#F7F5F0" onchange="setTopCustomBg(this.value)"><span style="font-size:10px;color:#555;">自定义取色调色盘</span></div>
            <div class="file-wrapper"><div class="action-chip">上传壁纸图片</div><input type="file" accept="image/*" onchange="uploadTopBg(event)"></div>
            <div style="font-size:9px;color:#888;margin-top:8px;margin-bottom:3px;">壁纸纹理质感：</div>
            <div class="grid-buttons"><button class="action-chip active" id="top-tex-none" onclick="setTopTexture('none')">无</button><button class="action-chip" id="top-tex-frosted" onclick="setTopTexture('frosted')">细磨砂</button><button class="action-chip" id="top-tex-noise" onclick="setTopTexture('noise')">胶片噪点</button><button class="action-chip" id="top-tex-paper" onclick="setTopTexture('paper')">粗糙纸纹</button><button class="action-chip" id="top-tex-fabric" onclick="setTopTexture('fabric')">复古布纹</button><button class="action-chip" id="top-tex-scratch" onclick="setTopTexture('scratch')">素描排线</button></div>
            <div class="slider-row"><span>纹理浓度</span><input type="range" min="0" max="70" value="0" id="top-grain-slider" oninput="setTopGrainOpacity(this.value)"></div>
        </div>
        <div class="drawer-section">
            <div class="section-title">2. 底图 (拼贴区)</div>
            <div id="bottomPaletteContainer"></div>
            <div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="botColorPicker" value="#F7F5F0" onchange="setBottomCustomBg(this.value)"><span style="font-size:10px;color:#555;">自定义取色调色盘</span></div>
            <div class="file-wrapper"><div class="action-chip">上传底图图片</div><input type="file" accept="image/*" onchange="uploadBottomBg(event)"></div>
            <button class="action-chip" style="width:100%;margin-top:6px;" onclick="syncCollageSize()">使拼贴区与原文区等大</button>
            <div style="font-size:9px;color:#888;margin-top:8px;margin-bottom:3px;">底图纹理质感：</div>
            <div class="grid-buttons"><button class="action-chip active" id="bot-tex-none" onclick="setBottomTexture('none')">无</button><button class="action-chip" id="bot-tex-frosted" onclick="setBottomTexture('frosted')">细磨砂</button><button class="action-chip" id="bot-tex-noise" onclick="setBottomTexture('noise')">胶片噪点</button><button class="action-chip" id="bot-tex-paper" onclick="setBottomTexture('paper')">粗糙纸纹</button><button class="action-chip" id="bot-tex-fabric" onclick="setBottomTexture('fabric')">复古布纹</button><button class="action-chip" id="bot-tex-scratch" onclick="setBottomTexture('scratch')">素描排线</button></div>
            <div class="slider-row"><span>纹理浓度</span><input type="range" min="0" max="70" value="0" id="bot-grain-slider" oninput="setBottomGrainOpacity(this.value)"></div>
        </div>
        <div class="drawer-section">
            <div class="section-title">3. 字体与文字颜色设置</div>
            <div style="font-size:10px;font-weight:600;color:#333;margin-bottom:4px;">文字颜色：</div>
            <div id="textColorPaletteContainer"></div>
            <div class="color-picker-wrapper" style="margin-bottom:10px;"><input type="color" class="color-picker-input" id="textColorPicker" value="#1A1A1A" onchange="setTextColor(this.value)"><span style="font-size:10px;color:#555;">自定义文字调色盘</span></div>
            <div class="file-wrapper" style="margin-bottom:8px;"><div class="action-chip" style="background:#EBEBEB;font-weight:600;">导入本地 .TTF / .OTF 字体文件</div><input type="file" accept=".ttf,.otf,.woff,.woff2" onchange="loadCustomFont(event)"></div>
            <div class="sub-panel-box"><div class="sub-panel-title"><span>原文区字体</span><span id="top-font-name-label" style="font-size:9px;color:#999;font-weight:normal;">思源宋体</span></div>
                <div class="font-compact-list" id="topFontList">
                    <div class="font-compact-item selected" onclick="setZoneFont('top','Noto Serif SC, serif',this,'思源宋体')"><div class="font-name-col">思源宋体</div><div class="font-preview-col" style="font-family:'Noto Serif SC',serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('top','Ma Shan Zheng, cursive',this,'马善政毛笔')"><div class="font-name-col">马善政毛笔</div><div class="font-preview-col" style="font-family:'Ma Shan Zheng',cursive;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('top','ZCOOL XiaoWei, serif',this,'站酷小薇体')"><div class="font-name-col">站酷小薇体</div><div class="font-preview-col" style="font-family:'ZCOOL XiaoWei',serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('top','Noto Sans SC, sans-serif',this,'思源黑体')"><div class="font-name-col">思源黑体</div><div class="font-preview-col" style="font-family:'Noto Sans SC',sans-serif;">恨水虚席</div></div>
                </div>
                <div class="slider-row"><span>原文字号大小</span><input type="range" min="11" max="24" value="14" oninput="setTopFontSize(this.value)"></div>
            </div>
            <div class="sub-panel-box" style="margin-top:8px;"><div class="sub-panel-title"><span>拼贴区字体</span><span id="bottom-font-name-label" style="font-size:9px;color:#999;font-weight:normal;">思源宋体</span></div>
                <div class="font-compact-list" id="bottomFontList">
                    <div class="font-compact-item selected" onclick="setZoneFont('bottom','Noto Serif SC, serif',this,'思源宋体')"><div class="font-name-col">思源宋体</div><div class="font-preview-col" style="font-family:'Noto Serif SC',serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('bottom','Ma Shan Zheng, cursive',this,'马善政毛笔')"><div class="font-name-col">马善政毛笔</div><div class="font-preview-col" style="font-family:'Ma Shan Zheng',cursive;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('bottom','ZCOOL XiaoWei, serif',this,'站酷小薇体')"><div class="font-name-col">站酷小薇体</div><div class="font-preview-col" style="font-family:'ZCOOL XiaoWei',serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('bottom','Noto Sans SC, sans-serif',this,'思源黑体')"><div class="font-name-col">思源黑体</div><div class="font-preview-col" style="font-family:'Noto Sans SC',sans-serif;">恨水虚席</div></div>
                </div>
                <div class="slider-row"><span>拼贴小字大小</span><input type="range" min="11" max="24" value="14" oninput="setScrapFontSize(this.value)"></div>
            </div>
        </div>
        <div class="drawer-section">
            <div class="section-title">4. 抠字排版</div>
            <div class="grid-buttons"><button class="action-chip" onclick="arrangeStrictGrid(1)">原地排 1 行</button><button class="action-chip" onclick="arrangeStrictGrid(2)">原地排 2 行</button><button class="action-chip" style="font-weight:600;border-color:#000;" onclick="arrangeStrictGrid(3)">原地排 3 行</button></div>
            <button class="action-chip" style="width:100%;margin-top:8px;" onclick="resetCuts()">复原全部字</button>
        </div>
    </div>
    <div id="settings-drawer">
        <div class="drawer-section">
            <div class="section-title">时间与水印</div>
            <div class="setting-toggle-row"><span>显示时间</span><input type="checkbox" id="toggle-time-cb" checked onchange="updateBottomMeta()" style="accent-color:#000;"></div>
            <div style="display:flex;gap:4px;margin-bottom:8px;"><button class="action-chip active" id="btn-time-solar" onclick="setTimeFormat('solar')">公历</button><button class="action-chip" id="btn-time-lunar" onclick="setTimeFormat('lunar')">干支历</button></div>
            <div class="setting-toggle-row" style="margin-top:14px;"><span>显示水印</span><input type="checkbox" id="toggle-watermark-cb" checked onchange="updateBottomMeta()" style="accent-color:#000;"></div>
            <div class="setting-field"><input type="text" class="setting-input" id="watermark-text-input" value="SillyTavern" oninput="updateBottomMeta()"></div>
        </div>
        <div class="drawer-section">
            <div class="section-title">标识与图标</div>
            <div class="setting-toggle-row"><span>显示图标</span><input type="checkbox" id="toggle-icon-cb" checked onchange="toggleIconDisplay(this.checked)" style="accent-color:#000;"></div>
            <div style="font-size:9.5px;color:#777;margin-top:8px;margin-bottom:2px;">自定义图标文件：</div>
            <div class="file-wrapper"><div class="action-chip">上传自定义图标图片</div><input type="file" accept="image/*" onchange="uploadCustomIcon(event)"></div>
            <div class="icon-preview-row" id="custom-icon-preview-row" style="display:none;"><div style="display:flex;align-items:center;gap:8px;"><div class="icon-preview-box"><img id="custom-icon-img" src="" alt="preview"></div><span style="font-size:10px;color:#555;" id="custom-icon-name">已加载图标</span></div><button class="action-chip" style="padding:2px 8px;font-size:9px;" onclick="clearCustomIcon()">恢复默认</button></div>
        </div>
    </div>
    <div id="poster-canvas">
        <div id="source-area"><div class="text-flow" id="textFlow"></div><div class="texture-layer" id="top-texture" style="background:none;"></div></div>
        <div id="collage-area"><div class="texture-layer" id="bottom-texture" style="background:none;"></div><div id="poster-bottom-meta"><span id="bottom-icon-slot"></span><span id="bottom-time-span"></span><span id="bottom-wm-span">SillyTavern</span></div><div id="collage-resizer" title="按住拉伸拼贴区"></div></div>
    </div>
    `;
    document.body.appendChild(container);

    var bubbleBtn = document.createElement('div');
    bubbleBtn.id = 'bp-bubble-btn';
    bubbleBtn.innerHTML = '&#x1FAE7;';
    bubbleBtn.onclick = function() { window.openBpApp(null); };
    document.body.appendChild(bubbleBtn);

    var selPopup = document.createElement('div');
    selPopup.id = 'bp-sel-popup';
    selPopup.innerHTML = '<span style="font-size:14px;line-height:1;">&#x1FAE7;</span><span>生成拼贴诗</span>';
    document.body.appendChild(selPopup);

    // 4. JS 逻辑
    var root = container;
    var colorCategories = {
        light:[{name:'复古奶白',bg:'#F7F5F0'},{name:'冷纯白',bg:'#FFFFFF'},{name:'冷灰',bg:'#F2F2F2'},{name:'燕麦',bg:'#F0ECE1'},{name:'灰粉',bg:'#EFE5E3'},{name:'鼠尾草绿',bg:'#E5EADF'}],
        vintage:[{name:'复古砖红',bg:'#6B2D2B'},{name:'中古墨绿',bg:'#334839'},{name:'油画深蓝',bg:'#203A4C'},{name:'羊皮纸',bg:'#D9CBB7'},{name:'焦糖棕',bg:'#6B442A'},{name:'姜黄',bg:'#C99E5C'}],
        dark:[{name:'纯黑',bg:'#111111'},{name:'碳墨黑',bg:'#1C1E21'},{name:'沥青灰',bg:'#2B2B2B'},{name:'深黛蓝',bg:'#0F1A24'},{name:'极夜紫',bg:'#1E1524'},{name:'浓缩咖啡',bg:'#241B18'}]
    };
    var defaultText = "\u201C\u6559\u201D\u3002\u8FD9\u4E2A\u5B57\u5728\u4ED6\u548C\u83AB\u8BFA\u9A6C\u8D6B\u4E4B\u95F4\u62E5\u6709\u6700\u6F2B\u957F\u7684\u4F7F\u7528\u5386\u53F2\u3002\u6559\u5979\u7528\u7B77\u5B50\uFF0C\u6559\u5979\u7CFB\u978B\u5E26\uFF0C\u6559\u5979\u80CC\u5510\u8BD7\u80CC\u5230\u7B2C\u4E09\u53E5\u5C31\u8DD1\u6389\uFF0C\u6559\u5979\u5728\u6C34\u91CC\u4E0D\u8981\u95ED\u773C\u775B\u3002\u4E8C\u5341\u4E94\u5E74\u6765\u4ED6\u6559\u7ED9\u5979\u7684\u4E00\u5207\u90FD\u5EFA\u7ACB\u5728\u540C\u4E00\u4E2A\u9ED8\u8BA4\u4E4B\u4E0A\uFF0C\u4ED6\u77E5\u9053\u6B63\u786E\u7B54\u6848\uFF0C\u800C\u5979\u4FE1\u4ED6\u3002\u6B64\u523B\u8FD9\u4E2A\u9ED8\u8BA4\u4ECD\u7136\u6210\u7ACB\u3002\u53EA\u662F\u201C\u6B63\u786E\u7B54\u6848\u201D\u5DF2\u7ECF\u5728\u5589\u5499\u91CC\u8150\u8680\u6210\u4E86\u4E00\u5757\u70EB\u624B\u7684\u94C1\uFF0C\u4ED6\u5373\u5C06\u628A\u5B83\u5305\u4E0A\u7CD6\u8863\u9012\u8FC7\u53BB\uFF0C\u800C\u5979\u4F1A\u5F20\u5F00\u5634\uFF0C\u548C\u541E\u4E0B\u6B64\u524D\u6BCF\u4E00\u9897\u4ED6\u9012\u8FC7\u53BB\u7684\u7CD6\u4E00\u6837\uFF0C\u5168\u7136\u5730\uFF0C\u6BEB\u4E0D\u8BBE\u9632\u5730\uFF0C\u751A\u81F3\u5E26\u7740\u671F\u5F85\u5730\uFF0C\u541E\u4E0B\u53BB\u3002";

    var textFlow = document.getElementById('textFlow');
    var collageArea = document.getElementById('collage-area');
    var sourceArea = document.getElementById('source-area');
    var posterCanvas = document.getElementById('poster-canvas');
    var resizer = document.getElementById('collage-resizer');
    var drawer = document.getElementById('drawer');
    var settingsDrawer = document.getElementById('settings-drawer');
    var commonMask = document.getElementById('common-mask');
    var currentLayout = 'vertical', currentTimeMode = 'solar';
    var isIconVisible = true, customIconDataUrl = null;

    window.openBpApp = function(text) { container.style.display = 'flex'; renderArticle(text || defaultText); setTimeout(function(){ syncCollageSize(); updateBottomMeta(); }, 80); };
    window.closeBpApp = function() { container.style.display = 'none'; closeAllDrawers(); };

    function toggleIconDisplay(show) { isIconVisible = show; updateBottomMeta(); }
    function uploadCustomIcon(e) { var file = e.target.files[0]; if(!file) return; var reader = new FileReader(); reader.onload = function(ev) { customIconDataUrl = ev.target.result; document.getElementById('custom-icon-img').src = customIconDataUrl; document.getElementById('custom-icon-name').innerText = file.name.substring(0,10); document.getElementById('custom-icon-preview-row').style.display = 'flex'; updateBottomMeta(); }; reader.readAsDataURL(file); }
    function clearCustomIcon() { customIconDataUrl = null; document.getElementById('custom-icon-img').src = ''; document.getElementById('custom-icon-preview-row').style.display = 'none'; updateBottomMeta(); }

    function getGanZhiDate(d){var tG=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"],dZ=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"],y=d.getFullYear(),o=(y-4)%60;return tG[o%10]+dZ[o%12]+'年 '+tG[d.getMonth()%10]+dZ[(d.getMonth()+2)%12]+'月 '+tG[d.getDate()%10]+dZ[(d.getDate()+4)%12]+'日';}
    function setTimeFormat(m){currentTimeMode=m;document.getElementById('btn-time-solar').classList.toggle('active',m==='solar');document.getElementById('btn-time-lunar').classList.toggle('active',m==='lunar');updateBottomMeta();}

    function updateBottomMeta(){
        var iconSlot=document.getElementById('bottom-icon-slot');
        if(isIconVisible){if(customIconDataUrl){iconSlot.innerHTML='<img src="'+customIconDataUrl+'" alt="icon">';}else{iconSlot.innerHTML='<span style="font-size:10px;line-height:1;">&#x1FAE7;</span>';}iconSlot.style.display='inline-flex';}else{iconSlot.innerHTML='';iconSlot.style.display='none';}
        var showTime=document.getElementById('toggle-time-cb').checked,timeSpan=document.getElementById('bottom-time-span');
        if(showTime){timeSpan.style.display='inline';var now=new Date();timeSpan.innerText=currentTimeMode==='solar'?now.getFullYear()+'.'+(now.getMonth()+1)+'.'+now.getDate():getGanZhiDate(now);}else{timeSpan.style.display='none';}
        var showWm=document.getElementById('toggle-watermark-cb').checked,wmSpan=document.getElementById('bottom-wm-span');wmSpan.style.display=showWm?'inline':'none';wmSpan.innerText=document.getElementById('watermark-text-input').value.trim();
    }

    function toggleDrawer(){if(drawer.classList.contains('open'))closeAllDrawers();else{closeAllDrawers();drawer.classList.add('open');commonMask.classList.add('visible');}}
    function toggleSettingsDrawer(){if(settingsDrawer.classList.contains('open'))closeAllDrawers();else{closeAllDrawers();settingsDrawer.classList.add('open');commonMask.classList.add('visible');}}
    function closeAllDrawers(){drawer.classList.remove('open');settingsDrawer.classList.remove('open');commonMask.classList.remove('visible');}

    function initColorPaletteUI(id,cb){var c=document.getElementById(id);c.innerHTML='';[{label:'浅色系',list:colorCategories.light},{label:'复古色系',list:colorCategories.vintage},{label:'深色系',list:colorCategories.dark}].forEach(function(sec){var lbl=document.createElement('div');lbl.className='color-group-label';lbl.innerText=sec.label;c.appendChild(lbl);var row=document.createElement('div');row.className='color-palette-row';sec.list.forEach(function(cl){var btn=document.createElement('button');btn.className='color-dot';btn.style.backgroundColor=cl.bg;btn.title=cl.name;btn.onclick=function(){cb(cl.bg);};row.appendChild(btn);});c.appendChild(row);});}
    function initTextColorPaletteUI(){var c=document.getElementById('textColorPaletteContainer');var row=document.createElement('div');row.className='color-palette-row';['#1A1A1A','#FFFFFF','#666666','#A0A0A0','#6B2D2B','#334839','#203A4C','#6B442A','#C99E5C','#D9CBB7','#E5EADF','#EFE5E3'].forEach(function(col){var btn=document.createElement('button');btn.className='color-dot';btn.style.backgroundColor=col;btn.onclick=function(){setTextColor(col);};row.appendChild(btn);});c.appendChild(row);}

    function arrangeStrictGrid(targetLines){var scraps=Array.from(collageArea.querySelectorAll('.scrap-word'));var count=scraps.length;if(!count)return;var rect=collageArea.getBoundingClientRect();var cardW=28,cardH=32,gapX=8,gapY=12;var sumX=0,sumY=0;scraps.forEach(function(s){sumX+=parseFloat(s.style.left)||0;sumY+=parseFloat(s.style.top)||0;});var cX=sumX/count+cardW/2,cY=sumY/count+cardH/2;var aL=Math.min(targetLines,count),base=Math.floor(count/aL),rem=count%aL;var maxC=base+(rem>0?1:0),mW=maxC*cardW+(maxC-1)*gapX,mH=aL*cardH+(aL-1)*gapY;var oX=Math.max(10,Math.min(rect.width-mW-10,cX-mW/2)),oY=Math.max(10,Math.min(rect.height-mH-35,cY-mH/2));var ci=0;for(var line=0;line<aL;line++){var items=base+(line<rem?1:0),lW=items*cardW+(items-1)*gapX;var lX=oX+(mW-lW)/2,lY=oY+line*(cardH+gapY);for(var col=0;col<items;col++){var sc=scraps[ci];if(!sc)break;sc.style.transition='all 0.32s cubic-bezier(0.2,0.9,0.3,1)';sc.style.transform='rotate(0deg)';sc.style.left=(lX+col*(cardW+gapX))+'px';sc.style.top=lY+'px';ci++;}}setTimeout(function(){scraps.forEach(function(s){s.style.transition='';});},350);}

    function calculateCutColor(hex){var rgb=parseInt(hex.replace('#',''),16);var r=(rgb>>16)&0xff,g=(rgb>>8)&0xff,b=rgb&0xff;return(0.2126*r+0.7152*g+0.0722*b)>140?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.15)';}
    function setTopBg(c){sourceArea.style.backgroundImage='none';root.style.setProperty('--top-bg',c);root.style.setProperty('--scrap-bg',c);root.style.setProperty('--top-cut-color',calculateCutColor(c));}
    function setTopCustomBg(v){setTopBg(v);}
    function setBottomBg(c){collageArea.style.backgroundImage='none';root.style.setProperty('--bottom-bg',c);}
    function setBottomCustomBg(v){setBottomBg(v);}
    function setTextColor(c){root.style.setProperty('--shared-text-color',c);document.getElementById('textColorPicker').value=c.startsWith('#')?c:'#1a1a1a';}

    function applyTextureEffect(layerId,type){var layer=document.getElementById(layerId);var map={none:['none','none'],frosted:['url(#tex-frosted-filter)','#888'],noise:['url(#tex-noise-filter)','#888'],paper:['url(#tex-paper-filter)','#DDD'],fabric:['url(#tex-fabric-filter)','#888'],scratch:['url(#tex-scratch-filter)','#888']};var pair=map[type]||map.none;layer.style.filter=pair[0];layer.style.background=pair[1];}
    function setTopTexture(type){document.querySelectorAll('[id^="top-tex-"]').forEach(function(b){b.classList.remove('active');});document.getElementById('top-tex-'+type).classList.add('active');applyTextureEffect('top-texture',type);if(type!=='none'&&document.getElementById('top-grain-slider').value==0){document.getElementById('top-grain-slider').value=30;setTopGrainOpacity(30);}}
    function setTopGrainOpacity(v){root.style.setProperty('--top-grain-opacity',v/100);}
    function setBottomTexture(type){document.querySelectorAll('[id^="bot-tex-"]').forEach(function(b){b.classList.remove('active');});document.getElementById('bot-tex-'+type).classList.add('active');applyTextureEffect('bottom-texture',type);if(type!=='none'&&document.getElementById('bot-grain-slider').value==0){document.getElementById('bot-grain-slider').value=30;setBottomGrainOpacity(30);}}
    function setBottomGrainOpacity(v){root.style.setProperty('--bottom-grain-opacity',v/100);}

    function setZoneFont(zone,fontFamily,element,fontName){var listId=zone==='top'?'topFontList':'bottomFontList';var labelId=zone==='top'?'top-font-name-label':'bottom-font-name-label';document.querySelectorAll('#'+listId+' .font-compact-item').forEach(function(i){i.classList.remove('selected');});if(element)element.classList.add('selected');document.getElementById(labelId).innerText=fontName;root.style.setProperty(zone==='top'?'--top-font-family':'--scrap-font-family',fontFamily);setTimeout(function(){if(currentLayout==='horizontal')collageArea.style.height=sourceArea.offsetHeight+'px';},30);}
    function loadCustomFont(e){var file=e.target.files[0];if(!file)return;var fontName="UserFont_"+Date.now(),cleanName=file.name.replace(/\.[^/.]+$/,"").substring(0,8);var reader=new FileReader();reader.onload=async function(ev){try{var nf=new FontFace(fontName,ev.target.result);await nf.load();document.fonts.add(nf);addFontItemToList('top',fontName,cleanName);addFontItemToList('bottom',fontName,cleanName);alert('字体 ['+cleanName+'] 导入成功!');}catch(err){alert("字体解析失败!");}};reader.readAsArrayBuffer(file);}
    function addFontItemToList(zone,fontName,cleanName){var c=document.getElementById(zone==='top'?'topFontList':'bottomFontList');var item=document.createElement('div');item.className='font-compact-item';item.innerHTML='<div class="font-name-col">'+cleanName+'</div><div class="font-preview-col" style="font-family:\''+fontName+'\',serif;">恨水虚席</div>';item.onclick=function(){setZoneFont(zone,"'"+fontName+"', serif",this,cleanName);};c.insertBefore(item,c.firstChild);}
    function setTopFontSize(v){root.style.setProperty('--top-font-size',v+'px');setTimeout(function(){if(currentLayout==='horizontal')collageArea.style.height=sourceArea.offsetHeight+'px';},30);}
    function setScrapFontSize(v){root.style.setProperty('--scrap-font-size',v+'px');}

    function syncCollageSize(){if(currentLayout==='vertical'){collageArea.style.width='100%';collageArea.style.height=sourceArea.offsetHeight+'px';}else{collageArea.style.height=sourceArea.offsetHeight+'px';collageArea.style.width=sourceArea.offsetWidth+'px';}}
    function switchLayout(type){currentLayout=type;document.getElementById('btn-layout-vertical').classList.toggle('active',type==='vertical');document.getElementById('btn-layout-horizontal').classList.toggle('active',type==='horizontal');if(type==='horizontal'){posterCanvas.classList.add('layout-horizontal');collageArea.style.height=sourceArea.offsetHeight+'px';collageArea.style.width='340px';}else{posterCanvas.classList.remove('layout-horizontal');collageArea.style.width='100%';collageArea.style.height=sourceArea.offsetHeight+'px';}}
    function initCollageResizer(){var isR=false,sX,sY,sW,sH;var onS=function(e){isR=true;var p=e.type.includes('touch')?e.touches[0]:e;sX=p.clientX;sY=p.clientY;sW=collageArea.offsetWidth;sH=collageArea.offsetHeight;e.stopPropagation();};var onM=function(e){if(!isR)return;var p=e.type.includes('touch')?e.touches[0]:e;if(currentLayout==='vertical'){collageArea.style.height=Math.max(140,sH+(p.clientY-sY))+'px';}else{collageArea.style.width=Math.max(140,sW+(p.clientX-sX))+'px';collageArea.style.height=sourceArea.offsetHeight+'px';}};var onE=function(){isR=false;};resizer.addEventListener('mousedown',onS);window.addEventListener('mousemove',onM);window.addEventListener('mouseup',onE);resizer.addEventListener('touchstart',onS,{passive:true});window.addEventListener('touchmove',onM,{passive:true});window.addEventListener('touchend',onE);}

    function renderArticle(text){textFlow.innerHTML='';collageArea.querySelectorAll('.scrap-word').forEach(function(e){e.remove();});text.split('').forEach(function(char,idx){var span=document.createElement('span');span.className='char-node';span.textContent=char;span.dataset.char=char;span.dataset.idx=idx;span.onclick=function(){handleCharClick(span);};textFlow.appendChild(span);});setTimeout(function(){if(currentLayout==='horizontal')collageArea.style.height=sourceArea.offsetHeight+'px';},30);}
    function handleCharClick(span){var idx=span.dataset.idx;if(span.classList.contains('is-cut')){span.classList.remove('is-cut');var sc=collageArea.querySelector('.scrap-word[data-idx="'+idx+'"]');if(sc)sc.remove();return;}span.classList.add('is-cut');spawnScrap(span.dataset.char,idx);}
    function spawnScrap(char,idx){var scrap=document.createElement('div');scrap.className='scrap-word';scrap.textContent=char;scrap.dataset.idx=idx;var rect=collageArea.getBoundingClientRect();scrap.style.left=(Math.random()*(rect.width-50)+20)+'px';scrap.style.top=(Math.random()*(rect.height-60)+20)+'px';bindDrag(scrap);scrap.ondblclick=function(){var t=textFlow.querySelector('.char-node[data-idx="'+idx+'"]');if(t)t.classList.remove('is-cut');scrap.remove();};collageArea.appendChild(scrap);}
    function bindDrag(el){var sX,sY,oX,oY,isDragging=false;var onS=function(e){isDragging=true;var p=e.type.includes('touch')?e.touches[0]:e;sX=p.clientX;sY=p.clientY;oX=parseFloat(el.style.left)||0;oY=parseFloat(el.style.top)||0;el.style.zIndex=1000;};var onM=function(e){if(!isDragging)return;var p=e.type.includes('touch')?e.touches[0]:e;el.style.left=(oX+(p.clientX-sX))+'px';el.style.top=(oY+(p.clientY-sY))+'px';};var onE=function(){isDragging=false;el.style.zIndex=10;};el.addEventListener('mousedown',onS);window.addEventListener('mousemove',onM);window.addEventListener('mouseup',onE);el.addEventListener('touchstart',onS,{passive:true});window.addEventListener('touchmove',onM,{passive:true});window.addEventListener('touchend',onE);}
    function uploadTopBg(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){sourceArea.style.backgroundImage='url('+ev.target.result+')';};r.readAsDataURL(f);}
    function uploadBottomBg(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){collageArea.style.backgroundImage='url('+ev.target.result+')';};r.readAsDataURL(f);}
    function resetCuts(){textFlow.querySelectorAll('.char-node.is-cut').forEach(function(n){n.classList.remove('is-cut');});collageArea.querySelectorAll('.scrap-word').forEach(function(n){n.remove();});}

    function exportPosterImage(){
        if(typeof html2canvas === 'undefined'){alert('截图组件尚未加载完成，请稍后再试。');return;}
        closeAllDrawers();resizer.style.display='none';
        html2canvas(posterCanvas,{scale:4,useCORS:true,allowTaint:true,backgroundColor:null,logging:false}).then(function(canvas){
            resizer.style.display='flex';
            canvas.toBlob(function(blob){
                var url=URL.createObjectURL(blob);
                var a=document.createElement('a');a.href=url;a.download='Collage_Poem_HD_'+Date.now()+'.png';
                document.body.appendChild(a);a.click();document.body.removeChild(a);
                setTimeout(function(){URL.revokeObjectURL(url);},3000);
            },'image/png');
        }).catch(function(err){resizer.style.display='flex';alert('保存失败: '+err.message);});
    }

    Object.assign(window, {
        toggleDrawer, toggleSettingsDrawer, closeAllDrawers, toggleIconDisplay, uploadCustomIcon, clearCustomIcon,
        setTopBg, setTopCustomBg, setBottomBg, setBottomCustomBg, setTextColor,
        applyTextureEffect, setTopTexture, setTopGrainOpacity, setBottomTexture, setBottomGrainOpacity,
        setZoneFont, loadCustomFont, addFontItemToList, setTopFontSize, setScrapFontSize,
        syncCollageSize, switchLayout, renderArticle, handleCharClick, spawnScrap, bindDrag,
        uploadTopBg, uploadBottomBg, resetCuts, exportPosterImage,
        arrangeStrictGrid, getGanZhiDate, setTimeFormat, updateBottomMeta
    });

    // 5. 初始化
    initColorPaletteUI('topPaletteContainer', setTopBg);
    initColorPaletteUI('bottomPaletteContainer', setBottomBg);
    initTextColorPaletteUI();
    initCollageResizer();

    // 6. 魔法棒面板
    var mountExt = function() {
        var panel = document.getElementById('extensions_settings');
        if (panel && !document.getElementById('bp-ext-item')) {
            var d = document.createElement('div');
            d.className = 'list-group-item flex-container flexGap smolWidth';
            d.id = 'bp-ext-item';
            d.innerHTML = '<div class="m-b-0 m-t-0 extensionsMenu--title"><span style="font-size:14px;margin-right:5px;">&#x1FAE7;</span><span>剪报拼贴诗</span></div><div style="cursor:pointer;margin-left:auto;background:var(--SmartThemeBotttomColor);padding:4px 10px;border-radius:4px;font-size:12px;" onclick="openBpApp(null)">打开工坊</div>';
            panel.insertAdjacentElement('beforeend', d);
        }
    };
    setTimeout(mountExt, 1500);
    setInterval(mountExt, 5000);

    // 7. 选词弹窗
    var selectedText = '';
    document.addEventListener('selectionchange', function() {
        var sel = window.getSelection();
        var text = sel ? sel.toString().trim() : '';
        if (text.length > 0 && sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest && sel.anchorNode.parentElement.closest('#chat')) {
            selectedText = text;
            selPopup.style.display = 'flex';
        } else {
            selPopup.style.display = 'none';
        }
    });
    selPopup.onclick = function() {
        try { window.getSelection().removeAllRanges(); } catch(e) {}
        selPopup.style.display = 'none';
        window.openBpApp(selectedText);
    };

    // 8. settings.html 按钮兼容
    $(document).on('click', '#bp_open_studio_btn', function() {
        window.openBpApp(null);
    });
});
