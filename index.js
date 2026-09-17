// SillyTavern 剪报拼贴诗 - 防弹稳定版
(function () {
    'use strict';

    if (!window.html2canvas) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(s);
    }
    const fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;600&family=Noto+Serif+SC:wght@300;400;600&family=ZCOOL+XiaoWei&display=swap';
    document.head.appendChild(fl);

    const css = `
        #bpModal {
            position: fixed; inset: 0; width: 100vw; height: 100vh;
            background: rgba(20,20,20,0.95); z-index: 100000;
            display: none; justify-content: center; align-items: flex-start;
            overflow-y: auto; padding: 70px 10px 50px; box-sizing: border-box;
            font-family: -apple-system, sans-serif;
        }
        #bpBox { position: relative; width: 100%; max-width: 430px; margin: 0 auto; }
        #bpTopBar { position: absolute; top: -50px; left: 0; right: 0; display: flex; justify-content: space-between; }
        .bpBarL, .bpBarR { display: flex; gap: 6px; align-items: center; }
        .bpBtn {
            width: 36px; height: 36px; display: flex; justify-content: center; align-items: center;
            background: #FFF; border: 1px solid #CCC; border-radius: 4px; cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .bpBtn svg { width: 18px; height: 18px; stroke: #1C1C1C; stroke-width: 1.6; fill: none; }
        .bpLayout { display: flex; background: #FFF; border: 1px solid #CCC; border-radius: 4px; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .bpLayoutBtn { background: none; border: none; color: #666; font-size: 11px; padding: 6px 10px; border-radius: 2px; cursor: pointer; }
        .bpLayoutBtn.on { background: #1C1C1C; color: #FFF; }

        #bpCanvas {
            width: 100%; max-width: 420px; background: #F7F5F0; display: flex; flex-direction: column;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6); position: relative; touch-action: none;
        }
        #bpCanvas.horiz { flex-direction: row; max-width: 680px; }
        #bpTop {
            background: var(--bpTopBg, #F7F5F0); padding: 34px 24px 24px; flex-shrink: 0;
            font-family: var(--bpTopFont, 'Noto Serif SC', serif); position: relative;
        }
        #bpCanvas.horiz #bpTop { width: 50%; }
        #bpFlow { color: var(--bpTextColor, #1A1A1A); font-size: var(--bpTopSize, 14.5px); line-height: 2.2; letter-spacing: 0.06em; text-align: justify; word-break: break-all; }
        .bpChar { cursor: pointer; position: relative; display: inline-block; color: var(--bpTextColor, #1A1A1A); }
        .bpChar.cut { color: transparent !important; }
        .bpChar.cut::after { content: ""; position: absolute; top: 2px; bottom: 2px; left: 0; right: 0; background: var(--bpCutColor, rgba(0,0,0,0.06)); border-radius: 1px; }
        .bpChar.mBlur { filter: blur(3.5px); opacity: 0.6; }
        .bpChar.mBlack { background: #1A1A1A; color: #1A1A1A !important; }
        .bpChar.mSym { color: transparent !important; }
        .bpChar.mSym::after { content: "×"; position: absolute; inset: 0; color: var(--bpTextColor, #1A1A1A); display: flex; align-items: center; justify-content: center; }

        #bpBottom {
            background: var(--bpBotBg, #F7F5F0); position: relative; flex-shrink: 0;
            min-height: 180px; min-width: 180px; overflow: hidden;
            border-top: 1px solid rgba(0,0,0,0.05); padding-bottom: 30px;
            font-family: var(--bpBotFont, 'Noto Serif SC', serif);
        }
        #bpCanvas.horiz #bpBottom { width: 50%; border-top: none; border-left: 1px solid rgba(0,0,0,0.05); }
        .bpScrap {
            position: absolute; background: var(--bpScrapBg, #F7F5F0); color: var(--bpTextColor, #1A1A1A);
            width: 26px; height: 30px; display: inline-flex; justify-content: center; align-items: center;
            font-size: var(--bpBotSize, 14.5px); border-radius: 1px; cursor: grab; touch-action: none;
            box-shadow: 1px 2px 5px rgba(0,0,0,0.15); z-index: 10; font-family: inherit;
        }
        #bpResizer { position: absolute; bottom: 0; left: 0; width: 100%; height: 14px; cursor: ns-resize; z-index: 1000; display: flex; align-items: center; justify-content: center; }
        #bpResizer::after { content: ""; width: 32px; height: 3px; background: rgba(0,0,0,0.2); border-radius: 2px; }
        #bpCanvas.horiz #bpResizer { right: 0; top: 0; left: auto; width: 14px; height: 100%; cursor: ew-resize; }
        #bpCanvas.horiz #bpResizer::after { width: 3px; height: 32px; }

        #bpMeta { position: absolute; bottom: 10px; left: 0; width: 100%; display: flex; justify-content: center; gap: 12px; font-size: 8.5px; letter-spacing: 0.1em; color: var(--bpTextColor, #1A1A1A); opacity: 0.45; pointer-events: none; }

        .bpDrawer {
            position: fixed; top: 0; width: 275px; height: 100vh; background: #FAFAFA;
            box-shadow: 0 0 35px rgba(0,0,0,0.5); z-index: 100010;
            padding: 25px 16px; overflow-y: auto; font-size: 11.5px; color: #222;
            transition: transform 0.3s; display: flex; flex-direction: column;
        }
        #bpLeft { left: 0; transform: translateX(-300px); }
        #bpLeft.on { transform: translateX(0); }
        #bpRight { right: 0; transform: translateX(300px); }
        #bpRight.on { transform: translateX(0); }

        .bpSec { margin-bottom: 15px; border-bottom: 1px solid #DDD; padding-bottom: 12px; }
        .bpSecT { font-size: 10px; color: #555; margin-bottom: 6px; font-weight: 600; }
        .bpGrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; margin-bottom: 6px; }
        .bpChip { background: #EEE; border: 1px solid #CCC; color: #111; padding: 6px 0; text-align: center; border-radius: 2px; cursor: pointer; font-size: 10px; }
        .bpChip.on { background: #1C1C1C; color: #FFF; }
        .bpMaskRow { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; margin-bottom: 6px; }
        .bpFont { display: flex; justify-content: space-between; background: #FFF; border: 1px solid #CCC; padding: 5px 8px; cursor: pointer; margin-bottom: 4px; }
        .bpFont.on { border-color: #000; background: #E5E5E5; font-weight: bold; }
        .bpAuthors { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
        .bpAuthor { background: #EEE; border: 1px solid #CCC; padding: 8px; font-size: 11px; text-align: center; border-radius: 2px; cursor: pointer; }
        .bpColRow { display: grid; grid-template-columns: repeat(6,1fr); gap: 4px; margin-bottom: 5px; }
        .bpCol { height: 20px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; }
        .bpPick { display: flex; align-items: center; gap: 6px; background: #EEE; padding: 4px 8px; border-radius: 2px; border: 1px solid #CCC; margin: 4px 0; }
        .bpPick input { width: 22px; height: 22px; border: none; background: none; cursor: pointer; }
        .bpSlide { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
        .bpSlide span { color: #555; font-size: 9.5px; }
        .bpSlide input { width: 145px; accent-color: #000; }
    `;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    const box = document.createElement('div');
    box.id = 'bpModal';
    box.innerHTML = `
        <svg style="display:none"><defs>
            <filter id="bpFrost"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter>
            <filter id="bpNoise"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch"/></filter>
        </defs></svg>
        <div id="bpBox">
            <div id="bpTopBar">
                <div class="bpBarL">
                    <div class="bpBtn" id="bpMenu"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></div>
                    <div class="bpBtn" id="bpAuthor"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg></div>
                    <div class="bpLayout"><button class="bpLayoutBtn on" id="bpLV">上下</button><button class="bpLayoutBtn" id="bpLH">左右</button></div>
                </div>
                <div class="bpBarR">
                    <div class="bpBtn" id="bpSet"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                    <div class="bpBtn" id="bpSave"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
                    <div class="bpBtn" id="bpClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
                </div>
            </div>
            <div id="bpCanvas">
                <div id="bpTop"><div id="bpFlow"></div></div>
                <div id="bpBottom"><div id="bpMeta"><span id="bpTime"></span><span id="bpWm"></span></div><div id="bpResizer"></div></div>
            </div>
        </div>
        <div class="bpDrawer" id="bpLeft">
            <div class="bpSec">
                <div class="bpSecT">原地排齐</div>
                <div class="bpGrid">
                    <button class="bpChip" data-act="arr1">排1行</button>
                    <button class="bpChip" data-act="arr2">排2行</button>
                    <button class="bpChip" data-act="arr3" style="font-weight:bold">排3行</button>
                </div>
                <button class="bpChip" data-act="reset" style="width:100%">复原全部</button>
            </div>
            <div class="bpSec">
                <div class="bpSecT">壁纸(原文区)</div>
                <div id="bpTopPal"></div>
                <div class="bpPick"><input type="color" value="#F7F5F0" data-set="top"><span style="font-size:10px">自选颜色</span></div>
                <div class="bpGrid" style="margin-top:8px">
                    <button class="bpChip on" data-tex="top-none">无纹理</button>
                    <button class="bpChip" data-tex="top-frost">细磨砂</button>
                    <button class="bpChip" data-tex="top-noise">胶片噪点</button>
                </div>
            </div>
            <div class="bpSec">
                <div class="bpSecT">底图(拼贴区)</div>
                <div id="bpBotPal"></div>
                <div class="bpPick"><input type="color" value="#F7F5F0" data-set="bot"><span style="font-size:10px">自选颜色</span></div>
                <button class="bpChip" data-act="sync" style="width:100%;margin-top:6px">使拼贴区与原文区等大</button>
                <div class="bpGrid" style="margin-top:8px">
                    <button class="bpChip on" data-tex="bot-none">无纹理</button>
                    <button class="bpChip" data-tex="bot-frost">细磨砂</button>
                    <button class="bpChip" data-tex="bot-noise">胶片噪点</button>
                </div>
            </div>
            <div class="bpSec">
                <div class="bpSecT">字体颜色</div>
                <div id="bpTxtPal"></div>
                <div class="bpPick"><input type="color" value="#1A1A1A" data-set="txt"><span style="font-size:10px">自选颜色</span></div>
            </div>
            <div class="bpSec">
                <div class="bpSecT">字体设置</div>
                <div style="font-size:10px;margin-bottom:4px;font-weight:bold">上:原文区</div>
                <div class="bpFont on" data-font="top" data-val="Noto Serif SC,serif"><span>思源宋体</span><span>恨水虚席</span></div>
                <div class="bpFont" data-font="top" data-val="Ma Shan Zheng,cursive"><span>马善政毛笔</span><span>恨水虚席</span></div>
                <div class="bpSlide" style="margin-bottom:10px"><span>原文大小</span><input type="range" min="11" max="24" value="14" data-size="top"></div>
                <div style="font-size:10px;margin-bottom:4px;font-weight:bold">下:拼贴区</div>
                <div class="bpFont on" data-font="bot" data-val="Noto Serif SC,serif"><span>思源宋体</span><span>恨水虚席</span></div>
                <div class="bpFont" data-font="bot" data-val="Ma Shan Zheng,cursive"><span>马善政毛笔</span><span>恨水虚席</span></div>
                <div class="bpSlide"><span>拼贴大小</span><input type="range" min="11" max="24" value="14" data-size="bot"></div>
            </div>
        </div>
        <div class="bpDrawer" id="bpRight">
            <div class="bpSec">
                <div class="bpSecT">一键打码</div>
                <div class="bpMaskRow" data-mask="user"><span id="bpSymU">⊹</span><span>User</span></div>
                <div class="bpMaskRow" data-mask="char"><span id="bpSymC">⊹</span><span>Char</span></div>
                <div class="bpGrid" style="margin-top:8px">
                    <button class="bpChip on" data-mstyle="blur">模糊</button>
                    <button class="bpChip" data-mstyle="black">涂黑</button>
                    <button class="bpChip" data-mstyle="sym">符号</button>
                </div>
            </div>
            <div class="bpSec">
                <div class="bpSecT">时间与水印</div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>显示时间</span><input type="checkbox" id="bpTimeCb" checked style="accent-color:#000"></div>
                <div class="bpGrid" style="grid-template-columns:1fr 1fr;margin-bottom:10px">
                    <button class="bpChip on" data-time="solar">公历</button>
                    <button class="bpChip" data-time="lunar">干支历</button>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>显示水印</span><input type="checkbox" id="bpWmCb" checked style="accent-color:#000"></div>
                <input type="text" id="bpWmInput" value="SillyTavern" style="width:100%;padding:6px;border:1px solid #CCC;border-radius:2px;font-size:11px">
            </div>
            <div class="bpSec">
                <div class="bpSecT">名人风格</div>
                <div class="bpAuthors" id="bpAuthorList"></div>
            </div>
        </div>
    `;
    document.body.appendChild(box);

    // ===== 安全获取工具 =====
    const $id = (i) => document.getElementById(i);
    const rootStyle = document.documentElement.style;

    let lastSel = "";
    document.addEventListener('selectionchange', () => {
        const s = window.getSelection();
        if (s && s.toString().trim()) lastSel = s.toString().trim();
    });

    let maskU = false, maskC = false, maskStyle = 'blur', timeMode = 'solar';

    const authors = [
        { n: "张爱玲", p: [["烫手的铁","糖衣"],["毫不设防","吞下去"]] },
        { n: "史铁生", p: [["漫长","使用历史"],["默认","仍然成立"]] },
        { n: "太宰治", p: [["全然","吞下去"],["带着期待","张开嘴"]] },
        { n: "木心", p: [["教她","系鞋带"],["唐诗","不要闭眼睛"]] },
        { n: "余华", p: [["喉咙","烫手的铁"],["每一颗","递过去"]] },
        { n: "鲁迅", p: [["喉咙里","烫手的铁"],["答案","腐蚀成铁"]] }
    ];
    const authorCnt = {};

    // ===== 渲染文字 =====
    function renderText(text) {
        const flow = $id('bpFlow'), bot = $id('bpBottom');
        if (!flow || !bot) return;
        flow.innerHTML = '';
        bot.querySelectorAll('.bpScrap').forEach(e => e.remove());
        text.split('').forEach((ch, i) => {
            const sp = document.createElement('span');
            sp.className = 'bpChar';
            sp.textContent = ch;
            sp.dataset.ch = ch;
            sp.dataset.i = i;
            sp.onclick = () => {
                if (sp.classList.contains('cut')) {
                    sp.classList.remove('cut');
                    const sc = bot.querySelector('.bpScrap[data-i="' + i + '"]');
                    if (sc) sc.remove();
                } else {
                    sp.classList.add('cut');
                    spawnScrap(ch, i);
                }
            };
            flow.appendChild(sp);
        });
        updateMeta();
    }

    function spawnScrap(ch, i) {
        const bot = $id('bpBottom');
        if (!bot) return;
        const sc = document.createElement('div');
        sc.className = 'bpScrap';
        sc.textContent = ch;
        sc.dataset.i = i;
        sc.style.left = (Math.random() * 150 + 30) + 'px';
        sc.style.top = (Math.random() * 60 + 20) + 'px';
        enableDrag(sc);
        sc.ondblclick = () => {
            const t = document.querySelector('.bpChar[data-i="' + i + '"]');
            if (t) t.classList.remove('cut');
            sc.remove();
        };
        bot.appendChild(sc);
    }

    function enableDrag(el) {
        let d = false, sx, sy, ox, oy;
        const start = (e) => {
            d = true;
            const p = e.touches ? e.touches[0] : e;
            sx = p.clientX; sy = p.clientY;
            ox = parseFloat(el.style.left) || 0; oy = parseFloat(el.style.top) || 0;
            el.style.zIndex = 1000;
        };
        const move = (e) => {
            if (!d) return;
            const p = e.touches ? e.touches[0] : e;
            el.style.left = (ox + p.clientX - sx) + 'px';
            el.style.top = (oy + p.clientY - sy) + 'px';
        };
        const end = () => { d = false; el.style.zIndex = 10; };
        el.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, { passive: true });
        window.addEventListener('touchmove', move, { passive: true });
        window.addEventListener('touchend', end);
    }

    function arrange(lines) {
        const bot = $id('bpBottom');
        if (!bot) return;
        const scraps = Array.from(bot.querySelectorAll('.bpScrap'));
        if (!scraps.length) return;
        const rect = bot.getBoundingClientRect();
        let sx = 0, sy = 0;
        scraps.forEach(s => { sx += parseFloat(s.style.left) || 0; sy += parseFloat(s.style.top) || 0; });
        const cx = sx / scraps.length + 14, cy = sy / scraps.length + 16;
        const L = Math.min(lines, scraps.length);
        const per = Math.ceil(scraps.length / L);
        const w = per * 28 + (per - 1) * 8, h = L * 32 + (L - 1) * 10;
        let ox = Math.max(10, Math.min(rect.width - w - 10, cx - w / 2));
        let oy = Math.max(10, Math.min(rect.height - h - 25, cy - h / 2));
        scraps.forEach((s, i) => {
            const r = Math.floor(i / per), c = i % per;
            s.style.transition = 'all 0.3s ease';
            s.style.transform = 'rotate(0deg)';
            s.style.left = (ox + c * 36) + 'px';
            s.style.top = (oy + r * 42) + 'px';
            setTimeout(() => s.style.transition = '', 300);
        });
    }

    function resetCuts() {
        document.querySelectorAll('.bpChar.cut').forEach(n => n.classList.remove('cut'));
        document.querySelectorAll('.bpScrap').forEach(n => n.remove());
    }

    function genAuthor(a) {
        resetCuts();
        const raw = Array.from(document.querySelectorAll('.bpChar')).map(n => n.dataset.ch).join('');
        authorCnt[a.n] = (authorCnt[a.n] || 0);
        const phrase = a.p[authorCnt[a.n] % a.p.length];
        authorCnt[a.n]++;
        let found = [];
        phrase.forEach(w => { for (const c of w) if (raw.includes(c)) found.push(c); });
        found.slice(0, 8).forEach(c => {
            const node = Array.from(document.querySelectorAll('.bpChar')).find(n => n.dataset.ch === c && !n.classList.contains('cut'));
            if (node) { node.classList.add('cut'); spawnScrap(c, node.dataset.i); }
        });
        setTimeout(() => arrange(2), 60);
    }

    function applyMask() {
        const raw = Array.from(document.querySelectorAll('.bpChar')).map(n => n.dataset.ch).join('');
        const cw = raw.match(/莫诺马赫|林越安|高杉|桂|柯梵恩|褚瓷/g) || ["柯梵恩", "褚瓷"];
        const uw = ["我", "你", "他", "她"];
        const cls = 'm' + (maskStyle === 'blur' ? 'Blur' : maskStyle === 'black' ? 'Black' : 'Sym');
        const nodes = Array.from(document.querySelectorAll('.bpChar'));
        nodes.forEach(n => n.classList.remove('mBlur', 'mBlack', 'mSym'));
        nodes.forEach((n, i) => {
            const ch = n.dataset.ch;
            if (maskC && cw.some(w => raw.substr(i, w.length) === w)) n.classList.add(cls);
            if (maskU && uw.includes(ch)) n.classList.add(cls);
        });
    }

    function updateMeta() {
        const t = $id('bpTime'), w = $id('bpWm');
        if (t) {
            const cb = $id('bpTimeCb');
            if (cb && cb.checked) {
                t.style.display = 'inline';
                const d = new Date();
                if (timeMode === 'solar') t.textContent = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
                else {
                    const tg = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"], dz = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
                    t.textContent = tg[(d.getFullYear() - 4) % 10] + dz[(d.getFullYear() - 4) % 12] + '年 仲冬月';
                }
            } else t.style.display = 'none';
        }
        if (w) {
            const cb = $id('bpWmCb'), inp = $id('bpWmInput');
            w.style.display = (cb && cb.checked) ? 'inline' : 'none';
            if (inp) w.textContent = inp.value.trim();
        }
    }

    // ===== 颜色盘 =====
    const cats = {
        浅色: ['#F7F5F0', '#FFFFFF', '#F2F2F2', '#F0ECE1', '#EFE5E3', '#E5EADF'],
        复古: ['#6B2D2B', '#334839', '#203A4C', '#D9CBB7', '#6B442A', '#C99E5C'],
        深色: ['#111111', '#1C1E21', '#2B2B2B', '#0F1A24', '#1E1524', '#241B18']
    };
    function buildPal(id, cb) {
        const c = $id(id);
        if (!c) return;
        Object.keys(cats).forEach(k => {
            const row = document.createElement('div');
            row.className = 'bpColRow';
            cats[k].forEach(col => {
                const b = document.createElement('button');
                b.className = 'bpCol';
                b.style.background = col;
                b.onclick = () => cb(col);
                row.appendChild(b);
            });
            c.appendChild(row);
        });
    }
    function setTopBg(c) {
        rootStyle.setProperty('--bpTopBg', c);
        rootStyle.setProperty('--bpScrapBg', c);
        const v = parseInt(c.replace('#', ''), 16);
        const luma = 0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255);
        rootStyle.setProperty('--bpCutColor', luma > 140 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)');
    }
    function setBotBg(c) { rootStyle.setProperty('--bpBotBg', c); }
    buildPal('bpTopPal', setTopBg);
    buildPal('bpBotPal', setBotBg);

    const txtCols = ['#1A1A1A', '#FFFFFF', '#666666', '#6B2D2B', '#334839', '#203A4C', '#D9CBB7', '#EFE5E3'];
    const tpal = $id('bpTxtPal');
    if (tpal) {
        const row = document.createElement('div');
        row.className = 'bpColRow';
        txtCols.forEach(col => {
            const b = document.createElement('button');
            b.className = 'bpCol';
            b.style.background = col;
            b.onclick = () => rootStyle.setProperty('--bpTextColor', col);
            row.appendChild(b);
        });
        tpal.appendChild(row);
    }

    // 名人按钮
    const al = $id('bpAuthorList');
    if (al) authors.forEach(a => {
        const b = document.createElement('div');
        b.className = 'bpAuthor';
        b.textContent = a.n;
        b.onclick = () => { genAuthor(a); closeDrawers(); };
        al.appendChild(b);
    });

    // ===== 事件绑定（全部委托，绝不崩） =====
    function openL() { const l = $id('bpLeft'), r = $id('bpRight'); if (r) r.classList.remove('on'); if (l) l.classList.toggle('on'); }
    function openR() { const l = $id('bpLeft'), r = $id('bpRight'); if (l) l.classList.remove('on'); if (r) r.classList.toggle('on'); }
    function closeDrawers() { const l = $id('bpLeft'), r = $id('bpRight'); if (l) l.classList.remove('on'); if (r) r.classList.remove('on'); }

    box.addEventListener('click', (e) => {
        const t = e.target.closest('[id],[data-act],[data-tex],[data-font],[data-mask],[data-mstyle],[data-time]');
        if (!t) return;

        if (t.id === 'bpMenu') openL();
        else if (t.id === 'bpSet') openR();
        else if (t.id === 'bpAuthor') { openR(); }
        else if (t.id === 'bpClose') { const m = $id('bpModal'); if (m) m.style.display = 'none'; }
        else if (t.id === 'bpLV') { t.classList.add('on'); const h = $id('bpLH'); if (h) h.classList.remove('on'); const c = $id('bpCanvas'); if (c) c.classList.remove('horiz'); }
        else if (t.id === 'bpLH') { t.classList.add('on'); const v = $id('bpLV'); if (v) v.classList.remove('on'); const c = $id('bpCanvas'); if (c) c.classList.add('horiz'); }
        else if (t.id === 'bpSave') doSave();

        const act = t.dataset.act;
        if (act === 'arr1') arrange(1);
        else if (act === 'arr2') arrange(2);
        else if (act === 'arr3') arrange(3);
        else if (act === 'reset') resetCuts();
        else if (act === 'sync') syncSize();

        if (t.dataset.tex) {
            const [zone, type] = t.dataset.tex.split('-');
            document.querySelectorAll('[data-tex^="' + zone + '"]').forEach(b => b.classList.remove('on'));
            t.classList.add('on');
            applyTex(zone, type);
        }
        if (t.dataset.font) {
            document.querySelectorAll('.bpFont[data-font="' + t.dataset.font + '"]').forEach(f => f.classList.remove('on'));
            t.classList.add('on');
            rootStyle.setProperty(t.dataset.font === 'top' ? '--bpTopFont' : '--bpBotFont', t.dataset.val);
        }
        if (t.dataset.mask) {
            if (t.dataset.mask === 'user') { maskU = !maskU; const s = $id('bpSymU'); if (s) s.textContent = maskU ? '✦' : '⊹'; }
            else { maskC = !maskC; const s = $id('bpSymC'); if (s) s.textContent = maskC ? '✦' : '⊹'; }
            applyMask();
        }
        if (t.dataset.mstyle) {
            maskStyle = t.dataset.mstyle;
            document.querySelectorAll('[data-mstyle]').forEach(b => b.classList.remove('on'));
            t.classList.add('on');
            applyMask();
        }
        if (t.dataset.time) {
            timeMode = t.dataset.time;
            document.querySelectorAll('[data-time]').forEach(b => b.classList.remove('on'));
            t.classList.add('on');
            updateMeta();
        }
    });

    box.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset.set) {
            if (t.dataset.set === 'top') setTopBg(t.value);
            else if (t.dataset.set === 'bot') setBotBg(t.value);
            else if (t.dataset.set === 'txt') rootStyle.setProperty('--bpTextColor', t.value);
        }
        if (t.dataset.size) {
            rootStyle.setProperty(t.dataset.size === 'top' ? '--bpTopSize' : '--bpBotSize', t.value + 'px');
        }
        if (t.id === 'bpWmInput' || t.id === 'bpTimeCb' || t.id === 'bpWmCb') updateMeta();
    });

    function applyTex(zone, type) {
        const layerId = zone === 'top' ? 'bpTop' : 'bpBottom';
        const el = $id(layerId);
        if (!el) return;
        let overlay = el.querySelector('.bpTexLayer');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'bpTexLayer';
            overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;z-index:5;';
            el.appendChild(overlay);
        }
        if (type === 'none') { overlay.style.filter = 'none'; overlay.style.background = 'none'; overlay.style.opacity = 0; }
        else if (type === 'frost') { overlay.style.filter = 'url(#bpFrost)'; overlay.style.background = '#888'; overlay.style.opacity = 0.3; }
        else if (type === 'noise') { overlay.style.filter = 'url(#bpNoise)'; overlay.style.background = '#888'; overlay.style.opacity = 0.3; }
    }

    function syncSize() {
        const c = $id('bpBottom'), s = $id('bpTop'), cv = $id('bpCanvas');
        if (!c || !s || !cv) return;
        if (cv.classList.contains('horiz')) { c.style.height = s.offsetHeight + 'px'; c.style.width = s.offsetWidth + 'px'; }
        else { c.style.width = '100%'; c.style.height = s.offsetHeight + 'px'; }
    }

    // 拉伸器
    const rz = $id('bpResizer');
    if (rz) {
        let d = false, sx, sy, sw, sh;
        const start = (e) => {
            d = true;
            const p = e.touches ? e.touches[0] : e;
            sx = p.clientX; sy = p.clientY;
            const c = $id('bpBottom'); sw = c.offsetWidth; sh = c.offsetHeight;
            e.stopPropagation();
        };
        const move = (e) => {
            if (!d) return;
            const p = e.touches ? e.touches[0] : e;
            const c = $id('bpBottom'), cv = $id('bpCanvas');
            if (cv.classList.contains('horiz')) {
                c.style.width = Math.max(120, sw + (p.clientX - sx)) + 'px';
                c.style.height = $id('bpTop').offsetHeight + 'px';
            } else c.style.height = Math.max(120, sh + (p.clientY - sy)) + 'px';
        };
        const end = () => { d = false; };
        rz.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
        rz.addEventListener('touchstart', start, { passive: true }); window.addEventListener('touchmove', move, { passive: true }); window.addEventListener('touchend', end);
    }

    function doSave() {
        closeDrawers();
        const rz = $id('bpResizer'); if (rz) rz.style.display = 'none';
        html2canvas($id('bpCanvas'), { scale: 4, useCORS: true, backgroundColor: null }).then(c => {
            if (rz) rz.style.display = 'flex';
            const a = document.createElement('a');
            a.download = 'Poem_' + Date.now() + '.png';
            a.href = c.toDataURL('image/png', 1.0);
            a.click();
        });
    }

    window.openBlackoutPoetry = function () {
        let txt = "";
        const cur = window.getSelection() ? window.getSelection().toString().trim() : "";
        if (cur) txt = cur;
        else if (lastSel) { txt = lastSel; lastSel = ""; }
        if (!txt && window.SillyTavern) {
            try {
                const chat = SillyTavern.getContext().chat || [];
                for (let i = chat.length - 1; i >= 0; i--) {
                    if (chat[i].is_user === false && chat[i].mes) { txt = chat[i].mes; break; }
                }
            } catch (e) {}
        }
        if (!txt) txt = "请先划选一段文字，或与角色对话后再开启。";
        const clean = $('<div>').html(txt).text().trim();
        const m = $id('bpModal');
        if (m) m.style.display = 'flex';
        renderText(clean);
    };

    // 挂载魔法棒
    jQuery(async () => {
        try {
            const h = await $.get('/scripts/extensions/third-party/st-blackout-poetry/settings.html');
            $('#extensions_settings').append(h);
            $(document).on('click', '#bp_open_studio_btn', () => window.openBlackoutPoetry());
            console.log('[剪报拼贴诗] 就绪');
        } catch (e) { console.warn('[剪报拼贴诗]', e); }
    });
})();
