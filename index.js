// SillyTavern 剪报拼贴诗扩展 - 修复崩溃终极版
(function () {
    // 1. 动态注入 html2canvas 与字体源
    if (!window.html2canvas) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(s);
    }
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;600&family=ZCOOL+XiaoWei&display=swap';
    document.head.appendChild(fontLink);

    // 2. 核心样式 (绝对层级控制)
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        :root {
            --bp-top-bg: #F7F5F0;
            --bp-top-cut-color: rgba(0,0,0,0.06);
            --bp-top-font-size: 14.5px;
            --bp-top-grain-opacity: 0;
            --bp-top-font-family: 'Noto Serif SC', serif;
            --bp-bottom-bg: #F7F5F0;
            --bp-scrap-bg: var(--bp-top-bg);
            --bp-scrap-font-size: 14.5px;
            --bp-bottom-grain-opacity: 0;
            --bp-scrap-font-family: 'Noto Serif SC', serif;
            --bp-shared-text-color: #1A1A1A;
        }

        #bp-modal-container {
            position: fixed !important; top: 0 !important; left: 0 !important; 
            width: 100vw !important; height: 100vh !important;
            background: rgba(20,20,20,0.95) !important;
            z-index: 100000 !important;
            display: none; justify-content: center; align-items: flex-start;
            overflow-y: auto !important; padding: 70px 10px 50px 10px; 
            font-family: -apple-system, sans-serif !important;
            box-sizing: border-box;
        }

        #bp-viewport-box { position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 440px; margin: 0 auto; }
        
        #bp-top-left-bar { position: absolute; top: -52px; left: 0; display: flex; align-items: center; gap: 6px; z-index: 100015; }
        #bp-top-right-bar { position: absolute; top: -52px; right: 0; display: flex; align-items: center; gap: 6px; z-index: 100015; }
        
        .bp-icon-btn {
            width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer;
            background: #FFFFFF !important; border: 1px solid #CCC !important; border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        .bp-icon-btn svg { width: 18px; height: 18px; stroke: #1C1C1C; stroke-width: 1.6; fill: none; }
        
        .bp-layout-toggle { display: flex; background: #FFFFFF !important; border: 1px solid #CCC !important; border-radius: 4px; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important; }
        .bp-layout-btn { background: transparent; border: none; color: #666; font-size: 11px; padding: 6px 10px; border-radius: 2px; cursor: pointer; }
        .bp-layout-btn.active { background: #1C1C1C !important; color: #FFF !important; font-weight: 500; }
        
        #bp-poster-canvas {
            box-shadow: 0 25px 60px rgba(0,0,0,0.6) !important; position: relative; display: flex; flex-direction: column;
            border: 1px solid rgba(0,0,0,0.1); touch-action: none; width: 100%; max-width: 420px; background: #FFF !important;
            margin: 0 auto;
        }
        #bp-poster-canvas.layout-horizontal { flex-direction: row !important; max-width: 680px; width: 100%; }
        
        #bp-source-area {
            background-color: var(--bp-top-bg) !important; background-size: cover; background-position: center;
            padding: 34px 24px 24px 24px; position: relative; flex-shrink: 0; height: auto;
            font-family: var(--bp-top-font-family);
        }
        #bp-poster-canvas.layout-horizontal #bp-source-area { width: 50%; }
        
        .bp-text-flow {
            color: var(--bp-shared-text-color) !important; font-size: var(--bp-top-font-size); line-height: 2.2;
            letter-spacing: 0.06em; text-align: justify; word-break: break-all;
        }
        
        .bp-char-node { cursor: pointer; position: relative; display: inline-block; color: var(--bp-shared-text-color) !important; }
        .bp-char-node.is-cut { color: transparent !important; }
        .bp-char-node.is-cut::after {
            content: ""; position: absolute; top: 2px; bottom: 2px; left: 0; right: 0;
            background-color: var(--bp-top-cut-color); border-radius: 1px;
        }
        .bp-char-node.mask-blur { filter: blur(3.5px); opacity: 0.6; }
        .bp-char-node.mask-black { background: #1A1A1A; color: #1A1A1A !important; border-radius: 1px; }
        .bp-char-node.mask-symbol { position: relative; color: transparent !important; }
        .bp-char-node.mask-symbol::after { content: "×"; position: absolute; left: 0; top: 0; width: 100%; height: 100%; color: var(--bp-shared-text-color); display: flex; align-items: center; justify-content: center; font-size: 13px; }

        #bp-collage-area {
            position: relative; background-color: var(--bp-bottom-bg) !important; background-size: cover; background-position: center;
            border-top: 1px solid rgba(0, 0, 0, 0.04); flex-shrink: 0; min-height: 180px; min-width: 180px;
            overflow: hidden; font-family: var(--bp-scrap-font-family); padding-bottom: 35px;
        }
        #bp-poster-canvas.layout-horizontal #bp-collage-area { border-top: none; border-left: 1px solid rgba(0, 0, 0, 0.04); width: 50%; }
        
        .bp-scrap-word {
            position: absolute; background-color: var(--bp-scrap-bg) !important; color: var(--bp-shared-text-color) !important;
            padding: 3px 6px; font-size: var(--bp-scrap-font-size); line-height: 1; border-radius: 1px;
            cursor: grab; box-shadow: 1px 2px 5px rgba(0,0,0,0.15) !important; font-family: inherit; touch-action: none;
            z-index: 10; display: inline-flex; justify-content: center; align-items: center; width: 26px; height: 30px;
        }
        .bp-scrap-word:active { cursor: grabbing; box-shadow: 2px 6px 14px rgba(0,0,0,0.25) !important; z-index: 100; }
        
        #bp-collage-resizer { position: absolute; z-index: 1000; display: flex; align-items: center; justify-content: center; }
        #bp-poster-canvas:not(.layout-horizontal) #bp-collage-resizer { bottom: 0; left: 0; width: 100%; height: 14px; cursor: ns-resize; }
        #bp-poster-canvas:not(.layout-horizontal) #bp-collage-resizer::after { content: ""; width: 32px; height: 3px; background: rgba(0,0,0,0.2); border-radius: 2px; }
        #bp-poster-canvas.layout-horizontal #bp-collage-resizer { right: 0; top: 0; width: 14px; height: 100%; cursor: ew-resize; }
        #bp-poster-canvas.layout-horizontal #bp-collage-resizer::after { content: ""; width: 3px; height: 32px; background: rgba(0,0,0,0.2); border-radius: 2px; }

        .texture-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: overlay; z-index: 800; }
        #top-texture { opacity: var(--bp-top-grain-opacity); }
        #bottom-texture { opacity: var(--bp-bottom-grain-opacity); }

        #bp-bottom-meta {
            position: absolute; bottom: 12px; left: 0; width: 100%; display: flex;
            justify-content: center; align-items: center; gap: 12px; font-size: 8.5px;
            letter-spacing: 0.1em; color: var(--bp-shared-text-color) !important; opacity: 0.45 !important; pointer-events: none;
        }

        /* 修复丢失的遮罩层 */
        #bp-common-mask {
            position: fixed !important; top: 0 !important; left: 0 !important; 
            width: 100vw !important; height: 100vh !important;
            background: rgba(0,0,0,0.4) !important; z-index: 100005 !important;
            display: none; opacity: 0; transition: opacity 0.25s;
        }
        #bp-common-mask.visible { display: block; opacity: 1; }

        .bp-drawer {
            position: fixed !important; top: 0 !important; width: 280px !important; height: 100vh !important; 
            background: #FAFAFA !important; box-shadow: 0 0 35px rgba(0,0,0,0.5) !important; z-index: 100010 !important;
            display: flex; flex-direction: column; padding: 25px 16px; overflow-y: auto; font-size: 11.5px;
            color: #222 !important; transition: all 0.3s;
        }
        #bp-left-drawer { left: -300px; }
        #bp-left-drawer.open { left: 0; }
        #bp-right-drawer { right: -300px; }
        #bp-right-drawer.open { right: 0; }
        
        .bp-drawer-section { margin-bottom: 16px; border-bottom: 1px solid #DDD; padding-bottom: 12px; }
        .bp-section-title { font-size: 10px; color: #555; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; }
        .bp-chip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 6px; }
        .bp-action-chip { background: #EEE !important; border: 1px solid #CCC !important; color: #111 !important; padding: 6px 0; text-align: center; border-radius: 2px; cursor: pointer; font-size: 10px; }
        .bp-action-chip.active { background: #1C1C1C !important; color: #FFF !important; }
        .bp-mask-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; margin-bottom: 6px; color: #111; }
        .bp-font-item { display: flex; justify-content: space-between; background: #FFF !important; border: 1px solid #CCC !important; padding: 5px 8px; cursor: pointer; margin-bottom: 4px; color: #111; }
        .bp-font-item.selected { border-color: #000 !important; background: #E5E5E5 !important; font-weight: bold; }
        .bp-author-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; max-height: 240px; overflow-y: auto; }
        .bp-author-btn { background: #EEE !important; border: 1px solid #CCC !important; padding: 8px; font-size: 11px; text-align: center; border-radius: 2px; cursor: pointer; color:#111 !important; }
        
        .color-group-label { font-size: 9px; color: #999; margin: 4px 0 2px 0; }
        .color-palette-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 5px; }
        .color-dot { height: 20px; border-radius: 2px; border: 1px solid rgba(0, 0, 0, 0.1); cursor: pointer; transition: transform 0.15s; }
        .color-dot:hover { transform: scale(1.1); }
        .color-picker-wrapper { display: flex; align-items: center; gap: 6px; margin: 4px 0 8px 0; background: #EEE; padding: 4px 8px; border-radius: 2px; border: 1px solid #CCC; }
        .color-picker-input { width: 22px; height: 22px; border: none; padding: 0; cursor: pointer; background: none; }
        
        .setting-field { margin-bottom: 12px; }
        .setting-field label { display: block; font-size: 9.5px; color: #777; margin-bottom: 4px; }
        .setting-input { width: 100%; background: #FFF; border: 1px solid #CCC; padding: 6px 8px; font-size: 11px; border-radius: 2px; outline: none; color: #111; }
        .setting-toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: #111; font-weight: 500;}
        .file-wrapper { position: relative; overflow: hidden; display: block; margin-top: 4px; }
        .file-wrapper input[type="file"] { position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .slider-row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
        .slider-row span { color: #555; font-size: 9.5px; }
        .slider-row input[type="range"] { width: 150px; accent-color: #000; }
    `;
    document.head.appendChild(styleEl);

    // 3. 注入主 DOM (已修复缺失的 bp-common-mask)
    const modal = document.createElement('div');
    modal.id = 'bp-modal-container';
    modal.innerHTML = `
        <svg style="display:none;">
            <defs>
                <filter id="tex-frosted-filter"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" stitchTiles="stitch"/></filter>
                <filter id="tex-noise-filter"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch"/></filter>
                <filter id="tex-paper-filter"><feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="5" result="noise"/><feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter>
                <filter id="tex-fabric-filter"><feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves="3" stitchTiles="stitch"/></filter>
                <filter id="tex-scratch-filter"><feTurbulence type="turbulence" baseFrequency="0.01 0.4" numOctaves="2" stitchTiles="stitch"/></filter>
            </defs>
        </svg>

        <!-- 关键修复：遮罩层 -->
        <div id="bp-common-mask"></div>

        <div id="bp-viewport-box">
            <div id="bp-top-left-bar">
                <div class="bp-icon-btn" id="bp-btn-drawer"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></div>
                <div class="bp-icon-btn" id="bp-btn-author"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg></div>
                <div class="bp-layout-toggle">
                    <button class="bp-layout-btn active" id="bp-layout-v">上下</button>
                    <button class="bp-layout-btn" id="bp-layout-h">左右</button>
                </div>
            </div>
            
            <div id="bp-top-right-bar">
                <!-- 设置与保存并列 -->
                <div class="bp-icon-btn" id="bp-btn-settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                <div class="bp-icon-btn" id="bp-btn-save"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
                <div class="bp-icon-btn" id="bp-btn-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
            </div>
            
            <div id="bp-poster-canvas">
                <div id="bp-source-area"><div class="bp-text-flow" id="bpTextFlow"></div><div class="texture-layer" id="top-texture"></div></div>
                <div id="bp-collage-area">
                    <div class="texture-layer" id="bottom-texture"></div>
                    <div id="bp-bottom-meta"><span id="bp-time-span"></span><span id="bp-wm-span"></span></div>
                    <div id="bp-collage-resizer"></div>
                </div>
            </div>
        </div>
        
        <div class="bp-drawer" id="bp-left-drawer">
            <div class="bp-drawer-section">
                <div class="bp-section-title">原地排齐</div>
                <div class="bp-chip-grid">
                    <button class="bp-action-chip" onclick="window.bpArrange(1)">排 1 行</button>
                    <button class="bp-action-chip" onclick="window.bpArrange(2)">排 2 行</button>
                    <button class="bp-action-chip" style="font-weight:bold;" onclick="window.bpArrange(3)">排 3 行</button>
                </div>
                <button class="bp-action-chip" style="width:100%; margin-top:4px;" onclick="window.bpResetCuts()">复原全部</button>
            </div>
            <div class="bp-drawer-section">
                <div class="bp-section-title">1. 壁纸 (原文区)</div>
                <div id="topPaletteContainer"></div>
                <div class="color-picker-wrapper">
                    <input type="color" class="color-picker-input" id="topColorPicker" value="#F7F5F0" onchange="window.bpSetTopCustomBg(this.value)">
                    <span style="font-size:10px; color:#555;">自选颜色</span>
                </div>
                <div class="bp-chip-grid" style="grid-template-columns: repeat(3, 1fr); margin-top:8px;">
                    <button class="bp-action-chip active" id="top-tex-none" onclick="window.bpSetTopTexture('none')">无纹理</button>
                    <button class="bp-action-chip" id="top-tex-frosted" onclick="window.bpSetTopTexture('frosted')">细磨砂</button>
                    <button class="bp-action-chip" id="top-tex-noise" onclick="window.bpSetTopTexture('noise')">胶片噪点</button>
                </div>
            </div>
            <div class="bp-drawer-section">
                <div class="bp-section-title">2. 底图 (拼贴区)</div>
                <div id="bottomPaletteContainer"></div>
                <div class="color-picker-wrapper">
                    <input type="color" class="color-picker-input" id="botColorPicker" value="#F7F5F0" onchange="window.bpSetBottomCustomBg(this.value)">
                    <span style="font-size:10px; color:#555;">自选颜色</span>
                </div>
                <button class="bp-action-chip" style="width:100%; margin-top:6px;" onclick="window.bpSyncCollageSize()">使拼贴区与原文区等大</button>
                <div class="bp-chip-grid" style="grid-template-columns: repeat(3, 1fr); margin-top:8px;">
                    <button class="bp-action-chip active" id="bot-tex-none" onclick="window.bpSetBottomTexture('none')">无纹理</button>
                    <button class="bp-action-chip" id="bot-tex-frosted" onclick="window.bpSetBottomTexture('frosted')">细磨砂</button>
                    <button class="bp-action-chip" id="bot-tex-noise" onclick="window.bpSetBottomTexture('noise')">胶片噪点</button>
                </div>
            </div>
            <div class="bp-drawer-section">
                <div class="bp-section-title">字体颜色</div>
                <div id="textColorPaletteContainer"></div>
                <div class="color-picker-wrapper" style="margin-top:6px;">
                    <input type="color" class="color-picker-input" id="textColorPicker" value="#1A1A1A" onchange="window.bpSetTextColor(this.value)">
                    <span style="font-size:10px; color:#555;">自选颜色</span>
                </div>
            </div>
            <div class="bp-drawer-section">
                <div class="bp-section-title">字体设置</div>
                <div style="font-size:10px; margin-bottom:4px; font-weight:bold;">上: 原文区</div>
                <div class="bp-font-item selected" onclick="window.bpSetZoneFont('top', 'Noto Serif SC, serif', this)"><span>思源宋体</span><span>恨水虚席</span></div>
                <div class="bp-font-item" onclick="window.bpSetZoneFont('top', 'Ma Shan Zheng, cursive', this)"><span>马善政毛笔</span><span>恨水虚席</span></div>
                <div class="slider-row" style="margin-bottom:10px;"><span>原文大小</span><input type="range" min="11" max="24" value="14" oninput="window.bpSetTopFontSize(this.value)"></div>
                
                <div style="font-size:10px; margin-bottom:4px; font-weight:bold;">下: 拼贴区</div>
                <div class="bp-font-item selected" onclick="window.bpSetZoneFont('bottom', 'Noto Serif SC, serif', this)"><span>思源宋体</span><span>恨水虚席</span></div>
                <div class="bp-font-item" onclick="window.bpSetZoneFont('bottom', 'Ma Shan Zheng, cursive', this)"><span>马善政毛笔</span><span>恨水虚席</span></div>
                <div class="slider-row"><span>拼贴大小</span><input type="range" min="11" max="24" value="14" oninput="window.bpSetScrapFontSize(this.value)"></div>
            </div>
        </div>

        <div class="bp-drawer" id="bp-right-drawer">
            <div class="bp-drawer-section">
                <div class="bp-section-title">一键打码</div>
                <div class="bp-mask-row" onclick="window.bpToggleMask('user')"><span id="bp-sym-user">⊹</span><span>User</span></div>
                <div class="bp-mask-row" onclick="window.bpToggleMask('char')"><span id="bp-sym-char">⊹</span><span>Char</span></div>
                <div class="bp-chip-grid" style="margin-top:8px;">
                    <button class="bp-action-chip active" id="bp-m-blur" onclick="window.bpSetMaskStyle('blur')">模糊</button>
                    <button class="bp-action-chip" id="bp-m-black" onclick="window.bpSetMaskStyle('black')">涂黑</button>
                    <button class="bp-action-chip" id="bp-m-symbol" onclick="window.bpSetMaskStyle('symbol')">符号</button>
                </div>
            </div>
            <div class="bp-drawer-section">
                <div class="bp-section-title">时间与水印</div>
                <div class="setting-toggle-row"><span>显示时间</span><input type="checkbox" id="toggle-time-cb" checked onchange="window.bpUpdateMeta()" style="accent-color:#000;"></div>
                <div class="bp-chip-grid" style="grid-template-columns:1fr 1fr; margin-bottom:12px;">
                    <button class="bp-action-chip active" id="bp-t-solar" onclick="window.bpSetTimeMode('solar')">公历</button>
                    <button class="bp-action-chip" id="bp-t-lunar" onclick="window.bpSetTimeMode('lunar')">干支历</button>
                </div>
                <div class="setting-toggle-row"><span>显示水印</span><input type="checkbox" id="toggle-watermark-cb" checked onchange="window.bpUpdateMeta()" style="accent-color:#000;"></div>
                <input type="text" class="setting-input" id="watermark-text-input" value="SillyTavern" oninput="window.bpUpdateMeta()">
            </div>
            <div class="bp-drawer-section" id="bp-author-box">
                <div class="bp-section-title">名人风格自动生成</div>
                <div class="bp-author-grid" id="bpAuthorList"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 智能选区雷达
    let lastUserSelectedText = "";
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) lastUserSelectedText = sel.toString().trim();
    });

    const authors = [
        { name: "张爱玲", pats: [["烫手的铁", "包上糖衣"], ["毫不设防", "吞下去"]] },
        { name: "史铁生", pats: [["漫长", "使用历史"], ["默认", "仍然成立"]] },
        { name: "太宰治", pats: [["全然", "吞下去"], ["带着期待", "张开嘴"]] },
        { name: "木心", pats: [["教她", "系鞋带"], ["唐诗", "不要闭眼睛"]] },
        { name: "余华", pats: [["喉咙", "烫手的铁"], ["每一颗", "递过去"]] },
        { name: "鲁迅", pats: [["喉咙里", "烫手的铁"], ["答案", "腐蚀成铁"]] }
    ];
    let authorCounter = {};
    let maskUser = false, maskChar = false, maskStyle = 'blur';
    let timeMode = 'solar';

    const authorListEl = document.getElementById('bpAuthorList');
    authors.forEach(a => {
        authorCounter[a.name] = 0;
        const b = document.createElement('div');
        b.className = 'bp-author-btn';
        b.innerText = a.name;
        b.onclick = () => { window.bpGenerateByAuthor(a); document.getElementById('bp-right-drawer').classList.remove('open'); document.getElementById('bp-common-mask').classList.remove('visible'); };
        authorListEl.appendChild(b);
    });

    const colorCategories = {
        light: [{bg:'#F7F5F0'}, {bg:'#FFFFFF'}, {bg:'#F2F2F2'}, {bg:'#F0ECE1'}],
        vintage: [{bg:'#6B2D2B'}, {bg:'#334839'}, {bg:'#203A4C'}, {bg:'#D9CBB7'}],
        dark: [{bg:'#111111'}, {bg:'#1C1E21'}, {bg:'#2B2B2B'}, {bg:'#0F1A24'}]
    };
    function initColors(cid, cb) {
        const c = document.getElementById(cid);
        ['light','vintage','dark'].forEach(k => {
            const r = document.createElement('div'); r.className = 'color-palette-row';
            colorCategories[k].forEach(cl => {
                const b = document.createElement('button');
                b.className = 'color-dot'; b.style.background = cl.bg; b.onclick = () => cb(cl.bg);
                r.appendChild(b);
            });
            c.appendChild(r);
        });
    }
    initColors('topPaletteContainer', window.bpSetTopCustomBg = function(c) {
        document.documentElement.style.setProperty('--bp-top-bg', c);
        document.documentElement.style.setProperty('--bp-scrap-bg', c);
        const rgb = parseInt(c.replace('#',''),16), luma = 0.2126*((rgb>>16)&0xff) + 0.7152*((rgb>>8)&0xff) + 0.0722*(rgb&0xff);
        document.documentElement.style.setProperty('--bp-top-cut-color', luma>140 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)');
    });
    initColors('bottomPaletteContainer', window.bpSetBottomCustomBg = function(c) {
        document.documentElement.style.setProperty('--bp-bottom-bg', c);
    });
    
    const txtCols = ['#1A1A1A', '#FFFFFF', '#666666', '#6B2D2B', '#334839', '#203A4C', '#D9CBB7', '#EFE5E3'];
    const tc = document.getElementById('textColorPaletteContainer');
    const tr = document.createElement('div'); tr.className = 'color-palette-row';
    txtCols.forEach(c => {
        const b = document.createElement('button'); b.className = 'color-dot'; b.style.background = c;
        b.onclick = () => window.bpSetTextColor(c); tr.appendChild(b);
    });
    tc.appendChild(tr);

    window.bpSetTextColor = function(c) { document.documentElement.style.setProperty('--bp-shared-text-color', c); }
    window.bpSetTopTexture = function(t) {
        document.querySelectorAll('[id^="top-tex-"]').forEach(b => b.classList.remove('active'));
        document.getElementById(`top-tex-${t}`).classList.add('active');
        const l = document.getElementById('top-texture');
        if(t==='none'){l.style.filter='none'; l.style.background='none';}
        else if(t==='frosted'){l.style.filter='url(#tex-frosted-filter)'; l.style.background='#888';}
        else if(t==='noise'){l.style.filter='url(#tex-noise-filter)'; l.style.background='#888';}
    }
    window.bpSetTopGrainOpacity = function(v) { document.documentElement.style.setProperty('--bp-top-grain-opacity', v/100); }
    window.bpSetBottomTexture = function(t) {
        document.querySelectorAll('[id^="bot-tex-"]').forEach(b => b.classList.remove('active'));
        document.getElementById(`bot-tex-${t}`).classList.add('active');
        const l = document.getElementById('bottom-texture');
        if(t==='none'){l.style.filter='none'; l.style.background='none';}
        else if(t==='frosted'){l.style.filter='url(#tex-frosted-filter)'; l.style.background='#888';}
        else if(t==='noise'){l.style.filter='url(#tex-noise-filter)'; l.style.background='#888';}
    }
    window.bpSetBottomGrainOpacity = function(v) { document.documentElement.style.setProperty('--bp-bottom-grain-opacity', v/100); }
    
    window.bpRenderText = function(text) {
        const flow = document.getElementById('bpTextFlow');
        const collage = document.getElementById('bp-collage-area');
        flow.innerHTML = '';
        collage.querySelectorAll('.bp-scrap-word').forEach(e => e.remove());
        text.split('').forEach((char, idx) => {
            const s = document.createElement('span');
            s.className = 'bp-char-node'; s.textContent = char; s.dataset.char = char; s.dataset.idx = idx;
            s.onclick = () => {
                if (s.classList.contains('is-cut')) {
                    s.classList.remove('is-cut');
                    const sc = collage.querySelector(`.bp-scrap-word[data-idx="${idx}"]`);
                    if (sc) sc.remove();
                } else {
                    s.classList.add('is-cut');
                    bpSpawnScrap(char, idx);
                }
            };
            flow.appendChild(s);
        });
        window.bpUpdateMeta();
    };

    function bpSpawnScrap(char, idx) {
        const collage = document.getElementById('bp-collage-area');
        const sc = document.createElement('div');
        sc.className = 'bp-scrap-word'; sc.textContent = char; sc.dataset.idx = idx;
        sc.style.left = (Math.random() * 160 + 30) + 'px';
        sc.style.top = (Math.random() * 60 + 20) + 'px';
        bpEnableDrag(sc);
        sc.ondblclick = () => {
            const target = document.querySelector(`.bp-char-node[data-idx="${idx}"]`);
            if (target) target.classList.remove('is-cut');
            sc.remove();
        };
        collage.appendChild(sc);
    }

    function bpEnableDrag(el) {
        let isD = false, sx, sy, ox, oy;
        const start = (e) => {
            isD = true; const p = e.touches ? e.touches[0] : e;
            sx = p.clientX; sy = p.clientY;
            ox = parseFloat(el.style.left)||0; oy = parseFloat(el.style.top)||0;
            el.style.zIndex = 1000;
        };
        const move = (e) => {
            if (!isD) return; const p = e.touches ? e.touches[0] : e;
            el.style.left = (ox + p.clientX - sx) + 'px'; el.style.top = (oy + p.clientY - sy) + 'px';
        };
        const end = () => { isD = false; el.style.zIndex = 10; };
        el.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, {passive:true}); window.addEventListener('touchmove', move, {passive:true}); window.addEventListener('touchend', end);
    }

    window.bpArrange = function(lines) {
        const scraps = Array.from(document.querySelectorAll('#bp-collage-area .bp-scrap-word'));
        if (!scraps.length) return;
        const rect = document.getElementById('bp-collage-area').getBoundingClientRect();
        let sumX = 0, sumY = 0;
        scraps.forEach(s => { sumX += parseFloat(s.style.left)||0; sumY += parseFloat(s.style.top)||0; });
        const cX = sumX / scraps.length + 14; const cY = sumY / scraps.length + 16;
        const actLines = Math.min(lines, scraps.length);
        const perLine = Math.ceil(scraps.length / actLines);
        const totalW = perLine * 28 + (perLine - 1) * 8; const totalH = actLines * 32 + (actLines - 1) * 10;
        let originX = Math.max(10, Math.min(rect.width - totalW - 10, cX - totalW / 2));
        let originY = Math.max(10, Math.min(rect.height - totalH - 25, cY - totalH / 2));
        scraps.forEach((s, i) => {
            const row = Math.floor(i / perLine); const col = i % perLine;
            s.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'; s.style.transform = 'rotate(0deg)';
            s.style.left = (originX + col * 36) + 'px'; s.style.top = (originY + row * 42) + 'px';
            setTimeout(() => s.style.transition = '', 300);
        });
    };

    window.bpGenerateByAuthor = function(a) {
        window.bpResetCuts();
        const raw = Array.from(document.querySelectorAll('.bp-char-node')).map(n => n.dataset.char).join('');
        const pats = a.pats;
        const idx = (authorCounter[a.name]++) % pats.length;
        let phrase = pats[idx];
        let found = [];
        for (let word of phrase) {
            for (let ch of word) { if (raw.includes(ch)) found.push(ch); }
        }
        found.slice(0, 8).forEach(c => {
            const node = Array.from(document.querySelectorAll('.bp-char-node')).find(n => n.dataset.char === c && !n.classList.contains('is-cut'));
            if (node) { node.classList.add('is-cut'); bpSpawnScrap(c, node.dataset.idx); }
        });
        setTimeout(() => window.bpArrange(2), 60);
    }

    window.bpResetCuts = function() {
        document.querySelectorAll('.bp-char-node.is-cut').forEach(n => n.classList.remove('is-cut'));
        document.querySelectorAll('.bp-scrap-word').forEach(n => n.remove());
    };

    window.bpSetZoneFont = function(zone, font, el) {
        document.querySelectorAll(`.bp-drawer .bp-font-item`).forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        if(zone==='top') document.documentElement.style.setProperty('--bp-top-font-family', font);
        else document.documentElement.style.setProperty('--bp-scrap-font-family', font);
    };

    window.bpToggleMask = function(t) {
        if (t === 'user') { maskUser = !maskUser; document.getElementById('bp-sym-user').innerText = maskUser ? '✦' : '⊹'; }
        if (t === 'char') { maskChar = !maskChar; document.getElementById('bp-sym-char').innerText = maskChar ? '✦' : '⊹'; }
        bpApplyMask();
    };

    window.bpSetMaskStyle = function(st) {
        maskStyle = st;
        document.querySelectorAll('#bp-right-drawer button').forEach(b => b.classList.remove('active'));
        document.getElementById(`bp-m-${st}`).classList.add('active');
        bpApplyMask();
    };

    function bpApplyMask() {
        const raw = Array.from(document.querySelectorAll('.bp-char-node')).map(n => n.dataset.char).join('');
        const charWords = raw.match(/莫诺马赫|林越安|高杉|桂|柯梵恩|褚瓷/g) || ["柯梵恩", "褚瓷"];
        const userWords = ["我", "你", "他", "她"];
        document.querySelectorAll('.bp-char-node').forEach(n => n.classList.remove('mask-blur', 'mask-black', 'mask-symbol'));
        document.querySelectorAll('.bp-char-node').forEach((node, i) => {
            const ch = node.dataset.char;
            if (maskChar && charWords.some(w => raw.substr(i, w.length) === w)) node.classList.add(`mask-${maskStyle}`);
            if (maskUser && userWords.includes(ch)) node.classList.add(`mask-${maskStyle}`);
        });
    }

    window.bpUpdateMeta = function() {
        const now = new Date();
        const tSpan = document.getElementById('bp-time-span');
        if (document.getElementById('toggle-time-cb').checked) {
            tSpan.style.display = 'inline';
            if (timeMode === 'solar') { tSpan.innerText = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()}`; } 
            else {
                const tg = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
                const dz = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
                tSpan.innerText = `${tg[(now.getFullYear()-4)%10]}${dz[(now.getFullYear()-4)%12]}年 仲冬月`;
            }
        } else { tSpan.style.display = 'none'; }
        const wmSpan = document.getElementById('bp-wm-span');
        wmSpan.style.display = document.getElementById('toggle-watermark-cb').checked ? 'inline' : 'none';
        wmSpan.innerText = document.getElementById('watermark-text-input').value.trim();
    };

    window.bpSetTimeMode = function(m) {
        timeMode = m;
        document.getElementById('bp-t-solar').classList.toggle('active', m === 'solar');
        document.getElementById('bp-t-lunar').classList.toggle('active', m === 'lunar');
        bpUpdateMeta();
    };

    // 事件绑定与抽屉开关
    document.getElementById('bp-btn-drawer').onclick = () => {
        document.getElementById('bp-right-drawer').classList.remove('open');
        document.getElementById('bp-left-drawer').classList.toggle('open');
        document.getElementById('bp-common-mask').classList.add('visible');
    };
    document.getElementById('bp-btn-settings').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.toggle('open');
        document.getElementById('bp-common-mask').classList.add('visible');
    };
    document.getElementById('bp-btn-author').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.add('open');
        document.getElementById('bp-author-box').scrollIntoView({behavior:'smooth'});
        document.getElementById('bp-common-mask').classList.add('visible');
    };
    document.getElementById('bp-btn-close').onclick = () => document.getElementById('bp-modal-container').style.display = 'none';
    document.getElementById('bp-common-mask').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.remove('open');
        document.getElementById('bp-common-mask').classList.remove('visible');
    };

    document.getElementById('bp-layout-v').onclick = function() {
        this.classList.add('active'); document.getElementById('bp-layout-h').classList.remove('active');
        document.getElementById('bp-poster-canvas').classList.remove('layout-horizontal');
    };
    document.getElementById('bp-layout-h').onclick = function() {
        this.classList.add('active'); document.getElementById('bp-layout-v').classList.remove('active');
        document.getElementById('bp-poster-canvas').classList.add('layout-horizontal');
    };

    window.bpSyncCollageSize = function() {
        const c = document.getElementById('bp-collage-area');
        const s = document.getElementById('bp-source-area');
        if (document.getElementById('bp-poster-canvas').classList.contains('layout-horizontal')) {
            c.style.height = s.offsetHeight + 'px'; c.style.width = s.offsetWidth + 'px';
        } else {
            c.style.width = '100%'; c.style.height = s.offsetHeight + 'px';
        }
    };

    const resizer = document.getElementById('bp-collage-resizer');
    let rIsD = false, rSx, rSy, rSw, rSh;
    const rStart = (e) => {
        rIsD = true; const p = e.touches ? e.touches[0] : e;
        rSx = p.clientX; rSy = p.clientY;
        const c = document.getElementById('bp-collage-area');
        rSw = c.offsetWidth; rSh = c.offsetHeight; e.stopPropagation();
    };
    const rMove = (e) => {
        if (!rIsD) return; const p = e.touches ? e.touches[0] : e;
        const c = document.getElementById('bp-collage-area');
        if (document.getElementById('bp-poster-canvas').classList.contains('layout-horizontal')) {
            c.style.width = Math.max(120, rSw + (p.clientX - rSx)) + 'px';
            c.style.height = document.getElementById('bp-source-area').offsetHeight + 'px';
        } else {
            c.style.height = Math.max(120, rSh + (p.clientY - rSy)) + 'px';
        }
    };
    const rEnd = () => { rIsD = false; };
    resizer.addEventListener('mousedown', rStart); window.addEventListener('mousemove', rMove); window.addEventListener('mouseup', rEnd);
    resizer.addEventListener('touchstart', rStart, {passive:true}); window.addEventListener('touchmove', rMove, {passive:true}); window.addEventListener('touchend', rEnd);

    window.bpSetTopFontSize = function(val) {
        document.documentElement.style.setProperty('--bp-top-font-size', val + 'px');
        setTimeout(() => {
            if (document.getElementById('bp-poster-canvas').classList.contains('layout-horizontal')) {
                document.getElementById('bp-collage-area').style.height = document.getElementById('bp-source-area').offsetHeight + 'px';
            }
        }, 30);
    }
    window.bpSetScrapFontSize = function(val) { document.documentElement.style.setProperty('--bp-scrap-font-size', val + 'px'); }

    document.getElementById('bp-btn-save').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.remove('open');
        document.getElementById('bp-common-mask').classList.remove('visible');
        document.getElementById('bp-collage-resizer').style.display = 'none';
        
        html2canvas(document.getElementById('bp-poster-canvas'), { scale: 4, useCORS: true, backgroundColor: null }).then(c => {
            document.getElementById('bp-collage-resizer').style.display = 'flex';
            const a = document.createElement('a');
            a.download = `Poem_HD_${Date.now()}.png`;
            a.href = c.toDataURL('image/png', 1.0);
            a.click();
        });
    };

    // 打开工坊核心函数 (优先提取选中文本)
    window.openBlackoutPoetry = function () {
        let targetText = "";
        const currentSel = window.getSelection() ? window.getSelection().toString().trim() : "";
        if (currentSel) {
            targetText = currentSel;
        } else if (lastUserSelectedText) {
            targetText = lastUserSelectedText;
            lastUserSelectedText = "";
        }
        if (!targetText && window.SillyTavern) {
            const ctx = SillyTavern.getContext();
            const chat = ctx.chat || [];
            for (let i = chat.length - 1; i >= 0; i--) {
                if (chat[i].is_user === false && chat[i].mes) {
                    targetText = chat[i].mes;
                    break;
                }
            }
        }
        if (!targetText) targetText = "空空如也，请先划选一段文字，或者与角色对话后再开启。";
        const clean = $('<div>').html(targetText).text().trim();
        document.getElementById('bp-modal-container').style.display = 'flex';
        window.bpRenderText(clean);
    };

    // 核心挂载：正式挂载进魔法棒抽屉！
    jQuery(async () => {
        try {
            const settingsHtml = await $.get('/scripts/extensions/third-party/st-blackout-poetry/settings.html');
            $('#extensions_settings').append(settingsHtml);
            $(document).on('click', '#bp_open_studio_btn', () => { window.openBlackoutPoetry(); });
            console.log("[剪报拼贴诗] 已强制护航挂载就绪！");
        } catch (err) {
            console.warn("[剪报拼贴诗] 挂载重试...", err);
        }
    });
})();
