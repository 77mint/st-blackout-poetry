// SillyTavern 剪报拼贴诗扩展 - 悬浮唤起版
(function () {
    // 注入依赖与字体
    if (!window.html2canvas) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(s);
    }
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;600&family=ZCOOL+XiaoWei&display=swap';
    document.head.appendChild(fontLink);

    // 核心样式
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        :root {
            --bp-page-bg: #F5F5F7;
            --bp-top-bg: #F7F5F0;
            --bp-top-cut-color: rgba(0,0,0,0.06);
            --bp-top-font-size: 14px;
            --bp-top-grain-opacity: 0;
            --bp-top-font-family: 'Noto Serif SC', serif;
            --bp-bottom-bg: #F7F5F0;
            --bp-scrap-bg: var(--bp-top-bg);
            --bp-scrap-font-size: 14px;
            --bp-bottom-grain-opacity: 0;
            --bp-scrap-font-family: 'Noto Serif SC', serif;
            --bp-shared-text-color: #1A1A1A;
        }

        /* 屏幕右侧常驻可拖拽悬浮剪刀图标 */
        #bp-float-btn {
            position: fixed;
            right: 12px;
            bottom: 160px;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid rgba(0,0,0,0.12);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            z-index: 99998;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            touch-action: none;
            transition: transform 0.15s;
        }
        #bp-float-btn:active { transform: scale(0.92); }
        #bp-float-btn svg { width: 20px; height: 20px; stroke: #1C1C1C; stroke-width: 1.8; fill: none; }

        /* 主弹窗容器 */
        #bp-modal-container {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            z-index: 999999; display: none; justify-content: center; align-items: flex-start;
            overflow-y: auto; padding: 70px 10px 40px 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-sizing: border-box;
        }
        #bp-viewport-box { position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 440px; }
        #bp-top-left-bar { position: absolute; top: -52px; left: 0; display: flex; align-items: center; gap: 6px; }
        #bp-top-right-bar { position: absolute; top: -52px; right: 0; display: flex; align-items: center; gap: 6px; }
        .bp-icon-btn {
            width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer;
            background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .bp-icon-btn svg { width: 18px; height: 18px; stroke: #1C1C1C; stroke-width: 1.6; fill: none; }
        .bp-layout-toggle { display: flex; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 4px; padding: 2px; }
        .bp-layout-btn { background: transparent; border: none; color: #666; font-size: 11px; padding: 6px 10px; border-radius: 2px; cursor: pointer; }
        .bp-layout-btn.active { background: #1C1C1C; color: #FFF; font-weight: 500; }
        
        #bp-poster-canvas {
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3); position: relative; display: flex; flex-direction: column;
            border: 1px solid rgba(0,0,0,0.06); touch-action: none; width: 100%; max-width: 420px; background: #FFF;
        }
        #bp-poster-canvas.layout-horizontal { flex-direction: row !important; max-width: 680px; width: 100%; }
        #bp-source-area {
            background-color: var(--bp-top-bg); background-size: cover; background-position: center;
            padding: 34px 24px 24px 24px; position: relative; flex-shrink: 0; height: auto;
            font-family: var(--bp-top-font-family);
        }
        #bp-poster-canvas.layout-horizontal #bp-source-area { width: 50%; }
        .bp-text-flow {
            color: var(--bp-shared-text-color); font-size: var(--bp-top-font-size); line-height: 2.2;
            letter-spacing: 0.06em; text-align: justify; word-break: break-all;
        }
        .bp-char-node { cursor: pointer; position: relative; display: inline-block; }
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
            position: relative; background-color: var(--bp-bottom-bg); background-size: cover; background-position: center;
            border-top: 1px solid rgba(0, 0, 0, 0.04); flex-shrink: 0; min-height: 180px; min-width: 180px;
            overflow: hidden; font-family: var(--bp-scrap-font-family); padding-bottom: 35px;
        }
        #bp-poster-canvas.layout-horizontal #bp-collage-area { border-top: none; border-left: 1px solid rgba(0, 0, 0, 0.04); width: 50%; }
        .bp-scrap-word {
            position: absolute; background-color: var(--bp-scrap-bg); color: var(--bp-shared-text-color);
            padding: 3px 6px; font-size: var(--bp-scrap-font-size); line-height: 1; border-radius: 1px;
            cursor: grab; box-shadow: 1px 2px 5px rgba(0,0,0,0.15); font-family: inherit; touch-action: none;
            z-index: 10; display: inline-flex; justify-content: center; align-items: center; width: 26px; height: 30px;
        }
        .bp-scrap-word:active { cursor: grabbing; box-shadow: 2px 6px 14px rgba(0,0,0,0.25); z-index: 100; }
        #bp-collage-resizer { position: absolute; z-index: 1000; display: flex; align-items: center; justify-content: center; }
        #bp-poster-canvas:not(.layout-horizontal) #bp-collage-resizer { bottom: 0; left: 0; width: 100%; height: 14px; cursor: ns-resize; }
        #bp-poster-canvas:not(.layout-horizontal) #bp-collage-resizer::after { content: ""; width: 32px; height: 3px; background: rgba(0,0,0,0.2); border-radius: 2px; }
        #bp-poster-canvas.layout-horizontal #bp-collage-resizer { right: 0; top: 0; width: 12px; height: 100%; cursor: ew-resize; }
        #bp-poster-canvas.layout-horizontal #bp-collage-resizer::after { content: ""; width: 3px; height: 32px; background: rgba(0,0,0,0.2); border-radius: 2px; }

        #bp-bottom-meta {
            position: absolute; bottom: 12px; left: 0; width: 100%; display: flex;
            justify-content: center; align-items: center; gap: 12px; font-size: 8.5px;
            letter-spacing: 0.1em; color: var(--bp-shared-text-color); opacity: 0.45; pointer-events: none;
        }
        .bp-drawer {
            position: fixed; top: 0; width: 280px; height: 100vh; background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px); box-shadow: 0 0 35px rgba(0,0,0,0.15); z-index: 100002;
            display: flex; flex-direction: column; padding: 25px 16px; overflow-y: auto; font-size: 11.5px;
            color: #222; transition: all 0.3s;
        }
        #bp-left-drawer { left: -300px; }
        #bp-left-drawer.open { left: 0; }
        #bp-right-drawer { right: -300px; }
        #bp-right-drawer.open { right: 0; }
        .bp-drawer-section { margin-bottom: 16px; border-bottom: 1px solid #EEE; padding-bottom: 12px; }
        .bp-section-title { font-size: 10px; color: #888; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; }
        .bp-chip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 6px; }
        .bp-action-chip { background: #F4F4F4; border: 1px solid #DDD; color: #333; padding: 6px 0; text-align: center; border-radius: 2px; cursor: pointer; font-size: 10px; }
        .bp-action-chip.active { background: #1C1C1C; color: #FFF; }
        .bp-mask-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; margin-bottom: 6px; }
        .bp-font-item { display: flex; justify-content: space-between; background: #FFF; border: 1px solid #DDD; padding: 5px 8px; cursor: pointer; margin-bottom: 4px; }
        .bp-font-item.selected { border-color: #000; background: #F0F0F0; font-weight: bold; }
        .bp-author-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; max-height: 240px; overflow-y: auto; }
        .bp-author-btn { background: #F5F5F5; border: 1px solid #DDD; padding: 8px; font-size: 11px; text-align: center; border-radius: 2px; cursor: pointer; }
    `;
    document.head.appendChild(styleEl);

    // 注入主 DOM 与 悬浮剪刀按钮
    const modal = document.createElement('div');
    modal.id = 'bp-modal-container';
    modal.innerHTML = `
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
                <div class="bp-icon-btn" id="bp-btn-settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                <div class="bp-icon-btn" id="bp-btn-save"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
                <div class="bp-icon-btn" id="bp-btn-close"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
            </div>
            <div id="bp-poster-canvas">
                <div id="bp-source-area"><div class="bp-text-flow" id="bpTextFlow"></div></div>
                <div id="bp-collage-area">
                    <div id="bp-bottom-meta"><span id="bp-time-span"></span><span id="bp-wm-span">SillyTavern</span></div>
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
                <button class="bp-action-chip" style="width:100%; margin-top:4px;" onclick="window.bpResetCuts()">复原全部字</button>
            </div>
            <div class="bp-drawer-section">
                <div class="bp-section-title">字体选择</div>
                <div class="bp-font-item selected" onclick="window.bpSetFont('Noto Serif SC, serif', this)"><span>思源宋体</span><span>恨水虚席</span></div>
                <div class="bp-font-item" onclick="window.bpSetFont('Ma Shan Zheng, cursive', this)"><span>马善政毛笔</span><span>恨水虚席</span></div>
                <div class="bp-font-item" onclick="window.bpSetFont('ZCOOL XiaoWei, serif', this)"><span>站酷小薇体</span><span>恨水虚席</span></div>
                <div class="bp-font-item" onclick="window.bpSetFont('Noto Sans SC, sans-serif', this)"><span>思源黑体</span><span>恨水虚席</span></div>
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
                <div class="bp-section-title">时间显示</div>
                <div class="bp-chip-grid" style="grid-template-columns:1fr 1fr;">
                    <button class="bp-action-chip active" id="bp-t-solar" onclick="window.bpSetTimeMode('solar')">公历</button>
                    <button class="bp-action-chip" id="bp-t-lunar" onclick="window.bpSetTimeMode('lunar')">干支历</button>
                </div>
            </div>
            <div class="bp-drawer-section" id="bp-author-box">
                <div class="bp-section-title">名人风格提取</div>
                <div class="bp-author-grid" id="bpAuthorList"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 屏幕右侧常驻可拖动剪刀按钮
    const floatBtn = document.createElement('div');
    floatBtn.id = 'bp-float-btn';
    floatBtn.title = '提取文字制作拼贴诗';
    floatBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`;
    document.body.appendChild(floatBtn);

    // 拖动剪刀按钮逻辑
    let isFBDrag = false, startY, origTop;
    floatBtn.addEventListener('touchstart', (e) => {
        isFBDrag = false;
        startY = e.touches[0].clientY;
        origTop = floatBtn.offsetTop;
    }, {passive:true});
    floatBtn.addEventListener('touchmove', (e) => {
        const delta = e.touches[0].clientY - startY;
        if (Math.abs(delta) > 5) isFBDrag = true;
        let newT = origTop + delta;
        newT = Math.max(60, Math.min(window.innerHeight - 60, newT));
        floatBtn.style.top = newT + 'px';
        floatBtn.style.bottom = 'auto';
    }, {passive:true});

    // 点击剪刀打开：优先提取选中文字，没有就抓最后一条消息
    floatBtn.addEventListener('click', () => {
        if (isFBDrag) return;
        let targetText = window.getSelection().toString().trim();
        
        // 尝试从酒馆抓消息
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

        // 兜底抓屏幕上最后的段落
        if (!targetText) {
            const paragraphs = document.querySelectorAll('#chat .mes_text');
            if (paragraphs.length) {
                targetText = paragraphs[paragraphs.length - 1].innerText;
            }
        }

        if (!targetText) {
            targetText = "这里空空如也，请先长按选中一段话，或者与角色对话后再点击。";
        }

        // 过滤 HTML
        const clean = $('<div>').html(targetText).text().trim();
        document.getElementById('bp-modal-container').style.display = 'flex';
        window.bpRenderText(clean);
    });

    // 核心排版逻辑
    const authors = [
        { name: "张爱玲", pats: [["烫手的铁", "包上糖衣"], ["毫不设防", "吞下去"], ["成了", "烫手的铁"]] },
        { name: "史铁生", pats: [["二十五年", "默认之上"], ["漫长", "的使用历史"], ["默认", "仍然成立"]] },
        { name: "太宰治", pats: [["全然地", "吞下去"], ["甚至", "带着期待"], ["毫不设防", "张开嘴"]] },
        { name: "木心", pats: [["教她用筷子", "系鞋带"], ["背唐诗", "到第三句"], ["水里", "不要闭眼睛"]] },
        { name: "余华", pats: [["喉咙里", "烫手的铁"], ["腐蚀成了铁", "吞下去"], ["每一颗", "递过去"]] },
        { name: "鲁迅", pats: [["喉咙里", "烫手的铁"], ["正确答案", "腐蚀成铁"], ["冷然", "递过去"]] }
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
        b.onclick = () => { bpGenerateByAuthor(a); document.getElementById('bp-right-drawer').classList.remove('open'); };
        authorListEl.appendChild(b);
    });

    window.bpRenderText = function(text) {
        const flow = document.getElementById('bpTextFlow');
        const collage = document.getElementById('bp-collage-area');
        flow.innerHTML = '';
        collage.querySelectorAll('.bp-scrap-word').forEach(e => e.remove());
        text.split('').forEach((char, idx) => {
            const s = document.createElement('span');
            s.className = 'bp-char-node';
            s.textContent = char;
            s.dataset.char = char;
            s.dataset.idx = idx;
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
        bpUpdateMeta();
    };

    function bpSpawnScrap(char, idx) {
        const collage = document.getElementById('bp-collage-area');
        const sc = document.createElement('div');
        sc.className = 'bp-scrap-word';
        sc.textContent = char;
        sc.dataset.idx = idx;
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
            isD = true;
            const p = e.touches ? e.touches[0] : e;
            sx = p.clientX; sy = p.clientY;
            ox = parseFloat(el.style.left)||0; oy = parseFloat(el.style.top)||0;
            el.style.zIndex = 1000;
        };
        const move = (e) => {
            if (!isD) return;
            const p = e.touches ? e.touches[0] : e;
            el.style.left = (ox + p.clientX - sx) + 'px';
            el.style.top = (oy + p.clientY - sy) + 'px';
        };
        const end = () => { isD = false; el.style.zIndex = 10; };
        el.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, {passive:true});
        window.addEventListener('touchmove', move, {passive:true});
        window.addEventListener('touchend', end);
    }

    window.bpArrange = function(lines) {
        const scraps = Array.from(document.querySelectorAll('#bp-collage-area .bp-scrap-word'));
        if (!scraps.length) return;
        const rect = document.getElementById('bp-collage-area').getBoundingClientRect();
        let sumX = 0, sumY = 0;
        scraps.forEach(s => {
            sumX += parseFloat(s.style.left)||0;
            sumY += parseFloat(s.style.top)||0;
        });
        const cX = sumX / scraps.length + 14;
        const cY = sumY / scraps.length + 16;
        const actLines = Math.min(lines, scraps.length);
        const perLine = Math.ceil(scraps.length / actLines);
        const totalW = perLine * 28 + (perLine - 1) * 8;
        const totalH = actLines * 32 + (actLines - 1) * 10;
        let originX = Math.max(10, Math.min(rect.width - totalW - 10, cX - totalW / 2));
        let originY = Math.max(10, Math.min(rect.height - totalH - 25, cY - totalH / 2));
        scraps.forEach((s, i) => {
            const row = Math.floor(i / perLine);
            const col = i % perLine;
            s.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            s.style.transform = 'rotate(0deg)';
            s.style.left = (originX + col * 36) + 'px';
            s.style.top = (originY + row * 42) + 'px';
            setTimeout(() => s.style.transition = '', 300);
        });
    };

    function bpGenerateByAuthor(a) {
        window.bpResetCuts();
        const raw = Array.from(document.querySelectorAll('.bp-char-node')).map(n => n.dataset.char).join('');
        const pats = a.pats;
        const idx = (authorCounter[a.name]++) % pats.length;
        let phrase = pats[idx];
        let found = [];
        for (let word of phrase) {
            for (let ch of word) {
                if (raw.includes(ch)) found.push(ch);
            }
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

    window.bpSetFont = function(font, el) {
        document.querySelectorAll('.bp-font-item').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        document.documentElement.style.setProperty('--bp-top-font-family', font);
        document.documentElement.style.setProperty('--bp-scrap-font-family', font);
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

    function bpUpdateMeta() {
        const now = new Date();
        const tSpan = document.getElementById('bp-time-span');
        if (timeMode === 'solar') {
            tSpan.innerText = `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()}`;
        } else {
            const tg = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
            const dz = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
            const y = now.getFullYear();
            tSpan.innerText = `${tg[(y-4)%10]}${dz[(y-4)%12]}年 仲冬月`;
        }
    }

    window.bpSetTimeMode = function(m) {
        timeMode = m;
        document.getElementById('bp-t-solar').classList.toggle('active', m === 'solar');
        document.getElementById('bp-t-lunar').classList.toggle('active', m === 'lunar');
        bpUpdateMeta();
    };

    document.getElementById('bp-btn-drawer').onclick = () => {
        document.getElementById('bp-right-drawer').classList.remove('open');
        document.getElementById('bp-left-drawer').classList.toggle('open');
    };
    document.getElementById('bp-btn-settings').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.toggle('open');
    };
    document.getElementById('bp-btn-author').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.add('open');
        document.getElementById('bp-author-box').scrollIntoView({behavior:'smooth'});
    };
    document.getElementById('bp-btn-close').onclick = () => document.getElementById('bp-modal-container').style.display = 'none';

    document.getElementById('bp-layout-v').onclick = function() {
        this.classList.add('active'); document.getElementById('bp-layout-h').classList.remove('active');
        document.getElementById('bp-poster-canvas').classList.remove('layout-horizontal');
    };
    document.getElementById('bp-layout-h').onclick = function() {
        this.classList.add('active'); document.getElementById('bp-layout-v').classList.remove('active');
        document.getElementById('bp-poster-canvas').classList.add('layout-horizontal');
    };

    document.getElementById('bp-btn-save').onclick = () => {
        document.getElementById('bp-left-drawer').classList.remove('open');
        document.getElementById('bp-right-drawer').classList.remove('open');
        html2canvas(document.getElementById('bp-poster-canvas'), { scale: 4, useCORS: true, backgroundColor: null }).then(c => {
            const a = document.createElement('a');
            a.download = `Poem_HD_${Date.now()}.png`;
            a.href = c.toDataURL('image/png', 1.0);
            a.click();
        });
    };

    console.log("[剪报拼贴诗] 悬浮按钮已就绪！");
})();
