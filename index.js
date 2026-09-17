// 🚫 严格遵循官方文档：不要使用任何 import，直接使用全局 SillyTavern 对象

window.bpApp = {
    currentLayout: 'vertical',
    maskUserActive: false, maskCharActive: false, currentMaskStyle: 'blur',
    
    init: function() {
        this.textFlow = document.getElementById('bp-textFlow');
        this.collageArea = document.getElementById('bp-collage-area');
        this.sourceArea = document.getElementById('bp-source-area');
        this.posterCanvas = document.getElementById('bp-poster-canvas');
        this.resizer = document.getElementById('bp-collage-resizer');
        
        this.initCollageResizer();
    },

    openApp: function(text) {
        document.getElementById('bp-app-container').style.display = 'flex';
        this.renderArticle(text);
        setTimeout(() => { this.syncCollageSize(); }, 100);
    },

    closeApp: function() {
        document.getElementById('bp-app-container').style.display = 'none';
        this.closeAllDrawers();
    },

    renderArticle: function(text) {
        this.textFlow.innerHTML = '';
        this.collageArea.querySelectorAll('.scrap-word').forEach(e => e.remove());
        text.split('').forEach((char, idx) => {
            const span = document.createElement('span');
            span.className = 'char-node';
            span.textContent = char;
            span.dataset.char = char;
            span.dataset.idx = idx;
            span.onclick = () => this.handleCharClick(span);
            this.textFlow.appendChild(span);
        });
        setTimeout(() => this.applyMaskingToText(), 50);
    },

    handleCharClick: function(span) {
        const idx = span.dataset.idx; const char = span.dataset.char;
        if (span.classList.contains('is-cut')) {
            span.classList.remove('is-cut');
            const scrap = this.collageArea.querySelector(`.scrap-word[data-idx="${idx}"]`);
            if (scrap) scrap.remove();
            return;
        }
        span.classList.add('is-cut');
        this.spawnScrap(char, idx);
    },

    spawnScrap: function(char, idx) {
        const scrap = document.createElement('div');
        scrap.className = 'scrap-word';
        scrap.textContent = char;
        scrap.dataset.idx = idx;
        const rect = this.collageArea.getBoundingClientRect();
        scrap.style.left = (Math.random() * (rect.width - 50) + 20) + 'px';
        scrap.style.top = (Math.random() * (rect.height - 60) + 20) + 'px';
        
        // 拖拽逻辑
        let isDragging = false, startX, startY, origX, origY;
        const onStart = (e) => {
            isDragging = true; e.stopPropagation();
            const p = e.type.includes('touch') ? e.touches[0] : e;
            startX = p.clientX; startY = p.clientY;
            origX = parseFloat(scrap.style.left) || 0; origY = parseFloat(scrap.style.top) || 0;
            scrap.style.zIndex = 1000;
        };
        const onMove = (e) => {
            if (!isDragging) return; e.stopPropagation();
            const p = e.type.includes('touch') ? e.touches[0] : e;
            scrap.style.left = (origX + (p.clientX - startX)) + 'px';
            scrap.style.top = (origY + (p.clientY - startY)) + 'px';
        };
        const onEnd = () => { isDragging = false; scrap.style.zIndex = 10; };
        scrap.addEventListener('mousedown', onStart); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
        scrap.addEventListener('touchstart', onStart, { passive: false }); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onEnd);
        
        scrap.ondblclick = () => {
            const target = this.textFlow.querySelector(`.char-node[data-idx="${idx}"]`);
            if (target) target.classList.remove('is-cut');
            scrap.remove();
        };
        this.collageArea.appendChild(scrap);
    },

    toggleDrawer: function() {
        const d = document.getElementById('bp-drawer'); const m = document.getElementById('bp-common-mask');
        if(d.classList.contains('open')) this.closeAllDrawers(); else { this.closeAllDrawers(); d.classList.add('open'); m.classList.add('visible'); }
    },
    closeAllDrawers: function() {
        document.getElementById('bp-drawer').classList.remove('open');
        document.getElementById('bp-common-mask').classList.remove('visible');
    },

    arrangeStrictGrid: function(lines) {
        const scraps = Array.from(this.collageArea.querySelectorAll('.scrap-word'));
        if(!scraps.length) return;
        const base = Math.floor(scraps.length / lines);
        let idx = 0;
        for (let l = 0; l < lines; l++) {
            for (let c = 0; c < base + (l < scraps.length % lines ? 1 : 0); c++) {
                if(!scraps[idx]) break;
                scraps[idx].style.transition = 'all 0.3s';
                scraps[idx].style.left = (30 + c * 36) + 'px';
                scraps[idx].style.top = (30 + l * 44) + 'px';
                idx++;
            }
        }
        setTimeout(() => scraps.forEach(s => s.style.transition = ''), 350);
    },

    applyMaskingToText: function() {
        let uName = "User", cName = "Char";
        try {
            // ✅ 使用官方推荐的全局对象获取信息
            const ctx = SillyTavern.getContext(); 
            if (ctx.name1) uName = ctx.name1; 
            if (ctx.characters && ctx.characterId !== undefined && ctx.characters[ctx.characterId]) {
                cName = ctx.characters[ctx.characterId].name;
            } else if (ctx.name2) {
                cName = ctx.name2;
            }
        } catch(e) {}
        
        const charSet = new Set([cName, "他", "她"]); const userSet = new Set([uName, "我", "你"]);
        
        const nodes = Array.from(this.textFlow.querySelectorAll('.char-node'));
        nodes.forEach(n => {
            n.className = 'char-node' + (n.classList.contains('is-cut') ? ' is-cut' : '');
            if (this.maskCharActive && charSet.has(n.dataset.char)) n.classList.add(`mask-${this.currentMaskStyle}`);
            if (this.maskUserActive && userSet.has(n.dataset.char)) n.classList.add(`mask-${this.currentMaskStyle}`);
        });
    },

    toggleMaskTarget: function(t) {
        if(t==='user') { this.maskUserActive = !this.maskUserActive; document.getElementById('bp-btn-user').style.background = this.maskUserActive?'#1A1A1A':'#EEE'; document.getElementById('bp-btn-user').style.color = this.maskUserActive?'#FFF':'#333'; }
        if(t==='char') { this.maskCharActive = !this.maskCharActive; document.getElementById('bp-btn-char').style.background = this.maskCharActive?'#1A1A1A':'#EEE'; document.getElementById('bp-btn-char').style.color = this.maskCharActive?'#FFF':'#333'; }
        this.applyMaskingToText();
    },

    syncCollageSize: function() { this.collageArea.style.height = this.sourceArea.offsetHeight + 'px'; },

    initCollageResizer: function() {
        let isRes = false, startY, startH;
        const start = (e) => { isRes = true; e.stopPropagation(); const p = e.touches ? e.touches[0] : e; startY = p.clientY; startH = this.collageArea.offsetHeight; };
        const move = (e) => { if(!isRes) return; e.stopPropagation(); const p = e.touches ? e.touches[0] : e; this.collageArea.style.height = Math.max(140, startH + (p.clientY - startY)) + 'px'; };
        const end = () => isRes = false;
        this.resizer.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
        this.resizer.addEventListener('touchstart', start, {passive:false}); window.addEventListener('touchmove', move, {passive:false}); window.addEventListener('touchend', end);
    },

    exportImage: function() {
        this.closeAllDrawers(); this.resizer.style.display = 'none';
        html2canvas(this.posterCanvas, { scale: 3, useCORS: true, backgroundColor: null }).then(c => {
            this.resizer.style.display = 'flex';
            const a = document.createElement('a'); a.download = `Collage_${Date.now()}.png`;
            a.href = c.toDataURL('image/png'); a.click();
        });
    }
};

