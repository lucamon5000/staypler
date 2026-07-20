let travelPlan = [];
let editIndex = -1;
let isHotelModeActive = false;
let isMealModeActive = false;

// ローカルストレージからの読み込み
if (localStorage.getItem("travelPlan")) {
    travelPlan = JSON.parse(localStorage.getItem("travelPlan"));
}

// 読み込み時の初期化
window.onload = function() {
    displayPlan();
    calculateBudget();
};

function saveAndRefresh() {
    localStorage.setItem("travelPlan", JSON.stringify(travelPlan));
    displayPlan();
    calculateBudget(); // 🌟 ここを追加
}

function toggleHotelMode() {
    isHotelModeActive = !isHotelModeActive;
    if (isHotelModeActive) isMealModeActive = false;

    const mealBtn = document.getElementById("mealToggleBtn");
    const hotelBtn = document.getElementById("hotelToggleBtn");

    // ホテルボタンの切り替え
    hotelBtn.style.border = isHotelModeActive ? "1px solid #f39c12" : "1px solid #ccc";
    hotelBtn.style.boxShadow = isHotelModeActive ? "0 0 0 1px #f39c12" : "none";
    hotelBtn.style.backgroundColor = isHotelModeActive ? "#fff9f0" : "transparent";
    hotelBtn.style.opacity = isHotelModeActive ? "1" : "0.4";

    // 食事ボタンを非選択状態へ
    mealBtn.style.border = "1px solid #ccc";
    mealBtn.style.boxShadow = "none";
    mealBtn.style.backgroundColor = "transparent";
    mealBtn.style.opacity = "0.4";
}

function toggleMealMode() {
    isMealModeActive = !isMealModeActive;
    if (isMealModeActive) isHotelModeActive = false;

    const mealBtn = document.getElementById("mealToggleBtn");
    const hotelBtn = document.getElementById("hotelToggleBtn");

    // 食事ボタンの切り替え
    mealBtn.style.border = isMealModeActive ? "1px solid #e67e22" : "1px solid #ccc";
    mealBtn.style.boxShadow = isMealModeActive ? "0 0 0 1px #e67e22" : "none";
    mealBtn.style.backgroundColor = isMealModeActive ? "#fff7ed" : "transparent";
    mealBtn.style.opacity = isMealModeActive ? "1" : "0.4";

    // ホテルボタンを非選択状態へ
    hotelBtn.style.border = "1px solid #ccc";
    hotelBtn.style.boxShadow = "none";
    hotelBtn.style.backgroundColor = "transparent";
    hotelBtn.style.opacity = "0.4";
}

