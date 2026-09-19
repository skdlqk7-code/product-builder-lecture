// ==========================================
// AI Animal Face Classifier (Teachable Machine)
// ==========================================
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/3CAvzZ5dQ/";

let model = null;
let isModelLoading = false;

// Preload Teachable Machine Model
async function loadAnimalModel() {
    if (model || isModelLoading) return model;
    isModelLoading = true;
    try {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Teachable Machine Animal Model loaded successfully!");
        return model;
    } catch (error) {
        console.error("Failed to load Teachable Machine model:", error);
        showToast("AI 모델을 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.");
        return null;
    } finally {
        isModelLoading = false;
    }
}

// Animal Classification Results Data
const ANIMAL_INFO = {
    dog: {
        badge: "🐶 사랑스러운 강아지상",
        title: "다정하고 사랑스러운 멍뭉미!",
        subtitle: "보는 순간 무장해제! 누구에게나 호감을 주는 최고의 친화력",
        tags: ["#선한눈매", "#친근함", "#애교만점", "#비타민에너지", "#멍뭉미", "#무장해제미소", "#배려심"],
        desc: "따뜻하고 다정한 눈빛과 서글서글한 인상으로 주변 사람들을 편안하고 행복하게 만들어주는 강아지상입니다. 밝고 긍정적인 에너지를 지니고 있어 친구나 동료들에게 늘 인기가 많으며, 애교 넘치고 배려심이 깊어 깊은 신뢰감을 줍니다. 웃을 때 반달눈이 되거나 입꼬리가 시원하게 올라가는 것이 가장 큰 매력 포인트입니다!",
        celebs: "박보검, 송중기, 정해인, 박보영, 츄, 아이유, 백현, 강다니엘 등"
    },
    cat: {
        badge: "🐱 도도하고 매력적인 고양이상",
        title: "도도하고 치명적인 분위기 장인!",
        subtitle: "시크한 첫인상 뒤에 숨겨진 치명적인 반전 매력의 소유자",
        tags: ["#시크도도", "#치명적매력", "#분위기장인", "#세련된눈매", "#반전매력", "#츤데레", "#신비주의"],
        desc: "매혹적이고 날렵한 눈매와 세련된 페이스 라인으로 신비로운 아우라를 자아내는 고양이상입니다. 첫인상은 쿨하고 도도해 보여 쉽게 다가가기 어려울 수 있지만, 한번 친해지면 숨겨왔던 반전 애교와 섬세함으로 상대방을 완전히 매료시키는 치명적인 매력을 가지고 있습니다. 조용히 바라보는 눈빛만으로도 시선을 사로잡는 분위기 미남/미녀입니다!",
        celebs: "강동원, 이준기, 제니, 예지(ITZY), 안소희, 한소희, 시우민, 뷔(BTS) 등"
    }
};

// UI Elements
const dropZone = document.getElementById("dropZone");
const imageUpload = document.getElementById("imageUpload");
const uploadBtn = document.getElementById("uploadBtn");
const resultCard = document.getElementById("resultCard");
const previewImage = document.getElementById("previewImage");
const scanningLine = document.getElementById("scanningLine");
const loadingStatus = document.getElementById("loadingStatus");
const loadingText = document.getElementById("loadingText");
const resultDetails = document.getElementById("resultDetails");

const resultBadge = document.getElementById("resultBadge");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const resultTags = document.getElementById("resultTags");
const resultDesc = document.getElementById("resultDesc");
const resultCelebs = document.getElementById("resultCelebs");

const dogBar = document.getElementById("dogBar");
const dogPercent = document.getElementById("dogPercent");
const catBar = document.getElementById("catBar");
const catPercent = document.getElementById("catPercent");

const retryBtn = document.getElementById("retryBtn");
const shareBtn = document.getElementById("shareBtn");
const toast = document.getElementById("toast");

// Toast Notification
function showToast(message, duration = 3000) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

