// js/core/GallerySystem.js
// 進階圖文展示系統 - 支援橫向滑動相簿與分頁詳細視窗

const GallerySystem = {
    // 狀態
    isActive: false,
    currentGallery: null,
    currentIndex: 0,
    swiper: null,
    initialized: false,
    
    // DOM 元素
    overlay: null,
    detailOverlay: null,
    
    // 暫存遊戲點擊事件
    savedGameClickHandler: null,
    
    // 初始化
    init: function() {
        if (this.initialized) {
            console.log('🖼️ GallerySystem 已初始化，跳過');
            return;
        }
        
        console.log('🖼️ GallerySystem 初始化');
        this.createDOM();
        this.bindEvents();
        this.initialized = true;
    },
    
    // 建立 DOM 結構
    createDOM: function() {
        // 檢查是否已存在
        if (document.querySelector('.gallery-overlay')) {
            this.overlay = document.querySelector('.gallery-overlay');
            this.detailOverlay = document.querySelector('.detail-overlay');
            return;
        }
        
        // ✅ 獲取 game-wrapper 作為父容器
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) {
            console.error('❌ 找不到 #game-wrapper');
            return;
        }
        
        // 第一層：相簿遮罩 - 加到 game-wrapper 內（移除左右按鈕）
        this.overlay = document.createElement('div');
        this.overlay.className = 'gallery-overlay';
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = `
            <div class="gallery-container">
                <button class="gallery-close-btn">✕</button>
                <!-- ❌ 移除左右按鈕 -->
                <div class="gallery-swiper swiper-container">
                    <div class="swiper-wrapper" id="gallery-swiper-wrapper"></div>
                </div>
                <div class="gallery-pagination" id="gallery-pagination"></div>
            </div>
        `;
        gameWrapper.appendChild(this.overlay);
        
        // 第二層：分頁詳細彈窗 - 也加到 game-wrapper
        this.detailOverlay = document.createElement('div');
        this.detailOverlay.className = 'detail-overlay';
        this.detailOverlay.style.display = 'none';
        this.detailOverlay.innerHTML = `
            <div class="detail-container">
                <div class="detail-tabs">
                    <button class="detail-tab active" data-tab="image">📷 圖片與摘要</button>
                    <button class="detail-tab" data-tab="story">📖 詳細故事</button>
                </div>
                <div class="detail-content" id="detail-content"></div>
                <button class="detail-close-btn">關閉</button>
            </div>
        `;
        gameWrapper.appendChild(this.detailOverlay);
        
        console.log('✅ GallerySystem DOM 建立完成（在 game-wrapper 內）');
    },
    
    // 綁定事件
    bindEvents: function() {
        if (!this.overlay) return;
        
        // 關閉相簿
        const closeBtn = this.overlay.querySelector('.gallery-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // 導航按鈕
        const prevBtn = this.overlay.querySelector('.gallery-nav-prev');
        const nextBtn = this.overlay.querySelector('.gallery-nav-next');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.swiper?.slidePrev();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.swiper?.slideNext();
            });
        }
        
        // 點擊遮罩關閉
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        
        // 分頁視窗事件
        if (this.detailOverlay) {
            const tabs = this.detailOverlay.querySelectorAll('.detail-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetTab = e.currentTarget.dataset.tab;
                    this.switchDetailTab(targetTab);
                });
            });
            
            const detailCloseBtn = this.detailOverlay.querySelector('.detail-close-btn');
            if (detailCloseBtn) {
                detailCloseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeDetail();
                });
            }
            
            this.detailOverlay.addEventListener('click', (e) => {
                if (e.target === this.detailOverlay) this.closeDetail();
            });
        }
    },
    
    // 開啟相簿
    open: function(galleryData, startIndex = 0) {
        console.log('🖼️ 開啟相簿:', galleryData);
        
        if (!galleryData || galleryData.length === 0) {
            console.warn('⚠️ 相簿資料為空');
            return;
        }
        
        this.currentGallery = galleryData;
        this.currentIndex = startIndex;
        this.isActive = true;
        
        // 暫停對話系統的點擊換頁
        if (window.DialogueSystem && window.DialogueSystem.gameContainer) {
            this.savedGameClickHandler = window.DialogueSystem.gameContainer.onclick;
            window.DialogueSystem.gameContainer.onclick = null;
        }
        
        // 顯示遮罩
        this.overlay.style.display = 'flex';
        this.overlay.classList.add('active');
        
        // 建立 Swiper 內容
        this.buildSwiperContent();
        
        // 初始化 Swiper
        setTimeout(() => {
            this.initSwiper();
        }, 100);
    },
    
    // 初始化 Swiper
    initSwiper: function() {
        if (this.swiper) {
            this.swiper.destroy(true, true);
            this.swiper = null;
        }
        
        if (typeof Swiper === 'undefined') {
            console.error('❌ Swiper 未載入');
            return;
        }
        
        const swiperEl = this.overlay.querySelector('.gallery-swiper');
        if (!swiperEl) return;
        
        const paginationEl = this.overlay.querySelector('.gallery-pagination');
        
        this.swiper = new Swiper(swiperEl, {
            initialSlide: this.currentIndex,
            loop: false,
            navigation: false,
            slidesPerView: 'auto',      // ✅ auto，讓 Swiper 自己計算
            centeredSlides: true,       // ✅ 居中
            spaceBetween: 15,
            keyboard: { enabled: true },
            pagination: {
                el: paginationEl,
                clickable: true,
                dynamicBullets: false,
            },
            on: {
                slideChange: () => {
                    if (this.swiper) {
                        this.currentIndex = this.swiper.activeIndex;
                        this.updateSlidesScale();
                    }
                },
                init: () => {
                    setTimeout(() => {
                        if (this.swiper) {
                            this.swiper.update();
                            this.updateSlidesScale();
                        }
                    }, 50);
                }
            }
        });
        
        console.log('✅ Swiper 初始化完成');
    },

    // 手動更新幻燈片縮放 - 不破壞 translate3d
    updateSlidesScale: function() {
        if (!this.swiper) return;
        
        const slides = this.swiper.slides;
        const activeIndex = this.swiper.activeIndex;
        
        slides.forEach((slide, index) => {
            const distance = Math.abs(index - activeIndex);
            
            // 重置
            slide.style.transform = '';
            slide.style.opacity = '';
            slide.style.zIndex = '';
            
            if (distance === 0) {
                // ✅ 只 scale，不覆蓋 Swiper 的 translate3d
                slide.style.transform = 'scale(1.2)';
                slide.style.transformOrigin = 'center center';
                slide.style.opacity = '1';
                slide.style.zIndex = '10';
            } else if (distance === 1) {
                slide.style.transform = 'scale(0.85)';
                slide.style.transformOrigin = 'center center';
                slide.style.opacity = '0.7';
                slide.style.zIndex = '5';
            } else {
                slide.style.transform = 'scale(0.7)';
                slide.style.transformOrigin = 'center center';
                slide.style.opacity = '0.4';
                slide.style.zIndex = '1';
            }
            
            slide.style.transition = 'all 0.3s ease';
        });
    },
    
    // 建立 Swiper 內容
    buildSwiperContent: function() {
        const swiperWrapper = document.getElementById('gallery-swiper-wrapper');
        if (!swiperWrapper) {
            console.error('❌ 找不到 gallery-swiper-wrapper');
            return;
        }
        
        swiperWrapper.innerHTML = '';
        
        this.currentGallery.forEach((item, idx) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `
                <div class="slide-image">
                    <img src="${item.thumb}" alt="${item.title}" data-index="${idx}">
                </div>
                <div>${item.title}</div>
            `;
            
            // ✅ 只有點擊正中間的圖片才能開啟詳細資訊
            const img = slide.querySelector('img');
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.swiper && this.swiper.activeIndex === idx) {
                    console.log('✅ 點擊中間圖片，開啟詳細資訊');
                    this.openDetail(idx);
                } else {
                    // 不在中間，滑動過去
                    console.log(`🔄 滑動到第 ${idx + 1} 張卡片`);
                    this.swiper.slideTo(idx, 300);  // 300ms 動畫滑動
                }
            });
            
            swiperWrapper.appendChild(slide);
        });
        
        console.log(`✅ 建立了 ${this.currentGallery.length} 個幻燈片`);
    },

    // 綁定事件
    bindEvents: function() {
        if (!this.overlay) return;
        
        // 關閉相簿 - 只有按按鈕才能關閉
        const closeBtn = this.overlay.querySelector('.gallery-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // ❌ 移除左右按鈕的事件綁定
        
        // 分頁視窗事件
        if (this.detailOverlay) {
            const tabs = this.detailOverlay.querySelectorAll('.detail-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetTab = e.currentTarget.dataset.tab;
                    this.switchDetailTab(targetTab);
                });
            });
            
            const detailCloseBtn = this.detailOverlay.querySelector('.detail-close-btn');
            if (detailCloseBtn) {
                detailCloseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeDetail();
                });
            }
        }
    },
    
    // 開啟詳細視窗
    openDetail: function(index) {
        const item = this.currentGallery[index];
        if (!item) return;
        
        console.log('📖 開啟詳細視窗:', item.title);
        
        this.updateDetailContent(item);
        this.switchDetailTab('image');
        this.detailOverlay.style.display = 'flex';
        this.detailOverlay.classList.add('active');
    },
    
    // 更新詳細視窗內容
    updateDetailContent: function(item) {
        const detailContent = document.getElementById('detail-content');
        if (!detailContent) return;
        
        detailContent.innerHTML = `
            <div id="tab-image-area" class="tab-image-area">
                <img src="${item.fullImage}" alt="${item.title}">
                <h3 class="tab-title">${item.title}</h3>
                <p class="tab-summary">${item.summary}</p>
            </div>
            <div id="tab-story" class="tab-story" style="display: none;">
                ${item.story.replace(/\n/g, '<br>')}
            </div>
        `;
    },
    
    // 切換分頁
    switchDetailTab: function(tabName) {
        const tabImageArea = document.getElementById('tab-image-area');
        const tabStory = document.getElementById('tab-story');
        const tabs = this.detailOverlay.querySelectorAll('.detail-tab');
        
        tabs.forEach(tab => {
            if ((tabName === 'image' && tab.dataset.tab === 'image') ||
                (tabName === 'story' && tab.dataset.tab === 'story')) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        if (tabName === 'image') {
            if (tabImageArea) tabImageArea.style.display = 'block';
            if (tabStory) tabStory.style.display = 'none';
        } else {
            if (tabImageArea) tabImageArea.style.display = 'none';
            if (tabStory) tabStory.style.display = 'block';
        }
    },
    
    // 關閉詳細視窗
    closeDetail: function() {
        if (this.detailOverlay) {
            this.detailOverlay.style.display = 'none';
            this.detailOverlay.classList.remove('active');
        }
    },
    
    // 關閉整個相簿
    close: function() {
        console.log('🖼️ 關閉相簿');
        
        this.isActive = false;
        if (this.overlay) {
            this.overlay.style.display = 'none';
            this.overlay.classList.remove('active');
        }
        this.closeDetail();
        
        // 恢復對話系統的點擊換頁
        if (window.DialogueSystem && window.DialogueSystem.gameContainer) {
            window.DialogueSystem.gameContainer.onclick = this.savedGameClickHandler;
            this.savedGameClickHandler = null;
        }
        
        // 銷毀 Swiper
        if (this.swiper) {
            this.swiper.destroy(true, true);
            this.swiper = null;
        }
    }
};

window.GallerySystem = GallerySystem;