function resetButtons() {
    const mealBtn = document.getElementById("mealToggleBtn");
    const hotelBtn = document.getElementById("hotelToggleBtn");
    
    // 強制的にデフォルトの見た目に戻す
    mealBtn.style.border = "1px solid #ccc";
    mealBtn.style.backgroundColor = "transparent";
    mealBtn.style.opacity = "0.4";
    
    hotelBtn.style.border = "1px solid #ccc";
    hotelBtn.style.backgroundColor = "transparent";
    hotelBtn.style.opacity = "0.4";
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
    const inputElement = document.getElementById("newDestination"); // 左の入力欄
    const memoElement = document.getElementById("newMemo");         // 右の入力欄

    const inputDate = dateElement.value;
    const startTime = startElement.value;
    const endDate = endValueDateElement.value; 
    const endTime = endElement.value;
    const placeValue = inputElement.value; 
    const newMemo = memoElement.value;
    const isMealMode = isMealModeActive;

    // 【追加】メモ欄から金額を抽出 (\数字 の形式)
    let cost = 0;
    const match = newMemo.match(/\\(\d+)/);
    if (match) {
        cost = parseInt(match[1], 10);
    }

    // 行き先または店名が入っているかチェック
    if (placeValue !== "") {
        if (editIndex === -1) {
            // 新規登録
            if (placeValue.includes("~")) {
                const steps = parseRouteText(placeValue);
                const sTime = steps.length > 1 ? (steps[0].meta.startTime || "") : "";
                const eTime = steps.length > 1 ? (steps[steps.length - 1].meta.endTime || "") : "";
                travelPlan.push({
                    id: generateId(), date: inputDate, startTime: sTime || startTime, endDate: endDate,
                    endTime: endTime || eTime, place: placeValue, memo: newMemo, cost: cost,
                    isHotel: false, isMeal: false, isRouteOnly: true
                });
            } else {
                const itemData = { 
                    id: generateId(), date: inputDate, startTime: startTime, endDate: endDate, 
                    endTime: endTime, place: placeValue, memo: newMemo, cost: cost,
                    isHotel: isHotelModeActive, isMeal: isMealMode, isRouteOnly: false
                };
                travelPlan.push(itemData);
            }
        } else {
            // 編集保存
            travelPlan[editIndex].date = inputDate;
            travelPlan[editIndex].startTime = startTime;
            travelPlan[editIndex].endDate = endDate;
            travelPlan[editIndex].endTime = endTime;
            travelPlan[editIndex].place = placeValue; 
            travelPlan[editIndex].memo = newMemo;
            travelPlan[editIndex].cost = cost; // 金額も更新
            travelPlan[editIndex].isHotel = isHotelModeActive;
            travelPlan[editIndex].isMeal = isMealMode;
            
            if (placeValue.includes("~")) {
                const steps = parseRouteText(placeValue);
                travelPlan[editIndex].startTime = steps.length > 1 ? (steps[0].meta.startTime || "") : startTime;
                travelPlan[editIndex].endTime = steps.length > 1 ? (steps[steps.length - 1].meta.endTime || "") : endTime;
                travelPlan[editIndex].isRouteOnly = true;
            } else {
                travelPlan[editIndex].isRouteOnly = false;
            }
            editIndex = -1;
            document.getElementById("submitBtn").innerText = "追加";
        }

        syncRouteTimes(inputDate);
        sortTravelPlan();
        
        // 外部関数で集計を更新（updateTotalsを作成して呼んでください）
        if (typeof updateTotals === 'function') updateTotals();

        // フォームリセット
        startElement.value = ""; 
        inputElement.value = ""; 
        memoElement.value = "";
        
        if (isHotelModeActive) toggleHotelMode();
        if (isMealMode) toggleMealMode(); 
        
        saveAndRefresh();
    } else {
        alert("「目的地」または「食事の店名」を入力してください！");
    }
}

// --- 予算集計ロジック ---
function updateTotals() {
    let traffic = 0, meal = 0, hotel = 0, other = 0;

    travelPlan.forEach(item => {
        const cost = item.cost || 0;
        // モードまたはルート情報に基づいて振り分け
        if (item.isMeal) {
            meal += cost;
        } else if (item.isHotel) {
            hotel += cost;
        } else if (item.isRouteOnly) {
            traffic += cost;
        } else {
            other += cost;
        }
    });

    // HTMLの各IDへ数値を反映
    const setCost = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = `￥${val.toLocaleString()}`;
    };

    setCost("total-transport-cost", traffic);
    setCost("total-meal-cost", meal);
    setCost("total-hotel-cost", hotel);
    setCost("total-other-cost", other);
    setCost("totalCost", traffic + meal + hotel + other);
}