// Drag & Drop Handlers
if (dropZone && imageUpload && uploadBtn) {
    uploadBtn.addEventListener("click", () => {
        imageUpload.click();
    });

    dropZone.addEventListener("click", (e) => {
        if (e.target !== uploadBtn && !uploadBtn.contains(e.target)) {
            imageUpload.click();
        }
    });

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("dragover");
        });
    });

    ["dragleave", "dragend", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("dragover");
        });
    });

    dropZone.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });

    imageUpload.addEventListener("change", (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });
}

// Process Image File
function handleSelectedFile(file) {
    if (!file.type.startsWith("image/")) {
        showToast("이미지 파일(JPG, PNG, WEBP 등)만 업로드할 수 있습니다.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        startClassification(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Start AI Classification
async function startClassification(imageSrc) {
    // Hide dropzone, show result container
    dropZone.style.display = "none";
    resultCard.style.display = "block";
    resultDetails.style.display = "none";
    loadingStatus.style.display = "flex";
    if (scanningLine) scanningLine.style.display = "block";

    previewImage.src = imageSrc;

    // Loading status animation texts
    if (loadingText) loadingText.textContent = "AI 모델 준비 중...";

    // Ensure model is ready
    let loadedModel = model;
    if (!loadedModel) {
        loadedModel = await loadAnimalModel();
    }

    if (!loadedModel) {
        showToast("AI 모델을 불러오지 못했습니다. 다시 시도해주세요.");
        resetTest();
        return;
    }

    if (loadingText) loadingText.textContent = "얼굴 특징 랜드마크 분석 중...";

    previewImage.onload = async () => {
        try {
            if (loadingText) loadingText.textContent = "강아지상 vs 고양이상 확률 계산 중...";
            
            // Artificial tiny delay for premium smooth UX
            await new Promise(r => setTimeout(r, 600));

            const predictions = await loadedModel.predict(previewImage);
            renderResults(predictions);
        } catch (error) {
            console.error("Prediction error:", error);
            showToast("이미지 분석 중 오류가 발생했습니다. 다른 사진으로 시도해주세요.");
            resetTest();
        }
    };
}

// Render Classification Results
function renderResults(predictions) {
    let dogScore = 0;
    let catScore = 0;

    predictions.forEach(p => {
        const name = p.className.toLowerCase();
        if (name.includes("강아지") || name.includes("dog")) {
            dogScore = p.probability;
        } else if (name.includes("고양이") || name.includes("cat")) {
            catScore = p.probability;
        }
    });

    // Fallback if class names differed
    if (dogScore === 0 && catScore === 0 && predictions.length >= 2) {
        dogScore = predictions[0].probability;
        catScore = predictions[1].probability;
    }

    const dogPct = Math.round(dogScore * 100);
    const catPct = Math.round(catScore * 100);

    const isDogWinner = dogScore >= catScore;
    const animalKey = isDogWinner ? "dog" : "cat";
    const data = ANIMAL_INFO[animalKey];

    // Populate UI
    if (resultBadge) {
        resultBadge.textContent = data.badge;
        resultBadge.className = `result-badge ${animalKey}-badge`;
    }
    if (resultTitle) resultTitle.textContent = data.title;
    if (resultSubtitle) resultSubtitle.textContent = data.subtitle;
    if (resultDesc) resultDesc.textContent = data.desc;
    if (resultCelebs) resultCelebs.textContent = data.celebs;

    // Tags
    if (resultTags) {
        resultTags.innerHTML = "";
        data.tags.forEach(tag => {
            const span = document.createElement("span");
            span.className = "tag-pill";
            span.textContent = tag;
            resultTags.appendChild(span);
        });
    }

    // Probability Bars
    if (dogPercent) dogPercent.textContent = `${dogPct}%`;
    if (catPercent) catPercent.textContent = `${catPct}%`;

    // Hide loading, show details
    if (scanningLine) scanningLine.style.display = "none";
    loadingStatus.style.display = "none";
    resultDetails.style.display = "block";

    // Trigger bar fill animation
    setTimeout(() => {
        if (dogBar) dogBar.style.width = `${dogPct}%`;
        if (catBar) catBar.style.width = `${catPct}%`;
    }, 100);
}

// Reset / Retry
function resetTest() {
    if (imageUpload) imageUpload.value = "";
    if (previewImage) previewImage.src = "";
    if (dogBar) dogBar.style.width = "0%";
    if (catBar) catBar.style.width = "0%";
    if (resultCard) resultCard.style.display = "none";
    if (dropZone) dropZone.style.display = "flex";
    window.scrollTo({ top: dropZone.offsetTop - 100, behavior: "smooth" });
}

if (retryBtn) {
    retryBtn.addEventListener("click", resetTest);
}

// Share Button
if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
        const shareData = {
            title: "AI 동물상 테스트 | 강아지상 vs 고양이상",
            text: "인공지능이 분석한 내 얼굴의 동물상은? 지금 바로 무료로 테스트해보세요!",
            url: window.location.href
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.log("Share failed, falling back to clipboard:", err);
                } else {
                    return;
                }
            }
        }

        // Clipboard fallback
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("🔗 결과 링크가 클립보드에 복사되었습니다!");
        } catch (e) {
            // Older browser fallback
            const input = document.createElement("input");
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            showToast("🔗 결과 링크가 클립보드에 복사되었습니다!");
        }
    });
}

