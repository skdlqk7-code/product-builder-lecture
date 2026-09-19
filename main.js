function generateNumbers() {
    let numbers = [];

    while (numbers.length < 6) {
        let number = Math.floor(Math.random() * 45) + 1;

        if (!numbers.includes(number)) {
            numbers.push(number);
        }
    }

    numbers.sort(function(a, b) {
        return a - b;
    });

    return numbers;
}

function getBallColor(number) {
    if (number <= 10) {
        return "yellow";
    }

    if (number <= 20) {
        return "blue";
    }

    if (number <= 30) {
        return "red";
    }

    if (number <= 40) {
        return "gray";
    }

    return "green";
}

function renderAnalysisChart() {
    const analysisChart = document.getElementById("analysisChart");
    if (!analysisChart) return;

    const distribution = {
        "01~10": [12, 74],
        "11~20": [8, 43],
        "21~30": [11, 66],
        "31~40": [10, 58],
        "41~45": [4, 21]
    };

    analysisChart.innerHTML = "";

    Object.entries(distribution).forEach(([label, [count, percent]]) => {
        const row = document.createElement("div");
        row.className = "chart-row";

        const labelSpan = document.createElement("span");
        labelSpan.className = "chart-label";
        labelSpan.textContent = label;

        const track = document.createElement("span");
        track.className = "chart-track";

        const bar = document.createElement("span");
        bar.className = "chart-bar";
        bar.style.width = percent + "%";

        track.appendChild(bar);

        const countSpan = document.createElement("span");
        countSpan.className = "chart-count";
        countSpan.textContent = count;

        row.appendChild(labelSpan);
        row.appendChild(track);
        row.appendChild(countSpan);

        analysisChart.appendChild(row);
    });
}

function renderHistoryRows() {
    const rows = [
        { round: 1047, date: "2026.09.11", numbers: [5, 15, 24, 31, 39, 42], bonus: 7, prize: "1등 18명" },
        { round: 1046, date: "2026.09.08", numbers: [2, 11, 19, 27, 34, 37], bonus: 12, prize: "1등 24명" },
        { round: 1045, date: "2026.09.04", numbers: [3, 10, 16, 22, 33, 44], bonus: 38, prize: "1등 12명" }
    ];

    const historyRows = document.getElementById("historyRows");
    if (!historyRows) return;

    historyRows.innerHTML = "";

    rows.forEach((item) => {
        const row = document.createElement("div");
        row.className = "history-row";

        const round = document.createElement("span");
        round.className = "history-round";
        round.textContent = item.round + "회";

        const date = document.createElement("span");
        date.className = "history-date";
        date.textContent = item.date;

        const numbers = document.createElement("span");
        numbers.className = "history-numbers";
        numbers.textContent = item.numbers.concat(item.bonus).map((n) => String(n).padStart(2, "0")).join(" ");

        const prize = document.createElement("span");
        prize.className = "history-prize";
        prize.textContent = item.prize;

        row.appendChild(round);
        row.appendChild(date);
        row.appendChild(numbers);
        row.appendChild(prize);

        historyRows.appendChild(row);
    });
}

function recommendLotto() {
    const results = document.getElementById("results");
    if (!results) return;

    results.innerHTML = "";

    for (let game = 1; game <= 5; game++) {
        const numbers = generateNumbers();
        const card = document.createElement("div");
        card.className = "lotto-card";

        const title = document.createElement("div");
        title.className = "game-title";
        title.textContent = game + "게임";
        card.appendChild(title);

        const numberArea = document.createElement("div");
        numberArea.className = "numbers";

        numbers.forEach(function(number) {
            const ball = document.createElement("div");
            ball.className = "ball " + getBallColor(number);
            ball.textContent = number;
            numberArea.appendChild(ball);
        });

        let bonus;
        do {
            bonus = Math.floor(Math.random() * 45) + 1;
        } while (numbers.includes(bonus));

        const plus = document.createElement("div");
        plus.className = "plus";
        plus.textContent = "+";
        numberArea.appendChild(plus);

        const bonusBall = document.createElement("div");
        bonusBall.className = "ball " + getBallColor(bonus);
        bonusBall.textContent = bonus;
        numberArea.appendChild(bonusBall);

        card.appendChild(numberArea);

        const bonusText = document.createElement("div");
        bonusText.className = "bonus";
        bonusText.textContent = "보너스 번호";
        card.appendChild(bonusText);

        results.appendChild(card);
    }
}

const recommendButton = document.getElementById("recommendBtn");
const shuffleButton = document.getElementById("shuffleBtn");
const googleLoginButton = document.getElementById("googleLoginBtn");
const loginStatus = document.getElementById("loginStatus");

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

function setLoginStatus(message, isError = false) {
    if (!loginStatus) return;

    loginStatus.textContent = message;
    loginStatus.style.color = isError ? "#d93b3b" : "#3ca66a";
}

function handleGoogleCredentialResponse(response) {
    if (!response?.credential) {
        setLoginStatus("구글 로그인에 실패했습니다. 다시 시도해 주세요.", true);
        return;
    }

    try {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        setLoginStatus(`${payload.name ?? "사용자"}님, 구글 로그인 성공!`);
        console.log("Google user info:", payload);
    } catch (error) {
        console.error("Failed to parse Google credential:", error);
        setLoginStatus("로그인 정보를 확인하는 중 오류가 발생했습니다.", true);
    }
}

function initGoogleLogin() {
    if (!googleLoginButton) return;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_")) {
        googleLoginButton.addEventListener("click", () => {
            setLoginStatus("Google Client ID를 설정해야 구글 로그인이 연결됩니다.", true);
        });
        return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        googleLoginButton.addEventListener("click", () => {
            setLoginStatus("Google 로그인 스크립트가 아직 로드되지 않았습니다.", true);
        });
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse
    });

    googleLoginButton.addEventListener("click", () => {
        window.google.accounts.id.prompt();
    });
}

if (recommendButton) {
    recommendButton.addEventListener("click", recommendLotto);
}

if (shuffleButton) {
    shuffleButton.addEventListener("click", recommendLotto);
}

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

initTheme();
initGoogleLogin();
initPartnershipForm();

renderAnalysisChart();
renderHistoryRows();
recommendLotto();
