// ==========================================
// AI Animal Face Classifier (Teachable Machine)
// ==========================================
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/3CAvzZ5dQ/";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

let model = null;
let modelLoadingPromise = null;
let classificationRun = 0;

// Load the model on demand when the user starts a test
async function loadAnimalModel() {
    if (model) return model;
    if (modelLoadingPromise) return modelLoadingPromise;

    modelLoadingPromise = (async () => {
        try {
            const modelURL = MODEL_URL + "model.json";
            const metadataURL = MODEL_URL + "metadata.json";
            model = await tmImage.load(modelURL, metadataURL);
            console.log("Teachable Machine Animal Model loaded successfully!");
            return model;
        } catch (error) {
            console.error("Failed to load Teachable Machine model:", error);
            return null;
        } finally {
            modelLoadingPromise = null;
        }
    })();

    return modelLoadingPromise;
}

// Animal Classification Results Data
const ANIMAL_INFO = {
    dog: {
        badge: "🐶 강아지 클래스",
        title: "강아지 클래스 점수가 더 높아요",
        subtitle: "선택한 이미지에 대해 모델이 강아지 클래스에 더 높은 점수를 부여했습니다.",
        tags: ["이미지 분류 결과", "재미·참고용", "정확도 보증 아님"],
        desc: "이 결과는 사진 속 얼굴의 특징이나 인물의 성격을 설명하지 않습니다. 강아지·고양이 두 분류로 구성된 이미지 모델의 출력값을 보여주는 오락용 결과입니다."
    },
    cat: {
        badge: "🐱 고양이 클래스",
        title: "고양이 클래스 점수가 더 높아요",
        subtitle: "선택한 이미지에 대해 모델이 고양이 클래스에 더 높은 점수를 부여했습니다.",
        tags: ["이미지 분류 결과", "재미·참고용", "정확도 보증 아님"],
        desc: "이 결과는 사진 속 얼굴의 특징이나 인물의 성격을 설명하지 않습니다. 강아지·고양이 두 분류로 구성된 이미지 모델의 출력값을 보여주는 오락용 결과입니다."
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
        if (imageUpload) imageUpload.value = "";
        return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
        showToast("이미지 파일은 10MB 이하만 사용할 수 있습니다.");
        if (imageUpload) imageUpload.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (typeof e.target.result === "string") {
            startClassification(e.target.result);
        } else {
            showToast("이미지를 읽지 못했습니다. 다른 파일로 다시 시도해주세요.");
        }
    };
    reader.onerror = () => showToast("이미지를 읽지 못했습니다. 다른 파일로 다시 시도해주세요.");
    reader.readAsDataURL(file);
}

// Start AI Classification
async function startClassification(imageSrc) {
    const currentRun = ++classificationRun;

    // Hide dropzone, show result container
    dropZone.style.display = "none";
    resultCard.style.display = "block";
    resultDetails.style.display = "none";
    loadingStatus.style.display = "flex";
    if (scanningLine) scanningLine.style.display = "block";

    previewImage.onload = async () => {
        try {
            if (loadingText) loadingText.textContent = "AI 이미지 분류 모델 준비 중...";
            const loadedModel = model || await loadAnimalModel();
            if (currentRun !== classificationRun) return;
            if (!loadedModel) {
                showToast("AI 모델을 불러오지 못했습니다. 다시 시도해주세요.");
                resetTest();
                return;
            }

            if (loadingText) loadingText.textContent = "선택한 이미지를 분류하고 있습니다...";
            await new Promise(r => setTimeout(r, 600));

            const predictions = await loadedModel.predict(previewImage);
            if (currentRun === classificationRun) renderResults(predictions);
        } catch (error) {
            console.error("Prediction error:", error);
            showToast("이미지 분석 중 오류가 발생했습니다. 다른 사진으로 시도해주세요.");
            if (currentRun === classificationRun) resetTest();
        }
    };
    previewImage.onerror = () => {
        showToast("이미지를 표시하지 못했습니다. 다른 파일로 다시 시도해주세요.");
        if (currentRun === classificationRun) resetTest();
    };
    previewImage.src = imageSrc;
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
    classificationRun++;
    if (imageUpload) imageUpload.value = "";
    if (previewImage) {
        previewImage.onload = null;
        previewImage.onerror = null;
        previewImage.src = "";
    }
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
            text: "이미지 분류 모델은 내 사진에 어떤 점수를 냈을까요? 무료로 확인해보세요!",
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
                    formStatus.textContent = "✅ 문의가 접수되었습니다. 입력한 이메일로 답변드리겠습니다.";
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
});