// ================= 2. DOM 注入与酒馆挂载机制 =================
jQuery(async () => {
    // 动态加载截图库与字体
    if (!window.html2canvas) { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; document.head.appendChild(sc); }
    const fontLink = document.createElement('link'); fontLink.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;600&display=swap'; fontLink.rel = 'stylesheet'; document.head.appendChild(fontLink);

    // 完全隔离的 CSS 与 HTML
    const bpUI = `
    <style>
        #bp-app-container { --top-bg:#F7F5F0; --bot-bg:#F7F5F0; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:999999; display:none; background:rgba(0,0,0,0.6); justify-content:center; align-items:center; font-family:-apple-system,sans-serif; }
        #bp-app-container * { box-sizing:border-box; user-select:none; -webkit-user-select:none; }
        #bp-app-main { position:relative; background:#F5F5F7; width:100%; height:100%; display:flex; justify-content:center; align-items:center; overflow:auto; }
        .bp-icon-btn { width:38px; height:38px; display:flex; justify-content:center; align-items:center; cursor:pointer; background:rgba(255,255,255,0.9); border:1px solid rgba(0,0,0,0.1); border-radius:6px; font-size:18px; color:#333; transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
        .bp-icon-btn:hover { background:#FFF; border-color:#000; color:#000; }
        #bp-poster-canvas { width:90%; max-width:440px; box-shadow:0 10px 40px rgba(0,0,0,0.1); display:flex; flex-direction:column; border:1px solid rgba(0,0,0,0.05); }
        #bp-source-area { background:var(--top-bg); padding:30px 25px; font-family:'Noto Serif SC', serif; }
        .text-flow { color:#1A1A1A; font-size:15px; line-height:2.2; text-align:justify; word-break:break-all; }
        #bp-collage-area { background:var(--bot-bg); min-height:180px; position:relative; overflow:hidden; font-family:'Noto Serif SC', serif; padding-bottom:30px; border-top:1px solid rgba(0,0,0,0.05); }
        #bp-collage-resizer { position:absolute; bottom:0; left:0; width:100%; height:16px; cursor:ns-resize; display:flex; justify-content:center; align-items:center; z-index:1000; }
        #bp-collage-resizer::after { content:""; width:30px; height:3px; background:rgba(0,0,0,0.2); border-radius:2px; }
        .char-node { cursor:pointer; position:relative; display:inline-block; transition:0.15s; }
        .char-node:hover:not(.is-cut) { opacity:0.5; }
        .char-node.is-cut { color:transparent !important; }
        .char-node.is-cut::after { content:""; position:absolute; top:2px; bottom:2px; left:0; right:0; background:rgba(0,0,0,0.06); }
        .char-node.mask-blur { filter:blur(3.5px); opacity:0.6; }
        .scrap-word { position:absolute; background:var(--bot-bg); color:#1A1A1A; padding:3px 6px; font-size:14.5px; border-radius:1px; cursor:grab; box-shadow:1px 2px 6px rgba(0,0,0,0.15); display:inline-flex; width:26px; height:30px; align-items:center; justify-content:center; touch-action:none; }
        #bp-drawer { position:absolute; left:-300px; top:0; width:280px; height:100%; background:#FFF; z-index:2000; transition:0.3s; padding:20px; box-shadow:5px 0 20px rgba(0,0,0,0.1); }
        #bp-drawer.open { left:0; }
        #bp-common-mask { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.2); z-index:1999; display:none; }
        #bp-common-mask.visible { display:block; }
        .bp-chip { background:#EEE; border:none; padding:8px 14px; border-radius:4px; font-size:12px; cursor:pointer; color:#333; margin:4px; transition:0.2s; }
        .bp-chip:hover { background:#DDD; }
        
        /* 选词悬浮按钮 UI */
        #bp-quick-popup { position:absolute; z-index:9999; display:none; background:#222; color:#FFF; padding:8px 12px; border-radius:6px; font-size:13px; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.2); align-items:center; gap:6px; pointer-events:auto; }
        #bp-quick-popup:hover { background:#000; transform:scale(1.05); }
    </style>
    
    <div id="bp-app-container">
        <div id="bp-app-main">
            <!-- 带有明确退出按钮的顶部栏 -->
            <div style="position:absolute; top:15px; left:15px; display:flex; gap:10px; z-index:2005;">
                <div class="bp-icon-btn" onclick="bpApp.closeApp()" title="退出拼贴"><i class="fa-solid fa-arrow-left"></i></div>
                <div class="bp-icon-btn" onclick="bpApp.toggleDrawer()" title="排版工具"><i class="fa-solid fa-bars"></i></div>
            </div>
            <div style="position:absolute; top:15px; right:15px; display:flex; gap:10px; z-index:2005;">
                <div class="bp-icon-btn" onclick="bpApp.exportImage()" title="保存拼贴诗"><i class="fa-solid fa-download"></i></div>
            </div>

            <div id="bp-common-mask" onclick="bpApp.closeAllDrawers()"></div>

            <div id="bp-drawer">
                <h3 style="font-size:15px; margin-bottom:20px; color:#111; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-ice-cream" style="color:#4CAF50;"></i> 工具箱
                </h3>
                <div style="margin-bottom:20px; border-bottom:1px solid #EEE; padding-bottom:15px;">
                    <div style="font-size:12px; color:#666; margin-bottom:8px;">原地排版对其</div>
                    <button class="bp-chip" onclick="bpApp.arrangeStrictGrid(1)">排 1 行</button>
                    <button class="bp-chip" onclick="bpApp.arrangeStrictGrid(2)">排 2 行</button>
                    <button class="bp-chip" onclick="bpApp.arrangeStrictGrid(3)">排 3 行</button>
                </div>
                <div style="margin-bottom:20px;">
                    <div style="font-size:12px; color:#666; margin-bottom:8px;">一键智能打码 (高斯模糊)</div>
                    <button class="bp-chip" id="bp-btn-user" onclick="bpApp.toggleMaskTarget('user')">打码 User</button>
                    <button class="bp-chip" id="bp-btn-char" onclick="bpApp.toggleMaskTarget('char')">打码 Char</button>
                </div>
            </div>

            <div id="bp-poster-canvas">
                <div id="bp-source-area"><div class="text-flow" id="bp-textFlow"></div></div>
                <div id="bp-collage-area"><div id="bp-collage-resizer"></div></div>
            </div>
        </div>
    </div>
    <div id="bp-quick-popup"><i class="fa-solid fa-scissors"></i>生成拼贴诗</div>`;
    
    document.body.insertAdjacentHTML('beforeend', bpUI);
    bpApp.init();

    // 🌟 3. 在魔法棒列表中安全挂载 (FontAwesome 原生图标)
    const mountExtension = () => {
        const wandMenu = document.getElementById('extensions_settings');
        if (wandMenu && !document.getElementById('bp-ext-item')) {
            const extHtml = `
            <div class="list-group-item flex-container flexGap smolWidth" id="bp-ext-item">
                <div class="m-b-0 m-t-0 extensionsMenu--title">
                    <i class="fa-solid fa-ice-cream" style="color: #4CAF50; margin-right: 5px;"></i>
                    <span>剪报拼贴诗</span>
                </div>
                <div style="cursor:pointer; margin-left:auto; background:var(--SmartThemeBotttomColor); padding:4px 10px; border-radius:4px; font-size:12px;" 
                     onclick="bpApp.openApp('打开成功！你可以点击左上角的返回按钮退出。在聊天中划选任何文字都会弹出【剪刀】快捷生成按钮。')">
                    打开工坊
                </div>
            </div>`;
            wandMenu.insertAdjacentHTML('beforeend', extHtml);
        }
    };
    
    setTimeout(mountExtension, 1500);
    setInterval(mountExtension, 5000); 

    // 🌟 4. 全局选词监听（原生悬浮小弹窗）
    const popup = document.getElementById('bp-quick-popup');
    let selectedText = "";

    document.addEventListener('mouseup', (e) => {
        if (e.target.closest('#bp-quick-popup') || e.target.closest('#bp-app-container')) return;
        
        setTimeout(() => {
            const selection = window.getSelection();
            selectedText = selection.toString().trim();
            
            // 如果是在手机上滑动/鼠标划选，且有文字，就弹出
            if (selectedText.length > 0 && e.target.closest('#chat')) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                popup.style.display = 'flex';
                // 计算让弹窗出现在划线文本的上方居中
                popup.style.top = Math.max(10, rect.top + window.scrollY - 45) + 'px';
                popup.style.left = Math.max(10, rect.left + window.scrollX + (rect.width/2) - 50) + 'px';
            } else {
                popup.style.display = 'none';
            }
        }, 50);
    });

    // 手机端的 touch 处理
    document.addEventListener('touchend', (e) => {
        if (e.target.closest('#bp-quick-popup') || e.target.closest('#bp-app-container')) return;
        setTimeout(() => {
            const selection = window.getSelection();
            selectedText = selection.toString().trim();
            if (selectedText.length > 0 && e.target.closest('#chat')) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                popup.style.display = 'flex';
                popup.style.top = Math.max(10, rect.top + window.scrollY - 45) + 'px';
                popup.style.left = Math.max(10, rect.left + window.scrollX + (rect.width/2) - 50) + 'px';
            } else {
                popup.style.display = 'none';
            }
        }, 150);
    });

    popup.addEventListener('click', () => {
        popup.style.display = 'none';
        window.getSelection().removeAllRanges(); // 清除系统划线
        bpApp.openApp(selectedText);
    });
});
