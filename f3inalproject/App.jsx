const { useState, useEffect, useMemo, useCallback } = React;

// ---------------------------------------------------------------------------
// 內建展示行程 (為預防簡報展示時無 Gemini API 金鑰或網路中斷提供防護)
// ---------------------------------------------------------------------------
const defaultBaliItinerary = {
    destination: "Bali",
    start_date: "2026-07-01",
    end_date: "2026-07-03",
    flight_logistics: {
        carrier: "Singapore Airlines (SQ938) - Luxury Business Class",
        estimated_cost: "17,500,000 IDR (~1000 USD)",
        booking_search_query: "Flights+from+Taipei+to+Bali"
    },
    hotel_logistics: {
        name: "Mandapa, a Ritz-Carlton Reserve",
        description: "Enclosed in Ubud's lush jungle along the Ayung River, offering butler service and private pool villas.",
        latitude: -8.4907,
        longitude: 115.2452,
        booking_search_query: "Mandapa+A+Ritz+Carlton+Reserve+Bali"
    },
    days: [
        {
            day: 1,
            places: [
                {
                    title: "Sacred Monkey Forest Sanctuary | 聖猴森林保護區",
                    description: "Wander through deep jungle trails populated by playful Balinese long-tailed monkeys. | 漫步於熱帶雨林深處，與野生巴里長尾猴近距離互動。",
                    latitude: -8.5190,
                    longitude: 115.2606,
                    maps_search_query: "Sacred+Monkey+Forest+Sanctuary+Bali",
                    image_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"
                },
                {
                    title: "Tegallalang Rice Terraces | 德哥拉朗梯田",
                    description: "Marvel at the ancient Subak cooperative irrigation slopes and swing over green valleys. | 欣賞世界文化遺產的灌溉系統，挑戰綠色山谷的高空鞦韆。",
                    latitude: -8.4286,
                    longitude: 115.2789,
                    maps_search_query: "Tegallalang+Rice+Terraces+Bali",
                    image_url: "https://images.unsplash.com/photo-1501179691627-eeaa65ea017c?auto=format&fit=crop&w=600&q=80"
                }
            ]
        },
        {
            day: 2,
            places: [
                {
                    title: "Kintamani Volcano Viewpoint | 金塔馬尼火山觀景台",
                    description: "Gaze at the massive active volcano caldera with panoramic crater lake vistas. | 俯瞰壯麗的巴杜爾活火山全景與火山口湖，享受悠閒的高原早晨。",
                    latitude: -8.2770,
                    longitude: 115.3400,
                    maps_search_query: "Kintamani+Volcano+Viewpoint+Bali",
                    image_url: "https://images.unsplash.com/photo-1517086822157-2b0358e7684a?auto=format&fit=crop&w=600&q=80"
                },
                {
                    title: "Tirta Empul Holy Water Temple | 聖泉寺",
                    description: "Participate in ancient purification rituals in crystalline natural spring pools. | 深入千年古寺，洗滌身心並體驗聖泉的傳統淨化儀式。",
                    latitude: -8.4156,
                    longitude: 115.2861,
                    maps_search_query: "Tirta+Empul+Temple+Bali",
                    image_url: "https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&w=600&q=80"
                }
            ]
        },
        {
            day: 3,
            places: [
                {
                    title: "Uluwatu Temple | 烏魯瓦圖斷崖神廟",
                    description: "Spectacular sea temple perched on a 70-meter-tall sheer cliff facing the Indian Ocean. | 聳立於印度洋 70 公尺絕壁之上的海神廟，觀賞日落與傳統火舞。",
                    latitude: -8.8291,
                    longitude: 115.0860,
                    maps_search_query: "Uluwatu+Temple+Bali",
                    image_url: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=600&q=80"
                },
                {
                    title: "Melasti Beach Seminyak | 美拉斯蒂石灰岩沙灘",
                    description: "Relax on pure white sand beaches surrounded by magnificent limestone walls. | 隱秘在巨大石灰岩壁之中的白沙灘，享受頂級海島的慵懶氛圍。",
                    latitude: -8.8476,
                    longitude: 115.1595,
                    maps_search_query: "Melasti+Beach+Bali",
                    image_url: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=600&q=80"
                }
            ]
        }
    ]
};

