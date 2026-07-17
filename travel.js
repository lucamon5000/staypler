let travelPlan = [];
let editIndex = -1;
let isHotelModeActive = false;

// ローカルストレージからデータを読み込む
if (localStorage.getItem("travelPlan")) {
    travelPlan = JSON.parse(localStorage.getItem("travelPlan"));
}

function saveAndRefresh() {
    localStorage.setItem("travelPlan", JSON.stringify(travelPlan));
    displayPlan();
    calculateBudget(); // 🌟 ここを追加
}

window.onload = function() {
    displayPlan();
    calculateBudget(); // 🌟 ここを追加
};

function toggleHotelMode() {
    const btn = document.getElementById("hotelToggleBtn");
    isHotelModeActive = !isHotelModeActive;

    if (isHotelModeActive) {
        btn.style.opacity = "1";
        btn.style.borderColor = "#f39c12";
        btn.style.backgroundColor = "#fff9f0";
    } else {
        btn.style.opacity = "0.4";
        btn.style.borderColor = "#ccc";
        btn.style.backgroundColor = "transparent";
    }
}

// ユニークID生成用
function generateId() {
    return "id-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

// 新しい登録・編集処理
function addDestination() {
    const dateElement = document.getElementById("newDate");
    const startElement = document.getElementById("startTime");
    const endValueDateElement = document.getElementById("endValueDate"); 
    const endElement = document.getElementById("endTime");
    const inputElement = document.getElementById("newDestination");
    const memoElement = document.getElementById("newMemo");
    
    const inputDate = dateElement.value;
    const startTime = startElement.value;
    const endDate = endValueDateElement.value; 
    const endTime = endElement.value;
    const rawPlace = inputElement.value;
    const newMemo = memoElement.value;

    if (rawPlace !== "") {
        if (editIndex === -1) {
            // 新規登録
            if (rawPlace.includes("~")) {
                const steps = parseRouteText(rawPlace);
                const sTime = steps.length > 1 ? (steps[0].meta.startTime || "") : "";
                const eTime = steps.length > 1 ? (steps[steps.length - 1].meta.endTime || "") : "";

                const routeItem = {
                    id: generateId(),
                    date: inputDate,
                    startTime: sTime || startTime, // 移動データ自体にも時間を持たせる
                    endDate: endDate,
                    endTime: endTime || eTime,     
                    place: rawPlace, 
                    memo: newMemo,
                    isHotel: false,
                    isRouteOnly: true
                };
                travelPlan.push(routeItem);
            } else {
                const itemData = { 
                    id: generateId(),
                    date: inputDate, 
                    startTime: startTime, 
                    endDate: endDate, 
                    endTime: endTime, 
                    place: rawPlace,
                    memo: newMemo,
                    isHotel: isHotelModeActive,
                    isRouteOnly: false
                };
                travelPlan.push(itemData);
            }
        } else {
            // 編集保存
            travelPlan[editIndex].date = inputDate;
            travelPlan[editIndex].startTime = startTime;
            travelPlan[editIndex].endDate = endDate;
            travelPlan[editIndex].endTime = endTime;
            travelPlan[editIndex].place = rawPlace;
            travelPlan[editIndex].memo = newMemo;
            travelPlan[editIndex].isHotel = isHotelModeActive;
            
            if (rawPlace.includes("~")) {
                const steps = parseRouteText(rawPlace);
                travelPlan[editIndex].startTime = steps.length > 1 ? (steps[0].meta.startTime || "") : startTime;
                travelPlan[editIndex].endTime = steps.length > 1 ? (steps[steps.length - 1].meta.endTime || "") : endTime;
                travelPlan[editIndex].isRouteOnly = true;
            } else {
                travelPlan[editIndex].isRouteOnly = false;
            }

            editIndex = -1;
            const btn = document.getElementById("submitBtn");
            btn.innerText = "追加";
            btn.style.backgroundColor = "#3498db";
        }

        // 🌟 ここで移動ルートから出発地・到着地ピンの自動生成＆「データ自体」への時刻書き込みを行う
        syncRouteTimes(inputDate);
        
        // ソート処理
        sortTravelPlan();

        // フォームのリセット
        startElement.value = "";
        endValueDateElement.value = ""; 
        endValueDateElement.style.display = "none"; 
        endElement.value = "";
        inputElement.value = "";
        memoElement.value = "";
        
        isHotelModeActive = true; 
        toggleHotelMode();
        
        saveAndRefresh();
    } else {
        alert("「行き先」は必ず入力してください！");
    }
}

// 移動データのパースから駅名と時間を抽出し、スポットに反映・自動生成する
function syncRouteTimes(targetDate) {
    const routes = travelPlan.filter(p => p.isRouteOnly && p.date === targetDate);

    routes.forEach(route => {
        const steps = parseRouteText(route.place);
        if (steps.length > 1) {
            const startPlaceName = steps[0].place;
            const endPlaceName = steps[steps.length - 1].place;
            
            const sTime = steps[0].meta.startTime || "";
            const eTime = steps[steps.length - 1].meta.endTime || "";

            // 1. 出発地の処理（データ自体に直接時間を書き込む）
            let originNode = travelPlan.find(p => !p.isRouteOnly && p.place === startPlaceName && p.date === targetDate);
            if (!originNode) {
                originNode = {
                    id: generateId(),
                    date: targetDate,
                    startTime: sTime, // 🌟ここに22:00が確実に入る
                    endDate: "",
                    endTime: "",
                    place: startPlaceName,
                    memo: "",
                    isHotel: false,
                    isRouteOnly: false
                };
                travelPlan.push(originNode);
            } else {
                if (sTime !== "") {
                    originNode.startTime = sTime; // 既存ピンがあっても上書き
                }
            }

            // 2. 到着地の処理
            let targetNode = travelPlan.find(p => !p.isRouteOnly && p.place === endPlaceName && p.date === targetDate);
            if (!targetNode) {
                targetNode = {
                    id: generateId(),
                    date: targetDate,
                    startTime: eTime, // 🌟ここに23:30が確実に入る
                    endDate: "",
                    endTime: "",
                    place: endPlaceName,
                    memo: "",
                    isHotel: false,
                    isRouteOnly: false
                };
                travelPlan.push(targetNode);
            } else {
                if (eTime !== "") {
                    targetNode.startTime = eTime;
                }
            }
        }
    });
}

// ソート関数
function sortTravelPlan() {
    travelPlan.sort((a, b) => {
        if (a.date === "" && b.date !== "") return 1;
        if (a.date !== "" && b.date === "") return -1;
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        
        const getPriority = (item) => {
            if (item.isHotel) return 9999;
            
            // 移動アコーディオンは「到着駅（終点）」の直前に並ぶように、終了時刻の1分前（-1分）にする
            if (item.isRouteOnly) {
                if (item.endTime === "") return -1;
                const [h, m] = item.endTime.split(":").map(Number);
                return h * 60 + m - 0.5; // 目的地（品川駅）のほんの少し前に配置
            }

            if (item.startTime === "") return -1;
            const [h, m] = item.startTime.split(":").map(Number);
            return h * 60 + m;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // 同時刻の場合、移動データを先に描画させるための微調整
        if (a.isRouteOnly && !b.isRouteOnly) return -1;
        if (!a.isRouteOnly && b.isRouteOnly) return 1;
        
        return 0;
    });
}

function getIconAndTypeFromTag(tag) {
    switch (tag.toLowerCase()) {
        case '#t': return { icon: '🚃', label: 'train' };
        case '#b': return { icon: '🚌', label: 'bus' };
        case '#s': return { icon: '🚢', label: 'ship' };
        case '#p': return { icon: '✈️', label: 'plane' };
        case '#w': return { icon: '🚶', label: 'walk' };
        default: return { icon: '➡️', label: 'other' };
    }
}

function toggleRouteCollapse(index) {
    const container = document.getElementById(`route-container-${index}`);
    const btn = document.getElementById(`route-btn-${index}`);
    
    if (container.style.display === "none") {
        container.style.display = "block";
        btn.innerHTML = `<span id="route-btn-icon-${index}">▲</span> 閉じる`;
        btn.style.backgroundColor = "#e8f4fd";
    } else {
        container.style.display = "none";
        btn.innerHTML = `<span id="route-btn-icon-${index}">▼</span> 移動詳細`;
        btn.style.backgroundColor = "#f0f3f5";
    }
}

function formatTrackLabel(trackText, transportType) {
    if (!trackText) return "";
    const cleanNum = trackText.replace(/^t/i, "").trim();
    
    switch (transportType) {
        case 'train': return `${cleanNum}番線`;
        case 'bus': return `${cleanNum}番のりば`;
        case 'plane':
            return cleanNum.match(/^[a-zA-Z]$/) ? `ターミナル${cleanNum.toUpperCase()}` : `${cleanNum}番搭乗口`;
        case 'ship': return `${cleanNum}号桟橋`;
        default: return `${cleanNum}番のりば`;
    }
}

function formatDaysAddedText(days) {
    if (days === 1) return "翌日";
    if (days === 2) return "翌々日";
    if (days > 2) return `+${days}日`;
    return "";
}

function parseRouteText(rawText) {
    if (!rawText) return [];

    const segments = rawText.split("~");
    const result = [];

    result.push({
        place: segments[0] ? segments[0].trim() : "",
        time: "", type: "", cost: "", track: "",
        meta: { cost: 0, depTime: "", arrTime: "", depTrack: "", arrTrack: "" }
    });

    for (let i = 1; i < segments.length; i++) {
        const seg = segments[i].trim();
        if (!seg) continue;

        // 🌟 ここでカッコを任意（あってもなくてもOK）にした
        const routeRegex = /^#([tvbwpkfomsr])(?:\(([^)]+)\))?\s*(.*)$/i;
        const match = seg.match(routeRegex);

        if (match) {
            const transportType = match[1].toLowerCase();
            const paramsStr = match[2] || ""; // カッコがない場合は空文字
            const nextPlaceName = match[3] ? match[3].trim() : "";

            const params = paramsStr ? paramsStr.split(",").map(p => p.trim()) : [];

            // ...（中略：パラメータ解析部分は元のコードのままでOK）...
            let startTime = "", endTime = "", costVal = 0, startTrack = "", endTrack = "", lineName = "";
            params.forEach(param => {
                if (!param) return;
                if (param.startsWith("\\") || param.startsWith("￥")) {
                    const priceNum = parseInt(param.slice(1), 10);
                    if (!isNaN(priceNum)) costVal = priceNum;
                } else if (param.startsWith("st")) {
                    startTrack = param.slice(2).trim();
                } else if (param.startsWith("at")) {
                    endTrack = param.slice(2).trim();
                } else if (param.startsWith("s") && /\d/.test(param)) {
                    startTime = param.slice(1).trim();
                } else if (param.startsWith("a") && /\d/.test(param)) {
                    endTime = param.slice(1).trim();
                } else if (!/^\d+$/.test(param)) {
                    lineName = param;
                }
            });

            const tag = `#${transportType}`;
            let icon = "➡️";
            if (typeof getIconAndTypeFromTag === "function") {
                icon = getIconAndTypeFromTag(tag).icon;
            } else {
                const fallbackIcons = { '#t': '🚃', '#b': '🚌', '#s': '🚢', '#p': '✈️', '#w': '🚶' };
                icon = fallbackIcons[tag] || "➡️";
            }

            result.push({
                place: nextPlaceName,
                type: tag,
                icon: icon,
                track: "",
                time: "",
                cost: costVal > 0 ? String(costVal) : "",
                meta: { cost: costVal, lineName, startTime, endTime, startTrack, endTrack, endDaysOffset: 0 }
            });
        } else {
            // カッコすら使っていないただの場所移動
            result.push({
                place: seg,
                type: "",
                icon: "➡️",
                track: "",
                time: "",
                cost: "",
                meta: { cost: 0, lineName: "", startTime: "", endTime: "", startTrack: "", endTrack: "", endDaysOffset: 0 }
            });
        }
    }
    return result;
}

function buildGapRoutePanel(steps, index) {
    let stepsHtml = `<div id="route-container-${index}" class="route-steps-archive" style="display: none; margin: 4px 0 12px 24px; border-left: 3px solid #3498db; padding-left: 20px; font-size: 0.9rem; color: #333; font-family: sans-serif;">`;
    
    steps.forEach((step, idx) => {
        if (idx === 0) return;

        const m = step.meta || {};
        const lineLabel = m.lineName ? `<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${m.lineName}</span>` : "";
        const numericCost = Number(m.cost);
        const costText = (numericCost && !isNaN(numericCost)) ? `<span style="color: #7f8c8d; font-size: 0.8rem;">(￥${numericCost.toLocaleString()})</span>` : "";
        
        let detailLine = "";
        if (m.startTime || m.startTrack || m.endTime || m.endTrack) {
            detailLine += `
                <div style="margin: 4px 0 4px 8px; padding-left: 10px; font-size: 0.8rem; color: #64748b; display: flex; flex-direction: column; gap: 2px;">
                    ${m.startTime ? `<div>🕒 ${m.startTime} 発 ${m.startTrack ? `<span style="background: #e2e8f0; color: #1e293b; padding: 1px 4px; border-radius: 3px; font-size: 0.75rem; font-weight: 500; margin-left: 5px;">${m.startTrack}</span>` : ""}</div>` : (m.startTrack ? `<div>🚪 ${m.startTrack}</div>` : "")}
                    ${m.endTime ? `<div>🕒 ${m.endTime} 着 ${m.endTrack ? `<span style="background: #e2e8f0; color: #1e293b; padding: 1px 4px; border-radius: 3px; font-size: 0.75rem; font-weight: 500; margin-left: 5px;">${m.endTrack}</span>` : ""}</div>` : (m.endTrack ? `<div>🚪 ${m.endTrack}</div>` : "")}
                </div>
            `;
        }

        // 🌟 修正：アイコン判定を廃止し、"移動として認識されているかどうか"で判定
        // step.meta に何か情報が入っている（またはアイコンが特定のものになっている）場合は表示
        const hasMeta = Object.keys(m).length > 0;
        
        if (hasMeta || step.icon !== "➡️") {
            stepsHtml += `
                <div style="margin: 8px 0; position: relative;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.1rem; background: white; z-index: 1;">${step.icon || '➡️'}</span>
                        ${lineLabel}
                        ${costText}
                    </div>
                    ${detailLine}
                </div>
            `;
        }

        const isFinal = idx === steps.length - 1;
        if (!isFinal) {
            const stationDayText = (typeof formatDaysAddedText === 'function') ? formatDaysAddedText(m.endDaysOffset || 0) : "";
            const dayLabel = stationDayText ? `<span style="color: #e74c3c; font-size: 0.75rem; font-weight: bold; margin-left: 6px;">(${stationDayText})</span>` : "";

            stepsHtml += `
                <div style="position: relative; margin: 10px 0 10px -26px; display: flex; align-items: center;">
                    <span style="background: #3498db; color: white; border-radius: 50%; width: 12px; height: 12px; display: inline-block; border: 3px solid white; box-shadow: 0 0 0 1px #3498db; z-index: 1;"></span>
                    <span style="font-weight: bold; font-size: 0.9rem; color: #2c3e50; margin-left: 15px;">
                        📍 ${step.place}${dayLabel}
                    </span>
                </div>
            `;
        }
    });
    stepsHtml += `</div>`;
    return stepsHtml;
}

function displayPlan() {
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = "";
    
    let activePlans = travelPlan
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter(item => item.date !== "");

    let renderablePlans = activePlans.filter(p => !p.isRouteOnly);

    // 移動データと目的地（終点）の紐付けマップを作成
    let routeConnections = {};
    activePlans.forEach(plan => {
        if (plan.isRouteOnly) {
            const steps = parseRouteText(plan.place);
            if (steps.length > 1) {
                const finalEndPlaceName = steps[steps.length - 1].place;

                const matchedDestination = renderablePlans.find(
                    p => p.place === finalEndPlaceName && p.date === plan.date
                );

                if (matchedDestination && !routeConnections[matchedDestination.id]) {
                    routeConnections[matchedDestination.id] = {
                        steps: steps,
                        originalIndex: plan.originalIndex
                    };
                }
            }
        }
    });

    let tripStartDate = renderablePlans.length > 0 ? renderablePlans.map(p => p.date).sort()[0] : "";
    let lastDate = "";
    const weekChars = ["日", "月", "火", "水", "木", "金", "土"];

    renderablePlans.forEach((item) => {
        // 日付ヘッダー
        if (item.date !== lastDate) {
            let dayCountDisplay = "";
            if (tripStartDate) {
                const start = new Date(tripStartDate);
                const current = new Date(item.date);
                const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1;
                dayCountDisplay = `${diffDays}日目`;
            }
            const d = new Date(item.date);
            outputDiv.innerHTML += `
                <div class="date-header">
                    <span class="day-badge">${dayCountDisplay}</span>
                    <span class="date-text">${d.getMonth() + 1}/${d.getDate()} <span class="week-text">(${weekChars[d.getDay()]})</span></span>
                </div>
            `;
            lastDate = item.date;
        }

        // 移動アコーディオンの差し込み
        const connectedRoute = routeConnections[item.id];
        if (connectedRoute) {
            let totalCost = 0;
            connectedRoute.steps.forEach(step => { if(step.meta.cost) totalCost += step.meta.cost; });
            const costLabel = totalCost > 0 ? ` / ￥${totalCost.toLocaleString()}` : "";
            const gapPanel = buildGapRoutePanel(connectedRoute.steps, connectedRoute.originalIndex);

            const routeIdx = connectedRoute.originalIndex;

            outputDiv.innerHTML += `
                <div class="route-gap-container" style="margin-left: 95px; font-family: sans-serif; position: relative;">
                    <div style="display: flex; align-items: center; margin-left: 8px; padding: 12px 0; border-left: 3px dashed #cbd5e1; min-height: 40px; gap: 8px;">
                        <button id="route-btn-${routeIdx}" onclick="toggleRouteCollapse(${routeIdx})" style="margin-left: 15px; padding: 4px 12px; font-size: 0.75rem; border: 1px solid #cbd5e1; border-radius: 20px; background-color: #f0f3f5; color: #475569; cursor: pointer; transition: all 0.2s; font-weight: bold; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            <span id="route-btn-icon-${routeIdx}">▼</span> 移動詳細 (${connectedRoute.steps.length - 1}区間${costLabel})
                        </button>
                        <button onclick="startEdit(${routeIdx})" style="padding: 2px 8px; font-size: 0.7rem; border: 1px solid #cbd5e1; border-radius: 4px; background-color: white; color: #7f8c8d; cursor: pointer; transition: all 0.2s;">編集</button>
                        <button onclick="deleteDestination(${routeIdx})" style="padding: 2px 8px; font-size: 0.7rem; border: 1px solid #f2dede; border-radius: 4px; background-color: #fcf8e3; color: #a94442; cursor: pointer; transition: all 0.2s;">削除</button>
                    </div>
                    ${gapPanel}
                </div>
            `;
        }

        // スポットカードの描画
        let timeDisplay = "";
        let customClass = "plan-item spot-item";
        const isHotel = !!item.isHotel;

        if (item.startTime === "") {
            timeDisplay = isHotel 
                ? `<span style="background-color: #f39c12; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">🏨 宿泊</span>`
                : `<span style="background-color: #7f8c8d; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">🕒 フリー</span>`;
        } else {
            timeDisplay = isHotel ? `${item.startTime} <span style="color: #f39c12; font-size: 0.75rem; font-weight: bold;">(宿)</span>` : item.startTime;
        }

        if (item.startTime !== "" && item.endTime !== "") {
            timeDisplay += ` 〜 ${item.endTime}`;
        }

        const mainContentHtml = isHotel 
            ? `<span class="place-text" style="margin-left: 10px;">🏨 ${item.place}</span>`
            : `<span class="place-text" style="margin-left: 10px;">📍 ${item.place}</span>`;

        let memoHtml = "";
        if (item.memo && item.memo.trim() !== "") {
            if (item.memo.startsWith("http://") || item.memo.startsWith("https://")) {
                memoHtml = `<div class="plan-memo"><a href="${item.memo}" target="_blank" class="memo-link">🔗 リンクを開く</a></div>`;
            } else {
                memoHtml = `<div class="plan-memo">📝 ${item.memo}</div>`;
            }
        }

        outputDiv.innerHTML += `
            <div class="${customClass}">
                <div class="plan-content">
                    <div class="plan-main" style="align-items: flex-start;">
                        <span class="time-text" style="margin-top: 2px;">${timeDisplay}</span>
                        ${mainContentHtml}
                    </div>
                    ${memoHtml}
                </div>
                <div class="btn-group">
                    <button onclick="startEdit(${item.originalIndex})" class="edit-btn">編集</button>
                    <button onclick="deleteDestination(${item.originalIndex})" class="delete-btn">削除</button>
                </div>
            </div>
        `;
    });

    // --- 未定リスト (Pending) ---
    let pendingPlans = travelPlan
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter(item => item.date === "");

    if (pendingPlans.length > 0) {
        outputDiv.innerHTML += `
            <div class="date-header" style="margin-top: 40px; border-bottom: 2px solid #bdc3c7;">
                <span class="day-badge" style="background-color: #7f8c8d;">未定</span>
                <span class="date-text" style="color: #7f8c8d;">いつか行く候補リスト</span>
            </div>
        `;

        pendingPlans.forEach(item => {
            let infoLabel = item.startTime !== "" ? `⏰ ${item.startTime}` : `⏳ 日時未定`;
            let memoHtml = item.memo ? `<div class="plan-memo">📝 ${item.memo}</div>` : "";

            outputDiv.innerHTML += `
                <div class="plan-item spot-item" style="margin-bottom: 8px;">
                    <div class="plan-content">
                        <div class="plan-main">
                            <span class="time-text" style="color: #7f8c8d; margin-right: 15px;">${infoLabel}</span>
                            <span class="place-text">📍 ${item.place}</span>
                        </div>
                        ${memoHtml}
                    </div>
                    <div class="btn-group">
                        <button onclick="startEdit(${item.originalIndex})" class="edit-btn">編集</button>
                        <button onclick="deleteDestination(${item.originalIndex})" class="delete-btn">削除</button>
                    </div>
                </div>
            `;
        });
    }
}

function startEdit(index) {
    editIndex = index;
    const item = travelPlan[index];
    
    document.getElementById("newDate").value = item.date;
    document.getElementById("startTime").value = item.startTime;
    document.getElementById("endValueDate").value = item.endDate || "";
    document.getElementById("endTime").value = item.endTime;
    document.getElementById("newDestination").value = item.place;
    document.getElementById("newMemo").value = item.memo;
    
    if (item.endDate) {
        document.getElementById("endValueDate").style.display = "inline-block";
    } else {
        document.getElementById("endValueDate").style.display = "none";
    }

    isHotelModeActive = !!item.isHotel;
    const btn = document.getElementById("hotelToggleBtn");
    if (isHotelModeActive) {
        btn.style.opacity = "1";
        btn.style.borderColor = "#f39c12";
        btn.style.backgroundColor = "#fff9f0";
    } else {
        btn.style.opacity = "0.4";
        btn.style.borderColor = "#ccc";
        btn.style.backgroundColor = "transparent";
    }
    
    const saveBtn = document.getElementById("submitBtn"); 
    saveBtn.innerText = "保存";
    saveBtn.style.backgroundColor = "#e74c3c";
}

function deleteDestination(index) {
    if (confirm("本当にこの予定を削除しますか？")) {
        travelPlan.splice(index, 1);
        saveAndRefresh();
    }
}

function toggleEndDate() {
    const startDateInput = document.getElementById("newDate");
    const endDateInput = document.getElementById("endValueDate");
    
    if (endDateInput.style.display === "none") {
        if (startDateInput.value) {
            const startD = new Date(startDateInput.value);
            startD.setDate(startD.getDate() + 1);
            
            const yyyy = startD.getFullYear();
            const mm = String(startD.getMonth() + 1).padStart(2, '0');
            const dd = String(startD.getDate()).padStart(2, '0');
            endDateInput.value = `${yyyy}-${mm}-${dd}`;
        }
        endDateInput.style.display = "inline-block";
    } else {
        endDateInput.style.display = "none";
        endDateInput.value = "";
    }
}

function showHelp() {
    document.getElementById("helpModal").style.display = "flex";
}
function closeHelp() {
    document.getElementById("helpModal").style.display = "none";
}

// メモ欄のテキストから「\」または「￥」に続く数字を金額として抽出する関数
function extractCostFromMemo(memoText) {
    if (!memoText) return 0;
    
    // カンマ（,）を取り除く
    const cleanText = memoText.replace(/,/g, "");
    
    // 「\」または「￥」の直後に続く数字を検索
    const match = cleanText.match(/(?:\\|￥)(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0;
}

// 予算を計算して画面を書き換える関数
function calculateBudget() {
    let transportTotal = 0;
    let hotelTotal = 0;
    let otherTotal = 0;

    travelPlan.forEach(item => {
        if (item.isRouteOnly) {
            // 移動ルートの場合は、parseRouteTextを使って区間ごとの金額を合計
            const steps = parseRouteText(item.place);
            steps.forEach(step => {
                if (step.meta.cost) {
                    transportTotal += step.meta.cost;
                }
            });
        } else if (item.isHotel) {
            // ホテルモードの場合は、メモから宿泊費を抽出
            hotelTotal += extractCostFromMemo(item.memo);
        } else {
            // それ以外（通常スポット）の場合は、メモからその他費用を抽出
            otherTotal += extractCostFromMemo(item.memo);
        }
    });

    // 画面の表示を更新（カンマ区切り）
    document.getElementById("total-transport-cost").innerText = `￥${transportTotal.toLocaleString()}`;
    document.getElementById("total-hotel-cost").innerText = `￥${hotelTotal.toLocaleString()}`;
    document.getElementById("total-other-cost").innerText = `￥${otherTotal.toLocaleString()}`;
    
    const allTotal = transportTotal + hotelTotal + otherTotal;
    document.getElementById("total-all-cost").innerText = `￥${allTotal.toLocaleString()}`;
}

// ==========================================
// 💼 持ち物チェックリスト機能
// ==========================================

// サイドバーの開閉
function toggleTodoList() {
    const sidebar = document.getElementById('todo-sidebar');
    if (sidebar.style.right === '0px') {
        sidebar.style.right = '-350px';
    } else {
        sidebar.style.right = '0px';
        renderTodoList(); // 開いたときに最新の状態を描画
    }
}

// ローカルストレージから取得
function getTodoList() {
    const list = localStorage.getItem('staypler_todolist');
    return list ? JSON.parse(list) : [
        { id: 1, text: "着替え", checked: false },
        { id: 2, text: "充電器", checked: false },
        { id: 3, text: "洗面用具", checked: false }
    ]; // 初回のみデフォルトの3つを表示
}

// アイテムの追加
function addTodoItem() {
    const input = document.getElementById('new-todo-item');
    const text = input.value.trim();
    if (!text) return;

    const list = getTodoList();
    list.push({
        id: Date.now(),
        text: text,
        checked: false
    });

    localStorage.setItem('staypler_todolist', JSON.stringify(list));
    input.value = '';
    renderTodoList();
}

// チェック状態の切り替え
function toggleTodoCheck(id) {
    const list = getTodoList();
    const item = list.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        localStorage.setItem('staypler_todolist', JSON.stringify(list));
        renderTodoList();
    }
}

// アイテムの削除
function deleteTodoItem(id) {
    let list = getTodoList();
    list = list.filter(i => i.id !== id);
    localStorage.setItem('staypler_todolist', JSON.stringify(list));
    renderTodoList();
}

// 画面への描画
function renderTodoList() {
    const container = document.getElementById('todo-list-container');
    if (!container) return;

    const list = getTodoList();
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<div style="color: #94a3b8; font-size: 0.85rem; text-align: center; margin-top: 20px;">リストは空っぽです</div>`;
        return;
    }

    list.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; gap: 10px; transition: all 0.2s;";
        
        // チェックされたら背景を少し薄くする
        if (item.checked) {
            itemEl.style.background = "#f1f5f9";
            itemEl.style.opacity = "0.7";
        }

        itemEl.innerHTML = `
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1; font-size: 0.9rem; color: ${item.checked ? '#94a3b8' : '#334155'}; text-decoration: ${item.checked ? 'line-through' : 'none'}; user-select: none;">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleTodoCheck(${item.id})" style="width: 16px; height: 16px; cursor: pointer;">
                <span>${item.text}</span>
            </label>
            <button onclick="deleteTodoItem(${item.id})" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; padding: 2px 5px; border-radius: 4px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">🗑️</button>
        `;
        container.appendChild(itemEl);
    });
}

// アプリ起動時に初期描画だけ仕込んでおく
document.addEventListener('DOMContentLoaded', () => {
    // 既存のロード処理などがあればそこに追加しても良いですが、
    // ここで単独で呼んでも安全です
    renderTodoList();
});