// --- 目的地追加/保存処理 ---
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
    const placeValue = inputElement.value; 
    const newMemo = memoElement.value;
    const isMealMode = isMealModeActive;

    // メモ欄から \数字 の形式で金額を抽出
    let cost = 0;
    const match = newMemo.match(/\\(\d+)/);
    if (match) {
        cost = parseInt(match[1], 10);
    }

    if (placeValue !== "") {
        if (editIndex === -1) {
            // 新規登録
            const itemData = { 
                id: generateId(), date: inputDate, startTime: startTime, endDate: endDate, 
                endTime: endTime, place: placeValue, memo: newMemo, cost: cost,
                isHotel: isHotelModeActive, isMeal: isMealMode, isRouteOnly: placeValue.includes("~")
            };
            travelPlan.push(itemData);
        } else {
            // 編集保存
            travelPlan[editIndex].date = inputDate;
            travelPlan[editIndex].startTime = startTime;
            travelPlan[editIndex].endDate = endDate;
            travelPlan[editIndex].endTime = endTime;
            travelPlan[editIndex].place = placeValue; 
            travelPlan[editIndex].memo = newMemo;
            travelPlan[editIndex].cost = cost;
            travelPlan[editIndex].isHotel = isHotelModeActive;
            travelPlan[editIndex].isMeal = isMealMode;
            travelPlan[editIndex].isRouteOnly = placeValue.includes("~");
            
            editIndex = -1;
            document.getElementById("submitBtn").innerText = "追加";
        }

        syncRouteTimes(inputDate);
        sortTravelPlan();
        updateTotals(); // ここで集計を更新
        saveAndRefresh();

        // フォームリセット
        startElement.value = ""; inputElement.value = ""; memoElement.value = "";
        if (isHotelModeActive) toggleHotelMode();
        if (isMealMode) toggleMealMode(); 
    } else {
        alert("「目的地」または「食事の店名」を入力してください！");
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
    
    travelPlan.forEach((item, idx) => {
        let cardClass = "plan-item";
        let icon = "📍";
        
        if (item.isHotel) {
            cardClass += " hotel-checkin-item";
            icon = "🏨";
        } else if (item.isMeal) {
            cardClass += " meal-item";
            icon = "🍽️";
        } else {
            cardClass += " spot-item";
            icon = "📍";
        }

        // 金額表示の準備（costが0より大きい場合のみ表示）
        const costText = (item.cost && item.cost > 0) ? ` (￥${item.cost.toLocaleString()})` : "";

        outputDiv.innerHTML += `
            <div class="${cardClass}">
                <div class="plan-content">
                    <div class="plan-main">
                        <span class="time-text">${item.startTime || "未定"}</span>
                        <span class="place-text" style="margin-left: 10px;">${icon} ${item.place}${costText}</span>
                    </div>
                    ${item.memo ? `<div class="memo-text" style="margin-left: 55px; font-size: 0.85rem; color: #666;">${item.memo}</div>` : ""}
                </div>
                <div class="btn-group">
                    <button onclick="startEdit(${idx})" class="edit-btn">編集</button>
                    <button onclick="deleteDestination(${idx})" class="delete-btn">削除</button>
                </div>
            </div>
        `;
    });
}

function startEdit(idx) {
    const item = travelPlan[idx];
    editIndex = idx;

    // モードを合わせる
    if (item.isMeal !== isMealModeActive) toggleMealMode();
    if (item.isHotel !== isHotelModeActive) toggleHotelMode();

    // フォームに値を戻す
    document.getElementById("newDate").value = item.date || "";
    document.getElementById("startTime").value = item.startTime || "";
    document.getElementById("endTime").value = item.endTime || "";
    document.getElementById("endValueDate").value = item.endDate || "";
    document.getElementById("newDestination").value = item.place || ""; // ここで左の欄に戻す
    document.getElementById("newMemo").value = item.memo || "";

    document.getElementById("submitBtn").innerText = "保存";
}