// ---------------------------------------------------------------------------
// 多語系字典定義
// ---------------------------------------------------------------------------
const dictionary = {
    en: {
        appName: "LOKA",
        appSubtitle: "Helping you uncover the beauty of the world.",
        login: "Sign In",
        register: "Register",
        usernameLabel: "Username",
        passwordLabel: "Password",
        usernamePlaceholder: "Enter your username",
        passwordPlaceholder: "Enter your password",
        dontHaveAccount: "Don't have an account?",
        alreadyHaveAccount: "Already have an account?",
        logout: "Sign Out",
        upgradeToPremium: "Upgrade to Premium",
        premiumBadge: "PREMIUM ACCESS",
        generateBtn: "Design Bespoke Escape",
        loadDemoBtn: "Load Demo",
        promptPlaceholder: "Describe your Bali escape... (e.g. 3 days luxury adventure in Ubud and Seminyak cliffside)",
        generating: "AI is crafting your exclusive itinerary...",
        checklistTitle: "Bespoke Travel Timeline & Checklist",
        noItinerary: "Your tailored travel timeline will appear here once generated. Set your destination above to get started.",
        errorAuth: "Authentication failed. Please check your credentials.",
        errorGen: "AI generation failed. Please try again or load the local Demo.",
        welcome: "Welcome back,",
        day: "Day",
        cost: "Estimated Cost: ",
        upgradeSuccess: "Upgrade successful! Premium features unlocked.",
        exportPdfBtn: "Export Travel PDF",
        copyNotionBtn: "Copy for Notion",
        saveTripBtn: "Save to Cloud",
        paymentTitle: "LOKA Premium Export Suite",
        paymentDesc: "Upgrade to unlock high-fidelity Travel PDFs and copy-pasteable Markdown blocks optimized for Notion.",
        cardNumberLabel: "Mock Card Number (16 digits)",
        expiryLabel: "Expiry Date (MM/YY)",
        cvvLabel: "CVV",
        simulatePayBtn: "Authorize Simulation Payment",
        processingPay: "Simulating secure gateway...",
        destLabel: "1. Where to go?",
        peopleLabel: "2. How many people?",
        durationLabel: "3. Travel Dates",
        startDateLabel: "Start Date",
        endDateLabel: "End Date",
        daysUnit: "days",
        peopleUnit: "travelers",
        notionCopied: "Notion block copied to clipboard!",
        pdfDownloaded: "Bespoke itinerary downloaded successfully!",
        savedTripsBtn: "My Saved Trips",
        savedTripsTitle: "My Saved Itineraries",
        noSavedTrips: "No saved itineraries yet. Plan and save your first bespoke escape!",
        loadTrip: "Load",
        deleteTrip: "Delete",
        close: "Close"
    },
    'zh-tw': {
        appName: "LOKA",
        appSubtitle: "幫助您探索世界之美",
        login: "會員登入",
        register: "註冊帳號",
        usernameLabel: "使用者名稱",
        passwordLabel: "密碼",
        usernamePlaceholder: "請輸入使用者名稱",
        passwordPlaceholder: "請輸入密碼",
        dontHaveAccount: "還沒有帳號？立即註冊",
        alreadyHaveAccount: "已有帳號？返回登入",
        logout: "安全登出",
        upgradeToPremium: "解鎖 Premium 權限",
        premiumBadge: "PREMIUM 尊榮會員",
        generateBtn: "生成客製化行程",
        loadDemoBtn: "載入展示行程",
        promptPlaceholder: "描述您的巴里島假期需求...（例如：3天烏布與南灣斷崖的奢華蜜月之旅）",
        generating: "LOKA AI 正在為您設計專屬行程...",
        checklistTitle: "奢華旅行時間軸與打卡清單",
        noItinerary: "在上方設定您的出遊偏好，LOKA 將為您客製化專屬的旅行時間軸與打卡清單。",
        errorAuth: "身分驗證失敗，請檢查輸入的帳號或密碼。",
        errorGen: "AI 生成失敗。請重新嘗試，或點擊下方按鈕載入內建展示行程。",
        welcome: "尊貴的會員，",
        day: "第",
        cost: "預估花費：",
        upgradeSuccess: "升級成功！地圖真實道路功能已解鎖。",
        exportPdfBtn: "匯出高質感 PDF 行程",
        copyNotionBtn: "複製 Notion 筆記區塊",
        saveTripBtn: "儲存至雲端",
        paymentTitle: "LOKA Premium 匯出工具套件",
        paymentDesc: "解鎖可列印之 Travel PDF 下載，以及專為 Notion 筆記本優化的格式化 Markdown 區塊。",
        cardNumberLabel: "模擬信用卡卡號 (16位數)",
        expiryLabel: "有效期限 (MM/YY)",
        cvvLabel: "安全碼 (CVV)",
        simulatePayBtn: "授權模擬支付",
        processingPay: "正在連接模擬金流網關...",
        destLabel: "1. 目的地 / 景點？",
        peopleLabel: "2. 旅行人數？",
        durationLabel: "3. 旅行日期",
        startDateLabel: "開始日期",
        endDateLabel: "結束日期",
        daysUnit: "天",
        peopleUnit: "人",
        notionCopied: "Notion 格式化區塊已複製到剪貼簿！",
        pdfDownloaded: "專屬奢華行程 HTML 下載成功！",
        savedTripsBtn: "我的行程",
        savedTripsTitle: "我的已儲存行程",
        noSavedTrips: "尚無已儲存的行程。立即規劃並儲存您的第一個專屬旅程！",
        loadTrip: "載入",
        deleteTrip: "刪除",
        close: "關閉"
    }
};

// ---------------------------------------------------------------------------
// 優雅圖片後備元件 (Graceful Image Fallback Component)
// ---------------------------------------------------------------------------
const GracefulImage = ({ src, alt, title }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
        return (
            <div className="w-full h-40 rounded-t-xl bg-gradient-to-br from-slate-800 to-emerald-800 flex flex-col items-center justify-center p-4 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                {/* 地球 Vector Icon (SVG) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-300/85 mb-2.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h.01M1.112 18C1.583 14.07 4.908 11 9 11c4.092 0 7.417 3.07 7.888 7m-1.782-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                
                <span className="text-[11px] font-extrabold tracking-wide uppercase px-2 line-clamp-2 drop-shadow-md z-10">
                    {title || alt}
                </span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-40 object-cover rounded-t-xl transition-all duration-300"
        />
    );
};

