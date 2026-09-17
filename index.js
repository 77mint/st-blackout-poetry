// 🚫 严格遵循官方文档：直接使用全局 SillyTavern 对象
// 🌟 100% 完整复原钱老师的原版 UI 与功能

jQuery(async () => {
    // 1. 动态引入所需依赖与字体
    if (!window.html2canvas) {
        const sc = document.createElement('script');
        sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(sc);
    }
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;600&family=ZCOOL+XiaoWei&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // 2. 将钱老师的原版 HTML 包进一个独立全屏容器中，绝不干扰酒馆
    const appHTML = `
    <style>
        #bp-app-container {
            --page-bg: #F5F5F7; --top-bg: #F7F5F0; --top-bg-img: none; --top-cut-color: rgba(0,0,0,0.06);
            --top-font-size: 14.5px; --top-grain-opacity: 0; --top-font-family: 'Noto Serif SC', serif;
            --bottom-bg: #F7F5F0; --bottom-bg-img: none; --scrap-bg: var(--top-bg);
            --scrap-font-size: 14.5px; --bottom-grain-opacity: 0; --scrap-font-family: 'Noto Serif SC', serif;
            --shared-text-color: #1A1A1A;
            
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: var(--page-bg); z-index: 999999; display: none;
            justify-content: center; align-items: center; overflow: auto;
            padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #bp-app-container * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
        
        /* ⬇️ 以下全是钱老师原版 CSS ⬇️ */
        #top-left-bar { position: fixed; top: 20px; left: 20px; display: flex; align-items: center; gap: 8px; z-index: 2005; }
        #top-right-bar { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; z-index: 2005; }
        .icon-btn { width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer; background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 4px; backdrop-filter: blur(8px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04); transition: all 0.2s ease; }
        .icon-btn:hover { background: #FFFFFF; border-color: #000; }
        .icon-btn svg { width: 18px; height: 18px; stroke: #1C1C1C; stroke-width: 1.6; fill: none; }
        #menu-trigger .bar { width: 16px; height: 1.5px; background-color: #1C1C1C; margin: 2px 0; }
        .layout-toggle-group { display: flex; background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 4px; backdrop-filter: blur(8px); padding: 2px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04); }
        .layout-btn { background: transparent; border: none; color: #666; font-size: 11px; padding: 6px 12px; border-radius: 2px; cursor: pointer; transition: all 0.15s; }
        .layout-btn:hover { color: #000; } .layout-btn.active { background: #1C1C1C; color: #FFFFFF; font-weight: 500; }
        #common-mask { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.18); z-index: 1998; display: none; opacity: 0; transition: opacity 0.25s ease; }
        #common-mask.visible { display: block; opacity: 1; }
        #drawer { position: fixed; top: 0; left: -370px; width: 350px; height: 100vh; background: rgba(255, 255, 255, 0.98); border-right: 1px solid rgba(0, 0, 0, 0.08); backdrop-filter: blur(20px); box-shadow: 10px 0 35px rgba(0, 0, 0, 0.04); z-index: 1999; display: flex; flex-direction: column; padding: 75px 20px 30px 20px; overflow-y: auto; transition: left 0.3s cubic-bezier(0.22, 1, 0.36, 1); color: #222; font-size: 11.5px; }
        #drawer.open { left: 0; }
        #settings-drawer { position: fixed; top: 0; right: -370px; width: 340px; height: 100vh; background: rgba(255, 255, 255, 0.98); border-left: 1px solid rgba(0, 0, 0, 0.08); backdrop-filter: blur(20px); box-shadow: -10px 0 35px rgba(0, 0, 0, 0.04); z-index: 1999; display: flex; flex-direction: column; padding: 75px 20px 30px 20px; overflow-y: auto; transition: right 0.3s cubic-bezier(0.22, 1, 0.36, 1); color: #222; font-size: 11.5px; }
        #settings-drawer.open { right: 0; }
        .drawer-section { margin-bottom: 18px; border-bottom: 1px solid rgba(0, 0, 0, 0.06); padding-bottom: 14px; } .drawer-section:last-child { border-bottom: none; }
        .section-title { font-size: 9.5px; letter-spacing: 0.1em; color: #888; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; }
        .color-group-label { font-size: 9px; color: #999; margin: 4px 0 2px 0; }
        .color-palette-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 5px; }
        .color-dot { height: 20px; border-radius: 2px; border: 1px solid rgba(0, 0, 0, 0.1); cursor: pointer; transition: transform 0.15s; } .color-dot:hover { transform: scale(1.1); z-index: 2; }
        .color-picker-wrapper { display: flex; align-items: center; gap: 6px; margin: 4px 0 8px 0; background: #F4F4F4; padding: 4px 8px; border-radius: 2px; } .color-picker-input { width: 22px; height: 22px; border: none; padding: 0; cursor: pointer; background: none; }
        .grid-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 6px; } .grid-buttons.five-col { grid-template-columns: repeat(3, 1fr); }
        .action-chip { background: #F4F4F4; border: 1px solid rgba(0, 0, 0, 0.05); color: #333; padding: 6px 0; text-align: center; border-radius: 2px; cursor: pointer; font-size: 10px; transition: all 0.15s; } .action-chip:hover, .action-chip.active { background: #1C1C1C; color: #FFF; }
        .file-wrapper { position: relative; overflow: hidden; display: block; margin-top: 4px; } .file-wrapper input[type="file"] { position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .slider-row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; } .slider-row span { color: #777; font-size: 9.5px; } .slider-row input[type="range"] { width: 150px; accent-color: #000; }
        .sub-panel-box { background: #FBFBFB; border: 1px solid #EBEBEB; border-radius: 4px; padding: 10px; margin-top: 8px; } .sub-panel-title { font-size: 10px; font-weight: 600; color: #1C1C1C; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .font-compact-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; max-height: 110px; overflow-y: auto; } .font-compact-item { display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 2px; padding: 4px 8px; cursor: pointer; transition: all 0.15s ease; } .font-compact-item:hover { border-color: #1C1C1C; } .font-compact-item.selected { border-color: #1C1C1C; background: #F0F0F0; font-weight: 600; } .font-name-col { font-size: 10px; color: #444; } .font-preview-col { font-size: 13px; color: #111; letter-spacing: 0.05em; }
        .setting-field { margin-bottom: 12px; } .setting-field label { display: block; font-size: 9.5px; color: #777; margin-bottom: 4px; } .setting-input { width: 100%; background: #F7F7F7; border: 1px solid #E5E5E5; padding: 6px 8px; font-size: 11px; border-radius: 2px; outline: none; color: #111; } .setting-toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .mask-clean-group { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; } .mask-clean-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11.5px; color: #1A1A1A; line-height: 1; } .mask-icon-symbol { font-size: 14px; display: inline-block; width: 14px; text-align: center; color: #1C1C1C; } .mask-type-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 8px; }
        #poster-canvas { box-shadow: 0 12px 45px rgba(0, 0, 0, 0.08); position: relative; display: flex; flex-direction: column; border: 1px solid rgba(0,0,0,0.06); touch-action: none; width: 440px; } #poster-canvas.layout-horizontal { flex-direction: row !important; width: auto !important; }
        #source-area { background-color: var(--top-bg); background-image: var(--top-bg-img); background-size: cover; background-position: center; padding: 40px 36px 30px 36px; position: relative; flex-shrink: 0; height: auto; font-family: var(--top-font-family); } #poster-canvas.layout-horizontal #source-area { width: 360px; }
        .text-flow { color: var(--shared-text-color); font-size: var(--top-font-size); line-height: 2.2; letter-spacing: 0.06em; text-align: justify; word-break: break-all; }
        .char-node { cursor: pointer; position: relative; display: inline-block; transition: transform 0.1s ease, filter 0.2s ease; } .char-node:hover:not(.is-cut) { opacity: 0.5; } .char-node.is-cut { color: transparent !important; } .char-node.is-cut::after { content: ""; position: absolute; top: 2px; bottom: 2px; left: 0px; right: 0px; background-color: var(--top-cut-color); border-radius: 1px; box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.15); } .char-node.mask-blur { filter: blur(3.5px); opacity: 0.6; } .char-node.mask-black { background-color: #1A1A1A; color: #1A1A1A !important; border-radius: 1px; } .char-node.mask-symbol { position: relative; color: transparent !important; } .char-node.mask-symbol::after { content: "×"; position: absolute; left: 0; top: 0; width: 100%; height: 100%; color: var(--shared-text-color); display: flex; align-items: center; justify-content: center; font-size: 13px; }
        #collage-area { position: relative; background-color: var(--bottom-bg); background-image: var(--bottom-bg-img); background-size: cover; background-position: center; border-top: 1px solid rgba(0, 0, 0, 0.04); flex-shrink: 0; min-height: 180px; min-width: 180px; overflow: hidden; font-family: var(--scrap-font-family); padding-bottom: 35px; } #poster-canvas.layout-horizontal #collage-area { border-top: none; border-left: 1px solid rgba(0, 0, 0, 0.04); }
        #collage-resizer { position: absolute; z-index: 1000; display: flex; align-items: center; justify-content: center; } #poster-canvas:not(.layout-horizontal) #collage-resizer { bottom: 0; left: 0; width: 100%; height: 12px; cursor: ns-resize; } #poster-canvas:not(.layout-horizontal) #collage-resizer::after { content: ""; width: 32px; height: 3px; background: rgba(0, 0, 0, 0.2); border-radius: 2px; } #poster-canvas.layout-horizontal #collage-resizer { right: 0; top: 0; width: 12px; height: 100%; cursor: ew-resize; } #poster-canvas.layout-horizontal #collage-resizer::after { content: ""; width: 3px; height: 32px; background: rgba(0, 0, 0, 0.2); border-radius: 2px; }
        .scrap-word { position: absolute; background-color: var(--scrap-bg); color: var(--shared-text-color); padding: 3px 6px; font-size: var(--scrap-font-size); line-height: 1; border-radius: 1px; cursor: grab; box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.15); font-family: inherit; touch-action: none; z-index: 10; display: inline-flex; justify-content: center; align-items: center; width: 26px; height: 30px; } .scrap-word:active { cursor: grabbing; box-shadow: 2px 6px 14px rgba(0, 0, 0, 0.25); z-index: 100; }
        .texture-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: overlay; z-index: 800; } #top-texture { opacity: var(--top-grain-opacity); } #bottom-texture { opacity: var(--bottom-grain-opacity); }
        #poster-bottom-meta { position: absolute; bottom: 12px; left: 0; width: 100%; display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 8.5px; letter-spacing: 0.1em; color: var(--shared-text-color); opacity: 0.45; pointer-events: none; }
        .ins-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 3000; display: none; justify-content: center; align-items: center; } .modal-card { width: 90%; max-width: 450px; background: #FFFFFF; border-radius: 4px; padding: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .author-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 10px; } .author-btn { background: #F8F8F8; border: 1px solid #EAEAEA; padding: 10px; border-radius: 2px; cursor: pointer; text-align: center; font-weight: 500; font-size: 11.5px; color: #111; transition: all 0.15s; } .author-btn:hover { border-color: #000; background: #FFF; }
        
        /* 🚨 针对 iOS 选词挡住的修复：放到底部的巨大胶囊悬浮窗 */
        #bp-ios-selection-popup { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:99999; background:rgba(20,20,20,0.95); color:#fff; padding:12px 24px; border-radius:30px; box-shadow:0 8px 25px rgba(0,0,0,0.3); font-size:15px; font-weight:500; display:none; align-items:center; gap:8px; cursor:pointer; backdrop-filter:blur(8px); pointer-events:auto; border: 1px solid rgba(255,255,255,0.1); }
        
        /* 🚨 全局右侧边缘的芭菲呼出悬浮窗 */
        #bp-global-parfait { position:fixed; right:-15px; top:50%; transform:translateY(-50%); width:55px; height:55px; background:#fff; border-radius:27px; box-shadow:-2px 4px 15px rgba(0,0,0,0.1); z-index:9990; display:flex; justify-content:flex-start; align-items:center; cursor:pointer; padding-left:12px; transition:0.2s; border: 1px solid #eee; }
        #bp-global-parfait:hover { right: 0px; background:#f9f9f9; }
    </style>

    <!-- HTML 主体结构完全保留 -->
    <svg style="display:none;"><defs><filter id="tex-frosted-filter"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" stitchTiles="stitch"/></filter><filter id="tex-noise-filter"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch"/></filter><filter id="tex-paper-filter"><feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="5" result="noise"/><feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter><filter id="tex-fabric-filter"><feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves="3" stitchTiles="stitch"/></filter><filter id="tex-scratch-filter"><feTurbulence type="turbulence" baseFrequency="0.01 0.4" numOctaves="2" stitchTiles="stitch"/></filter></defs></svg>

    <div id="top-left-bar">
        <!-- 🚨 新增的退出关闭按钮 -->
        <div class="icon-btn" onclick="closeBpApp()" title="退出关闭" style="border-color:rgba(211,47,47,0.3);">
            <svg viewBox="0 0 24 24" style="stroke: #d32f2f; stroke-width: 2;"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </div>
        <div class="icon-btn" id="menu-trigger" onclick="toggleDrawer()" title="工具栏">
            <div style="display:flex; flex-direction:column; gap:4px; align-items:center;"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
        </div>
        <div class="icon-btn" id="bulb-trigger" onclick="openAuthorModal()" title="灵感文笔">
            <svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>
        </div>
        <div class="layout-toggle-group">
            <button class="layout-btn active" id="btn-layout-vertical" onclick="switchLayout('vertical')">上下</button>
            <button class="layout-btn" id="btn-layout-horizontal" onclick="switchLayout('horizontal')">左右</button>
        </div>
    </div>
    <div id="top-right-bar">
        <div class="icon-btn" id="settings-trigger" onclick="toggleSettingsDrawer()" title="设置">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <div class="icon-btn" id="save-trigger" onclick="exportPosterImage()" title="保存最高清海报">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
    </div>
    <div id="common-mask" onclick="closeAllDrawers()"></div>

    <!-- 左侧工具栏抽屉 (色盘、纹理、字体完全保留) -->
    <div id="drawer">
        <div class="drawer-section">
            <div class="section-title">1. 壁纸 (原文区)</div>
            <div id="topPaletteContainer"></div>
            <div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="topColorPicker" value="#F7F5F0" onchange="setTopCustomBg(this.value)"><span style="font-size:10px; color:#555;">自定义取色调色盘</span></div>
            <div class="file-wrapper"><div class="action-chip">上传壁纸图片</div><input type="file" accept="image/*" onchange="uploadTopBg(event)"></div>
            <div style="font-size:9px; color:#888; margin-top:8px; margin-bottom:3px;">壁纸纹理质感：</div>
            <div class="grid-buttons five-col">
                <button class="action-chip active" id="top-tex-none" onclick="setTopTexture('none')">无</button><button class="action-chip" id="top-tex-frosted" onclick="setTopTexture('frosted')">细磨砂</button><button class="action-chip" id="top-tex-noise" onclick="setTopTexture('noise')">胶片噪点</button><button class="action-chip" id="top-tex-paper" onclick="setTopTexture('paper')">粗糙纸纹</button><button class="action-chip" id="top-tex-fabric" onclick="setTopTexture('fabric')">复古布纹</button><button class="action-chip" id="top-tex-scratch" onclick="setTopTexture('scratch')">素描排线</button>
            </div>
            <div class="slider-row"><span>纹理浓度</span><input type="range" min="0" max="70" value="0" id="top-grain-slider" oninput="setTopGrainOpacity(this.value)"></div>
        </div>
        <div class="drawer-section">
            <div class="section-title">2. 底图 (拼贴区)</div>
            <div id="bottomPaletteContainer"></div>
            <div class="color-picker-wrapper"><input type="color" class="color-picker-input" id="botColorPicker" value="#F7F5F0" onchange="setBottomCustomBg(this.value)"><span style="font-size:10px; color:#555;">自定义取色调色盘</span></div>
            <div class="file-wrapper"><div class="action-chip">上传底图图片</div><input type="file" accept="image/*" onchange="uploadBottomBg(event)"></div>
            <button class="action-chip" style="width:100%; margin-top:6px;" onclick="syncCollageSize()">使拼贴区与原文区等大</button>
            <div style="font-size:9px; color:#888; margin-top:8px; margin-bottom:3px;">底图纹理质感：</div>
            <div class="grid-buttons five-col">
                <button class="action-chip active" id="bot-tex-none" onclick="setBottomTexture('none')">无</button><button class="action-chip" id="bot-tex-frosted" onclick="setBottomTexture('frosted')">细磨砂</button><button class="action-chip" id="bot-tex-noise" onclick="setBottomTexture('noise')">胶片噪点</button><button class="action-chip" id="bot-tex-paper" onclick="setBottomTexture('paper')">粗糙纸纹</button><button class="action-chip" id="bot-tex-fabric" onclick="setBottomTexture('fabric')">复古布纹</button><button class="action-chip" id="bot-tex-scratch" onclick="setBottomTexture('scratch')">素描排线</button>
            </div>
            <div class="slider-row"><span>纹理浓度</span><input type="range" min="0" max="70" value="0" id="bot-grain-slider" oninput="setBottomGrainOpacity(this.value)"></div>
        </div>
        <div class="drawer-section">
            <div class="section-title">3. 字体与文字颜色设置</div>
            <div style="font-size:10px; font-weight:600; color:#333; margin-bottom:4px;">文字颜色：</div>
            <div id="textColorPaletteContainer"></div>
            <div class="color-picker-wrapper" style="margin-bottom:10px;"><input type="color" class="color-picker-input" id="textColorPicker" value="#1A1A1A" onchange="setTextColor(this.value)"><span style="font-size:10px; color:#555;">自定义文字调色盘</span></div>
            <div class="file-wrapper" style="margin-bottom:8px;"><div class="action-chip" style="background:#EBEBEB; font-weight:600;">导入本地 .TTF / .OTF 字体文件</div><input type="file" accept=".ttf,.otf,.woff,.woff2" onchange="loadCustomFont(event)"></div>
            <div class="sub-panel-box">
                <div class="sub-panel-title"><span>原文区字体</span><span id="top-font-name-label" style="font-size:9px; color:#999; font-weight:normal;">思源宋体</span></div>
                <div class="font-compact-list" id="topFontList">
                    <div class="font-compact-item selected" onclick="setZoneFont('top', 'Noto Serif SC, serif', this, '思源宋体')"><div class="font-name-col">思源宋体</div><div class="font-preview-col" style="font-family:'Noto Serif SC', serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('top', 'Ma Shan Zheng, cursive', this, '马善政毛笔')"><div class="font-name-col">马善政毛笔</div><div class="font-preview-col" style="font-family:'Ma Shan Zheng', cursive;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('top', 'ZCOOL XiaoWei, serif', this, '站酷小薇体')"><div class="font-name-col">站酷小薇体</div><div class="font-preview-col" style="font-family:'ZCOOL XiaoWei', serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('top', 'Noto Sans SC, sans-serif', this, '思源黑体')"><div class="font-name-col">思源黑体</div><div class="font-preview-col" style="font-family:'Noto Sans SC', sans-serif;">恨水虚席</div></div>
                </div>
                <div class="slider-row"><span>原文字号大小</span><input type="range" min="11" max="24" value="14" oninput="setTopFontSize(this.value)"></div>
            </div>
            <div class="sub-panel-box" style="margin-top:8px;">
                <div class="sub-panel-title"><span>拼贴区字体</span><span id="bottom-font-name-label" style="font-size:9px; color:#999; font-weight:normal;">思源宋体</span></div>
                <div class="font-compact-list" id="bottomFontList">
                    <div class="font-compact-item selected" onclick="setZoneFont('bottom', 'Noto Serif SC, serif', this, '思源宋体')"><div class="font-name-col">思源宋体</div><div class="font-preview-col" style="font-family:'Noto Serif SC', serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('bottom', 'Ma Shan Zheng, cursive', this, '马善政毛笔')"><div class="font-name-col">马善政毛笔</div><div class="font-preview-col" style="font-family:'Ma Shan Zheng', cursive;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('bottom', 'ZCOOL XiaoWei, serif', this, '站酷小薇体')"><div class="font-name-col">站酷小薇体</div><div class="font-preview-col" style="font-family:'ZCOOL XiaoWei', serif;">恨水虚席</div></div>
                    <div class="font-compact-item" onclick="setZoneFont('bottom', 'Noto Sans SC, sans-serif', this, '思源黑体')"><div class="font-name-col">思源黑体</div><div class="font-preview-col" style="font-family:'Noto Sans SC', sans-serif;">恨水虚席</div></div>
                </div>
                <div class="slider-row"><span>拼贴小字大小</span><input type="range" min="11" max="24" value="14" oninput="setScrapFontSize(this.value)"></div>
            </div>
        </div>
        <div class="drawer-section">
            <div class="section-title">4. 抠字排版</div>
            <div class="grid-buttons"><button class="action-chip" onclick="arrangeStrictGrid(1)">原地排 1 行</button><button class="action-chip" onclick="arrangeStrictGrid(2)">原地排 2 行</button><button class="action-chip" style="font-weight:600; border-color:#000;" onclick="arrangeStrictGrid(3)">原地排 3 行</button></div>
            <button class="action-chip" style="width:100%; margin-top:8px;" onclick="resetCuts()">复原全部字</button>
        </div>
    </div>

    <!-- 右侧设置抽屉 -->
    <div id="settings-drawer">
        <div class="drawer-section">
            <div class="section-title">一键打码</div>
            <div class="mask-clean-group">
                <div class="mask-clean-row" onclick="toggleMaskTarget('user')"><span class="mask-icon-symbol" id="mask-symbol-user">⊹</span><span>User</span></div>
                <div class="mask-clean-row" onclick="toggleMaskTarget('char')"><span class="mask-icon-symbol" id="mask-symbol-char">⊹</span><span>Char</span></div>
            </div>
            <div style="font-size:9.5px; color:#777; margin-top:12px; margin-bottom:4px;">打码样式</div>
            <div class="mask-type-options">
                <button class="action-chip active" id="mask-style-blur" onclick="setMaskStyle('blur')">高斯模糊</button><button class="action-chip" id="mask-style-black" onclick="setMaskStyle('black')">涂黑</button><button class="action-chip" id="mask-style-symbol" onclick="setMaskStyle('symbol')">符号</button>
            </div>
        </div>
        <div class="drawer-section">
            <div class="section-title">时间与水印</div>
            <div class="setting-toggle-row"><span>显示时间</span><input type="checkbox" id="toggle-time-cb" checked onchange="updateBottomMeta()" style="accent-color:#000;"></div>
            <div style="display:flex; gap:4px; margin-bottom:8px;"><button class="action-chip active" id="btn-time-solar" onclick="setTimeFormat('solar')">公历</button><button class="action-chip" id="btn-time-lunar" onclick="setTimeFormat('lunar')">干支历</button></div>
            <div class="setting-toggle-row" style="margin-top:14px;"><span>显示水印</span><input type="checkbox" id="toggle-watermark-cb" checked onchange="updateBottomMeta()" style="accent-color:#000;"></div>
            <div class="setting-field"><input type="text" class="setting-input" id="watermark-text-input" value="SillyTavern" oninput="updateBottomMeta()"></div>
        </div>
    </div>

    <!-- 画布区域 -->
    <div id="poster-canvas">
        <div id="source-area"><div class="text-flow" id="textFlow"></div><div class="texture-layer" id="top-texture" style="background:none;"></div></div>
        <div id="collage-area">
            <div class="texture-layer" id="bottom-texture" style="background:none;"></div>
            <div id="poster-bottom-meta"><span id="bottom-time-span"></span><span id="bottom-wm-span">SillyTavern</span></div>
            <div id="collage-resizer" title="按住拉伸拼贴区"></div>
        </div>
    </div>

    <!-- 文人骚客弹窗 -->
    <div class="ins-modal" id="author-modal">
        <div class="modal-card">
            <div style="font-size:12px; font-weight:600; color:#111; margin-bottom:4px;">选择文笔风格</div>
            <div class="author-grid" id="authorGridContainer"></div>
            <div style="display:flex; justify-content:flex-end; margin-top:14px;"><button class="action-chip" style="padding:5px 14px;" onclick="closeAuthorModal()">关闭</button></div>
        </div>
    </div>
    `;

    // 将完全复原的 UI 注入容器中，确保不会污染外部环境
    const container = document.createElement('div');
    container.id = 'bp-app-container';
    container.innerHTML = appHTML;
    document.body.appendChild(container);

    // 🚨 针对 iOS 选词遮挡的问题：添加在屏幕最底部的胶囊选词按钮
    const iosSelectionPopup = document.createElement('div');
    iosSelectionPopup.id = 'bp-ios-selection-popup';
    // 这里默认读取插件目录下的 parfait.png，如果没放这张图，自动回退成纯文本图标 🍨，确保绝对能看见！
    iosSelectionPopup.innerHTML = `
        <img src="/scripts/extensions/third-party/st-blackout-poetry/parfait.png" onerror="this.outerHTML='<span style=\\'font-size:18px;\\'>✂️</span>'" style="width:20px; height:20px; object-fit:contain;">
        <span>生成拼贴诗</span>
    `;
    document.body.appendChild(iosSelectionPopup);

    // 🚨 为了防止魔法棒出故障，添加全局屏幕右侧悬浮的常驻芭菲图标！
    const globalParfaitBtn = document.createElement('div');
    globalParfaitBtn.id = 'bp-global-parfait';
    globalParfaitBtn.innerHTML = `
        <img src="/scripts/extensions/third-party/st-blackout-poetry/parfait.png" onerror="this.outerHTML='<span style=\\'font-size:22px;\\'>🍨</span>'" style="width:24px; height:24px; object-fit:contain;">
    `;
    globalParfaitBtn.onclick = () => window.openBpApp("点击全局芭菲打开的。请划选对话内容来截取！");
    document.body.appendChild(globalParfaitBtn);

    // ================= 以下为钱老师原版的所有 JS 逻辑，一字不漏 =================
    
    const authorsDatabase = [
        { name: "张爱玲", patterns: [["烫手的铁", "包上糖衣"], ["毫不设防", "吞下去"], ["信他", "成了", "烫手的铁"], ["糖衣", "递过去", "张开嘴"], ["腐蚀", "成", "铁"]], fallbackKeywords: ["糖衣", "铁", "吞", "嘴", "信", "痛", "爱"] },
        { name: "史铁生", patterns: [["二十五年", "建立在", "默认之上"], ["漫长", "的", "使用历史"], ["知道", "正确答案"], ["默认", "仍然成立"], ["时间", "在喉咙里"]], fallbackKeywords: ["时间", "漫长", "答案", "成立", "历史", "命"] },
        { name: "太宰治", patterns: [["全然地", "吞下去"], ["甚至", "带着期待"], ["毫不设防", "张开嘴"], ["他信他", "毫不设防"]], fallbackKeywords: ["吞", "张开嘴", "期待", "设防", "信"] },
        { name: "木心", patterns: [["教她用筷子", "系鞋带"], ["背唐诗", "到第三句"], ["教给她的一切"], ["水里", "不要闭眼睛"]], fallbackKeywords: ["唐诗", "筷子", "鞋带", "眼睛", "教"] },
        { name: "余华", patterns: [["喉咙里", "烫手的铁"], ["腐蚀成了铁", "吞下去"], ["每一颗", "递过去", "吞下"], ["建立在", "同一个默认"]], fallbackKeywords: ["铁", "喉咙", "腐蚀", "吞", "烫手"] },
        { name: "村上春树", patterns: [["在水里", "不要闭眼睛"], ["漫长的使用历史"], ["此刻", "仍然成立"], ["跑掉", "在水里"]], fallbackKeywords: ["水", "闭眼睛", "跑掉", "历史", "此刻"] },
        { name: "加缪", patterns: [["正确答案", "已经腐蚀"], ["此刻", "烫手的铁"], ["默认", "递过去"], ["知道答案", "仍成立"]], fallbackKeywords: ["正确答案", "腐蚀", "铁", "成立", "知道"] },
        { name: "博尔赫斯", patterns: [["拥有最漫长的使用历史"], ["同一个默认之上"], ["此前每一颗", "一样"], ["二十五年", "教给她的"]], fallbackKeywords: ["历史", "默认", "二十五年", "每一颗", "之上"] },
        { name: "王小波", patterns: [["带着期待地", "吞下去"], ["全然地", "毫不设防"], ["递过去", "张开嘴"], ["包上糖衣", "吞下"]], fallbackKeywords: ["期待", "全然", "张开嘴", "糖衣", "吞"] },
        { name: "鲁迅", patterns: [["喉咙里", "烫手的铁"], ["正确答案", "腐蚀成铁"], ["冷然", "递过去"], ["铁", "毫不设防"]], fallbackKeywords: ["铁", "喉咙", "腐蚀", "烫手", "答案"] }
    ];
    
    let authorClickCounters = {};
    const colorCategories = {
        light: [{ name: '复古奶白', bg: '#F7F5F0' }, { name: '冷纯白', bg: '#FFFFFF' }, { name: '冷灰', bg: '#F2F2F2' }, { name: '燕麦', bg: '#F0ECE1' }, { name: '灰粉', bg: '#EFE5E3' }, { name: '鼠尾草绿', bg: '#E5EADF' }],
        vintage: [{ name: '复古砖红', bg: '#6B2D2B' }, { name: '中古墨绿', bg: '#334839' }, { name: '油画深蓝', bg: '#203A4C' }, { name: '羊皮纸', bg: '#D9CBB7' }, { name: '焦糖棕', bg: '#6B442A' }, { name: '姜黄', bg: '#C99E5C' }],
        dark: [{ name: '纯黑', bg: '#111111' }, { name: '碳墨黑', bg: '#1C1E21' }, { name: '沥青灰', bg: '#2B2B2B' }, { name: '深黛蓝', bg: '#0F1A24' }, { name: '极夜紫', bg: '#1E1524' }, { name: '浓缩咖啡', bg: '#241B18' }]
    };

    let currentLayout = 'vertical';
    let currentTimeMode = 'solar';
    let maskUserActive = false;
    let maskCharActive = false;
    let currentMaskStyle = 'blur';

    // 绑定所有的全局变量以便内联 onclick 能调用
    const textFlow = document.getElementById('textFlow');
    const collageArea = document.getElementById('collage-area');
    const sourceArea = document.getElementById('source-area');
    const posterCanvas = document.getElementById('poster-canvas');
    const resizer = document.getElementById('collage-resizer');
    const drawer = document.getElementById('drawer');
    const settingsDrawer = document.getElementById('settings-drawer');
    const commonMask = document.getElementById('common-mask');

    window.openBpApp = function(text) {
        document.getElementById('bp-app-container').style.display = 'flex';
        renderArticle(text);
        setTimeout(() => { syncCollageSize(); updateBottomMeta(); }, 80);
    };

    window.closeBpApp = function() {
        document.getElementById('bp-app-container').style.display = 'none';
        closeAllDrawers();
    };

    function initAuthorGrid() {
        const c = document.getElementById('authorGridContainer'); c.innerHTML = '';
        authorsDatabase.forEach((author) => {
            authorClickCounters[author.name] = 0;
            const btn = document.createElement('div'); btn.className = 'author-btn'; btn.innerText = author.name;
            btn.onclick = () => { generateAuthorCollage(author); closeAuthorModal(); };
            c.appendChild(btn);
        });
    }

    function openAuthorModal() { document.getElementById('author-modal').style.display = 'flex'; }
    function closeAuthorModal() { document.getElementById('author-modal').style.display = 'none'; }

    function generateAuthorCollage(author) {
        resetCuts();
        const nodes = Array.from(textFlow.querySelectorAll('.char-node'));
        const textString = nodes.map(n => n.dataset.char).join('');
        const patterns = author.patterns;
        const clickCount = authorClickCounters[author.name] || 0;
        authorClickCounters[author.name] = clickCount + 1;
        let matchedWords = [];
        for (let i = 0; i < patterns.length; i++) {
            const patIndex = (clickCount + i) % patterns.length;
            const phraseList = patterns[patIndex];
            let canMatchAll = true, tempChars = [];
            for (let part of phraseList) {
                for (let ch of part) {
                    if (textString.includes(ch)) tempChars.push(ch);
                    else { canMatchAll = false; break; }
                }
                if (!canMatchAll) break;
            }
            if (canMatchAll && tempChars.length >= 4) { matchedWords = tempChars; break; }
        }
        if (matchedWords.length === 0) {
            author.fallbackKeywords.forEach(kw => {
                for (let ch of kw) { if (textString.includes(ch) && !matchedWords.includes(ch)) matchedWords.push(ch); }
            });
        }
        matchedWords = matchedWords.slice(0, 9);
        matchedWords.forEach(ch => simulateCutChar(ch));
        setTimeout(() => { arrangeStrictGrid(matchedWords.length > 5 ? 2 : 1); }, 100);
    }

    function toggleMaskTarget(target) {
        if (target === 'user') { maskUserActive = !maskUserActive; document.getElementById('mask-symbol-user').innerText = maskUserActive ? '✦' : '⊹'; }
        else if (target === 'char') { maskCharActive = !maskCharActive; document.getElementById('mask-symbol-char').innerText = maskCharActive ? '✦' : '⊹'; }
        applyMaskingToText();
    }

    function setMaskStyle(style) {
        currentMaskStyle = style;
        document.querySelectorAll('[id^="mask-style-"]').forEach(b => b.classList.remove('active'));
        document.getElementById(`mask-style-${style}`).classList.add('active');
        applyMaskingToText();
    }

    function applyMaskingToText() {
        const nodes = Array.from(textFlow.querySelectorAll('.char-node'));
        
        // 自动从酒馆原生接口里捞主角名字和配角名字
        let uName = "User", cName = "Char";
        try {
            const ctx = SillyTavern.getContext();
            if (ctx.name1) uName = ctx.name1;
            if (ctx.characters && ctx.characterId !== undefined && ctx.characters[ctx.characterId]) { cName = ctx.characters[ctx.characterId].name; } 
            else if (ctx.name2) { cName = ctx.name2; }
        } catch(e) {}
        
        const charSet = new Set([cName, "莫诺马赫", "林越安", "高杉", "桂", "他", "她"]);
        const userSet = new Set([uName, "我", "你"]);
        
        nodes.forEach(n => { n.classList.remove('mask-blur', 'mask-black', 'mask-symbol'); });
        nodes.forEach(node => {
            const char = node.dataset.char;
            if (maskCharActive && charSet.has(char)) node.classList.add(`mask-${currentMaskStyle}`);
            if (maskUserActive && userSet.has(char)) node.classList.add(`mask-${currentMaskStyle}`);
        });
    }

    function getGanZhiDate(date) {
        const tianGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
        const diZhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
        const year = date.getFullYear(); const yearOffset = (year - 4) % 60;
        const gan = tianGan[yearOffset % 10]; const zhi = diZhi[yearOffset % 12];
        const monthZhi = diZhi[(date.getMonth() + 2) % 12]; const dayZhi = diZhi[(date.getDate() + 4) % 12];
        return `${gan}${zhi}年 ${tianGan[(date.getMonth()) % 10]}${monthZhi}月 ${tianGan[(date.getDate()) % 10]}${dayZhi}日`;
    }

    function setTimeFormat(mode) {
        currentTimeMode = mode;
        document.getElementById('btn-time-solar').classList.toggle('active', mode === 'solar');
        document.getElementById('btn-time-lunar').classList.toggle('active', mode === 'lunar');
        updateBottomMeta();
    }

    function updateBottomMeta() {
        const showTime = document.getElementById('toggle-time-cb').checked;
        const timeSpan = document.getElementById('bottom-time-span');
        if (showTime) {
            timeSpan.style.display = 'inline';
            const now = new Date();
            if (currentTimeMode === 'solar') timeSpan.innerText = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
            else timeSpan.innerText = getGanZhiDate(now);
        } else { timeSpan.style.display = 'none'; }
        const showWm = document.getElementById('toggle-watermark-cb').checked;
        const wmSpan = document.getElementById('bottom-wm-span');
        wmSpan.style.display = showWm ? 'inline' : 'none';
        wmSpan.innerText = document.getElementById('watermark-text-input').value.trim();
    }

    function toggleDrawer() { if (drawer.classList.contains('open')) closeAllDrawers(); else { closeAllDrawers(); drawer.classList.add('open'); commonMask.classList.add('visible'); } }
    function toggleSettingsDrawer() { if (settingsDrawer.classList.contains('open')) closeAllDrawers(); else { closeAllDrawers(); settingsDrawer.classList.add('open'); commonMask.classList.add('visible'); } }
    function closeAllDrawers() { drawer.classList.remove('open'); settingsDrawer.classList.remove('open'); commonMask.classList.remove('visible'); }

    function initColorPaletteUI(containerId, callback) {
        const container = document.getElementById(containerId); container.innerHTML = '';
        const sections = [{ label: '浅色系', list: colorCategories.light }, { label: '复古色系', list: colorCategories.vintage }, { label: '深色系', list: colorCategories.dark }];
        sections.forEach(sec => {
            const lbl = document.createElement('div'); lbl.className = 'color-group-label'; lbl.innerText = sec.label; container.appendChild(lbl);
            const row = document.createElement('div'); row.className = 'color-palette-row';
            sec.list.forEach(c => {
                const btn = document.createElement('button'); btn.className = 'color-dot'; btn.style.backgroundColor = c.bg; btn.title = c.name;
                btn.onclick = () => callback(c.bg); row.appendChild(btn);
            });
            container.appendChild(row);
        });
    }

    function initTextColorPaletteUI() {
        const container = document.getElementById('textColorPaletteContainer');
        const row = document.createElement('div'); row.className = 'color-palette-row';
        const quickTextColors = ['#1A1A1A', '#FFFFFF', '#666666', '#A0A0A0', '#6B2D2B', '#334839', '#203A4C', '#6B442A', '#C99E5C', '#D9CBB7', '#E5EADF', '#EFE5E3'];
        quickTextColors.forEach(col => { const btn = document.createElement('button'); btn.className = 'color-dot'; btn.style.backgroundColor = col; btn.onclick = () => setTextColor(col); row.appendChild(btn); });
        container.appendChild(row);
    }

    function arrangeStrictGrid(targetLines) {
        const scraps = Array.from(collageArea.querySelectorAll('.scrap-word')); const count = scraps.length; if (!count) return;
        const rect = collageArea.getBoundingClientRect(); const cardW = 28; const cardH = 32; const gapX = 8; const gapY = 12;
        let sumX = 0, sumY = 0; scraps.forEach(s => { sumX += parseFloat(s.style.left) || 0; sumY += parseFloat(s.style.top) || 0; });
        const currentCenterX = sumX / count + cardW / 2; const currentCenterY = sumY / count + cardH / 2;
        const actualLines = Math.min(targetLines, count); const baseItemsPerLine = Math.floor(count / actualLines); const remainder = count % actualLines;
        const maxCols = baseItemsPerLine + (remainder > 0 ? 1 : 0); const matrixTotalW = maxCols * cardW + (maxCols - 1) * gapX; const matrixTotalH = actualLines * cardH + (actualLines - 1) * gapY;
        let originX = currentCenterX - matrixTotalW / 2; let originY = currentCenterY - matrixTotalH / 2;
        originX = Math.max(10, Math.min(rect.width - matrixTotalW - 10, originX)); originY = Math.max(10, Math.min(rect.height - matrixTotalH - 35, originY));
        let currentIndex = 0;
        for (let line = 0; line < actualLines; line++) {
            const itemsInThisLine = baseItemsPerLine + (line < remainder ? 1 : 0); const currentLineWidth = itemsInThisLine * cardW + (itemsInThisLine - 1) * gapX;
            const lineStartX = originX + (matrixTotalW - currentLineWidth) / 2; const lineStartY = originY + line * (cardH + gapY);
            for (let col = 0; col < itemsInThisLine; col++) {
                const scrap = scraps[currentIndex]; if (!scrap) break;
                scrap.style.transition = 'all 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)'; scrap.style.transform = 'rotate(0deg)';
                scrap.style.left = (lineStartX + col * (cardW + gapX)) + 'px'; scrap.style.top = lineStartY + 'px'; currentIndex++;
            }
        }
        setTimeout(() => { scraps.forEach(s => s.style.transition = ''); }, 350);
    }

    function calculateCutColor(hex) {
        const rgb = parseInt(hex.replace('#',''), 16); const r = (rgb >> 16) & 0xff; const g = (rgb >> 8) & 0xff; const b = (rgb >> 0) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 140 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)';
    }

    function setTopBg(bgColor) { sourceArea.style.backgroundImage = 'none'; document.getElementById('bp-app-container').style.setProperty('--top-bg', bgColor); document.getElementById('bp-app-container').style.setProperty('--scrap-bg', bgColor); const cutCol = calculateCutColor(bgColor); document.getElementById('bp-app-container').style.setProperty('--top-cut-color', cutCol); }
    function setTopCustomBg(val) { setTopBg(val); }
    function setBottomBg(bgColor) { collageArea.style.backgroundImage = 'none'; document.getElementById('bp-app-container').style.setProperty('--bottom-bg', bgColor); }
    function setBottomCustomBg(val) { setBottomBg(val); }
    function setTextColor(color) { document.getElementById('bp-app-container').style.setProperty('--shared-text-color', color); document.getElementById('textColorPicker').value = color.startsWith('#') ? color : '#1a1a1a'; }

    function applyTextureEffect(layerId, type) {
        const layer = document.getElementById(layerId);
        if (type === 'none') { layer.style.filter = 'none'; layer.style.background = 'none'; } else if (type === 'frosted') { layer.style.filter = 'url(#tex-frosted-filter)'; layer.style.background = '#888'; } else if (type === 'noise') { layer.style.filter = 'url(#tex-noise-filter)'; layer.style.background = '#888'; } else if (type === 'paper') { layer.style.filter = 'url(#tex-paper-filter)'; layer.style.background = '#DDD'; } else if (type === 'fabric') { layer.style.filter = 'url(#tex-fabric-filter)'; layer.style.background = '#888'; } else if (type === 'scratch') { layer.style.filter = 'url(#tex-scratch-filter)'; layer.style.background = '#888'; }
    }
    function setTopTexture(type) { document.querySelectorAll('[id^="top-tex-"]').forEach(b => b.classList.remove('active')); document.getElementById(`top-tex-${type}`).classList.add('active'); applyTextureEffect('top-texture', type); if (type !== 'none' && document.getElementById('top-grain-slider').value == 0) { document.getElementById('top-grain-slider').value = 30; setTopGrainOpacity(30); } }
    function setTopGrainOpacity(val) { document.getElementById('bp-app-container').style.setProperty('--top-grain-opacity', val / 100); }
    function setBottomTexture(type) { document.querySelectorAll('[id^="bot-tex-"]').forEach(b => b.classList.remove('active')); document.getElementById(`bot-tex-${type}`).classList.add('active'); applyTextureEffect('bottom-texture', type); if (type !== 'none' && document.getElementById('bot-grain-slider').value == 0) { document.getElementById('bot-grain-slider').value = 30; setBottomGrainOpacity(30); } }
    function setBottomGrainOpacity(val) { document.getElementById('bp-app-container').style.setProperty('--bottom-grain-opacity', val / 100); }

    function setZoneFont(zone, fontFamily, element, fontName) {
        const listId = zone === 'top' ? 'topFontList' : 'bottomFontList'; const labelId = zone === 'top' ? 'top-font-name-label' : 'bottom-font-name-label';
        document.querySelectorAll(`#${listId} .font-compact-item`).forEach(i => i.classList.remove('selected')); if (element) element.classList.add('selected'); document.getElementById(labelId).innerText = fontName;
        document.getElementById('bp-app-container').style.setProperty(zone === 'top' ? '--top-font-family' : '--scrap-font-family', fontFamily);
        setTimeout(() => { if (currentLayout === 'horizontal') collageArea.style.height = sourceArea.offsetHeight + 'px'; }, 30);
    }

    function loadCustomFont(e) {
        const file = e.target.files[0]; if (!file) return;
        const fontName = "UserFont_" + Date.now(); const cleanName = file.name.replace(/\.[^/.]+$/, "").substring(0, 8); const reader = new FileReader();
        reader.onload = async (ev) => {
            const fontBuffer = ev.target.result; const newFont = new FontFace(fontName, fontBuffer);
            try { await newFont.load(); document.fonts.add(newFont); addFontItemToList('top', fontName, cleanName); addFontItemToList('bottom', fontName, cleanName); alert(`字体 [${cleanName}] 导入成功！`); } catch (err) { alert("字体解析失败！"); }
        };
        reader.readAsArrayBuffer(file);
    }
    function addFontItemToList(zone, fontName, cleanName) {
        const containerId = zone === 'top' ? 'topFontList' : 'bottomFontList'; const container = document.getElementById(containerId);
        const item = document.createElement('div'); item.className = 'font-compact-item'; item.innerHTML = `<div class="font-name-col">${cleanName}</div><div class="font-preview-col" style="font-family:'${fontName}', serif;">恨水虚席</div>`;
        item.onclick = function() { setZoneFont(zone, `'${fontName}', serif`, this, cleanName); }; container.insertBefore(item, container.firstChild);
    }
    function syncCollageSize() { if (currentLayout === 'vertical') { collageArea.style.width = '100%'; collageArea.style.height = sourceArea.offsetHeight + 'px'; } else { collageArea.style.height = sourceArea.offsetHeight + 'px'; collageArea.style.width = sourceArea.offsetWidth + 'px'; } }
    function switchLayout(type) { currentLayout = type; document.getElementById('btn-layout-vertical').classList.toggle('active', type === 'vertical'); document.getElementById('btn-layout-horizontal').classList.toggle('active', type === 'horizontal'); if (type === 'horizontal') { posterCanvas.classList.add('layout-horizontal'); collageArea.style.height = sourceArea.offsetHeight + 'px'; collageArea.style.width = '340px'; } else { posterCanvas.classList.remove('layout-horizontal'); collageArea.style.width = '100%'; collageArea.style.height = sourceArea.offsetHeight + 'px'; } }

    function initCollageResizer() {
        let isResizing = false; let startX, startY, startW, startH;
        const onStart = (e) => { isResizing = true; const p = e.type.includes('touch') ? e.touches[0] : e; startX = p.clientX; startY = p.clientY; startW = collageArea.offsetWidth; startH = collageArea.offsetHeight; e.stopPropagation(); };
        const onMove = (e) => { if (!isResizing) return; const p = e.type.includes('touch') ? e.touches[0] : e; if (currentLayout === 'vertical') { const newH = Math.max(140, startH + (p.clientY - startY)); collageArea.style.height = newH + 'px'; } else { const newW = Math.max(140, startW + (p.clientX - startX)); collageArea.style.width = newW + 'px'; collageArea.style.height = sourceArea.offsetHeight + 'px'; } };
        const onEnd = () => { isResizing = false; };
        resizer.addEventListener('mousedown', onStart); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
        resizer.addEventListener('touchstart', onStart, { passive: true }); window.addEventListener('touchmove', onMove, { passive: true }); window.addEventListener('touchend', onEnd);
    }

    function renderArticle(text) {
        textFlow.innerHTML = ''; collageArea.querySelectorAll('.scrap-word').forEach(e => e.remove());
        const chars = text.split('');
        chars.forEach((char, idx) => {
            const span = document.createElement('span'); span.className = 'char-node'; span.textContent = char; span.dataset.char = char; span.dataset.idx = idx;
            span.onclick = () => handleCharClick(span); textFlow.appendChild(span);
        });
        setTimeout(() => { if (currentLayout === 'horizontal') collageArea.style.height = sourceArea.offsetHeight + 'px'; applyMaskingToText(); }, 30);
    }

    function handleCharClick(span) {
        const idx = span.dataset.idx; const char = span.dataset.char;
        if (span.classList.contains('is-cut')) { span.classList.remove('is-cut'); const scrap = collageArea.querySelector(`.scrap-word[data-idx="${idx}"]`); if (scrap) scrap.remove(); return; }
        span.classList.add('is-cut'); spawnScrap(char, idx);
    }

    function spawnScrap(char, idx, initX, initY) {
        const scrap = document.createElement('div'); scrap.className = 'scrap-word'; scrap.textContent = char; scrap.dataset.idx = idx;
        const rect = collageArea.getBoundingClientRect(); const posX = initX !== undefined ? initX : Math.random() * (rect.width - 50) + 20; const posY = initY !== undefined ? initY : Math.random() * (rect.height - 60) + 20;
        scrap.style.left = posX + 'px'; scrap.style.top = posY + 'px'; bindDrag(scrap);
        scrap.ondblclick = () => { const target = textFlow.querySelector(`.char-node[data-idx="${idx}"]`); if (target) target.classList.remove('is-cut'); scrap.remove(); };
        collageArea.appendChild(scrap);
    }

    function simulateCutChar(char) { const nodes = Array.from(textFlow.querySelectorAll('.char-node')); const target = nodes.find(n => n.dataset.char === char && !n.classList.contains('is-cut')); if (target) { target.classList.add('is-cut'); spawnScrap(char, target.dataset.idx); } }

    function bindDrag(el) {
        let startX, startY, origX, origY, isDragging = false;
        const onStart = (e) => { isDragging = true; const p = e.type.includes('touch') ? e.touches[0] : e; startX = p.clientX; startY = p.clientY; origX = parseFloat(el.style.left) || 0; origY = parseFloat(el.style.top) || 0; el.style.zIndex = 1000; };
        const onMove = (e) => { if (!isDragging) return; const p = e.type.includes('touch') ? e.touches[0] : e; el.style.left = (origX + (p.clientX - startX)) + 'px'; el.style.top = (origY + (p.clientY - startY)) + 'px'; };
        const onEnd = () => { isDragging = false; el.style.zIndex = 10; };
        el.addEventListener('mousedown', onStart); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
        el.addEventListener('touchstart', onStart, { passive: true }); window.addEventListener('touchmove', onMove, { passive: true }); window.addEventListener('touchend', onEnd);
    }

    function setTopFontSize(val) { document.getElementById('bp-app-container').style.setProperty('--top-font-size', val + 'px'); setTimeout(() => { if (currentLayout === 'horizontal') collageArea.style.height = sourceArea.offsetHeight + 'px'; }, 30); }
    function setScrapFontSize(val) { document.getElementById('bp-app-container').style.setProperty('--scrap-font-size', val + 'px'); }
    function uploadTopBg(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { sourceArea.style.backgroundImage = `url(${ev.target.result})`; }; reader.readAsDataURL(file); }
    function uploadBottomBg(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { collageArea.style.backgroundImage = `url(${ev.target.result})`; }; reader.readAsDataURL(file); }
    function resetCuts() { textFlow.querySelectorAll('.char-node.is-cut').forEach(n => n.classList.remove('is-cut')); collageArea.querySelectorAll('.scrap-word').forEach(n => n.remove()); }
    
    function exportPosterImage() {
        closeAllDrawers(); resizer.style.display = 'none';
        html2canvas(posterCanvas, { scale: 4, useCORS: true, allowTaint: true, backgroundColor: null, logging: false }).then(canvas => {
            resizer.style.display = 'flex'; const a = document.createElement('a'); a.download = `Collage_Poem_HD_${Date.now()}.png`; a.href = canvas.toDataURL('image/png', 1.0); a.click();
        });
    }

    // 将所有 HTML 中的内联 onClick 函数暴露到全局
    Object.assign(window, {
        toggleDrawer, toggleSettingsDrawer, closeAllDrawers, setTopBg, setTopCustomBg, setBottomBg, setBottomCustomBg,
        setTextColor, applyTextureEffect, setTopTexture, setTopGrainOpacity, setBottomTexture, setBottomGrainOpacity, setZoneFont, loadCustomFont,
        addFontItemToList, syncCollageSize, switchLayout, initCollageResizer, renderArticle, handleCharClick, spawnScrap, simulateCutChar, bindDrag,
        setTopFontSize, setScrapFontSize, uploadTopBg, uploadBottomBg, resetCuts, exportPosterImage, initColorPaletteUI, initTextColorPaletteUI,
        arrangeStrictGrid, calculateCutColor, initAuthorGrid, openAuthorModal, closeAuthorModal, generateAuthorCollage, toggleMaskTarget, setMaskStyle,
        applyMaskingToText, getGanZhiDate, setTimeFormat, updateBottomMeta
    });

    initColorPaletteUI('topPaletteContainer', setTopBg);
    initColorPaletteUI('bottomPaletteContainer', setBottomBg);
    initTextColorPaletteUI();
    initAuthorGrid();
    initCollageResizer();

    // ================= 3. 🚨 iOS 选词触发修复 🚨 =================
    // 监听在聊天框范围内的文字划取，直接在屏幕底部正中弹出胶囊按钮，彻底避开 iOS 原生的“复制/书摘”功能框
    let selectedText = "";
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        const text = sel.toString().trim();
        // 如果选中了文字且在聊天区域里，显示底部悬浮窗
        if (text.length > 0 && sel.anchorNode && sel.anchorNode.parentElement.closest('#chat')) {
            selectedText = text;
            iosSelectionPopup.style.display = 'flex';
        } else {
            iosSelectionPopup.style.display = 'none';
        }
    });
    
    // 点击胶囊后打开界面
    iosSelectionPopup.onclick = () => {
        window.getSelection().removeAllRanges();
        iosSelectionPopup.style.display = 'none';
        window.openBpApp(selectedText);
    };

    // ================= 4. 🚨 魔法棒与芭菲图标注入 =================
    // 因为酒馆原生的菜单渲染机制比较复杂，这里采用双保险：
    // ① 往原生的 extensions_settings 里注入带 parfait 图片的条目
    // ② 已经给您在右侧屏幕边缘加了常驻的芭菲按钮（无论有没有魔法棒都能点开！）
    const mountExtension = () => {
        const wandMenu = document.getElementById('extensions_settings');
        if (wandMenu && !document.getElementById('bp-ext-item')) {
            const extHtml = `
            <div class="list-group-item flex-container flexGap smolWidth" id="bp-ext-item">
                <div class="m-b-0 m-t-0 extensionsMenu--title">
                    <img src="/scripts/extensions/third-party/st-blackout-poetry/parfait.png" onerror="this.outerHTML='<span style=\\'font-size:16px; margin-right:5px;\\'>🍨</span>'" style="width:16px; height:16px; margin-right:5px; object-fit:contain;">
                    <span>剪报拼贴诗</span>
                </div>
                <div style="cursor:pointer; margin-left:auto; background:var(--SmartThemeBotttomColor); padding:4px 10px; border-radius:4px; font-size:12px;" 
                     onclick="openBpApp('默认文本。请划选对话来截取！')">
                    打开工坊
                </div>
            </div>`;
            wandMenu.insertAdjacentHTML('beforeend', extHtml);
        }
    };
    
    setTimeout(mountExtension, 1500);
    setInterval(mountExtension, 5000); 
});