function deleteDestination(index) {
    if (confirm("本当にこの予定を削除しますか？")) {
        const itemToDelete = travelPlan[index];

        // 削除する前に、もし消すのが「地点」なら、それに関連する移動を探して消す
        if (!itemToDelete.isRouteOnly) {
            // この地点の名前を持つルートを検索して削除する
            // 複数のルートが関わっている可能性もあるので filter で判定
            travelPlan = travelPlan.filter(item => {
                // 移動ルートで、かつ削除する地点が名前に含まれているものは消す
                if (item.isRouteOnly) {
                    const steps = parseRouteText(item.place);
                    const isRelated = steps.some(step => step.place === itemToDelete.place);
                    return !isRelated; // 関連していれば除外（削除）
                }
                return true; // 移動ルート以外は残す
            });
        }

        // 最後に指定したインデックスのアイテムを削除（インデックスがずれる可能性があるため再取得）
        const newIndex = travelPlan.indexOf(itemToDelete);
        if (newIndex !== -1) {
            travelPlan.splice(newIndex, 1);
        }

        // 予算再計算と保存
        calculateBudget();
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
    let t = 0, h = 0, m = 0, o = 0;
    travelPlan.forEach(item => {
        const match = item.memo ? item.memo.match(/[￥\\](\d+)/) : null;
        const val = match ? parseInt(match[1]) : 0;
        
        if (item.isHotel) h += val;
        else if (item.isMeal) m += val;
        else if (item.place.includes("→")) t += val;
        else o += val;
    });

    document.getElementById("total-transport-cost").innerText = "￥" + t.toLocaleString();
    document.getElementById("total-meal-cost").innerText = "￥" + m.toLocaleString();
    document.getElementById("total-hotel-cost").innerText = "￥" + h.toLocaleString();
    document.getElementById("total-other-cost").innerText = "￥" + o.toLocaleString();
    document.getElementById("totalCost").innerText = "￥" + (t + h + m + o).toLocaleString();
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
// --- 共通の取得用関数 ---
function getTodoList() {
    return JSON.parse(localStorage.getItem('staypler_todolist') || '[]');
}

// --- アイテム追加 ---
function addTodoItem() {
    const input = document.getElementById('new-todo-item');
    const categoryInput = document.getElementById('new-todo-category');
    const text = input.value.trim();
    const category = categoryInput.value.trim() || "その他";

    if (!text) return;

    const list = getTodoList();
    list.push({ id: Date.now(), text, checked: false, category });
    localStorage.setItem('staypler_todolist', JSON.stringify(list));
    
    input.value = '';
    categoryInput.value = ''; 
    renderTodoList();
}

// --- チェック切り替え ---
function toggleTodoCheck(id) {
    const list = getTodoList();
    const item = list.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        localStorage.setItem('staypler_todolist', JSON.stringify(list));
        renderTodoList();
    }
}

// --- アイテム削除 ---
function deleteTodoItem(id) {
    const list = getTodoList().filter(i => i.id !== id);
    localStorage.setItem('staypler_todolist', JSON.stringify(list));
    renderTodoList();
}

// --- 描画関数（カテゴリ分け版・ダブりなし） ---
function renderTodoList() {
    const container = document.getElementById('todo-list-container');
    if (!container) return;

    const list = getTodoList();
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #94a3b8; margin-top: 20px;">リストは空っぽです</div>`;
        return;
    }

    const categories = [...new Set(list.map(item => item.category || "その他"))];
    
    categories.forEach(cat => {
        const items = list.filter(item => (item.category || "その他") === cat);
        
        container.innerHTML += `<div style="font-weight: bold; color: #475569; margin-top: 15px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">${cat}</div>`;
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 8px; background: white; border-bottom: 1px solid #f1f5f9;";
            itemEl.innerHTML = `
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleTodoCheck(${item.id})">
                    <span style="${item.checked ? 'text-decoration: line-through; color: #94a3b8;' : ''}">${item.text}</span>
                </label>
                <button onclick="deleteTodoItem(${item.id})" style="background: none; border: none; cursor: pointer;">🗑️</button>
            `;
            container.appendChild(itemEl);
        });
    });
}

// アプリ起動時に初期描画だけ仕込んでおく
document.addEventListener('DOMContentLoaded', () => {
    // 既存のロード処理などがあればそこに追加しても良いですが、
    // ここで単独で呼んでも安全です
    renderTodoList();
});