// ---------------------------------------------------------------------------
// PlaceCard — Individual activity/attraction card inside a day
// ---------------------------------------------------------------------------
const PlaceCard = ({ place, dayNum, idx, isChecked, onToggleCheck, onFocus, onRemove, removeTitle }) => (
    <div
        onClick={() => onFocus([place.latitude, place.longitude])}
        className={`relative rounded-xl border cursor-pointer select-none transition-all duration-200 overflow-hidden ${
            isChecked
                ? 'bg-gray-50/90 border-gray-200 opacity-60 text-slate-400'
                : 'bg-white hover:shadow-xl border-gray-100 shadow-md text-slate-800'
        }`}
    >
        {/* Remove button */}
        <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 hover:bg-red-600 flex items-center justify-center text-white transition-all duration-200"
            title={removeTitle}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>

        <GracefulImage src={place.image_url} alt={place.title} title={place.title} />

        <div className="p-4">
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="mt-0.5" onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-[#0A3B2E] border-[#0A3B2E]' : 'border-gray-300 bg-white'
                    }`}>
                        {isChecked && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="flex-grow">
                    <h6 className={`text-sm font-extrabold text-slate-900 transition-all ${isChecked ? 'line-through text-slate-400' : ''}`}>
                        {place.title}
                    </h6>
                    <p className={`text-xs text-slate-500 leading-relaxed mt-1.5 transition-all ${isChecked ? 'line-through text-slate-300' : ''}`}>
                        {place.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold">D{dayNum}-{idx + 1}</span>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${place.maps_search_query}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 py-1.5 px-3 bg-[#0A3B2E] hover:bg-[#114D3E] text-white rounded-lg text-[10px] font-bold transition-all duration-200 hover:shadow-md active:scale-95"
                        >
                            📍 View in Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// DayCard — One day's container with its PlaceCards + suggest button
// ---------------------------------------------------------------------------
const DayCard = ({ day, dayIndex, checkedActivities, onToggleCheck, onFocus, onRemove, onSuggest, regeneratingDay, lang, t }) => (
    <div className="relative space-y-4 bg-[#114D3E]/10 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col col-span-full">
        {/* Day header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A3B2E]"></span>
            </span>
            <h5 className="text-sm font-black bg-white/10 px-2.5 py-1 rounded text-white tracking-wider">
                {t.day} {day.day}
            </h5>
        </div>

        {/* Place cards grid */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {day.places?.map((place, idx) => {
                const checkedKey = `${day.day}-${idx}`;
                return (
                    <PlaceCard
                        key={idx}
                        place={place}
                        dayNum={day.day}
                        idx={idx}
                        isChecked={!!checkedActivities[checkedKey]}
                        onToggleCheck={() => onToggleCheck(day.day, idx)}
                        onFocus={onFocus}
                        onRemove={() => onRemove(dayIndex, idx)}
                        removeTitle={lang === 'zh-tw' ? '移除此景點' : 'Remove this place'}
                    />
                );
            })}
        </div>

        {/* Suggest new place button */}
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSuggest(day.day, dayIndex); }}
            disabled={regeneratingDay !== null}
            className="mt-2 w-full py-2 border border-dashed border-white/20 hover:border-white/40 text-white/50 hover:text-white/80 text-[11px] font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
        >
            {regeneratingDay === dayIndex ? (
                <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{lang === 'zh-tw' ? 'AI 正在尋找新景點...' : 'AI is finding a new place...'}</span>
                </>
            ) : (
                <>
                    <span>✦</span>
                    <span>{lang === 'zh-tw' ? '建議新景點' : 'Suggest a New Place'}</span>
                </>
            )}
        </button>
    </div>
);

// ---------------------------------------------------------------------------
// LogisticsSection — Flight + Hotel recommendation cards
// ---------------------------------------------------------------------------
const LogisticsSection = ({ itinerary }) => (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        {/* Flight Card */}
        <div className="bg-white shadow-xl border border-gray-100 rounded-2xl p-6 text-slate-800 flex flex-col justify-between transition-all duration-200 hover:shadow-md">
            <div>
                <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xl">✈️</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Flight Recommendation</span>
                </div>
                <h5 className="text-sm font-black text-slate-900 mb-1.5 leading-snug">{itinerary.flight_logistics?.carrier || "Luxury Airline"}</h5>
                <p className="text-xs text-slate-600 font-medium mb-4">Est. Cost: {itinerary.flight_logistics?.estimated_cost}</p>
            </div>
            <a
                href={itinerary.flight_logistics?.booking_url || `https://www.traveloka.com/en-id/flight?q=${itinerary.flight_logistics?.booking_search_query || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#0A3B2E] hover:bg-[#114D3E] text-white text-xs font-bold rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-1 hover:shadow-md"
            >
                ✈️ Search on Traveloka
            </a>
        </div>

        {/* Hotel Card */}
        <div className="bg-white shadow-xl border border-gray-100 rounded-2xl p-6 text-slate-800 flex flex-col justify-between transition-all duration-200 hover:shadow-md">
            <div>
                <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xl">🏨</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Hotel Recommendation</span>
                </div>
                <h5 className="text-sm font-black text-slate-900 mb-1.5 leading-snug">{itinerary.hotel_logistics?.name || "Luxury Resort"}</h5>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">{itinerary.hotel_logistics?.description}</p>
            </div>
            <div className="flex flex-col gap-2">
                <a
                    href={
                        itinerary.hotel_logistics?.latitude && itinerary.hotel_logistics?.longitude
                            ? `https://www.google.com/maps/search/?api=1&query=${itinerary.hotel_logistics.latitude},${itinerary.hotel_logistics.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(itinerary.hotel_logistics?.name || 'hotel')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 border border-[#0A3B2E] text-[#0A3B2E] hover:bg-gray-50 text-xs font-bold rounded-lg transition-all duration-200 text-center block"
                >
                    📍 Show on Google Maps
                </a>
                <a
                    href={itinerary.hotel_logistics?.booking_url || `https://www.traveloka.com/en-id/hotel/search?q=${itinerary.hotel_logistics?.booking_search_query || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#0A3B2E] hover:bg-[#114D3E] text-white text-xs font-bold rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-1 hover:shadow-md"
                >
                    🏨 Search on Traveloka
                </a>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// PaywallModal — Premium upgrade / mock payment modal
// ---------------------------------------------------------------------------
const PaywallModal = ({ onClose, onSubmit, cardData, setCardData, paymentLoading, t }) => (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
        <div className="w-full max-w-md bg-[#0A3B2E]/60 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 relative transform scale-100 transition-all duration-300">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all text-xs"
            >✕</button>

            <div className="w-14 h-14 mx-auto mb-5 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>

            <h3 className="text-xl font-black text-white text-center mb-2 tracking-wide uppercase">{t.paymentTitle}</h3>
            <p className="text-white/60 text-xs text-center mb-6 leading-relaxed">{t.paymentDesc}</p>

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-white/70 mb-1.5">{t.cardNumberLabel}</label>
                    <input
                        type="text"
                        required
                        maxLength="19"
                        placeholder="4111 2222 3333 4444"
                        value={cardData.card_number}
                        onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                            setCardData(prev => ({ ...prev, card_number: formatted }));
                        }}
                        className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder-white/20"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-white/70 mb-1.5">{t.expiryLabel}</label>
                        <input
                            type="text"
                            required
                            maxLength="5"
                            placeholder="12/28"
                            value={cardData.expiry}
                            onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                setCardData(prev => ({ ...prev, expiry: val }));
                            }}
                            className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder-white/20 text-center"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-white/70 mb-1.5">{t.cvvLabel}</label>
                        <input
                            type="password"
                            required
                            maxLength="3"
                            placeholder="***"
                            value={cardData.cvv}
                            onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                            className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder-white/20 text-center"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full py-3 bg-white text-[#0A3B2E] font-bold rounded-xl shadow-lg hover:bg-[#E2F1ED] active:scale-95 transition-all duration-200 mt-2 text-xs flex items-center justify-center gap-2"
                >
                    {paymentLoading ? (
                        <>
                            <svg className="animate-spin h-3.5 w-3.5 text-[#0A3B2E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t.processingPay}</span>
                        </>
                    ) : t.simulatePayBtn}
                </button>
            </form>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// SavedTripsModal — Browse, load, and delete saved itineraries