// Theme Switching
function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const themeLabel = document.getElementById("themeLabel");
    const themeIcon = themeToggle ? themeToggle.querySelector(".theme-icon") : null;

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);

        const isDark = theme === "dark";
        if (themeLabel) {
            themeLabel.textContent = isDark ? "라이트모드" : "다크모드";
        }
        if (themeIcon) {
            themeIcon.textContent = isDark ? "☀️" : "🌙";
        }
        if (themeToggle) {
            const label = isDark ? "라이트모드로 전환" : "다크모드로 전환";
            themeToggle.setAttribute("aria-label", label);
            themeToggle.setAttribute("title", label);
        }

        // Reset Disqus to adapt to new theme colors
        if (window.DISQUS && typeof window.DISQUS.reset === "function") {
            try {
                window.DISQUS.reset({ reload: true });
            } catch (e) {
                // Ignore if Disqus is still loading
            }
        }
    }

    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "light";
            const next = current === "dark" ? "light" : "dark";
            applyTheme(next);
        });
    }

    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            if (!localStorage.getItem("theme")) {
                applyTheme(e.matches ? "dark" : "light");
            }
        });
    }
}

// Formspree Partnership Inquiry
function initPartnershipForm() {
    const form = document.getElementById("partnershipForm");
    if (!form) return;

    const submitBtn = document.getElementById("contactSubmitBtn");
    const formStatus = document.getElementById("formStatus");
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
    const btnSpinner = submitBtn ? submitBtn.querySelector(".btn-spinner") : null;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (btnText && btnSpinner) {
            btnText.style.display = "none";
            btnSpinner.style.display = "inline";
        }
        if (formStatus) {
            formStatus.className = "form-status show loading";
            formStatus.textContent = "문의를 전송하는 중입니다...";
        }

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: "POST",
                body: formData,
                headers: {
                    "Accept": "application/json"
                }
            });

            if (response.ok) {
                form.reset();
                if (formStatus) {
                    formStatus.className = "form-status show success";
                    formStatus.textContent = "✅ 제휴 문의가 성공적으로 접수되었습니다. 담당자 검토 후 신속히 연락드리겠습니다.";
                }
            } else {
                const data = await response.json().catch(() => null);
                let errMsg = "전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                if (data && data.errors && data.errors.length > 0) {
                    errMsg = data.errors.map(err => err.message).join(", ");
                }
                if (formStatus) {
                    formStatus.className = "form-status show error";
                    formStatus.textContent = `❌ ${errMsg}`;
                }
            }
        } catch (error) {
            console.error("Formspree submit error:", error);
            if (formStatus) {
                formStatus.className = "form-status show error";
                formStatus.textContent = "❌ 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (btnText && btnSpinner) {
                btnText.style.display = "inline";
                btnSpinner.style.display = "none";
            }
        }
    });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initPartnershipForm();
    loadAnimalModel(); // Start preloading Teachable Machine model
});
