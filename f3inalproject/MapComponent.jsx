const { useState, useEffect, useRef } = React;

/**
 * LOKA Leaflet 地圖元件
 * 整合 OSRM 真實路線 API 與 Freemium 訂閱牆 (Paywall)
 */
const MapComponent = ({ itinerary, lang, focusedCoords }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const routeLayersRef = useRef([]);
    const markerLayersRef = useRef([]);

    // 多語系字典定義
    const translations = {
        en: {
            premiumTitle: "LOKA Premium Map Navigation",
            premiumDesc: "Unlock OSRM real-world driving paths, interactive routing, and precision turn-by-turn road tracking in Bali.",
            upgradeBtn: "Unlock Premium Access",
            cost: "Cost: "
        },
        'zh-tw': {
            premiumTitle: "LOKA 尊榮地圖導航",
            premiumDesc: "升級解鎖 OSRM 真實道路駕駛路徑規劃、互動式路由追蹤及巴里島精準路線導航。",
            upgradeBtn: "立即解鎖 Premium 權限",
            cost: "預估花費："
        }
    };

    const t = translations[lang] || translations['en'];

    // ---------------------------------------------------------------------------
    // 初始化地圖實體
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!mapInstance.current && mapRef.current) {
            // 巴里島中心經緯度 [-8.4095, 115.1889]，預設縮放 10
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([-8.4095, 115.1889], 10);

            // 引入 CartoDB Voyager 無標籤輕量地圖圖磚，完美呼應熱帶海島氛圍
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19
            }).addTo(mapInstance.current);

            // 自訂 Zoom 按鈕至右下角，保持介面簡潔
            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
        }
    }, []);

    // ---------------------------------------------------------------------------
    // 監聽外部 focusedCoords 的變化以執行平滑 flyTo 動態對焦
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (mapInstance.current && focusedCoords) {
            mapInstance.current.flyTo(focusedCoords, 14, {
                animate: true,
                duration: 1.2
            });
        }
    }, [focusedCoords]);

    // ---------------------------------------------------------------------------
    // 行程地標與真實道路路線渲染
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!mapInstance.current || !itinerary) return;

        // 清理所有既存的 Marker 與 Route 圖層
        routeLayersRef.current.forEach(layer => mapInstance.current.removeLayer(layer));
        markerLayersRef.current.forEach(layer => mapInstance.current.removeLayer(layer));
        routeLayersRef.current = [];
        markerLayersRef.current = [];

        // 扁平化行程中的所有活動景點
        const allActivities = [];
        itinerary.days.forEach(day => {
            day.places?.forEach((act, actIdx) => {
                allActivities.push({
                    ...act,
                    dayNum: day.day,
                    index: actIdx + 1
                });
            });
        });

        if (allActivities.length === 0) return;

        const bounds = L.latLngBounds();

        // 1. 繪製景點 Marker 點
        allActivities.forEach(act => {
            const latlng = [act.latitude, act.longitude];
            bounds.extend(latlng);

            // 採用純 HTML+Tailwind 的 DivIcon 解決傳統圖片丟失 bug，並呼應奢華暗綠色調
            const icon = L.divIcon({
                html: `<div class="w-8 h-8 rounded-full bg-white text-[#0A3B2E] border-2 border-[#0A3B2E] font-extrabold flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">
                         ${act.dayNum}-${act.index}
                       </div>`,
                className: 'custom-loka-marker-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const popupContent = `
                <div class="p-3 text-[#0A3B2E] font-sans">
                    <div class="font-extrabold text-sm border-b border-gray-100 pb-1 mb-1">${act.title}</div>
                    <div class="text-xs text-gray-500 leading-relaxed">${act.description}</div>
                </div>
            `;

            const marker = L.marker(latlng, { icon })
                .bindPopup(popupContent)
                .addTo(mapInstance.current);

            markerLayersRef.current.push(marker);
        });

        // 自動聚焦調整視角以貼合所有標記點
        mapInstance.current.fitBounds(bounds, { padding: [60, 60] });

        // 2. 請求 OSRM 真實行車道路路徑 (地圖與 OSRM 真實道路導航現在對所有使用者 100% 免費)
        if (allActivities.length >= 2) {
            // 拼接經緯度格式為 lng,lat;lng,lat;... 以供 OSRM 多點導航使用
            const coordsString = allActivities.map(act => `${act.longitude},${act.latitude}`).join(';');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

            fetch(osrmUrl)
                .then(res => res.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const routeGeoJSON = data.routes[0].geometry;
                        
                        // 底層粗發光深綠道路線
                        const outerRoute = L.geoJSON(routeGeoJSON, {
                            style: {
                                color: '#114D3E',
                                weight: 6,
                                opacity: 0.7,
                                lineJoin: 'round'
                            }
                        }).addTo(mapInstance.current);

                        // 頂層細白核心高光線，建構出極客精品線條感
                        const innerRoute = L.geoJSON(routeGeoJSON, {
                            style: {
                                color: '#FFFFFF',
                                weight: 3,
                                opacity: 1,
                                lineJoin: 'round'
                            }
                        }).addTo(mapInstance.current);

                        routeLayersRef.current.push(outerRoute, innerRoute);
                    }
                })
                .catch(err => {
                    console.error("OSRM API 請求失敗，改為繪製虛線備份: ", err);
                    const latlngs = allActivities.map(act => [act.latitude, act.longitude]);
                    const fallbackLine = L.polyline(latlngs, {
                        color: '#FFFFFF',
                        weight: 3,
                        dashArray: '5, 8',
                        opacity: 0.8
                    }).addTo(mapInstance.current);
                    routeLayersRef.current.push(fallbackLine);
                });
        }
    }, [itinerary, lang]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Leaflet 地圖掛載點 */}
            <div id="map" ref={mapRef} className="w-full h-full z-10"></div>

            {/* 地圖元件現在對全體使用者免費，不再顯示 Premium 覆蓋層 */}
        </div>
    );
};

// 掛載至 window 全域命名空間以供 App.jsx 存取
window.MapComponent = MapComponent;