// ---------------------------------------------------------------------------
const SavedTripsModal = ({ onClose, loading, trips, onLoad, onDelete, t }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
        <div className="w-full max-w-2xl bg-[#0A3B2E]/75 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 relative flex flex-col max-h-[85vh] transform scale-100 transition-all duration-300">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all text-xs"
            >✕</button>

            <h3 className="text-xl font-black text-white mb-6 tracking-wide uppercase flex items-center gap-2">
                <span>🔖</span> {t.savedTripsTitle}
            </h3>

            {loading ? (
                <div className="flex-grow flex items-center justify-center py-20 text-white/50 text-xs">
                    <span className="animate-pulse">Loading saved itineraries...</span>
                </div>
            ) : trips.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-20 text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <p className="text-white/40 text-xs leading-relaxed max-w-sm">{t.noSavedTrips}</p>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto pr-1 space-y-4 max-h-[55vh]">
                    {trips.map((trip) => (
                        <div
                            key={trip.id}
                            className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:bg-white/10"
                        >
                            <div className="flex-grow min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{trip.trip_title}</h4>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/50 font-medium">
                                    <span>📅 {trip.itinerary_data?.start_date || "N/A"} ~ {trip.itinerary_data?.end_date || "N/A"}</span>
                                    <span>•</span>
                                    <span>{new Date(trip.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    onClick={() => onLoad(trip.itinerary_data)}
                                    className="py-1.5 px-4 bg-white text-[#0A3B2E] font-bold text-xs rounded-xl shadow hover:bg-[#E2F1ED] active:scale-95 transition-all"
                                >
                                    {t.loadTrip}
                                </button>
                                <button
                                    onClick={() => onDelete(trip.id)}
                                    className="py-1.5 px-3 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500/50 text-red-200 font-bold text-xs rounded-xl transition-all active:scale-95"
                                >
                                    {t.deleteTrip}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                    onClick={onClose}
                    className="py-2 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-all"
                >
                    {t.close}
                </button>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// App — Main application component
// ---------------------------------------------------------------------------
const App = () => {
    // 系統狀態
    const [lang, setLang] = useState('zh-tw'); // 預設使用繁體中文
    const [token, setToken] = useState(localStorage.getItem('loka_token') || '');
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState('login'); // login | register
    const [usernameInput, setUsernameInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // 業務狀態與 Wanderlog 式輸入狀態
    const [destination, setDestination] = useState('');
    const [peopleCount, setPeopleCount] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [focusedCoords, setFocusedCoords] = useState(null); // Tracks flyTo coordinates
    const [showPaywall, setShowPaywall] = useState(false);
    const [cardData, setCardData] = useState({ card_number: '', expiry: '', cvv: '' });
    const [loading, setLoading] = useState(false);
    const [itinerary, setItinerary] = useState(null);
    const [checkedActivities, setCheckedActivities] = useState({}); // 用於記錄景點打卡狀態

    // 模擬金流付費與匯出狀態
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // 歷史行程管理狀態與載入控制
    const [savedTrips, setSavedTrips] = useState([]);
    const [showSavedTripsModal, setShowSavedTripsModal] = useState(false);
    const [savedTripsLoading, setSavedTripsLoading] = useState(false);

    // 安全非同步地圖載入狀態，防止 React 因渲染 undefined 組件而崩潰
    const [mapLoaded, setMapLoaded] = useState(false);

    const t = useMemo(() => dictionary[lang], [lang]);

    // 切換語系處理常式，避免渲染中使用 Inline 箭頭函數
    const toggleLanguage = useCallback(() => {
        setLang(prev => prev === 'en' ? 'zh-tw' : 'en');
    }, []);

    // 顯示全域 Toast 微動畫提示
    const showToast = useCallback((message) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage('');
        }, 3000);
    }, []);

    // 取得當前使用者已存行程
    const fetchSavedTrips = useCallback(async () => {
        if (!token) return;
        setSavedTripsLoading(true);
        try {
            const res = await fetch('/api/trips', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedTrips(data);
            }
        } catch (e) {
            console.error("Fetch saved trips failed:", e);
        } finally {
            setSavedTripsLoading(false);
        }
    }, [token]);

    // 一鍵儲存行程到雲端資料庫
    const handleSaveItinerary = useCallback(async () => {
        if (!user) return;
        if (!itinerary) return;
        try {
            const res = await fetch('/api/trips/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    trip_title: itinerary.title || `${itinerary.destination} Bespoke Escape`,
                    itinerary_data: itinerary
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(lang === 'en' ? "Trip saved successfully!" : "行程已成功儲存至雲端！");
                fetchSavedTrips();
            } else {
                alert(data.detail || (lang === 'zh-tw' ? "儲存失敗" : "Save failed"));
            }
        } catch (err) {
            console.error("Save itinerary error:", err);
            alert(lang === 'zh-tw' ? "儲存失敗，請重試" : "Save failed, please try again");
        }
    }, [user, itinerary, token, lang, showToast, fetchSavedTrips]);

    // 登出系統
    const handleLogout = useCallback(() => {
        localStorage.removeItem('loka_token');
        setToken('');
        setUser(null);
        setItinerary(null);
        setCheckedActivities({});
        setErrorMsg('');
    }, []);

    // 取得使用者個人資料
    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                handleLogout();
            }
        } catch (e) {
            handleLogout();
        }
    }, [token, handleLogout]);

    // 初始化時若有 Token 則自動載入使用者狀態與已存行程
    useEffect(() => {
        if (token) {
            fetchUserProfile();
            fetchSavedTrips();
        }
    }, [token, fetchUserProfile, fetchSavedTrips]);

    // 輪詢檢測全域變數 window.MapComponent 是否已被 Babel standalone 解析完成
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.MapComponent) {
                setMapLoaded(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // 載入已儲存行程
    const handleLoadSavedTrip = useCallback((tripData) => {
        if (!tripData) return;
        setItinerary(tripData);
        setCheckedActivities({});
        
        // 同步 UI 輸入欄位
        if (tripData.destination) setDestination(tripData.destination);
        if (tripData.start_date) setStartDate(tripData.start_date);
        if (tripData.end_date) setEndDate(tripData.end_date);
        
        setShowSavedTripsModal(false);
        showToast(lang === 'zh-tw' ? '已成功載入行程！' : 'Itinerary loaded successfully!');
    }, [lang, showToast]);

    // 刪除已儲存行程
    const handleDeleteSavedTrip = useCallback(async (tripId) => {
        const confirmMsg = lang === 'zh-tw' ? '確定要刪除此行程嗎？此動作無法復原。' : 'Are you sure you want to delete this itinerary? This action cannot be undone.';
        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`/api/trips/${tripId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast(lang === 'zh-tw' ? '行程已刪除！' : 'Itinerary deleted!');
                fetchSavedTrips();
            } else {
                alert(lang === 'zh-tw' ? '刪除失敗' : 'Delete failed');
            }
        } catch (e) {
            console.error("Delete trip failed:", e);
            alert(lang === 'zh-tw' ? '刪除行程時發生錯誤' : 'Error deleting trip');
        }
    }, [lang, token, fetchSavedTrips, showToast]);

    // 會員註冊或登入
    const handleAuth = useCallback(async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

        const payload = authMode === 'login'
            ? { username: usernameInput, password: passwordInput }
            : { username: usernameInput, email: emailInput || `${usernameInput}@loka.com`, password: passwordInput };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('loka_token', data.access_token);
                setToken(data.access_token);
                setUser({ username: data.username, is_premium: data.is_premium });
                setUsernameInput('');
                setPasswordInput('');
                setEmailInput('');
            } else {
                setErrorMsg(data.detail || t.errorAuth);
            }
        } catch (err) {
            setErrorMsg(t.errorAuth);
        }
    }, [authMode, usernameInput, emailInput, passwordInput, t]);

    // 升級至 Premium
    const handleUpgrade = useCallback(() => {
        setShowPaywall(true);
    }, []);

    // 模擬付費金流
    const handleSimulatePayment = useCallback(async (e) => {
        e.preventDefault();
        setPaymentLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/payment/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    card_number: cardData.card_number,
                    expiry: cardData.expiry,
                    cvv: cardData.cvv
                })
            });

            const data = await res.json();
            if (res.ok) {
                setUser(prev => ({ ...prev, is_premium: data.is_premium }));
                setShowPaywall(false);
                setCardData({ card_number: '', expiry: '', cvv: '' });
                alert(lang === 'zh-tw' ? '模擬交易成功！您的 LOKA 帳戶已成功解鎖 Premium 尊榮會員資格與匯出工具套件。' : 'Mock transaction successful! Premium privileges unlocked.');
            } else {
                alert(data.detail || (lang === 'zh-tw' ? '模擬金流驗證失敗，信用卡卡號必須為 16 位數字。' : 'Mock gateway verification failed. Card number must be 16 digits.'));
            }
        } catch (err) {
            console.error("Payment error:", err);
            alert(lang === 'zh-tw' ? '模擬金流網關連線異常。' : 'Mock gateway connection error.');
        } finally {
            setPaymentLoading(false);
        }
    }, [token, cardData, lang]);

    // 匯出行程為 PDF (HTML)
    const handleExportPdf = useCallback(() => {
        if (!user || !user.is_premium) {
            setShowPaywall(true);
            return;
        }
        if (!itinerary) return;

        const dest = itinerary.destination;
        const title = `${dest} Bespoke Luxury Escape`;

        let htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                body {
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    background-color: #FFFFFF;
                    color: #0A3B2E;
                    padding: 40px;
                    margin: 0;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid #0A3B2E;
                    padding: 40px;
                    border-radius: 16px;
                }
                .header-section {
                    text-align: center;
                    border-bottom: 2px solid #0A3B2E;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .brand-title {
                    font-size: 32px;
                    font-weight: 900;
                    letter-spacing: 0.15em;
                    margin: 0 0 5px 0;
                }
                .brand-subtitle {
                    font-size: 10px;
                    color: #555;
                    letter-spacing: 0.3em;
                    font-weight: 600;
                    margin: 0;
                    text-transform: uppercase;
                }
                .itinerary-title {
                    font-size: 22px;
                    font-weight: bold;
                    margin: 25px 0 10px 0;
                }
                .meta {
                    font-size: 13px;
                    color: #666;
                    margin-bottom: 30px;
                }
                .logistics-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background-color: #F8FAF9;
                    border-radius: 12px;
                }
                .logistics-card h5 {
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    font-weight: bold;
                }
                .logistics-card p {
                    margin: 0 0 6px 0;
                    font-size: 12px;
                    color: #444;
                }
                .day-block {
                    margin-bottom: 35px;
                    page-break-inside: avoid;
                }
                .day-title {
                    font-size: 16px;
                    font-weight: bold;
                    background-color: #0A3B2E;
                    color: #FFFFFF;
                    padding: 10px 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    letter-spacing: 0.05em;
                }
                .activity-card {
                    border-left: 4px solid #114D3E;
                    padding-left: 20px;
                    margin-bottom: 20px;
                }
                .activity-title {
                    font-weight: bold;
                    font-size: 15px;
                    margin-bottom: 6px;
                }
                .activity-desc {
                    font-size: 13px;
                    color: #444;
                    line-height: 1.6;
                }
                .activity-map {
                    font-size: 11px;
                    color: #114D3E;
                    font-weight: bold;
                    margin-top: 8px;
                }
                .footer {
                    margin-top: 50px;
                    border-top: 1px solid #eee;
                    padding-top: 25px;
                    text-align: center;
                    font-size: 10px;
                    color: #888;
                    letter-spacing: 0.2em;
                }
                @media print {
                    body { padding: 0; margin: 0; }
                    .container { border: none; padding: 20px; }
                    .no-print { display: none !important; }
                }
                @page {
                    size: A4;
                    margin: 15mm;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header-section">
                    <h1 class="brand-title">LOKA</h1>
                    <p class="brand-subtitle">Bespoke Tropical Itinerary Designer</p>
                </div>
                <div class="itinerary-title">${title}</div>
                <div class="meta">
                    <strong>Destination:</strong> ${dest} &bull; 
                    <strong>Date Range:</strong> ${itinerary.start_date} to ${itinerary.end_date}
                </div>
                
                <div class="logistics-section">
                    <div class="logistics-card">
                        <h5>✈️ Flight Recommendation</h5>
                        <p><strong>Carrier:</strong> ${itinerary.flight_logistics?.carrier || "N/A"}</p>
                        <p><strong>Estimated Cost:</strong> ${itinerary.flight_logistics?.estimated_cost || "N/A"}</p>
                    </div>
                    <div class="logistics-card">
                        <h5>🏨 Hotel Recommendation</h5>
                        <p><strong>Name:</strong> ${itinerary.hotel_logistics?.name || "N/A"}</p>
                        <p><strong>Description:</strong> ${itinerary.hotel_logistics?.description || "N/A"}</p>
                    </div>
                </div>
        `;

        itinerary.days.forEach(day => {
            htmlContent += `
                <div class="day-block">
                    <div class="day-title">Day ${day.day}</div>
            `;
            day.places?.forEach(place => {
                htmlContent += `
                    <div class="activity-card">
                        <div class="activity-title">${place.title}</div>
                        <div class="activity-desc">${place.description}</div>
                        <div class="activity-map">📍 Google Maps Query: ${place.maps_search_query}</div>
                    </div>
                `;
            });
            htmlContent += `</div>`;
        });

        htmlContent += `
                <div class="footer">&copy; 2026 LOKA BESPOKE. GENERATED EXCLUSIVELY FOR PREMIUM USERS.</div>
            </div>
        </body>
        </html>
        `;

        // 開啟新視窗讓瀏覽器原生渲染 HTML，再觸發列印對話框 (選擇「另存為 PDF」)
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast(lang === 'zh-tw' ? '請允許彈出視窗以匯出 PDF' : 'Please allow popups to export the PDF');
            return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // 等待資源載入後自動觸發列印
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 400);
        };
        showToast(t.pdfDownloaded);
    }, [user, itinerary, showToast, t]);

    // 複製為 Notion 筆記格式
    const handleCopyNotion = useCallback(() => {
        if (!user || !user.is_premium) {
            setShowPaywall(true);
            return;
        }
        if (!itinerary) return;

        const dest = itinerary.destination;
        let md = `## 🗺️ **${dest} Bespoke Luxury Escape**\n`;
        md += `> **目的地:** \`${dest}\` | **旅行日期:** \`${itinerary.start_date} 至 ${itinerary.end_date}\`\n\n`;

        md += `### 🛩️ **Logistics Matrix / 交通與住宿**\n`;
        md += `- **✈️ 航班規劃:** ${itinerary.flight_logistics?.carrier || "N/A"} (估算花費: \`${itinerary.flight_logistics?.estimated_cost || "N/A"}\`)\n`;
        md += `- **🏨 飯店住宿:** ${itinerary.hotel_logistics?.name || "N/A"} - *${itinerary.hotel_logistics?.description || "N/A"}*\n\n`;

        itinerary.days.forEach(day => {
            md += `### 📅 **第 ${day.day} 天**\n`;
            day.places?.forEach((place, idx) => {
                md += `- [ ] **${place.title}**\n`;
                md += `  - *介紹:* ${place.description}\n`;
                md += `  - *Google 地圖查詢:* \`${place.maps_search_query}\` *(D${day.day}-${idx + 1})*\n`;
            });
            md += `\n`;
        });

        md += `--- \n*Generated exclusively by LOKA Bespoke Luxury Travel Planner*`;

        navigator.clipboard.writeText(md).then(() => {
            showToast(t.notionCopied);
        }).catch(err => {
            console.error("Notion Copy Error:", err);
            alert(lang === 'zh-tw' ? "複製失敗，請手動選取複製。" : "Copy failed, please select manually.");
        });
    }, [user, itinerary, showToast, t, lang]);

    // 處理行程 AI 生成
    const handleGenerate = useCallback(async (e) => {
        e.preventDefault();
        if (!destination.trim() || !startDate || !endDate) return;
        setLoading(true);
        setErrorMsg('');

        const computedDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))) + 1;
        const prompt = `Create a bespoke travel itinerary in ${destination} starting from ${startDate} to ${endDate} for ${peopleCount} travelers (total duration ${computedDays} days). Ensure a luxurious layout.`;

        try {
            const res = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    start_date: startDate,
                    end_date: endDate,
                    people_count: peopleCount
                })
            });

            const data = await res.json();
            if (res.ok) {
                setItinerary(data);
                setCheckedActivities({});
            } else {
                setErrorMsg(data.detail || t.errorGen);
            }
        } catch (err) {
            setErrorMsg(t.errorGen);
        } finally {
            setLoading(false);
        }
    }, [destination, startDate, endDate, peopleCount, token, t]);

    // 載入展示行程
    const handleLoadDemo = useCallback(() => {
        setDestination('Bali');
        setPeopleCount(2);
        setStartDate('2026-07-01');
        setEndDate('2026-07-03');
        setItinerary(defaultBaliItinerary);
        setCheckedActivities({});
    }, []);

    // 打卡景點切換
    const toggleActivityCheck = useCallback((dayNum, actIdx) => {
        const key = `${dayNum}-${actIdx}`;
        setCheckedActivities(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    // 移除景點
    const handleRemovePlace = useCallback((dayIndex, placeIndex) => {
        setItinerary(prev => {
            const newDays = prev.days.map((day, dIdx) => {
                if (dIdx !== dayIndex) return day;
                return { ...day, places: day.places.filter((_, pIdx) => pIdx !== placeIndex) };
            });
            return { ...prev, days: newDays };
        });
        // 清除該景點的打卡狀態
        setCheckedActivities(prev => {
            const updated = { ...prev };
            delete updated[`${dayIndex + 1}-${placeIndex}`];
            return updated;
        });
    }, []);

    // 重新生成單一景點
    const [regeneratingDay, setRegeneratingDay] = useState(null); // dayIndex being regenerated
    const handleSuggestPlace = useCallback(async (dayNum, dayIndex) => {
        if (!itinerary || regeneratingDay !== null) return;
        setRegeneratingDay(dayIndex);
        const existingTitles = itinerary.days[dayIndex].places.map(p => p.title);
        try {
            const res = await fetch('/api/regenerate-place', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    destination: itinerary.destination,
                    day_number: dayNum,
                    existing_titles: existingTitles
                })
            });
            if (res.ok) {
                const newPlace = await res.json();
                setItinerary(prev => {
                    const newDays = prev.days.map((day, dIdx) => {
                        if (dIdx !== dayIndex) return day;
                        return { ...day, places: [...day.places, newPlace] };
                    });
                    return { ...prev, days: newDays };
                });
                showToast(lang === 'zh-tw' ? '已成功新增新景點！' : 'New place added!');
            } else {
                showToast(lang === 'zh-tw' ? '景點生成失敗，請重試。' : 'Failed to generate place, please try again.');
            }
        } catch (e) {
            console.error("Suggest place failed:", e);
            showToast(lang === 'zh-tw' ? '連線錯誤，請重試。' : 'Connection error, please try again.');
        } finally {
            setRegeneratingDay(null);
        }
    }, [itinerary, token, lang, showToast, regeneratingDay]);

    // ---------------------------------------------------------------------------
    // 未登入介面 (毛玻璃奢華登入框)
    // ---------------------------------------------------------------------------
    if (!user) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-between p-6 bg-[#0A3B2E] transition-all duration-500">
                {/* 語言切換按鈕 */}
                <div className="flex justify-end">
                    <button
                        onClick={toggleLanguage}
                        className="px-4 py-1.5 rounded-full border border-white/20 text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all text-white"
                    >
                        {lang === 'en' ? '繁體中文 (ZH-TW)' : 'English (EN)'}
                    </button>
                </div>

                {/* 居中登入框 */}
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 transform scale-100 hover:scale-[1.01] transition-transform duration-300">
                        {/* 奢華品牌 LOGO */}
                        <div className="text-center mb-8">
                            <h1 className="text-8xl font-black mb-4 tracking-[0.2em] text-white">LOKA</h1>
                            <p className="text-base font-medium tracking-wide text-white/70 italic">Helping you uncover the beauty of the world.</p>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-200 text-xs text-center">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">{t.usernameLabel}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t.usernamePlaceholder}
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder-white/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">{t.passwordLabel}</label>
                                <input
                                    type="password"
                                    required
                                    placeholder={t.passwordPlaceholder}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder-white/30"
                                />
                            </div>

                            {authMode === 'register' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter your email address"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder-white/30"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-white text-[#0A3B2E] font-bold rounded-xl shadow-lg hover:bg-[#E2F1ED] active:scale-[0.98] transition-all duration-200"
                            >
                                {authMode === 'login' ? t.login : t.register}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                                    setErrorMsg('');
                                }}
                                className="text-xs text-white/60 hover:text-white transition-colors"
                            >
                                {authMode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 頁尾版權 */}
                <div className="text-center text-white/20 text-[10px] tracking-widest uppercase">
                    &copy; 2026 LOKA BESPOKE. All rights reserved.
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // 登入後主介面 (雙欄奢華工作台)
    // ---------------------------------------------------------------------------
    return (
        <div className="min-h-screen w-full flex flex-col bg-[#0A3B2E]">
            {/* 頂部導航列 (Navbar) */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A3B2E]/50 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-black tracking-[0.2em] text-white">{t.appName}</h2>
                    <span className="text-[10px] border border-white/20 px-2.5 py-0.5 rounded text-white/60 tracking-wider font-semibold">
                        {t.appSubtitle}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-white">
                    {/* 使用者歡迎詞與會員標籤 */}
                    <div className="text-right">
                        <div className="text-xs text-white/70">
                            {t.welcome} <span className="font-bold text-white">{user.username}</span>
                        </div>
                        {user.is_premium ? (
                            <span className="inline-block text-[8px] bg-white text-[#0A3B2E] font-black px-1.5 py-0.5 rounded mt-0.5">
                                {t.premiumBadge}
                            </span>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                className="text-[9px] text-white/95 border border-white/30 hover:border-white hover:bg-white/10 px-2 py-0.5 rounded mt-0.5 transition-all"
                            >
                                {t.upgradeToPremium}
                            </button>
                        )}
                    </div>

                    {/* 語言切換 */}
                    <button
                        onClick={toggleLanguage}
                        className="p-2 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors"
                    >
                        {lang === 'en' ? '繁中' : 'EN'}
                    </button>

                    {/* 我的儲存行程 */}
                    <button
                        onClick={() => {
                            fetchSavedTrips();
                            setShowSavedTripsModal(true);
                        }}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <span>🔖</span>
                        <span>{t.savedTripsBtn}</span>
                    </button>

                    {/* 登出按鈕 */}
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        {t.logout}
                    </button>
                </div>
            </header>

            {/* 雙欄主版面配置：大螢幕下左側行程 65% + 右側地圖 35% (黏性固定) */}
            <main className="w-full flex flex-col lg:flex-row p-6 gap-6 bg-[#0A3B2E] items-start shrink-0">
                {/* 左側面板：Wanderlog 輸入區與行程 Timeline 清單 */}
                <div className="w-full lg:w-[65%] flex flex-col gap-6">
                    {/* Wanderlog 輸入區 (卡片容器化) */}
                    <div className="bg-[#114D3E]/20 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <form onSubmit={handleGenerate} className="space-y-4 bg-white shadow-xl border border-gray-100 rounded-2xl p-6 text-slate-800">
                            {/* 1. Where to go? */}
                            <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                                <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">{t.destLabel}</label>
                                <input
                                    type="text"
                                    required
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="e.g. Bali, Ubud, Seminyak"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:bg-white focus:border-gray-300 transition-all font-bold placeholder-slate-400"
                                />
                            </div>

                            {/* 2. How many people? */}
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">{t.peopleLabel}</label>
                                    <span className="text-slate-500 text-[9px] font-medium">Bespoke traveler count</span>
                                </div>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => setPeopleCount(prev => Math.max(1, prev - 1))}
                                        className="px-2.5 py-1 text-slate-800 hover:bg-gray-100 font-black transition-all text-xs"
                                    >-</button>
                                    <span className="px-3 text-slate-900 font-extrabold text-xs min-w-[20px] text-center">{peopleCount}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPeopleCount(prev => prev + 1)}
                                        className="px-2.5 py-1 text-slate-800 hover:bg-gray-100 font-black transition-all text-xs"
                                    >+</button>
                                </div>
                            </div>

                            {/* 3. Wanderlog 日曆選擇區 */}
                            <div className="flex flex-col gap-2 pt-2">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">{t.durationLabel}</label>
                                    <span className="text-slate-500 text-[9px] font-medium">Wanderlog calendar range</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-[9px] font-bold">{t.startDateLabel}</span>
                                        <input
                                            type="date"
                                            required
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="border border-gray-200 text-gray-900 bg-gray-50 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none transition-all w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-[9px] font-bold">{t.endDateLabel}</span>
                                        <input
                                            type="date"
                                            required
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="border border-gray-200 text-gray-900 bg-gray-50 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none transition-all w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 按鈕組 */}
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-grow py-2.5 bg-[#0A3B2E] hover:bg-[#114D3E] text-white text-xs font-black rounded-lg active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider shadow-md"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>{t.generating}</span>
                                        </>
                                    ) : t.generateBtn}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLoadDemo}
                                    className="px-3.5 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-bold rounded-lg border border-gray-200 active:scale-[0.97] transition-all"
                                >
                                    {t.loadDemoBtn}
                                </button>
                            </div>
                        </form>

                        {errorMsg && (
                            <div className="mt-3 p-2.5 bg-red-950/40 border border-red-500/20 rounded-lg text-red-200 text-[10px] text-center">
                                {errorMsg}
                            </div>
                        )}
                    </div>

                    {/* 當無行程時，左側面板下方顯示提示 */}
                    {!itinerary ? (
                        <div className="bg-[#114D3E]/10 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-center text-center h-48">
                            <p className="text-white/40 text-xs leading-relaxed max-w-[280px]">
                                {t.noItinerary}
                            </p>
                        </div>
                    ) : (
                        /* 行程 Timeline checklist 網格顯示區 - 移回左側面板且寬度更開闊 */
                        <div className="w-full h-auto min-h-[600px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-full mb-2">
                                <h3 className="text-base font-extrabold tracking-wider text-white/90 uppercase">
                                    {t.checklistTitle}
                                </h3>
                            </div>

                            {/* 顯示行程主標題 (白底精緻印刷雜誌風卡片) - 跨滿三欄 */}
                            <div className="col-span-full bg-white shadow-xl border border-gray-100 rounded-2xl p-5 text-slate-800">
                                <h4 className="text-lg font-black text-slate-900 tracking-wide uppercase">
                                    🗺️ {itinerary.destination} BESPOKE ESCAPE
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 font-semibold">
                                    📅 {itinerary.start_date} &mdash; {itinerary.end_date}
                                </p>
                            </div>

                            {/* 🛩️ Logistics Section */}
                            <LogisticsSection itinerary={itinerary} />

                            {/* Day cards */}
                            {itinerary.days.map((day, dayIndex) => (
                                <DayCard
                                    key={day.day}
                                    day={day}
                                    dayIndex={dayIndex}
                                    checkedActivities={checkedActivities}
                                    onToggleCheck={toggleActivityCheck}
                                    onFocus={(coords) => setFocusedCoords(coords)}
                                    onRemove={handleRemovePlace}
                                    onSuggest={handleSuggestPlace}
                                    regeneratingDay={regeneratingDay}
                                    lang={lang}
                                    t={t}
                                />
                            ))}

                            {/* Timeline 下方的 Premium 行動按鈕區 - 跨滿三欄 */}
                            <div className="col-span-full">
                                {user.is_premium ? (
                                    <div className="mt-4 p-5 rounded-2xl bg-[#114D3E]/40 border border-white/20 shadow-lg space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black tracking-widest text-[#E2F1ED] uppercase flex items-center gap-1.5">
                                                💎 {t.paymentTitle}
                                            </h4>
                                            <span className="text-[10px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded tracking-wider">
                                                UNLOCKED
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                onClick={handleExportPdf}
                                                className="py-3 px-4 bg-white text-[#0A3B2E] hover:bg-[#E2F1ED] font-bold text-sm rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <span>{t.exportPdfBtn}</span>
                                            </button>
                                            <button
                                                onClick={handleCopyNotion}
                                                className="py-3 px-4 bg-[#114D3E] hover:bg-[#114D3E]/80 text-white font-bold text-sm rounded-xl border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <span>{t.copyNotionBtn}</span>
                                            </button>
                                            <button
                                                onClick={handleSaveItinerary}
                                                className="py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <span>{t.saveTripBtn}</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setShowPaywall(true)}
                                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wider uppercase border border-white/20"
                                        >
                                            <span>🔒 Export to Notion / PDF Handout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 右側面板：地圖展示與導航 (卡片容器化，Sticky top) */}
                <div className="w-full lg:w-[35%] lg:sticky lg:top-6 h-[500px] lg:h-[calc(100vh-120px)] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#114D3E]/20 shrink-0">
                    {/* 安全檢測防護：當 window.MapComponent 載入完成後才進行渲染 */}
                    {mapLoaded && window.MapComponent ? (
                        <window.MapComponent
                            itinerary={itinerary}
                            lang={lang}
                            focusedCoords={focusedCoords}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white/40 border border-none bg-transparent">
                            <span className="animate-pulse">Loading Luxury Map Canvas...</span>
                        </div>
                    )}
                </div>
            </main>

            {/* Paywall Modal */}
            {showPaywall && (
                <PaywallModal
                    onClose={() => setShowPaywall(false)}
                    onSubmit={handleSimulatePayment}
                    cardData={cardData}
                    setCardData={setCardData}
                    paymentLoading={paymentLoading}
                    t={t}
                />
            )}

            {/* Saved Trips Modal */}
            {showSavedTripsModal && (
                <SavedTripsModal
                    onClose={() => setShowSavedTripsModal(false)}
                    loading={savedTripsLoading}
                    trips={savedTrips}
                    onLoad={handleLoadSavedTrip}
                    onDelete={handleDeleteSavedTrip}
                    t={t}
                />
            )}

            {/* 奢華 Toast 微動畫提示 */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[10001] bg-white text-[#0A3B2E] border border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

// 掛載並啟動 React App
const rootInstance = ReactDOM.createRoot(document.getElementById('root'));
rootInstance.render(<App />);
